/* Carrusel con lente de vidrio — La Foto Tienda
 *
 * Dos pasadas con Three.js y cámara ortográfica:
 *  1) La tira plana de imágenes se dibuja en un WebGLRenderTarget con margen
 *     (.44 × ancho/alto de la vista por cada lado).
 *  2) Un quad de pantalla completa muestrea ese render target y aplica una
 *     lente elíptica inclinada con dispersión RGB en el borde.
 * Si WebGL no está disponible queda la tira estática del HTML.
 */

const instances = new WeakMap();

const PAD = 0.44;
const CARD_ASPECT = 1.509;
const EASE = 0.09;
const FRICTION = 0.865;
const SNAP_IDLE_MS = 120;
const DRIFT_IDLE_MS = 1800;
const DRIFT_PX = 0.48;
const SHRINK_MAX = 0.07;
const SHRINK_SPEED = 60;
const MAX_DPR = 1.75;
const MAX_TARGET_PIXELS = 7_000_000;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeOut = (t) => 1 - Math.pow(1 - clamp01(t), 3);
const frameLerp = (k, f) => 1 - Math.pow(1 - k, f);
const mod = (a, n) => ((a % n) + n) % n;

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D tField;
  uniform vec2 uRes;
  uniform vec2 uPad;
  uniform float uLens;
  uniform float uWide;
  varying vec2 vUv;

  vec3 field(vec2 uv) {
    vec2 st = (uv * uRes + uPad) / (uRes + 2.0 * uPad);
    return texture2D(tField, st).rgb;
  }

  float gauss(float t, float c) {
    float d = t - c;
    return exp(-(d * d) / (2.0 * 0.38 * 0.38));
  }

  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 p = vUv - 0.5;
    p.x *= aspect;

    // Coordenadas de la lente giradas 65° en sentido horario
    float a = radians(65.0);
    float ca = cos(a);
    float sa = sin(a);
    vec2 q = vec2(p.x * ca + p.y * sa, -p.x * sa + p.y * ca);

    vec2 n = q / (vec2(0.565, 1.0) * uWide);
    float d = length(n);

    float influence = 1.0 - smoothstep(0.93, 1.0, d);
    float rim = smoothstep(0.578, 1.0, d);

    vec2 dir = length(p) > 1e-5 ? normalize(p) : vec2(1.0, 0.0);
    vec2 tangent = vec2(-dir.y, dir.x);
    float azimuth = atan(n.y, n.x);
    float weight = 0.55 * sin(2.0 * azimuth) + 0.25 * sin(azimuth);
    float magnitude = weight * rim * 0.6 * min(d, 0.7825) * influence * uLens;

    vec2 offsetAspect = tangent * magnitude;
    vec2 offset = vec2(offsetAspect.x / aspect, offsetAspect.y);
    vec2 base = vUv + offset;
    float spread = smoothstep(0.55, 1.0, d);

    // Donde la dispersión total es menor a medio píxel basta una muestra
    vec2 spreadPx = offset * (11.0 * 0.004) * spread * uRes;
    if (dot(spreadPx, spreadPx) < 0.25) {
      gl_FragColor = vec4(field(base), 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      return;
    }

    vec3 acc = vec3(0.0);
    vec3 total = vec3(0.0);
    for (int i = 0; i < 12; i++) {
      float t = float(i) / 11.0;
      vec2 uv = base + offset * (float(i) * 0.004) * spread;
      vec3 w = vec3(gauss(t, 0.0), gauss(t, 0.5), gauss(t, 1.0));
      acc += field(uv) * w;
      total += w;
    }

    gl_FragColor = vec4(acc / total, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

class LensCarousel {
  constructor(root, THREE, covers) {
    this.root = root;
    this.THREE = THREE;
    this.covers = covers;
    this.stage = root.querySelector('.lens-carousel__stage');
    this.reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reduced = this.reducedQuery.matches;

    this.pos = 0;
    this.target = 0;
    this.velocity = 0;
    this.shrink = 0;
    this.dragging = false;
    this.hover = false;
    this.focused = false;
    this.pendingSnap = false;
    this.lastInput = 0;
    this.lastInteract = performance.now();
    this.entryStart = 0;
    this.entryDone = this.reduced;

    this.docVisible = !document.hidden;
    this.onScreen = false;
    this.active = true;
    this.raf = 0;
    this.lastFrame = 0;
    this.destroyed = false;
    this.cards = [];
    this.copies = 0;

    this.initRenderer();
    this.initScenes();
    this.loadTextures();
    this.bindEvents();
    this.resize();
    root.classList.add('is-webgl');
    this.update();
  }

  // ---------------------------------------------------------------- Setup
  initRenderer() {
    const { THREE } = this;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'lens-carousel__canvas';
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('role', 'region');
    this.canvas.setAttribute('aria-roledescription', 'carrusel');
    this.canvas.setAttribute('aria-label', `${this.root.getAttribute('aria-label') || ''}. Usa las flechas izquierda y derecha para explorar.`);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    });
    if (!this.renderer.getContext()) throw new Error('WebGL no disponible');
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.stage.appendChild(this.canvas);
  }

  initScenes() {
    const { THREE } = this;
    this.stripScene = new THREE.Scene();
    this.stripScene.background = new THREE.Color('#121212');
    this.stripCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
    this.cardGeometry = new THREE.PlaneGeometry(1, 1);

    this.target3 = new THREE.WebGLRenderTarget(2, 2, {
      type: THREE.HalfFloatType,
      depthBuffer: false,
      generateMipmaps: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });

    this.lensMaterial = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        tField: { value: this.target3.texture },
        uRes: { value: new THREE.Vector2(1, 1) },
        uPad: { value: new THREE.Vector2(0, 0) },
        uLens: { value: this.reduced ? 1 : 0 },
        uWide: { value: 1 },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.quadGeometry = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(this.quadGeometry, this.lensMaterial);
    this.quadScene = new THREE.Scene();
    this.quadScene.add(this.quad);
    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  loadTextures() {
    const { THREE } = this;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.materials = this.covers.map((cover) => {
      const material = new THREE.MeshBasicMaterial({ color: 0x1e1e1e });
      loader.load(cover.src, (texture) => {
        if (this.destroyed) { texture.dispose(); return; }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(4, maxAniso);
        // Recorte tipo "cover": conserva la proporción de la imagen
        const imgAspect = texture.image.width / texture.image.height;
        if (imgAspect > CARD_ASPECT) {
          texture.repeat.set(CARD_ASPECT / imgAspect, 1);
          texture.offset.set((1 - texture.repeat.x) / 2, 0);
        } else {
          texture.repeat.set(1, imgAspect / CARD_ASPECT);
          texture.offset.set(0, (1 - texture.repeat.y) / 2);
        }
        material.map = texture;
        material.color.set(0xffffff);
        material.needsUpdate = true;
        this.renderOnce();
      });
      return material;
    });
  }

  buildCards(copies) {
    if (copies === this.copies) return;
    this.cards.forEach((mesh) => this.stripScene.remove(mesh));
    this.cards = [];
    for (let c = 0; c < copies; c++) {
      this.covers.forEach((cover, i) => {
        const mesh = new this.THREE.Mesh(this.cardGeometry, this.materials[i]);
        mesh.userData.cover = cover;
        this.stripScene.add(mesh);
        this.cards.push(mesh);
      });
    }
    this.copies = copies;
  }

  // --------------------------------------------------------------- Layout
  resize() {
    const vw = Math.max(1, this.stage.clientWidth);
    const vh = Math.max(1, this.stage.clientHeight);
    const mobile = window.innerWidth < 750;
    this.vw = vw;
    this.vh = vh;
    this.cardW = mobile ? window.innerWidth * 0.64 : Math.min(window.innerWidth * 0.205, 470);
    this.gap = mobile ? 10 : 14;
    this.cardH = this.cardW / CARD_ASPECT;
    const oldStep = this.step || 0;
    this.step = this.cardW + this.gap;
    if (oldStep) {
      const ratio = this.step / oldStep;
      this.pos *= ratio;
      this.target *= ratio;
    }

    this.padX = PAD * vw;
    this.padY = PAD * vh;
    this.fieldW = vw + 2 * this.padX;
    this.fieldH = vh + 2 * this.padY;

    // Tres copias como mínimo, y las necesarias para llenar el campo con margen
    const listLength = this.covers.length * this.step;
    const copies = Math.max(3, Math.ceil((this.fieldW + 2 * this.step) / listLength));
    this.buildCards(copies);
    this.loopLength = this.cards.length * this.step;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(vw, vh, false);

    let tw = this.fieldW * dpr;
    let th = this.fieldH * dpr;
    const scale = Math.min(1, Math.sqrt(MAX_TARGET_PIXELS / (tw * th)));
    tw = Math.max(2, Math.round(tw * scale));
    th = Math.max(2, Math.round(th * scale));
    this.target3.setSize(tw, th);

    const cam = this.stripCamera;
    cam.left = -this.fieldW / 2;
    cam.right = this.fieldW / 2;
    cam.top = this.fieldH / 2;
    cam.bottom = -this.fieldH / 2;
    cam.updateProjectionMatrix();

    const u = this.lensMaterial.uniforms;
    u.uRes.value.set(vw, vh);
    u.uPad.value.set(this.padX, this.padY);
    u.uWide.value = Math.max(1, (vw / vh) / (1440 / 1028));

    this.renderOnce();
  }

  layoutCards(now) {
    const t = this.entryDone ? Infinity : (now - this.entryStart) / 1000;
    const grow = this.entryDone ? 1 : easeOut((t - 0.55) / 0.6);
    const scale = 1 - this.shrink;
    const half = this.loopLength / 2;
    for (let j = 0; j < this.cards.length; j++) {
      const mesh = this.cards[j];
      const x = mod(j * this.step - this.pos + half, this.loopLength) - half;
      let y = 0;
      if (!this.entryDone) {
        // Subida escalonada desde abajo, según la posición en pantalla
        const delay = clamp01((x + this.fieldW / 2) / this.fieldW) * 0.35;
        y = -(1 - easeOut((t - delay) / 0.6)) * this.vh * 0.75;
      }
      mesh.position.set(x, y, 0);
      mesh.scale.set(this.cardW * scale, this.cardH * scale * (0.55 + 0.45 * grow), 1);
    }
    if (!this.entryDone) {
      this.lensMaterial.uniforms.uLens.value = easeOut((t - 0.95) / 0.7);
      if (t > 1.7) {
        this.entryDone = true;
        this.lensMaterial.uniforms.uLens.value = 1;
        this.lastInteract = now;
      }
    }
  }

  render() {
    const r = this.renderer;
    r.setRenderTarget(this.target3);
    r.render(this.stripScene, this.stripCamera);
    r.setRenderTarget(null);
    r.render(this.quadScene, this.quadCamera);
  }

  renderOnce() {
    if (this.destroyed || this.raf) return;
    this.layoutCards(performance.now());
    this.render();
  }

  // ----------------------------------------------------------------- Loop
  tick = (now) => {
    this.raf = 0;
    if (!this.running()) return;
    const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    const f = dt * 60;

    if (!this.reduced) {
      // Inercia tras soltar
      if (!this.dragging && Math.abs(this.velocity) > 0.02) {
        this.target += this.velocity * f;
        this.velocity *= Math.pow(FRICTION, f);
        this.lastInput = now;
      }
      // Deriva suave en reposo
      const idle = now - this.lastInteract > DRIFT_IDLE_MS;
      if (this.entryDone && idle && !this.dragging && !this.hover && !this.focused && !this.pendingSnap) {
        this.target += DRIFT_PX * f;
      }
    }

    // Ajuste a la tarjeta más cercana tras 120 ms sin movimiento
    if (this.pendingSnap && !this.dragging && Math.abs(this.velocity) <= 0.02 && now - this.lastInput > SNAP_IDLE_MS) {
      this.target = Math.round(this.target / this.step) * this.step;
      this.pendingSnap = false;
      this.lastInteract = now;
    }

    const prev = this.pos;
    this.pos = this.reduced ? this.target : this.pos + (this.target - this.pos) * frameLerp(EASE, f);
    const speed = Math.abs(this.pos - prev) / Math.max(f, 1e-3);
    const shrinkGoal = this.reduced ? 0 : Math.min(1, speed / SHRINK_SPEED) * SHRINK_MAX;
    const k = shrinkGoal > this.shrink ? 0.25 : 0.06;
    this.shrink += (shrinkGoal - this.shrink) * frameLerp(k, f);

    this.layoutCards(now);
    this.render();
    this.raf = requestAnimationFrame(this.tick);
  };

  running() {
    return !this.destroyed && this.docVisible && this.onScreen && this.active;
  }

  update() {
    if (this.running()) {
      if (!this.raf) {
        if (!this.entryStart) this.entryStart = performance.now();
        this.lastFrame = performance.now();
        this.raf = requestAnimationFrame(this.tick);
      }
    } else if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  // --------------------------------------------------------------- Input
  bindEvents() {
    const c = this.canvas;
    this.listeners = [];
    const on = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      this.listeners.push(() => target.removeEventListener(type, fn, opts));
    };

    on(c, 'pointerdown', (e) => {
      if (e.button !== 0) return;
      c.setPointerCapture(e.pointerId);
      this.dragging = true;
      this.pointerId = e.pointerId;
      this.lastX = e.clientX;
      this.lastT = e.timeStamp;
      this.moved = 0;
      this.velocity = 0;
      this.dragVelocity = 0;
      this.lastInteract = performance.now();
    });
    on(c, 'pointermove', (e) => {
      if (!this.dragging || e.pointerId !== this.pointerId) return;
      const dx = e.clientX - this.lastX;
      const frames = Math.max((e.timeStamp - this.lastT) / (1000 / 60), 0.5);
      this.lastX = e.clientX;
      this.lastT = e.timeStamp;
      this.moved += Math.abs(dx);
      this.target -= dx;
      if (this.reduced) this.pos = this.target;
      this.dragVelocity = this.dragVelocity * 0.6 + (-dx / frames) * 0.4;
      this.lastInteract = performance.now();
      if (!this.raf) this.renderOnce();
    });
    const endDrag = (e, cancelled) => {
      if (!this.dragging || (e && e.pointerId !== this.pointerId)) return;
      this.dragging = false;
      if (c.hasPointerCapture?.(this.pointerId)) c.releasePointerCapture(this.pointerId);
      const now = performance.now();
      if (!cancelled && this.moved < 6 && e) this.openCardAt(e);
      // Si el puntero se quedó quieto antes de soltar, no hay impulso
      const stale = e && e.timeStamp - this.lastT > 80;
      this.velocity = this.reduced || cancelled || stale ? 0 : Math.max(-80, Math.min(80, this.dragVelocity || 0));
      this.pendingSnap = true;
      this.lastInput = now;
      this.lastInteract = now;
      if (this.reduced) { this.snapNow(); }
    };
    on(c, 'pointerup', (e) => endDrag(e, false));
    on(c, 'pointercancel', (e) => endDrag(e, true));
    on(c, 'lostpointercapture', (e) => endDrag(e, true));

    on(c, 'wheel', (e) => {
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? this.vw : 1;
      const dx = e.deltaX * unit;
      const dy = e.deltaY * unit;
      let delta = 0;
      // Horizontal siempre; vertical solo con el carrusel enfocado (no secuestra el scroll de la página)
      if (Math.abs(dx) > Math.abs(dy)) delta = dx;
      else if (document.activeElement === c) delta = dy;
      if (!delta) return;
      e.preventDefault();
      this.velocity = 0;
      this.target += delta;
      if (this.reduced) this.pos = this.target;
      this.pendingSnap = true;
      const now = performance.now();
      this.lastInput = now;
      this.lastInteract = now;
      if (this.reduced) this.snapNow();
    }, { passive: false });

    on(c, 'keydown', (e) => {
      let handled = true;
      const base = Math.round(this.target / this.step) * this.step;
      if (e.key === 'ArrowRight') this.target = base + this.step;
      else if (e.key === 'ArrowLeft') this.target = base - this.step;
      else if (e.key === 'Home') this.target = 0;
      else if (e.key === 'Enter') { this.openCenter(); }
      else handled = false;
      if (!handled) return;
      e.preventDefault();
      this.velocity = 0;
      this.pendingSnap = false;
      this.lastInteract = performance.now();
      if (this.reduced) { this.pos = this.target; this.renderOnce(); }
    });

    on(c, 'pointerenter', () => { this.hover = true; });
    on(c, 'pointerleave', () => { this.hover = false; this.lastInteract = performance.now(); });
    on(c, 'focus', () => { this.focused = true; });
    on(c, 'blur', () => { this.focused = false; this.lastInteract = performance.now(); });

    on(document, 'visibilitychange', () => { this.docVisible = !document.hidden; this.update(); });
    on(window, 'message', (e) => {
      // Solo la página que contiene a esta (iframe del mismo origen) puede pausar el carrusel
      if (window.parent === window || e.source !== window.parent || e.origin !== window.location.origin) return;
      if (e.data && typeof e.data.active === 'boolean') {
        this.active = e.data.active;
        this.update();
      }
    });
    const onMotion = () => {
      this.reduced = this.reducedQuery.matches;
      if (this.reduced) {
        this.entryDone = true;
        this.velocity = 0;
        this.lensMaterial.uniforms.uLens.value = 1;
        this.pos = this.target;
      }
    };
    on(this.reducedQuery, 'change', onMotion);

    this.io = new IntersectionObserver((entries) => {
      this.onScreen = entries.some((en) => en.isIntersecting);
      this.update();
    }, { rootMargin: '100px 0px' });
    this.io.observe(this.root);

    let pending = 0;
    this.ro = new ResizeObserver(() => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => { if (!this.destroyed) this.resize(); });
    });
    this.ro.observe(this.stage);

    on(c, 'webglcontextlost', (e) => {
      e.preventDefault();
      this.destroy();
    });
  }

  snapNow() {
    this.target = Math.round(this.target / this.step) * this.step;
    this.pos = this.target;
    this.pendingSnap = false;
    this.renderOnce();
  }

  cardAt(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left - rect.width / 2;
    const y = rect.height / 2 - (clientY - rect.top);
    return this.cards.find((m) => Math.abs(m.position.x - x) <= m.scale.x / 2 && Math.abs(m.position.y - y) <= m.scale.y / 2);
  }

  openCardAt(e) {
    const card = this.cardAt(e.clientX, e.clientY);
    const url = card?.userData.cover.url;
    if (url) window.location.href = url;
  }

  openCenter() {
    const rect = this.canvas.getBoundingClientRect();
    const card = this.cardAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
    const url = card?.userData.cover.url;
    if (url) window.location.href = url;
  }

  // ------------------------------------------------------------ Teardown
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.listeners.forEach((off) => off());
    this.io?.disconnect();
    this.ro?.disconnect();
    this.cards.forEach((m) => this.stripScene.remove(m));
    this.materials.forEach((m) => { m.map?.dispose(); m.dispose(); });
    this.cardGeometry.dispose();
    this.quadGeometry.dispose();
    this.lensMaterial.dispose();
    this.target3.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
    this.root.classList.remove('is-webgl');
    instances.delete(this.root);
  }
}

// ------------------------------------------------------------------ Arranque
function readCovers(root) {
  try {
    const raw = JSON.parse(root.querySelector('[data-lens-covers]')?.textContent || '[]');
    return raw.filter((c) => c && c.src);
  } catch (e) {
    return [];
  }
}

function boot(root) {
  if (instances.has(root)) return;
  const covers = readCovers(root);
  if (!covers.length) return;
  instances.set(root, 'pending');

  // Cargar Three.js solo cuando la sección está cerca de verse
  const io = new IntersectionObserver(async (entries) => {
    if (!entries.some((en) => en.isIntersecting)) return;
    io.disconnect();
    try {
      const THREE = await import(root.dataset.threeSrc);
      if (instances.get(root) !== 'pending') return;
      instances.set(root, new LensCarousel(root, THREE, covers));
    } catch (error) {
      instances.delete(root);
      console.warn('Carrusel con lente: se usa la versión estática.', error);
    }
  }, { rootMargin: '300px 0px' });
  io.observe(root);
}

function bootAll(scope = document) {
  scope.querySelectorAll('[data-lens-carousel]').forEach(boot);
}

bootAll();
document.addEventListener('shopify:section:load', (e) => bootAll(e.target));
document.addEventListener('shopify:section:unload', (e) => {
  e.target.querySelectorAll('[data-lens-carousel]').forEach((root) => {
    const inst = instances.get(root);
    if (inst && inst !== 'pending') inst.destroy();
    instances.delete(root);
  });
});

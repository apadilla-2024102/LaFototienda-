/* La Foto Tienda — JavaScript del tema (sin dependencias) */
(() => {
  'use strict';

  const theme = window.theme || { routes: {}, strings: {} };
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------------------------------------------------------------------
     Cajones (menú móvil, carrito, filtros)
     --------------------------------------------------------------------- */
  let lastFocused = null;

  function openDrawer(drawer) {
    if (!drawer) return;
    lastFocused = document.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');
    const focusTarget = $('[data-drawer-close]', drawer) || drawer;
    setTimeout(() => focusTarget.focus(), 50);
  }

  function closeDrawer(drawer) {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
    if (lastFocused) lastFocused.focus();
  }

  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-drawer-open]');
    if (opener) {
      const drawer = document.getElementById(opener.dataset.drawerOpen);
      if (drawer) {
        event.preventDefault();
        openDrawer(drawer);
      }
      return;
    }
    const closer = event.target.closest('[data-drawer-close]');
    if (closer) {
      event.preventDefault();
      closeDrawer(closer.closest('.drawer, .filters'));
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    $$('.drawer.is-open').forEach(closeDrawer);
    $$('.filters.is-open').forEach((f) => f.classList.remove('is-open'));
  });

  /* ---------------------------------------------------------------------
     Header: sombra al hacer scroll y buscador móvil
     --------------------------------------------------------------------- */
  const header = $('[data-site-header]');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-search-toggle]');
    if (!toggle) return;
    const panel = document.getElementById(toggle.getAttribute('aria-controls'));
    if (!panel) return;
    const open = panel.hasAttribute('hidden');
    panel.toggleAttribute('hidden', !open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) $('input', panel)?.focus();
  });

  /* ---------------------------------------------------------------------
     Animación de aparición al hacer scroll
     --------------------------------------------------------------------- */
  function initReveal(root = document) {
    const items = $$('[data-reveal]:not(.is-revealed)', root);
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-revealed'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach((el) => {
      const siblings = el.parentElement ? Array.from(el.parentElement.parentElement?.children || []) : [];
      const index = siblings.indexOf(el.parentElement);
      if (index > 0 && index < 6) el.style.setProperty('--reveal-delay', `${index * 0.08}s`);
      observer.observe(el);
    });
  }

  /* ---------------------------------------------------------------------
     Slideshow (hero)
     --------------------------------------------------------------------- */
  function initSlideshow(root) {
    if (root.dataset.ready) return;
    root.dataset.ready = 'true';
    const track = $('[data-slideshow-track]', root);
    const slides = $$('[data-slide]', root);
    const dots = $$('[data-slide-dot]', root);
    if (!track || slides.length === 0) return;
    let current = 0;
    let timer = null;
    const autoplay = root.dataset.autoplay === 'true' && slides.length > 1;
    const speed = (parseInt(root.dataset.speed, 10) || 6) * 1000;

    const setActive = (index) => {
      current = index;
      slides.forEach((s, i) => {
        s.classList.toggle('is-active', i === index);
        s.setAttribute('aria-hidden', i === index ? 'false' : 'true');
        $$('a, button', s).forEach((el) => (el.tabIndex = i === index ? 0 : -1));
      });
      dots.forEach((d, i) => d.setAttribute('aria-current', i === index ? 'true' : 'false'));
    };

    const goTo = (index) => {
      const i = (index + slides.length) % slides.length;
      track.scrollTo({ left: slides[i].offsetLeft, behavior: 'smooth' });
      setActive(i);
    };

    const start = () => {
      if (!autoplay) return;
      stop();
      timer = setInterval(() => goTo(current + 1), speed);
    };
    const stop = () => timer && clearInterval(timer);

    $('[data-slide-prev]', root)?.addEventListener('click', () => { goTo(current - 1); start(); });
    $('[data-slide-next]', root)?.addEventListener('click', () => { goTo(current + 1); start(); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); start(); }));

    let scrollTimeout;
    track.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const i = Math.round(track.scrollLeft / track.clientWidth);
        if (i !== current && slides[i]) setActive(i);
      }, 80);
    }, { passive: true });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    setActive(0);
    start();
  }

  /* ---------------------------------------------------------------------
     Selectores de cantidad
     --------------------------------------------------------------------- */
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-qty-change]');
    if (!btn) return;
    const input = $('input', btn.closest('.quantity'));
    if (!input) return;
    const step = parseInt(btn.dataset.qtyChange, 10);
    const min = parseInt(input.min || '0', 10);
    const max = input.max ? parseInt(input.max, 10) : Infinity;
    const next = Math.min(max, Math.max(min, (parseInt(input.value, 10) || 0) + step));
    if (next === parseInt(input.value, 10)) return;
    input.value = next;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* ---------------------------------------------------------------------
     Carrito (AJAX + cajón lateral)
     --------------------------------------------------------------------- */
  const cartDrawerId = 'CartDrawer';

  function updateCartCount(count) {
    $$('[data-cart-count]').forEach((el) => {
      el.textContent = count;
      el.hidden = count === 0;
      el.classList.remove('is-bumped');
      void el.offsetWidth;
      el.classList.add('is-bumped');
    });
  }

  function renderCartDrawer(html) {
    const drawer = document.getElementById(cartDrawerId);
    if (!drawer || !html) return;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const fresh = $('[data-cart-drawer-content]', doc);
    const current = $('[data-cart-drawer-content]', drawer);
    if (fresh && current) {
      current.replaceWith(fresh);
      const count = parseInt(fresh.dataset.cartItemCount, 10);
      if (!Number.isNaN(count)) updateCartCount(count);
    }
  }

  async function cartRequest(url, body) {
    const response = await fetch(url, {
      method: 'POST',
      headers: body instanceof FormData ? { Accept: 'application/json' } : { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok || data.status) throw new Error(data.description || data.message || theme.strings.cartError);
    return data;
  }

  const drawerEnabled = () => theme.cartType === 'drawer' && document.getElementById(cartDrawerId);

  // Agregar al carrito
  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-product-form]');
    if (!form || !drawerEnabled()) return;
    // "Comprar ahora" envía el formulario normalmente y Shopify redirige al checkout
    if (event.submitter && event.submitter.name === 'return_to') return;
    event.preventDefault();

    const button = event.submitter || $('[type="submit"]', form);
    const errorEl = $('[data-form-error]', form.closest('[data-product-section]') || form);
    if (errorEl) errorEl.textContent = '';
    button?.classList.add('is-loading');
    button?.setAttribute('aria-disabled', 'true');

    const formData = new FormData(form);
    formData.append('sections', 'cart-drawer');
    formData.append('sections_url', window.location.pathname);

    try {
      const data = await cartRequest(`${theme.routes.cartAdd}.js`, formData);
      renderCartDrawer(data.sections && data.sections['cart-drawer']);
      openDrawer(document.getElementById(cartDrawerId));
    } catch (error) {
      if (errorEl) errorEl.textContent = error.message;
      else alert(error.message);
    } finally {
      button?.classList.remove('is-loading');
      button?.removeAttribute('aria-disabled');
    }
  });

  // Abrir el cajón desde el ícono del carrito
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-cart-link]');
    if (!link || !drawerEnabled()) return;
    event.preventDefault();
    openDrawer(document.getElementById(cartDrawerId));
  });

  async function changeLine(line, quantity) {
    const drawer = document.getElementById(cartDrawerId);
    const body = $('.drawer__body', drawer);
    body?.classList.add('is-loading');
    try {
      const data = await cartRequest(`${theme.routes.cartChange}.js`, {
        line,
        quantity,
        sections: ['cart-drawer'],
        sections_url: window.location.pathname
      });
      renderCartDrawer(data.sections && data.sections['cart-drawer']);
    } catch (error) {
      alert(error.message);
      body?.classList.remove('is-loading');
    }
  }

  document.addEventListener('change', (event) => {
    const input = event.target.closest('[data-cart-drawer] [data-line]');
    if (!input) return;
    changeLine(parseInt(input.dataset.line, 10), parseInt(input.value, 10) || 0);
  });

  document.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-cart-drawer] [data-remove-line]');
    if (!remove) return;
    event.preventDefault();
    changeLine(parseInt(remove.dataset.removeLine, 10), 0);
  });

  // Página del carrito: actualizar al cambiar cantidad
  document.addEventListener('change', (event) => {
    const input = event.target.closest('[data-cart-page] input[name="updates[]"]');
    if (!input) return;
    clearTimeout(input._t);
    input._t = setTimeout(() => input.form.submit(), 400);
  });

  /* ---------------------------------------------------------------------
     Página de producto: variantes, galería y pestañas
     --------------------------------------------------------------------- */
  function initProduct(section) {
    if (section.dataset.ready) return;
    section.dataset.ready = 'true';
    const sectionId = section.dataset.sectionId;
    const productUrl = section.dataset.productUrl;
    const picker = $('[data-variant-picker]', section);
    const variantsJson = $('[data-variants-json]', section);
    const variants = variantsJson ? JSON.parse(variantsJson.textContent) : [];

    // Galería
    const mainGallery = $('[data-gallery-main]', section);
    const thumbs = $$('[data-gallery-thumb]', section);
    const slides = $$('[data-media-id]', mainGallery || section);

    const showMedia = (mediaId, smooth = true) => {
      const slide = slides.find((s) => s.dataset.mediaId === String(mediaId));
      if (!slide || !mainGallery) return;
      mainGallery.scrollTo({ left: slide.offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
      thumbs.forEach((t) => t.setAttribute('aria-current', t.dataset.galleryThumb === String(mediaId) ? 'true' : 'false'));
    };

    thumbs.forEach((thumb) => thumb.addEventListener('click', () => showMedia(thumb.dataset.galleryThumb)));

    if (mainGallery) {
      let t;
      mainGallery.addEventListener('scroll', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          const i = Math.round(mainGallery.scrollLeft / mainGallery.clientWidth);
          const slide = slides[i];
          if (slide) thumbs.forEach((th) => th.setAttribute('aria-current', th.dataset.galleryThumb === slide.dataset.mediaId ? 'true' : 'false'));
        }, 80);
      }, { passive: true });
    }

    // Pestañas
    $$('[role="tablist"]', section).forEach((tablist) => {
      const tabs = $$('[role="tab"]', tablist);
      const select = (tab) => {
        tabs.forEach((t) => {
          const selected = t === tab;
          t.setAttribute('aria-selected', String(selected));
          t.tabIndex = selected ? 0 : -1;
          const panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !selected;
        });
      };
      tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => select(tab));
        tab.addEventListener('keydown', (e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
          select(next);
          next.focus();
        });
      });
    });

    // Variantes
    if (!picker || !variants.length) return;

    const getSelectedOptions = () =>
      $$('fieldset', picker).map((fs) => $('input:checked', fs)?.value);

    picker.addEventListener('change', async (event) => {
      const fieldset = event.target.closest('fieldset');
      const legendValue = fieldset && $('[data-selected-value]', fieldset);
      if (legendValue) legendValue.textContent = event.target.value;

      const options = getSelectedOptions();
      const variant = variants.find((v) => v.options.every((opt, i) => opt === options[i]));
      const idInputs = $$('input[name="id"]', section);
      const buttons = $$('[data-add-button], [data-buy-now]', section);

      if (!variant) {
        buttons.forEach((b) => (b.disabled = true));
        const addBtn = $('[data-add-button]', section);
        if (addBtn) addBtn.textContent = theme.strings.unavailable;
        return;
      }

      idInputs.forEach((input) => (input.value = variant.id));
      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());
      if (variant.featured_media) showMedia(variant.featured_media.id);

      // Pedir a Shopify el HTML actualizado (precio, inventario, botones)
      try {
        const response = await fetch(`${productUrl}?variant=${variant.id}&section_id=${sectionId}`);
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        $$('[data-dynamic]', section).forEach((el) => {
          const fresh = $(`[data-dynamic="${el.dataset.dynamic}"]`, doc);
          if (fresh) el.innerHTML = fresh.innerHTML;
        });
        $$('[data-dynamic-button]', section).forEach((el) => {
          const fresh = $(`[data-dynamic-button="${el.dataset.dynamicButton}"]`, doc);
          if (fresh) {
            el.disabled = fresh.disabled;
            el.textContent = fresh.textContent;
          }
        });
      } catch (e) {
        /* sin conexión: se mantiene el contenido actual */
      }
    });
  }

  /* ---------------------------------------------------------------------
     Productos relacionados (recomendaciones de Shopify)
     --------------------------------------------------------------------- */
  async function initRecommendations(el) {
    if (el.dataset.ready) return;
    el.dataset.ready = 'true';
    const url = el.dataset.url;
    if (!url) return;
    try {
      const response = await fetch(url);
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const fresh = $('[data-recommendations-grid]', doc);
      const current = $('[data-recommendations-grid]', el);
      if (fresh && current && fresh.children.length > 0) {
        current.replaceWith(fresh);
        el.hidden = false;
        initReveal(el);
      }
    } catch (e) {
      /* se muestran los productos de respaldo */
    }
  }

  /* ---------------------------------------------------------------------
     Filtros de colección y búsqueda
     --------------------------------------------------------------------- */
  document.addEventListener('change', (event) => {
    const form = event.target.closest('[data-auto-submit]');
    if (!form) return;
    if (event.target.type === 'number') return;
    form.requestSubmit ? form.requestSubmit() : form.submit();
  });

  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-filters-toggle]');
    if (!toggle) return;
    const filters = document.getElementById(toggle.getAttribute('aria-controls'));
    filters?.classList.toggle('is-open');
  });

  /* ---------------------------------------------------------------------
     Arranque (y soporte para el editor de temas)
     --------------------------------------------------------------------- */
  function init(root = document) {
    $$('[data-slideshow]', root).forEach(initSlideshow);
    $$('[data-product-section]', root).forEach(initProduct);
    $$('[data-recommendations]', root).forEach(initRecommendations);
    initReveal(root);
  }

  init();

  document.addEventListener('shopify:section:load', (event) => init(event.target));
  document.addEventListener('shopify:block:select', (event) => {
    const slide = event.target.closest('[data-slide]');
    const root = event.target.closest('[data-slideshow]');
    if (slide && root) {
      const track = $('[data-slideshow-track]', root);
      track?.scrollTo({ left: slide.offsetLeft });
    }
  });
})();

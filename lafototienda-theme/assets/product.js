/* La Foto Tienda — página de producto: galería, pestañas y variantes */
(() => {
  'use strict';
  const theme = window.theme || { strings: {} };
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

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
    if (mainGallery && mainGallery.dataset.initialMedia && slides[0] && slides[0].dataset.mediaId !== mainGallery.dataset.initialMedia) {
      requestAnimationFrame(() => showMedia(mainGallery.dataset.initialMedia, false));
    }

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
      buttons.forEach((b) => (b.disabled = !variant.available));
      const addBtn = $('[data-add-button]', section);
      if (addBtn) addBtn.textContent = variant.available ? theme.strings.addToCart : theme.strings.soldOut;
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

  theme.initProduct = initProduct;
  $$('[data-product-section]').forEach(initProduct);
  document.addEventListener('shopify:section:load', (event) => $$('[data-product-section]', event.target).forEach(initProduct));
})();

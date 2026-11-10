// Datos de ejemplo para la vista previa (los mismos productos de productos-ejemplo.csv).
// En la tienda real todo esto sale de Shopify.

const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'https://lafototienda.vercel.app';

const PRODUCTS = [
  {
    handle: 'sony-fe-70-200mm-f2-8-gm-oss', title: 'Sony FE 70-200mm f/2.8 GM OSS', vendor: 'Sony', type: 'Lentes',
    tags: ['ofertas', 'lentes', 'sony'], price: 1699900, compare: 1879900, qty: 10,
    body: '<p>Teleobjetivo profesional G Master con apertura constante f/2.8 y estabilización óptica OSS. Ideal para deportes, eventos, retratos y fauna.</p><ul><li>Montura Sony E (full frame)</li><li>Apertura f/2.8 constante</li><li>Estabilización óptica OSS</li><li>Sellado contra polvo y humedad</li></ul>',
  },
  {
    handle: 'sony-e-35mm-f1-8-oss', title: 'Sony E 35mm f/1.8 OSS', vendor: 'Sony', type: 'Lentes',
    tags: ['ofertas', 'lentes', 'sony'], price: 329900, compare: 459900, qty: 10,
    body: '<p>Lente fijo luminoso para cámaras Sony APS-C. Perfecto para retrato, fotografía de calle y video con fondo desenfocado.</p><ul><li>Montura Sony E (APS-C)</li><li>Apertura f/1.8</li><li>Estabilización óptica OSS</li></ul>',
  },
  {
    handle: 'dji-osmo-360-adventure-combo', title: 'DJI Osmo 360 Adventure Combo', vendor: 'DJI', type: 'Cámaras',
    tags: ['ofertas', 'camaras', 'dji'], price: 539900, compare: 0, qty: 0,
    body: '<p>Cámara 360° de DJI para deportes, viajes y contenido inmersivo. El combo Adventure incluye accesorios para aventuras.</p>',
  },
  {
    handle: 'sony-alpha-a7-v', title: 'Sony Alpha a7 V', vendor: 'Sony', type: 'Cámaras',
    tags: ['nuevos', 'camaras', 'sony'], price: 2099900, compare: 2449900, qty: 5,
    body: '<p>Cámara mirrorless full frame de la línea Alpha 7 de Sony, para fotografía y video profesional con enfoque automático de alto rendimiento.</p>',
  },
  {
    handle: 'dji-mic-mini', title: 'DJI Mic Mini', vendor: 'DJI', type: 'Accesorios',
    tags: ['nuevos', 'accesorios', 'dji'], price: 149900, compare: 0, qty: 15,
    body: '<p>Micrófono inalámbrico ultraligero de DJI para creadores de contenido. Conecta con cámaras, celulares y computadoras.</p>',
  },
  {
    handle: 'dji-neo-2', title: 'DJI Neo 2', vendor: 'DJI', type: 'Drones',
    tags: ['nuevos', 'drones', 'dji'], price: 299900, compare: 0, qty: 8,
    body: '<p>Dron compacto y ligero de DJI para grabar desde el aire con seguimiento inteligente. Ideal para vlogs, viajes y principiantes.</p>',
  },
];

const COLLECTIONS = [
  { handle: 'ofertas-del-mes', title: 'Ofertas del mes', match: (p) => p.tags.includes('ofertas') },
  { handle: 'nuevos-ingresos', title: 'Nuevos ingresos', match: (p) => p.tags.includes('nuevos') },
  { handle: 'camaras', title: 'Cámaras', match: (p) => p.type === 'Cámaras' },
  { handle: 'lentes', title: 'Lentes', match: (p) => p.type === 'Lentes' },
  { handle: 'drones', title: 'Drones', match: (p) => p.type === 'Drones' },
  { handle: 'gimbals', title: 'Gimbals', match: (p) => p.type === 'Gimbals' },
  { handle: 'accesorios', title: 'Accesorios', match: (p) => p.type === 'Accesorios' },
  { handle: 'iluminacion', title: 'Iluminación', match: (p) => p.type === 'Iluminación' },
  { handle: 'tripodes', title: 'Trípodes', match: (p) => p.type === 'Trípodes' },
  { handle: 'all', title: 'Todos los productos', match: () => true },
];

function makeImage(id, text, alt) {
  return {
    id,
    alt,
    width: 800,
    height: 800,
    aspect_ratio: 1,
    src: (w = 800) => `https://placehold.co/${w}x${w}/f5f5f7/1a1a1a/png?text=${encodeURIComponent(text)}`,
    toString() { return this.src(800); },
  };
}

export function buildSampleData() {
  let nextId = 1000;
  const products = PRODUCTS.map((p) => {
    const id = nextId++;
    const image = makeImage(nextId++, p.title, p.title);
    const media = { ...image, media_type: 'image', preview_image: image };
    const variant = {
      id: nextId++,
      title: 'Default Title',
      price: p.price,
      compare_at_price: p.compare || null,
      available: p.qty > 0,
      sku: `LFT-${String(id - 999).padStart(3, '0')}`,
      barcode: '',
      url: `/products/${p.handle}`,
      featured_media: null,
      inventory_management: 'shopify',
      inventory_quantity: p.qty,
      options: ['Default Title'],
    };
    return {
      id,
      handle: p.handle,
      title: p.title,
      url: `/products/${p.handle}`,
      vendor: p.vendor,
      type: p.type,
      tags: p.tags,
      description: p.body,
      price: p.price,
      compare_at_price: p.compare || null,
      price_varies: false,
      available: p.qty > 0,
      has_only_default_variant: true,
      featured_media: media,
      featured_image: image,
      media: [media],
      images: [image],
      variants: [variant],
      selected_or_first_available_variant: variant,
      options_with_values: [],
      collections: [],
      metafields: { custom: {} },
    };
  });

  const collectionList = COLLECTIONS.map((c, i) => {
    const items = products.filter((p) => c.match(PRODUCTS.find((x) => x.handle === p.handle)));
    return {
      id: 500 + i,
      handle: c.handle,
      title: c.title,
      url: `/collections/${c.handle}`,
      description: '',
      products: items,
      products_count: items.length,
      all_products_count: items.length,
      image: null,
      featured_image: items[0]?.featured_image || null,
      filters: [],
      sort_options: [
        { value: 'manual', name: 'Destacados' },
        { value: 'price-ascending', name: 'Precio: menor a mayor' },
        { value: 'price-descending', name: 'Precio: mayor a menor' },
        { value: 'created-descending', name: 'Más recientes' },
      ],
      sort_by: '',
      default_sort_by: 'manual',
      toString() { return this.handle; },
    };
  });

  for (const product of products) {
    product.collections = collectionList.filter((c) => c.handle !== 'all' && c.products.includes(product));
  }

  const menuLinks = collectionList
    .filter((c) => !['ofertas-del-mes', 'nuevos-ingresos', 'all'].includes(c.handle))
    .map((c) => ({ title: c.title, url: c.url, links: [], current: false }));
  const linklists = {
    'main-menu': { handle: 'main-menu', title: 'Menú principal', links: menuLinks, toString() { return this.handle; } },
    footer: { handle: 'footer', title: 'Footer', links: menuLinks, toString() { return this.handle; } },
  };

  return {
    products,
    productsByHandle: Object.fromEntries(products.map((p) => [p.handle, p])),
    collectionList,
    collectionsByHandle: Object.fromEntries(collectionList.map((c) => [c.handle, c])),
    linklists,
    shop: {
      name: 'La Foto Tienda',
      url: SITE_URL,
      description: 'Fotografía, video y drones en Guatemala.',
      customer_accounts_enabled: true,
      enabled_payment_types: ['visa', 'master', 'american_express'],
      policies: [
        { title: 'Política de reembolsos', url: '/pages/contacto' },
        { title: 'Política de privacidad', url: '/pages/contacto' },
        { title: 'Términos del servicio', url: '/pages/contacto' },
      ],
      money_format: 'Q{{amount}}',
      checkout: { guest_login: false },
      password_message: '',
    },
    cart: {
      item_count: 0,
      items: [],
      total_price: 0,
      note: '',
      taxes_included: true,
      currency: { iso_code: 'GTQ', symbol: 'Q' },
      cart_level_discount_applications: [],
    },
    routes: {
      root_url: '/',
      cart_url: '/cart',
      cart_add_url: '/cart/add',
      cart_change_url: '/cart/change',
      cart_update_url: '/cart/update',
      search_url: '/search',
      collections_url: '/collections',
      all_products_collection_url: '/collections/all',
      account_url: '/account/login',
      account_login_url: '/account/login',
      account_register_url: '/account/register',
      account_logout_url: '/',
      account_addresses_url: '/account/login',
      product_recommendations_url: '/recommendations/products',
    },
  };
}

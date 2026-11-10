// Datos de ejemplo para la vista previa (los mismos productos de productos-ejemplo.csv).
// En la tienda real todo esto sale de Shopify.

const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'https://lafototienda.vercel.app';

const PRODUCTS = [
  {
    handle: 'sony-fe-70-200mm-f2-8-gm-oss', image: 'sony-fe-70-200mm-gm.jpg', title: 'Sony FE 70-200mm f/2.8 GM OSS', vendor: 'Sony', type: 'Lentes',
    tags: ['ofertas', 'lentes', 'sony'], price: 1699900, compare: 1879900, qty: 10,
    body: '<p>Teleobjetivo profesional G Master con apertura constante f/2.8 y estabilización óptica OSS. Ideal para deportes, eventos, retratos y fauna.</p><ul><li>Montura Sony E (full frame)</li><li>Apertura f/2.8 constante</li><li>Estabilización óptica OSS</li><li>Sellado contra polvo y humedad</li></ul>',
  },
  {
    handle: 'sony-e-35mm-f1-8-oss', image: 'sony-e-35mm-f1-8.jpg', title: 'Sony E 35mm f/1.8 OSS', vendor: 'Sony', type: 'Lentes',
    tags: ['ofertas', 'lentes', 'sony'], price: 329900, compare: 459900, qty: 10,
    body: '<p>Lente fijo luminoso para cámaras Sony APS-C. Perfecto para retrato, fotografía de calle y video con fondo desenfocado.</p><ul><li>Montura Sony E (APS-C)</li><li>Apertura f/1.8</li><li>Estabilización óptica OSS</li></ul>',
  },
  {
    handle: 'dji-osmo-360-adventure-combo', image: 'dji-osmo-360-muestra.jpg', title: 'DJI Osmo 360 Adventure Combo', vendor: 'DJI', type: 'Cámaras',
    tags: ['ofertas', 'camaras', 'dji'], price: 539900, compare: 0, qty: 0,
    body: '<p>Cámara 360° de DJI para deportes, viajes y contenido inmersivo. El combo Adventure incluye accesorios para aventuras.</p>',
  },
  {
    handle: 'sony-alpha-a7-v', image: 'sony-alpha-a7-v.jpg', title: 'Sony Alpha a7 V', vendor: 'Sony', type: 'Cámaras',
    tags: ['nuevos', 'camaras', 'sony'], price: 2099900, compare: 2449900, qty: 5,
    body: '<p>Cámara mirrorless full frame de la línea Alpha 7 de Sony, para fotografía y video profesional con enfoque automático de alto rendimiento.</p>',
  },
  {
    handle: 'dji-mic-mini', image: 'dji-mic-mini.jpg', title: 'DJI Mic Mini', vendor: 'DJI', type: 'Accesorios',
    tags: ['nuevos', 'accesorios', 'dji'], price: 149900, compare: 0, qty: 15,
    body: '<p>Micrófono inalámbrico ultraligero de DJI para creadores de contenido. Conecta con cámaras, celulares y computadoras.</p>',
  },
  {
    handle: 'dji-neo-2', image: 'dji-neo.jpg', title: 'DJI Neo 2', vendor: 'DJI', type: 'Drones',
    tags: ['nuevos', 'drones', 'dji'], price: 299900, compare: 0, qty: 8,
    body: '<p>Dron compacto y ligero de DJI para grabar desde el aire con seguimiento inteligente. Ideal para vlogs, viajes y principiantes.</p>',
  },
  // Cámaras adicionales solo para la vista previa (precios de ejemplo)
  {
    handle: 'canon-eos-r6-mark-ii', image: 'canon-eos-r6-mark-ii.jpg', title: 'Canon EOS R6 Mark II', vendor: 'Canon', type: 'Cámaras',
    tags: ['camaras', 'canon'], price: 1999900, compare: 0, qty: 4,
    body: '<p>Cámara mirrorless full frame de Canon para foto y video, con enfoque automático rápido y estabilización en el cuerpo.</p>',
  },
  {
    handle: 'nikon-z6iii', image: 'nikon-z6iii.jpg', title: 'Nikon Z6III', vendor: 'Nikon', type: 'Cámaras',
    tags: ['camaras', 'nikon'], price: 2199900, compare: 0, qty: 3,
    body: '<p>Cámara mirrorless full frame de Nikon, pensada para creadores híbridos de foto y video.</p>',
  },
  {
    handle: 'fujifilm-x-t5', image: 'fujifilm-x-t5.jpg', title: 'Fujifilm X-T5', vendor: 'Fujifilm', type: 'Cámaras',
    tags: ['camaras', 'fujifilm', 'ofertas'], price: 1499900, compare: 1649900, qty: 6,
    body: '<p>Cámara APS-C de Fujifilm con controles clásicos y simulaciones de película.</p>',
  },
  {
    handle: 'dji-osmo-pocket-3', image: 'dji-osmo-pocket-3.jpg', title: 'DJI Osmo Pocket 3', vendor: 'DJI', type: 'Cámaras',
    tags: ['camaras', 'dji', 'nuevos'], price: 429900, compare: 0, qty: 12,
    body: '<p>Cámara de bolsillo con gimbal de 3 ejes, ideal para vlogs y viajes.</p>',
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

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IMAGES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'images');
const credits = JSON.parse(fs.readFileSync(path.join(IMAGES_DIR, 'credits.json'), 'utf8'));

// Lee ancho y alto de un JPEG sin dependencias
function jpegSize(file) {
  const buf = fs.readFileSync(file);
  let i = 2;
  while (i < buf.length) {
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return { width: 1200, height: 800 };
}

function makeImage(id, file, alt) {
  const { width, height } = jpegSize(path.join(IMAGES_DIR, file));
  return {
    id,
    alt,
    width,
    height,
    aspect_ratio: width / height,
    src: () => `/preview-images/${file}`,
    toString() { return this.src(); },
  };
}

export { credits };

export function buildSampleData() {
  let nextId = 1000;
  const products = PRODUCTS.map((p, index) => {
    const id = nextId++;
    const image = makeImage(nextId++, p.image, p.title);
    const media = { ...image, media_type: 'image', preview_image: image };
    const variant = {
      id: nextId++,
      title: 'Default Title',
      price: p.price,
      compare_at_price: p.compare || null,
      available: p.qty > 0,
      sku: `LFT-${String(index + 1).padStart(3, '0')}`,
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
    const isSample = (p) => PRODUCTS.find((x) => x.handle === p.handle).image.includes('muestra');
    // Las imágenes temporales van al final para que no encabecen las colecciones
    const items = products
      .filter((p) => c.match(PRODUCTS.find((x) => x.handle === p.handle)))
      .sort((a, b) => Number(isSample(a)) - Number(isSample(b)));
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

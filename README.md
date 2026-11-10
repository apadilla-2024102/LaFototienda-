# Tema Shopify “La Foto Tienda”

Tema Online Store 2.0 hecho a medida para **La Foto Tienda** (lafototienda.gt), tienda guatemalteca de fotografía, video y drones.

- Todo el contenido (productos, precios, imágenes, colecciones y menús) sale de Shopify con Liquid.
- Cada sección se edita desde **Tienda online → Temas → Personalizar**, sin tocar código.
- CSS y JavaScript propios, sin frameworks (`assets/base.css`, `assets/theme.js`, `assets/product.js`), móvil primero.
- **No incluye código de pagos**: el cliente va a `/cart` y al checkout de Shopify, donde se cobra con QPay Pro.

```
.
├── lafototienda-theme/      ← el tema
│   ├── assets/              CSS y JS
│   ├── config/              settings_schema.json y settings_data.json
│   ├── layout/              theme.liquid y password.liquid
│   ├── locales/             es.default.json (todos los textos)
│   ├── sections/            secciones editables y grupos de header/footer
│   ├── snippets/            piezas reutilizables (tarjeta, precio, SEO…)
│   └── templates/           plantillas JSON (inicio, producto, colección…)
├── productos-ejemplo.csv    6 productos de prueba para importar
└── .github/workflows/       Theme Check automático en cada push
```

---

## 1. Previsualizar el tema en tu tienda de prueba

Necesitas Node.js 18 o superior y Shopify CLI.

```bash
npm install -g @shopify/cli
```

```bash
cd lafototienda-theme
```

```bash
shopify theme dev --store MI-TIENDA.myshopify.com
```

La primera vez se abre el navegador para iniciar sesión. Luego la CLI muestra:

- `http://127.0.0.1:9292`: vista previa local que se recarga al guardar cambios.
- Un enlace al **editor de temas** para probar la personalización.

Si la tienda tiene contraseña (las tiendas de desarrollo la tienen), la CLI te la pide. La encuentras en **Tienda online → Preferencias → Protección con contraseña**.

Para revisar el código:

```bash
shopify theme check
```

---

## 2. Configurar la tienda para que todo se vea bien

### 2.1 Moneda en quetzales (formato `Q1,999.00`)

1. **Configuración → Datos de la tienda → Moneda de la tienda**: elige **Quetzal guatemalteco (GTQ)**.
2. En **Cambiar formato** del mismo apartado, deja:
   - HTML con moneda: `Q{{amount}} GTQ`
   - HTML sin moneda: `Q{{amount}}`

El tema usa el filtro `| money`, así que los precios se ven como **Q1,999.00**.

### 2.2 Importar los productos de ejemplo

El archivo `productos-ejemplo.csv` tiene 6 productos con precios en GTQ, etiquetas e imágenes de placehold.co:

| Producto | Precio | Antes | Etiqueta | Inventario |
|---|---|---|---|---|
| Sony FE 70-200mm f/2.8 GM OSS | Q16,999.00 | Q18,799.00 | ofertas | 10 |
| Sony E 35mm f/1.8 OSS | Q3,299.00 | Q4,599.00 | ofertas | 10 |
| DJI Osmo 360 Adventure Combo | Q5,399.00 | n/a | ofertas | **0 (Agotado)** |
| Sony Alpha a7 V | Q20,999.00 | Q24,499.00 | nuevos | 5 |
| DJI Mic Mini | Q1,499.00 | n/a | nuevos | 15 |
| DJI Neo 2 | Q2,999.00 | n/a | nuevos | 8 |

1. Ve a **Productos → Importar**.
2. Sube `productos-ejemplo.csv`.
3. Marca **Sobrescribir productos con el mismo identificador** si vuelves a importarlo.
4. Haz clic en **Subir y previsualizar**, revisa y luego en **Importar productos**.

Las imágenes tardan unos minutos en descargarse. El inventario queda en tu ubicación principal. Cada producto también tiene un **Tipo** (Lentes, Cámaras, Accesorios, Drones) que sirve para las colecciones por categoría.

### 2.3 Crear las colecciones automáticas

En **Productos → Colecciones → Crear colección**, elige **Automatizada** y crea:

| Nombre (título) | Condición | Identificador (handle) que usa el tema |
|---|---|---|
| **Ofertas del mes** | Etiqueta del producto **es igual a** `ofertas` | `ofertas-del-mes` |
| **Nuevos ingresos** | Etiqueta del producto **es igual a** `nuevos` | `nuevos-ingresos` |

Para el mosaico de categorías y el menú, crea también estas colecciones automáticas (condición **Tipo de producto es igual a …**):

| Título | Condición | Handle |
|---|---|---|
| Cámaras | Tipo = Cámaras | `camaras` |
| Lentes | Tipo = Lentes | `lentes` |
| Drones | Tipo = Drones | `drones` |
| Gimbals | Tipo = Gimbals | `gimbals` |
| Accesorios | Tipo = Accesorios | `accesorios` |
| Iluminación | Tipo = Iluminación | `iluminacion` |
| Trípodes | Tipo = Trípodes | `tripodes` |

Shopify genera el handle a partir del título (sin tildes). Puedes revisarlo al final de la colección, en **Anuncio en motores de búsqueda**. Sube una imagen a cada colección: se usa en el mosaico de categorías.

Si usas otros nombres, no pasa nada: en el editor de temas eliges la colección de cada sección.

### 2.4 Crear el menú principal

1. **Tienda online → Navegación → Menú principal** (handle `main-menu`).
2. Agrega estos elementos, cada uno enlazado a su colección: **Cámaras, Lentes, Drones, Gimbals, Accesorios, Iluminación, Trípodes**.
3. (Opcional) Arrastra elementos debajo de otro para crear submenús. El tema los muestra como menú desplegable en escritorio y como acordeón en móvil.

El footer usa el mismo menú en la columna “Categorías”. Puedes crear un menú distinto (por ejemplo `footer`) y elegirlo en el editor.

### 2.5 Políticas, página de contacto y blog

- **Configuración → Políticas**: redacta reembolsos, privacidad, términos y envíos. El footer las muestra automáticamente.
- **Tienda online → Páginas → Agregar página** “Contacto” y elige la plantilla **page.contact** (incluye el formulario).
- Los mensajes del formulario llegan al correo de **Configuración → Notificaciones**.

### 2.6 Especificaciones y garantía por producto (opcional)

La pestaña **Especificaciones** de la página de producto lee el metacampo `custom.especificaciones`, y la pestaña **Garantía** lee `custom.garantia` (si no existe, usa el texto general del editor).

1. **Configuración → Datos personalizados → Productos → Agregar definición**.
2. Nombre `Especificaciones`, espacio de nombres y clave `custom.especificaciones`, tipo **Texto enriquecido** o **Texto de varias líneas**.
3. Repite con `custom.garantia` si quieres una garantía distinta por producto.
4. Llénalos al final de cada producto.

### 2.7 Personalizar el tema

En **Tienda online → Temas → Personalizar**:

- **Configuración del tema → Logo**: sube el logo. Sin logo se muestra “La Foto **Tienda**” en texto.
- **Colores**: el color de marca (acento) cambia botones, enlaces y etiquetas.
- **Estilo**: redondeo de esquinas y animaciones al hacer scroll.
- **Carrito**: cajón lateral o página, y monto de envío gratis (Q1,000 por defecto).
- **Redes sociales**: Facebook, Instagram, TikTok, YouTube y WhatsApp.
- **SEO y datos de la empresa**: imagen para compartir, teléfono y correo (para Google).

> **Importante: reemplaza los datos de ejemplo.** En la sección **Nuestras tiendas** hay teléfonos `+502 0000-0000`, el correo `info@lafototienda.gt` y horarios de ejemplo. Escribe los datos reales de cada tienda; también se usan en los datos estructurados de Google. Haz lo mismo con los horarios de la **Barra superior**.

---

## 3. Qué incluye

### Página de inicio (en este orden)
1. Barra superior con horarios de Design Center Zona 10 y Plaza Siete Xela.
2. Encabezado: logo, menú de Shopify, buscador, cuenta, carrito con contador y menú hamburguesa en móvil.
3. Banner / slider con varias diapositivas (“Mundo DJI sin límites”).
4. Franja de logos de marcas (bloques con imagen o texto).
5. 4 insignias de confianza.
6. Mosaico de categorías (bloques que eligen colección).
7. **Ofertas del mes**: 3 productos con etiqueta Oferta/Agotado, precio tachado, % de descuento y botón Comprar.
8. **Nuevos ingresos**: la misma sección con otra colección.
9. Sobre nosotros (texto, imagen y datos destacados).
10. Nuestras tiendas: 2 tarjetas con dirección, teléfono, correo, horario y botón a Google Maps.
11. Formulario de contacto (`{% form 'contact' %}`).
12. Footer: menú, políticas, redes sociales e íconos de pago (`payment_type_svg_tag`).

### Producto
Galería con miniaturas (deslizable en móvil), marca, título, precio, precio comparado, ahorro en Q, disponibilidad, selector de variantes, cantidad, **Agregar al carrito** (AJAX con `/cart/add.js`, abre el cajón), **Comprar ahora** (va directo al checkout), estado Agotado, beneficios, pestañas Descripción / Especificaciones / Garantía y 3 productos relacionados (recomendaciones de Shopify). Acepta bloques de apps.

### Otras plantillas
Colección con filtros y orden de Shopify (configúralos con la app **Search & Discovery**), lista de colecciones, carrito (página y cajón lateral con barra de envío gratis), búsqueda con filtros, página, contacto, blog, artículo con comentarios, 404, contraseña, tarjeta de regalo y cuenta de cliente (inicio de sesión, registro, recuperar contraseña, pedidos, detalle de pedido y direcciones).

### SEO
- Un solo `<h1>` por página. En el inicio es el nombre de la tienda (logo).
- `<title>` y meta description dinámicos con `page_title` y `page_description`, y URL canónica.
- Open Graph y Twitter Cards con imagen.
- `alt` en todas las imágenes (alt de la imagen o el título del producto).
- JSON-LD: `Organization`, `WebSite` con buscador, `LocalBusiness` para cada tienda, `Product` con precio, moneda GTQ y disponibilidad, `BreadcrumbList` y `BlogPosting`.
- Imágenes con `image_url` + `srcset` y `loading="lazy"`. Solo la primera imagen del hero y la imagen principal del producto cargan de inmediato.
- CSS en un solo archivo y JS con `defer`. El JS de producto solo carga en la página de producto.

---

## 4. Subir a GitHub y conectar con Shopify

### 4.1 Subir el código

```bash
git add .
```

```bash
git commit -m "Tema La Foto Tienda"
```

```bash
git push origin main
```

### 4.2 Conectar desde GitHub

La integración de Shopify con GitHub lee el tema desde la **raíz** de una rama. Como aquí el tema está en `lafototienda-theme/`, crea una rama que contenga solo esa carpeta:

```bash
git subtree split --prefix lafototienda-theme -b tema-shopify
```

```bash
git push origin tema-shopify
```

Después:

1. En Shopify ve a **Tienda online → Temas**.
2. En **Biblioteca de temas** haz clic en **Agregar tema → Conectar desde GitHub**.
3. Autoriza la app de Shopify en tu cuenta u organización de GitHub.
4. Elige el repositorio y la rama **`tema-shopify`**.

Shopify mantiene la rama y el tema sincronizados: los cambios que hagas en el editor de temas se guardan como commits en esa rama. Si cambias código en `main`, vuelve a ejecutar los dos comandos anteriores para actualizar `tema-shopify`. Si en algún momento haces cambios desde el editor, haz `git pull origin tema-shopify` antes, para no perderlos.

> Alternativa: mueve el contenido de `lafototienda-theme/` a la raíz del repositorio y conecta directamente la rama `main`.

### 4.3 Publicar

En **Tienda online → Temas**, en el tema conectado, haz clic en **Acciones → Publicar**. Antes revisa la vista previa en computadora y celular.

---

## 5. Activar QPay Pro (pagos)

El tema no procesa pagos. Todo el cobro lo hace el **checkout de Shopify**, así que basta con activar QPay Pro en la tienda:

1. Pide a QPay Pro tus credenciales de comercio (llaves de API y usuario).
2. En Shopify ve a **Configuración → Pagos**.
3. En **Métodos de pago adicionales** (o **Proveedores de pago**) haz clic en **Agregar método de pago** y busca **QPay Pro**. Si QPay te da una app del Shopify App Store, instálala primero y luego aparecerá ahí.
4. Activa el proveedor e ingresa las credenciales.
5. Haz una compra de prueba en **modo de prueba** y después cambia a producción.

Los íconos de pago del footer y del carrito aparecen solos según los métodos activos (`shop.enabled_payment_types`).

> Los nombres exactos de los menús pueden variar un poco según la versión del panel de Shopify y el tipo de integración de QPay Pro. Confirma los pasos con el soporte de QPay Pro.

---

## 6. Mantenimiento

- Textos de la interfaz: `lafototienda-theme/locales/es.default.json`.
- Colores, tipografía y espaciados: `lafototienda-theme/assets/base.css` (variables en `snippets/css-variables.liquid`).
- Cada push a GitHub ejecuta **Theme Check** (`.github/workflows/theme-check.yml`).

---

## 7. Vista previa en Vercel (solo para ver el diseño)

Vercel no puede ejecutar un tema de Shopify, así que el repositorio incluye un generador (`preview/build.mjs`) que lee los archivos del tema y crea páginas HTML con **productos de ejemplo** (`preview/sample-data.mjs`). Cada vez que subes cambios a GitHub, Vercel vuelve a generar la página y puedes ver cómo quedó el diseño en https://lafototienda.vercel.app.

- Es solo una vitrina: el carrito, el checkout, los formularios y el inventario funcionan únicamente en Shopify.
- La configuración está en `vercel.json`. No hace falta cambiar nada en el panel de Vercel.
- Para generarla en tu computadora:

```bash
npm install
```

```bash
npm run preview:build
```

Las páginas quedan en `preview/dist/`.

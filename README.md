# Master Vip Store

Marketplace de cuentas digitales (streaming, IA, diseño, etc.) con 3 paneles independientes bajo un mismo proyecto Next.js, y **una sola cuenta que puede tener las 3 capacidades a la vez** (mismo correo: cliente + proveedor + dueño).

## Los 3 paneles

### 🛒 Streaming (`/streaming`) — tienda pública
- Catálogo con categorías (cinta superior + página Biblioteca), búsqueda, ficha de producto.
- Compra sin billetera interna: el cliente paga **directo por Yape al proveedor** (QR/número propios de cada uno), sube su captura y queda **Pendiente** hasta que el proveedor la aprueba.
- Cada solicitud genera un **código de seguimiento** corto y visible.
- Dos tipos de producto:
  - **Stock**: se entrega usuario + contraseña de inmediato al aprobarse.
  - **Activación**: el cliente indica el correo donde se activará el servicio; la contraseña se coordina después **directo por WhatsApp** con el proveedor (no hay chat interno).
- "Mis compras": historial completo (aprobadas, pendientes, rechazadas), revelado de credenciales bajo demanda, reseñas.
- Botón de compra respeta el **horario de atención** (ver más abajo) y el stock disponible — "Agotado" vs "Fuera de horario" son estados distintos.

### 🏪 Proveedores (`/proveedores`) — panel de vendedor
- Registro con aprobación (`PENDIENTE` → `ACTIVO` por el dueño).
- CRUD de productos (nombre, imagen, categoría, precio, vigencia, tipo Stock/Activación) y su stock de credenciales (cifradas).
- Configura su propio **Yape** (QR, número, nombre) y su **horario de atención**.
- Aprueba/rechaza sus propias solicitudes de compra (es a su Yape que llega el pago).
- Historial de ventas con credenciales entregadas y contacto directo por WhatsApp con cada cliente.

### 👑 Master / VIP (`/vip`) — panel del dueño
- Login exclusivo, sin registro público.
- Activa/suspende proveedores, edita/elimina cuentas, ve el detalle de cada usuario y proveedor.
- Aprueba solicitudes de compra **como respaldo** (el flujo normal es que cada proveedor apruebe la suya).
- Administra **categorías** (nombre + ícono) que alimentan la cinta del catálogo y Biblioteca.
- Configura el **horario general de la tienda** (se suma al de cada proveedor).
- Analíticas de ventas/ganancias de toda la plataforma.

## Horario de atención

Cada **proveedor** define su propio horario (`Abre` / `Cierra`) desde su Perfil. El dueño puede definir además un horario **general de la plataforma** desde el Panel VIP. Un producto solo es comprable si **ambos** horarios (plataforma y proveedor) están abiertos en ese momento (hora de Lima); si no, el botón muestra "Fuera de horario" en vez de "Comprar ahora". Dejar los campos vacíos = disponible 24 h. Se valida tanto en la interfaz como en el servidor al crear la solicitud de compra.

## Seguridad

- **Contraseñas de login**: hash unidireccional con `bcrypt` (nunca se pueden ver en claro, ni por el admin).
- **Credenciales de las cuentas vendidas**: cifrado reversible `AES-256-GCM` (`ENCRYPTION_KEY`) — se descifran bajo demanda solo en el servidor, nunca se exponen crudas al cliente ni se loguean.
- **Sesión**: JWT firmado (`SESSION_SECRET`) en cookie `httpOnly`, `secure` en producción.
- **Autorización**: cada Server Action re-valida sesión/rol server-side (no confía en que la UI ya lo haya filtrado) — cliente, proveedor y admin están completamente aislados entre sí.
- **Subida de archivos**: solo imágenes, validadas por la firma real de bytes (no por el `Content-Type` que declara el navegador, que se puede falsificar) y con extensión fija según el tipo detectado.
- **Rate limiting** en memoria sobre login/registro para frenar fuerza bruta.
- **Content-Security-Policy** y cabeceras de seguridad (`X-Frame-Options`, `X-Content-Type-Options`, etc.) en todas las rutas.

## Modelo de datos

Base de datos SQLite, definida en [`prisma/schema.prisma`](prisma/schema.prisma). Todo el acceso pasa por Prisma — no hay SQL escrito a mano en ningún lado del proyecto.

```prisma
User             // cuenta: email + passwordHash (bcrypt) + isAdmin + providerProfile?
  └─ Provider     // 1:1 — perfil de vendedor: businessName, Yape (qr/número/nombre), opensAt/closesAt
       └─ Product          // categoría, precio, duración, type: STOCK | ACTIVACION
            └─ AccountStock // credenciales cifradas (AES-256-GCM), status: DISPONIBLE|RESERVADA|VENDIDA

Category          // name, slug, icon — alimenta la cinta del catálogo y Biblioteca

PurchaseRequest    // 1 por intento de compra: captura Yape, status PENDIENTE|APROBADO|RECHAZADO
  └─ Purchase       // se crea SOLO al aprobar — snapshot cifrado propio de las credenciales,
                     // inmutable aunque el proveedor edite el AccountStock original
       └─ Review     // 1:1 con Purchase, rating + comentario

Notification       // por usuario: tipo, canal, leída/no leída
PlatformSettings   // fila única ("singleton"): opensAt/closesAt general de la tienda
```

**Por qué `PurchaseRequest` y `Purchase` están separados**: no existe saldo/billetera interna. Cada compra es un pago directo Yape-a-Yape entre cliente y proveedor, así que cada intento queda como una `PurchaseRequest` (con la captura de pago) hasta que el proveedor la revisa a mano contra su propio Yape. Solo al aprobarla nace el `Purchase` real, con las credenciales ya copiadas y cifradas — eso es lo que hace que el historial de compras no cambie aunque el proveedor después actualice o borre el stock original.

**Código de seguimiento**: cada `PurchaseRequest`/`Purchase` se identifica ante el cliente con los últimos 8 caracteres de su `id` (cuid), en mayúsculas — ver `lib/utils/orderId.ts::formatOrderId()`. Es el número que el cliente le da al proveedor por WhatsApp para que ubique su solicitud.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · Prisma 7 · **SQLite** (archivo local, sin servidor de base de datos externo) · `jose` (JWT) · `bcryptjs`.

## Configuración inicial (desarrollo local)

```bash
npm install
```

Copia `.env.example` a `.env` y completa los valores (detalle de cada variable en el propio archivo). Genera claves nuevas para `ENCRYPTION_KEY` y `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

```bash
npm run db:push   # crea las tablas
npm run db:seed   # crea tu cuenta (dueño + proveedor + cliente a la vez) y categorías base
npm run dev        # http://localhost:3000
```

## Despliegue en producción

Ver **[DEPLOY.md](DEPLOY.md)** — guía paso a paso para hosting con Node.js (probado con BanaHosting/cPanel vía "Setup Node.js App" + `server.js`). Resumen: la base de datos SQLite necesita **disco persistente** (VPS o cPanel con Node) — no sirve en hostings serverless como Vercel/Netlify.

## Estructura del proyecto

```
app/streaming/    páginas del panel cliente
app/proveedores/  páginas del panel proveedor
app/vip/          páginas del panel dueño
app/api/          rutas HTTP (auth, subida de archivos)
components/       componentes de UI, agrupados igual que app/ + ui/ y shared/
lib/actions/      Server Actions (mutaciones y lecturas), un archivo por dominio
lib/auth/         sesión, hash de contraseñas, rate limiting
lib/crypto/       cifrado reversible de credenciales
lib/validators/   esquemas Zod de cada formulario/acción
prisma/           schema.prisma + seed.ts
server.js         entry point para hostings tipo cPanel (Passenger)
```

## Comandos útiles

```bash
npm run dev        # servidor de desarrollo
npm run build      # build de producción (también type-checkea)
npm start           # levanta el build de producción
npm run lint        # ESLint
npm run db:push     # sincroniza el schema de Prisma con la base de datos
npm run db:seed     # crea la cuenta del dueño + categorías base (idempotente)
npm run db:studio   # explorador visual de la base de datos
```

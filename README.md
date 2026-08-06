# Master Vip Store

Plataforma con 3 paneles:

- **Panel Streaming** (`/streaming`) — tienda pública de cuentas (Netflix, HBO, Canva, ChatGPT, Gemini, Claude, IPTV...), con registro, wallet, recarga vía Yape y biblioteca de compras.
- **Panel Proveedores** (`/proveedores`) — vendedores gestionan sus cuentas/credenciales, precios y ventas.
- **Panel VIP** (`/vip`) — panel del dueño: aprueba proveedores, aprueba depósitos Yape, ve ganancias y todas las ventas.

Stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Prisma 7 + PostgreSQL.

## Configuración inicial

1. Instala dependencias (ya hecho si acabas de clonar por primera vez):
   ```bash
   npm install
   ```
2. Copia `.env.example` a `.env` y completa `DATABASE_URL` con tu cadena de conexión de PostgreSQL (Neon, Supabase, o local). Las claves `ENCRYPTION_KEY` y `SESSION_SECRET` ya vienen generadas para desarrollo local — genera nuevas antes de ir a producción.
3. Crea las tablas en la base de datos:
   ```bash
   npm run db:push
   ```
4. Carga datos de prueba (admin, proveedores, productos, clientes):
   ```bash
   npm run db:seed
   ```
5. Levanta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre http://localhost:3000 (redirige a `/streaming`).

## Cuentas de prueba (creadas por `npm run db:seed`)

**Tus cuentas** (mismo Gmail, con alias `+proveedor` / `+cliente` — la base de datos exige un correo único por cuenta, pero los 3 llegan a tu mismo inbox):

| Panel | Correo | Contraseña |
|---|---|---|
| VIP (dueño) | vipstore.ok1@gmail.com | @61959894do |
| Proveedores | vipstore.ok1+proveedor@gmail.com | @61959894do |
| Streaming (saldo S/ 100) | vipstore.ok1+cliente@gmail.com | @61959894do |

Cuentas de prueba adicionales:

| Rol | Correo | Contraseña |
|---|---|---|
| Proveedor activo | marcus.shop@mastervipstore.com | Proveedor123! |
| Proveedor activo | jotacplay@mastervipstore.com | Proveedor123! |
| Proveedor pendiente | nuevo.proveedor@mastervipstore.com | Proveedor123! |
| Cliente sin saldo | cliente.sinsaldo@mastervipstore.com | Cliente123! |
| Cliente con saldo (S/ 50) | cliente.consaldo@mastervipstore.com | Cliente123! |
| Cliente con compra vencida | cliente.vencido@mastervipstore.com | Cliente123! |

## Estado del proyecto (fases)

- [x] Fase 1 — Base, autenticación, catálogo público (Panel Streaming: home, login, registro, detalle de producto).
- [x] Fase 2 — Wallet, recarga Yape, compra real de cuentas.
- [x] Fase 3 — Panel Proveedores (CRUD de productos/credenciales, ventas).
- [x] Fase 4 — Panel VIP/Admin (aprobar proveedores y depósitos, ganancias).
- [x] **Fase 5** — Reseñas, notificaciones, pulido visual/responsive.

## Comandos útiles

```bash
npm run dev        # servidor de desarrollo
npm run build      # build de producción (también type-checkea)
npm run lint       # ESLint
npm run db:push    # sincroniza el schema de Prisma con la base de datos
npm run db:seed    # carga datos de prueba
npm run db:studio  # explorador visual de la base de datos
```

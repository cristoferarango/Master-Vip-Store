# Subir Master Vip Store a BanaHosting

Guía paso a paso para publicar la app en tu hosting de BanaHosting (cPanel).
El panel de facturación (`manage.banahosting.com/clientarea.php`) NO es donde
subes archivos — ahí solo administras el servicio. Desde ahí entras al
**cPanel** real, que es donde se hace todo lo de abajo.

## 0. Antes de empezar

- Confirma que tu plan de BanaHosting incluye **Node.js** (busca el ícono
  "Setup Node.js App" dentro de cPanel, sección "Software"). Si no lo ves,
  escríbele a soporte de BanaHosting pidiendo que te lo activen — es un
  addon estándar de cPanel (CloudLinux Node.js Selector), casi todos los
  planes lo traen.
- Este proyecto usa **SQLite** (un archivo de base de datos dentro del
  proyecto) — funciona perfecto en hosting normal con disco persistente
  como este (a diferencia de Vercel/Netlify, que no serviría).

## 1. Entrar a cPanel

1. Entra a `https://manage.banahosting.com/clientarea.php` con tu cuenta.
2. Ve a **Services → Mis Servicios** y abre el hosting que compraste.
3. Busca el botón **"Login to cPanel"** (o "Iniciar sesión en cPanel").

## 2. Confirmar el dominio

En cPanel, ve a **Domains**. Tu dominio ya debería aparecer ahí (como
dominio principal o "Addon Domain") si la DNS ya apunta a BanaHosting —
tal como dijiste que ya hiciste. Anota la carpeta que cPanel le asignó
(normalmente `public_html` si es el dominio principal).

## 3. Subir el proyecto (sin `node_modules` ni `.next`)

**No subas `node_modules`** — tiene un paquete (`better-sqlite3`) compilado
para tu compu (Windows), no para el servidor (Linux). Hay que instalarlo
en el servidor mismo.

Desde tu compu, en la carpeta del proyecto:

```bash
# Arma un zip solo con el código fuente (sin node_modules/.next/uploads reales)
```

En Windows, más fácil: copia la carpeta del proyecto a otra ubicación,
borra ahí `node_modules`, `.next`, `prisma/dev.db` y el contenido de
`public/uploads/*` (deja `.gitkeep`), y comprime el resto en un `.zip`.

Súbelo por cPanel → **File Manager** → entra a tu carpeta (ej.
`/home/tuusuario/mastervipstore`, fuera de `public_html` — la app de
Node.js no se sirve como archivos estáticos, cPanel la conecta por proxy) →
**Upload** el `.zip` → click derecho → **Extract**.

*(Alternativa más rápida si ya tienes el proyecto en GitHub: cPanel →
**Git Version Control** → clona el repo directo ahí.)*

## 4. Crear la app de Node.js en cPanel

cPanel → **Setup Node.js App** → **Create Application**:

- **Node.js version**: la más alta disponible (idealmente 20 o superior).
- **Application mode**: Production
- **Application root**: la carpeta donde subiste el proyecto (paso 3).
- **Application URL**: tu dominio.
- **Application startup file**: `server.js` (ya está en el proyecto — es
  el archivo que traduce Next.js al formato que cPanel/Passenger espera).

Dale **Create**. cPanel te muestra un comando tipo
`source /home/tuusuario/nodevenv/mastervipstore/20/bin/activate` — ese es
el entorno virtual de Node que crea. Guárdalo, lo usas en el paso siguiente.

## 5. Variables de entorno

En la misma pantalla de "Setup Node.js App", sección **Environment
Variables**, agrega (mira `.env.example` del proyecto para la lista
completa y el formato):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `file:/home/tuusuario/mastervipstore/prisma/dev.db` (ruta absoluta real de tu servidor) |
| `ENCRYPTION_KEY` | clave de 32 bytes en base64 — genera una nueva, **no reuses la de desarrollo** |
| `SESSION_SECRET` | otra clave distinta, también nueva |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` / `ADMIN_WHATSAPP` | tus datos reales de dueño |
| `YAPE_NUMBER` | tu Yape |
| `NODE_ENV` | `production` |

Para generar `ENCRYPTION_KEY` y `SESSION_SECRET`, corre esto en tu compu:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

(una vez para cada una — deben ser distintas entre sí).

## 6. Instalar, generar la base de datos y compilar

Abre **Terminal** en cPanel (ícono "Terminal" en el menú principal — si no
aparece, pide a soporte que te den acceso SSH). Ahí:

```bash
# Activa el entorno de Node que creó cPanel (el comando exacto te lo dio el paso 4)
source /home/tuusuario/nodevenv/mastervipstore/20/bin/activate

cd /home/tuusuario/mastervipstore

npm install            # instala TODO en el servidor — así better-sqlite3 compila para Linux
npx prisma generate
npx prisma db push     # crea las tablas
npm run db:seed        # crea tu cuenta única (VIP + Proveedor + Streaming)
npm run build           # build de producción de Next.js
```

Si `npm run db:seed` falla porque no encuentra `.env`, es porque las
variables de entorno del paso 5 solo las inyecta cPanel al arrancar la
app — para que el Terminal también las vea, cópialas a un archivo `.env`
real dentro de esa misma carpeta (mismo contenido que pusiste en el paso 5).

## 7. Arrancar

Vuelve a cPanel → **Setup Node.js App** → tu aplicación → botón
**Restart**. Con eso ya debería estar sirviendo en tu dominio.

## 8. Activar HTTPS (obligatorio)

cPanel → **SSL/TLS Status** (o **AutoSSL**) → actívalo para tu dominio
(gratis, Let's Encrypt). **Esto no es opcional**: las cookies de sesión de
la app solo se envían por HTTPS en producción — sin certificado, el login
no va a funcionar aunque todo lo demás esté bien.

## 9. Probar

1. Entra a `https://tudominio.com` — debe verse el hub (Streaming /
   Proveedores / Master).
2. Entra a `/owner` con el `ADMIN_EMAIL`/`ADMIN_PASSWORD` que pusiste en el
   paso 5.
3. En el Panel VIP, ve a **Categorías** y agrega las plataformas que vas a
   vender (con su ícono).
4. En el Panel Proveedores → Perfil, configura tu Yape real.
5. Publica tu primer producto y súbele stock.

## Cada vez que cambies el código

```bash
# en tu compu: sube los archivos que cambiaron (File Manager o git pull en el servidor)
# en el Terminal del servidor:
npm install          # solo si cambiaron las dependencias
npx prisma generate  # solo si tocaste prisma/schema.prisma
npm run build
```

Y luego **Restart** desde "Setup Node.js App" en cPanel.

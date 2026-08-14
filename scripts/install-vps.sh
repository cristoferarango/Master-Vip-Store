#!/bin/bash
# =============================================================================
# Instalador automático para VPS (Ubuntu/Debian) — Master Vip Store
# -----------------------------------------------------------------------------
# Qué hace:
#   1. Pide el DOMINIO y los datos del dueño.
#   2. Instala Node.js 20, PM2, nginx y Certbot (Let's Encrypt).
#   3. Genera claves de cifrado nuevas (ENCRYPTION_KEY / SESSION_SECRET).
#   4. Crea el .env de producción, instala dependencias, base de datos y build.
#   5. Arranca la app con PM2 en el puerto 3000.
#   6. Configura nginx con HTTPS para tu dominio (certificado gratis).
#   7. Te muestra el USUARIO y la CONTRASEÑA del dueño (3 paneles).
#
# Cómo usarlo (EN EL VPS):
#   cd /carpeta/donde/esta/el/proyecto
#   sudo bash scripts/install-vps.sh
#
# Requisitos:
#   - Ubuntu 20.04+ / Debian 11+ con acceso root (sudo).
#   - La DNS del dominio YA debe apuntar a la IP del VPS antes de correrlo
#     (certbot no puede emitir el HTTPS si el dominio no resuelve a este VPS).
# =============================================================================

set -euo pipefail

# Colores para la salida
ROJO='\033[0;31m'
VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
CYAN='\033[0;36m'
SIN_COLOR='\033[0m'

info()  { echo -e "${CYAN}[INFO]${SIN_COLOR} $*"; }
ok()    { echo -e "${VERDE}[OK]${SIN_COLOR} $*"; }
warn()  { echo -e "${AMARILLO}[AVISO]${SIN_COLOR} $*"; }
error() { echo -e "${ROJO}[ERROR]${SIN_COLOR} $*"; }

# -----------------------------------------------------------------------------
# 0. Validaciones iniciales
# -----------------------------------------------------------------------------
if [[ $EUID -ne 0 ]]; then
  error "Debes ejecutarlo como root (usa: sudo bash scripts/install-vps.sh)"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [[ ! -f "$PROJECT_DIR/package.json" ]]; then
  error "No encontré package.json. Debes correr el script dentro del proyecto."
  exit 1
fi

cd "$PROJECT_DIR"

# Detectar el sistema operativo
if [[ -f /etc/os-release ]]; then
  . /etc/os-release
  if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
    error "Solo soporto Ubuntu o Debian. Detecté: $ID"
    exit 1
  fi
else
  error "No pude detectar el sistema operativo (falta /etc/os-release)."
  exit 1
fi

# -----------------------------------------------------------------------------
# 1. Pedir datos al usuario
# -----------------------------------------------------------------------------
echo ""
echo -e "${VERDE}============================================================${SIN_COLOR}"
echo -e "${VERDE}  Master Vip Store — Instalador para VPS${SIN_COLOR}"
echo -e "${VERDE}============================================================${SIN_COLOR}"
echo ""

while [[ -z "${DOMAIN:-}" ]]; do
  read -r -p "🌐 Ingresa tu DOMINIO (ej: tudominio.com): " DOMAIN
done
# Quitar espacios y barras al inicio/final
DOMAIN="${DOMAIN// /}"
DOMAIN="${DOMAIN#http://}"
DOMAIN="${DOMAIN#https://}"
DOMAIN="${DOMAIN#www.}"
DOMAIN="${DOMAIN%/}"

if ! [[ "$DOMAIN" =~ ^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
  error "El dominio '$DOMAIN' no parece válido."
  exit 1
fi

read -r -p "📧 Correo del dueño (Enter para usar vipstore.ok1@gmail.com): " ADMIN_EMAIL
ADMIN_EMAIL="${ADMIN_EMAIL:-vipstore.ok1@gmail.com}"

read -r -p "👤 Nombre del dueño (Enter para usar 'Dueño Master Vip Store'): " ADMIN_NAME
ADMIN_NAME="${ADMIN_NAME:-Dueño Master Vip Store}"

read -r -p "💬 WhatsApp del dueño (Enter para usar 934546289): " ADMIN_WHATSAPP
ADMIN_WHATSAPP="${ADMIN_WHATSAPP:-934546289}"

read -r -p "💳 Número Yape (Enter para usar el mismo WhatsApp): " YAPE_NUMBER
YAPE_NUMBER="${YAPE_NUMBER:-$ADMIN_WHATSAPP}"

echo ""
read -r -s -p "🔑 Contraseña del dueño (Enter para GENERAR UNA SEGURA automáticamente): " ADMIN_PASSWORD
echo ""
if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
  ADMIN_PASSWORD="$(openssl rand -base64 16 | tr -d '/+=' | cut -c1-16)"
  GENERATED_PASS=true
else
  GENERATED_PASS=false
fi

echo ""
info "Instalando para: https://${DOMAIN}"
info "Dueño: ${ADMIN_EMAIL}"
echo ""

# -----------------------------------------------------------------------------
# 2. Instalar dependencias del sistema
# -----------------------------------------------------------------------------
info "Actualizando el sistema e instalando dependencias (nginx, Node.js 20, build tools)..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg build-essential python3 openssl

# Instalar Node.js 20 (NodeSource) si no está
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  NODE_MAJOR="$(node -v | sed 's/^v\([0-9]*\).*/\1/')"
  if (( NODE_MAJOR < 18 )); then
    warn "Node.js detectado es muy viejo (v$NODE_MAJOR). Reinstalando Node 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  else
    ok "Node.js detectado: $(node -v)"
  fi
fi

# Instalar PM2 global
if ! command -v pm2 &>/dev/null; then
  info "Instalando PM2..."
  npm install -g pm2
else
  ok "PM2 detectado."
fi

# Instalar nginx y certbot (necesario aunque exista nginx para el plugin de certbot)
info "Instalando nginx y Certbot..."
apt-get install -y nginx certbot python3-certbot-nginx

ok "Dependencias del sistema listas."

# -----------------------------------------------------------------------------
# 3. Configurar variables de entorno (.env de producción)
# -----------------------------------------------------------------------------
ENCRYPTION_KEY="$(openssl rand -base64 32)"
SESSION_SECRET="$(openssl rand -base64 32)"

# Ruta absoluta real de la base de datos en este VPS
ABS_DB_URL="file:${PROJECT_DIR}/prisma/dev.db"

info "Creando .env de producción..."
cat > .env <<EOF
NODE_ENV="production"
DATABASE_URL="${ABS_DB_URL}"

ENCRYPTION_KEY="${ENCRYPTION_KEY}"
SESSION_SECRET="${SESSION_SECRET}"

ADMIN_EMAIL="${ADMIN_EMAIL}"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"
ADMIN_NAME="${ADMIN_NAME}"
ADMIN_WHATSAPP="${ADMIN_WHATSAPP}"

YAPE_NUMBER="${YAPE_NUMBER}"
EOF

# Proteger el .env
chmod 600 .env
ok ".env creado (datos cifrados con claves nuevas)."

# -----------------------------------------------------------------------------
# 4. Instalar dependencias npm, base de datos y build
# -----------------------------------------------------------------------------
info "Instalando dependencias de npm (puede tardar varios minutos)..."
npm install --no-audit --no-fund

info "Generando cliente de Prisma..."
npx prisma generate

info "Creando/actualizando la base de datos (SQLite)..."
npx prisma db push --accept-data-loss

info "Sembrando la base de datos (crea la cuenta del dueño + categorías + catálogo demo)..."
npm run db:seed

info "Compilando el proyecto (producción)..."
npm run build

ok "Instalación y build completados."

# -----------------------------------------------------------------------------
# 5. Arrancar con PM2
# -----------------------------------------------------------------------------
info "Configurando PM2 para mantener la app corriendo..."

pm2 delete master-vip-store &>/dev/null || true
PORT=3000 pm2 start npm --name "master-vip-store" -- start
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true
pm2 save

# Verificar que la app responda
sleep 4
if curl -fsS -o /dev/null "http://127.0.0.1:3000"; then
  ok "La app responde en http://127.0.0.1:3000"
else
  warn "La app aún no responde en el puerto 3000. Revisa con: pm2 logs master-vip-store"
fi

# -----------------------------------------------------------------------------
# 6. Configurar nginx + HTTPS
# -----------------------------------------------------------------------------
info "Configurando nginx para ${DOMAIN}..."

NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"
NGINX_LINK="/etc/nginx/sites-enabled/${DOMAIN}"

cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
EOF

ln -sf "$NGINX_CONF" "$NGINX_LINK"

# Quitar el sitio por defecto si no usa ninguno de nuestros dominios
if grep -q "server_name _" /etc/nginx/sites-enabled/default 2>/dev/null; then
  rm -f /etc/nginx/sites-enabled/default
fi

# Validar y recargar nginx
nginx -t
systemctl reload nginx

# Certificado SSL con Let's Encrypt
info "Emisando certificado SSL con Let's Encrypt para ${DOMAIN}..."
certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" \
  --non-interactive --agree-tos -m "${ADMIN_EMAIL}" \
  --redirect --hsts --keep-until-expiring || warn "Certbot no pudo emitir el certificado (revisa que la DNS apunte a este VPS)."

systemctl reload nginx
ok "nginx + HTTPS configurados."

# -----------------------------------------------------------------------------
# 7. Resumen final
# -----------------------------------------------------------------------------
echo ""
echo -e "${VERDE}============================================================${SIN_COLOR}"
echo -e "${VERDE}  ✅ INSTALACIÓN COMPLETADA${SIN_COLOR}"
echo -e "${VERDE}============================================================${SIN_COLOR}"
echo ""
echo -e "${CYAN}  🌐 SITIO:${SIN_COLOR}       https://${DOMAIN}"
echo -e "${CYAN}  📧 USUARIO:${SIN_COLOR}     ${ADMIN_EMAIL}"
echo -e "${CYAN}  🔑 CONTRASEÑA:${SIN_COLOR}  ${ADMIN_PASSWORD}"
if $GENERATED_PASS; then
  echo -e "${AMARILLO}  (contraseña generada — cámbiala desde el Panel VIP → Perfil cuando quieras)${SIN_COLOR}"
fi
echo ""
echo -e "${CYAN}  Paneles (usa el mismo usuario y contraseña):${SIN_COLOR}"
echo -e "    → Master/VIP:    https://${DOMAIN}/vip"
echo -e "    → Proveedores:   https://${DOMAIN}/proveedores"
echo -e "    → Streaming:     https://${DOMAIN}/streaming"
echo ""
echo -e "${AMARILLO}  Comandos útiles:${SIN_COLOR}"
echo -e "    pm2 status                     → estado de la app"
echo -e "    pm2 logs master-vip-store      → ver logs"
echo -e "    pm2 restart master-vip-store   → reiniciar la app"
echo ""
echo -e "${VERDE}============================================================${SIN_COLOR}"

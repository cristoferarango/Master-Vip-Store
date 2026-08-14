#!/bin/bash
# Correr UNA vez desde la Terminal de cPanel, parado dentro de la carpeta
# de la app (donde está este script). Antes de correrlo, crea el archivo
# .env en esta misma carpeta (copia .env.example y llena los valores reales).
set -e
npm install
npx prisma generate
npx prisma db push --accept-data-loss
npm run db:seed
npm run build
echo "Listo. Ahora ve a cPanel -> Setup Node.js App -> Restart."

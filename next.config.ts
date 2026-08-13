import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Oculta el botoncito "N" (indicador de modo desarrollo de Next.js) que
  // flota abajo a la izquierda — solo aparece con `next dev`, nunca en
  // producción, pero lo apagamos también en dev para que no estorbe.
  devIndicators: false,
  images: {
    remotePatterns: [
      // Placeholders usados por prisma/seed.ts para las imágenes de producto de prueba.
      { protocol: "https", hostname: "placehold.co" },
    ],
  },

  async headers() {
    const isDev = process.env.NODE_ENV !== "production";

    // Sin nonce a propósito: la variante con nonce de Next.js exige que
    // TODAS las páginas se rendericen dinámicamente (nada de páginas
    // estáticas) y no cubre los `style={{...}}` inline que usan Cursor,
    // ProductCard, HubCard, etc. (el nonce solo aplica a etiquetas <style>,
    // no al atributo style="" — eso solo se puede permitir con
    // 'unsafe-inline'). Esta es la variante "sin nonce" que la propia doc de
    // Next recomienda para este caso: sigue bloqueando lo más peligroso
    // (scripts/recursos externos, que el sitio se incruste en un iframe
    // ajeno, que un formulario mande datos a otro dominio) sin arriesgar
    // romper el render.
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: https://placehold.co;
      font-src 'self';
      connect-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      ${isDev ? "" : "upgrade-insecure-requests;"}
    `
      .replace(/\s{2,}/g, " ")
      .trim();

    return [
      {
        // Todas las rutas: cabeceras de seguridad básicas de defensa en profundidad.
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          // Evita que el navegador intente "adivinar" el tipo real de un
          // archivo servido con Content-Type distinto — relevante sobre todo
          // para /uploads (imágenes subidas por proveedores/clientes).
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Nadie más puede incrustar el sitio en un <iframe> (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;

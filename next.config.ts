import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Placeholders usados por prisma/seed.ts para las imágenes de producto de prueba.
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

export default nextConfig;

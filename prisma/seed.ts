import "dotenv/config";
import { prisma } from "../lib/db/prisma";
import { hashPassword } from "../lib/auth/password";

/**
 * Seed limpio para subir a producción: UNA sola cuenta (el dueño) con las 3
 * capacidades a la vez — admin (Panel Master), proveedor (Panel Proveedores)
 * y cliente (Tienda) — sin categorías, productos ni stock de ejemplo. Login
 * por USUARIO (no correo) — ver lib/actions/auth.actions.ts::login.
 */
async function main() {
  console.log("Seeding Master Vip Store (cuenta única del dueño, sin datos de ejemplo)...");

  const username = process.env.ADMIN_USERNAME ?? "vipstore";
  const email = process.env.ADMIN_EMAIL ?? "vipstore.ok1@gmail.com";
  const password = process.env.ADMIN_PASSWORD ?? "61959894do";
  const passwordHash = await hashPassword(password);

  const owner = await prisma.user.upsert({
    where: { email },
    update: { isAdmin: true, passwordHash, username, referralCode: "MVS-MASTER" },
    create: {
      email,
      passwordHash,
      name: process.env.ADMIN_NAME ?? "Master Vip Store",
      username,
      referralCode: "MVS-MASTER",
      whatsapp: process.env.ADMIN_WHATSAPP ?? "934546289",
      role: "ADMIN",
      isAdmin: true,
      providerProfile: {
        create: {
          businessName: "Master Vip Store",
          status: "ACTIVO",
          activatedAt: new Date(),
          yapeNumber: process.env.YAPE_NUMBER ?? process.env.ADMIN_WHATSAPP ?? "934546289",
          yapeName: process.env.ADMIN_NAME ?? "Master Vip Store",
        },
      },
    },
    include: { providerProfile: true },
  });

  // Si la cuenta ya existía sin el perfil de proveedor, se lo agrega.
  if (!owner.providerProfile) {
    await prisma.provider.create({
      data: {
        userId: owner.id,
        businessName: "Master Vip Store",
        status: "ACTIVO",
        activatedAt: new Date(),
        yapeNumber: process.env.YAPE_NUMBER ?? process.env.ADMIN_WHATSAPP ?? "934546289",
        yapeName: process.env.ADMIN_NAME ?? "Master Vip Store",
      },
    });
  }

  console.log("\nSeed completado. Base limpia: sin categorías, productos ni stock de ejemplo.");
  console.log("--------------------------------------------------");
  console.log(`Tu única cuenta (los 3 paneles): ${username} / ${password}`);
  console.log("  → Panel Master:      /owner");
  console.log("  → Panel Proveedores: /provee");
  console.log("  → Tienda Streaming:  /");
  console.log("--------------------------------------------------");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

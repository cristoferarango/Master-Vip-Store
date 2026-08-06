import "dotenv/config";
import { prisma } from "../lib/db/prisma";
import { hashPassword } from "../lib/auth/password";
import { encryptSecret } from "../lib/crypto/credentials";
import { slugify } from "../lib/utils/slug";

/**
 * Seed mínimo: UNA sola cuenta (el dueño) que tiene las 3 capacidades a la
 * vez — admin (Panel VIP), proveedor (Panel Proveedores) y cliente (Panel
 * Streaming) — todo bajo el mismo correo/contraseña. Sin cuentas de prueba
 * ni datos falsos de otros usuarios.
 */
async function main() {
  console.log("Seeding Master Vip Store (cuenta única del dueño)...");

  const email = process.env.ADMIN_EMAIL ?? "vipstore.ok1@gmail.com";
  const password = process.env.ADMIN_PASSWORD ?? "@61959894do";
  const passwordHash = await hashPassword(password);

  const owner = await prisma.user.upsert({
    where: { email },
    update: { isAdmin: true, passwordHash },
    create: {
      email,
      passwordHash,
      name: process.env.ADMIN_NAME ?? "Dueño Master Vip Store",
      whatsapp: process.env.ADMIN_WHATSAPP ?? "934546289",
      role: "ADMIN",
      isAdmin: true,
      wallet: { create: { balance: 100 } },
      providerProfile: {
        create: {
          businessName: "Master Vip Store",
          status: "ACTIVO",
          activatedAt: new Date(),
        },
      },
    },
    include: { providerProfile: true, wallet: true },
  });

  // Si la cuenta ya existía sin alguna de las dos capacidades, se las agrega.
  let providerId = owner.providerProfile?.id;
  if (!providerId) {
    const provider = await prisma.provider.create({
      data: { userId: owner.id, businessName: "Master Vip Store", status: "ACTIVO", activatedAt: new Date() },
    });
    providerId = provider.id;
  }
  if (!owner.wallet) {
    await prisma.wallet.create({ data: { userId: owner.id, balance: 100 } });
  }

  console.log(`Cuenta lista: ${owner.email} (admin + proveedor + cliente)`);

  // ---------------------------------------------------------------------
  // Categorías
  // ---------------------------------------------------------------------
  const categoryNames = ["Netflix", "HBO Max", "Canva", "ChatGPT", "Gemini", "Claude", "IPTV"];
  const categories = new Map<string, { id: string }>();
  for (const [index, name] of categoryNames.entries()) {
    const slug = slugify(name);
    const category = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, order: index },
    });
    categories.set(name, category);
  }
  console.log(`Categorías listas: ${categoryNames.join(", ")}`);

  // ---------------------------------------------------------------------
  // Catálogo de ejemplo, publicado por la misma cuenta (como proveedor)
  // ---------------------------------------------------------------------
  async function upsertProduct(params: {
    categoryName: string;
    name: string;
    imageUrl: string;
    description: string;
    conditions: string;
    price: number;
    durationDays: number;
    stock: { username: string; password: string }[];
  }) {
    const slug = slugify(params.name);
    const category = categories.get(params.categoryName)!;

    const product = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        providerId: providerId!,
        categoryId: category.id,
        name: params.name,
        slug,
        imageUrl: params.imageUrl,
        description: params.description,
        conditions: params.conditions,
        price: params.price,
        durationDays: params.durationDays,
      },
    });

    const existingStock = await prisma.accountStock.count({ where: { productId: product.id } });
    if (existingStock === 0) {
      await prisma.accountStock.createMany({
        data: params.stock.map((s) => ({
          productId: product.id,
          usernameEncrypted: encryptSecret(s.username),
          passwordEncrypted: encryptSecret(s.password),
        })),
      });
    }

    return product;
  }

  const placeholderImg = "https://placehold.co/600x450/0a0a0a/ef4444?text=";

  await upsertProduct({
    categoryName: "Netflix",
    name: "Netflix Premium 4K - 1 Perfil",
    imageUrl: placeholderImg + "Netflix",
    description:
      "Cuenta Netflix Premium con calidad 4K Ultra HD. Acceso a un perfil privado con PIN configurado.",
    conditions:
      "No compartir el perfil con terceros. No cambiar el idioma general de la cuenta. Reemplazo garantizado ante fallas dentro de los primeros 3 días.",
    price: 10.75,
    durationDays: 30,
    stock: [
      { username: "netflix.demo1@mastervipstore.com", password: "Demo1234" },
      { username: "netflix.demo2@mastervipstore.com", password: "Demo1234" },
    ],
  });

  await upsertProduct({
    categoryName: "HBO Max",
    name: "HBO Max Premium (30 días)",
    imageUrl: placeholderImg + "HBO+Max",
    description: "Cuenta HBO Max completa, calidad Full HD, ideal para series y estrenos.",
    conditions: "Uso personal. No modificar la contraseña. Soporte por WhatsApp ante cualquier problema.",
    price: 6.8,
    durationDays: 30,
    stock: [{ username: "hbo.demo1@mastervipstore.com", password: "Demo1234" }],
  });

  await upsertProduct({
    categoryName: "Canva",
    name: "Canva Pro - Cuenta Individual",
    imageUrl: placeholderImg + "Canva",
    description: "Acceso completo a Canva Pro: plantillas premium, fondos removibles y más.",
    conditions: "No cambiar el correo de recuperación. Licencia de por vida mientras la cuenta esté activa.",
    price: 15.0,
    durationDays: 365,
    stock: [{ username: "canva.demo1@mastervipstore.com", password: "Demo1234" }],
  });

  await upsertProduct({
    categoryName: "ChatGPT",
    name: "ChatGPT Plus - 1 Mes",
    imageUrl: placeholderImg + "ChatGPT",
    description: "Cuenta ChatGPT Plus con acceso a los modelos más recientes, sin límites de uso básico.",
    conditions: "No cambiar la contraseña ni el correo. Uso individual.",
    price: 45.0,
    durationDays: 30,
    stock: [{ username: "chatgpt.demo1@mastervipstore.com", password: "Demo1234" }],
  });

  await upsertProduct({
    categoryName: "IPTV",
    name: "IPTV Smarters Full HD - 1 Mes",
    imageUrl: placeholderImg + "IPTV",
    description: "Lista IPTV con canales en vivo, series y películas, compatible con Smart TV y celular.",
    conditions: "Máximo 1 dispositivo conectado a la vez.",
    price: 20.0,
    durationDays: 30,
    stock: [{ username: "iptv.demo1@mastervipstore.com", password: "Demo1234" }],
  });

  console.log("Productos y stock listos (publicados por Master Vip Store).");

  console.log("\nSeed completado.");
  console.log("--------------------------------------------------");
  console.log(`Tu única cuenta (los 3 paneles): ${email} / ${password}`);
  console.log("  → Panel VIP:        /vip");
  console.log("  → Panel Proveedores: /proveedores");
  console.log("  → Panel Streaming:   /streaming");
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

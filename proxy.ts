import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// No se puede importar lib/auth/session.ts aquí porque usa next/headers +
// "server-only", que no corren en el runtime Edge del proxy. Se reimplementa
// la verificación mínima del JWT con jose (compatible con Edge).
//
// El acceso ya no depende de un rol único: una misma cuenta puede tener
// varias capacidades (comprar, vender, administrar) a la vez.

const COOKIE_NAME = "mvs_session";

type Claims = { isAdmin?: boolean; providerId?: string | null };

async function getClaimsFromCookie(request: NextRequest): Promise<Claims | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as Claims;
  } catch {
    return null;
  }
}

const PROTECTED_RULES: { prefix: string; check: (c: Claims | null) => boolean; loginPath: string }[] = [
  { prefix: "/mis-compras", check: (c) => !!c, loginPath: "/login" },
  { prefix: "/perfil", check: (c) => !!c, loginPath: "/login" },
  // /biblioteca ya no requiere sesión: es una vitrina pública de plataformas.
  { prefix: "/provee/dashboard", check: (c) => !!c?.providerId, loginPath: "/provee" },
  { prefix: "/owner/dashboard", check: (c) => !!c?.isAdmin, loginPath: "/owner" },
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rule = PROTECTED_RULES.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return NextResponse.next();

  const claims = await getClaimsFromCookie(request);
  if (!rule.check(claims)) {
    const loginUrl = new URL(rule.loginPath, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/mis-compras/:path*", "/perfil/:path*", "/provee/:path*", "/owner/:path*"],
};

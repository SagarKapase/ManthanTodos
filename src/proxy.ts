import { NextResponse, type NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "manthan_session";
// Sliding inactivity window — each visit resets the clock (FR-8).
const IDLE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const PUBLIC = ["/login", "/first-login"];

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
}

async function verify(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as { userId: string; role: "ADMIN" | "MEMBER" };
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const token = req.cookies.get(COOKIE)?.value;
  const payload = token ? await verify(token) : null;

  if (!payload) {
    if (isPublic) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  // Slide the session on real navigations only (avoid clobbering logout's cookie delete on POST actions).
  if (req.method === "GET") {
    const fresh = await new SignJWT({ userId: payload.userId, role: payload.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${IDLE_SECONDS}s`)
      .sign(secret());
    res.cookies.set(COOKIE, fresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: IDLE_SECONDS,
      path: "/",
    });
  }
  return res;
}

export const config = {
  // Run on all routes except Next internals, the API, and static files.
  matcher: ["/((?!_next/static|_next/image|api|favicon.ico|.*\\.).*)"],
};

import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthUser } from "./auth";
export async function requireUser(returnTo: string, admin = false) {
  const cookieStore = await cookies();
  let user: AuthUser | null = null;
  if (cookieStore.has("mowe_session"))
    try {
      const response = await fetch(
        `${process.env.BACKEND_URL || "http://127.0.0.1:4000"}/auth/me`,
        { headers: { Cookie: cookieStore.toString() }, cache: "no-store" },
      );
      if (response.ok) user = (await response.json()).user;
    } catch {}
  if (!user)
    redirect(
      `${admin ? "/admin/login" : "/login"}?next=${encodeURIComponent(returnTo)}`,
    );
  if (admin && user.role !== "admin") redirect("/dashboard");
  return user;
}

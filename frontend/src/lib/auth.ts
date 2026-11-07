export type AuthUser = {
  id: string;
  name: string;
  email: string;
  studentNumber: string | null;
  role: "student" | "admin";
  isSuperAdmin: boolean;
  emailVerified: boolean;
  profile: { bio: string; linkedin: string; photo: string };
};
export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public challengeId?: string,
  ) {
    super(message);
  }
}
let csrfToken: string | undefined;
async function csrf() {
  const response = await fetch("/api/auth/csrf", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok)
    throw new AuthError(
      "Unable to reach the account service. Please try again.",
      503,
    );
  const data = await response.json();
  csrfToken = data.csrfToken;
  return csrfToken!;
}
export async function authRequest(
  path: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
  retry = true,
  namespace = "/api/auth",
): Promise<any> {
  try {
    const multipart =
      typeof FormData !== "undefined" && body instanceof FormData;
    const response = await fetch(`${namespace}${path}`, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(body !== undefined
          ? {
              ...(multipart ? {} : { "Content-Type": "application/json" }),
              "X-CSRF-Token": csrfToken || (await csrf()),
            }
          : {}),
      },
      ...(body !== undefined
        ? { body: multipart ? (body as FormData) : JSON.stringify(body) }
        : {}),
    });
    const data = await response.json().catch(() => ({
      error: "The account service is unavailable. Please try again.",
    }));
    if (!response.ok) {
      if (data.code === "CSRF_INVALID" && retry) {
        await csrf();
        return authRequest(path, body, method, false, namespace);
      }
      throw new AuthError(
        data.error || "Unable to complete this request.",
        response.status,
        data.code,
        data.challengeId,
      );
    }
    return data;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError(
      "Unable to reach the account service. Please make sure the backend is running.",
      503,
    );
  }
}
export function learningRequest(path: string, body?: unknown) {
  return authRequest(
    path,
    body,
    body === undefined ? "GET" : "POST",
    true,
    "/api/learning",
  );
}
export function safeDestination(value: string | null, role?: string) {
  if (role === "student" && value && /^\/admin(?:[/?#]|$)/.test(value))
    return "/dashboard";
  if (
    value?.startsWith("/") &&
    !value.startsWith("//") &&
    !/^\/(?:admin\/)?(?:login|signup|verify-email|forgot-password|reset-password)(?:[/?#]|$)/.test(
      value,
    )
  )
    return value;
  return role === "admin" ? "/admin" : "/dashboard";
}

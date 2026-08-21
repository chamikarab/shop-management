import { cookies } from "next/headers";

export async function getAuthCookieHeader(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!accessToken && !refreshToken) return null;

  const parts: string[] = [];
  if (accessToken) parts.push(`access_token=${accessToken}`);
  if (refreshToken) parts.push(`refresh_token=${refreshToken}`);
  return parts.join("; ");
}

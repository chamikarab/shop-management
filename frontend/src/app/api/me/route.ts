// frontend/src/app/api/me/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    
    // Build cookie header from Next.js cookies
    const cookiesToSend: string[] = [];
    if (accessToken) {
      cookiesToSend.push(`access_token=${accessToken}`);
    }
    if (refreshToken) {
      cookiesToSend.push(`refresh_token=${refreshToken}`);
    }
    const cookieHeader = cookiesToSend.join('; ');
    
    const res = await fetch(`${apiUrl}/api/me`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      // If 401, try to refresh token
      if (res.status === 401 && refreshToken) {
        const refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
          method: "POST",
          headers: {
            Cookie: cookieHeader,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (refreshRes.ok) {
          // Get new cookies from refresh response
          const setCookieHeaders = refreshRes.headers.getSetCookie();
          
          // Build new cookie header with refreshed tokens
          const newCookies: string[] = [];
          setCookieHeaders.forEach((cookie) => {
            const match = cookie.match(/(access_token|refresh_token)=([^;]+)/);
            if (match) {
              newCookies.push(`${match[1]}=${match[2]}`);
            }
          });
          const newCookieHeader = newCookies.join('; ');
          
          const retryRes = await fetch(`${apiUrl}/api/me`, {
            method: "GET",
            headers: {
              Cookie: newCookieHeader || cookieHeader,
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

          if (retryRes.ok) {
            const data = await retryRes.json();
            const response = NextResponse.json(data);
            
            // Forward new cookies to client
            if (setCookieHeaders && setCookieHeaders.length > 0) {
              setCookieHeaders.forEach((cookie) => {
                response.headers.append("Set-Cookie", cookie);
              });
            }
            return response;
          }
        }
      }
      
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("❌ Proxy /api/me error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

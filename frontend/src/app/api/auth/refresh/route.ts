import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { message: "No refresh token provided" },
      { status: 401 }
    );
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    
    // Build cookie header from Next.js cookies
    const cookieHeader = `refresh_token=${refreshToken}`;
    
    const backendRes = await fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: cookieHeader,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!backendRes.ok) {
      return NextResponse.json({ message: "Refresh failed" }, { status: 401 });
    }

    // ✅ Extract new access/refresh tokens from backend response headers
    const setCookieHeaders = backendRes.headers.getSetCookie();
    const result = await backendRes.json(); // backend usually returns user or token info

    const response = NextResponse.json(result);

    // Forward cookies from backend to client
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookie) => {
        // Parse and reformat cookie to ensure it works with Next.js
        const cookieParts = cookie.split(';');
        const [nameValue] = cookieParts;
        const [name, value] = nameValue.split('=');
        
        // Extract other cookie attributes
        const attributes: Record<string, string> = {};
        cookieParts.slice(1).forEach((part) => {
          const trimmed = part.trim();
          if (trimmed.toLowerCase().startsWith('max-age=')) {
            attributes['Max-Age'] = trimmed.split('=')[1];
          } else if (trimmed.toLowerCase().startsWith('path=')) {
            attributes['Path'] = trimmed.split('=')[1];
          } else if (trimmed.toLowerCase() === 'httponly') {
            attributes['HttpOnly'] = '';
          } else if (trimmed.toLowerCase().startsWith('samesite=')) {
            attributes['SameSite'] = trimmed.split('=')[1];
          }
        });
        
        // Build cookie string for Next.js
        let cookieString = `${name}=${value}`;
        Object.entries(attributes).forEach(([key, val]) => {
          cookieString += `; ${key}${val ? `=${val}` : ''}`;
        });
        
        response.headers.append("Set-Cookie", cookieString);
      });
    }

    return response;
  } catch (error) {
    console.error("❌ Refresh route error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
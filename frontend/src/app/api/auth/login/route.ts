import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    const res = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      credentials: "include",
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json(
        { message: error.message || "Login failed" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const response = NextResponse.json(data);

    // Forward cookies from backend to frontend
    const setCookieHeaders = res.headers.getSetCookie();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookie) => {
        // Parse and reformat cookie for Next.js
        const cookieParts = cookie.split(';');
        const [nameValue] = cookieParts;
        const [name, value] = nameValue.split('=');
        
        // Extract cookie attributes
        const attributes: Record<string, string> = {};
        cookieParts.slice(1).forEach((part) => {
          const trimmed = part.trim();
          const lower = trimmed.toLowerCase();
          if (lower.startsWith('max-age=')) {
            attributes['Max-Age'] = trimmed.split('=')[1];
          } else if (lower.startsWith('path=')) {
            attributes['Path'] = trimmed.split('=')[1];
          } else if (lower === 'httponly') {
            attributes['HttpOnly'] = '';
          } else if (lower.startsWith('samesite=')) {
            attributes['SameSite'] = trimmed.split('=')[1];
          }
        });
        
        // Build cookie string
        let cookieString = `${name}=${value}`;
        Object.entries(attributes).forEach(([key, val]) => {
          cookieString += `; ${key}${val ? `=${val}` : ''}`;
        });
        
        response.headers.append("Set-Cookie", cookieString);
      });
    }

    return response;
  } catch (err) {
    console.error("❌ Login API route error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


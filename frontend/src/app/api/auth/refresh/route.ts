// src/app/api/auth/refresh/route.ts
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
    const backendRes = await fetch("http://localhost:3000/auth/refresh", {
      method: "POST",
      headers: {
        Cookie: `refresh_token=${refreshToken}`,
      },
    });

    if (!backendRes.ok) {
      const error = await backendRes.json();
      return NextResponse.json(
        { message: error.message || "Refresh failed" },
        { status: 401 }
      );
    }

    const setCookies = backendRes.headers.getSetCookie();
    const response = NextResponse.json({ message: "Token refreshed" });

    if (setCookies) {
      if (Array.isArray(setCookies)) {
        setCookies.forEach(cookie => {
          response.headers.append("Set-Cookie", cookie);
        });
      } else {
        response.headers.set("Set-Cookie", setCookies);
      }
    }

    return response;
  } catch (error) {
    console.error("🔴 Refresh route error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

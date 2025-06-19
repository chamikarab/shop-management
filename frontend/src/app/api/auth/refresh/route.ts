import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = cookies();
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
      credentials: "include", // ✅ make sure cookies are sent
    });

    if (!backendRes.ok) {
      return NextResponse.json({ message: "Refresh failed" }, { status: 401 });
    }

    // ✅ Extract new access/refresh tokens from backend response headers
    const setCookieHeaders = backendRes.headers.getSetCookie();
    const result = await backendRes.json(); // backend usually returns user or token info

    const response = NextResponse.json(result);

    if (setCookieHeaders) {
      if (Array.isArray(setCookieHeaders)) {
        for (const cookie of setCookieHeaders) {
          response.headers.append("Set-Cookie", cookie);
        }
      } else {
        response.headers.set("Set-Cookie", setCookieHeaders);
      }
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
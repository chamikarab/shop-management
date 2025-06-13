// src/app/api/auth/refresh/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "No refresh token" }, { status: 401 });
  }

  try {
    const res = await fetch("http://localhost:3000/auth/refresh", {
      method: "POST",
      headers: {
        Cookie: `refresh_token=${refreshToken}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ message: "Refresh failed" }, { status: 401 });
    }

    const setCookies = res.headers.getSetCookie();
    if (setCookies) {
      const response = NextResponse.json({ message: "Token refreshed" });
      response.headers.set("Set-Cookie", setCookies);
      return response;
    }

    return NextResponse.json(
      { message: "No cookie returned" },
      { status: 500 }
    );
  } catch (err) {
    console.error("Error during refresh:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

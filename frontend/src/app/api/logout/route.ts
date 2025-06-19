import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = cookies();

  // Clear access token
  cookieStore.set("access_token", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });

  // Clear refresh token
  cookieStore.set("refresh_token", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });

  return NextResponse.json({ message: "Logged out" });
}
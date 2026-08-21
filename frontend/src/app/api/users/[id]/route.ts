import { NextRequest, NextResponse } from "next/server";
import { getAuthCookieHeader } from "@/lib/serverAuth";

const apiUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieHeader = await getAuthCookieHeader();
  if (!cookieHeader) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const res = await fetch(`${apiUrl()}/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("PUT /api/users proxy error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieHeader = await getAuthCookieHeader();
  if (!cookieHeader) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const res = await fetch(`${apiUrl()}/users/${id}`, {
      method: "DELETE",
      headers: {
        Cookie: cookieHeader,
      },
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("DELETE /api/users proxy error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

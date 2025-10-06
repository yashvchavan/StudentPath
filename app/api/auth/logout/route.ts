import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: "Logged out successfully" });

    // Clear your auth cookies
    response.cookies.set("authToken", "", {
      path: "/",
      maxAge: 0,
      sameSite: "strict", // match original
      secure: false,      // false for localhost
    });

    response.cookies.set("collegeData", "", {
      path: "/",
      maxAge: 0,
      sameSite: "strict",
      secure: false,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: "Logout failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { jwtVerify } from "jose";

const key = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function getAuthId(req: NextRequest): Promise<number | null> {
  const token = req.cookies.get('auth_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return payload.id as number;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const professionalId = await getAuthId(req);
    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string || "professional_documents";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert file type to resource_type
    const isPdf = file.type === "application/pdf";
    const resourceType = isPdf ? "raw" : "auto";
    const format = isPdf ? "pdf" : undefined;

    const secureUrl = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `studentpath/${folder}`,
          public_id: `${professionalId}_${Date.now()}`,
          resource_type: resourceType,
          format: format
        },
        (error, result) => {
          if (error) {
            console.error("[Upload] Cloudinary error:", error);
            reject(error);
          } else {
            resolve(result?.secure_url || "");
          }
        }
      ).end(buffer);
    });

    if (!secureUrl) {
      return NextResponse.json({ error: "Upload to Cloudinary failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: secureUrl });

  } catch (error) {
    console.error("[Upload Document Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

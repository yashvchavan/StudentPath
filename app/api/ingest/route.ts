import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

const RAG_API_URL = process.env.RAG_API_URL || "https://rag-python-service-2312.onrender.com";
const API_SECRET_KEY = process.env.API_SECRET_KEY || "rag_studentpath_admin_2026";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_session")?.value;

    // Verify admin authentication
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    let collegeToken = '';
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number, role: string };
      if (decoded.role === 'college') {
        const [rows]: any = await pool.query('SELECT college_token FROM colleges WHERE id = ?', [decoded.id]);
        if (rows.length > 0) collegeToken = rows[0].college_token;
      } else {
        throw new Error('Invalid role');
      }
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { pdf_url, dept, year } = body;

    // Validate required fields
    if (!pdf_url || !dept || !year) {
      return NextResponse.json(
        { error: "Missing required fields: pdf_url, dept, year" },
        { status: 400 }
      );
    }


    console.log("📤 Sending ingest request to RAG API:", {
      url: `${RAG_API_URL}/ingest`,
      pdf_url,
      dept,
      year,
      college_token: collegeToken ? '✓' : '✗'
    });

    // Forward request to FastAPI backend with Bearer token
    // Include college_token for multi-tenant vector storage
    const response = await fetch(`${RAG_API_URL}/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${API_SECRET_KEY}`,
      },
      body: JSON.stringify({
        pdf_url,
        dept,
        year,
        token: collegeToken, // College token for multi-tenant filtering
      }),
    });

    const data = await response.json();

    console.log("📥 RAG API Response:", {
      status: response.status,
      ok: response.ok,
      data
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.detail || data.message || "Failed to ingest syllabus",
          success: false
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || "Syllabus ingested successfully",
      chunks_processed: data.chunks_processed || 0,
      vectors_stored: data.vectors_stored || 0
    });
  } catch (error) {
    console.error("❌ Error in /api/ingest:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ingest
 * Admin endpoint: Delete syllabus from vector DB
 * 
 * Query params: ?dept=Computer Science&year=2024
 */
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_session")?.value;

    // Verify admin authentication
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number, role: string };
      if (decoded.role !== 'college') {
        throw new Error('Invalid role');
      }
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const dept = searchParams.get("dept");
    const year = searchParams.get("year");

    if (!dept || !year) {
      return NextResponse.json(
        { error: "Missing required query params: dept, year" },
        { status: 400 }
      );
    }

    console.log("🗑️ Sending delete request to RAG API:", {
      url: `${RAG_API_URL}/ingest`,
      dept,
      year
    });

    // Forward request to FastAPI backend
    const response = await fetch(
      `${RAG_API_URL}/ingest?dept=${encodeURIComponent(dept)}&year=${encodeURIComponent(year)}`,
      {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${API_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();

    console.log("📥 RAG API Delete Response:", {
      status: response.status,
      ok: response.ok,
      data
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.message || "Failed to delete syllabus" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || "Syllabus deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error in DELETE /api/ingest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

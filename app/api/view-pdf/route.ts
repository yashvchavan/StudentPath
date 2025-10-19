// app/api/view-pdf/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const url = searchParams.get("url")
    const download = searchParams.get("download") === "true"
    const customFilename = searchParams.get("filename")
    
    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 })
    }

    // Fetch the PDF from Cloudinary
    const response = await fetch(url)
    
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 500 })
    }

    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()
    
    // Use custom filename if provided, otherwise extract from URL
    let filename = customFilename || "document.pdf"
    if (!customFilename) {
      const urlParts = url.split('/')
      const cloudinaryFilename = urlParts[urlParts.length - 1]
      filename = cloudinaryFilename.includes('.pdf') 
        ? cloudinaryFilename 
        : `${cloudinaryFilename}.pdf`
    }
    
    // Ensure filename ends with .pdf
    if (!filename.endsWith('.pdf')) {
      filename = `${filename}.pdf`
    }
    
    // Return the PDF with proper headers
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': download 
          ? `attachment; filename="${filename}"` 
          : `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error("Error serving PDF:", error)
    return NextResponse.json({ error: "Failed to serve PDF" }, { status: 500 })
  }
}
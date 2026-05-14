import { NextRequest, NextResponse } from 'next/server'

// Proxies a PDF from Supabase storage to avoid any CORS issues in the browser PDF viewer.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing url', { status: 400 })

  // Only allow our own Supabase storage
  const allowed = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (allowed && !url.startsWith(allowed)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const upstream = await fetch(url, { cache: 'force-cache' })
    if (!upstream.ok) return new NextResponse('Upstream error', { status: upstream.status })

    const body = await upstream.arrayBuffer()
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('PDF proxy error:', err)
    return new NextResponse('Proxy error', { status: 500 })
  }
}

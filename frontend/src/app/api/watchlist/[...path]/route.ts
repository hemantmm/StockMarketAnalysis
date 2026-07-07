import { NextRequest, NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

const WATCHLIST_API_BASE = (
  process.env.WATCHLIST_API_BASE ||
  process.env.NEXT_PUBLIC_WATCHLIST_API_BASE ||
  (process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_API_BASE : undefined) ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '');

const forwardWatchlistRequest = async (request: NextRequest, context: RouteContext) => {
  const { path } = await context.params;
  const requestUrl = new URL(request.url);
  const targetUrl = `${WATCHLIST_API_BASE}/watchlist/${path.join('/')}${requestUrl.search}`;
  const body = request.method === 'GET' || request.method === 'HEAD'
    ? undefined
    : await request.text();

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
      },
      body,
      cache: 'no-store',
    });

    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Watchlist proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        message: `Could not reach watchlist backend at ${WATCHLIST_API_BASE}. Start it with: ./venv/bin/uvicorn main:app --reload`,
      },
      { status: 503 }
    );
  }
};

export const GET = forwardWatchlistRequest;
export const POST = forwardWatchlistRequest;

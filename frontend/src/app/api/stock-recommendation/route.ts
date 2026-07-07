import { NextRequest, NextResponse } from 'next/server';

const API_BASE = (
  process.env.STOCK_API_BASE ||
  process.env.WATCHLIST_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '');

export const POST = async (request: NextRequest) => {
  try {
    const response = await fetch(`${API_BASE}/api/stock-recommendation`, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
      },
      body: await request.text(),
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
    console.error('Stock recommendation proxy error:', error);
    return NextResponse.json(
      {
        error: `Could not reach stock backend at ${API_BASE}. Start it with: npm run dev:api`,
      },
      { status: 503 }
    );
  }
};

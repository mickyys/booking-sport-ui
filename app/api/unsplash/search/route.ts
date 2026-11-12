import { NextRequest, NextResponse } from 'next/server';

const UNSPLASH_API = 'https://api.unsplash.com/search/photos';

export async function GET(request: NextRequest) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.json(
      { error: 'UNSPLASH_ACCESS_KEY no configurada' },
      { status: 503 },
    );
  }

  const { searchParams } = request.nextUrl;
  const query = searchParams.get('query')?.trim();
  if (!query) {
    return NextResponse.json(
      { error: 'El parámetro query es obligatorio' },
      { status: 400 },
    );
  }

  const perPage = Math.min(Math.max(Number(searchParams.get('per_page')) || 9, 1), 30);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `${UNSPLASH_API}?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          'Accept-Version': 'v1',
        },
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Error de Unsplash (${response.status})` },
        { status: response.status === 401 || response.status === 403 ? 502 : response.status },
      );
    }

    const data = await response.json();

    const results = (data.results || []).map((photo: any) => ({
      id: photo.id,
      alt_description: photo.alt_description || '',
      urls: {
        small: photo.urls?.small || photo.urls?.thumb || '',
        regular: photo.urls?.regular || '',
      },
    }));

    return NextResponse.json({ results });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return NextResponse.json({ error: 'Timeout al consultar Unsplash' }, { status: 504 });
    }
    console.error('Error fetching Unsplash images:', err);
    return NextResponse.json({ error: 'Error al consultar Unsplash' }, { status: 500 });
  }
}

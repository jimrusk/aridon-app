import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
const CUSTOMER_SESSION_URL = 'https://pkshvdobcsoowlkoolmt.supabase.co/functions/v1/customer-session';

function cleanName(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, 120) : '';
}

function nameFromEmail(value: unknown) {
  if (typeof value !== 'string') return '';
  const local = value.split('@')[0]?.trim() || '';
  if (!local) return '';
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
    .slice(0, 120);
}

function firstName(value: string) {
  return value.split(/\s+/).find(Boolean) || value;
}

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization') || '';
    if (!authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Customer login required.' }, { status: 401, headers: NO_STORE });
    }

    const response = await fetch(CUSTOMER_SESSION_URL, {
      method: 'GET',
      headers: { Authorization: authorization },
      cache: 'no-store',
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(result, { status: response.status, headers: NO_STORE });
    }

    const token = authorization.slice(7).trim();
    let metadataName = '';
    let authEmail = '';
    try {
      const { data } = await getServerClient().auth.getUser(token);
      const metadata = data.user?.user_metadata || {};
      metadataName = cleanName(
        metadata.full_name || metadata.name || metadata.display_name || metadata.owner_name || metadata.first_name,
      );
      authEmail = cleanName(data.user?.email);
    } catch (error) {
      console.error('Customer name lookup error', error);
    }

    const ownerName = result?.role === 'owner' ? cleanName(result?.tenant?.owner_name) : '';
    const email = cleanName(result?.email) || authEmail;
    const displayName = metadataName || ownerName || nameFromEmail(email) || 'there';

    return NextResponse.json(
      {
        ...result,
        user: {
          name: displayName,
          first_name: displayName === 'there' ? 'there' : firstName(displayName),
          email,
        },
      },
      { status: response.status, headers: NO_STORE },
    );
  } catch (error) {
    console.error('Customer me error', error);
    return NextResponse.json({ error: 'Unable to load the customer account.' }, { status: 500, headers: NO_STORE });
  }
}

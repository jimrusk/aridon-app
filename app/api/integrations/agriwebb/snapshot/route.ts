import { NextRequest, NextResponse } from 'next/server';
import {
  AgriWebbTokenPayload,
  agriWebbGraphQL,
  openTokenPayload,
  refreshAgriWebbToken,
  sealTokenPayload,
} from '../../../../../lib/agriwebb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

const FARM_QUERY = `
  query AridonAgFarms($farmIds: [String]) {
    farms(farmIds: $farmIds) {
      id
      name
      timeZone
      fields(limit: 100) {
        id
        name
        farmId
        totalArea
        grazableArea
        unit
        landUse
        cropType
      }
    }
  }
`;

const FARM_OPERATIONS_QUERY = `
  query AridonAgFarmOperations($farmId: String!) {
    animalsWithCount(farmId: $farmId, limit: 1) {
      nonPagedCount
    }
    enterprises(farmId: $farmId, limit: 100) {
      enterpriseId
      name
      farmId
    }
    managementGroups(farmId: $farmId, limit: 100) {
      managementGroupId
      enterpriseId
      farmId
      name
      species
      type
    }
  }
`;

function tokenCookieOptions(request: NextRequest) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: request.nextUrl.protocol === 'https:',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  };
}

export async function GET(request: NextRequest) {
  try {
    const sealed = request.cookies.get('agriwebb_staging_token')?.value;
    if (!sealed) {
      return NextResponse.json({
        ok: false,
        connected: false,
        error: 'AgriWebb staging is not connected for this browser session.',
        connectUrl: '/integrations/agriwebb/install',
      }, { status: 401, headers: NO_STORE });
    }

    let token = openTokenPayload<AgriWebbTokenPayload>(sealed);
    let refreshed = false;
    if (!token.access_token) throw new Error('AgriWebb access token is missing.');
    if (token.expires_at <= Date.now() + 60_000) {
      token = await refreshAgriWebbToken(token);
      refreshed = true;
    }

    const allowedFarmIds = Array.isArray(token.allowedFarmIds) && token.allowedFarmIds.length
      ? token.allowedFarmIds
      : undefined;

    const farmData = await agriWebbGraphQL<{ farms?: any[] }>(token.access_token, FARM_QUERY, {
      farmIds: allowedFarmIds,
    });
    const farms = farmData?.farms || [];

    const operations = await Promise.all(farms.map(async (farm: any) => {
      const data = await agriWebbGraphQL<any>(token.access_token, FARM_OPERATIONS_QUERY, { farmId: farm.id });
      return {
        farmId: farm.id,
        animalCount: data?.animalsWithCount?.nonPagedCount ?? 0,
        enterprises: data?.enterprises || [],
        managementGroups: data?.managementGroups || [],
      };
    }));

    const response = NextResponse.json({
      ok: true,
      connected: true,
      environment: 'AgriWebb staging',
      mode: 'read-only',
      organization: token.organization || null,
      allowedFarmIds: token.allowedFarmIds || [],
      farms,
      operations,
      summary: {
        farmCount: farms.length,
        fieldCount: farms.reduce((total: number, farm: any) => total + (farm.fields?.length || 0), 0),
        animalCount: operations.reduce((total: number, item: any) => total + Number(item.animalCount || 0), 0),
        enterpriseCount: operations.reduce((total: number, item: any) => total + (item.enterprises?.length || 0), 0),
        managementGroupCount: operations.reduce((total: number, item: any) => total + (item.managementGroups?.length || 0), 0),
      },
      generatedAt: new Date().toISOString(),
    }, { headers: NO_STORE });

    if (refreshed) {
      response.cookies.set('agriwebb_staging_token', sealTokenPayload(token), tokenCookieOptions(request));
    }
    return response;
  } catch (error) {
    console.error('AgriWebb staging snapshot failed.', error);
    return NextResponse.json({
      ok: false,
      connected: false,
      error: error instanceof Error ? error.message : 'AgriWebb staging snapshot failed.',
      reconnectUrl: '/integrations/agriwebb/install',
    }, { status: 500, headers: NO_STORE });
  }
}

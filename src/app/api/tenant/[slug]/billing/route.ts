import { NextRequest } from 'next/server';
import { Routes } from '@/routes/routes';

/**
 * GET handler for tenant billing
 */
export async function GET(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  return Routes.handleTenantRoute(req);
}

/**
 * POST handler for updating tenant billing
 */
export async function POST(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  return Routes.handleTenantRoute(req);
}

/**
 * PUT handler for updating tenant billing
 */
export async function PUT(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  return Routes.handleTenantRoute(req);
}

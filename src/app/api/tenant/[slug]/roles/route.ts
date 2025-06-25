import { NextRequest } from 'next/server';
import { Routes } from '@/routes/routes';

/**
 * GET handler for tenant roles
 */
export async function GET(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  return Routes.handleTenantRoute(req);
}

/**
 * POST handler for creating tenant roles
 */
export async function POST(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  return Routes.handleTenantRoute(req);
}

/**
 * PUT handler for updating tenant roles
 */
export async function PUT(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  return Routes.handleTenantRoute(req);
}

/**
 * DELETE handler for removing tenant roles
 */
export async function DELETE(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  return Routes.handleTenantRoute(req);
}

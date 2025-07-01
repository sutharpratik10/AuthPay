import { Routes } from "@/routes/routes";

export const runtime = 'nodejs';

// Consolidated tenant route handlers
// Previously split across billing/, delete/, roles/, settings/, update/, and users/ folders
export const GET = Routes.handleTenantRoute;
export const POST = Routes.handleTenantRoute;
export const PUT = Routes.handleTenantRoute;
export const PATCH = Routes.handleTenantRoute;
export const DELETE = Routes.handleTenantRoute;

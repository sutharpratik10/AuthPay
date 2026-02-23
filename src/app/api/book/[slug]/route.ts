/**
 * Public Booking API - Get business by slug (No auth required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { businesses, services } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
    params: Promise<{ slug: string }>;
}

// GET: Get public business profile
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;

        const business = await db.query.businesses.findFirst({
            where: and(
                eq(businesses.slug, slug),
                eq(businesses.isActive, true)
            ),
            columns: {
                id: true,
                slug: true,
                name: true,
                description: true,
                logo: true,
                phone: true,
                email: true,
                address: true,
                timezone: true,
                bookingLeadTime: true,
                bookingWindowDays: true,
                slotDuration: true,
            },
        });

        if (!business) {
            return NextResponse.json(
                { error: 'Business not found' },
                { status: 404 }
            );
        }

        // Get active services
        const servicesList = await db.query.services.findMany({
            where: and(
                eq(services.businessId, business.id),
                eq(services.isActive, true)
            ),
            orderBy: (services, { asc }) => [asc(services.sortOrder), asc(services.name)],
            columns: {
                id: true,
                name: true,
                description: true,
                duration: true,
                price: true,
                currency: true,
                color: true,
            },
        });

        return NextResponse.json({
            business,
            services: servicesList,
        });
    } catch (error) {
        console.error('Error fetching business:', error);
        return NextResponse.json(
            { error: 'Failed to fetch business' },
            { status: 500 }
        );
    }
}

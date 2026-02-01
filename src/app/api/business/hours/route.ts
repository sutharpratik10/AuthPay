/**
 * Business Hours API - GET and PUT
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { db } from '@/server/db';
import { businessHours } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { getUserBusiness } from '@/lib/api/subscription-check';

// GET: Get business hours
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const business = await getUserBusiness(session.user.id);
        if (!business) {
            return NextResponse.json(
                { error: 'Business not found', code: 'NO_BUSINESS' },
                { status: 404 }
            );
        }

        const hours = await db.query.businessHours.findMany({
            where: eq(businessHours.businessId, business.id),
            orderBy: (hours, { asc }) => [asc(hours.dayOfWeek)],
        });

        return NextResponse.json({ hours });
    } catch (error) {
        console.error('Error fetching business hours:', error);
        return NextResponse.json(
            { error: 'Failed to fetch business hours' },
            { status: 500 }
        );
    }
}

// PUT: Update business hours
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const business = await getUserBusiness(session.user.id);
        if (!business) {
            return NextResponse.json(
                { error: 'Business not found' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { hours } = body;

        if (!Array.isArray(hours) || hours.length !== 7) {
            return NextResponse.json(
                { error: 'Hours must be an array of 7 days (Sunday-Saturday)' },
                { status: 400 }
            );
        }

        // Validate each day
        for (const day of hours) {
            if (day.dayOfWeek < 0 || day.dayOfWeek > 6) {
                return NextResponse.json(
                    { error: 'Invalid day of week' },
                    { status: 400 }
                );
            }
            if (!day.isClosed && (!day.openTime || !day.closeTime)) {
                return NextResponse.json(
                    { error: 'Open and close times required for non-closed days' },
                    { status: 400 }
                );
            }
        }

        // Delete existing hours and insert new ones
        await db.delete(businessHours).where(eq(businessHours.businessId, business.id));

        const newHours = await db.insert(businessHours).values(
            hours.map((h: { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }) => ({
                businessId: business.id,
                dayOfWeek: h.dayOfWeek,
                openTime: h.openTime || '09:00',
                closeTime: h.closeTime || '18:00',
                isClosed: h.isClosed || false,
            }))
        ).returning();

        return NextResponse.json({
            hours: newHours,
            message: 'Business hours updated successfully'
        });
    } catch (error) {
        console.error('Error updating business hours:', error);
        return NextResponse.json(
            { error: 'Failed to update business hours' },
            { status: 500 }
        );
    }
}

/**
 * Blocked Dates API - List and Create blocked dates
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { db } from '@/server/db';
import { blockedDates } from '@/server/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { getUserBusiness } from '@/lib/api/subscription-check';

// GET: List blocked dates
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

        // Get future blocked dates
        const dates = await db.query.blockedDates.findMany({
            where: and(
                eq(blockedDates.businessId, business.id),
                gte(blockedDates.date, new Date())
            ),
            orderBy: (dates, { asc }) => [asc(dates.date)],
        });

        return NextResponse.json({ blockedDates: dates });
    } catch (error) {
        console.error('Error fetching blocked dates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch blocked dates' },
            { status: 500 }
        );
    }
}

// POST: Add a blocked date
export async function POST(request: NextRequest) {
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
        const { date, reason } = body;

        if (!date) {
            return NextResponse.json(
                { error: 'Date is required' },
                { status: 400 }
            );
        }

        const blockedDate = new Date(date);
        if (isNaN(blockedDate.getTime())) {
            return NextResponse.json(
                { error: 'Invalid date format' },
                { status: 400 }
            );
        }

        const [newBlockedDate] = await db.insert(blockedDates).values({
            businessId: business.id,
            date: blockedDate,
            reason: reason?.trim() || null,
        }).returning();

        return NextResponse.json({
            blockedDate: newBlockedDate,
            message: 'Blocked date added successfully'
        }, { status: 201 });
    } catch (error) {
        console.error('Error adding blocked date:', error);
        return NextResponse.json(
            { error: 'Failed to add blocked date' },
            { status: 500 }
        );
    }
}

// DELETE: Remove a blocked date by ID (in query param)
export async function DELETE(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Blocked date ID is required' },
                { status: 400 }
            );
        }

        // Verify blocked date belongs to business
        const existing = await db.query.blockedDates.findFirst({
            where: and(
                eq(blockedDates.id, id),
                eq(blockedDates.businessId, business.id)
            ),
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Blocked date not found' },
                { status: 404 }
            );
        }

        await db.delete(blockedDates).where(eq(blockedDates.id, id));

        return NextResponse.json({
            message: 'Blocked date removed successfully'
        });
    } catch (error) {
        console.error('Error removing blocked date:', error);
        return NextResponse.json(
            { error: 'Failed to remove blocked date' },
            { status: 500 }
        );
    }
}

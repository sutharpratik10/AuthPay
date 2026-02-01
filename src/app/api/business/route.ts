/**
 * Business API - GET and POST
 * 
 * GET: Retrieve current user's business profile
 * POST: Create a new business (requires active subscription)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { db } from '@/server/db';
import { businesses, businessHours } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import {
    requireActiveSubscription,
    getUserBusiness,
    isSlugAvailable,
    generateSlug
} from '@/lib/api/subscription-check';

// GET: Get current user's business
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

        return NextResponse.json({ business });
    } catch (error) {
        console.error('Error fetching business:', error);
        return NextResponse.json(
            { error: 'Failed to fetch business' },
            { status: 500 }
        );
    }
}

// POST: Create a new business
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check subscription
        try {
            await requireActiveSubscription(session.user.id);
        } catch {
            return NextResponse.json(
                { error: 'Active subscription required', code: 'SUBSCRIPTION_REQUIRED' },
                { status: 403 }
            );
        }

        // Check if user already has a business
        const existingBusiness = await getUserBusiness(session.user.id);
        if (existingBusiness) {
            return NextResponse.json(
                { error: 'You already have a business', code: 'BUSINESS_EXISTS' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name, description, phone, email, address, timezone } = body;

        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return NextResponse.json(
                { error: 'Business name is required (min 2 characters)' },
                { status: 400 }
            );
        }

        // Generate unique slug
        let slug = generateSlug(name);
        let slugSuffix = 0;
        while (!(await isSlugAvailable(slug))) {
            slugSuffix++;
            slug = `${generateSlug(name)}-${slugSuffix}`;
        }

        // Create business
        const [newBusiness] = await db.insert(businesses).values({
            ownerId: session.user.id,
            slug,
            name: name.trim(),
            description: description?.trim() || null,
            phone: phone?.trim() || null,
            email: email?.trim() || null,
            address: address?.trim() || null,
            timezone: timezone || 'Asia/Kolkata',
        }).returning();

        // Create default business hours (Mon-Fri 9:00-18:00, Sat-Sun closed)
        const defaultHours = [
            { dayOfWeek: 0, openTime: '09:00', closeTime: '18:00', isClosed: true },  // Sunday
            { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isClosed: false }, // Monday
            { dayOfWeek: 2, openTime: '09:00', closeTime: '18:00', isClosed: false }, // Tuesday
            { dayOfWeek: 3, openTime: '09:00', closeTime: '18:00', isClosed: false }, // Wednesday
            { dayOfWeek: 4, openTime: '09:00', closeTime: '18:00', isClosed: false }, // Thursday
            { dayOfWeek: 5, openTime: '09:00', closeTime: '18:00', isClosed: false }, // Friday
            { dayOfWeek: 6, openTime: '09:00', closeTime: '18:00', isClosed: true },  // Saturday
        ];

        await db.insert(businessHours).values(
            defaultHours.map(h => ({
                businessId: newBusiness.id,
                ...h,
            }))
        );

        return NextResponse.json({
            business: newBusiness,
            message: 'Business created successfully'
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating business:', error);
        return NextResponse.json(
            { error: 'Failed to create business' },
            { status: 500 }
        );
    }
}

// PUT: Update business
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
        const {
            name, description, phone, email, address, timezone,
            bookingLeadTime, bookingWindowDays, slotDuration, isActive
        } = body;

        const updateData: Record<string, unknown> = { updatedAt: new Date() };

        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description?.trim() || null;
        if (phone !== undefined) updateData.phone = phone?.trim() || null;
        if (email !== undefined) updateData.email = email?.trim() || null;
        if (address !== undefined) updateData.address = address?.trim() || null;
        if (timezone !== undefined) updateData.timezone = timezone;
        if (bookingLeadTime !== undefined) updateData.bookingLeadTime = bookingLeadTime;
        if (bookingWindowDays !== undefined) updateData.bookingWindowDays = bookingWindowDays;
        if (slotDuration !== undefined) updateData.slotDuration = slotDuration;
        if (isActive !== undefined) updateData.isActive = isActive;

        const [updatedBusiness] = await db
            .update(businesses)
            .set(updateData)
            .where(eq(businesses.id, business.id))
            .returning();

        return NextResponse.json({
            business: updatedBusiness,
            message: 'Business updated successfully'
        });
    } catch (error) {
        console.error('Error updating business:', error);
        return NextResponse.json(
            { error: 'Failed to update business' },
            { status: 500 }
        );
    }
}

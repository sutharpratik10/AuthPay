/**
 * Services API - List and Create services for a business
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { db } from '@/server/db';
import { services } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { getUserBusiness, requireActiveSubscription } from '@/lib/api/subscription-check';

// GET: List all services for current user's business
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

        const servicesList = await db.query.services.findMany({
            where: eq(services.businessId, business.id),
            orderBy: (services, { asc }) => [asc(services.sortOrder), asc(services.name)],
        });

        return NextResponse.json({ services: servicesList });
    } catch (error) {
        console.error('Error fetching services:', error);
        return NextResponse.json(
            { error: 'Failed to fetch services' },
            { status: 500 }
        );
    }
}

// POST: Create a new service
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

        const business = await getUserBusiness(session.user.id);
        if (!business) {
            return NextResponse.json(
                { error: 'Business not found. Create a business first.', code: 'NO_BUSINESS' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { name, description, duration, price, currency, color, isActive, sortOrder } = body;

        // Validation
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return NextResponse.json(
                { error: 'Service name is required (min 2 characters)' },
                { status: 400 }
            );
        }

        if (!duration || typeof duration !== 'number' || duration < 5) {
            return NextResponse.json(
                { error: 'Duration is required (min 5 minutes)' },
                { status: 400 }
            );
        }

        const [newService] = await db.insert(services).values({
            businessId: business.id,
            name: name.trim(),
            description: description?.trim() || null,
            duration,
            price: price || 0,
            currency: currency || 'INR',
            color: color || '#3B82F6',
            isActive: isActive !== false,
            sortOrder: sortOrder || 0,
        }).returning();

        return NextResponse.json({
            service: newService,
            message: 'Service created successfully'
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating service:', error);
        return NextResponse.json(
            { error: 'Failed to create service' },
            { status: 500 }
        );
    }
}

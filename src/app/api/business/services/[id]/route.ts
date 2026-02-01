/**
 * Service by ID API - GET, PUT, DELETE
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { db } from '@/server/db';
import { services } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserBusiness } from '@/lib/api/subscription-check';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Get a specific service
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
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

        const service = await db.query.services.findFirst({
            where: and(
                eq(services.id, id),
                eq(services.businessId, business.id)
            ),
        });

        if (!service) {
            return NextResponse.json(
                { error: 'Service not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ service });
    } catch (error) {
        console.error('Error fetching service:', error);
        return NextResponse.json(
            { error: 'Failed to fetch service' },
            { status: 500 }
        );
    }
}

// PUT: Update a service
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
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

        // Verify service belongs to business
        const existingService = await db.query.services.findFirst({
            where: and(
                eq(services.id, id),
                eq(services.businessId, business.id)
            ),
        });

        if (!existingService) {
            return NextResponse.json(
                { error: 'Service not found' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { name, description, duration, price, currency, color, isActive, sortOrder } = body;

        const updateData: Record<string, unknown> = { updatedAt: new Date() };

        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description?.trim() || null;
        if (duration !== undefined) updateData.duration = duration;
        if (price !== undefined) updateData.price = price;
        if (currency !== undefined) updateData.currency = currency;
        if (color !== undefined) updateData.color = color;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

        const [updatedService] = await db
            .update(services)
            .set(updateData)
            .where(eq(services.id, id))
            .returning();

        return NextResponse.json({
            service: updatedService,
            message: 'Service updated successfully'
        });
    } catch (error) {
        console.error('Error updating service:', error);
        return NextResponse.json(
            { error: 'Failed to update service' },
            { status: 500 }
        );
    }
}

// DELETE: Delete a service
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
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

        // Verify service belongs to business
        const existingService = await db.query.services.findFirst({
            where: and(
                eq(services.id, id),
                eq(services.businessId, business.id)
            ),
        });

        if (!existingService) {
            return NextResponse.json(
                { error: 'Service not found' },
                { status: 404 }
            );
        }

        await db.delete(services).where(eq(services.id, id));

        return NextResponse.json({
            message: 'Service deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting service:', error);
        return NextResponse.json(
            { error: 'Failed to delete service' },
            { status: 500 }
        );
    }
}

/**
 * Appointment by ID API - View, update, cancel appointments
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { db } from '@/server/db';
import { appointments } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserBusiness } from '@/lib/api/subscription-check';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Get appointment details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const session = await auth();

        const appointment = await db.query.appointments.findFirst({
            where: eq(appointments.id, id),
            with: {
                service: true,
                business: {
                    columns: {
                        name: true,
                        phone: true,
                        email: true,
                        address: true,
                    },
                },
            },
        });

        if (!appointment) {
            return NextResponse.json(
                { error: 'Appointment not found' },
                { status: 404 }
            );
        }

        // Check authorization: customer, business owner, or email match
        const isCustomer = session?.user?.id === appointment.customerId;
        let isOwner = false;

        if (session?.user?.id) {
            const business = await getUserBusiness(session.user.id);
            isOwner = business?.id === appointment.businessId;
        }

        // For non-authenticated access, they can view by ID only
        // (typically accessed via confirmation email link)

        return NextResponse.json({ appointment });
    } catch (error) {
        console.error('Error fetching appointment:', error);
        return NextResponse.json(
            { error: 'Failed to fetch appointment' },
            { status: 500 }
        );
    }
}

// PUT: Update appointment status (for business owners)
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
                { error: 'Not authorized' },
                { status: 403 }
            );
        }

        // Verify appointment belongs to business
        const appointment = await db.query.appointments.findFirst({
            where: and(
                eq(appointments.id, id),
                eq(appointments.businessId, business.id)
            ),
        });

        if (!appointment) {
            return NextResponse.json(
                { error: 'Appointment not found' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { status, notes } = body;

        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            );
        }

        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;

        if (status === 'cancelled') {
            updateData.cancelledAt = new Date();
        }

        const [updatedAppointment] = await db
            .update(appointments)
            .set(updateData)
            .where(eq(appointments.id, id))
            .returning();

        return NextResponse.json({
            appointment: updatedAppointment,
            message: 'Appointment updated successfully'
        });
    } catch (error) {
        console.error('Error updating appointment:', error);
        return NextResponse.json(
            { error: 'Failed to update appointment' },
            { status: 500 }
        );
    }
}

// DELETE: Cancel appointment (for customers or business owners)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const session = await auth();
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        const reason = searchParams.get('reason');

        const appointment = await db.query.appointments.findFirst({
            where: eq(appointments.id, id),
        });

        if (!appointment) {
            return NextResponse.json(
                { error: 'Appointment not found' },
                { status: 404 }
            );
        }

        // Check authorization
        let authorized = false;

        // Customer with matching email can cancel
        if (email && appointment.customerEmail.toLowerCase() === email.toLowerCase()) {
            authorized = true;
        }

        // Logged in customer
        if (session?.user?.id === appointment.customerId) {
            authorized = true;
        }

        // Business owner
        if (session?.user?.id) {
            const business = await getUserBusiness(session.user.id);
            if (business?.id === appointment.businessId) {
                authorized = true;
            }
        }

        if (!authorized) {
            return NextResponse.json(
                { error: 'Not authorized to cancel this appointment' },
                { status: 403 }
            );
        }

        // Cancel instead of delete
        const [cancelledAppointment] = await db
            .update(appointments)
            .set({
                status: 'cancelled',
                cancelledAt: new Date(),
                cancellationReason: reason || 'Cancelled by customer',
                updatedAt: new Date(),
            })
            .where(eq(appointments.id, id))
            .returning();

        return NextResponse.json({
            appointment: cancelledAppointment,
            message: 'Appointment cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        return NextResponse.json(
            { error: 'Failed to cancel appointment' },
            { status: 500 }
        );
    }
}

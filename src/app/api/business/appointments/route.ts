/**
 * Business Appointments API - List appointments for business owner
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { db } from '@/server/db';
import { appointments } from '@/server/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { getUserBusiness } from '@/lib/api/subscription-check';

// GET: List all appointments for current user's business
export async function GET(request: NextRequest) {
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

        // Get query params for filtering
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build conditions
        const conditions = [eq(appointments.businessId, business.id)];

        if (status) {
            conditions.push(eq(appointments.status, status));
        }

        if (startDate) {
            conditions.push(gte(appointments.appointmentDate, new Date(startDate)));
        }

        if (endDate) {
            conditions.push(lte(appointments.appointmentDate, new Date(endDate)));
        }

        const appointmentsList = await db.query.appointments.findMany({
            where: and(...conditions),
            with: {
                service: true,
            },
            orderBy: [desc(appointments.appointmentDate)],
            limit,
            offset,
        });

        // Get total count for pagination
        const allAppointments = await db.query.appointments.findMany({
            where: and(...conditions),
            columns: { id: true },
        });

        return NextResponse.json({
            appointments: appointmentsList,
            total: allAppointments.length,
            limit,
            offset,
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch appointments' },
            { status: 500 }
        );
    }
}

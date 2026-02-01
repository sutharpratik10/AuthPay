/**
 * Available Slots API - Get available time slots for booking (No auth required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { businesses, services, businessHours, blockedDates, appointments } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
    params: Promise<{ slug: string }>;
}

// GET: Get available slots for a date
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');
        const serviceId = searchParams.get('serviceId');

        if (!dateStr) {
            return NextResponse.json(
                { error: 'Date is required (YYYY-MM-DD)' },
                { status: 400 }
            );
        }

        if (!serviceId) {
            return NextResponse.json(
                { error: 'Service ID is required' },
                { status: 400 }
            );
        }

        // Get business
        const business = await db.query.businesses.findFirst({
            where: and(
                eq(businesses.slug, slug),
                eq(businesses.isActive, true)
            ),
        });

        if (!business) {
            return NextResponse.json(
                { error: 'Business not found' },
                { status: 404 }
            );
        }

        // Get service
        const service = await db.query.services.findFirst({
            where: and(
                eq(services.id, serviceId),
                eq(services.businessId, business.id),
                eq(services.isActive, true)
            ),
        });

        if (!service) {
            return NextResponse.json(
                { error: 'Service not found' },
                { status: 404 }
            );
        }

        // Parse date
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            return NextResponse.json(
                { error: 'Invalid date format' },
                { status: 400 }
            );
        }

        const dayOfWeek = date.getDay();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if date is in the past
        if (date < today) {
            return NextResponse.json({
                slots: [],
                message: 'Date is in the past'
            });
        }

        // Check booking window
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + (business.bookingWindowDays || 30));
        if (date > maxDate) {
            return NextResponse.json({
                slots: [],
                message: 'Date is beyond booking window'
            });
        }

        // Check if date is blocked
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const blocked = await db.query.blockedDates.findFirst({
            where: and(
                eq(blockedDates.businessId, business.id),
            ),
        });

        // Check if any blocked date matches
        const allBlocked = await db.query.blockedDates.findMany({
            where: eq(blockedDates.businessId, business.id),
        });

        const isBlocked = allBlocked.some(b => {
            const blockedDate = new Date(b.date);
            return blockedDate.toDateString() === date.toDateString();
        });

        if (isBlocked) {
            return NextResponse.json({
                slots: [],
                message: 'This date is not available for booking'
            });
        }

        // Get business hours for this day
        const hours = await db.query.businessHours.findFirst({
            where: and(
                eq(businessHours.businessId, business.id),
                eq(businessHours.dayOfWeek, dayOfWeek)
            ),
        });

        if (!hours || hours.isClosed) {
            return NextResponse.json({
                slots: [],
                message: 'Business is closed on this day'
            });
        }

        // Get existing appointments for this date
        const existingAppointments = await db.query.appointments.findMany({
            where: and(
                eq(appointments.businessId, business.id),
            ),
        });

        // Filter to appointments on this specific date
        const dayAppointments = existingAppointments.filter(apt => {
            const aptDate = new Date(apt.appointmentDate);
            return aptDate.toDateString() === date.toDateString() &&
                apt.status !== 'cancelled';
        });

        // Generate available slots
        const slots = generateTimeSlots(
            hours.openTime,
            hours.closeTime,
            service.duration,
            business.slotDuration || 30,
            dayAppointments,
            business.bookingLeadTime || 60,
            date
        );

        return NextResponse.json({ slots });
    } catch (error) {
        console.error('Error fetching slots:', error);
        return NextResponse.json(
            { error: 'Failed to fetch available slots' },
            { status: 500 }
        );
    }
}

interface Appointment {
    startTime: string;
    endTime: string;
}

function generateTimeSlots(
    openTime: string,
    closeTime: string,
    serviceDuration: number,
    slotInterval: number,
    existingAppointments: Appointment[],
    leadTimeMinutes: number,
    date: Date
): { time: string; available: boolean }[] {
    const slots: { time: string; available: boolean }[] = [];

    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);

    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    // Calculate minimum booking time based on lead time
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    let minBookingMinutes = 0;

    if (isToday) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        minBookingMinutes = currentMinutes + leadTimeMinutes;
    }

    // Generate slots at intervals
    for (let minutes = openMinutes; minutes + serviceDuration <= closeMinutes; minutes += slotInterval) {
        const hour = Math.floor(minutes / 60);
        const min = minutes % 60;
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

        // Check if slot is after minimum booking time
        if (isToday && minutes < minBookingMinutes) {
            continue; // Skip slots that are too soon
        }

        // Check if slot overlaps with existing appointments
        const slotEnd = minutes + serviceDuration;
        const isBooked = existingAppointments.some(apt => {
            const [aptStartHour, aptStartMin] = apt.startTime.split(':').map(Number);
            const [aptEndHour, aptEndMin] = apt.endTime.split(':').map(Number);
            const aptStart = aptStartHour * 60 + aptStartMin;
            const aptEnd = aptEndHour * 60 + aptEndMin;

            // Check for overlap
            return (minutes < aptEnd && slotEnd > aptStart);
        });

        slots.push({
            time: timeStr,
            available: !isBooked,
        });
    }

    return slots;
}

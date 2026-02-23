/**
 * Create Appointment API - Book an appointment (No auth required for guest booking)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { db } from '@/server/db';
import { businesses, services, appointments, businessHours, blockedDates, users } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { emailService } from '@/server/services/email';

interface RouteParams {
    params: Promise<{ slug: string }>;
}

// POST: Create a new appointment
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;
        const session = await auth();

        const body = await request.json();
        const { serviceId, date, time, customerName, customerEmail, customerPhone, notes } = body;

        // Validation
        if (!serviceId) {
            return NextResponse.json(
                { error: 'Service is required' },
                { status: 400 }
            );
        }

        if (!date) {
            return NextResponse.json(
                { error: 'Date is required' },
                { status: 400 }
            );
        }

        if (!time) {
            return NextResponse.json(
                { error: 'Time is required' },
                { status: 400 }
            );
        }

        if (!customerName || customerName.trim().length < 2) {
            return NextResponse.json(
                { error: 'Customer name is required (min 2 characters)' },
                { status: 400 }
            );
        }

        if (!customerEmail || !isValidEmail(customerEmail)) {
            return NextResponse.json(
                { error: 'Valid email is required' },
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

        // Parse and validate date
        const appointmentDate = new Date(date);
        if (isNaN(appointmentDate.getTime())) {
            return NextResponse.json(
                { error: 'Invalid date format' },
                { status: 400 }
            );
        }

        // Validate time format
        if (!/^\d{2}:\d{2}$/.test(time)) {
            return NextResponse.json(
                { error: 'Invalid time format (HH:MM)' },
                { status: 400 }
            );
        }

        const dayOfWeek = appointmentDate.getDay();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if date is in the past
        if (appointmentDate < today) {
            return NextResponse.json(
                { error: 'Cannot book appointments in the past' },
                { status: 400 }
            );
        }

        // Check booking window
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + (business.bookingWindowDays || 30));
        if (appointmentDate > maxDate) {
            return NextResponse.json(
                { error: 'Date is beyond booking window' },
                { status: 400 }
            );
        }

        // Check if date is blocked
        const allBlocked = await db.query.blockedDates.findMany({
            where: eq(blockedDates.businessId, business.id),
        });

        const isBlocked = allBlocked.some(b => {
            const blockedDate = new Date(b.date);
            return blockedDate.toDateString() === appointmentDate.toDateString();
        });

        if (isBlocked) {
            return NextResponse.json(
                { error: 'This date is not available for booking' },
                { status: 400 }
            );
        }

        // Get business hours
        const hours = await db.query.businessHours.findFirst({
            where: and(
                eq(businessHours.businessId, business.id),
                eq(businessHours.dayOfWeek, dayOfWeek)
            ),
        });

        if (!hours || hours.isClosed) {
            return NextResponse.json(
                { error: 'Business is closed on this day' },
                { status: 400 }
            );
        }

        // Calculate end time
        const [startHour, startMin] = time.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = startMinutes + service.duration;
        const endHour = Math.floor(endMinutes / 60);
        const endMin = endMinutes % 60;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

        // Check for conflicting appointments
        const existingAppointments = await db.query.appointments.findMany({
            where: eq(appointments.businessId, business.id),
        });

        const dayAppointments = existingAppointments.filter(apt => {
            const aptDate = new Date(apt.appointmentDate);
            return aptDate.toDateString() === appointmentDate.toDateString() &&
                apt.status !== 'cancelled';
        });

        const hasConflict = dayAppointments.some(apt => {
            const [aptStartHour, aptStartMin] = apt.startTime.split(':').map(Number);
            const [aptEndHour, aptEndMin] = apt.endTime.split(':').map(Number);
            const aptStart = aptStartHour * 60 + aptStartMin;
            const aptEnd = aptEndHour * 60 + aptEndMin;

            return (startMinutes < aptEnd && endMinutes > aptStart);
        });

        if (hasConflict) {
            return NextResponse.json(
                { error: 'This time slot is no longer available' },
                { status: 409 }
            );
        }

        // Create appointment
        const [newAppointment] = await db.insert(appointments).values({
            businessId: business.id,
            serviceId: service.id,
            customerId: session?.user?.id || null,
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim().toLowerCase(),
            customerPhone: customerPhone?.trim() || null,
            appointmentDate,
            startTime: time,
            endTime,
            status: 'confirmed',
            notes: notes?.trim() || null,
        }).returning();

        // Prepare booking details for emails
        const bookingDetails = {
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim().toLowerCase(),
            customerPhone: customerPhone?.trim(),
            serviceName: service.name,
            date: appointmentDate.toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            startTime: time,
            endTime,
            duration: service.duration,
            price: service.price ?? 0,
            currency: service.currency ?? 'INR',
            businessName: business.name,
            businessAddress: business.address || undefined,
            businessPhone: business.phone || undefined,
            businessEmail: business.email || undefined,
            bookingId: newAppointment.id,
            notes: notes?.trim() || undefined,
        };

        // Send confirmation email to customer (async, don't block response)
        console.log('[Appointments API] Sending booking confirmation email to customer:', bookingDetails.customerEmail);
        emailService.sendBookingConfirmationToCustomer(bookingDetails)
            .then((result) => {
                console.log('[Appointments API] Customer email result:', result);
            })
            .catch((err) => {
                console.error('[Appointments API] Failed to send customer confirmation email:', err);
            });

        // Get business owner email and send notification
        const businessOwner = await db.query.users.findFirst({
            where: eq(users.id, business.ownerId),
        });

        console.log('[Appointments API] Business owner:', businessOwner?.email || 'NOT FOUND');

        if (businessOwner?.email) {
            console.log('[Appointments API] Sending booking notification to business:', businessOwner.email);
            emailService.sendBookingNotificationToBusiness(bookingDetails, businessOwner.email)
                .then((result) => {
                    console.log('[Appointments API] Business email result:', result);
                })
                .catch((err) => {
                    console.error('[Appointments API] Failed to send business notification email:', err);
                });
        }

        return NextResponse.json({
            appointment: {
                id: newAppointment.id,
                date: appointmentDate.toISOString().split('T')[0],
                startTime: time,
                endTime,
                service: {
                    name: service.name,
                    duration: service.duration,
                    price: service.price,
                    currency: service.currency,
                },
                business: {
                    name: business.name,
                    phone: business.phone,
                    email: business.email,
                    address: business.address,
                },
            },
            message: 'Appointment booked successfully'
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating appointment:', error);
        return NextResponse.json(
            { error: 'Failed to create appointment' },
            { status: 500 }
        );
    }
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

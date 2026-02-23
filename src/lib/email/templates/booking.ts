/**
 * Booking Confirmation Email Templates
 * Templates for customer and business owner booking notifications
 */

import { baseEmailTemplate } from './base';

interface BookingDetails {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    serviceName: string;
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    price: number;
    currency: string;
    businessName: string;
    businessAddress?: string;
    businessPhone?: string;
    businessEmail?: string;
    bookingId: string;
    notes?: string;
}

/**
 * Format price with currency
 */
const formatPrice = (price: number, currency: string): string => {
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
    }).format(price / 100);
};

/**
 * Booking confirmed email - sent to customer
 */
export const bookingConfirmationCustomerTemplate = (
    booking: BookingDetails,
    appName: string
): string => {
    const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background-color: #10B981; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 30px;">✓</span>
      </div>
      <h1 style="color: #333333; font-size: 24px; margin: 0;">Booking Confirmed!</h1>
      <p style="color: #666666; font-size: 14px; margin-top: 10px;">
        Hi ${booking.customerName}, your appointment has been successfully booked.
      </p>
    </div>

    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="color: #333333; font-size: 18px; margin: 0 0 15px;">Appointment Details</h2>
      
      <div style="margin-bottom: 12px;">
        <p style="color: #666666; font-size: 12px; margin: 0; text-transform: uppercase;">Service</p>
        <p style="color: #333333; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${booking.serviceName}</p>
      </div>
      
      <div style="margin-bottom: 12px;">
        <p style="color: #666666; font-size: 12px; margin: 0; text-transform: uppercase;">Date & Time</p>
        <p style="color: #333333; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${booking.date}</p>
        <p style="color: #333333; font-size: 14px; margin: 2px 0 0;">${booking.startTime} - ${booking.endTime} (${booking.duration} minutes)</p>
      </div>
      
      <div style="margin-bottom: 12px;">
        <p style="color: #666666; font-size: 12px; margin: 0; text-transform: uppercase;">Price</p>
        <p style="color: #4F46E5; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${formatPrice(booking.price, booking.currency)}</p>
      </div>
      
      <div style="border-top: 1px solid #e9ecef; padding-top: 15px; margin-top: 15px;">
        <p style="color: #666666; font-size: 12px; margin: 0; text-transform: uppercase;">Location</p>
        <p style="color: #333333; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${booking.businessName}</p>
        ${booking.businessAddress ? `<p style="color: #666666; font-size: 14px; margin: 4px 0 0;">${booking.businessAddress}</p>` : ''}
        ${booking.businessPhone ? `<p style="color: #666666; font-size: 14px; margin: 4px 0 0;">📞 ${booking.businessPhone}</p>` : ''}
      </div>
    </div>

    <div style="background-color: #EEF2FF; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="color: #333333; font-size: 12px; margin: 0;">
        <strong>Booking ID:</strong> ${booking.bookingId}
      </p>
      <p style="color: #666666; font-size: 12px; margin: 5px 0 0;">
        Please save this ID for your reference. You may need it for any changes or cancellations.
      </p>
    </div>

    ${booking.notes ? `
    <div style="margin: 20px 0;">
      <p style="color: #666666; font-size: 12px; margin: 0; text-transform: uppercase;">Your Notes</p>
      <p style="color: #333333; font-size: 14px; margin: 4px 0 0;">${booking.notes}</p>
    </div>
    ` : ''}

    <div style="margin-top: 30px;">
      <p style="color: #666666; font-size: 14px;">
        Need to make changes? Contact the business directly:
      </p>
      ${booking.businessEmail ? `<p style="color: #333333; font-size: 14px; margin: 5px 0;">📧 ${booking.businessEmail}</p>` : ''}
      ${booking.businessPhone ? `<p style="color: #333333; font-size: 14px; margin: 5px 0;">📞 ${booking.businessPhone}</p>` : ''}
    </div>
  `;

    return baseEmailTemplate(content, appName);
};

/**
 * New booking notification - sent to business owner
 */
export const bookingNotificationBusinessTemplate = (
    booking: BookingDetails,
    appName: string
): string => {
    const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background-color: #4F46E5; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 30px;">📅</span>
      </div>
      <h1 style="color: #333333; font-size: 24px; margin: 0;">New Booking Received!</h1>
      <p style="color: #666666; font-size: 14px; margin-top: 10px;">
        You have a new appointment scheduled.
      </p>
    </div>

    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="color: #333333; font-size: 18px; margin: 0 0 15px;">Appointment Details</h2>
      
      <div style="margin-bottom: 12px;">
        <p style="color: #666666; font-size: 12px; margin: 0; text-transform: uppercase;">Customer</p>
        <p style="color: #333333; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${booking.customerName}</p>
        <p style="color: #333333; font-size: 14px; margin: 2px 0 0;">📧 ${booking.customerEmail}</p>
        ${booking.customerPhone ? `<p style="color: #333333; font-size: 14px; margin: 2px 0 0;">📞 ${booking.customerPhone}</p>` : ''}
      </div>
      
      <div style="margin-bottom: 12px;">
        <p style="color: #666666; font-size: 12px; margin: 0; text-transform: uppercase;">Service</p>
        <p style="color: #333333; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${booking.serviceName}</p>
      </div>
      
      <div style="margin-bottom: 12px;">
        <p style="color: #666666; font-size: 12px; margin: 0; text-transform: uppercase;">Date & Time</p>
        <p style="color: #333333; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${booking.date}</p>
        <p style="color: #333333; font-size: 14px; margin: 2px 0 0;">${booking.startTime} - ${booking.endTime} (${booking.duration} minutes)</p>
      </div>
      
      <div style="margin-bottom: 12px;">
        <p style="color: #666666; font-size: 12px; margin: 0; text-transform: uppercase;">Price</p>
        <p style="color: #4F46E5; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${formatPrice(booking.price, booking.currency)}</p>
      </div>
    </div>

    ${booking.notes ? `
    <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="color: #333333; font-size: 12px; margin: 0; text-transform: uppercase; font-weight: 600;">Customer Notes</p>
      <p style="color: #333333; font-size: 14px; margin: 8px 0 0;">${booking.notes}</p>
    </div>
    ` : ''}

    <div style="background-color: #f0fdf4; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="color: #333333; font-size: 12px; margin: 0;">
        <strong>Booking ID:</strong> ${booking.bookingId}
      </p>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #666666; font-size: 14px;">
        Manage this appointment in your dashboard.
      </p>
    </div>
  `;

    return baseEmailTemplate(content, appName);
};

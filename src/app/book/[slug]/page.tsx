'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format, isSameDay, addDays, isWeekend } from 'date-fns';

interface Business {
    id: string;
    name: string;
    description: string | null;
    logo: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    timezone: string;
    bookingWindowDays: number;
}

interface Service {
    id: string;
    name: string;
    description: string | null;
    duration: number;
    price: number;
    currency: string;
    color: string | null;
}

interface Slot {
    time: string;
    available: boolean;
}

interface BookingConfirmation {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    service: {
        name: string;
        duration: number;
        price: number;
        currency: string;
    };
    business: {
        name: string;
        phone: string | null;
        email: string | null;
        address: string | null;
    };
}

// Color coding for availability states
const AVAILABILITY_COLORS = {
    available: {
        name: 'Available',
        bg: 'bg-teal-500',
        text: 'text-teal-600 dark:text-teal-400',
        border: 'border-teal-500',
        light: 'bg-teal-50 dark:bg-teal-950/30',
    },
    limited: {
        name: 'Limited',
        bg: 'bg-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500',
        light: 'bg-amber-50 dark:bg-amber-950/30',
    },
    unavailable: {
        name: 'Not Available',
        bg: 'bg-neutral-300 dark:bg-neutral-700',
        text: 'text-neutral-400 dark:text-neutral-500',
        border: 'border-neutral-300 dark:border-neutral-700',
        light: 'bg-neutral-100 dark:bg-neutral-900',
    },
    selected: {
        name: 'Selected',
        bg: 'bg-neutral-900 dark:bg-white',
        text: 'text-white dark:text-neutral-900',
        border: 'border-neutral-900 dark:border-white',
        light: 'bg-neutral-900 dark:bg-white',
    },
};

export default function BookingPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [business, setBusiness] = useState<Business | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Booking flow state
    const [step, setStep] = useState<'service' | 'datetime' | 'details' | 'confirmed'>('service');
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsMessage, setSlotsMessage] = useState<string | null>(null);

    // Customer details
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [booking, setBooking] = useState(false);
    const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

    // Fetch business and services
    useEffect(() => {
        async function fetchBusiness() {
            try {
                const res = await fetch(`/api/book/${slug}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setError('Business not found');
                    } else {
                        setError('Failed to load business');
                    }
                    return;
                }
                const data = await res.json();
                setBusiness(data.business);
                setServices(data.services);
            } catch {
                setError('Failed to load business');
            } finally {
                setLoading(false);
            }
        }

        if (slug) {
            fetchBusiness();
        }
    }, [slug]);

    // Fetch slots when date changes
    useEffect(() => {
        async function fetchSlots() {
            if (!selectedDate || !selectedService || !business) return;

            setSlotsLoading(true);
            setSlotsMessage(null);
            setSelectedTime(null);

            try {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                const res = await fetch(
                    `/api/book/${slug}/slots?date=${dateStr}&serviceId=${selectedService.id}`
                );
                const data = await res.json();

                if (data.message) {
                    setSlotsMessage(data.message);
                    setSlots([]);
                } else {
                    setSlots(data.slots || []);
                }
            } catch {
                setSlotsMessage('Failed to load available slots');
                setSlots([]);
            } finally {
                setSlotsLoading(false);
            }
        }

        fetchSlots();
    }, [selectedDate, selectedService, slug, business]);

    // Handle service selection
    const handleServiceSelect = (service: Service) => {
        setSelectedService(service);
        setStep('datetime');
    };

    // Handle booking submission
    const handleBooking = async () => {
        if (!selectedService || !selectedDate || !selectedTime) return;

        setBooking(true);
        try {
            const res = await fetch(`/api/book/${slug}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId: selectedService.id,
                    date: format(selectedDate, 'yyyy-MM-dd'),
                    time: selectedTime,
                    customerName,
                    customerEmail,
                    customerPhone,
                    notes,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Failed to book appointment');
                return;
            }

            setConfirmation(data.appointment);
            setStep('confirmed');
        } catch {
            alert('Failed to book appointment');
        } finally {
            setBooking(false);
        }
    };

    // Format price
    const formatPrice = (price: number, currency: string) => {
        if (price === 0) return 'Free';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency,
        }).format(price / 100);
    };

    // Calculate min/max dates for calendar
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + (business?.bookingWindowDays || 30));

    // Group slots by time of day
    const groupedSlots = useMemo(() => {
        const morning: Slot[] = [];
        const afternoon: Slot[] = [];
        const evening: Slot[] = [];

        slots.forEach(slot => {
            const hour = parseInt(slot.time.split(':')[0]);
            if (hour < 12) {
                morning.push(slot);
            } else if (hour < 17) {
                afternoon.push(slot);
            } else {
                evening.push(slot);
            }
        });

        return { morning, afternoon, evening };
    }, [slots]);

    // Count available slots
    const availableCount = slots.filter(s => s.available).length;

    // Step labels
    const stepLabels = ['Service', 'Date & Time', 'Details', 'Confirmed'];
    const stepKeys: ('service' | 'datetime' | 'details' | 'confirmed')[] = ['service', 'datetime', 'details', 'confirmed'];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white"></div>
                    <p className="text-sm text-neutral-500">Loading...</p>
                </div>
            </div>
        );
    }

    if (error || !business) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <CardTitle>Business Not Found</CardTitle>
                        <CardDescription>{error || 'The requested business does not exist or is not available for booking.'}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">{business.name}</h1>
                    {business.description && (
                        <p className="text-neutral-600 dark:text-neutral-400">{business.description}</p>
                    )}
                </div>

                {/* Step indicator */}
                <div className="flex justify-center mb-10">
                    <div className="flex items-center gap-0">
                        {stepKeys.map((s, i) => (
                            <div key={s} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${step === s
                                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 ring-4 ring-neutral-200 dark:ring-neutral-700'
                                            : stepKeys.indexOf(step) > i
                                                ? 'bg-teal-500 text-white'
                                                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                                            }`}
                                    >
                                        {stepKeys.indexOf(step) > i ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            i + 1
                                        )}
                                    </div>
                                    <span className={`mt-2 text-xs font-medium ${step === s ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'}`}>
                                        {stepLabels[i]}
                                    </span>
                                </div>
                                {i < 3 && (
                                    <div className={`w-16 h-0.5 mx-2 transition-colors duration-300 ${stepKeys.indexOf(step) > i
                                        ? 'bg-teal-500'
                                        : 'bg-neutral-200 dark:bg-neutral-800'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 1: Service selection */}
                {step === 'service' && (
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">Choose a Service</h2>
                        <div className="grid gap-4">
                            {services.map((service) => (
                                <div
                                    key={service.id}
                                    onClick={() => handleServiceSelect(service)}
                                    className="group relative bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 cursor-pointer transition-all duration-300 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-lg hover:-translate-y-0.5"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                                {service.name}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {service.duration} min
                                                </span>
                                            </div>
                                            {service.description && (
                                                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{service.description}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-bold text-neutral-900 dark:text-white">
                                                {formatPrice(service.price, service.currency)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {services.length === 0 && (
                            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
                                <p className="text-neutral-500 dark:text-neutral-400">No services available at this time.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Date and time selection */}
                {step === 'datetime' && selectedService && (
                    <div>
                        <button
                            onClick={() => setStep('service')}
                            className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white mb-6 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to services
                        </button>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
                            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                                Select Date & Time
                            </h2>
                            <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                for <span className="font-medium text-neutral-900 dark:text-white">{selectedService.name}</span>
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Calendar Card */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-5">Pick a Date</h3>

                                {/* Large Calendar */}
                                <div className="[--cell-size:2.75rem] sm:[--cell-size:3rem] lg:[--cell-size:2.75rem] xl:[--cell-size:3rem]">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        disabled={(date) => {
                                            const dateOnly = new Date(date);
                                            dateOnly.setHours(0, 0, 0, 0);
                                            return dateOnly < today || dateOnly > maxDate;
                                        }}
                                        className="w-full rounded-xl border-0 p-0"
                                        modifiers={{
                                            weekend: (date) => isWeekend(date),
                                        }}
                                        modifiersClassNames={{
                                            weekend: 'text-neutral-400 dark:text-neutral-500',
                                        }}
                                    />
                                </div>

                                {/* Color coding legend */}
                                <div className="mt-6 pt-5 border-t border-neutral-100 dark:border-neutral-800">
                                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider">Color Guide</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        {Object.entries(AVAILABILITY_COLORS).map(([key, color]) => (
                                            <div key={key} className="flex items-center gap-2.5">
                                                <div className={`w-3.5 h-3.5 rounded-full ${color.bg}`} />
                                                <span className="text-sm text-neutral-600 dark:text-neutral-400">{color.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Time Slots Card */}
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Available Times</h3>
                                    {selectedDate && !slotsLoading && availableCount > 0 && (
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${AVAILABILITY_COLORS.available.light} ${AVAILABILITY_COLORS.available.text}`}>
                                            {availableCount} slots
                                        </span>
                                    )}
                                </div>

                                {selectedDate && (
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                                    </p>
                                )}

                                {!selectedDate && (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                                            <svg className="w-7 h-7 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-neutral-600 dark:text-neutral-400 font-medium">Select a date first</p>
                                        <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">Choose a date from the calendar</p>
                                    </div>
                                )}

                                {selectedDate && slotsLoading && (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-neutral-200 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white mb-4"></div>
                                        <p className="text-sm text-neutral-500">Loading available times...</p>
                                    </div>
                                )}

                                {selectedDate && !slotsLoading && slotsMessage && (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                                            <svg className="w-7 h-7 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <p className="text-neutral-600 dark:text-neutral-400">{slotsMessage}</p>
                                    </div>
                                )}

                                {selectedDate && !slotsLoading && !slotsMessage && slots.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                                            <svg className="w-7 h-7 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                            </svg>
                                        </div>
                                        <p className="text-neutral-600 dark:text-neutral-400 font-medium">No times available</p>
                                        <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">Try selecting another date</p>
                                    </div>
                                )}

                                {selectedDate && !slotsLoading && slots.length > 0 && (
                                    <div className="space-y-5">
                                        {/* Morning slots */}
                                        {groupedSlots.morning.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                                    </svg>
                                                    Morning
                                                </p>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                    {groupedSlots.morning.map((slot) => (
                                                        <button
                                                            key={slot.time}
                                                            disabled={!slot.available}
                                                            onClick={() => setSelectedTime(slot.time)}
                                                            className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${selectedTime === slot.time
                                                                ? `${AVAILABILITY_COLORS.selected.bg} ${AVAILABILITY_COLORS.selected.text}`
                                                                : slot.available
                                                                    ? `${AVAILABILITY_COLORS.available.light} ${AVAILABILITY_COLORS.available.text} hover:ring-2 hover:ring-teal-500/30`
                                                                    : `${AVAILABILITY_COLORS.unavailable.light} ${AVAILABILITY_COLORS.unavailable.text} cursor-not-allowed line-through`
                                                                }`}
                                                        >
                                                            {slot.time}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Afternoon slots */}
                                        {groupedSlots.afternoon.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                                    </svg>
                                                    Afternoon
                                                </p>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                    {groupedSlots.afternoon.map((slot) => (
                                                        <button
                                                            key={slot.time}
                                                            disabled={!slot.available}
                                                            onClick={() => setSelectedTime(slot.time)}
                                                            className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${selectedTime === slot.time
                                                                ? `${AVAILABILITY_COLORS.selected.bg} ${AVAILABILITY_COLORS.selected.text}`
                                                                : slot.available
                                                                    ? `${AVAILABILITY_COLORS.available.light} ${AVAILABILITY_COLORS.available.text} hover:ring-2 hover:ring-teal-500/30`
                                                                    : `${AVAILABILITY_COLORS.unavailable.light} ${AVAILABILITY_COLORS.unavailable.text} cursor-not-allowed line-through`
                                                                }`}
                                                        >
                                                            {slot.time}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Evening slots */}
                                        {groupedSlots.evening.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                                    </svg>
                                                    Evening
                                                </p>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                    {groupedSlots.evening.map((slot) => (
                                                        <button
                                                            key={slot.time}
                                                            disabled={!slot.available}
                                                            onClick={() => setSelectedTime(slot.time)}
                                                            className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${selectedTime === slot.time
                                                                ? `${AVAILABILITY_COLORS.selected.bg} ${AVAILABILITY_COLORS.selected.text}`
                                                                : slot.available
                                                                    ? `${AVAILABILITY_COLORS.available.light} ${AVAILABILITY_COLORS.available.text} hover:ring-2 hover:ring-teal-500/30`
                                                                    : `${AVAILABILITY_COLORS.unavailable.light} ${AVAILABILITY_COLORS.unavailable.text} cursor-not-allowed line-through`
                                                                }`}
                                                        >
                                                            {slot.time}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <Button
                                disabled={!selectedTime}
                                onClick={() => setStep('details')}
                                className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 px-8 py-2.5"
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Customer details */}
                {
                    step === 'details' && selectedService && selectedDate && selectedTime && (
                        <div className="max-w-4xl mx-auto">
                            <button
                                onClick={() => setStep('datetime')}
                                className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white mb-6 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to date/time
                            </button>

                            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">Complete Your Booking</h2>

                            <div className="grid gap-6 lg:grid-cols-5">
                                {/* Booking summary - 2 columns */}
                                <div className="lg:col-span-2">
                                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 sticky top-8">
                                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Booking Summary</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Service</p>
                                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedService.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Date & Time</p>
                                                    <p className="font-medium text-neutral-900 dark:text-white">
                                                        {format(selectedDate, 'EEE, MMM d')} at {selectedTime}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Duration</p>
                                                    <p className="font-medium text-neutral-900 dark:text-white">{selectedService.duration} minutes</p>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-600 dark:text-neutral-400">Total</span>
                                                    <span className="text-xl font-bold text-neutral-900 dark:text-white">
                                                        {formatPrice(selectedService.price, selectedService.currency)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer form - 3 columns */}
                                <div className="lg:col-span-3">
                                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
                                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Your Information</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="name" className="text-neutral-700 dark:text-neutral-300">Full Name *</Label>
                                                <Input
                                                    id="name"
                                                    value={customerName}
                                                    onChange={(e) => setCustomerName(e.target.value)}
                                                    placeholder="John Doe"
                                                    className="mt-1.5"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="email" className="text-neutral-700 dark:text-neutral-300">Email Address *</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={customerEmail}
                                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                                    placeholder="john@example.com"
                                                    className="mt-1.5"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="phone" className="text-neutral-700 dark:text-neutral-300">Phone Number <span className="text-neutral-400">(optional)</span></Label>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    value={customerPhone}
                                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                                    placeholder="+91 98765 43210"
                                                    className="mt-1.5"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="notes" className="text-neutral-700 dark:text-neutral-300">Additional Notes <span className="text-neutral-400">(optional)</span></Label>
                                                <Textarea
                                                    id="notes"
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    placeholder="Any special requests or information we should know..."
                                                    className="mt-1.5 min-h-[100px]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <Button
                                            disabled={!customerName || !customerEmail || booking}
                                            onClick={handleBooking}
                                            className="bg-teal-600 hover:bg-teal-700 text-white px-8"
                                        >
                                            {booking ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Confirming...
                                                </span>
                                            ) : 'Confirm Booking'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Step 4: Confirmation */}
                {
                    step === 'confirmed' && confirmation && (
                        <div className="max-w-lg mx-auto text-center">
                            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8">
                                <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Booking Confirmed!</h2>
                                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                                    A confirmation email has been sent to <span className="font-medium">{customerEmail}</span>
                                </p>

                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-5 text-left space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Service</p>
                                            <p className="font-medium text-neutral-900 dark:text-white">{confirmation.service.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Date & Time</p>
                                            <p className="font-medium text-neutral-900 dark:text-white">
                                                {confirmation.date} • {confirmation.startTime} - {confirmation.endTime}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Location</p>
                                            <p className="font-medium text-neutral-900 dark:text-white">{confirmation.business.name}</p>
                                            {confirmation.business.address && (
                                                <p className="text-sm text-neutral-500 dark:text-neutral-400">{confirmation.business.address}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Booking ID: <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-xs">{confirmation.id}</code>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
}

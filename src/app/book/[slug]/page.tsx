'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

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
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + (business?.bookingWindowDays || 30));

    // Step labels
    const stepLabels = ['Service', 'Date & Time', 'Details', 'Confirmed'];
    const stepKeys: ('service' | 'datetime' | 'details' | 'confirmed')[] = ['service', 'datetime', 'details', 'confirmed'];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !business) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive">Error</CardTitle>
                        <CardDescription>{error || 'Business not found'}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">{business.name}</h1>
                    {business.description && (
                        <p className="text-muted-foreground">{business.description}</p>
                    )}
                </div>

                {/* Step indicator */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2 sm:gap-4">
                        {stepKeys.map((s, i) => (
                            <div key={s} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step === s
                                            ? 'bg-primary text-primary-foreground scale-110'
                                            : stepKeys.indexOf(step) > i
                                                ? 'bg-green-500 text-white'
                                                : 'bg-muted text-muted-foreground'
                                            }`}
                                    >
                                        {stepKeys.indexOf(step) > i ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            i + 1
                                        )}
                                    </div>
                                    <span className={`mt-1 text-xs hidden sm:block ${step === s ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                        {stepLabels[i]}
                                    </span>
                                </div>
                                {i < 3 && (
                                    <div className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 ${stepKeys.indexOf(step) > i
                                        ? 'bg-green-500'
                                        : 'bg-muted'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 1: Service selection */}
                {step === 'service' && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Select a Service</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            {services.map((service) => (
                                <Card
                                    key={service.id}
                                    className="cursor-pointer hover:border-primary transition-colors"
                                    onClick={() => handleServiceSelect(service)}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle>{service.name}</CardTitle>
                                                <CardDescription>
                                                    {service.duration} minutes
                                                </CardDescription>
                                            </div>
                                            <span className="text-lg font-semibold text-primary">
                                                {formatPrice(service.price, service.currency)}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    {service.description && (
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">{service.description}</p>
                                        </CardContent>
                                    )}
                                </Card>
                            ))}
                        </div>
                        {services.length === 0 && (
                            <Card>
                                <CardContent className="py-8 text-center">
                                    <p className="text-muted-foreground">No services available at this time.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Step 2: Date and time selection */}
                {step === 'datetime' && selectedService && (
                    <div>
                        <Button
                            variant="ghost"
                            className="mb-4"
                            onClick={() => setStep('service')}
                        >
                            ← Back to services
                        </Button>
                        <h2 className="text-xl font-semibold mb-4">
                            Select Date & Time for {selectedService.name}
                        </h2>
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Calendar */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pick a Date</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        disabled={(date) => date < today || date > maxDate}
                                        className="rounded-md border"
                                    />
                                </CardContent>
                            </Card>

                            {/* Time slots */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Available Times</CardTitle>
                                    {selectedDate && (
                                        <CardDescription>
                                            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {!selectedDate && (
                                        <p className="text-muted-foreground">Please select a date first</p>
                                    )}
                                    {selectedDate && slotsLoading && (
                                        <p className="text-muted-foreground">Loading available times...</p>
                                    )}
                                    {selectedDate && !slotsLoading && slotsMessage && (
                                        <p className="text-muted-foreground">{slotsMessage}</p>
                                    )}
                                    {selectedDate && !slotsLoading && !slotsMessage && slots.length === 0 && (
                                        <p className="text-muted-foreground">No available times for this date</p>
                                    )}
                                    {selectedDate && !slotsLoading && slots.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                                            {slots.map((slot) => (
                                                <Button
                                                    key={slot.time}
                                                    variant={selectedTime === slot.time ? 'default' : 'outline'}
                                                    disabled={!slot.available}
                                                    className={!slot.available ? 'opacity-50 cursor-not-allowed' : ''}
                                                    onClick={() => setSelectedTime(slot.time)}
                                                >
                                                    {slot.time}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button
                                disabled={!selectedTime}
                                onClick={() => setStep('details')}
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Customer details */}
                {step === 'details' && selectedService && selectedDate && selectedTime && (
                    <div>
                        <Button
                            variant="ghost"
                            className="mb-4"
                            onClick={() => setStep('datetime')}
                        >
                            ← Back to date/time
                        </Button>
                        <h2 className="text-xl font-semibold mb-4">Your Details</h2>
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Booking summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Booking Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Service</p>
                                        <p className="font-medium">{selectedService.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Date & Time</p>
                                        <p className="font-medium">
                                            {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Duration</p>
                                        <p className="font-medium">{selectedService.duration} minutes</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Price</p>
                                        <p className="font-medium">
                                            {formatPrice(selectedService.price, selectedService.currency)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Customer form */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Contact Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            placeholder="Your full name"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={customerEmail}
                                            onChange={(e) => setCustomerEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="phone">Phone (optional)</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={customerPhone}
                                            onChange={(e) => setCustomerPhone(e.target.value)}
                                            placeholder="+91 9876543210"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="notes">Notes (optional)</Label>
                                        <Textarea
                                            id="notes"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Any special requests..."
                                            className="mt-1"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button
                                disabled={!customerName || !customerEmail || booking}
                                onClick={handleBooking}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {booking ? 'Booking...' : 'Confirm Booking'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Confirmation */}
                {step === 'confirmed' && confirmation && (
                    <div className="text-center">
                        <Card className="max-w-lg mx-auto">
                            <CardHeader>
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
                                <CardDescription>
                                    A confirmation email has been sent to {customerEmail}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 text-left">
                                <div className="bg-muted rounded-lg p-4 space-y-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Service</p>
                                        <p className="font-medium">{confirmation.service.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Date & Time</p>
                                        <p className="font-medium">
                                            {confirmation.date} at {confirmation.startTime} - {confirmation.endTime}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Location</p>
                                        <p className="font-medium">{confirmation.business.name}</p>
                                        {confirmation.business.address && (
                                            <p className="text-muted-foreground text-sm">{confirmation.business.address}</p>
                                        )}
                                    </div>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    Booking ID: <code className="bg-muted px-2 py-1 rounded">{confirmation.id}</code>
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}

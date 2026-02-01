'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BusinessCreationWizard } from '@/components/ui/business-creation-wizard';

interface Business {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    timezone: string;
    bookingLeadTime: number;
    bookingWindowDays: number;
    slotDuration: number;
    isActive: boolean;
}

interface Service {
    id: string;
    name: string;
    description: string | null;
    duration: number;
    price: number;
    currency: string;
    color: string | null;
    isActive: boolean;
}

interface Appointment {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    status: string;
    notes: string | null;
    service: Service;
}

// Main Dashboard Component
export default function BusinessDashboard() {
    const [business, setBusiness] = useState<Business | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [needsSetup, setNeedsSetup] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'appointments'>('overview');

    // Service form state
    const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [serviceName, setServiceName] = useState('');
    const [serviceDescription, setServiceDescription] = useState('');
    const [serviceDuration, setServiceDuration] = useState(30);
    const [servicePrice, setServicePrice] = useState(0);
    const [serviceActive, setServiceActive] = useState(true);
    const [serviceSaving, setServiceSaving] = useState(false);

    const fetchBusiness = useCallback(async () => {
        try {
            const res = await fetch('/api/business');
            if (res.status === 404) {
                setNeedsSetup(true);
                setLoading(false);
                return;
            }
            if (!res.ok) throw new Error('Failed to fetch business');

            const data = await res.json();
            setBusiness(data.business);
            setNeedsSetup(false);
        } catch {
            setError('Failed to load business data');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchServices = useCallback(async () => {
        try {
            const res = await fetch('/api/business/services');
            if (!res.ok) return;
            const data = await res.json();
            setServices(data.services || []);
        } catch {
            console.error('Failed to fetch services');
        }
    }, []);

    const fetchAppointments = useCallback(async () => {
        try {
            const res = await fetch('/api/business/appointments?limit=20&status=confirmed');
            if (!res.ok) return;
            const data = await res.json();
            setAppointments(data.appointments || []);
        } catch {
            console.error('Failed to fetch appointments');
        }
    }, []);

    useEffect(() => {
        fetchBusiness();
    }, [fetchBusiness]);

    useEffect(() => {
        if (business) {
            fetchServices();
            fetchAppointments();
        }
    }, [business, fetchServices, fetchAppointments]);

    // Handle service save
    const handleServiceSave = async () => {
        if (!serviceName.trim()) {
            alert('Service name is required');
            return;
        }

        setServiceSaving(true);
        try {
            const url = editingService
                ? `/api/business/services/${editingService.id}`
                : '/api/business/services';

            const res = await fetch(url, {
                method: editingService ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: serviceName,
                    description: serviceDescription,
                    duration: serviceDuration,
                    price: servicePrice * 100,
                    isActive: serviceActive,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            setServiceDialogOpen(false);
            resetServiceForm();
            fetchServices();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to save service');
        } finally {
            setServiceSaving(false);
        }
    };

    const handleServiceDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this service?')) return;

        try {
            const res = await fetch(`/api/business/services/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            fetchServices();
        } catch {
            alert('Failed to delete service');
        }
    };

    const handleAppointmentStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error('Failed to update');
            fetchAppointments();
        } catch {
            alert('Failed to update appointment');
        }
    };

    const resetServiceForm = () => {
        setEditingService(null);
        setServiceName('');
        setServiceDescription('');
        setServiceDuration(30);
        setServicePrice(0);
        setServiceActive(true);
    };

    const openEditService = (service: Service) => {
        setEditingService(service);
        setServiceName(service.name);
        setServiceDescription(service.description || '');
        setServiceDuration(service.duration);
        setServicePrice(service.price / 100);
        setServiceActive(service.isActive);
        setServiceDialogOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-500';
            case 'completed': return 'bg-primary';
            case 'cancelled': return 'bg-destructive';
            case 'no_show': return 'bg-orange-500';
            default: return 'bg-muted-foreground';
        }
    };

    const upcomingAppointmentsCount = appointments.filter(a =>
        a.status === 'confirmed' && new Date(a.appointmentDate) >= new Date()
    ).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="max-w-md mx-auto mt-8">
                <CardHeader>
                    <CardTitle className="text-destructive">Error</CardTitle>
                    <CardDescription>{error}</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    // Show creation wizard if no business exists
    if (needsSetup) {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <BusinessCreationWizard
                    onComplete={() => {
                        setNeedsSetup(false);
                        fetchBusiness();
                    }}
                />
            </div>
        );
    }

    // Show create modal
    if (showCreateModal) {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <BusinessCreationWizard
                    onComplete={() => {
                        setShowCreateModal(false);
                        fetchBusiness();
                    }}
                    onCancel={() => setShowCreateModal(false)}
                />
            </div>
        );
    }

    // Main dashboard with business list
    return (
        <div className="p-6 space-y-6">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">My Business</h1>
                    <p className="text-muted-foreground">Manage your business and appointments</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Business
                </Button>
            </div>

            {/* Business Card */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Business Info Card */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-xl">{business?.name}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    <span>Booking link:</span>
                                    <code className="bg-muted px-2 py-0.5 rounded text-xs">/book/{business?.slug}</code>
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/book/${business?.slug}`);
                                        alert('Link copied!');
                                    }}
                                >
                                    Copy Link
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => window.open(`/book/${business?.slug}`, '_blank')}
                                >
                                    View Page
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-muted/50 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-primary">{services.length}</p>
                                <p className="text-xs text-muted-foreground">Services</p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-green-500">{upcomingAppointmentsCount}</p>
                                <p className="text-xs text-muted-foreground">Upcoming</p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-purple-500">{appointments.length}</p>
                                <p className="text-xs text-muted-foreground">Total Bookings</p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3 text-center">
                                <Badge className={business?.isActive ? 'bg-green-500' : 'bg-muted-foreground'}>
                                    {business?.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">Status</p>
                            </div>
                        </div>
                        {business?.description && (
                            <p className="text-sm text-muted-foreground mt-4">{business.description}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Stats Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Upcoming Bookings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {upcomingAppointmentsCount === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-muted-foreground text-sm">No upcoming appointments</p>
                                <p className="text-xs text-muted-foreground mt-1">Share your booking link to get started</p>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-4xl font-bold text-green-500">{upcomingAppointmentsCount}</p>
                                <p className="text-muted-foreground text-sm mt-2">appointments scheduled</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
                {(['overview', 'services', 'appointments'] as const).map((tab) => (
                    <Button
                        key={tab}
                        variant={activeTab === tab ? 'default' : 'ghost'}
                        onClick={() => setActiveTab(tab)}
                        className="capitalize"
                    >
                        {tab}
                    </Button>
                ))}
            </div>

            {/* Services Tab */}
            {activeTab === 'services' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Services</h2>
                        <Dialog open={serviceDialogOpen} onOpenChange={(open) => {
                            setServiceDialogOpen(open);
                            if (!open) resetServiceForm();
                        }}>
                            <DialogTrigger asChild>
                                <Button>Add Service</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle>
                                    <DialogDescription>
                                        {editingService ? 'Update service details' : 'Create a new service for your business'}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div>
                                        <Label htmlFor="serviceName">Name *</Label>
                                        <Input
                                            id="serviceName"
                                            value={serviceName}
                                            onChange={(e) => setServiceName(e.target.value)}
                                            placeholder="Haircut"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="serviceDesc">Description</Label>
                                        <Textarea
                                            id="serviceDesc"
                                            value={serviceDescription}
                                            onChange={(e) => setServiceDescription(e.target.value)}
                                            placeholder="Service description..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="duration">Duration (minutes)</Label>
                                            <Input
                                                id="duration"
                                                type="number"
                                                value={serviceDuration}
                                                onChange={(e) => setServiceDuration(parseInt(e.target.value) || 30)}
                                                min={5}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="price">Price (₹)</Label>
                                            <Input
                                                id="price"
                                                type="number"
                                                value={servicePrice}
                                                onChange={(e) => setServicePrice(parseFloat(e.target.value) || 0)}
                                                min={0}
                                                step={0.01}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={serviceActive}
                                            onCheckedChange={setServiceActive}
                                        />
                                        <Label>Active</Label>
                                    </div>
                                    <Button onClick={handleServiceSave} disabled={serviceSaving} className="w-full">
                                        {serviceSaving ? 'Saving...' : 'Save Service'}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {services.map((service) => (
                            <Card key={service.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{service.name}</CardTitle>
                                            <CardDescription>{service.duration} min • ₹{service.price / 100}</CardDescription>
                                        </div>
                                        <Badge className={service.isActive ? 'bg-green-500' : 'bg-muted-foreground'}>
                                            {service.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {service.description && (
                                        <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                                    )}
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => openEditService(service)}>
                                            Edit
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleServiceDelete(service.id)}>
                                            Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {services.length === 0 && (
                            <Card className="col-span-full">
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    No services yet. Add your first service to start accepting bookings.
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Appointments</h2>
                    <div className="space-y-4">
                        {appointments.map((apt) => (
                            <Card key={apt.id}>
                                <CardContent className="py-4">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${getStatusColor(apt.status)}`} />
                                            <div>
                                                <p className="font-medium">{apt.customerName}</p>
                                                <p className="text-sm text-muted-foreground">{apt.customerEmail}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{apt.service?.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.startTime}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            {apt.status === 'confirmed' && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleAppointmentStatus(apt.id, 'completed')}
                                                    >
                                                        Complete
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleAppointmentStatus(apt.id, 'cancelled')}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </>
                                            )}
                                            <Badge className={getStatusColor(apt.status)}>{apt.status}</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {appointments.length === 0 && (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    No appointments yet. Share your booking link to start receiving bookings.
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* Overview Tab - Quick actions and recent activity */}
            {activeTab === 'overview' && (
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('services')}>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add a New Service
                            </Button>
                            <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('appointments')}>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                View All Appointments
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/book/${business?.slug}`);
                                    alert('Booking link copied!');
                                }}
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Share Booking Link
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Recent Appointments */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Appointments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {appointments.slice(0, 5).map((apt) => (
                                <div key={apt.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                    <div>
                                        <p className="font-medium text-sm">{apt.customerName}</p>
                                        <p className="text-xs text-muted-foreground">{apt.service?.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm">{new Date(apt.appointmentDate).toLocaleDateString()}</p>
                                        <Badge className={`${getStatusColor(apt.status)} text-xs`}>{apt.status}</Badge>
                                    </div>
                                </div>
                            ))}
                            {appointments.length === 0 && (
                                <p className="text-center text-muted-foreground py-4">No appointments yet</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

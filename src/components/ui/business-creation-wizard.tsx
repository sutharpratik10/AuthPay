'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface BusinessCreationWizardProps {
    onComplete: () => void;
    onCancel?: () => void;
    redirectOnSubscriptionRequired?: string;
}

// Progress Step Component
function ProgressStep({
    step,
    currentStep,
    label,
    isComplete
}: {
    step: number;
    currentStep: number;
    label: string;
    isComplete: boolean;
}) {
    const isActive = step === currentStep;

    return (
        <div className="flex items-center">
            <div className="flex flex-col items-center">
                <div
                    className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
            transition-all duration-300 border-2
            ${isComplete
                            ? 'bg-green-500 border-green-500 text-white'
                            : isActive
                                ? 'bg-primary border-primary text-primary-foreground scale-110'
                                : 'bg-transparent border-muted-foreground/30 text-muted-foreground'
                        }
          `}
                >
                    {isComplete ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        step
                    )}
                </div>
                <span className={`
          mt-2 text-xs font-medium
          ${isActive ? 'text-primary' : isComplete ? 'text-green-500' : 'text-muted-foreground'}
        `}>
                    {label}
                </span>
            </div>
        </div>
    );
}

export function BusinessCreationWizard({
    onComplete,
    onCancel,
    redirectOnSubscriptionRequired = '/protected/user/subscription'
}: BusinessCreationWizardProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        phone: '',
        email: '',
        address: '',
        timezone: 'Asia/Kolkata',
    });

    const steps = [
        { step: 1, label: 'Basic Info' },
        { step: 2, label: 'Contact' },
        { step: 3, label: 'Address' },
        { step: 4, label: 'Review' },
    ];

    const progressPercentage = () => {
        let completed = 0;
        if (formData.name.length >= 2) completed += 25;
        if (formData.description.length > 0) completed += 10;
        if (formData.phone.length > 0) completed += 15;
        if (formData.email.length > 0) completed += 15;
        if (formData.address.length > 0) completed += 10;
        if (currentStep >= 4) completed += 25;
        return Math.min(completed, 100);
    };

    const handleNext = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            alert('Business name is required');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/business', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.code === 'SUBSCRIPTION_REQUIRED') {
                    alert('You need an active subscription to create a business. Please subscribe first.');
                    router.push(redirectOnSubscriptionRequired);
                    return;
                }
                throw new Error(data.error);
            }

            onComplete();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to create business');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="border-border">
            <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <CardTitle className="text-2xl">Create Your Business</CardTitle>
                <CardDescription>
                    Set up your business profile to start accepting appointments
                </CardDescription>
            </CardHeader>

            <CardContent>
                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Progress</span>
                        <span className="text-sm text-primary font-medium">{progressPercentage()}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500 ease-out"
                            style={{ width: `${progressPercentage()}%` }}
                        />
                    </div>
                </div>

                {/* Steps Indicator */}
                <div className="flex justify-between mb-6 px-2">
                    {steps.map((s, i) => (
                        <div key={s.step} className="flex items-center">
                            <ProgressStep
                                step={s.step}
                                currentStep={currentStep}
                                label={s.label}
                                isComplete={currentStep > s.step}
                            />
                            {i < steps.length - 1 && (
                                <div className={`w-8 h-0.5 mx-1 mt-[-16px] ${currentStep > s.step ? 'bg-green-500' : 'bg-muted'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="min-h-[180px]">
                    {currentStep === 1 && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div>
                                <Label htmlFor="name">Business Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="My Awesome Business"
                                    className="mt-1"
                                />
                                <p className="text-xs text-muted-foreground mt-1">This will be displayed to your customers</p>
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Tell customers about your business, services, and what makes you unique..."
                                    className="mt-1"
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div>
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+91 9876543210"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Business Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="contact@mybusiness.com"
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div>
                                <Label htmlFor="address">Business Address</Label>
                                <Textarea
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Enter your complete business address..."
                                    className="mt-1"
                                    rows={4}
                                />
                                <p className="text-xs text-muted-foreground mt-1">This helps customers find your location</p>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <h3 className="text-sm font-semibold mb-3">Review Your Details</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase">Name</p>
                                        <p className="font-medium">{formData.name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase">Phone</p>
                                        <p className="font-medium">{formData.phone || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase">Email</p>
                                        <p className="font-medium">{formData.email || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase">Address</p>
                                        <p className="font-medium truncate">{formData.address || '-'}</p>
                                    </div>
                                </div>
                                {formData.description && (
                                    <div className="mt-3 pt-3 border-t border-border">
                                        <p className="text-xs text-muted-foreground uppercase">Description</p>
                                        <p className="text-sm mt-1">{formData.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6 pt-4 border-t border-border">
                    <div>
                        {onCancel && currentStep === 1 && (
                            <Button variant="ghost" onClick={onCancel}>
                                Cancel
                            </Button>
                        )}
                        {currentStep > 1 && (
                            <Button variant="outline" onClick={handleBack}>
                                Back
                            </Button>
                        )}
                    </div>
                    <div>
                        {currentStep < 4 ? (
                            <Button
                                onClick={handleNext}
                                disabled={currentStep === 1 && formData.name.length < 2}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || formData.name.length < 2}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Business'}
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default BusinessCreationWizard;

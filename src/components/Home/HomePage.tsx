'use client';

import React from 'react';
import { Footer } from '../layout/footer';
import { APP_CONFIG } from '@/lib/utils/constants';

// SVG Icons
const CalendarIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const businessTypes = [
  { name: "Salons & Spas", icon: "💇", color: "from-pink-500 to-rose-500" },
  { name: "Medical Clinics", icon: "🏥", color: "from-blue-500 to-cyan-500" },
  { name: "Fitness Studios", icon: "💪", color: "from-orange-500 to-amber-500" },
  { name: "Dental Offices", icon: "🦷", color: "from-teal-500 to-emerald-500" },
  { name: "Consulting", icon: "💼", color: "from-purple-500 to-indigo-500" },
  { name: "Auto Services", icon: "🚗", color: "from-gray-500 to-slate-500" },
];

const features = [
  {
    icon: CalendarIcon,
    title: "Smart Scheduling",
    description: "AI-powered scheduling that finds the perfect time slots for your customers",
    color: "from-blue-500 to-indigo-600",
    lightBg: "bg-blue-50",
    darkBg: "dark:bg-blue-950/30",
  },
  {
    icon: BellIcon,
    title: "Automated Reminders",
    description: "Email & SMS reminders reduce no-shows by up to 70%",
    color: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50",
    darkBg: "dark:bg-emerald-950/30",
  },
  {
    icon: UsersIcon,
    title: "Customer Management",
    description: "Complete customer profiles with booking history and preferences",
    color: "from-purple-500 to-violet-600",
    lightBg: "bg-purple-50",
    darkBg: "dark:bg-purple-950/30",
  },
  {
    icon: ChartIcon,
    title: "Business Analytics",
    description: "Track performance, revenue, and customer trends in real-time",
    color: "from-orange-500 to-amber-600",
    lightBg: "bg-orange-50",
    darkBg: "dark:bg-orange-950/30",
  },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Salon Owner",
    image: "👩‍💼",
    rating: 5,
    text: "Our no-show rate dropped by 65% in the first month! The automated reminders are a game-changer.",
  },
  {
    name: "Dr. Michael Chen",
    role: "Dental Clinic",
    image: "👨‍⚕️",
    rating: 5,
    text: "Finally, a booking system that understands healthcare scheduling. Our patients love the easy booking.",
  },
  {
    name: "Emma Davis",
    role: "Fitness Studio",
    image: "👩‍🦰",
    rating: 5,
    text: "Managing class schedules has never been easier. We've seen 40% more bookings since switching.",
  },
];

const stats = [
  { value: "50K+", label: "Appointments Booked" },
  { value: "98%", label: "Customer Satisfaction" },
  { value: "70%", label: "Fewer No-Shows" },
  { value: "24/7", label: "Online Booking" },
];

export default function HomePage() {
  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-500">

        {/* Hero Section with Animated Background */}
        <section className="relative overflow-hidden px-6 py-24 lg:py-36">
          {/* Animated gradient orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-purple-400/30 dark:from-blue-600/20 dark:to-purple-600/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 dark:from-emerald-600/20 dark:to-teal-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-0 right-1/4 w-60 h-60 bg-gradient-to-br from-orange-400/20 to-pink-400/20 dark:from-orange-600/10 dark:to-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />

          <div className="relative max-w-7xl mx-auto">
            <div className="text-center mb-16">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 mb-8 text-sm font-semibold bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200/50 dark:border-blue-700/50 shadow-lg shadow-blue-500/10 backdrop-blur-sm animate-fade-in">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Trusted by 10,000+ businesses worldwide
              </div>

              {/* Main Title with gradient animation */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-8 leading-tight">
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white animate-gradient bg-[length:200%_auto]">
                  {APP_CONFIG.APP_NAME || 'BookEase'}
                </span>
                <span className="block mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 dark:from-blue-400 dark:via-purple-400 dark:to-blue-400 animate-gradient bg-[length:200%_auto]">
                  Appointment Booking Made Simple
                </span>
              </h1>

              <p className="text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
                Transform how your customers book appointments. Reduce no-shows,
                increase revenue, and delight your customers with seamless online booking.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <a
                  href="/auth/signup"
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-xl shadow-blue-500/25 hover:shadow-purple-500/30 transform transition-all duration-300 hover:-translate-y-1 hover:scale-105"
                >
                  <span className="relative z-10">Start Free Trial</span>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                </a>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                ✨ No credit card required • 14-day free trial • Setup in 5 minutes
              </p>
            </div>

            {/* Animated Calendar Preview */}
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 rounded-3xl blur-2xl" />
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                {/* Browser-like header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 text-center text-sm text-slate-500 dark:text-slate-400">
                    book.yourbusiness.com
                  </div>
                </div>

                {/* Calendar UI Preview */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mini Calendar */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200">February 2026</h4>
                      <div className="flex gap-2">
                        <button className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">‹</button>
                        <button className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">›</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="py-2 text-slate-400 dark:text-slate-500 font-medium">{d}</div>
                      ))}
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                        <div
                          key={d}
                          className={`py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer
                            ${d === 15 ? 'bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30' : ''}
                            ${[8, 12, 22].includes(d) ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : ''}
                            ${![8, 12, 15, 22].includes(d) ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800' : ''}
                          `}
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Available Slots</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'].map((time, i) => (
                        <button
                          key={i}
                          className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200
                            ${i === 2
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25 scale-105'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                            }
                          `}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <div className="w-5 h-5"><CheckIcon /></div>
                        <span className="font-medium">Booking confirmed!</span>
                      </div>
                      <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">Feb 15, 2026 at 11:00 AM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-6 py-16 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-slate-400 text-sm md:text-base">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Business Types Carousel */}
        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Perfect for Every Business
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto">
              From salons to clinics, fitness studios to consultants — {APP_CONFIG.APP_NAME || 'BookEase'} adapts to your unique needs.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {businessTypes.map((business, index) => (
                <div
                  key={index}
                  className="group relative p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${business.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  <div className="relative">
                    <div className="text-4xl mb-3">{business.icon}</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{business.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-20 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Powerful features designed to save you time and grow your business
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${feature.color} opacity-5 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-10`} />

                  <div className="relative">
                    <div className={`w-14 h-14 ${feature.lightBg} ${feature.darkBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <div className={`w-7 h-7 bg-gradient-to-br ${feature.color} bg-clip-text`}>
                        <feature.icon />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Get Started in 3 Easy Steps
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Start accepting appointments in minutes, not days
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Create Your Account",
                  description: "Sign up in seconds and set up your business profile with services and availability",
                  icon: "🚀",
                  color: "from-blue-500 to-indigo-600"
                },
                {
                  step: "2",
                  title: "Share Your Booking Link",
                  description: "Get a custom booking page that you can share on social media, website, or anywhere",
                  icon: "🔗",
                  color: "from-purple-500 to-violet-600"
                },
                {
                  step: "3",
                  title: "Accept Bookings 24/7",
                  description: "Customers book online anytime. You get instant notifications and calendar sync",
                  icon: "📅",
                  color: "from-emerald-500 to-teal-600"
                }
              ].map((item, index) => (
                <div key={index} className="relative">
                  {index < 2 && (
                    <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-slate-300 to-transparent dark:from-slate-700" style={{ width: '100%', zIndex: 0 }} />
                  )}
                  <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center">
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-3xl shadow-lg`}>
                      {item.icon}
                    </div>
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${item.color} text-white font-bold text-sm mb-4`}>
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-6 py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Loved by Businesses Worldwide
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                See what our customers have to say
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <div key={i} className="w-5 h-5 text-yellow-400">
                        <StarIcon />
                      </div>
                    ))}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 mb-6 italic">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{testimonial.image}</div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-gradient bg-[length:200%_auto]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:24px_24px]" />

          <div className="relative max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join thousands of businesses that trust {APP_CONFIG.APP_NAME || 'BookEase'} for their appointment scheduling.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/auth/signup"
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:-translate-y-1 hover:scale-105"
              >
                Get Started Free
              </a>
              <a
                href="/contact"
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300"
              >
                Contact Sales
              </a>
            </div>

            <p className="text-sm text-blue-200 mt-8">
              ✓ No credit card required &nbsp; ✓ 14-day free trial &nbsp; ✓ Cancel anytime
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

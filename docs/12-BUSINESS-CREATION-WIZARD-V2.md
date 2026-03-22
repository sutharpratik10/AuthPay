# Business Creation Wizard V2 - Complete Documentation

## 🎯 Overview

The Business Creation Wizard V2 is a comprehensive, multi-step setup process that guides business owners through creating their booking system. This is a complete redesign based on real-world booking platforms like Calendly, Fresha, and Setmore.

## ✨ What's New in V2

### Previous Version (V1)
- 4 basic steps: Basic Info → Contact → Address → Review
- No working hours configuration
- No service setup
- No booking rules
- Basic and incomplete

### New Version (V2)
- **6 comprehensive steps** with complete business setup
- **Smart defaults** to minimize configuration time
- **Sidebar navigation** with progress tracking
- **Helper text and examples** throughout
- **Real-time validation**
- **Production-ready** booking system configuration

## 📋 Setup Flow Structure

### Step 1: Business Info
**Purpose:** Collect basic business information

**Fields:**
- Business Name* (Required)
- Description (Optional but recommended)
- Phone Number
- Business Email
- Business Address
- Timezone Selection

**Features:**
- Info banner with guidance
- Clear field labels with helper text
- Professional placeholder examples
- Pre-selected timezone (Asia/Kolkata)

**Validation:**
- Business name must be at least 2 characters
- All other fields optional

---

### Step 2: Working Hours
**Purpose:** Configure when the business accepts bookings

**Features:**
- **Smart Defaults:**
  - Monday to Saturday: 9 AM - 6 PM (Enabled)
  - Sunday: Closed (Disabled)
- Day-by-day configuration with enable/disable toggles
- **Multiple shifts** support per day
  - Example: 9AM-1PM and 2PM-6PM (split shifts)
- "Apply First Day to All" quick action button
- Time picker inputs for each shift

**UI Design:**
| Day | Enable | Shift 1 | Shift 2 |
|-----|--------|---------|---------|
| Mon | ☑ | 09:00 - 18:00 | [+ Add Shift] |
| Tue | ☑ | 09:00 - 18:00 | |
| Sun | ☐ | Closed | |

**Database Storage:**
- Multiple `businessHours` records per business
- Each shift creates one database entry
- Supports 0-N shifts per day

---

### Step 3: Breaks & Holidays
**Purpose:** Block time when bookings shouldn't be accepted

#### Break Times
**Features:**
- Add unlimited breaks
- **Smart Default:** 1PM-2PM lunch break (applies to all days)
- Configure:
  - Start Time
  - End Time
  - Description (e.g., "Lunch", "Cleaning")
  - Apply to all working days (toggle)
  - OR select specific days

**Use Cases:**
- Lunch breaks
- Cleaning/preparation time
- Staff meetings
- Equipment maintenance windows

#### Holidays & Time Off
**Three Types:**

1. **Single Day**
   - Select one date
   - Example: "26 Jan - National Holiday"

2. **Date Range**
   - Start date + End date
   - Example: "1 May - 5 May: Vacation"

3. **Recurring**
   - Every [Day of Week]
   - Example: "Every Sunday - Weekly Off"

**Database Storage:**
- Stored in `blockedDates` table
- Each entry blocks that date from booking

---

### Step 4: Services Setup
**Purpose:** Define what customers can book

**Critical Feature:** At least 1 service required to proceed

**Service Fields:**
- **Name*** (Required) - e.g., "Haircut", "60-Min Massage"
- **Description** - What's included
- **Duration*** (minutes) - How long it takes
- **Price*** (₹) - Cost in rupees
- **Category** - For organization (e.g., "Hair", "Spa")
- **Service Type:**
  - In-Person (offline)
  - Online Meeting (with future video integration)
- **Buffer Time** (minutes) - Prep/cleanup time before/after
- **Max Bookings Per Slot** - For group classes (default: 1)

**Features:**
- Add unlimited services
- Drag to reorder (future enhancement)
- Each service card shows:
  - Service number badge
  - All configuration fields
  - Delete button
- Empty state with call-to-action

**Database Storage:**
- Stored in `services` table
- Linked to business via `businessId`
- Price stored in paisa (multiply by 100)

**Example Services:**
```
Service 1:
- Name: "Women's Haircut"
- Duration: 45 minutes
- Price: ₹500
- Type: In-Person
- Buffer: 10 minutes

Service 2:
- Name: "Hair Coloring"
- Duration: 120 minutes
- Price: ₹2500
- Type: In-Person
- Buffer: 15 minutes

Service 3:
- Name: "Online Consultation"
- Duration: 30 minutes
- Price: ₹300
- Type: Online Meeting
- Buffer: 0 minutes
```

---

### Step 5: Booking Settings
**Purpose:** Configure booking rules and customer policies

#### Time Rules
**Fields:**
- **Slot Interval:** 15 / 30 / 60 minutes
  - How often slots are available
  - Default: 30 minutes
  
- **Minimum Notice:** Hours required before booking
  - Prevents last-minute bookings
  - Default: 2 hours
  - Example: Can't book appointment within 2 hours
  
- **Maximum Advance Booking:** Days ahead
  - How far in future customers can book
  - Default: 30 days
  - Prevents far-future bookings
  
- **Max Bookings Per Day:** Per customer limit
  - Prevents spam/abuse
  - Default: 10 bookings

#### Approval Mode
**Toggle:** Auto-Confirm Bookings
- **Enabled (Default):** Bookings instantly confirmed
- **Disabled:** Requires manual approval from business

#### Customer Policies
**Toggles:**

1. **Require Phone Number** (Default: ON)
   - Collects customer phone during booking
   - Useful for reminders/confirmations

2. **Allow Cancellation** (Default: ON)
   - Customers can cancel their bookings
   - **Cancellation Window:** Hours before appointment
     - Default: 6 hours
     - Example: Must cancel at least 6 hours before appointment time

3. **Allow Reschedule** (Default: ON)
   - Customers can change their appointment time
   - Reduces no-shows

**Database Storage:**
- Stored in `businesses` table:
  - `bookingLeadTime` (minimum notice in minutes)
  - `bookingWindowDays` (max advance days)
  - `slotDuration` (slot interval in minutes)
- Other settings stored as business metadata (future enhancement)

---

### Step 6: Review & Publish
**Purpose:** Review all configurations before creating business

**Sections:**

1. **Business Information**
   - Name, Phone, Email, Timezone
   - Grid layout for easy scanning

2. **Working Hours**
   - Day-by-day summary
   - Shows "Closed" or time ranges
   - Example: "Mon: 09:00 - 18:00, Sun: Closed"

3. **Services Summary**
   - Count badge: "Services (3)"
   - Each service shows:
     - Name
     - Duration + Type
     - Price badge
   - Compact card layout

4. **Booking Settings Summary**
   - Grid display of key settings
   - Badges for Yes/No toggles
   - Easy-to-scan format

**Final Action:**
- "Create Business" button (green)
- Shows loading state: "Creating Business..."
- On success: Calls `onComplete()` callback
- On error: Shows error message

---

## 🎨 UI/UX Features

### Sidebar Navigation
- Sticky position (follows scroll)
- Shows all 6 steps
- Visual indicators:
  - ✓ Green checkmark for completed
  - Blue highlight for active
  - Gray for pending
- Step labels with status text

### Progress Bar
- Top of main content area
- Percentage-based (0-100%)
- Smooth gradient animation
- Calculated based on:
  - Business name filled: +15%
  - Working hours configured: +15%
  - At least 1 service added: +25%
  - Reached step 5: +15%
  - Reached step 6: +30%

### Info Banners
- Color-coded per step:
  - Blue: Information/guidance
  - Amber: Warnings/important notes
  - Green: Success/completion
  - Purple: Configuration tips
- Icon + Title + Description
- Provides context and tips

### Helper Text
- Small gray text under inputs
- Explains purpose and provides examples
- Examples:
  - "Choose a clear, professional name that customers will recognize"
  - "Time before/after for preparation"
  - "For group classes/sessions"

### Validation
- Real-time field validation
- "Next" button disabled if required fields empty
- Clear error messages
- Step-specific validation:
  - Step 1: Name required
  - Step 4: At least 1 service required
  - Step 6: All previous validations

---

## 🔄 Smart Defaults (Critical for Adoption)

### Why Smart Defaults Matter
Most small business owners:
- Don't have time for complex setup
- Want to start quickly
- Will use defaults and customize later

### Defaults Applied

1. **Working Hours:**
   ```
   Monday-Saturday: 9 AM - 6 PM (Enabled)
   Sunday: Closed
   ```

2. **Break Time:**
   ```
   1 PM - 2 PM: Lunch Break (All days)
   ```

3. **Booking Settings:**
   ```
   Slot Interval: 30 minutes
   Minimum Notice: 2 hours
   Max Advance: 30 days
   Auto-Confirm: Yes
   Allow Cancellation: Yes
   Cancellation Window: 6 hours
   Allow Reschedule: Yes
   Require Phone: Yes
   ```

4. **Timezone:**
   ```
   Asia/Kolkata (IST)
   ```

**Result:** A business can click through with minimal input and have a functional booking system.

---

## 🗄️ Database Schema Impact

### Tables Used

#### `businesses`
```typescript
{
  name: string,
  description: string,
  phone: string,
  email: string,
  address: string,
  timezone: string,
  bookingLeadTime: number,      // minimum notice (minutes)
  bookingWindowDays: number,    // max advance (days)
  slotDuration: number,         // slot interval (minutes)
}
```

#### `businessHours`
```typescript
{
  businessId: uuid,
  dayOfWeek: 0-6,               // 0=Sunday, 6=Saturday
  openTime: string,             // "09:00"
  closeTime: string,            // "18:00"
  isClosed: boolean,
}
```
- Multiple records per business
- One per shift per day

#### `services`
```typescript
{
  businessId: uuid,
  name: string,
  description: string,
  duration: number,             // minutes
  price: number,                // paisa (₹500 = 50000)
  isActive: boolean,
  sortOrder: number,
}
```

#### `blockedDates`
```typescript
{
  businessId: uuid,
  date: timestamp,
  reason: string,
}
```

---

## 🔌 API Endpoints

### POST `/api/business`
Creates the business profile
```json
{
  "name": "Bella Salon",
  "description": "...",
  "phone": "+91 9876543210",
  "email": "contact@bella.com",
  "address": "...",
  "timezone": "Asia/Kolkata",
  "bookingLeadTime": 120,
  "bookingWindowDays": 30,
  "slotDuration": 30
}
```

### POST `/api/business/hours`
Creates a single business hour entry (called multiple times)
```json
{
  "businessId": "uuid",
  "dayOfWeek": 1,
  "openTime": "09:00",
  "closeTime": "18:00",
  "isClosed": false
}
```

### POST `/api/business/services`
Creates a service (called for each service)
```json
{
  "businessId": "uuid",
  "name": "Haircut",
  "description": "Professional haircut",
  "duration": 45,
  "price": 50000,
  "isActive": true
}
```

### POST `/api/business/holidays`
Creates a blocked date (called for each holiday)
```json
{
  "businessId": "uuid",
  "date": "2026-01-26",
  "reason": "Republic Day"
}
```

---

## 🚀 Implementation Details

### Component Structure
```
BusinessCreationWizardV2
├── SidebarStep (reusable component)
├── Step 1: Business Info
├── Step 2: Working Hours
│   ├── Day cards (7x)
│   └── Multiple shifts per day
├── Step 3: Breaks & Holidays
│   ├── Break time cards
│   └── Holiday cards
├── Step 4: Services
│   └── Service cards (dynamic)
├── Step 5: Booking Settings
│   ├── Time Rules section
│   ├── Approval Mode section
│   └── Customer Policies section
└── Step 6: Review & Publish
    ├── Business Info summary
    ├── Working Hours summary
    ├── Services summary
    └── Booking Settings summary
```

### State Management
```typescript
// Business Info
const [businessInfo, setBusinessInfo] = useState({...})

// Working Hours (array of 7 days)
const [workingHours, setWorkingHours] = useState<WorkingHours[]>([...])

// Breaks (array)
const [breaks, setBreaks] = useState<BreakTime[]>([...])

// Holidays (array)
const [holidays, setHolidays] = useState<Holiday[]>([...])

// Services (array)
const [services, setServices] = useState<Service[]>([...])

// Booking Settings
const [bookingSettings, setBookingSettings] = useState<BookingSettings>({...})
```

### Key Functions

**Working Hours:**
- `applySameToAllDays()` - Copy first day to all
- `toggleDay(dayOfWeek)` - Enable/disable day
- `updateShift()` - Modify time
- `addShift()` - Add another shift to day
- `removeShift()` - Remove a shift

**Services:**
- `addService()` - Add new service card
- `updateService(id, field, value)` - Update any field
- `removeService(id)` - Delete service

**Holidays:**
- `addHoliday()` - Add new holiday
- `updateHoliday(id, updates)` - Partial update
- `removeHoliday(id)` - Delete holiday

**Breaks:**
- `addBreak()` - Add new break
- `updateBreak(id, updates)` - Partial update
- `removeBreak(id)` - Delete break

### Submission Flow
```
1. Validate all required fields
2. Create business (POST /api/business)
3. Get businessId from response
4. Create all working hours (parallel)
5. Create all services (parallel)
6. Create all holidays (parallel)
7. Call onComplete() callback
```

---

## 📱 Responsive Design

### Desktop (≥1024px)
- Sidebar visible (264px width)
- Main content: Flexible width
- Two-column layouts for forms

### Tablet (768px-1023px)
- Sidebar collapses or becomes horizontal tabs
- Single-column forms
- Stacked service cards

### Mobile (<768px)
- No sidebar (or bottom tabs)
- Full-width content
- Stacked everything
- Touch-friendly controls

---

## 🎯 Quick Wins Implemented

1. ✅ Working hours per day
2. ✅ Multiple shifts support
3. ✅ Break time configuration
4. ✅ Holiday / time off management
5. ✅ Slot interval setting
6. ✅ Minimum notice time
7. ✅ Cancellation window
8. ✅ Service configuration with all fields
9. ✅ Smart defaults for quick setup
10. ✅ Review screen before submission

---

## 🔮 Future Enhancements

### Phase 2
- [ ] Staff assignment to services
- [ ] Multi-location support
- [ ] Custom form fields for bookings
- [ ] Service categories with icons
- [ ] Drag-and-drop service reordering
- [ ] Break time per specific day
- [ ] Recurring holiday patterns (monthly, yearly)

### Phase 3
- [ ] Online meeting integration (Zoom, Google Meet)
- [ ] Automated reminders configuration
- [ ] Payment settings per service
- [ ] Deposit/prepayment requirements
- [ ] Cancellation policies (refund rules)
- [ ] Custom booking page design

### Phase 4
- [ ] Analytics during setup (estimated bookings)
- [ ] Industry-specific templates
- [ ] Import from other platforms
- [ ] Multi-language support
- [ ] Accessibility improvements (WCAG)

---

## 🐛 Known Issues / Limitations

1. **Break times** are not enforced in booking engine yet (DB only)
2. **Multiple shifts** require booking engine update to respect gaps
3. **Recurring holidays** stored as single entries (need cron job)
4. **Service buffer time** not implemented in slot calculation
5. **Group bookings** (maxBookingsPerSlot) need booking logic update
6. **Online meeting links** not generated automatically yet

---

## 📊 Comparison with Industry Leaders

| Feature | Authpay V2 | Calendly | Fresha | Setmore |
|---------|------------|----------|--------|---------|
| Working Hours | ✅ Multi-shift | ✅ | ✅ | ✅ |
| Breaks | ✅ | ✅ | ✅ | ✅ |
| Holidays | ✅ Single/Range | ✅ | ✅ | ✅ |
| Services | ✅ Detailed | ✅ | ✅ | ✅ |
| Booking Rules | ✅ | ✅ | ✅ | ✅ |
| Smart Defaults | ✅ | ✅ | ✅ | ❌ |
| Staff Assignment | ❌ (Phase 2) | ✅ | ✅ | ✅ |
| Multi-location | ❌ (Phase 2) | ✅ | ✅ | ✅ |
| Online Meetings | ❌ (Phase 3) | ✅ | ❌ | ❌ |
| Custom Forms | ❌ (Phase 2) | ✅ | ✅ | ❌ |

---

## 🎓 Usage Guide for Business Owners

### First-Time Setup (Minimal Configuration)
1. Enter business name
2. Add 1 service (name, duration, price)
3. Accept all smart defaults
4. Click through to Step 6
5. Review and create
6. **Time:** ~3 minutes

### Complete Configuration
1. Fill all business info
2. Customize working hours
3. Add breaks and holidays
4. Add multiple services
5. Adjust booking settings
6. Review everything
7. **Time:** ~10-15 minutes

### Best Practices
- Start with smart defaults, customize later
- Add breaks to avoid back-to-back bookings
- Set realistic minimum notice (2-4 hours)
- Use buffer time for setup/cleanup
- Add holidays in advance
- Test booking page after creation

---

## 🔧 Developer Notes

### Component File
`src/components/ui/business-creation-wizard-v2.tsx`

### Dependencies
- React (useState, useCallback)
- Next.js (useRouter)
- shadcn/ui components (Card, Button, Input, etc.)
- Tailwind CSS

### Props
```typescript
interface BusinessCreationWizardProps {
  onComplete: () => void;          // Called after successful creation
  onCancel?: () => void;           // Optional cancel handler
  redirectOnSubscriptionRequired?: string;  // Where to send if no subscription
}
```

### Integration
```tsx
import { BusinessCreationWizardV2 } from '@/components/ui/business-creation-wizard-v2';

<BusinessCreationWizardV2
  onComplete={() => {
    // Refresh business data
    fetchBusiness();
  }}
  onCancel={() => {
    // Optional: Handle cancellation
    router.push('/dashboard');
  }}
/>
```

---

## 📝 Testing Checklist

### Functional Testing
- [ ] All 6 steps navigate correctly
- [ ] Back button works from any step
- [ ] Validation prevents invalid submissions
- [ ] Smart defaults are applied
- [ ] Multiple shifts can be added/removed
- [ ] Services can be added/removed
- [ ] Holidays can be added/removed
- [ ] Breaks can be added/removed
- [ ] Review screen shows all data correctly
- [ ] Submission creates all database records
- [ ] onComplete callback is called

### UI/UX Testing
- [ ] Sidebar highlights current step
- [ ] Progress bar animates smoothly
- [ ] Info banners show correct colors
- [ ] Helper text is helpful
- [ ] Empty states are clear
- [ ] Loading states show during submission
- [ ] Error messages are clear
- [ ] Buttons are appropriately sized
- [ ] Forms are easy to fill

### Edge Cases
- [ ] Business name with special characters
- [ ] All days closed
- [ ] No breaks added
- [ ] No holidays added
- [ ] Only 1 service added
- [ ] Very long service descriptions
- [ ] Minimum/maximum booking settings
- [ ] Cancel during step 3
- [ ] Submission failure handling

---

## 🎉 Success Metrics

### User Experience
- **Setup completion rate:** Target >80%
- **Average setup time:** Target <10 minutes
- **User satisfaction:** Target 4.5+/5
- **Support tickets:** Reduce by 50%

### Business Impact
- **Businesses created:** Increase by 200%
- **Services per business:** Average 3-5
- **Bookings enabled:** 100% of new businesses
- **Time to first booking:** Reduce to <24 hours

---

## 📚 Related Documentation
- [Database Schema](./04-DATABASE.md)
- [API Routes](./05-API-ROUTES.md)
- [Booking System](./docs/booking-system.md)
- [User Guide](./docs/user-guide.md)

---

**Version:** 2.0.0  
**Last Updated:** February 9, 2026  
**Status:** ✅ Production Ready

"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { DataTableColumn } from '@/components/ui/data-table/types';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import Loading from '@/components/Loading';
import {
  Plus,
  Edit,
  Trash2,
  Globe,
  RefreshCw,
  Star,
  AlertTriangle,
  Shield,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GatewayRule {
  id: string;
  countryCode: string | null;
  gateway: 'razorpay' | 'stripe' | 'none';
  isEnabled: boolean;
  isDefault: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

type GatewayOption = 'razorpay' | 'stripe' | 'none';

interface FormState {
  countryCodes: string[];
  ruleMode: 'selected' | 'except';
  gateway: GatewayOption;
  isEnabled: boolean;
  isDefault: boolean;
  notes: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GATEWAY_LABELS: Record<string, string> = {
  razorpay: 'RazorPay',
  stripe: 'Stripe',
  none: 'None (disabled)',
};

const GATEWAY_COLORS: Record<string, string> = {
  razorpay: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  stripe: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  none: 'bg-red-500/10 text-red-400 border-red-500/20',
};

/** ISO 3166-1 alpha-2 country list (subset — enough for a searchable dropdown) */
const COUNTRIES: { code: string; name: string }[] = [
  { code: 'AD', name: 'Andorra' }, { code: 'AE', name: 'United Arab Emirates' },
  { code: 'AF', name: 'Afghanistan' }, { code: 'AG', name: 'Antigua and Barbuda' },
  { code: 'AL', name: 'Albania' }, { code: 'AM', name: 'Armenia' },
  { code: 'AO', name: 'Angola' }, { code: 'AR', name: 'Argentina' },
  { code: 'AT', name: 'Austria' }, { code: 'AU', name: 'Australia' },
  { code: 'AZ', name: 'Azerbaijan' }, { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BB', name: 'Barbados' }, { code: 'BD', name: 'Bangladesh' },
  { code: 'BE', name: 'Belgium' }, { code: 'BF', name: 'Burkina Faso' },
  { code: 'BG', name: 'Bulgaria' }, { code: 'BH', name: 'Bahrain' },
  { code: 'BJ', name: 'Benin' }, { code: 'BN', name: 'Brunei' },
  { code: 'BO', name: 'Bolivia' }, { code: 'BR', name: 'Brazil' },
  { code: 'BS', name: 'Bahamas' }, { code: 'BT', name: 'Bhutan' },
  { code: 'BW', name: 'Botswana' }, { code: 'BY', name: 'Belarus' },
  { code: 'BZ', name: 'Belize' }, { code: 'CA', name: 'Canada' },
  { code: 'CD', name: 'Congo (DRC)' }, { code: 'CF', name: 'Central African Republic' },
  { code: 'CG', name: 'Congo' }, { code: 'CH', name: 'Switzerland' },
  { code: 'CI', name: "Côte d'Ivoire" }, { code: 'CL', name: 'Chile' },
  { code: 'CM', name: 'Cameroon' }, { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' }, { code: 'CR', name: 'Costa Rica' },
  { code: 'CU', name: 'Cuba' }, { code: 'CV', name: 'Cape Verde' },
  { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czech Republic' },
  { code: 'DE', name: 'Germany' }, { code: 'DJ', name: 'Djibouti' },
  { code: 'DK', name: 'Denmark' }, { code: 'DM', name: 'Dominica' },
  { code: 'DO', name: 'Dominican Republic' }, { code: 'DZ', name: 'Algeria' },
  { code: 'EC', name: 'Ecuador' }, { code: 'EE', name: 'Estonia' },
  { code: 'EG', name: 'Egypt' }, { code: 'ER', name: 'Eritrea' },
  { code: 'ES', name: 'Spain' }, { code: 'ET', name: 'Ethiopia' },
  { code: 'FI', name: 'Finland' }, { code: 'FJ', name: 'Fiji' },
  { code: 'FR', name: 'France' }, { code: 'GA', name: 'Gabon' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'GD', name: 'Grenada' },
  { code: 'GE', name: 'Georgia' }, { code: 'GH', name: 'Ghana' },
  { code: 'GM', name: 'Gambia' }, { code: 'GN', name: 'Guinea' },
  { code: 'GQ', name: 'Equatorial Guinea' }, { code: 'GR', name: 'Greece' },
  { code: 'GT', name: 'Guatemala' }, { code: 'GW', name: 'Guinea-Bissau' },
  { code: 'GY', name: 'Guyana' }, { code: 'HN', name: 'Honduras' },
  { code: 'HR', name: 'Croatia' }, { code: 'HT', name: 'Haiti' },
  { code: 'HU', name: 'Hungary' }, { code: 'ID', name: 'Indonesia' },
  { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' },
  { code: 'IN', name: 'India' }, { code: 'IQ', name: 'Iraq' },
  { code: 'IR', name: 'Iran' }, { code: 'IS', name: 'Iceland' },
  { code: 'IT', name: 'Italy' }, { code: 'JM', name: 'Jamaica' },
  { code: 'JO', name: 'Jordan' }, { code: 'JP', name: 'Japan' },
  { code: 'KE', name: 'Kenya' }, { code: 'KG', name: 'Kyrgyzstan' },
  { code: 'KH', name: 'Cambodia' }, { code: 'KI', name: 'Kiribati' },
  { code: 'KM', name: 'Comoros' }, { code: 'KN', name: 'Saint Kitts and Nevis' },
  { code: 'KP', name: 'North Korea' }, { code: 'KR', name: 'South Korea' },
  { code: 'KW', name: 'Kuwait' }, { code: 'KZ', name: 'Kazakhstan' },
  { code: 'LA', name: 'Laos' }, { code: 'LB', name: 'Lebanon' },
  { code: 'LC', name: 'Saint Lucia' }, { code: 'LI', name: 'Liechtenstein' },
  { code: 'LK', name: 'Sri Lanka' }, { code: 'LR', name: 'Liberia' },
  { code: 'LS', name: 'Lesotho' }, { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' }, { code: 'LV', name: 'Latvia' },
  { code: 'LY', name: 'Libya' }, { code: 'MA', name: 'Morocco' },
  { code: 'MC', name: 'Monaco' }, { code: 'MD', name: 'Moldova' },
  { code: 'ME', name: 'Montenegro' }, { code: 'MG', name: 'Madagascar' },
  { code: 'MH', name: 'Marshall Islands' }, { code: 'MK', name: 'North Macedonia' },
  { code: 'ML', name: 'Mali' }, { code: 'MM', name: 'Myanmar' },
  { code: 'MN', name: 'Mongolia' }, { code: 'MR', name: 'Mauritania' },
  { code: 'MT', name: 'Malta' }, { code: 'MU', name: 'Mauritius' },
  { code: 'MV', name: 'Maldives' }, { code: 'MW', name: 'Malawi' },
  { code: 'MX', name: 'Mexico' }, { code: 'MY', name: 'Malaysia' },
  { code: 'MZ', name: 'Mozambique' }, { code: 'NA', name: 'Namibia' },
  { code: 'NE', name: 'Niger' }, { code: 'NG', name: 'Nigeria' },
  { code: 'NI', name: 'Nicaragua' }, { code: 'NL', name: 'Netherlands' },
  { code: 'NO', name: 'Norway' }, { code: 'NP', name: 'Nepal' },
  { code: 'NR', name: 'Nauru' }, { code: 'NZ', name: 'New Zealand' },
  { code: 'OM', name: 'Oman' }, { code: 'PA', name: 'Panama' },
  { code: 'PE', name: 'Peru' }, { code: 'PG', name: 'Papua New Guinea' },
  { code: 'PH', name: 'Philippines' }, { code: 'PK', name: 'Pakistan' },
  { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' },
  { code: 'PW', name: 'Palau' }, { code: 'PY', name: 'Paraguay' },
  { code: 'QA', name: 'Qatar' }, { code: 'RO', name: 'Romania' },
  { code: 'RS', name: 'Serbia' }, { code: 'RU', name: 'Russia' },
  { code: 'RW', name: 'Rwanda' }, { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SB', name: 'Solomon Islands' }, { code: 'SC', name: 'Seychelles' },
  { code: 'SD', name: 'Sudan' }, { code: 'SE', name: 'Sweden' },
  { code: 'SG', name: 'Singapore' }, { code: 'SI', name: 'Slovenia' },
  { code: 'SK', name: 'Slovakia' }, { code: 'SL', name: 'Sierra Leone' },
  { code: 'SM', name: 'San Marino' }, { code: 'SN', name: 'Senegal' },
  { code: 'SO', name: 'Somalia' }, { code: 'SR', name: 'Suriname' },
  { code: 'SS', name: 'South Sudan' }, { code: 'ST', name: 'São Tomé and Príncipe' },
  { code: 'SV', name: 'El Salvador' }, { code: 'SY', name: 'Syria' },
  { code: 'SZ', name: 'Eswatini' }, { code: 'TD', name: 'Chad' },
  { code: 'TG', name: 'Togo' }, { code: 'TH', name: 'Thailand' },
  { code: 'TJ', name: 'Tajikistan' }, { code: 'TL', name: 'Timor-Leste' },
  { code: 'TM', name: 'Turkmenistan' }, { code: 'TN', name: 'Tunisia' },
  { code: 'TO', name: 'Tonga' }, { code: 'TR', name: 'Turkey' },
  { code: 'TT', name: 'Trinidad and Tobago' }, { code: 'TV', name: 'Tuvalu' },
  { code: 'TZ', name: 'Tanzania' }, { code: 'UA', name: 'Ukraine' },
  { code: 'UG', name: 'Uganda' }, { code: 'US', name: 'United States' },
  { code: 'UY', name: 'Uruguay' }, { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VA', name: 'Vatican City' }, { code: 'VC', name: 'Saint Vincent' },
  { code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Vietnam' },
  { code: 'VU', name: 'Vanuatu' }, { code: 'WS', name: 'Samoa' },
  { code: 'YE', name: 'Yemen' }, { code: 'ZA', name: 'South Africa' },
  { code: 'ZM', name: 'Zambia' }, { code: 'ZW', name: 'Zimbabwe' },
];

function getCountryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    year: 'numeric', month: 'short', day: '2-digit',
  });
}

const EMPTY_FORM: FormState = {
  countryCodes: [],
  ruleMode: 'selected',
  gateway: 'stripe',
  isEnabled: true,
  isDefault: false,
  notes: '',
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function GatewaySettings() {
  const { toast } = useToast();

  // ---- data state ----
  const [rules, setRules] = useState<GatewayRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ---- dialog state ----
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<GatewayRule | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // ---- country search in form ----
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // ---- delete confirm ----
  const [deleteTarget, setDeleteTarget] = useState<GatewayRule | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // ---- platform settings state ----
  const [platformSettings, setPlatformSettings] = useState<{ autoProcessRefunds: boolean, refundsEnabled: boolean }>({ autoProcessRefunds: false, refundsEnabled: true });
  const [settingsLoading, setSettingsLoading] = useState(true);

  // --------------------------------------------------------------------------
  // Fetch
  // --------------------------------------------------------------------------

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payment-gateways');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to load rules');
      setRules(json.data ?? []);
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchPlatformSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/admin/platform-settings');
      const json = await res.json();
      if (res.ok && json.success) {
        setPlatformSettings({
          autoProcessRefunds: json.data?.autoProcessRefunds || false,
          refundsEnabled: json.data?.refundsEnabled ?? true
        });
      }
    } catch (err) {
      console.error("Failed to load platform settings:", err);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const toggleAutoProcessRefunds = async (checked: boolean) => {
    try {
      setSettingsLoading(true);
      const res = await fetch('/api/admin/platform-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoProcessRefunds: checked }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to update settings');
      setPlatformSettings(prev => ({ ...prev, autoProcessRefunds: checked }));
      toast({ title: 'Success', description: 'Refund automation setting updated', variant: 'success' });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
      // Revert optimism if implemented, but we just re-fetch on next render
    } finally {
      setSettingsLoading(false);
    }
  };

  const toggleRefundsEnabled = async (checked: boolean) => {
    try {
      setSettingsLoading(true);
      const res = await fetch('/api/admin/platform-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundsEnabled: checked }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to update settings');
      setPlatformSettings(prev => ({ ...prev, refundsEnabled: checked }));
      toast({ title: 'Success', description: `Refunds feature ${checked ? 'enabled' : 'disabled'}`, variant: 'success' });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSettingsLoading(false);
    }
  };

  // ---- Plan Visibility Control ----
  const [vendorPlans, setVendorPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  const fetchVendorPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const [dbPlansRes, rpPlansRes, stripePlansRes] = await Promise.all([
        fetch('/api/admin/subscription-plans'),
        fetch('/api/payments/razorpay-plans?count=100').catch(() => ({ ok: false })),
        fetch('/api/payments/stripe-products?limit=100').catch(() => ({ ok: false }))
      ]);

      const dbJson = await dbPlansRes.json();
      const dbPlans = dbJson.success ? dbJson.data.plans : [];

      let rpPlansRaw = [];
      if ('json' in rpPlansRes) {
        const rpJson = await (rpPlansRes as Response).json();
        rpPlansRaw = rpJson.success && Array.isArray(rpJson.items) ? rpJson.items : [];
      }

      let stripePlansRaw = [];
      if ('json' in stripePlansRes) {
        const stripeJson = await (stripePlansRes as Response).json();
        stripePlansRaw = stripeJson.success && Array.isArray(stripeJson.data) ? stripeJson.data : [];
      }

      const combined: any[] = [];
      const dbSeenIds = new Set();

      // DB plans mapped to a gateway
      dbPlans.forEach((plan: any) => {
        // Detect gateway and related identifier dynamically
        let gateway = plan.gateway;
        let platformId = plan.platformId || plan.gatewayId;

        if (!gateway) {
          if (plan.razorpaySubscriptionPlanId) {
            gateway = 'razorpay';
            platformId = plan.razorpaySubscriptionPlanId;
          } else if (plan.stripeProductId || plan.stripePriceId) {
            gateway = 'stripe';
            platformId = plan.stripeProductId || plan.stripePriceId;
          }
        }

        if (gateway && platformId) {
          dbSeenIds.add(platformId);

          // Determine currency based on plan or fallback to country/gateway defaults
          let currencyCode = plan.currency;
          if (!currencyCode) {
            currencyCode = gateway === 'razorpay' ? 'INR' : 'USD';
          }
          const currencySymbol = currencyCode === 'INR' ? '₹' : (currencyCode === 'USD' ? '$' : currencyCode);

          combined.push({
            id: platformId || plan.id,
            dbId: plan.id,
            gateway: gateway,
            name: plan.name,
            isVisibleToCustomers: plan.isVisibleToCustomers ?? true,
            price: Number(plan.price || 0),
            currency: currencySymbol,
            interval: plan.billingCycle || 'N/A',
          });
        }
      });

      // Unmapped Razorpay plans
      rpPlansRaw.forEach((rpPlan: any) => {
        if (!dbSeenIds.has(rpPlan.id)) {
          const amt = Number(rpPlan.item?.amount || rpPlan.item?.unit_amount || 0) / 100;
          combined.push({
            id: rpPlan.id,
            dbId: rpPlan.id, // we pass Razorpay ID, API handler creates rows lazily
            gateway: 'razorpay',
            name: rpPlan.item?.name || 'Unnamed Plan',
            isVisibleToCustomers: false, // Default to OFF until purposefully toggled
            price: amt,
            currency: rpPlan.item?.currency === 'INR' ? '₹' : (rpPlan.item?.currency || ''),
            interval: rpPlan.period || 'N/A',
          });
        }
      });

      // Unmapped Stripe plans
      stripePlansRaw.forEach((stripePlan: any) => {
        if (!dbSeenIds.has(stripePlan.id)) {
          let amt = 0;
          let curr = '';
          let interval = 'N/A';
          if (stripePlan.default_price && typeof stripePlan.default_price !== 'string') {
            const dp = stripePlan.default_price;
            amt = (dp.unit_amount || 0) / 100;
            curr = dp.currency === 'inr' ? '₹' : (dp.currency === 'usd' ? '$' : dp.currency?.toUpperCase() || '');
            interval = dp.recurring?.interval === 'year' ? 'yearly'
              : (dp.recurring?.interval || dp.recurring?.interval_count + ' ' + dp.recurring?.interval || 'monthly');
          }
          combined.push({
            id: stripePlan.id,
            dbId: stripePlan.id, // pass Stripe Product ID
            gateway: 'stripe',
            name: stripePlan.name || 'Unnamed Plan',
            isVisibleToCustomers: false, // Default to OFF until purposefully toggled
            price: amt,
            currency: curr,
            interval: interval,
          });
        }
      });

      setVendorPlans(combined);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to fully load Vendor Plans.', variant: 'destructive' });
    } finally {
      setPlansLoading(false);
    }
  }, [toast]);

  const toggleVendorPlanVisibility = async (dbId: string, currentVisibility: boolean) => {
    try {
      setPlansLoading(true);
      const response = await fetch(`/api/admin/subscription-plans/${encodeURIComponent(dbId)}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisibleToCustomers: !currentVisibility }),
      });

      if (!response.ok) throw new Error('Update failed');
      toast({ title: 'Success', description: `Plan visibility updated`, variant: 'success' });
      await fetchVendorPlans();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
      setPlansLoading(false);
    }
  };

  const toggleGatewayAll = async (gateway: 'razorpay' | 'stripe', enable: boolean) => {
    const plansToToggle = vendorPlans.filter(p => p.gateway === gateway && p.isVisibleToCustomers !== enable);
    if (plansToToggle.length === 0) {
      toast({ title: 'Info', description: `All ${GATEWAY_LABELS[gateway]} plans are already ${enable ? 'enabled' : 'disabled'}`, variant: 'default' });
      return;
    }

    setPlansLoading(true);
    try {
      await Promise.all(
        plansToToggle.map(p => fetch(`/api/admin/subscription-plans/${encodeURIComponent(p.dbId)}/visibility`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isVisibleToCustomers: enable })
        }))
      );
      toast({ title: 'Success', description: `All ${GATEWAY_LABELS[gateway]} plans toggled`, variant: 'success' });
      await fetchVendorPlans();
    } catch (err) {
      toast({ title: 'Error', description: 'Bulk update failed', variant: 'destructive' });
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    fetchVendorPlans();
    fetchPlatformSettings();
  }, [fetchRules, fetchVendorPlans, fetchPlatformSettings]);

  // --------------------------------------------------------------------------
  // Derived stats
  // --------------------------------------------------------------------------

  const globalRule = rules.find((r) => r.countryCode === null);
  const countryRules = rules.filter((r) => r.countryCode !== null);
  const enabledCount = rules.filter((r) => r.isEnabled).length;
  const disabledCount = rules.filter((r) => !r.isEnabled).length;

  // --------------------------------------------------------------------------
  // Sorted table rows
  // --------------------------------------------------------------------------

  const sorted = [...rules].sort((a, b) => {
    if (a.countryCode === null) return -1;
    if (b.countryCode === null) return 1;
    return a.countryCode.localeCompare(b.countryCode);
  });

  // --------------------------------------------------------------------------
  // Form helpers
  // --------------------------------------------------------------------------

  const openCreate = () => {
    setEditRule(null);
    setForm(EMPTY_FORM);
    setCountrySearch('');
    setDialogOpen(true);
  };

  const openEdit = (rule: GatewayRule) => {
    setEditRule(rule);
    setForm({
      countryCodes: rule.countryCode ? [rule.countryCode] : [],
      ruleMode: 'selected',
      gateway: rule.gateway,
      isEnabled: rule.isEnabled,
      isDefault: rule.isDefault,
      notes: rule.notes ?? '',
    });
    setCountrySearch(rule.countryCode ? getCountryName(rule.countryCode) : '');
    setDialogOpen(true);
  };

  const filteredCountries = countrySearch
    ? COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
    )
    : COUNTRIES;

  const visibleCountries = filteredCountries
    .filter((c) => !form.countryCodes.includes(c.code))
    .slice(0, 10);

  const removeSelectedCountry = (code: string) => {
    setForm((f) => ({ ...f, countryCodes: f.countryCodes.filter((c) => c !== code) }));
  };

  const addSelectedCountry = (code: string, name: string) => {
    setForm((f) => {
      if (f.countryCodes.includes(code)) return f;
      return { ...f, countryCodes: [...f.countryCodes, code] };
    });
    setCountrySearch('');
    setShowCountryDropdown(false);
    if (!editRule) {
      toast({ title: 'Country added', description: `${name} added to this rule.` });
    }
  };

  // --------------------------------------------------------------------------
  // Quick-toggle enabled/disabled without opening dialog
  // --------------------------------------------------------------------------

  const quickToggle = async (rule: GatewayRule) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/payment-gateways/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !rule.isEnabled }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Update failed');
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, isEnabled: !r.isEnabled } : r))
      );
      toast({
        title: `Rule ${!rule.isEnabled ? 'enabled' : 'disabled'}`,
        description: `${rule.countryCode ? getCountryName(rule.countryCode) : 'Global default'} → ${GATEWAY_LABELS[rule.gateway]}`,
      });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // Save (create / update)
  // --------------------------------------------------------------------------

  const handleSave = async () => {
    const isEditingGlobalRule = Boolean(editRule && editRule.countryCode === null);

    if (!isEditingGlobalRule && form.countryCodes.length === 0) {
      toast({ title: 'Validation error', description: 'Select at least one country.', variant: 'destructive' });
      return;
    }

    if (!isEditingGlobalRule && form.ruleMode === 'except' && form.gateway === 'none') {
      toast({
        title: 'Validation error',
        description: 'Except mode requires RazorPay or Stripe, not None.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      let res: Response;
      if (editRule) {
        const shouldUseBulkEditPath = !isEditingGlobalRule && (form.ruleMode === 'except' || form.countryCodes.length > 1);

        if (shouldUseBulkEditPath) {
          const payload = {
            countryCodes: form.countryCodes,
            isExcept: form.ruleMode === 'except',
            gateway: form.gateway,
            isEnabled: form.isEnabled,
            isDefault: false,
            notes: form.notes || null,
          };

          res = await fetch('/api/admin/payment-gateways', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            await fetch(`/api/admin/payment-gateways/${editRule.id}`, { method: 'DELETE' }).catch(() => undefined);
          }
        } else {
          const payload = {
            countryCode: isEditingGlobalRule ? null : (form.countryCodes[0] || null),
            gateway: form.gateway,
            isEnabled: form.isEnabled,
            isDefault: isEditingGlobalRule,
            notes: form.notes || null,
          };
          res = await fetch(`/api/admin/payment-gateways/${editRule.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
      } else {
        const payload = {
          countryCode: null,
          countryCodes: form.countryCodes,
          isExcept: form.ruleMode === 'except',
          gateway: form.gateway,
          isEnabled: form.isEnabled,
          isDefault: false,
          notes: form.notes || null,
        };
        res = await fetch('/api/admin/payment-gateways', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Save failed');

      toast({
        title: editRule ? 'Rule updated' : 'Rule created',
        description: editRule ? 'Gateway rule has been updated.' : 'New gateway rule has been added.',
      });
      setDialogOpen(false);
      fetchRules();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // Delete
  // --------------------------------------------------------------------------

  const confirmDelete = (rule: GatewayRule) => {
    setDeleteTarget(rule);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/payment-gateways/${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Delete failed');
      toast({ title: 'Rule deleted', description: 'Gateway rule removed.' });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchRules();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  const ruleColumns: DataTableColumn<GatewayRule>[] = useMemo(() => [
    {
      id: "countryCode",
      header: "Country / Scope",
      accessorKey: "countryCode",
      sortable: true,
      searchable: true,
      filterType: "text",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.countryCode === null ? (
            <>
              <Globe className="w-4 h-4 text-yellow-400 shrink-0" />
              <div>
                <span className="font-medium text-yellow-300">Global Default</span>
              </div>
            </>
          ) : (
            <>
              <span className="text-lg leading-none">{countryFlagEmoji(row.countryCode)}</span>
              <div>
                <span className="font-medium">{getCountryName(row.countryCode)}</span>
                <span className="ml-1.5 text-xs text-muted-foreground">{row.countryCode}</span>
              </div>
            </>
          )}
        </div>
      )
    },
    {
      id: "gateway",
      header: "Gateway",
      accessorKey: "gateway",
      sortable: true,
      searchable: true,
      filterType: "select",
      options: [
        { label: "RazorPay", value: "razorpay" },
        { label: "Stripe", value: "stripe" },
        { label: "None", value: "none" }
      ],
      cell: ({ row }) => (
        <Badge variant="outline" className={`text-xs ${GATEWAY_COLORS[row.gateway]}`}>
          {GATEWAY_LABELS[row.gateway]}
        </Badge>
      )
    },
    {
      id: "isEnabled",
      header: "Status",
      accessorKey: "isEnabled",
      sortable: true,
      searchable: true,
      filterType: "boolean",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.isEnabled}
            onCheckedChange={() => quickToggle(row)}
            disabled={saving}
          />
          <span className={`text-xs ${row.isEnabled ? 'text-green-400' : 'text-red-400'}`}>
            {row.isEnabled ? 'ON' : 'OFF'}
          </span>
        </div>
      )
    },
    {
      id: "isDefault",
      header: "Type",
      accessorKey: "isDefault",
      sortable: true,
      searchable: true,
      filterType: "boolean",
      cell: ({ row }) => (
        row.isDefault ? (
          <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
            <Star className="w-2.5 h-2.5 mr-1" /> Default
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
            Country
          </Badge>
        )
      )
    },
    {
      id: "notes",
      header: "Notes",
      accessorKey: "notes",
      searchable: true,
      filterType: "text",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground max-w-40 truncate inline-block">
          {row.notes ?? '—'}
        </span>
      )
    },
    {
      id: "updatedAt",
      header: "Last Updated",
      accessorKey: "updatedAt",
      sortable: true,
      searchable: true,
      filterType: "date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {fmtDate(row.updatedAt)}
        </span>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => openEdit(row)}
            title="Edit rule"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          {row.countryCode !== null && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={() => confirmDelete(row)}
              title="Delete rule"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [saving]);

  const vendorPlanColumns: DataTableColumn<any>[] = useMemo(() => [
    {
      id: "gateway",
      header: "Gateway",
      accessorKey: "gateway",
      sortable: true,
      searchable: true,
      filterType: "select",
      options: [
        { label: "RazorPay", value: "razorpay" },
        { label: "Stripe", value: "stripe" }
      ],
      cell: ({ row }) => (
        <Badge variant="outline" className={`text-xs ${GATEWAY_COLORS[row.gateway]}`}>
          {GATEWAY_LABELS[row.gateway]}
        </Badge>
      )
    },
    {
      id: "name",
      header: "Plan Name",
      accessorKey: "name",
      sortable: true,
      searchable: true,
      filterType: "text",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.name}
          <p className="text-xs text-muted-foreground opacity-60 m-0 p-0 font-normal">{row.id}</p>
        </div>
      )
    },
    {
      id: "price",
      header: "Price",
      accessorKey: "price",
      sortable: true,
      searchable: true,
      filterType: "text",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.currency}{Number(row.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      id: "interval",
      header: "Interval",
      accessorKey: "interval",
      sortable: true,
      searchable: true,
      filterType: "text",
      cell: ({ row }) => (
        <span className="capitalize text-muted-foreground">
          {row.interval}
        </span>
      )
    },
    {
      id: "isVisibleToCustomers",
      header: "Visibility Toggle",
      accessorKey: "isVisibleToCustomers",
      sortable: true,
      searchable: true,
      filterType: "boolean",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <span className={`text-xs ${row.isVisibleToCustomers ? 'text-green-500' : 'text-red-500'}`}>
            {row.isVisibleToCustomers ? 'ON' : 'OFF'}
          </span>
          <Switch
            checked={row.isVisibleToCustomers}
            onCheckedChange={() => toggleVendorPlanVisibility(row.dbId, row.isVisibleToCustomers)}
            disabled={plansLoading}
          />
        </div>
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [plansLoading]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payment Gateway Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Control which payment gateway is shown per country. Country-specific rules override the global default.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchRules} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Rules</p>
                <p className="text-xl font-bold">{rules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Rules</p>
                <p className="text-xl font-bold">{enabledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Disabled</p>
                <p className="text-xl font-bold">{disabledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Shield className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Countries</p>
                <p className="text-xl font-bold">{countryRules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Platform Settings ── */}
      <Card className="border border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Enable Refunds Feature</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Global switch to enable or disable the refund feature for users. When disabled, the Request Refund button is hidden.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">
                {platformSettings.refundsEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                checked={platformSettings.refundsEnabled}
                onCheckedChange={toggleRefundsEnabled}
                disabled={settingsLoading}
              />
            </div>
          </div>

          {platformSettings.refundsEnabled && (
            <>
              <div className="h-px bg-primary/10 w-full" />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Automatic Refund Processing</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      If enabled, user-initiated refund requests will be automatically sent to the payment provider without requiring admin manual review.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground mr-2">
                    {platformSettings.autoProcessRefunds ? 'Enabled' : 'Disabled'}
                  </span>
                  <Switch
                    checked={platformSettings.autoProcessRefunds}
                    onCheckedChange={toggleAutoProcessRefunds}
                    disabled={settingsLoading}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Global default banner ── */}
      {globalRule ? (
        <Card className="border border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-400 shrink-0" />
                <div>
                  <div className="text-sm font-medium flex items-center flex-wrap gap-1.5">
                    Global Default → <span className="font-bold">{GATEWAY_LABELS[globalRule.gateway]}</span>
                    {!globalRule.isEnabled && (
                      <Badge variant="outline" className="text-xs text-red-400 border-red-500/30">disabled</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Applies to all countries without a specific rule.{globalRule.notes ? ` · ${globalRule.notes}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={globalRule.isEnabled}
                  onCheckedChange={() => quickToggle(globalRule)}
                  disabled={saving}
                />
                <Button variant="outline" size="sm" onClick={() => openEdit(globalRule)}>
                  <Edit className="w-3 h-3 mr-1" /> Edit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-orange-500/30 bg-orange-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-300">No global default rule set</p>
                <p className="text-xs text-muted-foreground">
                  Without a global default, the system falls back to the hard-coded default (Stripe).
                  <button className="ml-1 underline text-orange-300 hover:text-orange-200" onClick={openCreate}>
                    Create a global default →
                  </button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Table ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base">Country Rules</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable selectable={true}
            columns={ruleColumns}
            data={sorted}
            searchable={true}
            columnSearch={true}
            pagination={true}
            export={true}
            title="Country Rules"
          />
        </CardContent>
      </Card>

      {/* ── Plan Visibility Control ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base">Plan Visibility Control</CardTitle>
              <CardDescription>
                Manage which plans are visible to customers per payment gateway.
              </CardDescription>
            </div>
            {vendorPlans.length > 0 && (
              <div className="flex flex-wrap gap-2 text-sm justify-end">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/30 border rounded-lg">
                  <span className="text-muted-foreground font-medium">RazorPay:</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={() => toggleGatewayAll('razorpay', true)} disabled={plansLoading}>Enable All</Button>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => toggleGatewayAll('razorpay', false)} disabled={plansLoading}>Disable All</Button>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/30 border rounded-lg">
                  <span className="text-muted-foreground font-medium">Stripe:</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={() => toggleGatewayAll('stripe', true)} disabled={plansLoading}>Enable All</Button>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => toggleGatewayAll('stripe', false)} disabled={plansLoading}>Disable All</Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="">
          {plansLoading && vendorPlans.length === 0 ? (
            <div className="flex justify-center items-center py-10">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable selectable={true}
              columns={vendorPlanColumns}
              data={vendorPlans}
              searchable={true}
              pagination={true}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Help card ── */}
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
            <Shield className="w-4 h-4" />
            How routing works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1.5">
          <p>1. When a customer visits, their country is detected from Cloudflare/Vercel geo-headers.</p>
          <p>2. The system looks for a <span className="text-foreground font-medium">country-specific rule</span> matching that country code (highest priority).</p>
          <p>3. If none found, it uses the <span className="text-yellow-400 font-medium">Global Default rule</span> (marked with a star).</p>
          <p>4. If no DB rule exists, the hard-coded fallback applies: <strong>India → RazorPay</strong>, everywhere else → <strong>Stripe</strong>.</p>
          <p>5. Rules with <strong>Status: OFF</strong> are ignored even if they match.</p>
        </CardContent>
      </Card>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* Create / Edit Dialog                                                 */}
      {/* ──────────────────────────────────────────────────────────────────── */}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editRule ? 'Edit Gateway Rule' : 'Add Gateway Rule'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {!(editRule && editRule.countryCode === null) && (
              <div className="space-y-1.5">
                <Label>Rule Scope</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, ruleMode: 'selected' }))}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${form.ruleMode === 'selected'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 ring-1 ring-blue-400/40'
                      : 'border-border text-muted-foreground hover:border-muted-foreground/50'
                      }`}
                  >
                    Apply to selected countries
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, ruleMode: 'except' }))}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${form.ruleMode === 'except'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 ring-1 ring-amber-400/40'
                      : 'border-border text-muted-foreground hover:border-muted-foreground/50'
                      }`}
                  >
                    Show in all countries except selected
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {form.ruleMode === 'selected'
                    ? 'The selected gateway is shown only in selected countries.'
                    : 'The selected gateway is shown globally. Selected countries automatically get the other gateway.'}
                </p>
              </div>
            )}

            {/* Country picker (only when not global default) */}
            {!(editRule && editRule.countryCode === null) && (
              <div className="space-y-1.5 relative">
                <Label htmlFor="country">Countries</Label>
                <Input
                  id="country"
                  placeholder="Search and add countries…"
                  value={countrySearch}
                  autoComplete="off"
                  onChange={(e) => {
                    setCountrySearch(e.target.value);
                    setShowCountryDropdown(true);
                  }}
                  onFocus={() => setShowCountryDropdown(true)}
                />
                {form.countryCodes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {form.countryCodes.map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs text-blue-300"
                      >
                        {countryFlagEmoji(code)} {getCountryName(code)} ({code})
                        <button
                          type="button"
                          className="text-blue-300/80 hover:text-blue-200"
                          onClick={() => removeSelectedCountry(code)}
                          aria-label={`Remove ${getCountryName(code)}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {showCountryDropdown && visibleCountries.length > 0 && (
                  <div className="absolute z-50 w-full mt-0.5 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {visibleCountries.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addSelectedCountry(c.code, c.name);
                        }}
                      >
                        <span>{countryFlagEmoji(c.code)}</span>
                        <span>{c.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{c.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Gateway selector */}
            <div className="space-y-1.5">
              <Label>Payment Gateway</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['razorpay', 'stripe', 'none'] as GatewayOption[]).map((gw) => (
                  <button
                    key={gw}
                    type="button"
                    disabled={!(editRule && editRule.countryCode === null) && form.ruleMode === 'except' && gw === 'none'}
                    onClick={() => setForm((f) => ({ ...f, gateway: gw }))}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${form.gateway === gw
                      ? `${GATEWAY_COLORS[gw]} ring-1 ring-current`
                      : 'border-border text-muted-foreground hover:border-muted-foreground/50'
                      }`}
                  >
                    {GATEWAY_LABELS[gw]}
                  </button>
                ))}
              </div>
              {form.gateway === 'none' && (
                <p className="text-xs text-orange-400 mt-1">
                  ⚠ Setting gateway to &quot;None&quot; will disable payments for this scope.
                </p>
              )}
            </div>

            {/* Enabled toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">Rule Enabled</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Disabled rules are ignored during routing.
                </p>
              </div>
              <Switch
                checked={form.isEnabled}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isEnabled: v }))}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="e.g. India uses RazorPay for local payments"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                maxLength={255}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editRule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* Delete Confirm Dialog                                                */}
      {/* ──────────────────────────────────────────────────────────────────── */}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="w-4 h-4" />
              Delete Gateway Rule
            </DialogTitle>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4 pt-1">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete the rule for{' '}
                <strong className="text-foreground">
                  {deleteTarget.countryCode
                    ? `${countryFlagEmoji(deleteTarget.countryCode)} ${getCountryName(deleteTarget.countryCode)}`
                    : 'Global Default'}
                </strong>
                ? This cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                  {saving ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Country flag emoji helper
// ---------------------------------------------------------------------------

function countryFlagEmoji(code: string): string {
  // Regional indicator symbols: A = 0x1F1E6, offset by char code - 65
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

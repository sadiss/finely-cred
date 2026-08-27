import React from 'react';
import {
  BriefcaseBusiness,
  Building2,
  Columns3,
  CreditCard,
  Crown,
  Facebook,
  FileText,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Settings,
  Shield,
  Sparkles,
  ToggleRight,
} from 'lucide-react';
import type { SettingsTab } from '../../../../pages/admin/AdminSettingsPage';

export type InspectorCategoryTab = {
  key: SettingsTab;
  label: string;
  icon: React.ReactNode;
  purpose: string;
};

export const INSPECTOR_CATEGORY_TABS: InspectorCategoryTab[] = [
  { key: 'site', label: 'Site', icon: <Settings size={16} />, purpose: 'Branding, legal links, contact defaults.' },
  { key: 'comms', label: 'Comms', icon: <Mail size={16} />, purpose: 'Delivery defaults, templates, channels.' },
  { key: 'chat', label: 'Chat', icon: <MessageCircle size={16} />, purpose: 'Assistant configuration and routing.' },
  { key: 'meta', label: 'Meta', icon: <Facebook size={16} />, purpose: 'Facebook / Instagram Lead Ads and OAuth.' },
  { key: 'stripe', label: 'Stripe', icon: <CreditCard size={16} />, purpose: 'Stripe keys and checkout behavior.' },
  { key: 'denefits', label: 'In‑House Financing', icon: <Building2 size={16} />, purpose: 'In-house financing contracts and mapping.' },
  { key: 'nora', label: 'Nora Capital', icon: <BriefcaseBusiness size={16} />, purpose: 'Nora Capital integration settings.' },
  { key: 'pricing', label: 'Pricing Controls', icon: <LayoutDashboard size={16} />, purpose: 'Catalog toggles and package visibility.' },
  { key: 'workboard', label: 'WorkBoard', icon: <Columns3 size={16} />, purpose: 'WorkBoard stages and SLA defaults.' },
  { key: 'features', label: 'Features', icon: <ToggleRight size={16} />, purpose: 'Feature flags and rollout switches.' },
  { key: 'appearance', label: 'Appearance', icon: <Sparkles size={16} />, purpose: 'Admin chrome and theme defaults.' },
  { key: 'security', label: 'Security', icon: <Shield size={16} />, purpose: 'Admin allowlist and policies.' },
  { key: 'heta', label: 'Head of Society', icon: <Crown size={16} />, purpose: 'HOS access codes and program controls.' },
  { key: 'customFields', label: 'Custom Fields', icon: <FileText size={16} />, purpose: 'Custom fields for partners and cases.' },
];

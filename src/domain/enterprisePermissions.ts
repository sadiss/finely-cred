/**
 * Enterprise permission definitions — 80+ granular permissions for full operating control.
 * Grouped by domain for Team & Roles UI and permission checks.
 */

export type EnterprisePermissionKey = keyof typeof ENTERPRISE_PERMISSIONS;

export const ENTERPRISE_PERMISSION_GROUPS = [
  // 1. Team & access (8)
  'canManageTeam',
  'canInviteMembers',
  'canRemoveMembers',
  'canAssignRoles',
  'canViewTeamActivity',
  'canAccessAdminArea',
  'canSwitchTenants',
  'canManageTenants',

  // 2. Billing & payments (7)
  'canManageBilling',
  'canViewBilling',
  'canIssueRefunds',
  'canApplyCredits',
  'canManageSubscriptions',
  'canViewPaymentHistory',
  'canManageInvoices',

  // 3. Customers & partners (8)
  'canViewAllClients',
  'canCreatePartners',
  'canEditPartners',
  'canDeletePartners',
  'canImportPartners',
  'canViewPartnerPii',
  'canMergePartners',
  'canAssignPartnersToAgents',

  // 4. Data & export (6)
  'canExportData',
  'canExportPii',
  'canBulkExport',
  'canScheduleExports',
  'canViewAuditLogs',
  'canDeleteAuditLogs',

  // 5. Vault & secrets (5)
  'canAccessVault',
  'canCreateVaultSecrets',
  'canEditVaultSecrets',
  'canDeleteVaultSecrets',
  'canShareVaultSecrets',

  // 6. Finance tools (6)
  'canUseFinanceTools',
  'canManageFinanceAllocator',
  'canApproveAllocations',
  'canViewFinanceReports',
  'canReconcileAccounts',
  'canManageVendors',

  // 7. Letters & disputes (8)
  'canViewLetters',
  'canCreateLetters',
  'canEditLetters',
  'canDeleteLetters',
  'canGenerateDisputeLetters',
  'canMailLetters',
  'canViewLettersVault',
  'canManageLetterTemplates',

  // 8. Cases & tasks (7)
  'canViewCases',
  'canCreateCases',
  'canEditCases',
  'canCloseCases',
  'canAssignCases',
  'canViewTasks',
  'canManageTasks',

  // 9. Reports & credit intel (7)
  'canViewReports',
  'canUploadReports',
  'canParseReports',
  'canViewCreditIntel',
  'canGenerateDisputes',
  'canViewParsinglab',
  'canManageReportProviders',

  // 10. Evidence & documents (6)
  'canViewEvidence',
  'canUploadEvidence',
  'canDeleteEvidence',
  'canViewDocuments',
  'canUploadDocuments',
  'canDeleteDocuments',

  // 11. Courses & education (5)
  'canViewCourses',
  'canCreateCourses',
  'canEditCourses',
  'canPublishCourses',
  'canViewCourseAnalytics',

  // 12. CRM & leads (6)
  'canViewLeads',
  'canCreateLeads',
  'canEditLeads',
  'canAssignLeads',
  'canViewLeadIntel',
  'canManageCrmProspects',

  // 13. Automation (5)
  'canViewAutomations',
  'canCreateAutomations',
  'canRunAutomations',
  'canEditAutomations',
  'canDeleteAutomations',

  // 14. Settings & config (8)
  'canManageSettings',
  'canManageCustomFields',
  'canManageFieldLayouts',
  'canManageTemplates',
  'canManageCms',
  'canManageIntegrations',
  'canManageApiKeys',
  'canManageFeatureFlags',

  // 15. AU marketplace (5)
  'canViewAuMarketplace',
  'canManageAuSellers',
  'canProcessAuOrders',
  'canViewAuAnalytics',
  'canApproveAuSellers',

  // 16. Bookstore (4)
  'canViewBookstore',
  'canManageBookstore',
  'canViewBookstoreOrders',
  'canRefundBookstoreOrders',

  // 17. Comms & support (6)
  'canViewCommsStudio',
  'canSendMessages',
  'canManageCommsTemplates',
  'canViewSupportInbox',
  'canReplySupportTickets',
  'canEscalateSupport',

  // 18. Media & assets (4)
  'canViewMediaStudio',
  'canGenerateMedia',
  'canManageMediaLibrary',
  'canExportMedia',

  // 19. Analytics & monitoring (5)
  'canViewAnalytics',
  'canViewMonitoring',
  'canManageAlerts',
  'canViewOpsAgent',
  'canAccessDebugTools',

  // 20. Regulatory & compliance (4)
  'canViewRegulatoryComplaints',
  'canManageRegulatoryComplaints',
  'canViewComplianceReports',
  'canManageCompliancePolicies',
] as const;

export const ENTERPRISE_PERMISSIONS: Record<(typeof ENTERPRISE_PERMISSION_GROUPS)[number], { label: string; group: string }> = {
  canManageTeam: { label: 'Manage team', group: 'Team & access' },
  canInviteMembers: { label: 'Invite members', group: 'Team & access' },
  canRemoveMembers: { label: 'Remove members', group: 'Team & access' },
  canAssignRoles: { label: 'Assign roles', group: 'Team & access' },
  canViewTeamActivity: { label: 'View team activity', group: 'Team & access' },
  canAccessAdminArea: { label: 'Access admin area', group: 'Team & access' },
  canSwitchTenants: { label: 'Switch tenants', group: 'Team & access' },
  canManageTenants: { label: 'Manage tenants', group: 'Team & access' },

  canManageBilling: { label: 'Manage billing', group: 'Billing & payments' },
  canViewBilling: { label: 'View billing', group: 'Billing & payments' },
  canIssueRefunds: { label: 'Issue refunds', group: 'Billing & payments' },
  canApplyCredits: { label: 'Apply credits', group: 'Billing & payments' },
  canManageSubscriptions: { label: 'Manage subscriptions', group: 'Billing & payments' },
  canViewPaymentHistory: { label: 'View payment history', group: 'Billing & payments' },
  canManageInvoices: { label: 'Manage invoices', group: 'Billing & payments' },

  canViewAllCustomers: { label: 'View all customers', group: 'Customers & partners' },
  canCreatePartners: { label: 'Create partners', group: 'Customers & partners' },
  canEditPartners: { label: 'Edit partners', group: 'Customers & partners' },
  canDeletePartners: { label: 'Delete partners', group: 'Customers & partners' },
  canImportPartners: { label: 'Import partners', group: 'Customers & partners' },
  canViewPartnerPii: { label: 'View partner PII', group: 'Customers & partners' },
  canMergePartners: { label: 'Merge partners', group: 'Customers & partners' },
  canAssignPartnersToAgents: { label: 'Assign partners to agents', group: 'Customers & partners' },

  canExportData: { label: 'Export data', group: 'Data & export' },
  canExportPii: { label: 'Export PII', group: 'Data & export' },
  canBulkExport: { label: 'Bulk export', group: 'Data & export' },
  canScheduleExports: { label: 'Schedule exports', group: 'Data & export' },
  canViewAuditLogs: { label: 'View audit logs', group: 'Data & export' },
  canDeleteAuditLogs: { label: 'Delete audit logs', group: 'Data & export' },

  canAccessVault: { label: 'Access vault', group: 'Vault & secrets' },
  canCreateVaultSecrets: { label: 'Create vault secrets', group: 'Vault & secrets' },
  canEditVaultSecrets: { label: 'Edit vault secrets', group: 'Vault & secrets' },
  canDeleteVaultSecrets: { label: 'Delete vault secrets', group: 'Vault & secrets' },
  canShareVaultSecrets: { label: 'Share vault secrets', group: 'Vault & secrets' },

  canUseFinanceTools: { label: 'Use finance tools', group: 'Finance tools' },
  canManageFinanceAllocator: { label: 'Manage finance allocator', group: 'Finance tools' },
  canApproveAllocations: { label: 'Approve allocations', group: 'Finance tools' },
  canViewFinanceReports: { label: 'View finance reports', group: 'Finance tools' },
  canReconcileAccounts: { label: 'Reconcile accounts', group: 'Finance tools' },
  canManageVendors: { label: 'Manage vendors', group: 'Finance tools' },

  canViewLetters: { label: 'View letters', group: 'Letters & disputes' },
  canCreateLetters: { label: 'Create letters', group: 'Letters & disputes' },
  canEditLetters: { label: 'Edit letters', group: 'Letters & disputes' },
  canDeleteLetters: { label: 'Delete letters', group: 'Letters & disputes' },
  canGenerateDisputeLetters: { label: 'Generate dispute letters', group: 'Letters & disputes' },
  canMailLetters: { label: 'Mail letters', group: 'Letters & disputes' },
  canViewLettersVault: { label: 'View letters vault', group: 'Letters & disputes' },
  canManageLetterTemplates: { label: 'Manage letter templates', group: 'Letters & disputes' },

  canViewCases: { label: 'View cases', group: 'Cases & tasks' },
  canCreateCases: { label: 'Create cases', group: 'Cases & tasks' },
  canEditCases: { label: 'Edit cases', group: 'Cases & tasks' },
  canCloseCases: { label: 'Close cases', group: 'Cases & tasks' },
  canAssignCases: { label: 'Assign cases', group: 'Cases & tasks' },
  canViewTasks: { label: 'View tasks', group: 'Cases & tasks' },
  canManageTasks: { label: 'Manage tasks', group: 'Cases & tasks' },

  canViewReports: { label: 'View reports', group: 'Reports & credit intel' },
  canUploadReports: { label: 'Upload reports', group: 'Reports & credit intel' },
  canParseReports: { label: 'Parse reports', group: 'Reports & credit intel' },
  canViewCreditIntel: { label: 'View credit intel', group: 'Reports & credit intel' },
  canGenerateDisputes: { label: 'Generate disputes', group: 'Reports & credit intel' },
  canViewParsinglab: { label: 'View parsing lab', group: 'Reports & credit intel' },
  canManageReportProviders: { label: 'Manage report providers', group: 'Reports & credit intel' },

  canViewEvidence: { label: 'View evidence', group: 'Evidence & documents' },
  canUploadEvidence: { label: 'Upload evidence', group: 'Evidence & documents' },
  canDeleteEvidence: { label: 'Delete evidence', group: 'Evidence & documents' },
  canViewDocuments: { label: 'View documents', group: 'Evidence & documents' },
  canUploadDocuments: { label: 'Upload documents', group: 'Evidence & documents' },
  canDeleteDocuments: { label: 'Delete documents', group: 'Evidence & documents' },

  canViewCourses: { label: 'View courses', group: 'Courses & education' },
  canCreateCourses: { label: 'Create courses', group: 'Courses & education' },
  canEditCourses: { label: 'Edit courses', group: 'Courses & education' },
  canPublishCourses: { label: 'Publish courses', group: 'Courses & education' },
  canViewCourseAnalytics: { label: 'View course analytics', group: 'Courses & education' },

  canViewLeads: { label: 'View leads', group: 'CRM & leads' },
  canCreateLeads: { label: 'Create leads', group: 'CRM & leads' },
  canEditLeads: { label: 'Edit leads', group: 'CRM & leads' },
  canAssignLeads: { label: 'Assign leads', group: 'CRM & leads' },
  canViewLeadIntel: { label: 'View lead intel', group: 'CRM & leads' },
  canManageCrmProspects: { label: 'Manage CRM prospects', group: 'CRM & leads' },

  canViewAutomations: { label: 'View automations', group: 'Automation' },
  canCreateAutomations: { label: 'Create automations', group: 'Automation' },
  canRunAutomations: { label: 'Run automations', group: 'Automation' },
  canEditAutomations: { label: 'Edit automations', group: 'Automation' },
  canDeleteAutomations: { label: 'Delete automations', group: 'Automation' },

  canManageSettings: { label: 'Manage settings', group: 'Settings & config' },
  canManageCustomFields: { label: 'Manage custom fields', group: 'Settings & config' },
  canManageFieldLayouts: { label: 'Manage field layouts', group: 'Settings & config' },
  canManageTemplates: { label: 'Manage templates', group: 'Settings & config' },
  canManageCms: { label: 'Manage CMS', group: 'Settings & config' },
  canManageIntegrations: { label: 'Manage integrations', group: 'Settings & config' },
  canManageApiKeys: { label: 'Manage API keys', group: 'Settings & config' },
  canManageFeatureFlags: { label: 'Manage feature flags', group: 'Settings & config' },

  canViewAuMarketplace: { label: 'View AU marketplace', group: 'AU marketplace' },
  canManageAuSellers: { label: 'Manage AU sellers', group: 'AU marketplace' },
  canProcessAuOrders: { label: 'Process AU orders', group: 'AU marketplace' },
  canViewAuAnalytics: { label: 'View AU analytics', group: 'AU marketplace' },
  canApproveAuSellers: { label: 'Approve AU sellers', group: 'AU marketplace' },

  canViewBookstore: { label: 'View bookstore', group: 'Bookstore' },
  canManageBookstore: { label: 'Manage bookstore', group: 'Bookstore' },
  canViewBookstoreOrders: { label: 'View bookstore orders', group: 'Bookstore' },
  canRefundBookstoreOrders: { label: 'Refund bookstore orders', group: 'Bookstore' },

  canViewCommsStudio: { label: 'View comms studio', group: 'Comms & support' },
  canSendMessages: { label: 'Send messages', group: 'Comms & support' },
  canManageCommsTemplates: { label: 'Manage comms templates', group: 'Comms & support' },
  canViewSupportInbox: { label: 'View support inbox', group: 'Comms & support' },
  canReplySupportTickets: { label: 'Reply support tickets', group: 'Comms & support' },
  canEscalateSupport: { label: 'Escalate support', group: 'Comms & support' },

  canViewMediaStudio: { label: 'View media studio', group: 'Media & assets' },
  canGenerateMedia: { label: 'Generate media', group: 'Media & assets' },
  canManageMediaLibrary: { label: 'Manage media library', group: 'Media & assets' },
  canExportMedia: { label: 'Export media', group: 'Media & assets' },

  canViewAnalytics: { label: 'View analytics', group: 'Analytics & monitoring' },
  canViewMonitoring: { label: 'View monitoring', group: 'Analytics & monitoring' },
  canManageAlerts: { label: 'Manage alerts', group: 'Analytics & monitoring' },
  canViewOpsAgent: { label: 'View ops agent', group: 'Analytics & monitoring' },
  canAccessDebugTools: { label: 'Access debug tools', group: 'Analytics & monitoring' },

  canViewRegulatoryComplaints: { label: 'View regulatory complaints', group: 'Regulatory & compliance' },
  canManageRegulatoryComplaints: { label: 'Manage regulatory complaints', group: 'Regulatory & compliance' },
  canViewComplianceReports: { label: 'View compliance reports', group: 'Regulatory & compliance' },
  canManageCompliancePolicies: { label: 'Manage compliance policies', group: 'Regulatory & compliance' },
};

export const ENTERPRISE_ROLES = [
  { value: 'platform_admin', label: 'Platform Admin' },
  { value: 'tenant_owner', label: 'Tenant Owner' },
  { value: 'billing_admin', label: 'Billing Admin' },
  { value: 'support_lead', label: 'Support Lead' },
  { value: 'finance_manager', label: 'Finance Manager' },
  { value: 'compliance_officer', label: 'Compliance Officer' },
  { value: 'agent', label: 'Agent' },
  { value: 'sales_rep', label: 'Sales Rep' },
  { value: 'marketing_manager', label: 'Marketing Manager' },
  { value: 'course_instructor', label: 'Course Instructor' },
  { value: 'read_only_admin', label: 'Read-Only Admin' },
  { value: 'partner', label: 'Partner' },
] as const;

export const ENTERPRISE_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'resigned', label: 'Resigned' },
  { value: 'archived', label: 'Archived' },
] as const;

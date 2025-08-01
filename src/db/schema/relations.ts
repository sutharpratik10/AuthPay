import { relations } from "drizzle-orm/relations";
import { subscriptionPlans, tenants, adminDashboardStats, featureUsageAnalytics, userUsageMetrics, users, auditLogs, errorLogs, systemNotifications, userNotifications, billings, tenantSettings, usageStatistics, invitations, tenantUsers, userActivityLogs, customUserPermissions, permissions, permissionGroups, permissionGroupItems, roles, rolePermissions, userRoles, resources, resourceAccessControls, resourceComments, resourceShares, resourceVersions, otpCodes, recoveryCodes, twoFactorAuth, sessions, userAvatars, passwordResetTokens, userPreferences, languages, timezones, accounts } from "./schema";

export const tenantsRelations = relations(tenants, ({one, many}) => ({
	subscriptionPlan: one(subscriptionPlans, {
		fields: [tenants.planId],
		references: [subscriptionPlans.id]
	}),
	adminDashboardStats: many(adminDashboardStats),
	featureUsageAnalytics: many(featureUsageAnalytics),
	userUsageMetrics: many(userUsageMetrics),
	auditLogs: many(auditLogs),
	errorLogs: many(errorLogs),
	systemNotifications: many(systemNotifications),
	billings: many(billings),
	tenantSettings: many(tenantSettings),
	usageStatistics: many(usageStatistics),
	invitations: many(invitations),
	tenantUsers: many(tenantUsers),
	userActivityLogs: many(userActivityLogs),
	roles: many(roles),
	resources: many(resources),
	settings: many(tenantSettings),
	users: many(tenantUsers)
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({many}) => ({
	tenants: many(tenants),
	billings: many(billings),
}));

export const adminDashboardStatsRelations = relations(adminDashboardStats, ({one}) => ({
	tenant: one(tenants, {
		fields: [adminDashboardStats.tenantId],
		references: [tenants.id]
	}),
}));

export const featureUsageAnalyticsRelations = relations(featureUsageAnalytics, ({one}) => ({
	tenant: one(tenants, {
		fields: [featureUsageAnalytics.tenantId],
		references: [tenants.id]
	}),
}));

export const userUsageMetricsRelations = relations(userUsageMetrics, ({one}) => ({
	tenant: one(tenants, {
		fields: [userUsageMetrics.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [userUsageMetrics.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	userUsageMetrics: many(userUsageMetrics),
	auditLogs: many(auditLogs),
	errorLogs: many(errorLogs),
	systemNotifications: many(systemNotifications),
	userNotifications: many(userNotifications),
	invitations: many(invitations),
	tenantUsers: many(tenantUsers),
	userActivityLogs: many(userActivityLogs),
	resourceAccessControls_userId: many(resourceAccessControls, {
		relationName: "resourceAccessControls_userId_users_id"
	}),
	resourceAccessControls_createdByUserId: many(resourceAccessControls, {
		relationName: "resourceAccessControls_createdByUserId_users_id"
	}),
	resourceComments: many(resourceComments),
	resourceShares: many(resourceShares),
	resourceVersions: many(resourceVersions),
	otpCodes: many(otpCodes),
	recoveryCodes: many(recoveryCodes),
	twoFactorAuths: many(twoFactorAuth),
	sessions: many(sessions),
	userAvatars: many(userAvatars),
	passwordResetTokens: many(passwordResetTokens),
	userPreferences: many(userPreferences),
	accounts: many(accounts),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	tenant: one(tenants, {
		fields: [auditLogs.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id]
	}),
}));

export const errorLogsRelations = relations(errorLogs, ({one}) => ({
	tenant: one(tenants, {
		fields: [errorLogs.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [errorLogs.userId],
		references: [users.id]
	}),
}));

export const systemNotificationsRelations = relations(systemNotifications, ({one}) => ({
	tenant: one(tenants, {
		fields: [systemNotifications.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [systemNotifications.createdByUserId],
		references: [users.id]
	}),
}));

export const userNotificationsRelations = relations(userNotifications, ({one}) => ({
	user: one(users, {
		fields: [userNotifications.userId],
		references: [users.id]
	}),
}));

export const billingsRelations = relations(billings, ({ one }) => ({
  tenant: one(tenants, {
	fields: [billings.tenantId],
	references: [tenants.id],
  }),
  plan: one(subscriptionPlans, {
	fields: [billings.planId],
	references: [subscriptionPlans.id],
  }),
}));

export const tenantSettingsRelations = relations(tenantSettings, ({one}) => ({
	tenant: one(tenants, {
		fields: [tenantSettings.tenantId],
		references: [tenants.id]
	}),
}));

export const usageStatisticsRelations = relations(usageStatistics, ({ one }) => ({
  tenant: one(tenants, {
	fields: [usageStatistics.tenantId],
	references: [tenants.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({one}) => ({
	tenant: one(tenants, {
		fields: [invitations.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [invitations.sentByUserId],
		references: [users.id]
	}),
}));

export const tenantUsersRelations = relations(tenantUsers, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [tenantUsers.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [tenantUsers.userId],
		references: [users.id]
	}),
	customUserPermissions: many(customUserPermissions),
	userRoles: many(userRoles),
}));

export const userActivityLogsRelations = relations(userActivityLogs, ({one}) => ({
	user: one(users, {
		fields: [userActivityLogs.userId],
		references: [users.id]
	}),
	tenant: one(tenants, {
		fields: [userActivityLogs.tenantId],
		references: [tenants.id]
	}),
}));

export const resourceSharesRelations = relations(resourceShares, ({one}) => ({
	resource: one(resources, {
		fields: [resourceShares.resourceId],
		references: [resources.id]
	}),
	user: one(users, {
		fields: [resourceShares.userId],
		references: [users.id]
	}),
}));

export const otpCodesRelations = relations(otpCodes, ({one}) => ({
	user: one(users, {
		fields: [otpCodes.userId],
		references: [users.id]
	}),
}));


export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const userAvatarsRelations = relations(userAvatars, ({ one }) => ({
  user: one(users, {
	fields: [userAvatars.userId],
	references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
	fields: [passwordResetTokens.userId],
	references: [users.id],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
	fields: [userPreferences.userId],
	references: [users.id],
  }),
  language: one(languages, {
	fields: [userPreferences.languageId],
	references: [languages.id],
  }),
  timezone: one(timezones, {
	fields: [userPreferences.timezoneId],
	references: [timezones.id],
  }),
}));

export const languagesRelations = relations(languages, ({many}) => ({
	userPreferences: many(userPreferences),
}));

export const timezonesRelations = relations(timezones, ({many}) => ({
	userPreferences: many(userPreferences),
}));

//auth.ts
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
	fields: [accounts.userId],
	references: [users.id],
  }),
}));



//otp.ts
export const twoFactorAuthRelations = relations(twoFactorAuth, ({ one }) => ({
  user: one(users, {
	fields: [twoFactorAuth.userId],
	references: [users.id],
  }),
}));

export const recoveryCodesRelations = relations(recoveryCodes, ({ one }) => ({
  user: one(users, {
	fields: [recoveryCodes.userId],
	references: [users.id],
  }),
}));

//resources.ts
export const resourcesRelations = relations(resources, ({ one, many }) => ({
  tenant: one(tenants, {
	fields: [resources.tenantId],
	references: [tenants.id],
  }),
  accessControls: many(resourceAccessControls),
  versions: many(resourceVersions),
  comments: many(resourceComments),
  shares: many(resourceShares),
}));

/**
 * Define relations for the resource access controls table
 */
export const resourceAccessControlsRelations = relations(resourceAccessControls, ({ one }) => ({
  resource: one(resources, {
	fields: [resourceAccessControls.resourceId],
	references: [resources.id],
  }),
  user: one(users, {
	fields: [resourceAccessControls.userId],
	references: [users.id],
  }),
  createdBy: one(users, {
	fields: [resourceAccessControls.createdByUserId],
	references: [users.id],
  }),
}));

/**
 * Define relations for the resource versions table
 */
export const resourceVersionsRelations = relations(resourceVersions, ({ one }) => ({
  resource: one(resources, {
	fields: [resourceVersions.resourceId],
	references: [resources.id],
  }),
  createdBy: one(users, {
	fields: [resourceVersions.createdByUserId],
	references: [users.id],
  }),
}));

export const resourceCommentsRelations = relations(resourceComments, ({ one, many }) => {
  // Creating a separate constant for reply relation to break circular reference
  const baseRelations = {
	resource: one(resources, {
	  fields: [resourceComments.resourceId],
	  references: [resources.id],
	}),
	user: one(users, {
	  fields: [resourceComments.userId], 
	  references: [users.id],
	}),
  };

  // Adding self-reference relations separately to avoid TypeScript circular reference
  return {
	...baseRelations,
	replyTo: one(resourceComments, {
	  fields: [resourceComments.replyToCommentId],
	  references: [resourceComments.id],
	}),
	replies: many(resourceComments, { relationName: 'comment_replies' }),
  };
});

//roles.ts
export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, {
	fields: [roles.tenantId],
	references: [tenants.id],
  }),
  permissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

/**
 * Define relations for the permissions table
 */
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  groupItems: many(permissionGroupItems),
}));

/**
 * Define relations for the role permissions table
 */
export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
	fields: [rolePermissions.roleId],
	references: [roles.id],
  }),
  permission: one(permissions, {
	fields: [rolePermissions.permissionId],
	references: [permissions.id],
  }),
}));

/**
 * Define relations for the user roles table
 */
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  tenantUser: one(tenantUsers, {
	fields: [userRoles.tenantUserId],
	references: [tenantUsers.id],
  }),
  role: one(roles, {
	fields: [userRoles.roleId],
	references: [roles.id],
  }),
}));

/**
 * Define relations for the custom user permissions table
 */
export const customUserPermissionsRelations = relations(customUserPermissions, ({ one }) => ({
  tenantUser: one(tenantUsers, {
	fields: [customUserPermissions.tenantUserId],
	references: [tenantUsers.id],
  }),
  permission: one(permissions, {
	fields: [customUserPermissions.permissionId],
	references: [permissions.id],
  }),
}));

/**
 * Define relations for the permission groups table
 */
export const permissionGroupsRelations = relations(permissionGroups, ({ many }) => ({
  groupItems: many(permissionGroupItems),
}));

/**
 * Define relations for the permission group items table
 */
export const permissionGroupItemsRelations = relations(permissionGroupItems, ({ one }) => ({
  group: one(permissionGroups, {
	fields: [permissionGroupItems.groupId],
	references: [permissionGroups.id],
  }),
  permission: one(permissions, {
	fields: [permissionGroupItems.permissionId],
	references: [permissions.id],
  }),
}));



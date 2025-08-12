import { relations } from "drizzle-orm/relations";
import { subscriptionPlans, adminDashboardStats, featureUsageAnalytics, userUsageMetrics, users, auditLogs, errorLogs, systemNotifications, userNotifications, billings, userActivityLogs, customUserPermissions, permissions, permissionGroups, permissionGroupItems, roles, rolePermissions, resources, resourceAccessControls, resourceComments, otpCodes, userPreferences } from "./schema";

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  billings: many(billings),
}));

export const adminDashboardStatsRelations = relations(adminDashboardStats, ({ one }) => ({
  user: one(users, {
    fields: [adminDashboardStats.userId],
    references: [users.id],
  }),
}));

export const featureUsageAnalyticsRelations = relations(featureUsageAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [featureUsageAnalytics.userId],
    references: [users.id],
  }),
}));

export const userUsageMetricsRelations = relations(userUsageMetrics, ({ one }) => ({
  user: one(users, {
    fields: [userUsageMetrics.userId],
    references: [users.id],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  userPreferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  userUsageMetrics: many(userUsageMetrics),
  auditLogs: many(auditLogs),
  errorLogs: many(errorLogs),
  systemNotifications: many(systemNotifications),
  userNotifications: many(userNotifications),
  userActivityLogs: many(userActivityLogs),
  customUserPermissions: many(customUserPermissions),
  billings: many(billings),
  resources: many(resources),
  resourceAccessControls_userId: many(resourceAccessControls, {
    relationName: "resourceAccessControls_userId_users_id",
  }),
  resourceAccessControls_createdByUserId: many(resourceAccessControls, {
    relationName: "resourceAccessControls_createdByUserId_users_id",
  }),
  resourceComments: many(resourceComments),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const errorLogsRelations = relations(errorLogs, ({ one }) => ({
  user: one(users, {
    fields: [errorLogs.userId],
    references: [users.id],
  }),
}));

export const systemNotificationsRelations = relations(systemNotifications, ({ one }) => ({
  user: one(users, {
    fields: [systemNotifications.createdByUserId],
    references: [users.id],
  }),
}));

export const userNotificationsRelations = relations(userNotifications, ({ one }) => ({
  user: one(users, {
    fields: [userNotifications.userId],
    references: [users.id],
  }),
}));

export const billingsRelations = relations(billings, ({ one }) => ({
  user: one(users, {
    fields: [billings.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [billings.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const userActivityLogsRelations = relations(userActivityLogs, ({ one }) => ({
  user: one(users, {
    fields: [userActivityLogs.userId],
    references: [users.id],
  }),
}));

export const customUserPermissionsRelations = relations(customUserPermissions, ({ one }) => ({
  user: one(users, {
    fields: [customUserPermissions.userId],
    references: [users.id],
  }),
  permission: one(permissions, {
    fields: [customUserPermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  groupItems: many(permissionGroupItems),
}));

export const permissionGroupsRelations = relations(permissionGroups, ({ many }) => ({
  groupItems: many(permissionGroupItems),
}));

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

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

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

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  user: one(users, {
    fields: [resources.userId],
    references: [users.id],
  }),
  accessControls: many(resourceAccessControls),
  comments: many(resourceComments),
}));

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

export const resourceCommentsRelations = relations(resourceComments, ({ one, many }) => {
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
  return {
    ...baseRelations,
    replyTo: one(resourceComments, {
      fields: [resourceComments.replyToCommentId],
      references: [resourceComments.id],
    }),
    replies: many(resourceComments, { relationName: "comment_replies" }),
  };
});

export const otpCodesRelations = relations(otpCodes, ({ one }) => ({
  user: one(users, {
    fields: [otpCodes.userId],
    references: [users.id],
  }),
}));



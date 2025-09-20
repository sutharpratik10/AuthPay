import { relations } from "drizzle-orm/relations";
import { subscriptionPlans, adminDashboardStats, userUsageMetrics, users, auditLogs, errorLogs, userNotifications, billings, permissions, roles, rolePermissions, otpCodes, userPreferences } from "./schema";

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  billings: many(billings),
}));

export const adminDashboardStatsRelations = relations(adminDashboardStats, ({ one }) => ({
  user: one(users, {
    fields: [adminDashboardStats.userId],
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
  userNotifications: many(userNotifications),
  billings: many(billings),
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

export const otpCodesRelations = relations(otpCodes, ({ one }) => ({
  user: one(users, {
    fields: [otpCodes.userId],
    references: [users.id],
  }),
}));



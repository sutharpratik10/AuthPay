import { relations } from "drizzle-orm/relations";
import { subscriptionPlans, adminDashboardStats, userUsageMetrics, users, auditLogs, errorLogs, userNotifications, billings, permissions, roles, rolePermissions, otpCodes, userPreferences, userRoles, twoFactorAuth, recoveryCodes, loginHistory, refundRequests, paymentOrders, userSubscriptions } from "./schema";

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
  userPreferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  twoFactorAuth: one(twoFactorAuth, {
    fields: [users.id],
    references: [twoFactorAuth.userId],
  }),
  userRoles: many(userRoles),
  recoveryCodes: many(recoveryCodes),
  userUsageMetrics: many(userUsageMetrics),
  auditLogs: many(auditLogs),
  errorLogs: many(errorLogs),
  userNotifications: many(userNotifications),
  billings: many(billings),
  loginHistory: many(loginHistory),
  refundRequests: many(refundRequests),
  userSubscriptions: many(userSubscriptions),
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
  userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  assignedByUser: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
    relationName: "assignedBy"
  }),
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

export const loginHistoryRelations = relations(loginHistory, ({ one }) => ({
  user: one(users, {
    fields: [loginHistory.userId],
    references: [users.id],
  }),
}));

export const refundRequestsRelations = relations(refundRequests, ({ one }) => ({
  paymentOrder: one(paymentOrders, {
    fields: [refundRequests.paymentOrderId],
    references: [paymentOrders.id],
  }),
  user: one(users, {
    fields: [refundRequests.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [refundRequests.planId],
    references: [subscriptionPlans.id],
  }),
  approvedByUser: one(users, {
    fields: [refundRequests.approvedBy],
    references: [users.id],
    relationName: "approvedBy"
  }),
}));

export const paymentOrdersRelations = relations(paymentOrders, ({ one, many }) => ({
  user: one(users, {
    fields: [paymentOrders.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [paymentOrders.planId],
    references: [subscriptionPlans.id],
  }),
  refundRequests: many(refundRequests),
  userSubscriptions: many(userSubscriptions),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [userSubscriptions.planId],
    references: [subscriptionPlans.id],
  }),
  paymentOrder: one(paymentOrders, {
    fields: [userSubscriptions.paymentOrderId],
    references: [paymentOrders.id],
  }),
}));

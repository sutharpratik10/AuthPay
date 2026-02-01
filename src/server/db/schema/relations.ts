import { relations } from "drizzle-orm/relations";
import { subscriptionPlans, adminDashboardStats, userUsageMetrics, users, auditLogs, errorLogs, userNotifications, billings, permissions, roles, rolePermissions, otpCodes, userPreferences, userRoles, businesses, services, businessHours, blockedDates, appointments } from "./schema";

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
  userRoles: many(userRoles),
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

// ============================================
// APPOINTMENT BOOKING RELATIONS
// ============================================

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  owner: one(users, {
    fields: [businesses.ownerId],
    references: [users.id],
  }),
  services: many(services),
  businessHours: many(businessHours),
  blockedDates: many(blockedDates),
  appointments: many(appointments),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  business: one(businesses, {
    fields: [services.businessId],
    references: [businesses.id],
  }),
  appointments: many(appointments),
}));

export const businessHoursRelations = relations(businessHours, ({ one }) => ({
  business: one(businesses, {
    fields: [businessHours.businessId],
    references: [businesses.id],
  }),
}));

export const blockedDatesRelations = relations(blockedDates, ({ one }) => ({
  business: one(businesses, {
    fields: [blockedDates.businessId],
    references: [businesses.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  business: one(businesses, {
    fields: [appointments.businessId],
    references: [businesses.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
  customer: one(users, {
    fields: [appointments.customerId],
    references: [users.id],
  }),
}));

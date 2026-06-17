import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }).max(100),
  name: z.string().max(100).optional().nullable(),
}).strict();

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(1, { message: "Password is required" }).max(100),
  skipPasswordCheck: z.string().optional(),
}).strict();

export const VerifyEmailSchema = z.object({
  code: z.string().min(1, { message: "Verification code is required" }).max(10),
}).strict();

export const ResendVerificationSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).max(255),
}).strict();

export const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).max(255),
}).strict();

export const ResetPasswordSchema = z.object({
  code: z.string().min(1, { message: "Reset code is required" }).max(10),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters long" }).max(100),
}).strict();

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }).max(100),
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters long" }).max(100),
}).strict();

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

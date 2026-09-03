import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const createOrganizationSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  name: z.string().min(1, "Your name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type CreateOrganizationFormValues = z.infer<typeof createOrganizationSchema>;

export const acceptInviteSchema = z.object({
  code: z.string().min(1, "Invite code is required"),
  name: z.string().min(1, "Your name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>;

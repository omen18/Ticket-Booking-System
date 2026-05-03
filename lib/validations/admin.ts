import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email("Enter a valid admin email"),
});

export const adminCreateEventSchema = z.object({
  event_name: z.string().trim().min(2, "Event name is required"),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD date format"),
  venue_id: z.coerce.number().int().positive(),
  category_id: z.coerce.number().int().positive(),
  organizer_id: z.coerce.number().int().positive(),
});

export type AdminCreateEventInput = z.infer<typeof adminCreateEventSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

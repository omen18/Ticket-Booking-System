import { z } from "zod";

export const bookingSchema = z.object({
  user_id: z.number().int().positive(),
  event_id: z.number().int().positive(),
  seat_ids: z.array(z.number().int().positive()).min(1, "Select at least one seat"),
  discount_code: z.string().trim().optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;

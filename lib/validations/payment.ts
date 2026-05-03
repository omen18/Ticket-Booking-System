import { z } from "zod";

export const paymentSchema = z.object({
  booking_id: z.number().int().positive(),
  amount: z.number().positive(),
  payment_method: z.string().trim().min(2),
  status: z.enum(["Completed", "Pending", "Failed", "Refunded"]).default("Pending"),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

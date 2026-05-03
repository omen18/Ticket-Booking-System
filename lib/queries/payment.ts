import { Payment } from "@/types";

export function createPendingPayment(booking_id: number, amount: number, payment_method: string): Payment {
  return {
    payment_id: Date.now(),
    booking_id,
    amount,
    payment_method,
    status: "Pending",
  };
}

export function resolvePaymentStatus(success: boolean): Payment["status"] {
  return success ? "Completed" : "Failed";
}

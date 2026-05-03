import { create } from "zustand";
import { Discount, Seat } from "@/types";

// Row-prefix pricing matching the spec
export const SEAT_PRICE: Record<string, number> = {
  A: 500,
  B: 400,
  C: 300,
  D: 200,
  E: 150,
};

export function getSeatPrice(seatNumber: string): number {
  const prefix = seatNumber[0]?.toUpperCase() ?? "E";
  return SEAT_PRICE[prefix] ?? 150;
}

export const CONVENIENCE_FEE = 29;
export const GST_RATE = 0.18;

export function calcPricing(seats: Seat[], discount: Discount | null) {
  const subtotal = seats.reduce((sum, s) => sum + getSeatPrice(s.seat_number), 0);
  const convFee = CONVENIENCE_FEE * seats.length;
  const gst = Math.round(convFee * GST_RATE * 100) / 100;
  const discountAmt = discount ? Math.round((subtotal * discount.percentage) / 100 * 100) / 100 : 0;
  const total = Math.max(0, subtotal - discountAmt + convFee + gst);
  return { subtotal, convFee, gst, discountAmt, total };
}

interface BookingState {
  selectedSeats: Seat[];
  currentStep: 1 | 2 | 3;
  appliedDiscount: Discount | null;
  subtotal: number;
  total: number;
  setSeats: (seats: Seat[]) => void;
  setStep: (step: 1 | 2 | 3) => void;
  applyDiscount: (discount: Discount | null) => void;
  clearBooking: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  selectedSeats: [],
  currentStep: 1,
  appliedDiscount: null,
  subtotal: 0,
  total: 0,
  setSeats: (seats) => {
    const { subtotal, total } = calcPricing(seats, get().appliedDiscount);
    set({ selectedSeats: seats, subtotal, total });
  },
  setStep: (step) => set({ currentStep: step }),
  applyDiscount: (discount) => {
    const { selectedSeats } = get();
    const { subtotal, total } = calcPricing(selectedSeats, discount);
    set({ appliedDiscount: discount, subtotal, total });
  },
  clearBooking: () =>
    set({ selectedSeats: [], currentStep: 1, appliedDiscount: null, subtotal: 0, total: 0 }),
}));

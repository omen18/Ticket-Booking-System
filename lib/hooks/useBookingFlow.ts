"use client";

import { useBookingStore } from "@/lib/store/bookingStore";

export function useBookingFlow() {
  const currentStep = useBookingStore((state) => state.currentStep);
  const setStep = useBookingStore((state) => state.setStep);
  const clearBooking = useBookingStore((state) => state.clearBooking);

  const nextStep = () => {
    if (currentStep < 3) {
      setStep((currentStep + 1) as 1 | 2 | 3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setStep((currentStep - 1) as 1 | 2 | 3);
    }
  };

  return {
    currentStep,
    setStep,
    nextStep,
    prevStep,
    resetFlow: clearBooking,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === 3,
  };
}

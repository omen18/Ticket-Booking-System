"use client";

import { useMemo } from "react";

import { Seat } from "@/types";

export function useSeatMap(seats: Seat[], selectedSeatIds: number[]) {
  return useMemo(
    () =>
      seats.map((seat) => ({
        ...seat,
        status: selectedSeatIds.includes(seat.seat_id) ? "selected" : seat.status ?? "available",
      })),
    [selectedSeatIds, seats],
  );
}

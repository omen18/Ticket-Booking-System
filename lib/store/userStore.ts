import { create } from "zustand";
import { User } from "@/types";

interface UserState {
  user: User | null;
  isAuthed: boolean;
  /** True until /api/auth/me has resolved on first load */
  bootstrapping: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  setBootstrapping: (value: boolean) => void;
  /** Calls /api/auth/logout and clears state */
  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthed: false,
  bootstrapping: true,
  setUser: (user) => set({ user, isAuthed: true }),
  clearUser: () => set({ user: null, isAuthed: false }),
  setBootstrapping: (value) => set({ bootstrapping: value }),
  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore network errors — clear state regardless */
    }
    set({ user: null, isAuthed: false });
  },
}));

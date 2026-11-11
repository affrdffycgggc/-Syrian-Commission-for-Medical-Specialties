import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Activity, Participant, Admin, ViewType } from "./types";

interface AppState {
  currentView: ViewType;
  setView: (view: ViewType) => void;

  selectedActivity: Activity | null;
  setSelectedActivity: (activity: Activity | null) => void;

  currentParticipant: Participant | null;
  setCurrentParticipant: (p: Participant | null) => void;

  admin: Admin | null;
  setAdmin: (admin: Admin | null) => void;

  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  clearToast: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentView: "home",
      setView: (view) => set({ currentView: view }),

      selectedActivity: null,
      setSelectedActivity: (activity) => set({ selectedActivity: activity }),

      currentParticipant: null,
      setCurrentParticipant: (p) => set({ currentParticipant: p }),

      admin: null,
      setAdmin: (admin) => set({ admin }),

      toast: null,
      showToast: (message, type = "info") => {
        set({ toast: { message, type } });
        setTimeout(() => set({ toast: null }), 4000);
      },
      clearToast: () => set({ toast: null }),
    }),
    {
      name: "activities-app-store",
      partialize: (state) => ({
        currentParticipant: state.currentParticipant,
        selectedActivity: state.selectedActivity,
      }),
    }
  )
);

import { create } from 'zustand';

interface UIState {
  isMachine: boolean;
  isRawOpen: boolean;
  setIsMachine: (v: boolean) => void;
  toggleMachine: () => void;
  setIsRawOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMachine: false, // default to human view (light/OS theme)
  isRawOpen: false,
  setIsMachine: (v) => set({ isMachine: v }),
  toggleMachine: () => set((state) => ({ isMachine: !state.isMachine })),
  setIsRawOpen: (v) => set({ isRawOpen: v }),
}));

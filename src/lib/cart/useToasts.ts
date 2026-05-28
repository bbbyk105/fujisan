"use client";

import { useSyncExternalStore } from "react";
import {
  getToastsServerSnapshot,
  getToastsSnapshot,
  subscribeToasts,
} from "./toast-store";

export function useToasts() {
  return useSyncExternalStore(
    subscribeToasts,
    getToastsSnapshot,
    getToastsServerSnapshot,
  );
}

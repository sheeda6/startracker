"use client";

/**
 * NightModeClass — applies the `.night-mode` CSS class to <html> based on the
 * store state. Rendered once at the layout level so the class is present
 * before any page content paints.
 */

import { useEffect } from "react";
import { useStarTracker } from "@/lib/store";

export function NightModeClass() {
  const nightMode = useStarTracker((s) => s.nightMode);
  useEffect(() => {
    const html = document.documentElement;
    if (nightMode) html.classList.add("night-mode");
    else html.classList.remove("night-mode");
  }, [nightMode]);
  return null;
}

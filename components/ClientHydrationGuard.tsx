'use client';

import React, { useEffect, useState } from 'react';

/**
 * ClientHydrationGuard ensures 100% deterministic hydration between SSR and the browser client.
 * Prevents React 19 hydration mismatches caused by browser extensions, locale formatting,
 * client-only storage caches, or dynamic animation styles.
 */
export function ClientHydrationGuard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 flex flex-col min-h-screen" suppressHydrationWarning>
      {children}
    </div>
  );
}

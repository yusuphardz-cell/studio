'use client';

import * as React from 'react';

/**
 * A component that ensures its children are only rendered on the client side,
 * after the initial server-side render and hydration is complete.
 *
 * This is useful for wrapping components that rely on browser-specific APIs
 * (like `window` or `localStorage`), or to avoid server-client hydration
 * mismatches for components that might render differently based on client-side state.
 *
 * @example
 * <ClientOnly>
 *   <ComponentThatUsesWindowAPI />
 * </ClientOnly>
 */
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}

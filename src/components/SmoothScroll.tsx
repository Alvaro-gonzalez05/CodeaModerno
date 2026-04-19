"use client";
import { ReactLenis } from '@studio-freight/react-lenis';
import { usePathname } from 'next/navigation';

function SmoothScroll({ children }: { children: any }) {
  const pathname = usePathname();

  // Lenis conflicts with dashboard's own scroll container
  if (pathname?.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  return (
    // @ts-ignore
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}

export default SmoothScroll;

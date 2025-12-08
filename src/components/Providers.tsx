"use client";

import { ModalProvider } from "@/context/ModalContext";
import dynamic from 'next/dynamic';

const StartProjectModal = dynamic(() => import('@/components/StartProjectModal'), {
  ssr: false,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ModalProvider>
      {children}
      <StartProjectModal />
    </ModalProvider>
  );
}

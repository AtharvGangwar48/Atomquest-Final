'use client';

import './globals.css';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import Navbar from '@/components/Navbar';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthInitializer>{children}</AuthInitializer>
      </body>
    </html>
  );
}

'use client';

import './globals.css';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  return children;
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

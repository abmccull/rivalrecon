import './globals.css';
import { ReactNode } from 'react';
import AuthProvider from '../components/layout/AuthProvider';
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="/auth-debug.js" defer></script>
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>
          <main className="flex flex-col min-h-screen">
            {children}
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

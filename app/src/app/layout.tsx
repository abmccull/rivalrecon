import './globals.css';
import { ReactNode } from 'react';
import AuthProvider from '../components/layout/AuthProvider';
import { SubscriptionProvider } from '../components/layout/SubscriptionProvider';
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>
          <SubscriptionProvider>
            <main className="flex flex-col min-h-screen">
              {children}
            </main>
            <Toaster />
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

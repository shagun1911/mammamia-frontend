import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/AppProviders";
import { AutoTranslate } from "@/components/AutoTranslate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "arial"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  fallback: ["monospace"],
});

export const metadata: Metadata = {
  title: "mammam-ia - Chatbot Management Platform",
  description: "mammam-ia chatbot management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.classList.add(theme);
                  
                  const language = localStorage.getItem('language') || 'en';
                  document.documentElement.lang = language;
                  // Keep LTR for consistent UI layout
                  document.documentElement.dir = 'ltr';
                } catch (e) {}
                
                // Suppress browser extension errors
                window.addEventListener('error', function(event) {
                  if (event.message && (
                    event.message.includes('message channel closed') ||
                    event.message.includes('Extension context invalidated') ||
                    event.message.includes('Receiving end does not exist')
                  )) {
                    event.preventDefault();
                    return false;
                  }
                }, true);
                
                // Suppress unhandled promise rejections from extensions
                window.addEventListener('unhandledrejection', function(event) {
                  if (event.reason && (
                    event.reason.message && (
                      event.reason.message.includes('message channel closed') ||
                      event.reason.message.includes('Extension context invalidated') ||
                      event.reason.message.includes('Receiving end does not exist')
                    )
                  )) {
                    event.preventDefault();
                    return false;
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>
          <AutoTranslate />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}

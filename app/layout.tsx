import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./lib/auth-context";
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from "./components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "MSÜ Rehber",
  description: "Milli Savunma Üniversitesi adayları için mülakat deneyim paylaşım ve rehber platformu",
  keywords: "MSÜ, mülakat, sözlü mülakat, spor mülakatı, harbiye, astsubay, subay",
  authors: [{ name: "MSÜ Rehber" }],
  applicationName: "MSÜ Rehber",
  openGraph: {
    title: "MSÜ Rehber",
    description: "MSÜ mülakat deneyimlerini paylaş, başarı hikayelerini oku",
    type: "website",
    siteName: "MSÜ Rehber",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning className="scroll-smooth">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#365a20" />
        <meta name="application-name" content="MSÜ Rehber" />
        <meta name="apple-mobile-web-app-title" content="MSÜ Rehber" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border-strong)',
                },
              }}
            />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

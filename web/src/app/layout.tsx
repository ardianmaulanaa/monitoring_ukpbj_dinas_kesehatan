import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { SmoothRouteProgress } from "@/components/smooth";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  display: "swap",
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIMUKPBJ",
  description:
    "Sistem informasi UKPBJ Dinas Kesehatan.",
  icons: {
    icon: "/app/logo-dinkes.png",
    shortcut: "/app/logo-dinkes.png",
    apple: "/app/logo-dinkes.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Suspense fallback={null}>
          <SmoothRouteProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

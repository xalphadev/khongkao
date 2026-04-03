import type { Metadata, Viewport } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/shared/SessionProvider";

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500"],
  variable: "--font-kanit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "มือสองของเก่า",
  description: "ระบบรับซื้อของเก่า มือสองของเก่า",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${kanit.variable} font-kanit antialiased bg-gray-50`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

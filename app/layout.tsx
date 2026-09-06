import type { Metadata, Viewport } from "next";
// 1. Import your new components
import InstallPrompt from "./components/InstallPrompt";
import RegisterSW from "./components/RegisterSW";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Attendance Tracker",
  description: "ERP Attendance & Bunk Predictor",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Attendance",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {/* 2. Add the Service Worker registration */}
        <RegisterSW />
        
        {/* Your main app content */}
        {children}

        {/* 3. Add the Install Prompt banner at the bottom */}
        <InstallPrompt />
      </body>
    </html>
  );
}
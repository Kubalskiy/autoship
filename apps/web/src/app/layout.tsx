import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoShip",
  description: "AI-agent-driven software pipelines",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creative Team Production Manager",
  description: "Internal project and task management for the creative team",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

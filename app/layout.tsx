import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "lucas díaz | software developer",
  description:
    "Software developer from Argentina building with TypeScript, React, and Next.js.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen h-full bg-black/95 font-sans antialiased text-white">
        {children}
      </body>
    </html>
  );
}

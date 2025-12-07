import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIRWAVE~STATION",
  description: "Control Station - Music visualization and exploration modules",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

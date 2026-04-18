import type { Metadata } from "next";
import { Providers } from "./providers";
import { Navbar } from "../src/components/layout/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReservaloYA - Reserva tu cancha deportiva",
  description: "La plataforma más fácil para reservar tu cancha de fútbol, pádel y más.",
  icons: {
    icon: [
      { url: "/logo/favicon.ico", sizes: "any" },
      { url: "/logo/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/logo/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    apple: "/logo/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100">
        <Providers>
          <Navbar />
          <div className="pt-16">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}

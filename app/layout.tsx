import type { Metadata } from "next";
import { Providers } from "./providers";
import { Navbar } from "../src/components/layout/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReservaloYA - Reserva tu cancha deportiva",
  description: "La plataforma más fácil para reservar tu cancha de fútbol, pádel y más.",
  icons: {
    icon: "/logo/logo-reservaloya.ico",
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

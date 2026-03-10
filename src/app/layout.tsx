import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ana Psi",
  description: "Projeto Ana Psi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
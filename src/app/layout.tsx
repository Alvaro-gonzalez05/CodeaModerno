import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://codeadesarrollos.com'),
  alternates: {
    canonical: '/',
  },
  title: {
    default: "Codea Desarrollos | Software Factory Mendoza & Global",
    template: "%s | Codea Desarrollos"
  },
  description: "Desarrolladora de software desde Mendoza, Argentina para toda América. Creamos soluciones tecnológicas, sitios web y apps a medida para empresas desde Canadá hasta Argentina.",
  keywords: [
    "desarrolladora de software", 
    "soluciones tecnológicas", 
    "Mendoza", 
    "Argentina",
    "software factory argentina",
    "desarrollo web internacional",
    "nearshore development",
    "outsourcing de software",
    "programación a medida", 
    "agencia digital", 
    "creación de apps",
    "transformación digital",
    "servicios de software latam",
    "desarrollo web usa",
    "desarrollo web canada"
  ],
  authors: [{ name: "Codea Desarrollos" }],
  creator: "Codea Desarrollos",
  publisher: "Codea Desarrollos",
  openGraph: {
    title: "Codea Desarrollos | Software Factory Mendoza & Global",
    description: "Transformamos ideas en productos digitales de clase mundial. Desarrollo de software desde Mendoza para toda América.",
    url: 'https://codeadesarrollos.com',
    siteName: 'Codea Desarrollos',
    locale: 'es_AR',
    type: 'website',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <SmoothScroll>
            {children}
          </SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}

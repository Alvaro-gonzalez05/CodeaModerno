import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Gallery from "@/components/Gallery";
import Clients from "@/components/Clients";
import Process from "@/components/Process";
import Tools from "@/components/Tools";
import LetsCode from "@/components/LetsCode";
import Footer from "@/components/Footer";

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Codea Desarrollos',
    image: 'https://codeadesarrollos.com/logo.png',
    description: 'Desarrolladora de software desde Mendoza, Argentina para toda América. Creamos soluciones tecnológicas, sitios web y apps a medida.',
    url: 'https://codeadesarrollos.com',
    telephone: '+5492616977056',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Mendoza',
      addressRegion: 'Mendoza',
      addressCountry: 'AR'
    },
    priceRange: '$$',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday'
        ],
        opens: '09:00',
        closes: '18:00'
      }
    ],
    sameAs: [
      'https://www.instagram.com/codea.desarrollos/',
      'https://www.tiktok.com/@codeadesarrollos'
    ]
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="w-full">
        <Hero />
        <div className="relative z-20">
          <Gallery />
        </div>
        <Clients />
        <Process />
        <Tools />
        <LetsCode />
        <Footer />
      </main>
    </div>
  );
}

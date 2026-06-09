// Catálogo de proyectos desarrollados por Codea.
// Cada proyecto vive como HTML estático en /public/proyectos/<slug>/
// y es accesible directamente en el navegador vía `href`.

export type Proyecto = {
  slug: string;
  name: string;
  category: string;
  year: string;
  description: string;
  cover: string; // Portada (ruta pública)
  width: number; // Dimensiones reales de la portada (para mostrarla completa)
  height: number;
  href: string; // Entry HTML del proyecto (se abre en el navegador)
  accent: string; // Color de acento para hovers/detalles (hex)
};

export const proyectos: Proyecto[] = [
  {
    slug: "zenith",
    name: "Zenith Realty",
    category: "Bienes Raíces de Alto Nivel",
    year: "2026",
    description: "DISEÑAMOS UNA EXPERIENCIA INMOBILIARIA PREMIUM, CON UN SITIO ELEGANTE Y CINEMATOGRÁFICO QUE PONE EN VALOR CADA PROPIEDAD Y GUÍA AL VISITANTE HACIA EL CONTACTO.",
    cover: "/proyectos/zenith/portada.png",
    width: 1672,
    height: 941,
    href: "/proyectos/zenith/index.html",
    accent: "#9ca3af",
  },
  {
    slug: "securify",
    name: "Securify",
    category: "Ciberseguridad",
    year: "2026",
    description: "CONSTRUIMOS UNA PRESENCIA DIGITAL SÓLIDA Y DE ALTO IMPACTO PARA UNA MARCA DE CIBERSEGURIDAD, TRANSMITIENDO CONFIANZA, TECNOLOGÍA Y PROFESIONALISMO.",
    cover: "/proyectos/securify/portada.png",
    width: 1536,
    height: 1024,
    href: "/proyectos/securify/index.html",
    accent: "#e5e7eb",
  },
  {
    slug: "creative-studio",
    name: "Creative Studio",
    category: "Colectivo Creativo",
    year: "2026",
    description: "UNA LANDING AUDAZ Y EXPRESIVA PARA UN COLECTIVO CREATIVO, CON ANIMACIONES Y UNA IDENTIDAD VISUAL FUERTE QUE REFLEJA SU ENERGÍA Y ESTILO.",
    cover: "/proyectos/creative-studio/portada.png",
    width: 1672,
    height: 941,
    href: "/proyectos/creative-studio/hero-section.html",
    accent: "#ff2d2d",
  },
  {
    slug: "qelora",
    name: "Qelora",
    category: "Estudio de Arquitectura",
    year: "2026",
    description: "DESARROLLAMOS UN SITIO MINIMALISTA Y SOFISTICADO PARA UN ESTUDIO DE ARQUITECTURA, DONDE EL ESPACIO EN BLANCO Y LA TIPOGRAFÍA SON LOS PROTAGONISTAS.",
    cover: "/proyectos/qelora/portada.png",
    width: 1536,
    height: 1024,
    href: "/proyectos/qelora/index.html",
    accent: "#2b6cb0",
  },
  {
    slug: "vex",
    name: "Vex",
    category: "Inversión, Construcción & Consultoría",
    year: "2026",
    description: "CREAMOS UNA PLATAFORMA CORPORATIVA SERIA Y MODERNA PARA UNA FIRMA DE INVERSIÓN Y CONSTRUCCIÓN, ORIENTADA A GENERAR CREDIBILIDAD Y NUEVAS OPORTUNIDADES.",
    cover: "/proyectos/vex/portada.png",
    width: 1672,
    height: 941,
    href: "/proyectos/vex/index.html",
    accent: "#c2a36b",
  },
  {
    slug: "prisma",
    name: "Prisma",
    category: "Colectivo Creativo",
    year: "2026",
    description: "UNA EXPERIENCIA WEB ARTÍSTICA Y ENVOLVENTE, CON UNA ATMÓSFERA ÚNICA QUE INVITA A EXPLORAR EL TRABAJO DEL COLECTIVO DE FORMA INMERSIVA.",
    cover: "/proyectos/prisma/portada.png",
    width: 1536,
    height: 1024,
    href: "/proyectos/prisma/index.html",
    accent: "#d6a06a",
  },
  {
    slug: "bakery",
    name: "Bakery Facilities",
    category: "Equipamiento para Profesionales",
    year: "2026",
    description: "DISEÑAMOS UN SITIO CÁLIDO Y APETITOSO PARA UNA MARCA DE EQUIPAMIENTO GASTRONÓMICO, COMBINANDO ESTÉTICA PREMIUM CON UN ENFOQUE COMERCIAL CLARO.",
    cover: "/proyectos/bakery/portada.png",
    width: 1672,
    height: 941,
    href: "/proyectos/bakery/index.html",
    accent: "#d9c08a",
  },
  {
    slug: "stretch",
    name: "Stretch",
    category: "Cosmética Natural",
    year: "2026",
    description: "UNA LANDING SUAVE Y SENSORIAL PARA UNA MARCA DE COSMÉTICA NATURAL, CON UNA PALETA ORGÁNICA Y UN DISEÑO QUE TRANSMITE FRESCURA Y BIENESTAR.",
    cover: "/proyectos/stretch/portada.jpg",
    width: 1536,
    height: 1024,
    href: "/proyectos/stretch/index.html",
    accent: "#c4623a",
  },
  {
    slug: "wisa",
    name: "Wisa",
    category: "Equipamiento de Fútbol",
    year: "2026",
    description: "DESARROLLAMOS UNA EXPERIENCIA DINÁMICA Y POTENTE PARA UNA MARCA DE EQUIPAMIENTO DEPORTIVO, CON ANIMACIONES DE SCROLL QUE TRANSMITEN VELOCIDAD Y ACTITUD.",
    cover: "/proyectos/wisa/portada.png",
    width: 1672,
    height: 941,
    href: "/proyectos/wisa/index.html",
    accent: "#ffffff",
  },
];

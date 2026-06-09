// Catálogo de proyectos desarrollados por Codea.
// Cada proyecto vive como HTML estático en /public/proyectos/<slug>/
// y es accesible directamente en el navegador vía `href`.

export type Proyecto = {
  slug: string;
  name: string;
  category: string;
  year: string;
  cover: string; // Portada (ruta pública)
  href: string; // Entry HTML del proyecto (se abre en el navegador)
  accent: string; // Color de acento para hovers/detalles (hex)
};

export const proyectos: Proyecto[] = [
  {
    slug: "zenith",
    name: "Zenith Realty",
    category: "Bienes Raíces de Alto Nivel",
    year: "2026",
    cover: "/proyectos/zenith/portada.png",
    href: "/proyectos/zenith/index.html",
    accent: "#9ca3af",
  },
  {
    slug: "securify",
    name: "Securify",
    category: "Ciberseguridad",
    year: "2026",
    cover: "/proyectos/securify/portada.png",
    href: "/proyectos/securify/index.html",
    accent: "#e5e7eb",
  },
  {
    slug: "creative-studio",
    name: "Creative Studio",
    category: "Colectivo Creativo",
    year: "2026",
    cover: "/proyectos/creative-studio/portada.png",
    href: "/proyectos/creative-studio/hero-section.html",
    accent: "#ff2d2d",
  },
  {
    slug: "qelora",
    name: "Qelora",
    category: "Estudio de Arquitectura",
    year: "2026",
    cover: "/proyectos/qelora/portada.png",
    href: "/proyectos/qelora/index.html",
    accent: "#2b6cb0",
  },
  {
    slug: "vex",
    name: "Vex",
    category: "Inversión, Construcción & Consultoría",
    year: "2026",
    cover: "/proyectos/vex/portada.png",
    href: "/proyectos/vex/index.html",
    accent: "#c2a36b",
  },
  {
    slug: "prisma",
    name: "Prisma",
    category: "Colectivo Creativo",
    year: "2026",
    cover: "/proyectos/prisma/portada.png",
    href: "/proyectos/prisma/index.html",
    accent: "#d6a06a",
  },
  {
    slug: "bakery",
    name: "Bakery Facilities",
    category: "Equipamiento para Profesionales",
    year: "2026",
    cover: "/proyectos/bakery/portada.png",
    href: "/proyectos/bakery/index.html",
    accent: "#d9c08a",
  },
  {
    slug: "stretch",
    name: "Stretch",
    category: "Cosmética Natural",
    year: "2026",
    cover: "/proyectos/stretch/portada.jpg",
    href: "/proyectos/stretch/index.html",
    accent: "#c4623a",
  },
  {
    slug: "wisa",
    name: "Wisa",
    category: "Equipamiento de Fútbol",
    year: "2026",
    cover: "/proyectos/wisa/portada.png",
    href: "/proyectos/wisa/index.html",
    accent: "#ffffff",
  },
];

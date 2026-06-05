import Footer from "@/components/Footer";

export const metadata = {
  title: 'Política de Privacidad · Codea Desarrollos',
  description: 'Política de privacidad de Codea Desarrollos.',
};

export default function PrivacyPage() {
  return (
    <>
    <main className="min-h-screen bg-black text-white px-6 py-16 flex justify-center">
      <div className="max-w-3xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
            Política de Privacidad
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-widest">
            Última actualización: 30 de abril de 2026
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">1. Quiénes somos</h2>
          <p className="text-white/70 leading-relaxed">
            Codea Desarrollos (en adelante, &quot;nosotros&quot;, &quot;la plataforma&quot;) es una agencia
            de desarrollo de software y manejo de redes sociales con sede en Mendoza,
            Argentina. Esta política describe cómo tratamos los datos personales y
            comerciales que recopilamos a través de nuestra plataforma y de las
            integraciones con servicios de terceros como Meta (Facebook e Instagram).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">2. Información que recopilamos</h2>
          <ul className="list-disc list-inside space-y-2 text-white/70">
            <li>Datos de cuenta: nombre, email, rol dentro de la organización.</li>
            <li>Datos de proyectos: información de clientes, tareas, facturación, vault y configuraciones.</li>
            <li>
              Datos de Meta/Instagram: tokens de acceso, ID de cuenta, métricas públicas
              de perfil y publicaciones, datos de campañas publicitarias y demografía agregada,
              obtenidos exclusivamente con autorización del titular de la cuenta.
            </li>
            <li>Datos técnicos: logs de uso, dirección IP y eventos del sistema necesarios para operar el servicio.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">3. Cómo usamos tus datos</h2>
          <p className="text-white/70 leading-relaxed">
            Usamos los datos exclusivamente para prestar los servicios contratados:
            gestión de proyectos, análisis de redes sociales, creación y monitoreo de
            campañas publicitarias en Meta Ads, y comunicación relacionada al servicio.
            No vendemos ni compartimos tus datos con terceros para fines comerciales.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">4. Integración con Meta</h2>
          <p className="text-white/70 leading-relaxed">
            Cuando conectás una cuenta de Instagram o Meta Ads, almacenamos los tokens
            de acceso en forma segura para realizar consultas a la API de Meta en tu
            nombre. Solo accedemos a los permisos que autorizaste durante el flujo de
            conexión. Podés revocar el acceso en cualquier momento desde la configuración
            de tu cuenta de Meta o desde nuestro dashboard.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">5. Retención y eliminación de datos</h2>
          <p className="text-white/70 leading-relaxed">
            Conservamos tus datos mientras tu cuenta esté activa. Podés solicitar la
            eliminación total siguiendo las instrucciones disponibles en{' '}
            <a href="/data-deletion" className="text-[hsl(76,85%,67%)] underline">
              /data-deletion
            </a>
            . Procesamos las solicitudes en un plazo máximo de 30 días.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">6. Seguridad</h2>
          <p className="text-white/70 leading-relaxed">
            Aplicamos medidas técnicas y organizativas razonables para proteger tus datos,
            incluyendo cifrado en tránsito (HTTPS), almacenamiento seguro de tokens y
            controles de acceso basados en roles.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">7. Contacto</h2>
          <p className="text-white/70 leading-relaxed">
            Por cualquier consulta sobre privacidad escribinos a{' '}
            <a
              href="mailto:desarrolloscodeade@gmail.com"
              className="text-[hsl(76,85%,67%)] underline"
            >
              desarrolloscodeade@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
    <Footer />
    </>
  );
}

export const metadata = {
  title: 'Eliminación de datos · Codea Desarrollos',
  description: 'Cómo solicitar la eliminación de tus datos en Codea Desarrollos.',
};

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-16 flex items-center justify-center">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
          Solicitud de eliminación de datos
        </h1>
        <p className="text-white/60 leading-relaxed">
          En Codea Desarrollos respetamos tu privacidad. Si querés que
          eliminemos los datos asociados a tu cuenta (incluyendo cualquier
          información obtenida vía Meta/Instagram), seguí estos pasos:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-white/70">
          <li>
            Enviá un mail a{' '}
            <a
              href="mailto:desarrolloscodeade@gmail.com?subject=Solicitud%20de%20eliminación%20de%20datos"
              className="text-[hsl(76,85%,67%)] underline"
            >
              desarrolloscodeade@gmail.com
            </a>{' '}
            desde la dirección asociada a tu cuenta.
          </li>
          <li>Indicá tu nombre de usuario de Instagram o el ID del proyecto vinculado.</li>
          <li>
            Procesaremos la baja en un plazo máximo de <strong>30 días</strong> y te
            confirmaremos por mail cuando se complete.
          </li>
        </ol>
        <p className="text-sm text-white/40 leading-relaxed">
          La eliminación incluye: tokens de acceso, datos de perfil, métricas
          almacenadas en cache y configuración de campañas creadas desde nuestra plataforma.
          No podemos eliminar datos que residen directamente en Meta/Instagram —
          para eso debés gestionar la baja desde la configuración de tu cuenta de Meta.
        </p>
      </div>
    </main>
  );
}

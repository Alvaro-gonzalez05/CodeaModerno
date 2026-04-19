import AuthAnimationWrapper from '@/components/AuthAnimationWrapper'
import Link from 'next/link'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-[hsl(76,85%,67%)] selection:text-black">
      {/* Stars Layer background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-10 left-0 -translate-x-1/4 w-32 h-32 md:w-64 md:h-64 text-neutral-800 opacity-50">
             <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full overflow-visible">
                <path className="shape-star" d="M50 0 L62 38 L100 50 L62 62 L50 100 L38 62 L0 50 L38 38 Z" />
             </svg>
          </div>
          
          <div className="absolute top-20 right-10 w-24 h-24 md:w-48 md:h-48 text-neutral-800 opacity-50">
             <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full overflow-visible">
                <path className="shape-star" d="M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z" />
             </svg>
          </div>

          <div className="absolute bottom-10 right-0 translate-x-1/4 w-40 h-40 md:w-80 md:h-80 text-neutral-800 opacity-50">
             <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full overflow-visible">
                <path className="shape-star" d="M50 0 L65 35 L100 50 L65 65 L50 100 L35 65 L0 50 L35 35 Z" />
             </svg>
          </div>
          
          <div className="absolute bottom-20 left-10 w-20 h-20 md:w-40 md:h-40 text-neutral-800 opacity-50">
             <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full overflow-visible">
                <path className="shape-star" d="M50 0 L62 38 L100 50 L62 62 L50 100 L38 62 L0 50 L38 38 Z" />
             </svg>
          </div>
      </div>

      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[hsl(76,85%,67%)] rounded-full translate-y-1/3 translate-x-1/4 blur-[150px] opacity-10 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-white rounded-full -translate-y-1/4 -translate-x-1/4 blur-[120px] opacity-5 pointer-events-none"></div>

      <AuthAnimationWrapper>
        <div className="mb-10 text-center auth-stagger">
          <Link href="/" className="inline-block text-3xl font-black tracking-tighter hover:scale-105 transition-transform duration-300">
            CODEA <span className="text-transparent" style={{ WebkitTextStroke: '1px white' }}>DESARROLLOS</span>
          </Link>
        </div>
      
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group auth-stagger">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 relative z-10">REGISTRO</h2>
          <p className="text-xs font-bold tracking-widest text-[#c2f254] mb-8 uppercase relative z-10">CREAR CUENTA DE EMPLEADO</p>

          <form action="/api/auth/register" method="POST" className="flex-1 flex flex-col w-full justify-center gap-5 text-white relative z-10 auth-stagger">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 ml-1" htmlFor="full_name">
                Nombre Completo
              </label>
              <input
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] focus:bg-black transition-all text-sm font-medium placeholder:text-gray-600"
                name="full_name"
                placeholder="Alvaro Desarrollador"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 ml-1" htmlFor="email">
                Correo Electrónico
              </label>
              <input
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] focus:bg-black transition-all text-sm font-medium placeholder:text-gray-600"
                name="email"
                type="email"
                placeholder="alvaro@codea.com"
                required
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 ml-1" htmlFor="password">
                Contraseña
              </label>
              <input
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[hsl(76,85%,67%)] focus:bg-black transition-all text-sm font-medium placeholder:text-gray-600"
                type="password"
                name="password"
                placeholder="••••••••"
                required
              />
            </div>

            <button className="bg-transparent border border-[hsl(76,85%,67%)] text-[hsl(76,85%,67%)] rounded-xl px-4 py-4 font-black uppercase tracking-widest mt-4 hover:shadow-[0_0_30px_rgba(194,242,84,0.3)] hover:bg-[hsl(76,85%,67%)] hover:text-black hover:scale-[1.02] transition-all text-xs">
              Crear Cuenta
            </button>

            {resolvedSearchParams?.message && (
              <p className="mt-2 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-wider text-center rounded-xl animate-pulse">
                {resolvedSearchParams.message}
              </p>
            )}

            <div className="mt-4 pt-6 border-t border-white/10 text-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
              ¿Ya tienes cuenta? <Link href="/login" className="text-white hover:text-[hsl(76,85%,67%)] transition-colors ml-1">Iniciar Sesión</Link>
            </div>
          </form>
                </div>
      </AuthAnimationWrapper>
    </div>
  )
}


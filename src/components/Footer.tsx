export default function Footer() {
  return (
    <footer className="relative z-40 bg-white text-black pt-20 pb-10 rounded-t-[60px] -mt-10">
      <div className="container mx-auto px-8 md:px-24">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-center pt-10">
            
            {/* Brand Column */}
            <div className="md:col-span-4 flex flex-col gap-4">
                <h3 className="text-4xl md:text-5xl font-bold tracking-tighter">Codea Desarrollos.</h3>
                <p className="text-gray-500 text-base max-w-xs leading-relaxed">
                    Diseñamos el futuro digital de tu empresa con tecnología de vanguardia.
                </p>
                <p className="text-xs text-gray-400 mt-4 hidden md:block">© 2025 Codea Desarrollos</p>
            </div>

            {/* Center - Big Email & WhatsApp */}
            <div className="md:col-span-4 flex flex-col items-center justify-center gap-6">
                    <a href="mailto:hola@codea.com.ar" className="text-2xl md:text-4xl font-bold tracking-tight hover:text-gray-600 transition-colors border-b-2 border-black pb-1">
                    hola@codea.com.ar
                    </a>
                    <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-full hover:bg-[#128C7E] transition-all font-bold text-sm md:text-base shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Contactar por WhatsApp
                    </a>
            </div>
            
            {/* Links Column */}
            <div className="md:col-span-4 flex justify-start md:justify-end gap-12 md:gap-16">
                <div className="flex flex-col gap-4">
                    <span className="font-bold text-lg">Menu</span>
                    <a href="#work" className="text-gray-500 hover:text-black transition-colors">Proyectos</a>
                    <a href="#about" className="text-gray-500 hover:text-black transition-colors">Nosotros</a>
                    <a href="#services" className="text-gray-500 hover:text-black transition-colors">Servicios</a>
                </div>
                <div className="flex flex-col gap-4">
                    <span className="font-bold text-lg">Social</span>
                    <a href="#" className="text-gray-500 hover:text-black transition-colors">Instagram</a>
                    <a href="#" className="text-gray-500 hover:text-black transition-colors">LinkedIn</a>
                    <a href="#" className="text-gray-500 hover:text-black transition-colors">Twitter</a>
                </div>
            </div>
        </div>

        <div className="md:hidden mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">© 2025 Codea Desarrollos.</p>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useState, useMemo } from "react";
import ProductGrid from "./ProductGrid";

// 🔥 CLASIFICADOR MÁGICO: Adivina el género leyendo el título
const getGenre = (title) => {
    const t = title.toLowerCase();
    
    if (/(resident evil|silent hill|dead by daylight|the last of us|alien|fatal frame|five nights|outlast|the quarry|zombie army|world war z)/.test(t)) return "Terror / Survival";
    if (/(fc |fifa|mlb|wrc|need for speed|dirt|gran turismo|dakar|supercross|tennis|skater|the crew|racing)/.test(t)) return "Deportes y Carreras";
    if (/(mortal kombat|tekken|street fighter|dragon ball|naruto|jojo|smash|my hero|jujutsu|demon slayer|ufc|wwe|brawlhalla)/.test(t)) return "Lucha";
    if (/(final fantasy|persona|dragon's dogma|bloodborne|dark souls|nioh|wo long|dragon age|monster hunter|yakuza|like a dragon)/.test(t)) return "RPG / Rol";
    if (/(mario|crash|spyro|lego|sonic|just dance|overcooked|moving out|little nightmares|unravel|hazelight|plants vs zombies)/.test(t)) return "Familiar / Plataformas";
    if (/(battlefield|call of duty|titanfall|far cry|ghost recon|splatoon|apex legends)/.test(t)) return "Shooter";
    
    // Si no coincide con ninguno de arriba, cae por defecto aquí:
    return "Acción / Aventura";
};

export default function FilteredCatalog({ initialProducts }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGenre, setSelectedGenre] = useState("Todos los Géneros");

    const genres = [
        "Todos los Géneros", 
        "Acción / Aventura", 
        "Shooter",
        "Familiar / Plataformas", 
        "Lucha", 
        "Deportes y Carreras", 
        "Terror / Survival", 
        "RPG / Rol"
    ];

    // Filtra en tiempo real según lo que escribas y selecciones
    const filteredProducts = useMemo(() => {
        return initialProducts.filter(game => {
            const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase());
            const gameGenre = getGenre(game.title);
            const matchesGenre = selectedGenre === "Todos los Géneros" || gameGenre === selectedGenre;
            
            return matchesSearch && matchesGenre;
        });
    }, [initialProducts, searchTerm, selectedGenre]);

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
            {/* CONTROLES DE BÚSQUEDA Y FILTRO */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 bg-black/40 border border-white/10 p-4 md:p-5 rounded-2xl shadow-xl backdrop-blur-sm">
                
                {/* Buscador (Optimizado para Touch) */}
                <div className="flex-1 relative group w-full">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input 
                        type="text"
                        placeholder="Buscar juego por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-base md:text-sm text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder:text-gray-500"
                    />
                </div>

                {/* Selector de Género (Optimizado para Touch) */}
                <div className="relative w-full md:w-72">
                    <select 
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-base md:text-sm text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                        {genres.map(g => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>
                    {/* Flecha personalizada */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* RESULTADOS O MENSAJE DE VACÍO */}
            {filteredProducts.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-black/20 mx-2 md:mx-0">
                    <p className="text-4xl mb-4 opacity-50">👾</p>
                    <h3 className="text-lg md:text-xl font-display text-white mb-2 tracking-widest uppercase">Sin resultados</h3>
                    <p className="text-gray-500 text-xs md:text-sm px-4">No encontramos juegos que coincidan con tu búsqueda.</p>
                </div>
            ) : (
                <ProductGrid products={filteredProducts} />
            )}
        </div>
    );
}
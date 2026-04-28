"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, getDocs, where, limit } from "firebase/firestore";
import { db } from "../lib/firebase"; 
import { diccPlaystation } from "../lib/playstation";

const emptyForm = {
  title: "",
  type: "Individual",
  platform: "PS5",
  description: "",
  price: "",
  imageUrl: "",
  isFeatured: false,
  isOnSale: false,
  originalPrice: ""
};

export default function AdminDashboard() {
  const [games, setGames] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ message: "Cargando catálogo...", type: "info" });
  const [loading, setLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  
  const [pendingPacks, setPendingPacks] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [packsLimit, setPacksLimit] = useState(8);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("All");
  const [filterType, setFilterType] = useState("All");

  const [bulkText, setBulkText] = useState("");
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, active: false });

  const loadGames = useCallback(async () => {
    try {
      const response = await fetch("/api/games", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al conectar");
      setGames(data.games || []);
      setStatus({
        message: data.firebaseConfigured ? "Sincronizado con Firebase" : "Modo Local",
        type: data.firebaseConfigured ? "success" : "warning"
      });
    } catch (error) {
      setStatus({ message: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  useEffect(() => {
    const q = query(
      collection(db, "packs_pendientes"), 
      where("estado", "==", "pendiente"),
      orderBy("fecha_creacion", "desc"),
      limit(packsLimit)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const packsData = [];
      querySnapshot.forEach((doc) => {
        packsData.push({ id: doc.id, ...doc.data() });
      });
      setPendingPacks(packsData);
    }, (error) => {
      console.error("Error Firebase:", error);
    });

    return () => unsubscribe();
  }, [packsLimit]);

  const handlePackTextChange = (packId, newText) => {
    setPendingPacks(prevPacks => prevPacks.map(pack => pack.id === packId ? { ...pack, texto_telegram: newText } : pack));
  };

  const copiarPack = async (packId, texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiedId(packId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      setStatus({ message: "Error al copiar", type: "error" });
    }
  };

  const publicarPackTelegram = async (packId, textoEditado) => {
    try {
      await updateDoc(doc(db, "packs_pendientes", packId), { estado: "publicado", texto_telegram: textoEditado });
      setStatus({ message: "¡Pack publicado!", type: "success" });
    } catch (error) {
      setStatus({ message: "Error al publicar", type: "error" });
    }
  };

  const eliminarPackTelegram = async (packId) => {
    if (!confirm("¿Eliminar pack?")) return;
    try {
      await deleteDoc(doc(db, "packs_pendientes", packId));
      setStatus({ message: "Pack eliminado.", type: "success" });
    } catch (error) {
      setStatus({ message: "Error al eliminar", type: "error" });
    }
  };

  const limpiarPacksVencidos = async () => {
    if (!confirm("Esto eliminará packs con más de 24 horas.")) return;
    setIsCleaning(true);
    try {
      const snapshot = await getDocs(query(collection(db, "packs_pendientes"), where("fecha_expiracion", "<", new Date())));
      await Promise.all(snapshot.docs.map(documento => deleteDoc(doc(db, "packs_pendientes", documento.id))));
      setStatus({ message: `Limpieza terminada.`, type: "success" });
    } catch (error) {
      setStatus({ message: "Error en limpieza.", type: "error" });
    } finally {
      setIsCleaning(false);
    }
  };

  // --- ESCÁNER MASIVO CON BÚSQUEDA INTELIGENTE ---
  const procesarCatalogoMasivo = async () => {
    if (!bulkText.trim()) return;
    if (!confirm("¿Iniciar escaneo masivo?")) return;

    const lines = bulkText.split('\n');
    const parsedGames = [];
    let currentPlatform = "PS5";

    // 🚀 ORDENAMOS EL DICCIONARIO DEL NOMBRE MÁS LARGO AL MÁS CORTO
    const sortedDictKeys = Object.keys(diccPlaystation).sort((a, b) => b.length - a.length);

    for (let line of lines) {
      if (line.includes("EXCLUSIVOS DE PS5")) currentPlatform = "PS5";
      else if (line.includes("EXCLUSIVOS DE PS4")) currentPlatform = "PS4";
      else if (line.includes("COMPATIBLES CON PS4 Y PS5")) currentPlatform = "PS4 / PS5";

      const match = line.match(/(?:🕹️|🎮|🔥)\s*(.+?)\s*—\s*\$(\d+(?:\.\d+)?)/);
      if (match) {
        const title = match[1].trim();
        const price = parseFloat(match[2]);
        const type = title.toLowerCase().match(/pack|bundle|trilogy|collection/) ? "Pack" : "Individual";
        let imageUrl = "https://i.ibb.co/Nn7y455b/20.jpg"; // Imagen por defecto
        
        const titleLower = title.toLowerCase();
        
        // Ahora busca primero las versiones "Deluxe", "Definitive", etc.
        for (const key of sortedDictKeys) {
          if (titleLower.includes(key)) { 
            imageUrl = diccPlaystation[key]; 
            break; 
          }
        }
        
        parsedGames.push({ title, price, platform: currentPlatform, type, imageUrl });
      }
    }

    setBulkProgress({ current: 0, total: parsedGames.length, active: true });
    for (let i = 0; i < parsedGames.length; i++) {
      const pGame = parsedGames[i];
      const existingGame = games.find(g => g.title.toLowerCase() === pGame.title.toLowerCase());
      try {
        if (existingGame) {
           await fetch(`/api/games/${existingGame.id}`, {
             method: "PUT",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ ...existingGame, price: pGame.price, platform: pGame.platform, imageUrl: pGame.imageUrl }) // Forzamos que corrija la imagen si estaba mal
           });
        } else {
           await fetch(`/api/games`, {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({
                title: pGame.title, type: pGame.type, platform: pGame.platform,
                price: pGame.price, imageUrl: pGame.imageUrl,
                description: "Juego digital original garantizado.",
                isFeatured: false, isOnSale: false
             })
           });
        }
      } catch (err) { console.error(err); }
      setBulkProgress(prev => ({ ...prev, current: i + 1 }));
    }
    setBulkProgress({ current: 0, total: 0, active: false });
    setBulkText("");
    loadGames();
  };

  // --- AUTOCOMPLETADO MANUAL CON BÚSQUEDA INTELIGENTE ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => {
      const newForm = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'title') {
        const tituloBuscado = value.toLowerCase();
        let urlEncontrada = "";
        
        // 🚀 ORDENAMOS IGUALMENTE PARA LA ENTRADA MANUAL
        const sortedDictKeys = Object.keys(diccPlaystation).sort((a, b) => b.length - a.length);
        
        for (const key of sortedDictKeys) {
          if (tituloBuscado.includes(key)) { 
            urlEncontrada = diccPlaystation[key]; 
            break; 
          }
        }
        
        if (urlEncontrada && (!prev.imageUrl || prev.imageUrl.includes('ibb.co'))) {
          newForm.imageUrl = urlEncontrada;
        }
      }
      return newForm;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/games/${editingId}` : "/api/games";
    try {
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, price: parseFloat(form.price) }) });
      setForm(emptyForm); setEditingId(null);
      loadGames();
    } catch (error) { setStatus({ message: error.message, type: "error" }); } finally { setLoading(false); }
  };

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesName = game.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatform = filterPlatform === "All" || game.platform === filterPlatform;
      return matchesName && matchesPlatform;
    });
  }, [games, searchTerm, filterPlatform]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 min-h-screen p-8">
      {/* HEADER */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="panel p-8 md:col-span-2 bg-black/40 border border-white/10 rounded-xl">
          <p className="font-display text-[10px] uppercase tracking-[0.4em] text-purple-400">Control Center</p>
          <h1 className="mt-2 font-display text-4xl tracking-tighter text-white">GAME OVER ADMIN</h1>
          <div className="mt-8 flex gap-8">
            <div><p className="text-[10px] text-muted uppercase">Manual</p><p className="text-3xl font-bold text-neon">{games.length}</p></div>
            <div className="w-px bg-white/10" />
            <div><p className="text-[10px] text-muted uppercase">Telegram</p><p className="text-3xl font-bold text-blue-500">{pendingPacks.length}+</p></div>
          </div>
        </div>
        <div className={`panel rounded-xl border-l-4 p-8 flex flex-col justify-center bg-black/40 ${status.type === 'success' ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
          <p className="text-sm text-white/90">{status.message}</p>
        </div>
      </section>

      {/* BANDEJA DE TELEGRAM CON SCROLL Y LÍMITE */}
      <section className="space-y-4 bg-blue-900/10 border border-blue-500/20 p-6 rounded-xl">
        <div className="flex items-center justify-between border-b border-blue-500/20 pb-4">
          <h2 className="font-display text-xl uppercase text-blue-400 flex items-center gap-3">
            Bandeja Telegram
          </h2>
          <button onClick={limpiarPacksVencidos} disabled={isCleaning} className="text-[10px] font-bold uppercase border px-4 py-2 bg-red-600/20 border-red-500 text-red-100 rounded">
            {isCleaning ? '...' : '🧹 Limpiar'}
          </button>
        </div>

        {/* CONTENEDOR CON SCROLL INTERNO */}
        <div className="max-h-[550px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-500/40">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pendingPacks.map((pack) => (
              <div key={pack.id} className="bg-black/60 border border-white/10 rounded-lg overflow-hidden group relative">
                <button onClick={() => eliminarPackTelegram(pack.id)} className="absolute top-2 left-2 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 z-10">X</button>
                <div className="aspect-square"><img src={pack.url_imagen} className="w-full h-full object-cover" /></div>
                <div className="p-4 space-y-3">
                  <textarea value={pack.texto_telegram} onChange={(e) => handlePackTextChange(pack.id, e.target.value)} className="w-full text-[10px] bg-black/40 border border-white/10 rounded p-2 h-24 outline-none" />
                  <div className="flex gap-2">
                    <button onClick={() => copiarPack(pack.id, pack.texto_telegram)} className="flex-1 text-[9px] font-bold uppercase border border-white/10 py-2">{copiedId === pack.id ? 'Listo' : 'Copiar'}</button>
                    <button onClick={() => publicarPackTelegram(pack.id, pack.texto_telegram)} className="flex-1 text-[9px] font-bold uppercase bg-blue-600/40 border border-blue-500/50 py-2">Publicar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* BOTÓN CARGAR MÁS */}
          <div className="py-8 text-center">
            <button 
              onClick={() => setPacksLimit(prev => prev + 8)}
              className="px-8 py-3 bg-blue-500/10 border border-blue-500/50 text-blue-400 text-[10px] uppercase font-black tracking-widest hover:bg-blue-500 hover:text-white transition-all rounded-full"
            >
              Ver 8 packs anteriores
            </button>
            <p className="mt-2 text-[9px] text-gray-500 uppercase tracking-widest">
              Mostrando {pendingPacks.length} packs pendientes
            </p>
          </div>
        </div>
      </section>

      {/* ESCÁNER MASIVO */}
      <section className="bg-purple-900/10 border border-purple-500/20 p-6 rounded-xl space-y-4">
        <h2 className="font-display text-xl uppercase text-purple-400">Escáner Masivo</h2>
        <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Pega el catálogo aquí..." className="w-full h-32 bg-black/40 border border-white/10 rounded p-4 text-xs" />
        <button onClick={procesarCatalogoMasivo} disabled={bulkProgress.active} className="bg-purple-600 border border-purple-500 text-white px-6 py-2 text-xs uppercase font-bold">
          {bulkProgress.active ? `Procesando ${bulkProgress.current}/${bulkProgress.total}` : '🚀 Iniciar Escaneo'}
        </button>
      </section>

      {/* FORMULARIO E INVENTARIO (IGUAL) */}
      <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={handleSubmit} className="panel bg-black/40 border border-white/10 rounded-xl p-8 space-y-4 sticky top-24">
          <h2 className="font-display text-xl uppercase tracking-widest border-b border-white/5 pb-4">Manual</h2>
          <input required name="title" value={form.title} onChange={handleChange} placeholder="Título" className="w-full bg-black/60 border border-white/10 px-4 py-3 text-sm outline-none focus:border-neon" />
          <div className="grid grid-cols-2 gap-4">
            <select name="platform" value={form.platform} onChange={handleChange} className="bg-black/60 border border-white/10 px-4 py-3 text-sm outline-none">
              <option value="PS5">PS5</option>
              <option value="PS4">PS4</option>
              <option value="Nintendo Switch">Switch</option>
              <option value="PS4 / PS5">PS4 / PS5</option>
            </select>
            <input required type="number" name="price" value={form.price} onChange={handleChange} placeholder="Precio" className="bg-black/60 border border-white/10 px-4 py-3 text-sm outline-none" />
          </div>
          <input required name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="URL Imagen" className="w-full bg-black/60 border border-white/10 px-4 py-3 text-sm outline-none" />
          <button type="submit" className="w-full bg-neon text-black py-3 font-bold uppercase text-xs">Guardar Juego</button>
        </form>

        <div className="space-y-4">
          <input type="text" placeholder="Buscar en inventario..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 text-sm outline-none" />
          <div className="grid gap-3">
            {filteredGames.map((game) => (
              <div key={game.id} className="panel p-4 bg-black/40 border border-white/5 flex gap-4 items-center">
                <img src={game.imageUrl} className="h-16 w-12 object-cover" />
                <div className="flex-1">
                  <p className="font-display uppercase text-sm">{game.title}</p>
                  <p className="text-neon font-bold text-xs">${game.price}</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => startEditing(game)} className="text-[10px] font-bold text-muted hover:text-white">EDITAR</button>
                  <button onClick={() => handleDelete(game.id)} className="text-[10px] font-bold text-red-500">BORRAR</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
import PageHero from "@/components/PageHero";
import FilteredCatalog from "@/components/FilteredCatalog"; // Importamos el nuevo buscador
import { getAllGames } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function IndividualesPage({ params }) {
  const resolvedParams = await params;
  const platformParam = resolvedParams.platform?.toLowerCase(); 
  
  const allGames = await getAllGames();

  // Filtramos primero por plataforma desde el servidor
  const products = allGames.filter((game) => {
    const isIndividual = game.type === "Individual";
    let isCorrectPlatform = false;

    if (platformParam === "ps5") {
      isCorrectPlatform = game.platform === "PS5" || game.platform === "PS4 / PS5";
    } else if (platformParam === "ps4") {
      isCorrectPlatform = game.platform === "PS4" || game.platform === "PS4 / PS5";
    } else if (platformParam === "nintendo") {
      isCorrectPlatform = game.platform === "Nintendo Switch";
    }

    return isIndividual && isCorrectPlatform;
  });

  const titleName = platformParam === "nintendo" ? "Nintendo Switch" : platformParam?.toUpperCase();

  return (
    <main className="pb-24">
      <PageHero
        eyebrow="Catálogo"
        title={`Juegos Individuales ${titleName}`}
        description={`Explora nuestro catálogo de juegos digitales para ${titleName}. Entrega inmediata y soporte garantizado.`}
      />
      <div className="max-w-7xl mx-auto px-6 md:px-10 mt-10">
        {/* Le pasamos los juegos al nuevo componente en lugar del ProductGrid directo */}
        <FilteredCatalog initialProducts={products} />
      </div>
    </main>
  );
}
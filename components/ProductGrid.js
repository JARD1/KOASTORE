import ProductCard from "@/components/ProductCard";

export default function ProductGrid({ products }) {
  // 1. Verificamos que la variable 'products' exista y que no esté vacía
  if (!products || products.length === 0) {
    return (
      <div className="panel p-10 text-center">
        <p className="font-display text-2xl uppercase tracking-[0.15em] text-text">Catalogo en actualizacion</p>
        <p className="mt-3 text-muted">
          Aun no hay productos publicados en esta categoria. Agregalos desde tu dashboard y apareceran aqui.
        </p>
      </div>
    );
  }

  // 2. Si pasa la prueba, dibujamos la cuadrícula normal
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
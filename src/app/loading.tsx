export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className="container-shell animate-pulse py-12"
    >
      <div className="mb-5 h-5 w-40 rounded bg-muted" />
      <div className="mb-9 h-10 w-72 max-w-full rounded bg-muted" />
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-square rounded-2xl bg-muted" />
        ))}
      </div>
      <span className="sr-only">Carregando conteúdo…</span>
    </div>
  );
}

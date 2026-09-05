export default function Loading() {
  return (
    <main className="page-frame centered-state" aria-busy="true">
      <div className="loading-mark" aria-hidden="true" />
      <p className="eyebrow">Menyiapkan meja riset</p>
    </main>
  );
}


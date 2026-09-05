"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page-frame centered-state">
      <p className="eyebrow">Ada gangguan</p>
      <h1 className="display-title compact-title">Halaman ini belum bisa dibuka.</h1>
      <p className="body-copy narrow-copy">
        Perubahan terakhir belum dapat dimuat. Coba lagi untuk menyegarkan koneksi.
      </p>
      <button className="button button-primary" type="button" onClick={reset}>
        Coba lagi
      </button>
    </main>
  );
}


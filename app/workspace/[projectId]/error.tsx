"use client";

export default function ProjectError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="centered-state">
      <p className="eyebrow">Ruang belum terbuka</p>
      <h1 className="display-title compact-title">Data riset belum dapat dimuat.</h1>
      <p className="body-copy narrow-copy">
        Coba segarkan halaman. Jika masalah berulang, periksa koneksi Supabase.
      </p>
      <button className="button button-primary" type="button" onClick={reset}>Coba lagi</button>
    </div>
  );
}


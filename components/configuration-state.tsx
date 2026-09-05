import Link from "next/link";

export function ConfigurationState({ detail = "Supabase" }: { detail?: string }) {
  return (
    <main className="page-frame centered-state">
      <p className="eyebrow">Konfigurasi diperlukan</p>
      <h1 className="display-title compact-title">{detail} belum terhubung.</h1>
      <p className="body-copy narrow-copy">
        Halaman publik tetap bisa dibuka, tetapi ruang kerja membutuhkan environment server yang
        benar. Isi file .env.local dari .env.example, lalu jalankan ulang aplikasi.
      </p>
      <Link className="button button-primary" href="/">Kembali ke halaman awal</Link>
    </main>
  );
}


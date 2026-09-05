import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-frame centered-state">
      <p className="eyebrow">Halaman tidak ditemukan</p>
      <h1 className="display-title compact-title">Ruang yang kamu cari belum ada.</h1>
      <Link className="button button-primary" href="/">
        Kembali ke halaman awal
      </Link>
    </main>
  );
}


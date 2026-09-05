import Link from "next/link";
import { BookOpenText, MessageSquareText, SearchCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <main>
      <div className="page-frame">
        <nav className="site-nav" aria-label="Navigasi utama">
          <Brand />
          <div className="nav-links">
            <Link href="#alur">Cara kerja</Link>
            <Link href="#batasan">Batasan</Link>
          </div>
          <div className="nav-actions">
            <ThemeToggle />
            <Link className="button button-secondary" href="/login">Masuk</Link>
          </div>
        </nav>

        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Meja kerja riset</p>
            <h1 className="display-title" id="hero-title">
              Riset yang tumbuh lewat pertanyaan.
            </h1>
            <p className="body-copy">
              Susun arah, telusuri sumber, simpan bukti, lalu bawa keputusanmu ke meja bimbingan.
              Semua langkah tetap bisa ditinjau dan diubah.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/login">Mulai ruang riset</Link>
              <Link className="button button-secondary" href="#alur">Lihat alurnya</Link>
            </div>
          </div>
          <aside className="hero-note" aria-label="Prinsip produk">
            <p>AI membantu menguji arah. Kamu tetap pemilik keputusan.</p>
            <small>Paper, catatan, dan masukan dosen tetap terlihat asalnya.</small>
          </aside>
        </section>

        <section className="landing-section" id="alur" aria-labelledby="flow-title">
          <div className="section-intro">
            <p className="eyebrow">Alur kerja</p>
            <div>
              <h2 className="section-title" id="flow-title">
                Dari pertanyaan menuju bahan bimbingan.
              </h2>
              <p className="body-copy">
                Tidak ada urutan bab yang memaksa. Kamu bergerak dalam putaran kecil, memeriksa
                bukti, lalu memperbarui arah saat mendapat masukan.
              </p>
            </div>
          </div>
          <div className="story-grid">
            <article className="story-item">
              <div>
                <span className="story-number">01</span>
                <h3>Mulai dari hal yang belum jelas</h3>
              </div>
              <p>Tulis masalah dan pertanyaan yang ingin kamu pastikan, bukan jawaban yang ingin dipaksakan.</p>
              <BookOpenText size={22} aria-hidden="true" />
            </article>
            <article className="story-item">
              <div>
                <span className="story-number">02</span>
                <h3>Hubungkan dengan sumber</h3>
              </div>
              <p>Cari metadata paper dari beberapa sumber, simpan yang relevan, dan catat batas bukti yang tersedia.</p>
              <SearchCheck size={22} aria-hidden="true" />
            </article>
            <article className="story-item">
              <div>
                <span className="story-number">03</span>
                <h3>Bawa ke percakapan</h3>
              </div>
              <p>Buat checkpoint yang ringkas agar dosen dapat memberi masukan pada bagian yang memang perlu diputuskan.</p>
              <MessageSquareText size={22} aria-hidden="true" />
            </article>
          </div>
        </section>

        <section className="landing-section" id="batasan" aria-labelledby="boundary-title">
          <div className="section-intro">
            <p className="eyebrow">Batas yang jujur</p>
            <div>
              <h2 className="section-title" id="boundary-title">
                Sumber tetap sumber. Saran tetap saran.
              </h2>
              <p className="body-copy">
                Hasil AI tidak otomatis menjadi keputusan. Google Scholar dibuka sebagai pencarian
                langsung karena tidak menyediakan API publik yang stabil untuk pengambilan otomatis.
                Saat provider belum tersedia, aplikasi menyatakannya dengan jelas.
              </p>
            </div>
          </div>
        </section>

        <footer className="landing-footer">
          <p>Asisten Riset AI. Ruang kerja untuk riset yang dapat ditelusuri.</p>
          <Link className="text-link" href="/login">Masuk ke ruang riset</Link>
        </footer>
      </div>
    </main>
  );
}


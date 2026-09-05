import Link from "next/link";
import { Brand } from "@/components/brand";
import { GoogleSignInButton } from "@/components/google-sign-in";
import { ThemeToggle } from "@/components/theme-toggle";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return (
    <main className="auth-page">
      <section className="auth-intro" aria-labelledby="login-title">
        <div className="site-nav">
          <Brand />
          <ThemeToggle />
        </div>
        <div className="auth-intro-main">
          <p className="eyebrow">Masuk ke meja riset</p>
          <h1 className="display-title compact-title" id="login-title">
            Bawa pertanyaanmu ke ruang yang bisa ditinjau ulang.
          </h1>
          <p className="body-copy">
            Satu akun untuk menyimpan arah riset, paper, catatan, dan checkpoint bimbinganmu.
          </p>
        </div>
        <Link className="back-link" href="/">Kembali ke halaman awal</Link>
      </section>
      <section className="auth-aside" aria-labelledby="login-action-title">
        <p className="eyebrow">Login Google</p>
        <h2 id="login-action-title">Mulai dari akun kampus atau akun Google yang kamu pakai untuk riset.</h2>
        {params.error ? <p className="inline-alert" role="alert">{params.error}</p> : null}
        <GoogleSignInButton />
      </section>
    </main>
  );
}

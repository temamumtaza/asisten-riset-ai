import Link from "next/link";

export function Brand({ href = "/" }: { href?: "/" | "/workspace" }) {
  return (
    <Link className="brand" href={href}>
      <span className="brand-mark" aria-hidden="true">ar</span>
      <span>Asisten Riset</span>
    </Link>
  );
}


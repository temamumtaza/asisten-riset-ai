import { PanelLeft } from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

export function WorkspaceNav({ displayName }: { displayName: string }) {
  return (
    <nav className="workspace-nav" aria-label="Navigasi ruang riset">
      <Brand href="/workspace" />
      <div className="workspace-nav-meta">
        <small>{displayName}</small>
        <ThemeToggle />
        <LogoutButton />
      </div>
    </nav>
  );
}

export function WorkspaceSidebar() {
  return (
    <aside className="workspace-sidebar" aria-label="Navigasi ruang kerja">
      <div className="sidebar-group">
        <p className="sidebar-label">Ruang kerja</p>
        <Link className="sidebar-link sidebar-link-active" href="/workspace">
          <PanelLeft size={16} aria-hidden="true" />
          Ringkasan riset
        </Link>
      </div>
      <div className="sidebar-group">
        <p className="sidebar-label">Bantuan</p>
        <Link className="sidebar-link" href="/#alur">
          Alur kerja
        </Link>
        <Link className="sidebar-link" href="/#batasan">
          Batas penggunaan
        </Link>
      </div>
    </aside>
  );
}

import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Home,
  Menu,
  UserCircle,
  WalletCards,
  X,
  FileText,
  Library,
} from "lucide-react";
import DevPanel from "./DevPanel";

const SIDEBAR_KEY = "landit_sidebar_collapsed";

const navItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/resume-builder", label: "Resume Builder", icon: FileText, end: false },
  { to: "/job-search", label: "Job Search", icon: BriefcaseBusiness, end: false },
  { to: "/resources", label: "Resources", icon: Library, end: false },
  { to: "/pro", label: "Pricing", icon: WalletCards, end: false },
  { to: "/account", label: "User Profile", icon: UserCircle, end: false },
];

function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 min-w-0" aria-label="LandIt home">
      <div className="h-10 w-10 rounded-lg bg-brand-500 text-white flex items-center justify-center font-black text-xl tracking-tight shrink-0">
        L
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <div className="text-2xl font-black tracking-tight text-ink leading-none">LandIt</div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-600 mt-1">
            Career tools
          </div>
        </div>
      )}
    </Link>
  );
}

function NavItems({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1" data-testid="site-nav">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-extrabold transition-colors ${
              isActive
                ? "bg-brand-50 text-brand-500"
                : "text-muted hover:bg-white hover:text-ink"
            } ${collapsed ? "justify-center" : ""}`
          }
        >
          <Icon size={21} strokeWidth={2.4} className="shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(SIDEBAR_KEY) === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F8F7FA] text-ink">
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col border-r border-[#E8E3EE] bg-[#FBFAFC] transition-all duration-200 ${
          collapsed ? "w-[88px]" : "w-[280px]"
        }`}
        data-testid="desktop-sidebar"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-5">
          <Logo collapsed={collapsed} />
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="h-9 w-9 rounded-lg border border-[#DED7E8] bg-white text-muted hover:text-brand-500 flex items-center justify-center shrink-0"
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            data-testid="sidebar-toggle"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <div className="px-3 py-3 border-t border-[#E8E3EE]">
          <NavItems collapsed={collapsed} />
        </div>

        <div className="mt-auto p-3 border-t border-[#E8E3EE]">
          <Link
            to="/analyze"
            className={`flex items-center gap-3 rounded-lg bg-brand-500 px-3 py-3 text-sm font-black text-white hover:bg-brand-600 transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
            title={collapsed ? "Match a job" : undefined}
          >
            <BriefcaseBusiness size={20} className="shrink-0" />
            {!collapsed && <span>Match a job</span>}
          </Link>
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-[#E8E3EE] bg-white px-4 py-3">
        <Logo />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-[#DED7E8] bg-white px-3 py-2 text-sm font-extrabold text-ink"
          aria-label="Open navigation menu"
          data-testid="mobile-menu-open"
        >
          <Menu size={19} />
          Menu
        </button>
      </header>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40" data-testid="mobile-nav-drawer">
          <button
            type="button"
            className="absolute inset-0 bg-ink/30"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          />
          <div className="absolute inset-y-0 left-0 w-[min(320px,88vw)] bg-[#FBFAFC] border-r border-[#E8E3EE] shadow-cardLg p-4">
            <div className="flex items-center justify-between gap-3 mb-5">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="h-9 w-9 rounded-lg border border-[#DED7E8] bg-white text-muted flex items-center justify-center"
                aria-label="Close navigation menu"
                data-testid="mobile-menu-close"
              >
                <X size={18} />
              </button>
            </div>
            <NavItems onNavigate={() => setMobileOpen(false)} />
            <Link
              to="/analyze"
              onClick={() => setMobileOpen(false)}
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-black text-white"
            >
              <BriefcaseBusiness size={18} />
              Match a job
            </Link>
          </div>
        </div>
      )}

      <main
        className={`min-h-screen overflow-x-hidden transition-all duration-200 ${
          collapsed ? "lg:pl-[88px]" : "lg:pl-[280px]"
        }`}
      >
        <div className="mx-auto w-full max-w-[1440px] min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <Outlet />
          <DevPanel />
        </div>
      </main>
    </div>
  );
}

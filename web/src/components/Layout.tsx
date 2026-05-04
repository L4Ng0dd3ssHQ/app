import { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Home as HomeIcon, Sparkles, Clock, Info, FileText } from "lucide-react";
import { isPro } from "../storage";

const baseTabs = [
  { to: "/", label: "Home", icon: HomeIcon, end: true },
  { to: "/analyze", label: "Analyze", icon: Sparkles, end: false },
  { to: "/history", label: "History", icon: Clock, end: false },
  { to: "/about", label: "About", icon: Info, end: false },
];

const resumesTab = { to: "/resumes", label: "Resumes", icon: FileText, end: false };

export default function Layout() {
  const location = useLocation();
  const isResultDetail = location.pathname.startsWith("/result/");
  const isAnalyzePath = location.pathname === "/analyze";
  const wideOnDesktop = isAnalyzePath || location.pathname === "/" || location.pathname === "/pro" || location.pathname === "/pro/success" || location.pathname === "/history" || location.pathname === "/about" || location.pathname === "/resumes";

  const [pro, setPro] = useState(false);
  useEffect(() => {
    setPro(isPro());
  }, [location.pathname]);

  const tabs = pro
    ? [baseTabs[0], baseTabs[1], resumesTab, baseTabs[2], baseTabs[3]]
    : baseTabs;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-bg via-bg to-brand-50/40 flex justify-center">
      <div
        className={`w-full ${
          wideOnDesktop
            ? "max-w-[480px] lg:max-w-[1080px]"
            : "max-w-[480px]"
        } min-h-screen flex flex-col bg-bg shadow-cardLg sm:my-6 sm:rounded-3xl sm:overflow-hidden relative`}
      >
        <main className="flex-1 overflow-y-auto shell-scroll pb-24 lg:pb-12">
          <Outlet />
        </main>

        {/* Mobile bottom-tab nav */}
        {!isResultDetail && (
          <nav
            className="lg:hidden absolute bottom-0 left-0 right-0 bg-white border-t border-brand-50 flex justify-around items-center py-2 pb-3"
            data-testid="bottom-tabs"
          >
            {tabs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                data-testid={`tab-${label.toLowerCase()}`}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-4 py-1 transition-colors ${
                    isActive ? "text-brand-500" : "text-muted hover:text-brand-300"
                  }`
                }
              >
                <Icon size={22} strokeWidth={2.2} />
                <span className="text-[11px] font-semibold">{label}</span>
              </NavLink>
            ))}
          </nav>
        )}

        {/* Desktop top-nav (shown only ≥ lg) */}
        {!isResultDetail && (
          <nav
            className="hidden lg:flex absolute top-4 right-6 gap-1 bg-white/80 backdrop-blur rounded-full border border-brand-100 shadow-card px-2 py-1.5"
            data-testid="top-nav-desktop"
          >
            {tabs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-colors ${
                    isActive ? "bg-brand-500 text-white" : "text-muted hover:text-brand-500"
                  }`
                }
              >
                <Icon size={14} strokeWidth={2.4} />
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

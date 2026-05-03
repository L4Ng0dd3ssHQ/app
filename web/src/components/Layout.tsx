import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Home as HomeIcon, Sparkles, Clock, Info } from "lucide-react";

const tabs = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/analyze", label: "Analyze", icon: Sparkles },
  { to: "/history", label: "History", icon: Clock },
  { to: "/about", label: "About", icon: Info },
];

export default function Layout() {
  const location = useLocation();
  const isResult = location.pathname.startsWith("/result/");

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-bg via-bg to-brand-50/40 flex justify-center">
      {/* Phone-shell on desktop, full-width on mobile */}
      <div className="w-full max-w-[480px] min-h-screen flex flex-col bg-bg shadow-cardLg sm:my-6 sm:rounded-3xl sm:overflow-hidden relative">
        <main className="flex-1 overflow-y-auto shell-scroll pb-24">
          <Outlet />
        </main>

        {!isResult && (
          <nav
            className="absolute bottom-0 left-0 right-0 bg-white border-t border-brand-50 flex justify-around items-center py-2 pb-3"
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
                <Icon size={22} strokeWidth={isActiveStroke()} />
                <span className="text-[11px] font-semibold">{label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

// Slightly bolder strokes feel more native
function isActiveStroke() {
  return 2.2;
}

import {
  ClipboardList,
  LayoutGrid,
  LineChart,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  User2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const STORAGE_KEY = "fc.sidebar.collapsed";
const DEBUG_URL = "http://127.0.0.1:7777/event";
const DEBUG_SESSION_ID = "post-login-blank";

function getStoredCollapsedValue() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch (error) {
    return false;
  }
}

function AppShell({ activeSection = "resumen", header, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(getStoredCollapsedValue);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { value: "resumen", label: "Resumen", icon: LayoutGrid, path: "/dashboard?tab=resumen" },
      { value: "rutinas", label: "Rutinas", icon: ClipboardList, path: "/routines" },
      { value: "progreso", label: "Progreso", icon: LineChart, path: "/dashboard?tab=progreso" },
      { value: "perfil", label: "Perfil", icon: User2, path: "/dashboard?tab=perfil" },
    ],
    []
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch (error) {
      // Ignore storage errors to keep the UI responsive.
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    // #region debug-point B:app-shell
    fetch(DEBUG_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION_ID,
        runId: "pre-fix",
        hypothesisId: "B",
        location: "AppShell.js:AppShell",
        msg: "[DEBUG] AppShell mounted",
        data: {
          activeSection,
          pathname: location.pathname,
          search: location.search,
          collapsed,
          mobileMenuOpen,
        },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [activeSection, collapsed, location.pathname, location.search, mobileMenuOpen]);

  function handleNavigate(path) {
    navigate(path);
  }

  return (
    <div className="fc-page">
      <div className="fc-page__noise" />

      {mobileMenuOpen ? (
        <button
          type="button"
          className="fc-sidebar-backdrop"
          aria-label="Cerrar menú"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      <div className={`fc-dashboard ${collapsed ? "is-collapsed" : ""}`}>
        <aside
          className={`fc-dashboard__sidebar ${mobileMenuOpen ? "is-open" : ""}`}
          aria-label="Navegación principal"
        >
          <div className="fc-dashboard__sidebar-top">
            <div className="fc-dashboard__brand">
              <div className="fc-dashboard__logo">FC</div>
              <div className="fc-dashboard__brand-copy">
                <div className="fc-dashboard__brand-title">FitnessControl</div>
                <div className="fc-dashboard__brand-subtitle">Entrená con claridad</div>
              </div>
            </div>

            <div className="fc-dashboard__sidebar-actions">
              <button
                type="button"
                className="fc-sidebar-toggle fc-sidebar-toggle--desktop"
                onClick={() => setCollapsed((current) => !current)}
                aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
              >
                {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>

              <button
                type="button"
                className="fc-sidebar-toggle fc-sidebar-toggle--mobile"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Cerrar menú"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <nav className="fc-dashboard__nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  className={`fc-nav-item ${isActive ? "is-active" : ""}`}
                  onClick={() => handleNavigate(item.path)}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="fc-dashboard__sidebar-footer">
            <button
              type="button"
              className="fc-nav-item"
              onClick={signOut}
              title={collapsed ? "Cerrar sesión" : undefined}
            >
              <LogOut size={18} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        <main className="fc-dashboard__main">
          <header className="fc-dashboard__header">
            <button
              type="button"
              className="fc-sidebar-toggle fc-sidebar-toggle--header"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={18} />
            </button>
            {header}
          </header>

          <div className="fc-dashboard__content">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;

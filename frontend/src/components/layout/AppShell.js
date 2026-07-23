import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutGrid,
  LineChart,
  LogOut,
  Menu,
  Salad,
  User2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const STORAGE_KEY = "fc.sidebar.collapsed";

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
      { value: "nutricion", label: "Nutricion", icon: Salad, path: "/nutrition" },
      { value: "progreso", label: "Progreso", icon: LineChart, path: "/dashboard?tab=progreso" },
      { value: "amigos", label: "Amigos", icon: Users, path: "/friends" },
      { value: "perfil", label: "Perfil", icon: User2, path: "/profile" },
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
    if (!mobileMenuOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  function handleNavigate(path) {
    navigate(path);
  }

  function isItemActive(item) {
    if (item.value === "rutinas") {
      return location.pathname.startsWith("/routines");
    }

    if (item.value === "perfil") {
      return location.pathname.startsWith("/profile");
    }

    if (item.value === "nutricion") {
      return location.pathname.startsWith("/nutrition");
    }

    if (item.value === "amigos") {
      return location.pathname.startsWith("/friends");
    }

    if (item.value === "resumen") {
      return location.pathname === "/dashboard" && !new URLSearchParams(location.search).get("tab");
    }

    return (
      location.pathname === "/dashboard" &&
      new URLSearchParams(location.search).get("tab") === item.value
    );
  }

  return (
    <div className="fc-page">
      <div className="fc-page__noise" />

      <div className={`fc-dashboard ${collapsed ? "is-collapsed" : ""}`}>
        {mobileMenuOpen ? (
          <button
            type="button"
            className="fc-sidebar-backdrop"
            aria-label="Cerrar menu"
            onClick={() => setMobileMenuOpen(false)}
          />
        ) : null}

        <aside
          id="fc-main-sidebar"
          className={`fc-dashboard__sidebar ${mobileMenuOpen ? "is-open" : ""}`}
          aria-label="Navegacion principal"
        >
          <div className="fc-dashboard__sidebar-top">
            <div className="fc-dashboard__brand">
              <div className="fc-dashboard__logo">FC</div>
              <button
                type="button"
                className="fc-sidebar-toggle fc-sidebar-toggle--desktop"
                onClick={() => setCollapsed((current) => !current)}
                aria-label={collapsed ? "Expandir menu" : "Colapsar menu"}
              >
                {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            </div>

            <div className="fc-dashboard__sidebar-actions">
              <button
                type="button"
                className="fc-sidebar-toggle fc-sidebar-toggle--mobile"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Cerrar menu"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <nav className="fc-dashboard__nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item) || activeSection === item.value;
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
              title={collapsed ? "Cerrar sesion" : undefined}
            >
              <LogOut size={18} />
              <span>Cerrar sesion</span>
            </button>
          </div>
        </aside>

        <main className="fc-dashboard__main">
          <header className="fc-dashboard__header">
            <button
              type="button"
              className="fc-sidebar-toggle fc-sidebar-toggle--header"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="fc-main-sidebar"
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

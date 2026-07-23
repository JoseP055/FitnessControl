import AppShell from "../components/layout/AppShell";
import FriendsPanel from "../components/friends/FriendsPanel";
import { useAuth } from "../context/AuthContext";

function Friends() {
  const { user } = useAuth();

  return (
    <AppShell
      activeSection="amigos"
      header={
        <div>
          <h1 className="fc-dashboard__title">Amigos</h1>
          <p className="fc-dashboard__subtitle">
            Encontra gente por nombre, usuario o ID, y maneja tus solicitudes de amistad.
          </p>
        </div>
      }
    >
      <div className="fc-dashboard-stack">
        <FriendsPanel userId={user.id} />
      </div>
    </AppShell>
  );
}

export default Friends;

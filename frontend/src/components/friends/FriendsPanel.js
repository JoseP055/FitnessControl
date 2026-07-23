import { useEffect, useState } from "react";
import { Search, UserPlus, Users } from "lucide-react";

import Card from "../ui/Card";
import { getProfile } from "../../services/api";
import {
  categorizeFriendships,
  listMyFriendships,
  removeFriendship,
  respondToFriendRequest,
  searchProfiles,
  sendFriendRequest,
} from "../../services/socialClient";
import FriendCard from "./FriendCard";

const TABS = [
  { key: "friends", label: "Amigos" },
  { key: "received", label: "Recibidas" },
  { key: "sent", label: "Enviadas" },
  { key: "search", label: "Buscar" },
];

const SEARCH_DEBOUNCE_MS = 350;

function otherUserId(row, userId) {
  return row.requester_id === userId ? row.addressee_id : row.requester_id;
}

function FriendsPanel({ userId }) {
  const [tab, setTab] = useState("friends");
  const [rows, setRows] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  async function loadFriendships() {
    setLoading(true);
    setError("");

    try {
      const friendshipRows = await listMyFriendships(userId);
      setRows(friendshipRows);

      const ids = Array.from(new Set(friendshipRows.map((row) => otherUserId(row, userId))));
      const profiles = await Promise.all(
        ids.map((id) =>
          getProfile(id)
            .then((response) => [id, response.identity])
            .catch(() => [id, null])
        )
      );
      setProfilesById(Object.fromEntries(profiles));
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar tus amistades.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFriendships();
  }, [userId]);

  // Busqueda en vivo (estilo Instagram): dispara sola a medida que se escribe,
  // sin boton, con un pequeno debounce para no pegarle a la API en cada tecla.
  useEffect(() => {
    const query = searchQuery.trim();

    if (!query) {
      setSearchResults([]);
      setSearching(false);
      return undefined;
    }

    setSearching(true);

    const timeoutId = setTimeout(() => {
      searchProfiles(query)
        .then((results) => setSearchResults(results))
        .catch((searchError) => setError(searchError.message || "No se pudo buscar."))
        .finally(() => setSearching(false));
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const { friends, received, sent } = categorizeFriendships(rows, userId);
  const existingIds = new Set(rows.map((row) => otherUserId(row, userId)));

  async function handleAccept(row, accept) {
    setBusyId(row.id);
    setError("");

    try {
      await respondToFriendRequest(row.id, accept);
      await loadFriendships();
    } catch (respondError) {
      setError(respondError.message || "No se pudo responder la solicitud.");
    } finally {
      setBusyId("");
    }
  }

  async function handleRemove(row) {
    setBusyId(row.id);
    setError("");

    try {
      await removeFriendship(row.id);
      await loadFriendships();
    } catch (removeError) {
      setError(removeError.message || "No se pudo eliminar.");
    } finally {
      setBusyId("");
    }
  }

  async function handleSendRequest(targetId) {
    setBusyId(targetId);
    setError("");

    try {
      await sendFriendRequest(userId, targetId);
      await loadFriendships();
    } catch (sendError) {
      setError(sendError.message || "No se pudo enviar la solicitud.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "1rem" }}>
        <span className="fc-text-eyebrow">
          <Users size={14} />
          Amigos
        </span>

        <div className="fc-option-grid fc-option-grid--compact">
          {TABS.map((tabInfo) => (
            <button
              key={tabInfo.key}
              type="button"
              className={`fc-option-card ${tab === tabInfo.key ? "is-selected" : ""}`}
              onClick={() => setTab(tabInfo.key)}
            >
              <span className="fc-option-card__label">
                {tabInfo.label}
                {tabInfo.key === "received" && received.length ? ` (${received.length})` : ""}
              </span>
            </button>
          ))}
        </div>

        {error ? <p className="fc-form-message">{error}</p> : null}

        {loading ? (
          <p className="fc-card-text">Cargando...</p>
        ) : (
          <>
            {tab === "friends" ? (
              friends.length ? (
                friends.map((row) => (
                  <FriendCard
                    key={row.id}
                    profile={profilesById[otherUserId(row, userId)]}
                    busy={busyId === row.id}
                    actions={[{ label: "Eliminar amigo", variant: "ghost", onClick: () => handleRemove(row) }]}
                  />
                ))
              ) : (
                <p className="fc-card-text">Todavia no tenes amigos agregados.</p>
              )
            ) : null}

            {tab === "received" ? (
              received.length ? (
                received.map((row) => (
                  <FriendCard
                    key={row.id}
                    profile={profilesById[otherUserId(row, userId)]}
                    busy={busyId === row.id}
                    actions={[
                      { label: "Aceptar", onClick: () => handleAccept(row, true) },
                      { label: "Rechazar", variant: "ghost", onClick: () => handleAccept(row, false) },
                    ]}
                  />
                ))
              ) : (
                <p className="fc-card-text">No tenes solicitudes recibidas.</p>
              )
            ) : null}

            {tab === "sent" ? (
              sent.length ? (
                sent.map((row) => (
                  <FriendCard
                    key={row.id}
                    profile={profilesById[otherUserId(row, userId)]}
                    busy={busyId === row.id}
                    actions={[{ label: "Cancelar", variant: "ghost", onClick: () => handleRemove(row) }]}
                  />
                ))
              ) : (
                <p className="fc-card-text">No tenes solicitudes enviadas.</p>
              )
            ) : null}

            {tab === "search" ? (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <div className="fc-search-input">
                  <Search size={16} />
                  <input
                    className="fc-input"
                    placeholder="Buscar por nombre, usuario o ID..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    autoFocus
                  />
                </div>

                {searching ? <p className="fc-card-text">Buscando...</p> : null}

                {!searching && searchQuery.trim() && !searchResults.length ? (
                  <p className="fc-card-text">No encontramos a nadie con ese nombre, usuario o ID.</p>
                ) : null}

                {searchResults.map((result) => (
                  <FriendCard
                    key={result.user_id}
                    profile={result}
                    busy={busyId === result.user_id}
                    actions={
                      existingIds.has(result.user_id)
                        ? [{ label: "Ya enviada / amigos", variant: "ghost", disabled: true }]
                        : [
                            {
                              label: "Agregar amigo",
                              icon: UserPlus,
                              onClick: () => handleSendRequest(result.user_id),
                            },
                          ]
                    }
                  />
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </Card>
  );
}

export default FriendsPanel;

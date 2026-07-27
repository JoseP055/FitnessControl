import { useCallback, useEffect, useState } from "react";
import { UserPlus, Users } from "lucide-react";

import Card from "../ui/Card";
import FriendCard from "../friends/FriendCard";
import { getProfileFriends } from "../../services/api";
import { sendFriendRequest } from "../../services/socialClient";

function FriendsListSection({ userId, viewerId, isSelf }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setError("");

    try {
      const data = await getProfileFriends(userId);
      setFriends(data.friends || []);
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar la lista de amigos.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  async function handleAddFriend(friendUserId) {
    setBusyId(friendUserId);
    setError("");

    try {
      await sendFriendRequest(viewerId, friendUserId);
      setFriends((current) =>
        current.map((friend) =>
          friend.user_id === friendUserId ? { ...friend, friendship_status: "pending_sent" } : friend
        )
      );
    } catch (sendError) {
      setError(sendError.message || "No se pudo enviar la solicitud.");
    } finally {
      setBusyId("");
    }
  }

  function buildActions(friend) {
    if (isSelf || friend.friendship_status === "friends") {
      return [{ label: "Amigos", variant: "ghost", disabled: true }];
    }

    if (friend.friendship_status === "pending_sent") {
      return [{ label: "Solicitud enviada", variant: "ghost", disabled: true }];
    }

    if (friend.friendship_status === "pending_received") {
      return [{ label: "Te envio solicitud", variant: "ghost", disabled: true }];
    }

    return [
      {
        label: "Agregar amigo",
        icon: UserPlus,
        onClick: () => handleAddFriend(friend.user_id),
      },
    ];
  }

  const mutualCount = isSelf
    ? 0
    : friends.filter((friend) => friend.friendship_status === "friends").length;

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <span className="fc-text-eyebrow">
            <Users size={14} />
            {isSelf ? "Tus amigos" : "Amigos"}
          </span>
          {!isSelf && mutualCount > 0 ? (
            <span className="fc-pill">
              {mutualCount} {mutualCount === 1 ? "amigo en comun" : "amigos en comun"}
            </span>
          ) : null}
        </div>

        {error ? <p className="fc-form-message">{error}</p> : null}

        {loading ? (
          <p className="fc-card-text">Cargando...</p>
        ) : friends.length ? (
          <div className="fc-routine-list">
            {friends.map((friend) => (
              <FriendCard
                key={friend.user_id}
                profile={friend}
                busy={busyId === friend.user_id}
                actions={buildActions(friend)}
              />
            ))}
          </div>
        ) : (
          <p className="fc-card-text">
            {isSelf ? "Todavia no tenes amigos agregados." : "Todavia no tiene amigos agregados."}
          </p>
        )}
      </div>
    </Card>
  );
}

export default FriendsListSection;

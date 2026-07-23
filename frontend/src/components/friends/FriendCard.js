import { useNavigate } from "react-router-dom";

import Button from "../ui/Button";

function initials(name) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function FriendCard({ profile, busy = false, actions = [] }) {
  const navigate = useNavigate();
  const canOpenProfile = Boolean(profile?.user_id);

  return (
    <div className="fc-friend-card">
      <button
        type="button"
        className="fc-friend-card__meta fc-friend-card__meta--button"
        onClick={() => canOpenProfile && navigate(`/profile/${profile.user_id}`)}
        disabled={!canOpenProfile}
      >
        <div className="fc-avatar" aria-hidden="true">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" />
          ) : (
            <span>{initials(profile?.full_name) || "?"}</span>
          )}
        </div>
        <div>
          <div>{profile?.full_name || "Usuario"}</div>
          {profile?.username ? (
            <small className="fc-text-eyebrow">@{profile.username}</small>
          ) : profile?.public_id ? (
            <small className="fc-text-eyebrow">ID: {profile.public_id}</small>
          ) : null}
        </div>
      </button>
      <div className="fc-friend-card__actions">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant={action.variant || "primary"}
              loading={busy}
              disabled={action.disabled}
              onClick={action.onClick}
            >
              {Icon ? <Icon size={16} /> : null}
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export default FriendCard;

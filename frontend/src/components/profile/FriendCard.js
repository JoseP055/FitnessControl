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
  return (
    <div className="fc-friend-card">
      <div className="fc-friend-card__meta">
        <div className="fc-avatar" aria-hidden="true">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" />
          ) : (
            <span>{initials(profile?.full_name) || "?"}</span>
          )}
        </div>
        <span>{profile?.full_name || "Usuario"}</span>
      </div>
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

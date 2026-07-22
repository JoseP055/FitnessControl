import { useRef, useState } from "react";
import { Camera, Check, Copy, Pencil, UserMinus, UserPlus, UserX, X } from "lucide-react";

import Button from "../ui/Button";
import Card from "../ui/Card";
import ConfirmDialog from "../ui/ConfirmDialog";
import Input from "../ui/Input";
import {
  removeFriendship,
  respondToFriendRequest,
  sendFriendRequest,
  updateIdentity,
  uploadAvatar,
} from "../../services/socialClient";

function initialsFromName(name) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function ProfileHeader({ userId, viewerId, identity, isSelf, friendshipStatus, friendshipId, onRefresh }) {
  const fileInputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(identity.full_name || "");
  const [bio, setBio] = useState(identity.bio || "");
  const [username, setUsername] = useState(identity.username || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [error, setError] = useState("");
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopyId() {
    try {
      await navigator.clipboard.writeText(identity.public_id || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (copyError) {
      // Ignore clipboard errors; the ID is still visible on screen.
    }
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setError("");
    setUploading(true);

    try {
      const avatarUrl = await uploadAvatar(userId, file);
      await updateIdentity(userId, { avatar_url: avatarUrl });
      await onRefresh();
    } catch (uploadError) {
      setError(uploadError.message || "No se pudo actualizar la foto.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveIdentity() {
    setError("");
    setSaving(true);

    try {
      await updateIdentity(userId, { full_name: fullName.trim(), bio: bio.trim(), username });
      await onRefresh();
      setEditing(false);
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendRequest() {
    setError("");
    setBusyAction(true);

    try {
      await sendFriendRequest(viewerId, userId);
      await onRefresh();
    } catch (requestError) {
      setError(requestError.message || "No se pudo enviar la solicitud.");
    } finally {
      setBusyAction(false);
    }
  }

  async function handleRespond(accept) {
    setError("");
    setBusyAction(true);

    try {
      await respondToFriendRequest(friendshipId, accept);
      await onRefresh();
    } catch (respondError) {
      setError(respondError.message || "No se pudo responder la solicitud.");
    } finally {
      setBusyAction(false);
    }
  }

  async function handleRemove() {
    setError("");
    setBusyAction(true);

    try {
      await removeFriendship(friendshipId);
      await onRefresh();
      setConfirmRemoveOpen(false);
    } catch (removeError) {
      setError(removeError.message || "No se pudo eliminar la amistad.");
    } finally {
      setBusyAction(false);
    }
  }

  return (
    <Card glass>
      <div className="fc-profile-header">
        <div className="fc-profile-header__avatar-wrap">
          <div className="fc-avatar fc-avatar--lg" aria-hidden="true">
            {identity.avatar_url ? (
              <img src={identity.avatar_url} alt="" />
            ) : (
              <span>{initialsFromName(identity.full_name) || "FC"}</span>
            )}
          </div>
          {isSelf ? (
            <>
              <button
                type="button"
                className="fc-avatar-edit-button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Cambiar foto de perfil"
                disabled={uploading}
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
            </>
          ) : null}
        </div>

        <div className="fc-profile-header__info">
          {editing ? (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <Input
                id="profile-full-name"
                label="Nombre"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
              <Input
                id="profile-username"
                label="Usuario (minusculas, numeros y guion bajo)"
                placeholder="tu_usuario"
                value={username}
                onChange={(event) => setUsername(event.target.value.toLowerCase())}
              />
              <div className="fc-field">
                <label className="fc-field__label" htmlFor="profile-bio">
                  Biografia
                </label>
                <textarea
                  id="profile-bio"
                  className="fc-textarea"
                  maxLength={280}
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Contá algo sobre vos y tu entrenamiento."
                />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button loading={saving} onClick={handleSaveIdentity}>
                  <Check size={16} />
                  Guardar
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                  <X size={16} />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="fc-dashboard__title">{identity.full_name || "Atleta"}</h1>
              <div className="fc-helper-list">
                {identity.username ? <span className="fc-pill">@{identity.username}</span> : null}
                {isSelf ? (
                  <button type="button" className="fc-pill fc-id-pill" onClick={handleCopyId}>
                    <Copy size={12} />
                    ID: {identity.public_id} {copied ? "(copiado)" : ""}
                  </button>
                ) : null}
              </div>
              <p className="fc-card-text">{identity.bio || (isSelf ? "Todavia no escribiste tu biografia." : "")}</p>
            </>
          )}

          {error ? <p className="fc-form-message">{error}</p> : null}
        </div>

        <div className="fc-profile-header__actions">
          {isSelf && !editing ? (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil size={16} />
              Editar
            </Button>
          ) : null}

          {!isSelf && friendshipStatus === "none" ? (
            <Button loading={busyAction} onClick={handleSendRequest}>
              <UserPlus size={16} />
              Agregar amigo
            </Button>
          ) : null}

          {!isSelf && friendshipStatus === "pending_sent" ? (
            <Button variant="secondary" loading={busyAction} onClick={handleRemove}>
              <UserX size={16} />
              Cancelar solicitud
            </Button>
          ) : null}

          {!isSelf && friendshipStatus === "pending_received" ? (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button loading={busyAction} onClick={() => handleRespond(true)}>
                <Check size={16} />
                Aceptar
              </Button>
              <Button variant="ghost" loading={busyAction} onClick={() => handleRespond(false)}>
                <X size={16} />
                Rechazar
              </Button>
            </div>
          ) : null}

          {!isSelf && friendshipStatus === "friends" ? (
            <Button variant="ghost" onClick={() => setConfirmRemoveOpen(true)}>
              <UserMinus size={16} />
              Amigos
            </Button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmRemoveOpen}
        title="Eliminar amistad"
        description={`Vas a dejar de ser amigo de ${identity.full_name || "este usuario"}.`}
        confirmLabel="Eliminar"
        cancelLabel="Volver"
        loading={busyAction}
        onCancel={() => setConfirmRemoveOpen(false)}
        onConfirm={handleRemove}
      />
    </Card>
  );
}

export default ProfileHeader;

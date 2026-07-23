import { supabaseClient } from "./supabaseClient";

function ensureClient() {
  if (!supabaseClient) {
    throw new Error("No se pudo conectar con Supabase.");
  }

  return supabaseClient;
}

function throwIfError(error, fallbackMessage) {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

export const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;
export const USERNAME_COOLDOWN_DAYS = 15;

// Dias restantes para poder volver a cambiar el username (0 si ya se puede).
export function getUsernameCooldownDaysRemaining(usernameChangedAt) {
  if (!usernameChangedAt) {
    return 0;
  }

  const daysSince = (Date.now() - new Date(usernameChangedAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(USERNAME_COOLDOWN_DAYS - daysSince));
}

// ---------------------------------------------------------------------------
// Identidad, avatar y visibilidad
// ---------------------------------------------------------------------------

export async function updateIdentity(
  userId,
  { full_name, bio, avatar_url, username, gender, goals, experience_level } = {}
) {
  const client = ensureClient();
  const payload = { updated_at: new Date().toISOString() };

  if (full_name !== undefined) payload.full_name = full_name;
  if (bio !== undefined) payload.bio = bio;
  if (avatar_url !== undefined) payload.avatar_url = avatar_url;
  if (gender !== undefined) payload.gender = gender || null;
  if (experience_level !== undefined) payload.experience_level = experience_level;

  if (goals !== undefined) {
    payload.goals = goals.length ? goals : null;
    payload.goal = goals[0] || null;
  }

  if (username !== undefined) {
    const trimmed = username.trim().toLowerCase();

    if (trimmed && !USERNAME_PATTERN.test(trimmed)) {
      throw new Error("El usuario debe tener 3-24 caracteres: minusculas, numeros y guion bajo.");
    }

    const { data: current, error: currentError } = await client
      .from("profiles")
      .select("username, username_changed_at")
      .eq("user_id", userId)
      .maybeSingle();

    throwIfError(currentError, "No se pudo verificar tu usuario actual.");

    const nextUsername = trimmed || null;
    const usernameChanged = (current?.username || null) !== nextUsername;

    if (usernameChanged) {
      const daysRemaining = getUsernameCooldownDaysRemaining(current?.username_changed_at);

      if (daysRemaining > 0) {
        throw new Error(
          `Ya cambiaste tu usuario hace poco. Podes volver a cambiarlo en ${daysRemaining} dia${daysRemaining === 1 ? "" : "s"}.`
        );
      }

      payload.username_changed_at = new Date().toISOString();
    }

    payload.username = nextUsername;
  }

  // Update, no upsert: a esta altura el perfil ya existe siempre (se crea en
  // /profile-setup). Un upsert construye primero la fila candidata para el
  // INSERT y Postgres valida sus NOT NULL (goal, experience_level) antes de
  // llegar a resolver el ON CONFLICT, así que fallaría aunque la fila exista.
  const { data, error } = await client
    .from("profiles")
    .update(payload)
    .eq("user_id", userId)
    .select()
    .maybeSingle();

  if (error?.code === "23505") {
    throw new Error("Ese nombre de usuario ya esta en uso.");
  }

  throwIfError(error, "No se pudo actualizar el perfil.");
  return data;
}

export async function uploadAvatar(userId, file) {
  const client = ensureClient();
  const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/avatar-${Date.now()}.${extension}`;

  const { error: uploadError } = await client.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  throwIfError(uploadError, "No se pudo subir la foto de perfil.");

  const { data } = client.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function updateVisibility(userId, field, value) {
  const client = ensureClient();
  const { error } = await client
    .from("profiles")
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  throwIfError(error, "No se pudo actualizar la visibilidad.");
}

// ---------------------------------------------------------------------------
// Medidas corporales
// ---------------------------------------------------------------------------

export async function upsertMeasurement(userId, payload) {
  const client = ensureClient();
  const { error } = await client.from("body_measurements").upsert(
    {
      user_id: userId,
      updated_at: new Date().toISOString(),
      ...payload,
    },
    { onConflict: "user_id,measurement_date" }
  );

  throwIfError(error, "No se pudo registrar la medida.");
}

// ---------------------------------------------------------------------------
// PRs (records personales)
// ---------------------------------------------------------------------------

export async function upsertPersonalRecord(userId, payload) {
  const client = ensureClient();
  const { error } = await client.from("personal_records").upsert({
    user_id: userId,
    ...payload,
  });

  throwIfError(error, "No se pudo guardar el record.");
}

export async function deletePersonalRecord(id) {
  const client = ensureClient();
  const { error } = await client.from("personal_records").delete().eq("id", id);
  throwIfError(error, "No se pudo eliminar el record.");
}

// ---------------------------------------------------------------------------
// Comidas favoritas
// ---------------------------------------------------------------------------

export async function upsertFavoriteFood(userId, payload) {
  const client = ensureClient();
  const { error } = await client.from("favorite_foods").upsert({
    user_id: userId,
    ...payload,
  });

  throwIfError(error, "No se pudo guardar la comida favorita.");
}

export async function deleteFavoriteFood(id) {
  const client = ensureClient();
  const { error } = await client.from("favorite_foods").delete().eq("id", id);
  throwIfError(error, "No se pudo eliminar la comida favorita.");
}

// ---------------------------------------------------------------------------
// Horario de gym
// ---------------------------------------------------------------------------

export async function upsertGymScheduleDay(userId, payload) {
  const client = ensureClient();
  const { error } = await client.from("gym_schedule").upsert(
    {
      user_id: userId,
      updated_at: new Date().toISOString(),
      ...payload,
    },
    { onConflict: "user_id,day_of_week" }
  );

  throwIfError(error, "No se pudo guardar el horario.");
}

export async function deleteGymScheduleDay(id) {
  const client = ensureClient();
  const { error } = await client.from("gym_schedule").delete().eq("id", id);
  throwIfError(error, "No se pudo eliminar el horario.");
}

// ---------------------------------------------------------------------------
// Amigos
// ---------------------------------------------------------------------------

export async function searchProfiles(query) {
  const client = ensureClient();
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const { data, error } = await client.rpc("search_profiles", { search_query: trimmed });
  throwIfError(error, "No se pudo buscar usuarios.");
  return data || [];
}

export async function getFriendshipWith(viewerId, targetId) {
  const client = ensureClient();
  const { data, error } = await client
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .or(
      `and(requester_id.eq.${viewerId},addressee_id.eq.${targetId}),` +
        `and(requester_id.eq.${targetId},addressee_id.eq.${viewerId})`
    )
    .maybeSingle();

  throwIfError(error, "No se pudo cargar el estado de amistad.");
  return data;
}

export async function listMyFriendships(userId) {
  const client = ensureClient();
  const { data, error } = await client
    .from("friendships")
    .select("id, requester_id, addressee_id, status, created_at")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  throwIfError(error, "No se pudieron cargar tus amistades.");
  return data || [];
}

// Agrupa las filas crudas de `friendships` en las 3 listas que usa la UI.
export function categorizeFriendships(rows, userId) {
  const friends = [];
  const received = [];
  const sent = [];

  for (const row of rows) {
    if (row.status === "accepted") {
      friends.push(row);
    } else if (row.status === "pending" && row.addressee_id === userId) {
      received.push(row);
    } else if (row.status === "pending" && row.requester_id === userId) {
      sent.push(row);
    }
  }

  return { friends, received, sent };
}

export async function sendFriendRequest(requesterId, addresseeId) {
  const client = ensureClient();

  const { data: existing, error: existingError } = await client
    .from("friendships")
    .select("id, status")
    .or(
      `and(requester_id.eq.${requesterId},addressee_id.eq.${addresseeId}),` +
        `and(requester_id.eq.${addresseeId},addressee_id.eq.${requesterId})`
    )
    .maybeSingle();

  throwIfError(existingError, "No se pudo enviar la solicitud.");

  if (existing) {
    if (existing.status !== "declined") {
      throw new Error("Ya existe una relación con este usuario.");
    }

    const { error: deleteError } = await client.from("friendships").delete().eq("id", existing.id);
    throwIfError(deleteError, "No se pudo enviar la solicitud.");
  }

  const { error } = await client.from("friendships").insert({
    requester_id: requesterId,
    addressee_id: addresseeId,
    status: "pending",
  });

  throwIfError(error, "No se pudo enviar la solicitud.");
}

export async function respondToFriendRequest(friendshipId, accept) {
  const client = ensureClient();
  const { error } = await client
    .from("friendships")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", friendshipId);

  throwIfError(error, "No se pudo responder la solicitud.");
}

export async function removeFriendship(friendshipId) {
  const client = ensureClient();
  const { error } = await client.from("friendships").delete().eq("id", friendshipId);
  throwIfError(error, "No se pudo eliminar la amistad.");
}

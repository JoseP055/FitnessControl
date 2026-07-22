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

export function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Agua
// ---------------------------------------------------------------------------

export async function getWaterToday(userId) {
  const client = ensureClient();
  const { data, error } = await client
    .from("water_logs")
    .select("id, amount_ml")
    .eq("user_id", userId)
    .eq("log_date", todayIso())
    .maybeSingle();

  throwIfError(error, "No se pudo cargar el agua de hoy.");
  return data?.amount_ml || 0;
}

export async function addWater(userId, deltaMl) {
  const client = ensureClient();
  const current = await getWaterToday(userId);
  const nextAmount = Math.max(0, current + deltaMl);

  const { error } = await client.from("water_logs").upsert(
    {
      user_id: userId,
      log_date: todayIso(),
      amount_ml: nextAmount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,log_date" }
  );

  throwIfError(error, "No se pudo registrar el agua.");
  return nextAmount;
}

// ---------------------------------------------------------------------------
// Comidas
// ---------------------------------------------------------------------------

export async function listMealsToday(userId) {
  const client = ensureClient();
  const { data, error } = await client
    .from("nutrition_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", todayIso())
    .order("created_at", { ascending: true });

  throwIfError(error, "No se pudieron cargar las comidas de hoy.");
  return data || [];
}

export async function addMeal(userId, payload) {
  const client = ensureClient();
  const { error } = await client.from("nutrition_logs").insert({
    user_id: userId,
    log_date: todayIso(),
    ...payload,
  });

  throwIfError(error, "No se pudo registrar la comida.");
}

export async function deleteMeal(id) {
  const client = ensureClient();
  const { error } = await client.from("nutrition_logs").delete().eq("id", id);
  throwIfError(error, "No se pudo eliminar la comida.");
}

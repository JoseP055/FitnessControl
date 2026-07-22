import { supabaseClient } from "./supabaseClient";

const API_URL = process.env.REACT_APP_API_URL || "";
const DEBUG_URL = "http://127.0.0.1:7777/event";
const DEBUG_SESSION_ID = "routines-infinite-loading";
const API_TIMEOUT_MS = 6000;

async function getAuthHeaders() {
  if (!supabaseClient) {
    return {};
  }

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  const token = session?.access_token;

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function apiRequest(path, options = {}) {
  const authHeaders = await getAuthHeaders();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  // #region debug-point B:api-request-start
  fetch(DEBUG_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION_ID,
      runId: "pre-fix",
      hypothesisId: "B",
      location: "api.js:apiRequest:start",
      msg: "[DEBUG] Starting API request",
      data: {
        path,
        method: options.method || "GET",
        apiUrl: API_URL,
        hasAuthHeader: Boolean(authHeaders.Authorization),
      },
      ts: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options.headers || {}),
    },
    signal: controller.signal,
  }).catch((error) => {
    if (error?.name === "AbortError") {
      throw new Error("El backend tardó demasiado en responder.");
    }

    throw error;
  });

  window.clearTimeout(timeoutId);

  const contentType = response.headers.get("content-type") || "";
  // #region debug-point B:api-response
  fetch(DEBUG_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION_ID,
      runId: "pre-fix",
      hypothesisId: "B",
      location: "api.js:apiRequest:response",
      msg: "[DEBUG] API response received",
      data: {
        path,
        status: response.status,
        ok: response.ok,
        contentType,
      },
      ts: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const message =
      data?.detail || data?.supabase?.error || "No se pudo completar la solicitud.";
    throw new Error(message);
  }

  return data;
}

export async function healthCheck() {
  return apiRequest("/health", { method: "GET" });
}

export async function getCurrentUserProfile() {
  return apiRequest("/me", { method: "GET" });
}

export async function getExercises() {
  return apiRequest("/exercises", { method: "GET" });
}

export async function getRoutines() {
  return apiRequest("/routines", { method: "GET" });
}

export async function createRoutine(payload) {
  return apiRequest("/routines", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRoutineDetail(routineId) {
  return apiRequest(`/routines/${routineId}`, { method: "GET" });
}

export async function updateRoutine(routineId, payload) {
  return apiRequest(`/routines/${routineId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteRoutine(routineId) {
  return apiRequest(`/routines/${routineId}`, { method: "DELETE" });
}

export async function addRoutineExercise(routineId, payload) {
  return apiRequest(`/routines/${routineId}/exercises`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRoutineExercise(routineId, routineExerciseId, payload) {
  return apiRequest(`/routines/${routineId}/exercises/${routineExerciseId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteRoutineExercise(routineId, routineExerciseId) {
  return apiRequest(`/routines/${routineId}/exercises/${routineExerciseId}`, {
    method: "DELETE",
  });
}

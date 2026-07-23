import { supabaseClient } from "./supabaseClient";

const API_URL = (process.env.REACT_APP_API_URL || "").trim().replace(/\/+$/, "");
const API_TIMEOUT_MS = 6000;

function buildRequestUrl(path) {
  if (!API_URL) {
    return path;
  }

  return `${API_URL}${path}`;
}

function getNetworkErrorMessage(path) {
  const targetUrl = buildRequestUrl(path);

  if (API_URL.includes("localhost") || API_URL.includes("127.0.0.1")) {
    return `No se pudo conectar con el backend en ${API_URL}. Verifica que este levantado y que responda ${targetUrl}.`;
  }

  return `No se pudo conectar con el backend. Revisa la URL API y el acceso a ${targetUrl}.`;
}

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

  try {
    const response = await fetch(buildRequestUrl(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
      const message =
        data?.detail || data?.supabase?.error || "No se pudo completar la solicitud.";
      throw new Error(message);
    }

    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("El backend tardo demasiado en responder.");
    }

    if (error instanceof TypeError) {
      throw new Error(getNetworkErrorMessage(path));
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function healthCheck() {
  return apiRequest("/health", { method: "GET" });
}

export async function getCurrentUserProfile() {
  return apiRequest("/me", { method: "GET" });
}

export async function getProfile(userId) {
  return apiRequest(`/profile/${userId}`, { method: "GET" });
}

export async function getExercises({ muscleSubgroup, muscleGroupParent } = {}) {
  const params = new URLSearchParams();

  if (muscleSubgroup) {
    params.set("muscle_subgroup", muscleSubgroup);
  }

  if (muscleGroupParent) {
    params.set("muscle_group_parent", muscleGroupParent);
  }

  return apiRequest(`/exercises${params.toString() ? `?${params.toString()}` : ""}`, {
    method: "GET",
  });
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

export async function createRoutineDay(routineId, payload) {
  return apiRequest(`/routines/${routineId}/days`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function addRoutineDayExercise(routineId, routineDayId, payload) {
  return apiRequest(`/routines/${routineId}/days/${routineDayId}/exercises`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRoutineSchedule(routineId) {
  return apiRequest(`/routines/${routineId}/schedule`, { method: "GET" });
}

export async function getRoutineOverview(routineId) {
  return apiRequest(`/routines/${routineId}/overview`, { method: "GET" });
}

export async function getRoutineCalendar(routineId) {
  return apiRequest(`/routines/${routineId}/calendar`, { method: "GET" });
}

export async function upsertRoutineCompletion(routineId, payload) {
  return apiRequest(`/routines/${routineId}/completions`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
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

export async function getTodaysTraining() {
  return apiRequest("/routines/today", { method: "GET" });
}

export async function toggleTodaysExercise(routineExerciseId, completed) {
  return apiRequest(`/routines/today/exercises/${routineExerciseId}`, {
    method: "PUT",
    body: JSON.stringify({ completed }),
  });
}

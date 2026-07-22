import { supabaseClient } from "./supabaseClient";

const API_URL = process.env.REACT_APP_API_URL || "";
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
  try {
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

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
      const message =
        data?.detail || data?.supabase?.error || "No se pudo completar la solicitud.";
      throw new Error(message);
    }

    return data;
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

export async function getExercises(muscleGroup) {
  const params = new URLSearchParams();
  if (muscleGroup) {
    params.set("muscle_group", muscleGroup);
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

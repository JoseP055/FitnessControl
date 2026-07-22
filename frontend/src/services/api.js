import { supabaseClient } from "./supabaseClient";

const API_URL = process.env.REACT_APP_API_URL || "";

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
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

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

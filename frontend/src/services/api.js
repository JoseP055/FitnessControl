const API_URL = process.env.REACT_APP_API_URL || "";

export async function healthCheck() {
  const response = await fetch(`${API_URL}/health`);
  const data = await response.json();

  if (!response.ok) {
    const message = data?.supabase?.error || "No se pudo consultar el backend.";
    throw new Error(message);
  }

  return data;
}

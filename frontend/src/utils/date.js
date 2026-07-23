// Fecha local (no UTC) en formato YYYY-MM-DD. getFullYear/getMonth/getDate
// siempre devuelven la hora local del dispositivo, a diferencia de
// toISOString() que convierte a UTC y puede "saltar" al dia siguiente o
// anterior segun la zona horaria del usuario.
export function getLocalDateIso(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

# Debug Session: me-failed-fetch
- **Status**: [OPEN]
- **Issue**: `GET /health` funciona, pero `GET /me` desde el frontend falla con `Error: Failed to fetch`.
- **Debug Server**: Pending
- **Log File**: .dbg/trae-debug-log-me-failed-fetch.ndjson

## Reproduction Steps
1. Iniciar sesión en el frontend (Vercel o local).
2. Navegar a la ruta protegida `/`.
3. El frontend intenta llamar `GET /me` con `Authorization: Bearer <token>`.
4. Se muestra `Error: Failed to fetch`.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Expected Signal |
|----|------------|------------|--------|-----------------|
| A | `/me` no existe o no está deployado (404). | Medium | Low | Network muestra 404 o `{"detail":"Not Found"}` |
| B | CORS/preflight falla específicamente por el header `Authorization` (OPTIONS bloqueada). | High | Low | Network muestra CORS error / preflight 4xx/5xx y `Failed to fetch` |
| C | El token no llega o está vacío (401) y el browser bloquea por CORS. | Medium | Low | Network muestra 401 o falta header Authorization |
| D | La validación en backend falla (401) por método/keys, pero debería verse como 401 con JSON. | Medium | Low | 401 con body `detail` desde `/me` |
| E | `REACT_APP_API_URL` apunta a un host distinto para `/me` (URL mal armada) o hay bloqueo del cliente. | Low | Low | Request URL inesperada / error `ERR_BLOCKED_BY_CLIENT` |

## Log Evidence
- Pendiente.

## Verification Conclusion
- Pendiente.

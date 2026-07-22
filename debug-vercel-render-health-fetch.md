# Debug Session: vercel-render-health-fetch
- **Status**: [OPEN]
- **Issue**: El frontend desplegado en Vercel muestra `Error: Failed to fetch` al consultar `GET /health` del backend en Render.
- **Debug Server**: Pending
- **Log File**: .dbg/trae-debug-log-vercel-render-health-fetch.ndjson

## Reproduction Steps
1. Abrir `https://fitness-control-xi.vercel.app/`.
2. Esperar la carga inicial de la pantalla.
3. Observar que el frontend queda en `Consultando GET /health...` y luego muestra `Error: Failed to fetch`.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | Render no devuelve `access-control-allow-origin` para el dominio real de Vercel. | High | Low | Pending |
| B | `REACT_APP_API_URL` en Vercel no apunta a `https://fitnesscontrol-qpad.onrender.com`. | Medium | Low | Pending |
| C | El backend falla en la preflight `OPTIONS` o en requests cross-origin aunque `/health` directo funcione. | High | Low | Pending |
| D | `FRONTEND_URL` en Render no incluye exactamente el dominio estable o el deployment actual de Vercel. | High | Low | Pending |
| E | El error no es CORS sino red/SSL entre Vercel y Render. | Medium | Medium | Pending |

## Log Evidence
- Pendiente.

## Verification Conclusion
- Pendiente.

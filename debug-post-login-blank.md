# Debug Session: post-login-blank
- **Status**: [OPEN]
- **Issue**: Después de iniciar sesión no carga ninguna pantalla utilizable.
- **Debug Server**: http://127.0.0.1:7777/event
- **Log File**: .dbg/trae-debug-log-post-login-blank.ndjson

## Reproduction Steps
1. Abrir la app.
2. Iniciar sesión con una cuenta válida.
3. Observar que no termina de cargar o queda en blanco.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | `PostLoginGate` falla al consultar `profiles` o al decidir el destino | High | Low | Pending |
| B | Una vista nueva (`Dashboard`, `RoutineList`, `AppShell`) lanza error de render post-login | High | Medium | Pending |
| C | El frontend o backend sigue corriendo con una versión vieja y el flujo nuevo no coincide | Med | Low | Pending |
| D | Alguna request post-login falla y deja un loading eterno | Med | Medium | Pending |
| E | Hay un problema de navegación/rutas después del redirect inicial | Med | Low | Pending |

## Log Evidence
- Consola del navegador: `Minified React error #310`.
- El fallo aparece después del login con usuario existente y muestra pantalla oscura vacía.
- Revisión estática y runtime: `Dashboard.js` tenía `useMemo` (`activeTab`) después de `if (loadingProfile) return ...`.
- Revisión estática: `ProfileSetup.js` tenía `useEffect` después de `if (loading) return ...` y `if (!user) return ...`.

## Verification Conclusion
- Causa confirmada: violación de reglas de Hooks en React por declarar hooks después de retornos condicionales.
- Fix aplicado: reordenar hooks para que se ejecuten siempre antes de cualquier return condicional en `Dashboard.js` y `ProfileSetup.js`.
- Estado: pendiente de verificación del usuario.

## Instrumentation
- `frontend/src/App.js`: estado de `App`, `ProtectedRoute` y `PostLoginGate`.
- `frontend/src/components/layout/AppShell.js`: montaje y navegación del shell.
- `frontend/src/pages/Dashboard.js`: estado de carga/render del dashboard.

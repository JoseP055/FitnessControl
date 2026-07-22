# Debug Session: routines-infinite-loading
- **Status**: [OPEN]
- **Issue**: La pantalla de rutinas queda en "Cargando rutinas..." indefinidamente.
- **Debug Server**: pending
- **Log File**: .dbg/trae-debug-log-routines-infinite-loading.ndjson

## Reproduction Steps
1. Iniciar sesión.
2. Entrar al módulo de rutinas.
3. Observar que la pantalla queda cargando indefinidamente.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | `RoutineList` no sale del ciclo de carga porque la promesa de `getRoutines()` no resuelve | High | Low | Pending |
| B | `apiRequest()` se bloquea al parsear o esperar la respuesta de `/routines` | High | Medium | Pending |
| C | El backend `/routines` responde mal o no responde para el usuario autenticado | High | Medium | Pending |
| D | El render de `RoutineList` falla antes de aplicar `setLoading(false)` | Med | Low | Pending |
| E | El JWT no llega o llega inválido y el flujo de error no se refleja bien en pantalla | Med | Medium | Pending |

## Log Evidence
- Pendiente.

## Verification Conclusion
- Pendiente.

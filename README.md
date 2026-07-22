# FitnessControl

Monorepo base para la app web `FitnessControl`.

## Estructura

```text
FitnessControl/
├── frontend/          # React (Create React App)
├── backend/           # FastAPI
├── docs/              # Documentacion tecnica y SQL versionado
└── README.md
```

## Reglas base

- `frontend/` y `backend/` se mantienen separados.
- El backend expone la API REST y concentra la logica de negocio.
- Supabase `secret` solo vive en backend.
- Todo cambio de esquema se versiona en `docs/db/`.

## Entorno local

### Backend

1. Crear el entorno virtual dentro de `backend/`:

```bash
cd backend
python -m venv venv
```

2. Activar el entorno virtual:

```bash
venv\Scripts\activate
```

3. Instalar dependencias:

```bash
pip install -r requirements.txt
```

4. Crear `backend/.env` a partir de `backend/.env.example` con tus valores reales de Supabase.

5. Levantar FastAPI en local:

```bash
uvicorn app.main:app --reload
```

6. Probar salud del backend:

```text
http://localhost:8000/health
```

Si la conexion a Supabase esta bien y la tabla `routines` existe, la respuesta esperada es `200 OK` con un JSON similar a:

```json
{
  "status": "ok",
  "api": "FitnessControl API",
  "environment": "development",
  "supabase": {
    "configured": true,
    "connected": true,
    "checked_table": "routines",
    "row_count": 0
  }
}
```

Si falta configuracion o falla la conexion, la API responde `503` con `status: "degraded"` y el detalle del error en `supabase.error`.

### Frontend

1. Crear `frontend/.env` a partir de `frontend/.env.example`.
2. Instalar dependencias:

```bash
cd frontend
npm install
```

3. Levantar el frontend:

```bash
npm start
```

4. Abrir:

```text
http://localhost:3000
```

La pantalla inicial consulta `GET /health` al backend y muestra el JSON de respuesta. Si ves `supabase.connected: true`, entonces el flujo local frontend -> backend -> Supabase esta funcionando.

## Base de datos

- El esquema inicial esta en `docs/db/schema.sql`.
- Este archivo asume uso de Supabase Auth, por eso no crea una tabla `users`.
- Ejecutalo manualmente en el SQL Editor de Supabase antes de validar `GET /health`.

## Verificacion local

1. Ejecutar `docs/db/schema.sql` en Supabase.
2. Crear `backend/.env` y `frontend/.env` con los valores reales.
3. Levantar backend en `http://localhost:8000`.
4. Confirmar `http://localhost:8000/health`.
5. Levantar frontend en `http://localhost:3000`.
6. Confirmar que la pagina renderiza el estado del backend y de Supabase.

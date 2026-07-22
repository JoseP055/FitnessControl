# Arquitectura base

## Stack

- Frontend: React con Create React App y despliegue en Vercel.
- Backend: FastAPI y despliegue en Render.
- Base de datos y autenticacion: Supabase.

## Reglas operativas

1. Nunca mezclar codigo de frontend y backend en la misma carpeta.
2. El backend concentra la logica de negocio y expone una API REST.
3. Las claves sensibles de Supabase solo viven en el backend.
4. Los cambios de esquema deben documentarse en `docs/db/`.
5. Las variables del frontend usan prefijo `REACT_APP_`.

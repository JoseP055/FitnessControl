from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.core.config import settings
from app.core.supabase import get_supabase_client


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    response_data = {
        "status": "ok",
        "api": settings.app_name,
        "environment": settings.app_env,
        "supabase": {
            "configured": settings.supabase_configured,
            "connected": False,
            "checked_table": "routines",
        },
    }

    try:
        supabase = get_supabase_client()
        result = supabase.table("routines").select("id", count="exact").limit(1).execute()
        row_count = result.count if result.count is not None else len(result.data or [])

        response_data["supabase"]["connected"] = True
        response_data["supabase"]["row_count"] = row_count
    except Exception as error:
        response_data["status"] = "degraded"
        response_data["supabase"]["error"] = str(error)
        return JSONResponse(status_code=503, content=response_data)

    return response_data


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port)

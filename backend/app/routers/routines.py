from collections import Counter
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth import get_current_user_id
from app.core.supabase import get_supabase_client


router = APIRouter(tags=["routines"])


class RoutinePayload(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)


class RoutineExercisePayload(BaseModel):
    exercise_id: str
    sets_planned: int | None = Field(default=None, ge=1, le=100)
    reps_planned: int | None = Field(default=None, ge=1, le=500)
    rest_seconds: int | None = Field(default=None, ge=0, le=3600)
    exercise_order: int | None = Field(default=None, ge=1, le=999)
    notes: str | None = Field(default=None, max_length=500)


class RoutineExerciseUpdatePayload(BaseModel):
    sets_planned: int | None = Field(default=None, ge=1, le=100)
    reps_planned: int | None = Field(default=None, ge=1, le=500)
    rest_seconds: int | None = Field(default=None, ge=0, le=3600)
    exercise_order: int | None = Field(default=None, ge=1, le=999)
    notes: str | None = Field(default=None, max_length=500)


def _normalize_text(value: str | None) -> str | None:
    if value is None:
        return None

    normalized = value.strip()
    return normalized or None


def _first_row(result: Any) -> dict[str, Any] | None:
    data = getattr(result, "data", None) or []
    return data[0] if data else None


def _get_routine_or_404(user_id: str, routine_id: str) -> dict[str, Any]:
    supabase = get_supabase_client()
    result = (
        supabase.table("routines")
        .select("id, user_id, name, description, is_active, created_at, updated_at")
        .eq("id", routine_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    routine = _first_row(result)

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró la rutina.",
        )

    return routine


def _get_accessible_exercise_or_404(user_id: str, exercise_id: str) -> dict[str, Any]:
    supabase = get_supabase_client()
    result = (
        supabase.table("exercises")
        .select("id, created_by_user_id, name, muscle_group, equipment, description")
        .eq("id", exercise_id)
        .limit(1)
        .execute()
    )
    exercise = _first_row(result)

    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el ejercicio seleccionado.",
        )

    created_by_user_id = exercise.get("created_by_user_id")
    if created_by_user_id not in (None, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tenés acceso a este ejercicio.",
        )

    return exercise


def _build_routine_detail(user_id: str, routine_id: str) -> dict[str, Any]:
    supabase = get_supabase_client()
    routine = _get_routine_or_404(user_id, routine_id)

    routine_exercises_result = (
        supabase.table("routine_exercises")
        .select(
            "id, user_id, routine_id, exercise_id, sets_planned, reps_planned, "
            "rest_seconds, exercise_order, notes, created_at, updated_at"
        )
        .eq("user_id", user_id)
        .eq("routine_id", routine_id)
        .order("exercise_order")
        .execute()
    )
    routine_exercises = getattr(routine_exercises_result, "data", None) or []

    exercises_by_id: dict[str, dict[str, Any]] = {}
    exercise_ids = [item["exercise_id"] for item in routine_exercises if item.get("exercise_id")]

    if exercise_ids:
        exercises_result = (
            supabase.table("exercises")
            .select("id, name, muscle_group, equipment, description, created_by_user_id")
            .in_("id", exercise_ids)
            .execute()
        )
        exercises = getattr(exercises_result, "data", None) or []
        exercises_by_id = {exercise["id"]: exercise for exercise in exercises}

    enriched_exercises = [
        {
            **item,
            "exercise": exercises_by_id.get(item["exercise_id"]),
        }
        for item in routine_exercises
    ]

    return {
        **routine,
        "exercises": enriched_exercises,
        "exercise_count": len(enriched_exercises),
    }


@router.get("/exercises")
async def list_exercises(user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase_client()
    result = (
        supabase.table("exercises")
        .select("id, created_by_user_id, name, muscle_group, equipment, description")
        .order("muscle_group")
        .order("name")
        .execute()
    )
    exercises = getattr(result, "data", None) or []
    visible_exercises = [
        exercise
        for exercise in exercises
        if exercise.get("created_by_user_id") in (None, user_id)
    ]
    return {"items": visible_exercises}


@router.get("/routines")
async def list_routines(user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase_client()
    routines_result = (
        supabase.table("routines")
        .select("id, user_id, name, description, is_active, created_at, updated_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    routines = getattr(routines_result, "data", None) or []

    if not routines:
        return {"items": []}

    routine_ids = [routine["id"] for routine in routines]
    counts_result = (
        supabase.table("routine_exercises")
        .select("routine_id")
        .eq("user_id", user_id)
        .in_("routine_id", routine_ids)
        .execute()
    )
    routine_exercises = getattr(counts_result, "data", None) or []
    counts = Counter(item["routine_id"] for item in routine_exercises if item.get("routine_id"))

    items = [
        {
            **routine,
            "exercise_count": counts.get(routine["id"], 0),
        }
        for routine in routines
    ]
    return {"items": items}


@router.post("/routines", status_code=status.HTTP_201_CREATED)
async def create_routine(
    payload: RoutinePayload,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase_client()
    routine_data = {
        "user_id": user_id,
        "name": payload.name.strip(),
        "description": _normalize_text(payload.description),
    }
    result = supabase.table("routines").insert(routine_data).execute()
    routine = _first_row(result)

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear la rutina.",
        )

    return {**routine, "exercise_count": 0}


@router.get("/routines/{routine_id}")
async def get_routine_detail(
    routine_id: str,
    user_id: str = Depends(get_current_user_id),
):
    return _build_routine_detail(user_id, routine_id)


@router.put("/routines/{routine_id}")
async def update_routine(
    routine_id: str,
    payload: RoutinePayload,
    user_id: str = Depends(get_current_user_id),
):
    _get_routine_or_404(user_id, routine_id)
    supabase = get_supabase_client()
    result = (
        supabase.table("routines")
        .update(
            {
                "name": payload.name.strip(),
                "description": _normalize_text(payload.description),
            }
        )
        .eq("id", routine_id)
        .eq("user_id", user_id)
        .execute()
    )
    routine = _first_row(result)

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo actualizar la rutina.",
        )

    return routine


@router.delete("/routines/{routine_id}")
async def delete_routine(
    routine_id: str,
    user_id: str = Depends(get_current_user_id),
):
    _get_routine_or_404(user_id, routine_id)
    supabase = get_supabase_client()
    supabase.table("routines").delete().eq("id", routine_id).eq("user_id", user_id).execute()
    return {"success": True}


@router.post("/routines/{routine_id}/exercises", status_code=status.HTTP_201_CREATED)
async def add_routine_exercise(
    routine_id: str,
    payload: RoutineExercisePayload,
    user_id: str = Depends(get_current_user_id),
):
    _get_routine_or_404(user_id, routine_id)
    _get_accessible_exercise_or_404(user_id, payload.exercise_id)
    supabase = get_supabase_client()

    exercise_order = payload.exercise_order
    if exercise_order is None:
        last_order_result = (
            supabase.table("routine_exercises")
            .select("exercise_order")
            .eq("user_id", user_id)
            .eq("routine_id", routine_id)
            .order("exercise_order", desc=True)
            .limit(1)
            .execute()
        )
        last_row = _first_row(last_order_result)
        exercise_order = (last_row.get("exercise_order", 0) if last_row else 0) + 1

    supabase.table("routine_exercises").insert(
        {
            "user_id": user_id,
            "routine_id": routine_id,
            "exercise_id": payload.exercise_id,
            "sets_planned": payload.sets_planned,
            "reps_planned": payload.reps_planned,
            "rest_seconds": payload.rest_seconds,
            "exercise_order": exercise_order,
            "notes": _normalize_text(payload.notes),
        }
    ).execute()

    return _build_routine_detail(user_id, routine_id)


@router.put("/routines/{routine_id}/exercises/{routine_exercise_id}")
async def update_routine_exercise(
    routine_id: str,
    routine_exercise_id: str,
    payload: RoutineExerciseUpdatePayload,
    user_id: str = Depends(get_current_user_id),
):
    _get_routine_or_404(user_id, routine_id)
    supabase = get_supabase_client()

    routine_exercise_result = (
        supabase.table("routine_exercises")
        .select("id")
        .eq("id", routine_exercise_id)
        .eq("routine_id", routine_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    routine_exercise = _first_row(routine_exercise_result)

    if not routine_exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el ejercicio dentro de la rutina.",
        )

    update_data = {
        "sets_planned": payload.sets_planned,
        "reps_planned": payload.reps_planned,
        "rest_seconds": payload.rest_seconds,
        "exercise_order": payload.exercise_order,
        "notes": _normalize_text(payload.notes),
    }

    cleaned_update_data = {
        key: value for key, value in update_data.items() if value is not None
    }

    if not cleaned_update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay cambios para guardar.",
        )

    supabase.table("routine_exercises").update(cleaned_update_data).eq(
        "id", routine_exercise_id
    ).eq("routine_id", routine_id).eq("user_id", user_id).execute()

    return _build_routine_detail(user_id, routine_id)


@router.delete("/routines/{routine_id}/exercises/{routine_exercise_id}")
async def delete_routine_exercise(
    routine_id: str,
    routine_exercise_id: str,
    user_id: str = Depends(get_current_user_id),
):
    _get_routine_or_404(user_id, routine_id)
    supabase = get_supabase_client()

    routine_exercise_result = (
        supabase.table("routine_exercises")
        .select("id")
        .eq("id", routine_exercise_id)
        .eq("routine_id", routine_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    routine_exercise = _first_row(routine_exercise_result)

    if not routine_exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el ejercicio dentro de la rutina.",
        )

    supabase.table("routine_exercises").delete().eq("id", routine_exercise_id).eq(
        "routine_id", routine_id
    ).eq("user_id", user_id).execute()

    return _build_routine_detail(user_id, routine_id)

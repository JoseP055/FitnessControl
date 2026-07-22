import asyncio
from collections import Counter
from calendar import monthrange
from datetime import date, datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.core.auth import get_current_user_id
from app.core.supabase import get_supabase_client


router = APIRouter(tags=["routines"])


class RoutineCreatePayload(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    duration_months: int | None = Field(default=None, ge=1, le=24)
    start_date: date | None = None


class RoutineUpdatePayload(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    duration_months: int | None = Field(default=None, ge=1, le=24)
    start_date: date | None = None


class RoutineDayPayload(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    muscle_subgroups: list[str] = Field(min_length=1, max_length=12)


class RoutineDayExercisePayload(BaseModel):
    exercise_id: str
    sets_planned: int | None = Field(default=None, ge=1, le=100)
    reps_planned: int | None = Field(default=None, ge=1, le=500)
    duration_minutes: int | None = Field(default=None, ge=1, le=600)
    rest_seconds: int | None = Field(default=None, ge=0, le=3600)
    exercise_order: int | None = Field(default=None, ge=1, le=999)
    notes: str | None = Field(default=None, max_length=500)


class RoutineExerciseUpdatePayload(BaseModel):
    sets_planned: int | None = Field(default=None, ge=1, le=100)
    reps_planned: int | None = Field(default=None, ge=1, le=500)
    duration_minutes: int | None = Field(default=None, ge=1, le=600)
    rest_seconds: int | None = Field(default=None, ge=0, le=3600)
    exercise_order: int | None = Field(default=None, ge=1, le=999)
    notes: str | None = Field(default=None, max_length=500)


class RoutineCompletionPayload(BaseModel):
    routine_day_id: str
    completion_date: date
    status: str


def _normalize_text(value: str | None) -> str | None:
    if value is None:
        return None

    normalized = value.strip()
    return normalized or None


def _normalize_muscle_subgroups(values: list[str]) -> list[str]:
    cleaned: list[str] = []
    seen: set[str] = set()

    for raw_value in values:
        normalized = raw_value.strip().lower()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        cleaned.append(normalized)

    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selecciona al menos un subgrupo muscular.",
        )

    return cleaned


def _add_months(base_date: date, months: int) -> date:
    month_index = base_date.month - 1 + months
    year = base_date.year + month_index // 12
    month = month_index % 12 + 1
    day = min(base_date.day, monthrange(year, month)[1])
    return date(year, month, day)


def _calculate_end_date(start_date: date, duration_months: int) -> date:
    return _add_months(start_date, duration_months) - timedelta(days=1)


def _coerce_date(value: Any) -> date | None:
    if value is None or isinstance(value, date):
        return value
    return date.fromisoformat(str(value))


def _first_row(result: Any) -> dict[str, Any] | None:
    data = getattr(result, "data", None) or []
    return data[0] if data else None


def _get_routine_or_404(user_id: str, routine_id: str) -> dict[str, Any]:
    supabase = get_supabase_client()
    result = (
        supabase.table("routines")
        .select(
            "id, user_id, name, description, is_active, duration_months, "
            "start_date, end_date, created_at, updated_at"
        )
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
        .select(
            "id, created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description"
        )
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


def _get_routine_day_or_404(user_id: str, routine_id: str, routine_day_id: str) -> dict[str, Any]:
    _get_routine_or_404(user_id, routine_id)
    supabase = get_supabase_client()
    result = (
        supabase.table("routine_days")
        .select("id, routine_id, day_of_week, muscle_subgroups, created_at")
        .eq("id", routine_day_id)
        .eq("routine_id", routine_id)
        .limit(1)
        .execute()
    )
    routine_day = _first_row(result)

    if not routine_day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el día configurado dentro de la rutina.",
        )

    return routine_day


def _get_routine_exercise_or_404(
    user_id: str,
    routine_id: str,
    routine_exercise_id: str,
) -> dict[str, Any]:
    supabase = get_supabase_client()
    result = (
        supabase.table("routine_exercises")
        .select(
            "id, user_id, routine_id, routine_day_id, exercise_id, sets_planned, "
            "reps_planned, duration_minutes, rest_seconds, exercise_order, notes, created_at, updated_at"
        )
        .eq("id", routine_exercise_id)
        .eq("routine_id", routine_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    routine_exercise = _first_row(result)

    if not routine_exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el ejercicio dentro de la rutina.",
        )

    return routine_exercise


def _calculate_next_exercise_order(
    user_id: str, routine_id: str, routine_day_id: str | None = None
) -> int:
    supabase = get_supabase_client()
    query = (
        supabase.table("routine_exercises")
        .select("exercise_order")
        .eq("user_id", user_id)
        .eq("routine_id", routine_id)
    )

    if routine_day_id is None:
        query = query.is_("routine_day_id", "null")
    else:
        query = query.eq("routine_day_id", routine_day_id)

    result = query.order("exercise_order", desc=True).limit(1).execute()
    last_row = _first_row(result)
    return (last_row.get("exercise_order", 0) if last_row else 0) + 1


def _build_schedule(user_id: str, routine_id: str) -> dict[str, Any]:
    supabase = get_supabase_client()
    routine = _get_routine_or_404(user_id, routine_id)

    routine_days_result = (
        supabase.table("routine_days")
        .select("id, routine_id, day_of_week, muscle_subgroups, created_at")
        .eq("routine_id", routine_id)
        .order("day_of_week")
        .execute()
    )
    routine_days = getattr(routine_days_result, "data", None) or []
    routine_day_ids = [item["id"] for item in routine_days if item.get("id")]

    routine_exercises: list[dict[str, Any]] = []
    if routine_day_ids:
        routine_exercises_result = (
            supabase.table("routine_exercises")
            .select(
                "id, user_id, routine_id, routine_day_id, exercise_id, sets_planned, "
                "reps_planned, duration_minutes, rest_seconds, exercise_order, notes, created_at, updated_at"
            )
            .eq("user_id", user_id)
            .eq("routine_id", routine_id)
            .in_("routine_day_id", routine_day_ids)
            .order("exercise_order")
            .execute()
        )
        routine_exercises = getattr(routine_exercises_result, "data", None) or []

    legacy_exercises_result = (
        supabase.table("routine_exercises")
        .select(
            "id, user_id, routine_id, routine_day_id, exercise_id, sets_planned, "
            "reps_planned, duration_minutes, rest_seconds, exercise_order, notes, created_at, updated_at"
        )
        .eq("user_id", user_id)
        .eq("routine_id", routine_id)
        .is_("routine_day_id", "null")
        .order("exercise_order")
        .execute()
    )
    legacy_exercises = getattr(legacy_exercises_result, "data", None) or []

    exercise_ids = list(
        {
            item["exercise_id"]
            for item in [*routine_exercises, *legacy_exercises]
            if item.get("exercise_id")
        }
    )

    exercises_by_id: dict[str, dict[str, Any]] = {}
    if exercise_ids:
        exercises_result = (
            supabase.table("exercises")
            .select(
                "id, name, muscle_group_parent, muscle_subgroup, equipment, description, created_by_user_id"
            )
            .in_("id", exercise_ids)
            .execute()
        )
        exercises_by_id = {
            exercise["id"]: exercise
            for exercise in (getattr(exercises_result, "data", None) or [])
        }

    exercises_by_day: dict[str, list[dict[str, Any]]] = {}
    for item in routine_exercises:
        enriched = {**item, "exercise": exercises_by_id.get(item["exercise_id"])}
        exercises_by_day.setdefault(item["routine_day_id"], []).append(enriched)

    days = []
    for routine_day in routine_days:
        days.append(
            {
                **routine_day,
                "muscle_groups": routine_day.get("muscle_subgroups") or [],
                "exercises": exercises_by_day.get(routine_day["id"], []),
                "exercise_count": len(exercises_by_day.get(routine_day["id"], [])),
            }
        )

    return {
        **routine,
        "days": days,
        "day_count": len(days),
        "exercise_count": sum(day["exercise_count"] for day in days),
        "legacy_exercises": [
            {**item, "exercise": exercises_by_id.get(item["exercise_id"])}
            for item in legacy_exercises
        ],
    }


def _build_routine_detail(user_id: str, routine_id: str) -> dict[str, Any]:
    supabase = get_supabase_client()
    routine = _get_routine_or_404(user_id, routine_id)

    routine_exercises_result = (
        supabase.table("routine_exercises")
        .select(
            "id, user_id, routine_id, routine_day_id, exercise_id, sets_planned, reps_planned, "
            "duration_minutes, rest_seconds, exercise_order, notes, created_at, updated_at"
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
            .select(
                "id, name, muscle_group_parent, muscle_subgroup, equipment, description, created_by_user_id"
            )
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


def _build_routine_calendar_from_schedule(
    schedule: dict[str, Any], user_id: str, routine_id: str
) -> dict[str, Any]:
    start_date = _coerce_date(schedule.get("start_date"))
    end_date = _coerce_date(schedule.get("end_date"))
    routine_days = schedule.get("days", [])

    if not start_date or not end_date or not routine_days:
        return {
            "routine_id": routine_id,
            "start_date": schedule.get("start_date"),
            "end_date": schedule.get("end_date"),
            "total_scheduled_sessions": 0,
            "next_training_date": None,
            "items": [],
        }

    supabase = get_supabase_client()
    completions_result = (
        supabase.table("workout_completions")
        .select(
            "id, user_id, routine_id, routine_day_id, completion_date, status, completed_at, created_at"
        )
        .eq("user_id", user_id)
        .eq("routine_id", routine_id)
        .gte("completion_date", start_date.isoformat())
        .lte("completion_date", end_date.isoformat())
        .execute()
    )
    completions = getattr(completions_result, "data", None) or []
    completions_by_key = {
        (item["routine_day_id"], item["completion_date"]): item for item in completions
    }

    items: list[dict[str, Any]] = []
    current_date = start_date
    today = date.today()

    while current_date <= end_date:
        weekday = current_date.weekday()
        for routine_day in routine_days:
            if routine_day["day_of_week"] != weekday:
                continue

            date_key = current_date.isoformat()
            completion = completions_by_key.get((routine_day["id"], date_key))
            items.append(
                {
                    "routine_id": routine_id,
                    "routine_day_id": routine_day["id"],
                    "date": date_key,
                    "status": completion["status"] if completion else "pending",
                    "completed_at": completion["completed_at"] if completion else None,
                    "day_of_week": routine_day["day_of_week"],
                    "muscle_subgroups": routine_day.get("muscle_subgroups") or [],
                    "muscle_groups": routine_day.get("muscle_subgroups") or [],
                    "exercise_count": routine_day.get("exercise_count", 0),
                }
            )
        current_date += timedelta(days=1)

    next_training_date = next(
        (item["date"] for item in items if item["status"] == "pending" and item["date"] >= today.isoformat()),
        None,
    )

    return {
        "routine_id": routine_id,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "total_scheduled_sessions": len(items),
        "next_training_date": next_training_date,
        "items": items,
    }


def _build_routine_calendar(user_id: str, routine_id: str) -> dict[str, Any]:
    schedule = _build_schedule(user_id, routine_id)
    return _build_routine_calendar_from_schedule(schedule, user_id, routine_id)


@router.get("/exercises")
async def list_exercises(
    user_id: str = Depends(get_current_user_id),
    muscle_group: str | None = Query(default=None),
    muscle_subgroup: str | None = Query(default=None),
    muscle_group_parent: str | None = Query(default=None),
):
    supabase = get_supabase_client()
    result = (
        supabase.table("exercises")
        .select(
            "id, created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description"
        )
        .order("muscle_group_parent")
        .order("muscle_subgroup")
        .order("name")
        .execute()
    )
    exercises = getattr(result, "data", None) or []
    visible_exercises = [
        exercise
        for exercise in exercises
        if exercise.get("created_by_user_id") in (None, user_id)
    ]

    normalized_subgroup = _normalize_text(muscle_subgroup or muscle_group)
    normalized_parent = _normalize_text(muscle_group_parent)

    if normalized_parent:
        visible_exercises = [
            exercise
            for exercise in visible_exercises
            if (exercise.get("muscle_group_parent") or "").strip().lower()
            == normalized_parent.lower()
        ]

    if normalized_subgroup:
        visible_exercises = [
            exercise
            for exercise in visible_exercises
            if (exercise.get("muscle_subgroup") or "").strip().lower()
            == normalized_subgroup.lower()
        ]

    return {"items": visible_exercises}


@router.get("/routines")
async def list_routines(user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase_client()
    routines_result = (
        supabase.table("routines")
        .select(
            "id, user_id, name, description, is_active, duration_months, "
            "start_date, end_date, created_at, updated_at"
        )
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    routines = getattr(routines_result, "data", None) or []

    if not routines:
        return {"items": []}

    routine_ids = [routine["id"] for routine in routines]

    def fetch_exercise_counts():
        return (
            supabase.table("routine_exercises")
            .select("routine_id")
            .eq("user_id", user_id)
            .in_("routine_id", routine_ids)
            .execute()
        )

    def fetch_day_counts():
        return (
            supabase.table("routine_days")
            .select("routine_id")
            .in_("routine_id", routine_ids)
            .execute()
        )

    counts_result, day_counts_result = await asyncio.gather(
        asyncio.to_thread(fetch_exercise_counts),
        asyncio.to_thread(fetch_day_counts),
    )
    routine_exercises = getattr(counts_result, "data", None) or []
    counts = Counter(item["routine_id"] for item in routine_exercises if item.get("routine_id"))

    routine_days = getattr(day_counts_result, "data", None) or []
    day_counts = Counter(item["routine_id"] for item in routine_days if item.get("routine_id"))

    items = [
        {
            **routine,
            "exercise_count": counts.get(routine["id"], 0),
            "day_count": day_counts.get(routine["id"], 0),
        }
        for routine in routines
    ]
    return {"items": items}


@router.post("/routines", status_code=status.HTTP_201_CREATED)
async def create_routine(
    payload: RoutineCreatePayload,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase_client()
    start_date = payload.start_date or date.today()
    duration_months = payload.duration_months or 1
    routine_data = {
        "user_id": user_id,
        "name": payload.name.strip(),
        "description": _normalize_text(payload.description),
        "duration_months": duration_months,
        "start_date": start_date.isoformat(),
        "end_date": _calculate_end_date(start_date, duration_months).isoformat(),
    }
    result = supabase.table("routines").insert(routine_data).execute()
    routine = _first_row(result)

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear la rutina.",
        )

    return {**routine, "exercise_count": 0, "day_count": 0}


@router.post("/routines/{routine_id}/days", status_code=status.HTTP_201_CREATED)
async def create_routine_day(
    routine_id: str,
    payload: RoutineDayPayload,
    user_id: str = Depends(get_current_user_id),
):
    _get_routine_or_404(user_id, routine_id)
    supabase = get_supabase_client()
    muscle_subgroups = _normalize_muscle_subgroups(payload.muscle_subgroups)

    existing_result = (
        supabase.table("routine_days")
        .select("id")
        .eq("routine_id", routine_id)
        .eq("day_of_week", payload.day_of_week)
        .limit(1)
        .execute()
    )
    if _first_row(existing_result):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ese día ya está configurado dentro de la rutina.",
        )

    result = (
        supabase.table("routine_days")
        .insert(
            {
                "routine_id": routine_id,
                "day_of_week": payload.day_of_week,
                "muscle_subgroups": muscle_subgroups,
            }
        )
        .execute()
    )
    routine_day = _first_row(result)

    if not routine_day:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear el día de la rutina.",
        )

    return {
        **routine_day,
        "muscle_groups": routine_day.get("muscle_subgroups") or [],
        "exercise_count": 0,
        "exercises": [],
    }


@router.post("/routines/{routine_id}/days/{routine_day_id}/exercises", status_code=status.HTTP_201_CREATED)
async def add_routine_day_exercise(
    routine_id: str,
    routine_day_id: str,
    payload: RoutineDayExercisePayload,
    user_id: str = Depends(get_current_user_id),
):
    _get_routine_day_or_404(user_id, routine_id, routine_day_id)
    _get_accessible_exercise_or_404(user_id, payload.exercise_id)
    supabase = get_supabase_client()

    exercise_order = payload.exercise_order or _calculate_next_exercise_order(
        user_id, routine_id, routine_day_id
    )

    result = (
        supabase.table("routine_exercises")
        .insert(
            {
                "user_id": user_id,
                "routine_id": routine_id,
                "routine_day_id": routine_day_id,
                "exercise_id": payload.exercise_id,
                "sets_planned": payload.sets_planned,
                "reps_planned": payload.reps_planned,
                "duration_minutes": payload.duration_minutes,
                "rest_seconds": payload.rest_seconds,
                "exercise_order": exercise_order,
                "notes": _normalize_text(payload.notes),
            }
        )
        .execute()
    )
    routine_exercise = _first_row(result)

    if not routine_exercise:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo agregar el ejercicio al día de la rutina.",
        )

    return routine_exercise


@router.get("/routines/{routine_id}/schedule")
async def get_routine_schedule(
    routine_id: str,
    user_id: str = Depends(get_current_user_id),
):
    return _build_schedule(user_id, routine_id)


@router.get("/routines/{routine_id}/calendar")
async def get_routine_calendar(
    routine_id: str,
    user_id: str = Depends(get_current_user_id),
):
    return _build_routine_calendar(user_id, routine_id)


@router.get("/routines/{routine_id}/overview")
async def get_routine_overview(
    routine_id: str,
    user_id: str = Depends(get_current_user_id),
):
    schedule = _build_schedule(user_id, routine_id)
    calendar = _build_routine_calendar_from_schedule(schedule, user_id, routine_id)
    return {"schedule": schedule, "calendar": calendar}


@router.put("/routines/{routine_id}/completions")
async def upsert_routine_completion(
    routine_id: str,
    payload: RoutineCompletionPayload,
    user_id: str = Depends(get_current_user_id),
):
    normalized_status = payload.status.strip().lower()
    if normalized_status not in {"pending", "done", "skipped"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El estado debe ser pending, done o skipped.",
        )

    routine = _get_routine_or_404(user_id, routine_id)
    routine_day = _get_routine_day_or_404(user_id, routine_id, payload.routine_day_id)
    completion_date = payload.completion_date

    start_date = _coerce_date(routine.get("start_date"))
    end_date = _coerce_date(routine.get("end_date"))
    if start_date and completion_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha no puede ser anterior al inicio de la rutina.",
        )
    if end_date and completion_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha no puede ser posterior al fin de la rutina.",
        )
    if completion_date.weekday() != routine_day["day_of_week"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha seleccionada no coincide con el día semanal configurado.",
        )

    supabase = get_supabase_client()
    existing_result = (
        supabase.table("workout_completions")
        .select(
            "id, user_id, routine_id, routine_day_id, completion_date, status, completed_at, created_at"
        )
        .eq("user_id", user_id)
        .eq("routine_id", routine_id)
        .eq("routine_day_id", payload.routine_day_id)
        .eq("completion_date", completion_date.isoformat())
        .limit(1)
        .execute()
    )
    existing_completion = _first_row(existing_result)

    update_data = {
        "status": normalized_status,
        "completed_at": (
            None
            if normalized_status != "done"
            else datetime.now(timezone.utc).isoformat()
        ),
    }

    if existing_completion:
        result = (
            supabase.table("workout_completions")
            .update(update_data)
            .eq("id", existing_completion["id"])
            .execute()
        )
        completion = _first_row(result)
    else:
        result = (
            supabase.table("workout_completions")
            .insert(
                {
                    "user_id": user_id,
                    "routine_id": routine_id,
                    "routine_day_id": payload.routine_day_id,
                    "completion_date": completion_date.isoformat(),
                    **update_data,
                }
            )
            .execute()
        )
        completion = _first_row(result)

    if not completion:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo guardar el estado del entrenamiento.",
        )

    return completion


@router.get("/routines/{routine_id}")
async def get_routine_detail(
    routine_id: str,
    user_id: str = Depends(get_current_user_id),
):
    return _build_routine_detail(user_id, routine_id)


@router.put("/routines/{routine_id}")
async def update_routine(
    routine_id: str,
    payload: RoutineUpdatePayload,
    user_id: str = Depends(get_current_user_id),
):
    current_routine = _get_routine_or_404(user_id, routine_id)
    supabase = get_supabase_client()
    update_data: dict[str, Any] = {}

    if payload.name is not None:
        update_data["name"] = payload.name.strip()
    if payload.description is not None:
        update_data["description"] = _normalize_text(payload.description)

    next_start_date = payload.start_date or _coerce_date(current_routine.get("start_date"))
    next_duration_months = payload.duration_months or current_routine.get("duration_months")

    if payload.start_date is not None:
        update_data["start_date"] = payload.start_date.isoformat()
    if payload.duration_months is not None:
        update_data["duration_months"] = payload.duration_months

    if next_start_date and next_duration_months:
        update_data["end_date"] = _calculate_end_date(
            next_start_date, int(next_duration_months)
        ).isoformat()

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay cambios para guardar.",
        )

    result = (
        supabase.table("routines")
        .update(update_data)
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
    payload: RoutineDayExercisePayload,
    user_id: str = Depends(get_current_user_id),
):
    _get_routine_or_404(user_id, routine_id)
    _get_accessible_exercise_or_404(user_id, payload.exercise_id)
    supabase = get_supabase_client()

    exercise_order = payload.exercise_order or _calculate_next_exercise_order(user_id, routine_id)

    supabase.table("routine_exercises").insert(
        {
            "user_id": user_id,
            "routine_id": routine_id,
            "routine_day_id": None,
            "exercise_id": payload.exercise_id,
            "sets_planned": payload.sets_planned,
            "reps_planned": payload.reps_planned,
            "duration_minutes": payload.duration_minutes,
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
    _get_routine_exercise_or_404(user_id, routine_id, routine_exercise_id)

    update_data = {
        "sets_planned": payload.sets_planned,
        "reps_planned": payload.reps_planned,
        "duration_minutes": payload.duration_minutes,
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
    _get_routine_exercise_or_404(user_id, routine_id, routine_exercise_id)

    supabase.table("routine_exercises").delete().eq("id", routine_exercise_id).eq(
        "routine_id", routine_id
    ).eq("user_id", user_id).execute()

    return _build_routine_detail(user_id, routine_id)

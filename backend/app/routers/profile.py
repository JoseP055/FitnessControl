from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user_id
from app.core.supabase import get_supabase_client
from app.routers.routines import (
    _build_routine_calendar_from_schedule,
    _build_schedule,
    _first_row,
)

router = APIRouter(tags=["profile"])

VISIBILITY_FIELDS = {
    "measurements": "measurements_visibility",
    "personal_records": "prs_visibility",
    "favorite_foods": "favorite_foods_visibility",
    "gym_schedule": "gym_schedule_visibility",
    "streak": "streak_visibility",
    "routine_preview": "routine_preview_visibility",
}


def _get_profile_or_404(user_id: str) -> dict[str, Any]:
    supabase = get_supabase_client()
    result = (
        supabase.table("profiles")
        .select(
            "user_id, full_name, bio, avatar_url, goal, experience_level, "
            "username, public_id, "
            "measurements_visibility, prs_visibility, favorite_foods_visibility, "
            "gym_schedule_visibility, streak_visibility, routine_preview_visibility"
        )
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    profile = _first_row(result)

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el perfil.",
        )

    return profile


def _get_friendship_status(viewer_id: str, target_id: str) -> str:
    supabase = get_supabase_client()
    result = (
        supabase.table("friendships")
        .select("id, requester_id, addressee_id, status")
        .or_(
            f"and(requester_id.eq.{viewer_id},addressee_id.eq.{target_id}),"
            f"and(requester_id.eq.{target_id},addressee_id.eq.{viewer_id})"
        )
        .limit(1)
        .execute()
    )
    friendship = _first_row(result)

    if not friendship or friendship["status"] == "declined":
        return "none"

    if friendship["status"] == "accepted":
        return "friends"

    return "pending_sent" if friendship["requester_id"] == viewer_id else "pending_received"


def _is_visible(visibility: str, friendship_status: str | None, is_self: bool) -> bool:
    if is_self:
        return True
    if visibility == "public":
        return True
    if visibility == "friends":
        return friendship_status == "friends"
    return False


def _get_current_routine(user_id: str) -> dict[str, Any] | None:
    supabase = get_supabase_client()
    result = (
        supabase.table("routines")
        .select("id, name, description, duration_months, start_date, end_date, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    routines = getattr(result, "data", None) or []

    if not routines:
        return None

    today_iso = date.today().isoformat()
    ongoing = [
        routine
        for routine in routines
        if routine.get("start_date")
        and routine.get("end_date")
        and routine["start_date"] <= today_iso <= routine["end_date"]
    ]

    return ongoing[0] if ongoing else routines[0]


def _build_routine_preview(user_id: str, routine: dict[str, Any]) -> dict[str, Any]:
    schedule = _build_schedule(user_id, routine["id"])
    muscle_groups = sorted(
        {
            group
            for day in schedule.get("days", [])
            for group in (day.get("muscle_groups") or [])
        }
    )

    return {
        "routine_id": routine["id"],
        "name": routine.get("name"),
        "description": routine.get("description"),
        "duration_months": routine.get("duration_months"),
        "start_date": routine.get("start_date"),
        "end_date": routine.get("end_date"),
        "day_count": schedule.get("day_count", 0),
        "exercise_count": schedule.get("exercise_count", 0),
        "muscle_groups": muscle_groups,
    }


def _compute_streak(user_id: str, routine: dict[str, Any]) -> dict[str, Any]:
    schedule = _build_schedule(user_id, routine["id"])
    calendar = _build_routine_calendar_from_schedule(schedule, user_id, routine["id"])

    today_iso = date.today().isoformat()
    past_items = [item for item in calendar["items"] if item["date"] <= today_iso]
    past_items.sort(key=lambda item: item["date"], reverse=True)

    if past_items and past_items[0]["date"] == today_iso and past_items[0]["status"] == "pending":
        past_items = past_items[1:]

    current_streak = 0
    for item in past_items:
        if item["status"] == "done":
            current_streak += 1
        else:
            break

    return {"current_streak": current_streak, "routine_name": routine.get("name")}


@router.get("/profile/{user_id}")
async def get_profile(user_id: str, viewer_id: str = Depends(get_current_user_id)):
    profile = _get_profile_or_404(user_id)
    is_self = viewer_id == user_id
    friendship_status = None if is_self else _get_friendship_status(viewer_id, user_id)

    current_routine = _get_current_routine(user_id)
    supabase = get_supabase_client()

    sections: dict[str, dict[str, Any]] = {}
    for key, visibility_field in VISIBILITY_FIELDS.items():
        visibility = profile.get(visibility_field) or "private"
        sections[key] = {
            "visibility": visibility,
            "visible": _is_visible(visibility, friendship_status, is_self),
            "data": None,
        }

    if sections["measurements"]["visible"]:
        result = (
            supabase.table("body_measurements")
            .select("*")
            .eq("user_id", user_id)
            .order("measurement_date", desc=True)
            .limit(1)
            .execute()
        )
        sections["measurements"]["data"] = _first_row(result)

    if sections["personal_records"]["visible"]:
        result = (
            supabase.table("personal_records")
            .select("*")
            .eq("user_id", user_id)
            .order("achieved_date", desc=True)
            .execute()
        )
        sections["personal_records"]["data"] = getattr(result, "data", None) or []

    if sections["favorite_foods"]["visible"]:
        result = supabase.table("favorite_foods").select("*").eq("user_id", user_id).execute()
        sections["favorite_foods"]["data"] = getattr(result, "data", None) or []

    if sections["gym_schedule"]["visible"]:
        result = (
            supabase.table("gym_schedule")
            .select("*")
            .eq("user_id", user_id)
            .order("day_of_week")
            .execute()
        )
        sections["gym_schedule"]["data"] = getattr(result, "data", None) or []

    if sections["streak"]["visible"] and current_routine:
        sections["streak"]["data"] = _compute_streak(user_id, current_routine)

    if sections["routine_preview"]["visible"] and current_routine:
        sections["routine_preview"]["data"] = _build_routine_preview(user_id, current_routine)

    return {
        "user_id": user_id,
        "is_self": is_self,
        "friendship_status": "self" if is_self else friendship_status,
        "identity": {
            "full_name": profile.get("full_name"),
            "avatar_url": profile.get("avatar_url"),
            "bio": profile.get("bio"),
            "goal": profile.get("goal"),
            "experience_level": profile.get("experience_level"),
            "username": profile.get("username"),
            "public_id": profile.get("public_id"),
        },
        "sections": sections,
    }

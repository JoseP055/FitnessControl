import { useState } from "react";
import { Plus, Trash2, UtensilsCrossed } from "lucide-react";

import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import SectionLocked from "./SectionLocked";
import VisibilitySelector from "./VisibilitySelector";
import { deleteFavoriteFood, updateVisibility, upsertFavoriteFood } from "../../services/socialClient";

const MEAL_TYPES = [
  { value: "desayuno", label: "Desayuno" },
  { value: "almuerzo", label: "Almuerzo" },
  { value: "cena", label: "Cena" },
  { value: "snack", label: "Snack" },
];

function emptyForm() {
  return { name: "", meal_type: "", notes: "" };
}

function FavoriteFoodsSection({ userId, isSelf, section, onRefresh }) {
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  if (!isSelf && !section.visible) {
    return <SectionLocked label="Las comidas favoritas de este usuario no son visibles para vos." />;
  }

  const foods = section.data || [];

  async function handleAdd() {
    setError("");

    if (!form.name.trim()) {
      setError("Escribi el nombre de la comida.");
      return;
    }

    setSaving(true);

    try {
      await upsertFavoriteFood(userId, {
        name: form.name.trim(),
        meal_type: form.meal_type || null,
        notes: form.notes.trim() || null,
      });
      setForm(emptyForm());
      await onRefresh();
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar la comida.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setBusyId(id);
    setError("");

    try {
      await deleteFavoriteFood(id);
      await onRefresh();
    } catch (deleteError) {
      setError(deleteError.message || "No se pudo eliminar la comida.");
    } finally {
      setBusyId("");
    }
  }

  async function handleVisibilityChange(value) {
    try {
      await updateVisibility(userId, "favorite_foods_visibility", value);
      await onRefresh();
    } catch (visibilityError) {
      setError(visibilityError.message || "No se pudo actualizar la visibilidad.");
    }
  }

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "1rem" }}>
        <span className="fc-text-eyebrow">
          <UtensilsCrossed size={14} />
          Comidas favoritas
        </span>

        {foods.length ? (
          <div className="fc-routine-list">
            {foods.map((food) => (
              <div key={food.id} className="fc-friend-card">
                <div className="fc-friend-card__meta">
                  <strong>{food.name}</strong>
                  {food.meal_type ? (
                    <span className="fc-pill">
                      {MEAL_TYPES.find((type) => type.value === food.meal_type)?.label}
                    </span>
                  ) : null}
                </div>
                {isSelf ? (
                  <div className="fc-friend-card__actions">
                    <Button variant="ghost" loading={busyId === food.id} onClick={() => handleDelete(food.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="fc-card-text">Todavia no hay comidas favoritas cargadas.</p>
        )}

        {isSelf ? (
          <>
            <div className="fc-add-panel">
              <p className="fc-add-panel__title">
                <Plus size={15} />
                Agregar comida favorita
              </p>

              <Input
                id="food-name"
                label="Comida"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />

              <div className="fc-option-grid fc-option-grid--compact">
                {MEAL_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={`fc-option-card ${form.meal_type === type.value ? "is-selected" : ""}`}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        meal_type: current.meal_type === type.value ? "" : type.value,
                      }))
                    }
                  >
                    <span className="fc-option-card__label">{type.label}</span>
                  </button>
                ))}
              </div>

              {error ? <p className="fc-form-message">{error}</p> : null}
              <Button loading={saving} onClick={handleAdd}>
                Agregar comida
              </Button>
            </div>
            <VisibilitySelector value={section.visibility} onChange={handleVisibilityChange} />
          </>
        ) : null}
      </div>
    </Card>
  );
}

export default FavoriteFoodsSection;

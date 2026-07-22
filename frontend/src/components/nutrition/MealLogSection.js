import { useEffect, useState } from "react";
import { Trash2, UtensilsCrossed } from "lucide-react";

import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import { addMeal, deleteMeal, listMealsToday } from "../../services/nutritionClient";

const MEAL_TYPES = [
  { value: "desayuno", label: "Desayuno" },
  { value: "almuerzo", label: "Almuerzo" },
  { value: "cena", label: "Cena" },
  { value: "snack", label: "Snack" },
];

function emptyForm() {
  return { meal_type: "desayuno", description: "", calories: "", protein_g: "", carbs_g: "", fat_g: "" };
}

function MealLogSection({ userId }) {
  const [meals, setMeals] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const data = await listMealsToday(userId);
      setMeals(data);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar las comidas de hoy.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [userId]);

  const totalCalories = meals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);

  async function handleAdd() {
    setError("");

    if (!form.description.trim()) {
      setError("Escribi que comiste.");
      return;
    }

    setSaving(true);

    try {
      await addMeal(userId, {
        meal_type: form.meal_type,
        description: form.description.trim(),
        calories: form.calories ? Number.parseFloat(form.calories) : null,
        protein_g: form.protein_g ? Number.parseFloat(form.protein_g) : null,
        carbs_g: form.carbs_g ? Number.parseFloat(form.carbs_g) : null,
        fat_g: form.fat_g ? Number.parseFloat(form.fat_g) : null,
      });
      setForm(emptyForm());
      await refresh();
    } catch (saveError) {
      setError(saveError.message || "No se pudo registrar la comida.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setBusyId(id);
    setError("");

    try {
      await deleteMeal(id);
      await refresh();
    } catch (deleteError) {
      setError(deleteError.message || "No se pudo eliminar la comida.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <span className="fc-text-eyebrow">
            <UtensilsCrossed size={14} />
            Comidas de hoy
          </span>
          {totalCalories ? <span className="fc-pill">{totalCalories} kcal hoy</span> : null}
        </div>

        {loading ? (
          <p className="fc-card-text">Cargando...</p>
        ) : meals.length ? (
          <div className="fc-routine-list">
            {meals.map((meal) => (
              <div key={meal.id} className="fc-friend-card">
                <div className="fc-friend-card__meta">
                  <div>
                    <div>{meal.description}</div>
                    <small className="fc-text-eyebrow">
                      {MEAL_TYPES.find((type) => type.value === meal.meal_type)?.label}
                      {meal.calories ? ` · ${meal.calories} kcal` : ""}
                    </small>
                  </div>
                </div>
                <div className="fc-friend-card__actions">
                  <Button variant="ghost" loading={busyId === meal.id} onClick={() => handleDelete(meal.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="fc-card-text">Todavia no registraste comidas hoy.</p>
        )}

        <div className="fc-option-grid fc-option-grid--compact">
          {MEAL_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              className={`fc-option-card ${form.meal_type === type.value ? "is-selected" : ""}`}
              onClick={() => setForm((current) => ({ ...current, meal_type: type.value }))}
            >
              <span className="fc-option-card__label">{type.label}</span>
            </button>
          ))}
        </div>

        <Input
          id="meal-description"
          label="Que comiste"
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
        />

        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
          <Input
            id="meal-calories"
            label="Calorias (opcional)"
            type="number"
            inputMode="decimal"
            value={form.calories}
            onChange={(event) => setForm((current) => ({ ...current, calories: event.target.value }))}
          />
          <Input
            id="meal-protein"
            label="Proteina g (opcional)"
            type="number"
            inputMode="decimal"
            value={form.protein_g}
            onChange={(event) => setForm((current) => ({ ...current, protein_g: event.target.value }))}
          />
          <Input
            id="meal-carbs"
            label="Carbos g (opcional)"
            type="number"
            inputMode="decimal"
            value={form.carbs_g}
            onChange={(event) => setForm((current) => ({ ...current, carbs_g: event.target.value }))}
          />
          <Input
            id="meal-fat"
            label="Grasas g (opcional)"
            type="number"
            inputMode="decimal"
            value={form.fat_g}
            onChange={(event) => setForm((current) => ({ ...current, fat_g: event.target.value }))}
          />
        </div>

        {error ? <p className="fc-form-message">{error}</p> : null}
        <Button loading={saving} onClick={handleAdd}>
          Agregar comida
        </Button>
      </div>
    </Card>
  );
}

export default MealLogSection;

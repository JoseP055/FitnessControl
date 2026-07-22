import { Flame } from "lucide-react";

import Card from "../ui/Card";

const ACTIVITY_FACTOR = 1.375;

const GOAL_ADJUSTMENT = {
  perder_peso: -500,
  ganar_musculo: 300,
  mantenerse: 0,
  resistencia: 150,
};

const GOAL_LABEL = {
  perder_peso: "perder peso",
  ganar_musculo: "ganar musculo",
  mantenerse: "mantenerte",
  resistencia: "mejorar tu resistencia",
};

function estimateCalories({ weight_kg, height_cm, age, gender, goal }) {
  if (!weight_kg || !height_cm || !age) {
    return null;
  }

  const genderOffset = gender === "masculino" ? 5 : gender === "femenino" ? -161 : -78;
  const bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + genderOffset;
  const maintenance = bmr * ACTIVITY_FACTOR;
  const adjustment = GOAL_ADJUSTMENT[goal] ?? 0;

  return Math.round(maintenance + adjustment);
}

function CalorieEstimateSection({ profile }) {
  const calories = estimateCalories(profile || {});

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <span className="fc-text-eyebrow">
          <Flame size={14} />
          Estimado diario
        </span>

        {calories ? (
          <>
            <div className="fc-metric">
              <span className="fc-metric__value">{calories} kcal</span>
              <span className="fc-metric__label">
                Estimado para {GOAL_LABEL[profile.goal] || "tu objetivo"}
              </span>
            </div>
            <p className="fc-card-text">
              Calculo aproximado (Mifflin-St Jeor, actividad moderada) en base a tu peso, altura, edad y
              objetivo. Es un punto de partida, no un plan nutricional profesional.
            </p>
          </>
        ) : (
          <p className="fc-card-text">
            Completa tu peso, altura y edad en la configuracion de perfil para ver un estimado de calorias.
          </p>
        )}
      </div>
    </Card>
  );
}

export default CalorieEstimateSection;

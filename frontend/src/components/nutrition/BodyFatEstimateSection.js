import { PieChart } from "lucide-react";

import Card from "../ui/Card";

function estimateBodyFatPercent({ weight_kg, height_cm, age, gender }) {
  if (!weight_kg || !height_cm || !age) {
    return null;
  }

  const heightM = height_cm / 100;
  const bmi = weight_kg / (heightM * heightM);
  const genderValue = gender === "masculino" ? 1 : gender === "femenino" ? 0 : 0.5;
  const percent = 1.2 * bmi + 0.23 * age - 10.8 * genderValue - 5.4;

  return Math.max(0, Math.round(percent * 10) / 10);
}

function BodyFatEstimateSection({ profile }) {
  const percent = estimateBodyFatPercent(profile || {});

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <span className="fc-text-eyebrow">
          <PieChart size={14} />
          Grasa corporal (estimado)
        </span>

        {percent !== null ? (
          <>
            <div className="fc-metric">
              <span className="fc-metric__value">{percent}%</span>
              <span className="fc-metric__label">Formula de Deurenberg (peso, altura, edad, sexo)</span>
            </div>
            <p className="fc-card-text">
              Es una aproximacion, no un diagnostico: no distingue masa muscular de grasa, asi que en
              personas muy musculosas puede dar mas alto de lo real. Metodos con cinta metrica (cuello,
              cintura, cadera) o mediciones profesionales (pliegues, bioimpedancia, DEXA) son mas precisos.
            </p>
          </>
        ) : (
          <p className="fc-card-text">
            Completa tu peso, altura, edad y genero en la configuracion de perfil para ver un estimado.
          </p>
        )}
      </div>
    </Card>
  );
}

export default BodyFatEstimateSection;

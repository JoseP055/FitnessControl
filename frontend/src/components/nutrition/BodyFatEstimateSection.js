import { PieChart } from "lucide-react";

import Card from "../ui/Card";
import { estimateBodyFatPercent } from "../../utils/bodyComposition";

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

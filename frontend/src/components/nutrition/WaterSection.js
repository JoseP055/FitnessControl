import { useEffect, useState } from "react";
import { Droplet, Minus, Plus } from "lucide-react";

import Button from "../ui/Button";
import Card from "../ui/Card";
import {
  DEFAULT_WATER_GOAL_ML,
  addWater,
  estimateWaterGoalMl,
  getWaterToday,
} from "../../services/nutritionClient";

const QUICK_ADDS = [250, 500, 1000];

function WaterSection({ userId, weightKg }) {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    getWaterToday(userId)
      .then((value) => {
        if (isMounted) {
          setAmount(value);
        }
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(loadError.message || "No se pudo cargar el agua de hoy.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  async function handleAdd(deltaMl) {
    setError("");
    setBusy(true);

    try {
      const nextAmount = await addWater(userId, deltaMl);
      setAmount(nextAmount);
    } catch (addError) {
      setError(addError.message || "No se pudo registrar el agua.");
    } finally {
      setBusy(false);
    }
  }

  const estimatedGoalMl = estimateWaterGoalMl(weightKg);
  const goalMl = estimatedGoalMl || DEFAULT_WATER_GOAL_ML;
  const progressPercent = Math.min(100, Math.round((amount / goalMl) * 100));

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "0.9rem" }}>
        <span className="fc-text-eyebrow">
          <Droplet size={14} />
          Agua de hoy
        </span>

        {loading ? (
          <p className="fc-card-text">Cargando...</p>
        ) : (
          <>
            <div className="fc-metric">
              <span className="fc-metric__value">{(amount / 1000).toFixed(2)} L</span>
              <span className="fc-metric__label">Meta: {(goalMl / 1000).toFixed(1)} L</span>
            </div>
            <div className="fc-progress">
              <div className="fc-progress__bar" style={{ width: `${progressPercent}%` }} />
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {QUICK_ADDS.map((ml) => (
                <Button key={ml} variant="secondary" loading={busy} onClick={() => handleAdd(ml)}>
                  <Plus size={14} />
                  {ml} ml
                </Button>
              ))}
              <Button variant="ghost" loading={busy} onClick={() => handleAdd(-250)} disabled={amount <= 0}>
                <Minus size={14} />
                250 ml
              </Button>
            </div>

            <p className="fc-card-text">
              {estimatedGoalMl
                ? "Estimado (peso x 0.033 L/kg). Sumale 350-500 ml extra por cada 30 min de ejercicio intenso, y otro 10-15% con calor o mucha humedad."
                : "Meta por defecto: completa tu peso en el perfil para un objetivo calculado segun tu peso."}
            </p>

            {error ? <p className="fc-form-message">{error}</p> : null}
          </>
        )}
      </div>
    </Card>
  );
}

export default WaterSection;

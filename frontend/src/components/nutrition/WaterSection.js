import { useEffect, useState } from "react";
import { Droplet, Minus, Plus } from "lucide-react";

import Button from "../ui/Button";
import Card from "../ui/Card";
import { addWater, getWaterToday } from "../../services/nutritionClient";

const DAILY_GOAL_ML = 2000;
const QUICK_ADDS = [250, 500, 1000];

function WaterSection({ userId }) {
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

  const progressPercent = Math.min(100, Math.round((amount / DAILY_GOAL_ML) * 100));

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
              <span className="fc-metric__label">Meta: {(DAILY_GOAL_ML / 1000).toFixed(1)} L</span>
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

            {error ? <p className="fc-form-message">{error}</p> : null}
          </>
        )}
      </div>
    </Card>
  );
}

export default WaterSection;

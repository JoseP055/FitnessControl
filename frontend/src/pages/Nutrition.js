import { useEffect, useState } from "react";

import AppShell from "../components/layout/AppShell";
import BodyFatEstimateSection from "../components/nutrition/BodyFatEstimateSection";
import CalorieEstimateSection from "../components/nutrition/CalorieEstimateSection";
import MealLogSection from "../components/nutrition/MealLogSection";
import WaterSection from "../components/nutrition/WaterSection";
import PageLoader from "../components/ui/PageLoader";
import { useAuth } from "../context/AuthContext";
import { supabaseClient } from "../services/supabaseClient";

function Nutrition() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!supabaseClient || !user?.id) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const { data } = await supabaseClient
          .from("profiles")
          .select("weight_kg, height_cm, age, gender, goal")
          .eq("user_id", user.id)
          .maybeSingle();

        if (isMounted) {
          setProfile(data || {});
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (loading) {
    return <PageLoader label="Cargando nutricion..." />;
  }

  return (
    <AppShell
      activeSection="nutricion"
      header={
        <div>
          <h1 className="fc-dashboard__title">Nutricion</h1>
          <p className="fc-dashboard__subtitle">
            Segui tu agua, tus comidas del dia y un estimado calorico en base a tu perfil.
          </p>
        </div>
      }
    >
      <div className="fc-dashboard-stack">
        <div className="fc-dashboard-grid">
          <CalorieEstimateSection profile={profile} />
          <BodyFatEstimateSection profile={profile} />
          <WaterSection userId={user.id} weightKg={profile?.weight_kg} />
        </div>

        <MealLogSection userId={user.id} />
      </div>
    </AppShell>
  );
}

export default Nutrition;

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import PageLoader from "../components/ui/PageLoader";
import FavoriteFoodsSection from "../components/profile/FavoriteFoodsSection";
import GymScheduleSection from "../components/profile/GymScheduleSection";
import MeasurementsSection from "../components/profile/MeasurementsSection";
import PersonalRecordsSection from "../components/profile/PersonalRecordsSection";
import ProfileHeader from "../components/profile/ProfileHeader";
import RoutinePreviewSection from "../components/profile/RoutinePreviewSection";
import StreakSection from "../components/profile/StreakSection";
import ThemeSection from "../components/profile/ThemeSection";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../services/api";
import { getFriendshipWith } from "../services/socialClient";

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId: routeUserId } = useParams();

  const targetUserId = routeUserId || user.id;
  const isSelf = targetUserId === user.id;

  const [profileData, setProfileData] = useState(null);
  const [friendshipId, setFriendshipId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");

    try {
      const data = await getProfile(targetUserId);
      setProfileData(data);

      if (!isSelf) {
        const friendship = await getFriendshipWith(user.id, targetUserId);
        setFriendshipId(friendship?.id || null);
      }
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar el perfil.");
    } finally {
      setLoading(false);
    }
  }, [targetUserId, isSelf, user.id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  if (loading) {
    return <PageLoader label="Cargando perfil..." />;
  }

  if (error && !profileData) {
    return (
      <AppShell activeSection="perfil" header={<h1 className="fc-dashboard__title">Perfil</h1>}>
        <p className="fc-form-message">{error}</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeSection="perfil"
      header={
        <div className="fc-shell-header">
          <div>
            {!isSelf ? (
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft size={16} />
                Volver
              </Button>
            ) : null}
            <h1 className="fc-dashboard__title">{isSelf ? "Tu perfil" : profileData.identity.full_name}</h1>
            <p className="fc-dashboard__subtitle">
              {isSelf
                ? "Personaliza tu perfil y decidi que compartir con tus amigos."
                : "Perfil de otro usuario de FitnessControl."}
            </p>
          </div>
        </div>
      }
    >
      <div className="fc-dashboard-stack">
        <ProfileHeader
          userId={targetUserId}
          viewerId={user.id}
          identity={profileData.identity}
          isSelf={isSelf}
          friendshipStatus={profileData.friendship_status}
          friendshipId={friendshipId}
          friendsCount={profileData.friends_count}
          onRefresh={load}
        />

        {error ? <p className="fc-form-message">{error}</p> : null}

        <div className="fc-dashboard-grid">
          <StreakSection
            userId={targetUserId}
            isSelf={isSelf}
            section={profileData.sections.streak}
            onRefresh={load}
          />
          <RoutinePreviewSection
            userId={targetUserId}
            isSelf={isSelf}
            section={profileData.sections.routine_preview}
            onRefresh={load}
          />
        </div>

        <MeasurementsSection
          userId={targetUserId}
          isSelf={isSelf}
          section={profileData.sections.measurements}
          weightGoalKg={profileData.identity.weight_goal_kg}
          onRefresh={load}
        />

        <PersonalRecordsSection
          userId={targetUserId}
          isSelf={isSelf}
          section={profileData.sections.personal_records}
          onRefresh={load}
        />

        <FavoriteFoodsSection
          userId={targetUserId}
          isSelf={isSelf}
          section={profileData.sections.favorite_foods}
          onRefresh={load}
        />

        <GymScheduleSection
          userId={targetUserId}
          isSelf={isSelf}
          section={profileData.sections.gym_schedule}
          onRefresh={load}
        />

        {isSelf ? <ThemeSection /> : null}
      </div>
    </AppShell>
  );
}

export default Profile;

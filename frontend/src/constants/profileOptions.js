import { Dumbbell, Flame, Target, Timer, User, Users, Zap } from "lucide-react";

export const GOAL_OPTIONS = [
  { value: "perder_peso", label: "Perder peso", icon: Flame },
  { value: "ganar_musculo", label: "Ganar musculo", icon: Dumbbell },
  { value: "mantenerse", label: "Mantenerse", icon: Target },
  { value: "resistencia", label: "Resistencia", icon: Timer },
];

export const EXPERIENCE_OPTIONS = [
  { value: "principiante", label: "Principiante", icon: Zap },
  { value: "intermedio", label: "Intermedio", icon: Target },
  { value: "avanzado", label: "Avanzado", icon: Dumbbell },
];

export const GENDER_OPTIONS = [
  { value: "masculino", label: "Masculino", icon: User },
  { value: "femenino", label: "Femenino", icon: Users },
  { value: "otro", label: "Otro", icon: Target },
];

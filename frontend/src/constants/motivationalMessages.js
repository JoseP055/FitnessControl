export const MOTIVATIONAL_MESSAGES = [
  "Dia completado. Vamos con la misma energia la proxima sesion.",
  "Otro entrenamiento en el bolsillo. La constancia es la que construye resultados.",
  "Cumpliste con el plan de hoy. Asi se construye el habito, un dia a la vez.",
  "Sesion cerrada. Tu yo del futuro te va a agradecer este dia de esfuerzo.",
  "Entrenamiento completo. Descansa bien, la proxima seguimos sumando.",
  "Bien ahi. Un dia mas cerca de tu objetivo.",
  "Terminaste todo lo planeado. Cada sesion que completas suma mas de lo que parece.",
];

export function getRandomMotivationalMessage() {
  return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
}

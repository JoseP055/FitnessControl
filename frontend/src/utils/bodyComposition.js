// Formula de Deurenberg: aproximacion de % de grasa corporal a partir de
// peso, altura, edad y sexo. Es un estimado, no un diagnostico.
export function estimateBodyFatPercent({ weight_kg, height_cm, age, gender }) {
  if (!weight_kg || !height_cm || !age) {
    return null;
  }

  const heightM = height_cm / 100;
  const bmi = weight_kg / (heightM * heightM);
  const genderValue = gender === "masculino" ? 1 : 0;
  const percent = 1.2 * bmi + 0.23 * age - 10.8 * genderValue - 5.4;

  return Math.max(0, Math.round(percent * 10) / 10);
}

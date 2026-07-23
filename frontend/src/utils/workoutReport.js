import { jsPDF } from "jspdf";

function formatDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function exerciseLine(exercise) {
  const detail = exercise.duration_minutes
    ? `${exercise.duration_minutes} min`
    : `${exercise.sets_planned || "-"} series x ${exercise.reps_planned || "-"} reps`;
  const rest = exercise.rest_seconds ? ` - Descanso ${exercise.rest_seconds}s` : "";
  const status = exercise.completed ? "[Completado]" : "[Pendiente]";
  return `${exercise.name} - ${detail}${rest} ${status}`;
}

// Genera y descarga un PDF simple con el resumen de la sesion de entrenamiento
// de hoy: rutina, grupos musculares y el detalle de cada ejercicio.
export function downloadWorkoutReportPdf(training) {
  const doc = new jsPDF();
  const marginX = 16;
  let y = 20;

  doc.setFontSize(16);
  doc.text("FitnessControl - Reporte de entrenamiento", marginX, y);

  y += 10;
  doc.setFontSize(11);
  doc.text(`Fecha: ${formatDate(training.date)}`, marginX, y);

  y += 7;
  doc.text(`Rutina: ${training.routine_name || "-"}`, marginX, y);

  if (training.muscle_groups?.length) {
    y += 7;
    doc.text(`Grupos musculares: ${training.muscle_groups.join(", ")}`, marginX, y);
  }

  y += 10;
  doc.setFontSize(12);
  doc.text("Ejercicios:", marginX, y);
  doc.setFontSize(10);

  training.exercises.forEach((exercise, index) => {
    y += 8;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    const lines = doc.splitTextToSize(`${index + 1}. ${exerciseLine(exercise)}`, 180);
    doc.text(lines, marginX, y);
    y += (lines.length - 1) * 5;
  });

  y += 12;
  if (y > 280) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(9);
  doc.text("Generado con FitnessControl.", marginX, y);

  doc.save(`entrenamiento-${training.date}.pdf`);
}

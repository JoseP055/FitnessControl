import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/layout/AppShell";
import RoutineCalendar, { buildCalendarPreview } from "../components/routines/RoutineCalendar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import PageLoader from "../components/ui/PageLoader";
import {
  addRoutineDayExercise,
  createRoutine,
  createRoutineDay,
  getExercises,
} from "../services/api";
import { getLocalDateIso } from "../utils/date";

const stepTransition = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } },
};

const durationOptions = [
  { value: 1, label: "1 mes", description: "Bloque corto para arrancar rapido." },
  { value: 2, label: "2 meses", description: "Tiempo ideal para agarrar ritmo." },
  { value: 3, label: "3 meses", description: "Progresion mas estable y sostenida." },
  { value: 6, label: "6 meses", description: "Plan largo para construir constancia." },
];

const weekdayOptions = [
  { value: 0, short: "Lun", label: "Lunes" },
  { value: 1, short: "Mar", label: "Martes" },
  { value: 2, short: "Mie", label: "Miercoles" },
  { value: 3, short: "Jue", label: "Jueves" },
  { value: 4, short: "Vie", label: "Viernes" },
  { value: 5, short: "Sab", label: "Sabado" },
  { value: 6, short: "Dom", label: "Domingo" },
];

const muscleTaxonomy = [
  { parent: "Pecho", subgroups: ["Alto", "Medio", "Bajo"] },
  { parent: "Espalda", subgroups: ["Dorsales", "Trapecio", "Lumbar"] },
  { parent: "Hombros", subgroups: ["Anterior", "Lateral", "Posterior"] },
  { parent: "Brazos", subgroups: ["Biceps", "Triceps", "Antebrazos"] },
  { parent: "Piernas", subgroups: ["Cuadriceps", "Femoral", "Gemelos"] },
  { parent: "Core", subgroups: ["Recto abdominal", "Oblicuos", "Estabilizadores profundos"] },
  { parent: "Gluteos", subgroups: ["Gluteo mayor", "Gluteo medio", "Gluteo menor"] },
  { parent: "Cardio", subgroups: ["Cardio"] },
];

const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const CATALOG_PAGE_SIZE = 8;

function createDraftDay(dayOfWeek) {
  return {
    id: `draft-${dayOfWeek}`,
    day_of_week: dayOfWeek,
    muscle_subgroups: [],
    exercises: [],
    is_configured: false,
  };
}

function capitalize(value) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Sin definir";
  }

  const date = new Date(`${dateValue}T00:00:00`);
  return `${String(date.getDate()).padStart(2, "0")} ${monthLabels[date.getMonth()]} ${date.getFullYear()}`;
}

function isDurationBasedExercise(exercise) {
  if (!exercise) {
    return false;
  }

  const name = (exercise.name || "").toLowerCase();
  return (
    exercise.muscle_group_parent === "Cardio" ||
    name.includes("plancha") ||
    name.includes("plank") ||
    name.includes("cinta") ||
    name.includes("escaladora") ||
    name.includes("eliptica") ||
    name.includes("bicicleta estatica")
  );
}

function getExerciseDefaults(exercise) {
  if (isDurationBasedExercise(exercise)) {
    const isCardio = exercise?.muscle_group_parent === "Cardio";
    return {
      planning_mode: "duration",
      sets_planned: isCardio ? 1 : 3,
      reps_planned: "",
      duration_minutes: isCardio ? 20 : 1,
      rest_seconds: isCardio ? 0 : 45,
    };
  }

  return {
    planning_mode: "reps",
    sets_planned: 4,
    reps_planned: 10,
    duration_minutes: "",
    rest_seconds: 90,
  };
}

function RoutineForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [dayCursor, setDayCursor] = useState(0);
  const [dayStage, setDayStage] = useState("groups");
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [catalogPage, setCatalogPage] = useState(1);
  const [addingExerciseId, setAddingExerciseId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    duration_months: 3,
    start_date: getLocalDateIso(),
    selected_days: [],
  });

  useEffect(() => {
    async function loadCatalog() {
      try {
        const response = await getExercises();
        setCatalog(response.items || []);
      } catch (loadError) {
        setError(loadError.message || "No se pudo cargar el catalogo de ejercicios.");
      } finally {
        setCatalogLoading(false);
      }
    }

    loadCatalog();
  }, []);

  const steps = useMemo(
    () => [
      { key: "general", label: "Datos" },
      { key: "weekdays", label: "Dias" },
      { key: "days", label: "Configuracion" },
      { key: "summary", label: "Resumen" },
    ],
    []
  );

  const helperText = useMemo(() => {
    if (!form.name.trim()) {
      return "Pone un nombre facil de reconocer mas adelante.";
    }

    if (form.name.trim().length < 4) {
      return "Podes hacerlo un poco mas descriptivo.";
    }

    return "Se ve bien. Ahora solo falta darle forma a la semana.";
  }, [form.name]);

  const selectedDays = useMemo(
    () => [...form.selected_days].sort((left, right) => left.day_of_week - right.day_of_week),
    [form.selected_days]
  );

  const activeDay = selectedDays[dayCursor] || null;
  const activeDayMeta = weekdayOptions.find((day) => day.value === activeDay?.day_of_week) || null;
  const catalogById = useMemo(
    () =>
      catalog.reduce((accumulator, exercise) => {
        accumulator[exercise.id] = exercise;
        return accumulator;
      }, {}),
    [catalog]
  );

  const addedExerciseIds = useMemo(
    () => new Set((activeDay?.exercises || []).map((item) => item.exercise_id).filter(Boolean)),
    [activeDay]
  );

  const filteredCatalog = useMemo(() => {
    if (!activeDay?.muscle_subgroups?.length) {
      return [];
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    return catalog.filter((exercise) => {
      if (addedExerciseIds.has(exercise.id)) {
        return false;
      }

      const matchesSubgroup = activeDay.muscle_subgroups.includes(exercise.muscle_subgroup || "");
      if (!matchesSubgroup) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        exercise.name,
        exercise.muscle_group_parent,
        exercise.muscle_subgroup,
        exercise.equipment,
        exercise.description,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [activeDay, catalog, searchTerm, addedExerciseIds]);

  const totalCatalogPages = Math.max(1, Math.ceil(filteredCatalog.length / CATALOG_PAGE_SIZE));

  const paginatedCatalog = useMemo(() => {
    const startIndex = (catalogPage - 1) * CATALOG_PAGE_SIZE;
    return filteredCatalog.slice(startIndex, startIndex + CATALOG_PAGE_SIZE);
  }, [catalogPage, filteredCatalog]);

  const groupedPaginatedCatalog = useMemo(
    () =>
      paginatedCatalog.reduce((accumulator, exercise) => {
        const parent = exercise.muscle_group_parent || "Otros";
        if (!accumulator[parent]) {
          accumulator[parent] = [];
        }
        accumulator[parent].push(exercise);
        return accumulator;
      }, {}),
    [paginatedCatalog]
  );

  const calendarPreview = useMemo(
    () =>
      buildCalendarPreview({
        startDate: form.start_date,
        durationMonths: form.duration_months,
        selectedDays,
      }),
    [form.duration_months, form.start_date, selectedDays]
  );

  const selectedSubgroupsByParent = useMemo(() => {
    if (!activeDay?.muscle_subgroups?.length) {
      return {};
    }

    return muscleTaxonomy.reduce((accumulator, group) => {
      const selected = group.subgroups.filter((subgroup) =>
        activeDay.muscle_subgroups.includes(subgroup)
      );
      if (selected.length) {
        accumulator[group.parent] = selected;
      }
      return accumulator;
    }, {});
  }, [activeDay]);

  useEffect(() => {
    setSearchTerm("");
    setCatalogPage(1);
  }, [activeDay?.day_of_week]);

  useEffect(() => {
    setCatalogPage(1);
  }, [searchTerm, activeDay?.muscle_subgroups?.join("|")]);

  useEffect(() => {
    setCatalogPage((current) => Math.min(current, totalCatalogPages));
  }, [totalCatalogPages]);

  function updateSelectedDays(nextDays) {
    setForm((current) => ({ ...current, selected_days: nextDays }));
  }

  function updateDay(dayOfWeek, updater) {
    updateSelectedDays(
      selectedDays.map((day) => {
        if (day.day_of_week !== dayOfWeek) {
          return day;
        }
        return updater(day);
      })
    );
  }

  function handleToggleWeekday(dayOfWeek) {
    const exists = selectedDays.some((day) => day.day_of_week === dayOfWeek);

    if (exists) {
      const nextDays = selectedDays.filter((day) => day.day_of_week !== dayOfWeek);
      updateSelectedDays(nextDays);
      setDayCursor((current) => Math.max(0, Math.min(current, nextDays.length - 1)));
      return;
    }

    updateSelectedDays([...selectedDays, createDraftDay(dayOfWeek)]);
  }

  function handleToggleMuscleSubgroup(subgroup) {
    if (!activeDay) {
      return;
    }

    updateDay(activeDay.day_of_week, (day) => {
      const exists = day.muscle_subgroups.includes(subgroup);
      return {
        ...day,
        is_configured: false,
        muscle_subgroups: exists
          ? day.muscle_subgroups.filter((value) => value !== subgroup)
          : [...day.muscle_subgroups, subgroup],
      };
    });
  }

  function createExerciseRow(exercise, index) {
    const defaults = getExerciseDefaults(exercise);
    return {
      id: `draft-ex-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      exercise_id: exercise?.id || "",
      exercise: exercise || null,
      planning_mode: defaults.planning_mode,
      sets_planned: defaults.sets_planned,
      reps_planned: defaults.reps_planned,
      duration_minutes: defaults.duration_minutes,
      rest_seconds: defaults.rest_seconds,
      notes: "",
      exercise_order: index + 1,
    };
  }

  function addExerciseRow(preselectedExercise = null) {
    if (!activeDay) {
      return;
    }

    const firstAvailableExercise = preselectedExercise || filteredCatalog[0] || catalog[0];
    if (!firstAvailableExercise) {
      setError("No hay ejercicios disponibles para agregar.");
      return;
    }

    const alreadyAdded = activeDay.exercises.some(
      (item) => item.exercise_id === firstAvailableExercise.id
    );
    if (alreadyAdded) {
      setError(`${firstAvailableExercise.name} ya esta agregado a este dia.`);
      return;
    }

    updateDay(activeDay.day_of_week, (day) => ({
      ...day,
      is_configured: false,
      exercises: [...day.exercises, createExerciseRow(firstAvailableExercise, day.exercises.length)],
    }));
    setError("");
  }

  // Marca el ejercicio como "agregado" un instante (flash verde) antes de
  // sacarlo de la lista de sugerencias, para que el cambio se note en vez de
  // desaparecer de golpe.
  function handleSelectSuggestion(exercise) {
    if (addingExerciseId) {
      return;
    }

    setAddingExerciseId(exercise.id);
    window.setTimeout(() => {
      addExerciseRow(exercise);
      setAddingExerciseId(null);
    }, 320);
  }

  function updateDraftExercise(exerciseRowId, field, value) {
    if (!activeDay) {
      return;
    }

    setError("");

    updateDay(activeDay.day_of_week, (day) => ({
      ...day,
      is_configured: false,
      exercises: day.exercises.map((item) => {
        if (item.id !== exerciseRowId) {
          return item;
        }

        if (field === "planning_mode") {
          const nextMode = value === "duration" ? "duration" : "reps";
          return {
            ...item,
            planning_mode: nextMode,
            reps_planned: nextMode === "duration" ? "" : item.reps_planned || 10,
            duration_minutes:
              nextMode === "duration"
                ? item.duration_minutes || (isDurationBasedExercise(item.exercise) ? 20 : 1)
                : "",
          };
        }

        return {
          ...item,
          [field]: value,
        };
      }),
    }));
  }

  function saveDayConfiguration() {
    if (!activeDay) {
      return;
    }

    if (!activeDay.exercises.length) {
      setError("Agrega al menos un ejercicio para este dia.");
      return;
    }

    try {
      const normalizedRows = activeDay.exercises.map((item, index) => {
        const exerciseId = (item.exercise_id || "").trim();
        const sets = Number(item.sets_planned);
        const reps = item.reps_planned === "" ? null : Number(item.reps_planned);
        const durationMinutes =
          item.duration_minutes === "" ? null : Number(item.duration_minutes);
        const rest = Number(item.rest_seconds);
        const order = Number(item.exercise_order || index + 1);
        const planningMode = item.planning_mode === "duration" ? "duration" : "reps";

        if (!exerciseId) {
          throw new Error("Cada fila debe tener un ejercicio seleccionado.");
        }

        if (![sets, rest, order].every((value) => Number.isFinite(value) && value >= 0)) {
          throw new Error("Series, descanso y posicion deben ser numeros validos.");
        }

        if (sets < 1 || order < 1) {
          throw new Error("Series y posicion deben ser mayores a cero.");
        }

        if (planningMode === "duration") {
          if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
            throw new Error("La duracion debe ser mayor a cero en ejercicios por tiempo.");
          }
        } else if (!Number.isFinite(reps) || reps <= 0) {
          throw new Error("Las repeticiones deben ser mayores a cero en ejercicios por repeticiones.");
        }

        return {
          ...item,
          exercise_id: exerciseId,
          exercise: catalogById[exerciseId] || item.exercise || null,
          planning_mode: planningMode,
          sets_planned: sets,
          reps_planned: planningMode === "duration" ? null : reps,
          duration_minutes: planningMode === "duration" ? durationMinutes : null,
          rest_seconds: rest,
          exercise_order: order,
        };
      });

      normalizedRows.sort((left, right) => left.exercise_order - right.exercise_order);

      updateDay(activeDay.day_of_week, (day) => ({
        ...day,
        is_configured: true,
        exercises: normalizedRows.map((item, index) => ({
          ...item,
          exercise_order: index + 1,
        })),
      }));
      setError("");
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar la configuracion del dia.");
    }
  }

  // Mueve el ejercicio a la posicion elegida en el combo y renumera el resto
  // para que las posiciones sigan siendo unicas y consecutivas (1..N).
  function setExercisePosition(exerciseId, newPosition) {
    if (!activeDay) {
      return;
    }

    const currentIndex = activeDay.exercises.findIndex((item) => item.id === exerciseId);
    const targetIndex = Math.min(Math.max(newPosition - 1, 0), activeDay.exercises.length - 1);

    if (currentIndex < 0 || currentIndex === targetIndex) {
      return;
    }

    updateDay(activeDay.day_of_week, (day) => {
      const nextExercises = [...day.exercises];
      const [currentItem] = nextExercises.splice(currentIndex, 1);
      nextExercises.splice(targetIndex, 0, currentItem);

      return {
        ...day,
        is_configured: false,
        exercises: nextExercises.map((item, index) => ({
          ...item,
          exercise_order: index + 1,
        })),
      };
    });
  }

  function removeDraftExercise(exerciseId) {
    if (!activeDay) {
      return;
    }

    updateDay(activeDay.day_of_week, (day) => ({
      ...day,
      is_configured: false,
      exercises: day.exercises
        .filter((item) => item.id !== exerciseId)
        .map((item, index) => ({ ...item, exercise_order: index + 1 })),
    }));
  }

  function scrollToTop() {
    // En iOS Safari, si habia un input enfocado el teclado se cierra recien
    // despues de este tick y su animacion pisa el scroll inmediato, dejandolo
    // sin efecto visible. Se saca el foco y se espera un instante antes de
    // scrollear para que nuestro scroll sea lo ultimo que se aplique.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, 120);
  }

  function goToPreviousDay() {
    setDayCursor((current) => Math.max(current - 1, 0));
    setDayStage("groups");
    scrollToTop();
  }

  function goToNextDay() {
    setDayCursor((current) => Math.min(current + 1, selectedDays.length - 1));
    setDayStage("groups");
    scrollToTop();
  }

  function continueAfterSavingDay() {
    if (dayCursor < selectedDays.length - 1) {
      goToNextDay();
      return;
    }

    setStep(3);
    scrollToTop();
  }

  function goNext() {
    setError("");

    if (step === 0) {
      if (!form.name.trim()) {
        setError("Pone un nombre para la rutina.");
        return;
      }

      if (!form.start_date) {
        setError("Elegi la fecha de inicio.");
        return;
      }

      setStep(1);
      scrollToTop();
      return;
    }

    if (step === 1) {
      if (!selectedDays.length) {
        setError("Selecciona al menos un dia de entrenamiento.");
        return;
      }

      setDayCursor(0);
      setDayStage("groups");
      setStep(2);
      scrollToTop();
      return;
    }

    if (step === 2) {
      if (dayStage === "groups") {
        if (!activeDay?.muscle_subgroups.length) {
          setError("Selecciona al menos un subgrupo muscular para este dia.");
          return;
        }

        setDayStage("exercises");
        scrollToTop();
        return;
      }

      if (!activeDay?.exercises.length) {
        setError("Agrega al menos un ejercicio antes de continuar.");
        return;
      }

      if (!activeDay?.is_configured) {
        setError("Guarda la configuracion del dia antes de continuar.");
        return;
      }

      if (dayCursor < selectedDays.length - 1) {
        goToNextDay();
        return;
      }

      setStep(3);
      scrollToTop();
    }
  }

  function goBack() {
    setError("");

    if (step === 2 && dayStage === "exercises") {
      setDayStage("groups");
      scrollToTop();
      return;
    }

    if (step === 2 && dayCursor > 0) {
      goToPreviousDay();
      return;
    }

    setStep((current) => Math.max(current - 1, 0));
    scrollToTop();
  }

  async function handleCreateRoutine() {
    setError("");
    setSaving(true);

    try {
      const createdRoutine = await createRoutine({
        name: form.name.trim(),
        description: form.description.trim(),
        duration_months: Number(form.duration_months),
        start_date: form.start_date,
      });

      for (const day of selectedDays) {
        const createdDay = await createRoutineDay(createdRoutine.id, {
          day_of_week: day.day_of_week,
          muscle_subgroups: day.muscle_subgroups,
        });

        for (const exercise of day.exercises) {
          await addRoutineDayExercise(createdRoutine.id, createdDay.id, {
            exercise_id: exercise.exercise_id,
            sets_planned: exercise.sets_planned,
            reps_planned: exercise.reps_planned,
            duration_minutes: exercise.duration_minutes,
            rest_seconds: exercise.rest_seconds,
            exercise_order: exercise.exercise_order,
            notes: exercise.notes,
          });
        }
      }

      navigate(`/routines/${createdRoutine.id}`);
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar la rutina completa.");
    } finally {
      setSaving(false);
    }
  }

  if (catalogLoading && !catalog.length) {
    return <PageLoader label="Preparando wizard de rutinas..." />;
  }

  return (
    <AppShell
      activeSection="rutinas"
      header={
        <div className="fc-shell-header">
          <div>
            <h1 className="fc-dashboard__title">Nueva rutina</h1>
            <p className="fc-dashboard__subtitle">
              Arma tu semana como un onboarding claro: duracion, dias, grupos musculares, ejercicios y calendario.
            </p>
          </div>

          <Button variant="ghost" onClick={() => navigate("/routines")}>
            <ArrowLeft size={16} />
            Volver
          </Button>
        </div>
      }
    >
      <div className="fc-dashboard-stack">
        <div className="fc-routine-wizard-header">
          <div>
            <span className="fc-text-eyebrow">
              <Sparkles size={14} />
              Wizard de creacion
            </span>
            <h2 className="fc-section-title" style={{ marginTop: "0.4rem" }}>
              Paso {step + 1} de {steps.length}
            </h2>
          </div>

          <div className="fc-routine-wizard-header__meta">
            <div className="fc-stepper">
              {steps.map((stepInfo, index) => (
                <div
                  key={stepInfo.key}
                  className={`fc-stepper__dot ${index <= step ? "is-active" : ""}`}
                  aria-label={stepInfo.label}
                />
              ))}
            </div>
            <div className="fc-stepper__label">
              {step === 2 && activeDayMeta
                ? `${activeDayMeta.label} - ${dayStage === "groups" ? "Subgrupos" : "Ejercicios"} - Dia ${dayCursor + 1} de ${selectedDays.length}`
                : steps[step].label}
            </div>
          </div>
        </div>

        <div className="fc-routine-wizard-layout">
          <motion.div key={`${steps[step].key}-${activeDayMeta?.value || "base"}`} {...stepTransition}>
            <Card glass className="fc-routine-wizard-card">
              {step === 0 ? (
                <div className="fc-routine-wizard-panel">
                  <div className="fc-routine-wizard-panel__intro">
                    <h2 className="fc-section-title">Datos generales</h2>
                    <p className="fc-card-text">
                      Defini la base de la rutina: nombre, duracion y desde cuando empieza a correr.
                    </p>
                  </div>

                  <div className="fc-routine-wizard-panel__content">
                    <Input
                      id="routine-name"
                      label="Nombre de la rutina"
                      placeholder="Ej. Upper / Lower, Push Pull Legs o Torso y brazos"
                      value={form.name}
                      helperText={helperText}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, name: event.target.value }))
                      }
                    />

                    <div className="fc-field">
                      <label className="fc-field__label" htmlFor="routine-description">
                        Descripcion opcional
                      </label>
                      <textarea
                        id="routine-description"
                        className="fc-input fc-textarea"
                        rows={5}
                        placeholder="Podes usarla para recordar el enfoque, intensidad o contexto."
                        value={form.description}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, description: event.target.value }))
                        }
                      />
                    </div>

                    <div className="fc-routine-duration-grid">
                      {durationOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`fc-routine-duration-card ${
                            form.duration_months === option.value ? "is-selected" : ""
                          }`}
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              duration_months: option.value,
                            }))
                          }
                        >
                          <strong>{option.label}</strong>
                          <span>{option.description}</span>
                        </button>
                      ))}
                    </div>

                    <div className="fc-grid-3">
                      <Input
                        id="routine-start-date"
                        label="Fecha de inicio"
                        type="date"
                        value={form.start_date}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            start_date: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="fc-routine-wizard-panel">
                  <div className="fc-routine-wizard-panel__intro">
                    <h2 className="fc-section-title">Elegi los dias de la semana</h2>
                    <p className="fc-card-text">
                      Selecciona todos los dias donde queres entrenar. Despues vas a configurar cada uno por separado.
                    </p>
                  </div>

                  <div className="fc-weekday-selector">
                    {weekdayOptions.map((day) => {
                      const selected = selectedDays.some((item) => item.day_of_week === day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          className={`fc-weekday-chip ${selected ? "is-selected" : ""}`}
                          onClick={() => handleToggleWeekday(day.value)}
                        >
                          <span>{day.short}</span>
                          <small>{day.label}</small>
                        </button>
                      );
                    })}
                  </div>

                  <div className="fc-helper-list">
                    {selectedDays.length ? (
                      selectedDays.map((day) => {
                        const meta = weekdayOptions.find((option) => option.value === day.day_of_week);
                        return <span key={day.day_of_week} className="fc-pill">{meta?.label}</span>;
                      })
                    ) : (
                      <span className="fc-pill">Todavia no elegiste dias</span>
                    )}
                  </div>
                </div>
              ) : null}

              {step === 2 && activeDay ? (
                <div className="fc-routine-wizard-panel">
                  <div className="fc-routine-wizard-panel__intro">
                    <div className="fc-routine-day-heading">
                      <div>
                        <h2 className="fc-section-title" style={{ marginBottom: "0.35rem" }}>
                          {activeDayMeta?.label}
                        </h2>
                        <p className="fc-card-text" style={{ margin: 0 }}>
                          Define subgrupos musculares y agrega los ejercicios que quieres ver en este dia.
                        </p>
                      </div>

                      <div className="fc-routine-day-switcher">
                        <Button
                          variant="ghost"
                          disabled={dayCursor === 0}
                          onClick={goToPreviousDay}
                        >
                          <ChevronLeft size={16} />
                          Dia anterior
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={dayCursor === selectedDays.length - 1}
                          onClick={goToNextDay}
                        >
                          Siguiente dia
                          <ChevronRight size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {dayStage === "groups" ? (
                    <Card glass className="fc-routine-stage-card">
                      <div className="fc-routine-stage-card__header">
                        <div>
                          <span className="fc-text-eyebrow">Paso 1</span>
                          <h3 className="fc-section-title">Subgrupos musculares</h3>
                        </div>
                        <span className="fc-pill">{activeDay.muscle_subgroups.length} elegidos</span>
                      </div>

                      <div className="fc-muscle-taxonomy">
                        {muscleTaxonomy.map((group) => (
                          <div key={group.parent} className="fc-muscle-group-card">
                            <div className="fc-muscle-group-card__header">
                              <strong>{group.parent}</strong>
                              <span className="fc-pill">{(selectedSubgroupsByParent[group.parent] || []).length}</span>
                            </div>

                            <div className="fc-routine-day-groups">
                              {group.subgroups.map((subgroup) => {
                                const selected = activeDay.muscle_subgroups.includes(subgroup);
                                return (
                                  <button
                                    key={subgroup}
                                    type="button"
                                    className={`fc-muscle-chip ${selected ? "is-selected" : ""}`}
                                    onClick={() => handleToggleMuscleSubgroup(subgroup)}
                                  >
                                    {subgroup}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ) : (
                    <div className="fc-routine-stage-stack">
                      <Card glass className="fc-routine-stage-card">
                        <div className="fc-routine-stage-card__header">
                          <div>
                            <span className="fc-text-eyebrow">Paso 2</span>
                            <h3 className="fc-section-title">Ejercicios del dia</h3>
                          </div>
                          <Button variant="ghost" onClick={() => setDayStage("groups")}>
                            Editar subgrupos
                          </Button>
                        </div>

                        <div className="fc-routine-selected-groups">
                          {Object.entries(selectedSubgroupsByParent).map(([parent, subgroups]) => (
                            <div key={parent} className="fc-routine-selected-group">
                              <strong>{parent}</strong>
                              <div className="fc-helper-list">
                                {subgroups.map((group) => (
                                  <span key={group} className="fc-pill">
                                    {group}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {!catalog.length ? (
                        <Card glass className="fc-empty-state">
                          <div className="fc-empty-state__icon">
                            <Dumbbell size={24} />
                          </div>
                          <h3 className="fc-section-title">No hay ejercicios cargados</h3>
                          <p className="fc-card-text">
                            El catalogo global esta vacio. Ejecuta `007_expand_muscle_groups.sql` y `008_seed_exercises_full.sql` en Supabase para cargarlo.
                          </p>
                        </Card>
                      ) : (
                        <Card glass className="fc-routine-table-builder">
                          <div className="fc-routine-builder__header">
                            <div>
                              <span className="fc-text-eyebrow">Editor del dia</span>
                              <h3 className="fc-section-title" style={{ margin: "0.25rem 0 0" }}>
                                Lista de ejercicios
                              </h3>
                            </div>
                            <div className="fc-routine-table-builder__actions">
                              <span className="fc-pill">{filteredCatalog.length} disponibles</span>
                              <span className={`fc-pill ${activeDay.is_configured ? "is-success" : ""}`}>
                                {activeDay.is_configured ? "Dia guardado" : "Pendiente"}
                              </span>
                            </div>
                          </div>

                          <div className="fc-search-input">
                            <Search size={16} />
                            <input
                              className="fc-search-input__field"
                              placeholder="Buscar por nombre, grupo o equipo"
                              value={searchTerm}
                              onChange={(event) => setSearchTerm(event.target.value)}
                            />
                          </div>

                          {!activeDay.muscle_subgroups.length ? (
                            <p className="fc-card-text">Elegi al menos un subgrupo muscular para filtrar el catalogo.</p>
                          ) : null}

                          {activeDay.muscle_subgroups.length && filteredCatalog.length === 0 ? (
                            <p className="fc-card-text">No hay ejercicios cargados para esos subgrupos todavia.</p>
                          ) : null}

                          {paginatedCatalog.length ? (
                            <div className="fc-routine-suggestions">
                              {Object.entries(groupedPaginatedCatalog).map(([parent, exercises]) => (
                                <div key={parent} className="fc-routine-suggestion-group">
                                  <div className="fc-routine-suggestion-group__header">
                                    <strong>{parent}</strong>
                                    <span>{exercises.length} opciones</span>
                                  </div>
                                  <div className="fc-routine-suggestion-group__items">
                                    {exercises.map((exercise) => (
                                      <button
                                        key={exercise.id}
                                        type="button"
                                        className={`fc-routine-suggestion ${addingExerciseId === exercise.id ? "is-added" : ""}`}
                                        disabled={addingExerciseId === exercise.id}
                                        onClick={() => handleSelectSuggestion(exercise)}
                                      >
                                        <strong>{exercise.name}</strong>
                                        <span>
                                          {addingExerciseId === exercise.id ? (
                                            <>
                                              <Check size={14} /> Agregado
                                            </>
                                          ) : (
                                            <>
                                              {exercise.muscle_subgroup || "General"} · {exercise.equipment || "Libre"}
                                            </>
                                          )}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}

                          {filteredCatalog.length > CATALOG_PAGE_SIZE ? (
                            <div className="fc-pagination">
                              <Button
                                variant="ghost"
                                disabled={catalogPage === 1}
                                onClick={() => setCatalogPage((current) => Math.max(1, current - 1))}
                              >
                                <ChevronLeft size={16} />
                                Anterior
                              </Button>
                              <span className="fc-pagination__label">
                                Pagina {catalogPage} de {totalCatalogPages}
                              </span>
                              <Button
                                variant="ghost"
                                disabled={catalogPage === totalCatalogPages}
                                onClick={() =>
                                  setCatalogPage((current) => Math.min(totalCatalogPages, current + 1))
                                }
                              >
                                Siguiente
                                <ChevronRight size={16} />
                              </Button>
                            </div>
                          ) : null}

                          <div className="fc-routine-table-scroller">
                            {(activeDay.exercises || []).length === 0 ? (
                              <div className="fc-routine-table-empty">
                                <Dumbbell size={20} />
                                <p>Todavia no agregaste ejercicios para {activeDayMeta?.label}.</p>
                              </div>
                            ) : (
                              activeDay.exercises.map((item) => (
                                <div key={item.id} className="fc-routine-table-row">
                                  <div className="fc-routine-table-row__header">
                                    <div className="fc-routine-table-row__position">
                                      <span className="fc-text-eyebrow">Pos</span>
                                      <select
                                        className="fc-input fc-select"
                                        value={item.exercise_order}
                                        onChange={(event) =>
                                          setExercisePosition(item.id, Number(event.target.value))
                                        }
                                      >
                                        {activeDay.exercises.map((_, positionIndex) => (
                                          <option key={positionIndex + 1} value={positionIndex + 1}>
                                            {positionIndex + 1}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <Button variant="ghost-danger" onClick={() => removeDraftExercise(item.id)}>
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>

                                  <div className="fc-routine-table-row__exercise">
                                    <p className="fc-routine-table-row__exercise-name">
                                      {item.exercise?.name || "Ejercicio sin nombre"}
                                    </p>
                                    <div className="fc-catalog-item__meta">
                                      <span className="fc-pill">
                                        {item.exercise?.muscle_group_parent || "Sin grupo"}
                                      </span>
                                      <span className="fc-pill">
                                        {item.exercise?.muscle_subgroup || "Sin subgrupo"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="fc-routine-table-row__modes">
                                    <button
                                      type="button"
                                      className={`fc-mode-chip ${item.planning_mode === "reps" ? "is-active" : ""}`}
                                      onClick={() => updateDraftExercise(item.id, "planning_mode", "reps")}
                                    >
                                      Reps
                                    </button>
                                    <button
                                      type="button"
                                      className={`fc-mode-chip ${item.planning_mode === "duration" ? "is-active" : ""}`}
                                      onClick={() => updateDraftExercise(item.id, "planning_mode", "duration")}
                                    >
                                      Min
                                    </button>
                                  </div>

                                  <div className="fc-routine-table-row__metrics">
                                    <label className="fc-routine-field-mini">
                                      <span>Series</span>
                                      <input
                                        className="fc-input"
                                        inputMode="numeric"
                                        value={item.sets_planned}
                                        onChange={(event) =>
                                          updateDraftExercise(item.id, "sets_planned", event.target.value)
                                        }
                                      />
                                    </label>
                                    {item.planning_mode === "duration" ? (
                                      <label className="fc-routine-field-mini">
                                        <span>Duracion min</span>
                                        <input
                                          className="fc-input"
                                          inputMode="numeric"
                                          value={item.duration_minutes ?? ""}
                                          onChange={(event) =>
                                            updateDraftExercise(item.id, "duration_minutes", event.target.value)
                                          }
                                        />
                                      </label>
                                    ) : (
                                      <label className="fc-routine-field-mini">
                                        <span>Reps</span>
                                        <input
                                          className="fc-input"
                                          inputMode="numeric"
                                          value={item.reps_planned ?? ""}
                                          onChange={(event) =>
                                            updateDraftExercise(item.id, "reps_planned", event.target.value)
                                          }
                                        />
                                      </label>
                                    )}
                                    <label className="fc-routine-field-mini">
                                      <span>Descanso seg</span>
                                      <input
                                        className="fc-input"
                                        inputMode="numeric"
                                        value={item.rest_seconds}
                                        onChange={(event) =>
                                          updateDraftExercise(item.id, "rest_seconds", event.target.value)
                                        }
                                      />
                                    </label>
                                  </div>

                                  <div className="fc-routine-table-row__note">
                                    <label className="fc-routine-field-mini">
                                      <span>Nota opcional</span>
                                      <input
                                        className="fc-input"
                                        value={item.notes || ""}
                                        onChange={(event) =>
                                          updateDraftExercise(item.id, "notes", event.target.value)
                                        }
                                        placeholder="Tecnica, ritmo, observaciones"
                                      />
                                    </label>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="fc-routine-table-builder__footer">
                            <Button
                              variant="secondary"
                              disabled={!filteredCatalog.length}
                              onClick={addExerciseRow}
                            >
                              <Plus size={16} />
                              Agregar fila
                            </Button>
                            <Button
                              variant={activeDay.is_configured ? "success" : "primary"}
                              disabled={!activeDay.exercises.length}
                              onClick={saveDayConfiguration}
                            >
                              <Check size={16} />
                              {activeDay.is_configured
                                ? `Dia ${activeDayMeta?.label || ""} guardado`
                                : "Guardar dia"}
                            </Button>
                          </div>

                          {activeDay.is_configured ? (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                              style={{ marginTop: "0.75rem" }}
                            >
                              <Button onClick={continueAfterSavingDay} style={{ width: "100%" }}>
                                {dayCursor < selectedDays.length - 1 ? "Ir al dia siguiente" : "Ir al resumen"}
                                <ArrowRight size={16} />
                              </Button>
                            </motion.div>
                          ) : null}
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              {step === 3 ? (
                <div className="fc-routine-wizard-panel">
                  <div className="fc-routine-wizard-panel__intro">
                    <h2 className="fc-section-title">Resumen final</h2>
                    <p className="fc-card-text">
                      Revisa como queda organizada la semana y las fechas concretas antes de guardar la rutina.
                    </p>
                  </div>

                  <div className="fc-dashboard-grid">
                    <Card glass>
                      <div className="fc-routine-summary">
                        <span className="fc-text-eyebrow">
                          <ClipboardList size={14} />
                          Plan
                        </span>
                        <div className="fc-metric">
                          <span className="fc-metric__value">{selectedDays.length}</span>
                            <span className="fc-metric__label">Dias activos por semana</span>
                        </div>
                      </div>
                    </Card>

                    <Card glass>
                      <div className="fc-routine-summary">
                        <span className="fc-text-eyebrow">
                          <CalendarRange size={14} />
                          Fechas
                        </span>
                        <div className="fc-metric">
                          <span className="fc-metric__value">{calendarPreview.totalScheduledSessions}</span>
                          <span className="fc-metric__label">Sesiones programadas</span>
                        </div>
                      </div>
                    </Card>

                    <Card glass>
                      <div className="fc-routine-summary">
                        <span className="fc-text-eyebrow">
                          <Check size={14} />
                          Proxima
                        </span>
                        <div className="fc-metric">
                          <span className="fc-metric__value">
                            {calendarPreview.nextTrainingDate
                              ? formatDate(calendarPreview.nextTrainingDate)
                              : "Sin fecha"}
                          </span>
                          <span className="fc-metric__label">Proximo entrenamiento</span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="fc-routine-summary-grid">
                    {selectedDays.map((day) => {
                      const meta = weekdayOptions.find((item) => item.value === day.day_of_week);
                      return (
                        <Card key={day.day_of_week} glass className="fc-routine-summary-day">
                          <div className="fc-routine-card__top">
                            <div>
                              <span className="fc-text-eyebrow">{meta?.short}</span>
                              <h3 className="fc-section-title">{meta?.label}</h3>
                            </div>
                            <span className="fc-pill">{day.exercises.length} ejercicios</span>
                          </div>
                          <div className="fc-helper-list">
                            {Object.entries(
                              muscleTaxonomy.reduce((acc, group) => {
                                const selected = group.subgroups.filter((sub) =>
                                  day.muscle_subgroups.includes(sub)
                                );
                                if (selected.length) {
                                  acc[group.parent] = selected;
                                }
                                return acc;
                              }, {})
                            ).map(([parent, subgroups]) => (
                              <span key={parent} className="fc-pill">
                                {parent}: {subgroups.join(", ")}
                              </span>
                            ))}
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  <Card glass>
                    <div className="fc-routine-summary-meta">
                      <div className="fc-kv">
                        <span className="fc-kv__label">Inicio</span>
                        <span className="fc-kv__value">{formatDate(calendarPreview.startDate)}</span>
                      </div>
                      <div className="fc-kv">
                        <span className="fc-kv__label">Fin</span>
                        <span className="fc-kv__value">{formatDate(calendarPreview.endDate)}</span>
                      </div>
                      <div className="fc-kv">
                        <span className="fc-kv__label">Duracion</span>
                        <span className="fc-kv__value">{form.duration_months} meses</span>
                      </div>
                    </div>
                  </Card>

                  <Card glass>
                    <RoutineCalendar
                      startDate={calendarPreview.startDate}
                      endDate={calendarPreview.endDate}
                      items={calendarPreview.items}
                    />
                  </Card>
                </div>
              ) : null}
            </Card>
          </motion.div>

          <div className="fc-routine-wizard-sidebar">
            <Card glass>
              <div className="fc-routine-summary">
                <span className="fc-text-eyebrow">Resumen rapido</span>
                <div className="fc-kv-grid">
                  <div className="fc-kv">
                    <span className="fc-kv__label">Nombre</span>
                    <span className="fc-kv__value">{form.name.trim() || "Sin definir"}</span>
                  </div>
                  <div className="fc-kv">
                    <span className="fc-kv__label">Dias</span>
                    <span className="fc-kv__value">{selectedDays.length}</span>
                  </div>
                  <div className="fc-kv">
                    <span className="fc-kv__label">Ejercicios</span>
                    <span className="fc-kv__value">
                      {selectedDays.reduce((total, day) => total + day.exercises.length, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card glass>
              <div className="fc-routine-helper">
                <span className="fc-text-eyebrow">Consejo</span>
                <h3 className="fc-section-title">
                  {step === 0
                    ? "Empeza simple"
                    : step === 1
                      ? "Pensa en frecuencia real"
                      : step === 2
                        ? "Construi dia por dia"
                        : "Revisa antes de guardar"}
                </h3>
                <p className="fc-card-text">
                  {step === 0
                    ? "La mejor rutina es la que entendes de un vistazo y podes sostener."
                    : step === 1
                      ? "Elegi solo los dias que realmente vas a poder cumplir semana tras semana."
                      : step === 2
                        ? "Agrupa musculos compatibles y deja una secuencia de ejercicios clara."
                        : "Si algo no cierra, podes volver atras sin perder lo cargado."}
                </p>
              </div>
            </Card>
          </div>
        </div>

        {error ? (
          <Card glass>
            <p className="fc-form-message" style={{ margin: 0 }}>
              {error}
            </p>
          </Card>
        ) : null}

        <div className="fc-form-actions">
          <Button variant="secondary" disabled={step === 0} onClick={goBack}>
            <ArrowLeft size={16} />
            Atras
          </Button>

          {step < 3 ? (
            <Button onClick={goNext}>
              {step === 2 && dayCursor < selectedDays.length - 1 ? "Siguiente dia" : "Continuar"}
              <ArrowRight size={16} />
            </Button>
          ) : (
            <Button loading={saving} onClick={handleCreateRoutine}>
              <Check size={16} />
              Guardar rutina completa
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default RoutineForm;

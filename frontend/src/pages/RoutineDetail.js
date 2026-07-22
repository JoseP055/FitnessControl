import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ClipboardList,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import PageLoader from "../components/ui/PageLoader";
import {
  addRoutineExercise,
  deleteRoutine,
  deleteRoutineExercise,
  getExercises,
  getRoutineDetail,
  updateRoutineExercise,
} from "../services/api";

function capitalize(value) {
  if (!value) {
    return "Sin grupo";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function RoutineDetail() {
  const navigate = useNavigate();
  const { routineId } = useParams();

  const [routine, setRoutine] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [savingPanel, setSavingPanel] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [editingExerciseId, setEditingExerciseId] = useState("");
  const [addForm, setAddForm] = useState({
    sets_planned: "4",
    reps_planned: "10",
    rest_seconds: "90",
    notes: "",
  });
  const [editForm, setEditForm] = useState({
    sets_planned: "",
    reps_planned: "",
    rest_seconds: "",
    notes: "",
  });

  useEffect(() => {
    async function bootstrap() {
      try {
        const [routineResponse, catalogResponse] = await Promise.all([
          getRoutineDetail(routineId),
          getExercises(),
        ]);

        setRoutine(routineResponse);
        setCatalog(catalogResponse.items || []);
      } catch (loadError) {
        setError(loadError.message || "No se pudo cargar la rutina.");
      } finally {
        setLoading(false);
        setCatalogLoading(false);
      }
    }

    bootstrap();
  }, [routineId]);

  const selectedExercise = useMemo(
    () => catalog.find((item) => item.id === selectedExerciseId) || null,
    [catalog, selectedExerciseId]
  );

  const groupedCatalog = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return (catalog || [])
      .filter((exercise) => {
        if (!normalizedSearch) {
          return true;
        }

        return [exercise.name, exercise.muscle_group, exercise.equipment, exercise.description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch));
      })
      .reduce((groups, exercise) => {
        const group = capitalize(exercise.muscle_group || "otros");
        groups[group] = groups[group] || [];
        groups[group].push(exercise);
        return groups;
      }, {});
  }, [catalog, searchTerm]);

  async function refreshRoutine() {
    const updatedRoutine = await getRoutineDetail(routineId);
    setRoutine(updatedRoutine);
    return updatedRoutine;
  }

  async function handleDeleteRoutine() {
    const confirmed = window.confirm(
      "¿Querés eliminar esta rutina completa? Esta acción no se puede deshacer."
    );

    if (!confirmed) {
      return;
    }

    setBusyAction("delete-routine");
    setError("");

    try {
      await deleteRoutine(routineId);
      navigate("/routines");
    } catch (deleteError) {
      setError(deleteError.message || "No se pudo eliminar la rutina.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleAddExercise() {
    if (!selectedExerciseId) {
      setError("Seleccioná un ejercicio del catálogo.");
      return;
    }

    setSavingPanel(true);
    setError("");

    try {
      const response = await addRoutineExercise(routineId, {
        exercise_id: selectedExerciseId,
        sets_planned: Number(addForm.sets_planned),
        reps_planned: Number(addForm.reps_planned),
        rest_seconds: Number(addForm.rest_seconds),
        notes: addForm.notes.trim(),
      });
      setRoutine(response);
      setPanelOpen(false);
      setSelectedExerciseId("");
      setSearchTerm("");
      setAddForm({
        sets_planned: "4",
        reps_planned: "10",
        rest_seconds: "90",
        notes: "",
      });
    } catch (saveError) {
      setError(saveError.message || "No se pudo agregar el ejercicio.");
    } finally {
      setSavingPanel(false);
    }
  }

  function startEditing(item) {
    setEditingExerciseId(item.id);
    setEditForm({
      sets_planned: String(item.sets_planned ?? ""),
      reps_planned: String(item.reps_planned ?? ""),
      rest_seconds: String(item.rest_seconds ?? ""),
      notes: item.notes || "",
    });
  }

  async function handleSaveExercise(item) {
    setBusyAction(item.id);
    setError("");

    try {
      const response = await updateRoutineExercise(routineId, item.id, {
        sets_planned: Number(editForm.sets_planned),
        reps_planned: Number(editForm.reps_planned),
        rest_seconds: Number(editForm.rest_seconds),
        notes: editForm.notes.trim(),
      });
      setRoutine(response);
      setEditingExerciseId("");
    } catch (saveError) {
      setError(saveError.message || "No se pudo actualizar el ejercicio.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleDeleteExercise(item) {
    const confirmed = window.confirm("¿Querés quitar este ejercicio de la rutina?");

    if (!confirmed) {
      return;
    }

    setBusyAction(item.id);
    setError("");

    try {
      const response = await deleteRoutineExercise(routineId, item.id);
      setRoutine(response);
    } catch (deleteError) {
      setError(deleteError.message || "No se pudo quitar el ejercicio.");
    } finally {
      setBusyAction("");
    }
  }

  async function moveExercise(item, direction) {
    const items = routine?.exercises || [];
    const currentIndex = items.findIndex((entry) => entry.id === item.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const neighbor = items[targetIndex];

    if (currentIndex < 0 || !neighbor) {
      return;
    }

    setBusyAction(item.id);
    setError("");

    try {
      await updateRoutineExercise(routineId, item.id, {
        exercise_order: neighbor.exercise_order,
      });
      const response = await updateRoutineExercise(routineId, neighbor.id, {
        exercise_order: item.exercise_order,
      });
      setRoutine(response);
    } catch (moveError) {
      setError(moveError.message || "No se pudo reordenar el ejercicio.");
      await refreshRoutine();
    } finally {
      setBusyAction("");
    }
  }

  if (loading) {
    return <PageLoader label="Cargando detalle de la rutina..." />;
  }

  return (
    <AppShell
      activeSection="rutinas"
      header={
        <div className="fc-shell-header">
          <div>
            <h1 className="fc-dashboard__title">{routine?.name || "Rutina"}</h1>
            <p className="fc-dashboard__subtitle">
              {routine?.description ||
                "Armá la secuencia ideal y ajustá cada ejercicio en el orden que necesitás."}
            </p>
          </div>

          <div className="fc-shell-actions">
            <Button variant="ghost" onClick={() => navigate("/routines")}>
              <ArrowLeft size={16} />
              Volver
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/routines/${routineId}/edit`)}>
              <Pencil size={16} />
              Editar datos
            </Button>
            <Button onClick={() => setPanelOpen((current) => !current)}>
              <Plus size={16} />
              {panelOpen ? "Cerrar selector" : "Agregar ejercicio"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="fc-dashboard-stack">
        <div className="fc-dashboard-grid">
          <Card glass>
            <div className="fc-routine-summary">
              <span className="fc-text-eyebrow">
                <ClipboardList size={14} />
                Estructura
              </span>
              <div className="fc-metric">
                <span className="fc-metric__value">{routine?.exercise_count || 0}</span>
                <span className="fc-metric__label">Ejercicios en esta rutina</span>
              </div>
            </div>
          </Card>

          <Card glass>
            <div className="fc-routine-summary">
              <span className="fc-text-eyebrow">Enfoque</span>
              <p className="fc-card-text">
                {routine?.description || "Sumá una descripción si querés recordar el enfoque del día."}
              </p>
            </div>
          </Card>
        </div>

        {error ? (
          <Card glass>
            <p className="fc-form-message" style={{ margin: 0 }}>
              {error}
            </p>
          </Card>
        ) : null}

        {panelOpen ? (
          <div className="fc-routine-builder">
            <Card glass className="fc-routine-builder__catalog">
              <div className="fc-routine-builder__header">
                <div>
                  <span className="fc-text-eyebrow">Catálogo</span>
                  <h2 className="fc-section-title">Elegí el ejercicio</h2>
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

              {catalogLoading ? (
                <p className="fc-card-text">Cargando catálogo...</p>
              ) : (
                <div className="fc-catalog-groups">
                  {Object.entries(groupedCatalog).map(([group, exercises]) => (
                    <div key={group} className="fc-catalog-group">
                      <h3 className="fc-catalog-group__title">{group}</h3>
                      <div className="fc-catalog-group__items">
                        {exercises.map((exercise) => {
                          const isSelected = selectedExerciseId === exercise.id;
                          return (
                            <button
                              key={exercise.id}
                              type="button"
                              className={`fc-catalog-item ${isSelected ? "is-selected" : ""}`}
                              onClick={() => setSelectedExerciseId(exercise.id)}
                            >
                              <div>
                                <strong>{exercise.name}</strong>
                                <p>{exercise.description || "Sin descripción."}</p>
                              </div>
                              <span className="fc-pill">{exercise.equipment || "Libre"}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card glass className="fc-routine-builder__setup">
              <div className="fc-routine-builder__header">
                <div>
                  <span className="fc-text-eyebrow">Configuración</span>
                  <h2 className="fc-section-title">
                    {selectedExercise ? selectedExercise.name : "Elegí un ejercicio"}
                  </h2>
                </div>
              </div>

              {selectedExercise ? (
                <div className="fc-routine-builder__form">
                  <p className="fc-card-text">
                    Definí series, repeticiones y descanso antes de agregarlo a la rutina.
                  </p>

                  <div className="fc-grid-3">
                    <Input
                      id="sets-planned"
                      label="Series"
                      inputMode="numeric"
                      value={addForm.sets_planned}
                      onChange={(event) =>
                        setAddForm((current) => ({
                          ...current,
                          sets_planned: event.target.value,
                        }))
                      }
                    />
                    <Input
                      id="reps-planned"
                      label="Repeticiones"
                      inputMode="numeric"
                      value={addForm.reps_planned}
                      onChange={(event) =>
                        setAddForm((current) => ({
                          ...current,
                          reps_planned: event.target.value,
                        }))
                      }
                    />
                    <Input
                      id="rest-seconds"
                      label="Descanso (seg)"
                      inputMode="numeric"
                      value={addForm.rest_seconds}
                      onChange={(event) =>
                        setAddForm((current) => ({
                          ...current,
                          rest_seconds: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="fc-field">
                    <label className="fc-field__label" htmlFor="exercise-notes">
                      Nota opcional
                    </label>
                    <textarea
                      id="exercise-notes"
                      className="fc-input fc-textarea"
                      rows={4}
                      placeholder="Ej. Última serie al fallo técnico."
                      value={addForm.notes}
                      onChange={(event) =>
                        setAddForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <Button loading={savingPanel} onClick={handleAddExercise}>
                    <Plus size={16} />
                    Agregar a la rutina
                  </Button>
                </div>
              ) : (
                <p className="fc-card-text">
                  Primero seleccioná un ejercicio del catálogo para ver sus ajustes.
                </p>
              )}
            </Card>
          </div>
        ) : null}

        {(routine?.exercises || []).length === 0 ? (
          <Card glass className="fc-empty-state">
            <div className="fc-empty-state__icon">
              <Plus size={28} />
            </div>
            <h2 className="fc-section-title">Tu rutina está vacía</h2>
            <p className="fc-card-text">
              Abrí el selector y agregá ejercicios desde el catálogo para empezar a construirla.
            </p>
            <Button onClick={() => setPanelOpen(true)}>
              <Plus size={16} />
              Elegir ejercicio
            </Button>
          </Card>
        ) : (
          <div className="fc-routine-exercises">
            {routine.exercises.map((item, index) => {
              const exercise = item.exercise || {};
              const isEditing = editingExerciseId === item.id;
              const isBusy = busyAction === item.id;

              return (
                <Card key={item.id} glass className="fc-routine-exercise-card">
                  <div className="fc-routine-exercise-card__top">
                    <div>
                      <span className="fc-text-eyebrow">#{item.exercise_order}</span>
                      <h2 className="fc-section-title">{exercise.name || "Ejercicio"}</h2>
                    </div>
                    <span className="fc-pill">{exercise.muscle_group || "sin grupo"}</span>
                  </div>

                  <div className="fc-kv-grid">
                    <div className="fc-kv">
                      <span className="fc-kv__label">Series</span>
                      <span className="fc-kv__value">{item.sets_planned || "—"}</span>
                    </div>
                    <div className="fc-kv">
                      <span className="fc-kv__label">Reps</span>
                      <span className="fc-kv__value">{item.reps_planned || "—"}</span>
                    </div>
                    <div className="fc-kv">
                      <span className="fc-kv__label">Descanso</span>
                      <span className="fc-kv__value">
                        {item.rest_seconds ? `${item.rest_seconds}s` : "—"}
                      </span>
                    </div>
                  </div>

                  {item.notes ? <p className="fc-card-text">{item.notes}</p> : null}

                  {isEditing ? (
                    <div className="fc-routine-inline-editor">
                      <div className="fc-grid-3">
                        <Input
                          id={`edit-sets-${item.id}`}
                          label="Series"
                          inputMode="numeric"
                          value={editForm.sets_planned}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              sets_planned: event.target.value,
                            }))
                          }
                        />
                        <Input
                          id={`edit-reps-${item.id}`}
                          label="Reps"
                          inputMode="numeric"
                          value={editForm.reps_planned}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              reps_planned: event.target.value,
                            }))
                          }
                        />
                        <Input
                          id={`edit-rest-${item.id}`}
                          label="Descanso"
                          inputMode="numeric"
                          value={editForm.rest_seconds}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              rest_seconds: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="fc-field">
                        <label className="fc-field__label" htmlFor={`edit-notes-${item.id}`}>
                          Nota
                        </label>
                        <textarea
                          id={`edit-notes-${item.id}`}
                          className="fc-input fc-textarea"
                          rows={3}
                          value={editForm.notes}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              notes: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="fc-routine-card__actions">
                        <Button loading={isBusy} onClick={() => handleSaveExercise(item)}>
                          Guardar cambios
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setEditingExerciseId("")}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <div className="fc-routine-card__actions">
                    <Button
                      variant="ghost"
                      disabled={index === 0 || isBusy}
                      onClick={() => moveExercise(item, "up")}
                    >
                      <ArrowUp size={16} />
                      Subir
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={index === routine.exercises.length - 1 || isBusy}
                      onClick={() => moveExercise(item, "down")}
                    >
                      <ArrowDown size={16} />
                      Bajar
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={isBusy}
                      onClick={() => startEditing(item)}
                    >
                      <Pencil size={16} />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={isBusy}
                      onClick={() => handleDeleteExercise(item)}
                    >
                      <Trash2 size={16} />
                      Quitar
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Card glass>
          <div className="fc-danger-zone">
            <div>
              <span className="fc-text-eyebrow">Zona delicada</span>
              <h2 className="fc-section-title">Eliminar rutina</h2>
              <p className="fc-card-text">
                Borra la estructura completa y todos los ejercicios planificados de esta rutina.
              </p>
            </div>
            <Button
              variant="ghost"
              loading={busyAction === "delete-routine"}
              onClick={handleDeleteRoutine}
            >
              <Trash2 size={16} />
              Eliminar rutina
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export default RoutineDetail;

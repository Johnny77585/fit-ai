import { api } from './client';
import type { WorkoutData, WorkoutRecord } from './types';

export async function fetchWorkouts(): Promise<WorkoutRecord[]> {
  const { data } = await api.get<{ data: WorkoutRecord[] } | WorkoutRecord[]>('/workouts');
  return Array.isArray(data) ? data : data.data;
}

export async function createWorkout(
  payload: WorkoutData & { input_type: string }
): Promise<WorkoutRecord> {
  const { data: raw } = await api.post<{ data?: WorkoutRecord } & WorkoutRecord>('/workouts', {
    exercise: payload.exercise,
    sets: payload.sets ?? null,
    reps: payload.reps ?? null,
    weight: payload.weight ?? null,
    input_type: payload.input_type,
  });
  return raw.data ?? raw;
}

export async function updateWorkout(
  id: string,
  payload: Partial<WorkoutData>
): Promise<WorkoutRecord> {
  const { data: raw } = await api.patch<{ data?: WorkoutRecord } & WorkoutRecord>(`/workouts/${id}`, payload);
  return raw.data ?? raw;
}

export async function deleteWorkout(id: string): Promise<void> {
  await api.delete(`/workouts/${id}`);
}

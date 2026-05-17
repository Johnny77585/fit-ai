export interface ApiUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  photoURL: string | null;
  displayName: string;
}

export interface WorkoutData {
  exercise: string;
  reps?: number | null;
  sets?: number | null;
  weight?: number | null;
}

export interface WorkoutRecord extends WorkoutData {
  id: string;
  uid?: string;
  inputType?: string;
  timestamp?: string;
  recorded_at?: string;
}

export interface CategoryRecord {
  id: string;
  uid?: string;
  name: string;
}

export interface ExerciseDefinitionRecord {
  id: string;
  uid?: string;
  name: string;
  categoryId: string | null;
}

export function workoutDate(workout: WorkoutRecord): Date {
  const raw = workout.timestamp || workout.recorded_at;
  return raw ? new Date(raw) : new Date();
}

import { api } from './client';
import type { ExerciseDefinitionRecord } from './types';

export async function fetchExerciseDefinitions(): Promise<ExerciseDefinitionRecord[]> {
  const { data } = await api.get<{ data: ExerciseDefinitionRecord[] } | ExerciseDefinitionRecord[]>('/exercise-definitions');
  return Array.isArray(data) ? data : data.data;
}

export async function upsertExerciseDefinition(
  name: string,
  categoryId: string | null
): Promise<ExerciseDefinitionRecord> {
  const { data } = await api.post<ExerciseDefinitionRecord>('/exercise-definitions', {
    name,
    category_id: categoryId === 'uncategorized' ? null : categoryId,
    categoryId: categoryId === 'uncategorized' ? null : categoryId,
  });
  return data;
}

export async function renameExercise(oldName: string, newName: string): Promise<void> {
  await api.patch('/exercise-definitions/rename', {
    old_name: oldName,
    new_name: newName,
  });
}

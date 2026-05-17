import { api } from './client';
import type { CategoryRecord } from './types';

export async function fetchCategories(): Promise<CategoryRecord[]> {
  const { data } = await api.get<{ data: CategoryRecord[] } | CategoryRecord[]>('/categories');
  return Array.isArray(data) ? data : data.data;
}

export async function createCategory(name: string): Promise<CategoryRecord> {
  const { data } = await api.post<CategoryRecord>('/categories', { name });
  return data;
}

export async function updateCategory(id: string, name: string): Promise<CategoryRecord> {
  const { data } = await api.patch<CategoryRecord>(`/categories/${id}`, { name });
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}

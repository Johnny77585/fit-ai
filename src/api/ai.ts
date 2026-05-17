import { api } from './client';
import type { WorkoutData } from './types';

export async function extractWorkoutFromVoice(
  blob: Blob,
  language: 'en' | 'zh' = 'en'
): Promise<WorkoutData | null> {
  const form = new FormData();
  form.append('audio', blob, 'recording.webm');
  form.append('language', language);
  const { data } = await api.post<WorkoutData>('/ai/extract-voice', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data?.exercise ? data : null;
}

export async function extractWorkoutFromImage(
  file: File,
  language: 'en' | 'zh' = 'en'
): Promise<WorkoutData | null> {
  const form = new FormData();
  form.append('image', file);
  form.append('language', language);
  const { data } = await api.post<WorkoutData>('/ai/extract-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data?.exercise ? data : null;
}

export async function extractWorkoutFromText(
  text: string,
  language: 'en' | 'zh' = 'en'
): Promise<WorkoutData | null> {
  const { data } = await api.post<WorkoutData>('/ai/extract-text', { text, language });
  return data?.exercise ? data : null;
}

import type { DayOfWeek } from './types';

export function getCurrentWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek);
}

export function getPresenterForWeek(presenters: Presenter[], weekNumber: number): Presenter {
  const index = weekNumber % presenters.length;
  return presenters[index];
}

export function getWeekStartDate(weekNumber: number, dayOfWeek: DayOfWeek = 0): Date {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const date = new Date(start.getTime() + weekNumber * 7 * 24 * 60 * 60 * 1000);
  
  // Adjust to the selected day of the week
  const currentDay = date.getDay();
  const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
  date.setDate(date.getDate() + daysToAdd);
  
  return date;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString(navigator.language || 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDayOfWeek(date: Date): string {
  return date.toLocaleDateString(navigator.language || 'en-US', {
    weekday: 'long'
  });
}

export function encodePresenterList(presenters: Presenter[]): string {
  return encodeURIComponent(JSON.stringify(presenters));
}

export function decodePresenterList(encoded: string): Presenter[] {
  try {
    return JSON.parse(decodeURIComponent(encoded));
  } catch {
    return [];
  }
}

export function encodeSettings(settings: Settings): string {
  return encodeURIComponent(JSON.stringify(settings));
}

export function decodeSettings(encoded: string): Settings {
  try {
    return JSON.parse(decodeURIComponent(encoded));
  } catch {
    return { presentationDay: 1 }; // Default to Monday
  }
}
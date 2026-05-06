// ISO week utilities: keys are "YYYY-Www" (e.g. "2026-W19")

const MONTHS_UK = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];

function getMondayOfISOWeek(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (dayOfWeek - 1) + (week - 1) * 7);
  return monday;
}

export function parseWeekKey(key: string): { year: number; week: number } {
  const [yearStr, weekStr] = key.split('-W');
  return { year: parseInt(yearStr), week: parseInt(weekStr) };
}

export function getWeekStart(key: string): Date {
  const { year, week } = parseWeekKey(key);
  return getMondayOfISOWeek(year, week);
}

export function currentWeekKey(): string {
  return dateToWeekKey(new Date());
}

export function dateToWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function prevWeekKey(key: string): string {
  const start = getWeekStart(key);
  start.setUTCDate(start.getUTCDate() - 7);
  return dateToWeekKey(start);
}

export function nextWeekKey(key: string): string {
  const start = getWeekStart(key);
  start.setUTCDate(start.getUTCDate() + 7);
  return dateToWeekKey(start);
}

export function formatWeekLabel(key: string): string {
  const monday = getWeekStart(key);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const monDay = monday.getUTCDate();
  const monMonth = MONTHS_UK[monday.getUTCMonth()];
  const sunDay = sunday.getUTCDate();
  const sunMonth = MONTHS_UK[sunday.getUTCMonth()];

  if (monday.getUTCMonth() === sunday.getUTCMonth()) {
    return `${monDay} – ${sunDay} ${sunMonth}`;
  }
  return `${monDay} ${monMonth} – ${sunDay} ${sunMonth}`;
}

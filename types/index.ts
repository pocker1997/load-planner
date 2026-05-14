export type Specialist = 'Ростік' | 'Таня' | 'Аліна';

export const SPECIALISTS: Specialist[] = ['Ростік', 'Таня', 'Аліна'];

export const TOTAL_HOURS = 40;

export type TaskStatus = 'active' | 'done' | 'postponed';

export interface Task {
  id: string;
  name: string;
  hours: number;
  colorIndex: number;
  status: TaskStatus;
}

export interface SpecialistData {
  tasks: Task[];
  meetingHours: number;
}

export type WeekData = Record<Specialist, SpecialistData>;

// localStorage key: "YYYY-Www" → WeekData
export type AppStore = Record<string, WeekData>;

export const TASK_COLORS = [
  '#7C6CF2', // purple
  '#F97316', // orange
  '#22C77A', // green
  '#3B82F6', // blue
  '#EC4899', // pink
  '#14B8A6', // teal
  '#EAB308', // yellow
  '#A855F7', // violet
  '#10B981', // emerald
  '#F59E0B', // amber
];

export const MEETINGS_COLOR = '#EF6B6B';

export interface BacklogTask {
  id: string;
  name: string;
}

export function defaultSpecialistData(): SpecialistData {
  return { tasks: [], meetingHours: 0 };
}

export function defaultWeekData(): WeekData {
  return {
    Ростік: defaultSpecialistData(),
    Таня: defaultSpecialistData(),
    Аліна: defaultSpecialistData(),
  };
}

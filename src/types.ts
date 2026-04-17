export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export interface Subject {
  id: string;
  name: string;
  color: string;
  teacher?: string;
  room?: string;
}

export interface ScheduleItem {
  id: string;
  subjectId: string;
  day: DayOfWeek;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  room?: string;
}

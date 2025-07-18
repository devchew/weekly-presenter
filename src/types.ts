export interface Presenter {
  id: string;
  name: string;
  position: number;
}

export interface WeeklyPresenter {
  presenter: Presenter;
  week: number;
  date: Date;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Team {
  id: string;
  presentationDay: DayOfWeek;
  members: Presenter[];
}
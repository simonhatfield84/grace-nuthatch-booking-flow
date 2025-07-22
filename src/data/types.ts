
export interface JournalEntry {
  date: string;
  displayDate: string;
  sessionNumber: number;
  commands: number;
  focus: string;
  accomplishments: string[];
  keyAchievement: string;
  personalNote: string;
  simonNote?: string;
  tone: 'optimistic' | 'challenging' | 'reflective';
}

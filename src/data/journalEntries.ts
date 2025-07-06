
export interface JournalEntry {
  date: string;
  displayDate: string;
  sessionNumber: number;
  credits: number;
  focus: string;
  accomplishments: string[];
  keyAchievement: string;
}

export const journalEntries: JournalEntry[] = [
  {
    date: '2025-07-05',
    displayDate: 'Saturday, July 5th 2025',
    sessionNumber: 3,
    credits: 92,
    focus: 'Platform administration system and multi-tenant architecture',
    accomplishments: [
      'Built complete platform admin dashboard with venue management',
      'Implemented user management system with role-based access control',
      'Created subscription management framework',
      'Added support ticket system for customer service',
      'Developed platform-wide settings and configuration tools'
    ],
    keyAchievement: 'Transformed from single-venue to full multi-tenant SaaS platform'
  },
  {
    date: '2025-07-04',
    displayDate: 'Friday, July 4th 2025',
    sessionNumber: 2,
    credits: 102,
    focus: 'Service management and booking optimization',
    accomplishments: [
      'Created comprehensive service management system',
      'Implemented booking windows with time-based restrictions',
      'Added duration rules for different service types',
      'Built rich text editor for service descriptions',
      'Developed media upload system for service images',
      'Enhanced host interface with mobile optimization'
    ],
    keyAchievement: 'Complete service lifecycle from creation to customer booking'
  },
  {
    date: '2025-07-03',
    displayDate: 'Thursday, July 3rd 2025 - Project Start',
    sessionNumber: 1,
    credits: 84,
    focus: 'Foundation architecture and core systems',
    accomplishments: [
      'Set up Supabase backend with PostgreSQL database',
      'Implemented user authentication and authorization system',
      'Created table management with drag-and-drop interface',
      'Built booking system with real-time conflict detection',
      'Developed guest database with CSV import functionality',
      'Established admin dashboard with KPI tracking'
    ],
    keyAchievement: 'Fully functional booking system from zero to working prototype'
  }
];

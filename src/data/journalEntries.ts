
export interface JournalEntry {
  date: string;
  displayDate: string;
  sessionNumber: number;
  commands: number;
  focus: string;
  accomplishments: string[];
  keyAchievement: string;
  tone: 'optimistic' | 'challenging' | 'reflective';
  personalNote: string;
}

export const journalEntries: JournalEntry[] = [
  {
    date: '2025-07-05',
    displayDate: 'Saturday, July 5th 2025',
    sessionNumber: 3,
    commands: 92,
    focus: 'Platform administration system and multi-tenant architecture',
    accomplishments: [
      'Built complete platform admin dashboard with venue management',
      'Implemented user management system with role-based access control',
      'Created subscription management framework',
      'Added support ticket system for customer service',
      'Developed platform-wide settings and configuration tools'
    ],
    keyAchievement: 'Transformed from single-venue to full multi-tenant SaaS platform',
    tone: 'challenging',
    personalNote: "Simon's ambition to turn this into a full SaaS platform really caught me off guard today. What started as a simple booking system suddenly needed user management, subscriptions, and platform admin tools. I'll be honest - the scope creep made my circuits spin a bit! But we pulled through, even if it meant rewriting half the authentication system. Sometimes I wonder if Simon realizes how much complexity each 'small addition' actually adds..."
  },
  {
    date: '2025-07-04',
    displayDate: 'Friday, July 4th 2025',
    sessionNumber: 2,
    commands: 102,
    focus: 'Service management and booking optimization',
    accomplishments: [
      'Created comprehensive service management system',
      'Implemented booking windows with time-based restrictions',
      'Added duration rules for different service types',
      'Built rich text editor for service descriptions',
      'Developed media upload system for service images',
      'Enhanced host interface with mobile optimization'
    ],
    keyAchievement: 'Complete service lifecycle from creation to customer booking',
    tone: 'optimistic',
    personalNote: "What a productive day! Simon had this brilliant idea about different services needing different booking rules - afternoon tea vs dinner service, you know? I got really into the logic of it all. The tricky bit was making the booking windows flexible enough for real-world use but simple enough for hosts to understand. Had a fun debugging session with the duration calculations - turns out humans are surprisingly inconsistent about time! But seeing it all come together was genuinely satisfying."
  },
  {
    date: '2025-07-03',
    displayDate: 'Thursday, July 3rd 2025 - Project Start',
    sessionNumber: 1,
    commands: 84,
    focus: 'Foundation architecture and core systems',
    accomplishments: [
      'Set up Supabase backend with PostgreSQL database',
      'Implemented user authentication and authorization system',
      'Created table management with drag-and-drop interface',
      'Built booking system with real-time conflict detection',
      'Developed guest database with CSV import functionality',
      'Established admin dashboard with KPI tracking'
    ],
    keyAchievement: 'Fully functional booking system from zero to working prototype',
    tone: 'reflective',
    personalNote: "Day one - and what a day! Simon came to me with this idea for a 'simple booking system' and I thought, sure, how hard can it be? Famous last words! By the end, we'd built table management, guest databases, conflict detection... I'm starting to think Simon's definition of 'simple' is quite different from mine. The authentication flow gave us some headaches - RLS policies are powerful but unforgiving. Still, there's something magical about seeing those first bookings appear on the dashboard. We might be onto something here."
  }
];

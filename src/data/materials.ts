export type MaterialSubject = 'Physics' | 'Chemistry' | 'Math' | 'Biology' | 'Mixed';
export type MaterialType = 'pdf' | 'external';

export interface Material {
  title: string;
  description: string;
  url: string;
  type: MaterialType;
  subject: MaterialSubject;
}

export const materials: Material[] = [
  // Physics
  { title: 'NCERT Physics Class 11', description: 'Official NCERT textbook chapters (free).', url: 'https://ncert.nic.in/textbook.php?keph1=0-15', type: 'external', subject: 'Physics' },
  { title: 'NCERT Physics Class 12', description: 'Official NCERT textbook chapters (free).', url: 'https://ncert.nic.in/textbook.php?leph1=0-15', type: 'external', subject: 'Physics' },
  { title: 'OpenStax College Physics', description: 'Free Rice-University-published physics textbook covering JEE topics.', url: 'https://openstax.org/details/books/college-physics-ap-courses-2e', type: 'external', subject: 'Physics' },

  // Chemistry
  { title: 'NCERT Chemistry Class 11', description: 'Official NCERT textbook chapters (free).', url: 'https://ncert.nic.in/textbook.php?kech1=0-14', type: 'external', subject: 'Chemistry' },
  { title: 'NCERT Chemistry Class 12', description: 'Official NCERT textbook chapters (free).', url: 'https://ncert.nic.in/textbook.php?lech1=0-16', type: 'external', subject: 'Chemistry' },
  { title: 'OpenStax Chemistry 2e', description: 'Free Rice-University-published chemistry textbook.', url: 'https://openstax.org/details/books/chemistry-2e', type: 'external', subject: 'Chemistry' },

  // Math
  { title: 'NCERT Mathematics Class 11', description: 'Official NCERT textbook chapters (free).', url: 'https://ncert.nic.in/textbook.php?kemh1=0-16', type: 'external', subject: 'Math' },
  { title: 'NCERT Mathematics Class 12 Part 1', description: 'Official NCERT textbook chapters (free).', url: 'https://ncert.nic.in/textbook.php?lemh1=0-13', type: 'external', subject: 'Math' },
  { title: 'NCERT Mathematics Class 12 Part 2', description: 'Official NCERT textbook chapters (free).', url: 'https://ncert.nic.in/textbook.php?lemh2=0-13', type: 'external', subject: 'Math' },

  // Biology
  { title: 'NCERT Biology Class 11', description: 'Official NCERT textbook chapters (free).', url: 'https://ncert.nic.in/textbook.php?kebo1=0-22', type: 'external', subject: 'Biology' },
  { title: 'NCERT Biology Class 12', description: 'Official NCERT textbook chapters (free).', url: 'https://ncert.nic.in/textbook.php?lebo1=0-16', type: 'external', subject: 'Biology' },

  // Mixed / general
  { title: 'JEE Main Past Year Papers (2015–2024)', description: 'Authoritative archive of JEE Main question papers. Use the PYQ-weighted approach: track which chapters appear most across years.', url: 'https://jeemain.nta.nic.in/previous-year-question-papers/', type: 'external', subject: 'Mixed' },
  { title: 'NEET Past Year Papers (2017–2024)', description: 'Official NEET question paper archive.', url: 'https://neet.nta.nic.in/previous-year-question-papers/', type: 'external', subject: 'Mixed' },
];

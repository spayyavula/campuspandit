// Final items written after ~2 weeks of engagement signals — see
// docs/superpowers/specs/2026-05-22-park-consumer-app-supabase-migration-design.md §5 Phase 3g.
// Edit this file directly to publish updates; no code re-deploy concerns.

export type RoadmapColumn = 'now' | 'next' | 'later';
export type RoadmapAudience = 'coaching_center' | 'prospective_cc_via_student' | 'both';

export interface RoadmapItem {
  title: string;
  description: string;
  column: RoadmapColumn;
  audience: RoadmapAudience;
}

export const items: RoadmapItem[] = [
  {
    title: 'Founding 10 pilot launch',
    description: 'First cohort of coaching centers onboarded with branded student app and AI Coach. Applications open.',
    column: 'now',
    audience: 'coaching_center',
  },
  {
    title: 'Branded student web app',
    description: 'Per-center themed PWA in 7 days from pilot start. Native Play Store wrapper rolls out in pilot month 2.',
    column: 'next',
    audience: 'coaching_center',
  },
  {
    title: 'PYQ-weighted AI Coach diagnostic',
    description: 'Personalised chapter weakness analysis using historical JEE Main and NEET question frequencies. Pilot month 2.',
    column: 'later',
    audience: 'both',
  },
];

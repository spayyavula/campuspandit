import { Course, UserProgress } from '../types';

export const calculateCourseProgress = (course: Course): number => {
  return Math.round((course.completedLessons / course.totalLessons) * 100);
};

export const getTotalProgress = (courses: Course[]): number => {
  const totalLessons = courses.reduce((sum, course) => sum + course.totalLessons, 0);
  const completedLessons = courses.reduce((sum, course) => sum + course.completedLessons, 0);
  return Math.round((completedLessons / totalLessons) * 100);
};

export const getSubjectProgress = (courses: Course[], subject: string): number => {
  const subjectCourses = courses.filter(course => course.subject === subject);
  const totalLessons = subjectCourses.reduce((sum, course) => sum + course.totalLessons, 0);
  const completedLessons = subjectCourses.reduce((sum, course) => sum + course.completedLessons, 0);
  return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
};
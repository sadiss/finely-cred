import type { LessonBlockType } from './courses';

export type CourseTemplateId = string;

export type CourseTemplateCategory =
  | 'personal_credit'
  | 'business_credit'
  | 'disputes'
  | 'debt'
  | 'identity'
  | 'funding'
  | 'operations'
  | 'marketing'
  | 'compliance'
  | 'general';

export type CourseTemplateLessonBlueprint = {
  title: string;
  summary?: string;
  blocks?: Array<{ type: LessonBlockType; data?: Record<string, any> }>;
};

export type CourseTemplateModuleBlueprint = {
  title: string;
  lessons: CourseTemplateLessonBlueprint[];
};

export type CourseTemplateBlueprint = {
  title: string;
  desc: string;
  tags?: string[];
  modules: CourseTemplateModuleBlueprint[];
};

export type CourseTemplate = {
  id: CourseTemplateId;
  title: string;
  description: string;
  category: CourseTemplateCategory;
  tags: string[];
  blueprint: CourseTemplateBlueprint;
  createdAt: string;
  updatedAt: string;
};


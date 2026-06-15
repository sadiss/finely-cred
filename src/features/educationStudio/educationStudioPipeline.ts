import type { Course, CourseModule, CourseLesson, LessonContentBlock } from '../../domain/courses';
import { nowIso } from '../../domain/courses';
import { newId } from '../../utils/ids';
import { callAiGateway } from '../../lib/aiClient';
import { extractFirstJsonObject } from '../../utils/jsonExtract';
import type { CourseLevel, CourseStudioMeta } from '../../domain/educationStudio';

type GeneratedOutline = {
  title: string;
  desc: string;
  tags?: string[];
  level?: CourseLevel;
  learningObjectives?: string[];
  marketingHeadline?: string;
  marketingSummary?: string;
  modules: Array<{
    title: string;
    lessons: Array<{
      title: string;
      summary?: string;
      objectives?: string[];
      quizQuestions?: Array<{ question: string; choices: string[]; correctIndex: number }>;
    }>;
  }>;
};

function blockMarkdown(md: string): LessonContentBlock {
  return { id: newId('blk'), type: 'markdown', data: { markdown: md } };
}

function blockQuiz(question: string, choices: string[], correctIndex: number): LessonContentBlock {
  return {
    id: newId('blk'),
    type: 'quiz_mcq',
    data: { question, choices, answerIndex: correctIndex, correctIndex, explain: '' },
  };
}

export async function generateCourseFromPrompt(args: {
  prompt: string;
  level?: CourseLevel;
}): Promise<{ course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>; studio: CourseStudioMeta }> {
  const res = await callAiGateway({
    taskType: 'education.full_course',
    responseFormat: 'json',
    messages: [
      {
        role: 'system',
        content: `You are an AI Education Studio producing enterprise-grade courses. Return JSON only with:
title, desc, tags (string[]), level, learningObjectives (string[]), marketingHeadline, marketingSummary,
modules[{ title, lessons[{ title, summary, objectives (string[]), quizQuestions[{ question, choices, correctIndex }] }] }].
Create 4-6 modules, 2-4 lessons each. Credit/finance education tone. Compliant, not legal advice.`,
      },
      {
        role: 'user',
        content: `Level: ${args.level ?? 'beginner'}\nTopic prompt:\n${args.prompt.trim()}`,
      },
    ],
  });

  const parsed = extractFirstJsonObject(String(res.text ?? '')) as GeneratedOutline | null;
  if (!parsed?.modules?.length) {
    throw new Error('AI did not return a valid course outline.');
  }

  const modules: CourseModule[] = parsed.modules.map((m) => ({
    id: newId('mod'),
    title: m.title || 'Module',
    lessons: (m.lessons ?? []).map((l) => {
      const content: LessonContentBlock[] = [];
      const objMd = (l.objectives ?? []).map((o) => `- ${o}`).join('\n');
      content.push(
        blockMarkdown(
          `## ${l.title}\n\n${l.summary ?? ''}\n\n### Objectives\n${objMd || '- Complete this lesson'}\n`,
        ),
      );
      for (const q of l.quizQuestions ?? []) {
        if (q.question && q.choices?.length) {
          content.push(blockQuiz(q.question, q.choices, q.correctIndex ?? 0));
        }
      }
      return {
        id: newId('lesson'),
        title: l.title || 'Lesson',
        summary: l.summary,
        content,
        estimatedMinutes: 12,
      };
    }),
  }));

  return {
    course: {
      title: parsed.title || 'Generated course',
      desc: parsed.desc || args.prompt.trim(),
      tags: parsed.tags ?? [],
      published: false,
      modules,
    },
    studio: {
      level: parsed.level ?? args.level ?? 'beginner',
      learningObjectives: parsed.learningObjectives ?? [],
      generationPrompt: args.prompt.trim(),
      lastGeneratedAt: nowIso(),
      marketingHeadline: parsed.marketingHeadline,
      marketingSummary: parsed.marketingSummary,
    },
  };
}

export async function generateVideoScenePlan(args: {
  courseTitle: string;
  lessonTitle: string;
  lessonContent: string;
  style: string;
  provider: string;
}): Promise<{ scenes: Array<Omit<import('./educationStudioModel').VideoScenePlan, 'id'>> }> {
  const res = await callAiGateway({
    taskType: 'education.video_scenes',
    responseFormat: 'json',
    messages: [
      {
        role: 'system',
        content: `Return JSON: { scenes: [{ sceneNumber, title, visualPrompt, voiceover, onScreenText, cameraDirection, durationSec }] }.
Create 4-8 cinematic scenes for an educational video. Style: ${args.style}. Provider target: ${args.provider}.`,
      },
      {
        role: 'user',
        content: `Course: ${args.courseTitle}\nLesson: ${args.lessonTitle}\n\nContent:\n${args.lessonContent.slice(0, 6000)}`,
      },
    ],
  });
  const parsed = extractFirstJsonObject(String(res.text ?? '')) as { scenes?: any[] } | null;
  const scenes = (parsed?.scenes ?? []).map((s, i) => ({
    sceneNumber: s.sceneNumber ?? i + 1,
    title: String(s.title ?? `Scene ${i + 1}`),
    visualPrompt: String(s.visualPrompt ?? ''),
    voiceover: String(s.voiceover ?? ''),
    onScreenText: s.onScreenText ? String(s.onScreenText) : undefined,
    cameraDirection: s.cameraDirection ? String(s.cameraDirection) : undefined,
    durationSec: typeof s.durationSec === 'number' ? s.durationSec : 8,
    provider: args.provider as any,
    status: 'prompt_ready' as const,
  }));
  return { scenes };
}

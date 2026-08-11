import type { CourseLesson, LessonContentBlock } from '../../domain/courses';

const EXAMPLE_BLOCK_TYPES = new Set(['worksheet', 'steps', 'code', 'table', 'callout']);

function isExampleBlock(block: LessonContentBlock): boolean {
  if (EXAMPLE_BLOCK_TYPES.has(block.type)) return true;
  if (block.type === 'markdown' || block.type === 'rich_text') {
    const md = String(block.data?.markdown ?? '');
    return /^#{1,3}\s*example/i.test(md.trim()) || md.toLowerCase().includes('worked example');
  }
  return false;
}

export function splitLessonContent(blocks: LessonContentBlock[]) {
  const list = Array.isArray(blocks) ? blocks : [];
  const videoBlocks = list.filter((b) => b.type === 'video_asset');
  const exampleBlocks = list.filter((b) => b.type !== 'video_asset' && isExampleBlock(b));
  const learnBlocks = list.filter((b) => b.type !== 'video_asset' && !isExampleBlock(b));
  return { videoBlocks, learnBlocks, exampleBlocks };
}

export function lessonHasVideoContent(lesson: CourseLesson): boolean {
  return (lesson.content ?? []).some((b) => b.type === 'video_asset' && b.data?.videoAssetId);
}

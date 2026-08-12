import React from 'react';
import { VideoTimelineEditor, type VideoTimelineEditorProps } from './VideoTimelineEditor';

export type VideoSceneDeckProps = VideoTimelineEditorProps;

/** Thin wrapper — timeline editor is the canonical scene deck. */
export function VideoSceneDeck(props: VideoTimelineEditorProps) {
  return <VideoTimelineEditor {...props} showEnhancements={props.showEnhancements ?? false} />;
}

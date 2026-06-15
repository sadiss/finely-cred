import { useCallback, useState } from 'react';
import { finelyOsCardDragging } from './finelyOsLightUi';

export function useBoardDragDrop<TColumn extends string>(onMove: (itemId: string, toColumn: TColumn) => void) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropColumn, setDropColumn] = useState<TColumn | null>(null);

  const cardDragProps = useCallback(
    (itemId: string, className = '') => ({
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        e.dataTransfer.setData('application/x-finely-board-id', itemId);
        e.dataTransfer.effectAllowed = 'move';
        setDraggingId(itemId);
      },
      onDragEnd: () => {
        setDraggingId(null);
        setDropColumn(null);
      },
      className: `${className} ${finelyOsCardDragging(draggingId === itemId)}`.trim(),
    }),
    [draggingId],
  );

  const columnDropProps = useCallback(
    (columnId: TColumn, dropHighlightClass: string) => ({
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropColumn(columnId);
      },
      onDragLeave: () => setDropColumn(null),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('application/x-finely-board-id');
        if (id) onMove(id, columnId);
        setDraggingId(null);
        setDropColumn(null);
      },
      className: dropColumn === columnId ? dropHighlightClass : '',
    }),
    [dropColumn, onMove],
  );

  const stopDragOnControl = {
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    draggable: false as const,
  };

  return { draggingId, dropColumn, cardDragProps, columnDropProps, stopDragOnControl };
}

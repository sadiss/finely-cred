import { HAITIAN_LETTER_MEANING_KIT_ID } from './haitianLetterMeaningCopy';
import {
  HAITIAN_PIECES,
  type HaitianPieceAccent,
  type HaitianPieceArchitecture,
  type HaitianPieceRoom,
  type HaitianPieceSpec,
  haitianPieceById,
  listHaitianPieces,
  listHaitianPiecesByRoom,
} from './haitianPieceSpec';

export { HAITIAN_LETTER_MEANING_KIT_ID };
export type HaitianDeskKitAccent = HaitianPieceAccent;
export type HaitianDeskKitArchitecture = HaitianPieceArchitecture;
export type HaitianDeskKitRoom = HaitianPieceRoom;

export type HaitianDeskKit = {
  id: string;
  ordinal: string;
  title: string;
  titleHt: string;
  purpose: string;
  purposeHt: string;
  path: string;
  accent: HaitianDeskKitAccent;
  sheet: string[];
  architecture?: HaitianDeskKitArchitecture;
  room?: HaitianDeskKitRoom;
  ctaPath?: string;
  captionEn?: string;
  captionHt?: string;
  internal?: boolean;
};

function kitFromPiece(piece: HaitianPieceSpec): HaitianDeskKit {
  return {
    id: piece.id,
    ordinal: piece.ordinal,
    title: piece.title,
    titleHt: piece.titleHt,
    purpose: piece.purpose,
    purposeHt: piece.purposeHt,
    path: piece.ctaPath,
    accent: piece.accent,
    architecture: piece.architecture,
    room: piece.room,
    ctaPath: piece.ctaPath,
    captionEn: piece.captionEn,
    captionHt: piece.captionHt,
    internal: true,
    sheet: [piece.hookEn, piece.hookHt, piece.actionEn, piece.actionHt],
  };
}

export const HAITIAN_DESK_KITS: HaitianDeskKit[] = HAITIAN_PIECES.map(kitFromPiece);

export function haitianKitById(id: string | undefined): HaitianDeskKit | undefined {
  const piece = haitianPieceById(id);
  return piece ? kitFromPiece(piece) : undefined;
}

export function listHaitianDeskKits(): HaitianDeskKit[] {
  return listHaitianPieces().map(kitFromPiece);
}

export function listHaitianDeskKitsByRoom(room: HaitianDeskKitRoom): HaitianDeskKit[] {
  return listHaitianPiecesByRoom(room).map(kitFromPiece);
}

export function haitianLetterMeaningKit(): HaitianDeskKit | undefined {
  return haitianKitById(HAITIAN_LETTER_MEANING_KIT_ID);
}

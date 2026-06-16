export type InterpretiveNote = {
  id: number;
  note: string;
  createdAt: Date;
  author: {
    id: number;
    name: string;
  };
  story: {
    id: number;
    title: string;
  };
};

export type CreateInterpretiveNoteRequest = {
  pilotId: number;
  storyId: number;
  authorId: number;
  note: string;
};

export type CreateInterpretiveNote = (
  request: CreateInterpretiveNoteRequest,
) => Promise<{
  id: number;
  pilotId: number;
  storyId: number;
  authorId: number;
  note: string;
  createdAt: Date;
}>;

export type GetInterpretiveNotes = (
  pilotId: number,
) => Promise<ReadonlyArray<InterpretiveNote>>;

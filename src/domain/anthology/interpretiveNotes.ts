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
  anthologyId: number;
  storyId: number;
  authorId: number;
  note: string;
};

export type CreateInterpretiveNote = (
  request: CreateInterpretiveNoteRequest,
) => Promise<{
  id: number;
  anthologyId: number;
  storyId: number;
  authorId: number;
  note: string;
  createdAt: Date;
}>;

export type GetInterpretiveNotes = (
  anthologyId: number,
) => Promise<ReadonlyArray<InterpretiveNote>>;

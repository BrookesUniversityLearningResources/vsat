import type { StoryDto } from "../../database/schema.js";

export type AnthologyStatus = "draft" | "active" | "complete";

export type Anthology = {
  id: number;
  title: string;
  question: string;
  partner: string | null;
  status: AnthologyStatus;
  startAt: Date | null;
  endAt: Date | null;
  createdAt: Date;
};

export type CreateAnthologyRequest = {
  title: string;
  question: string;
  partner?: string | null;
  status?: AnthologyStatus;
  startAt?: Date | null;
  endAt?: Date | null;
};

export type CreateAnthology = (
  request: CreateAnthologyRequest,
) => Promise<Anthology>;

export type GetAnthology = (
  anthologyId: number,
) => Promise<Anthology | undefined>;

export type GetAnthologies = () => Promise<ReadonlyArray<Anthology>>;

export type UpdateAnthologyRequest = {
  anthologyId: number;
  title?: string;
  question?: string;
  partner?: string | null;
  status?: AnthologyStatus;
};

export type UpdateAnthology = (
  request: UpdateAnthologyRequest,
) => Promise<Anthology | undefined>;

export type DeleteAnthology = (anthologyId: number) => Promise<void>;

export type AssignStoryToAnthologyRequest = {
  anthologyId: number;
  storyId: StoryDto["id"];
};

export type AssignStoryToAnthology = (
  request: AssignStoryToAnthologyRequest,
) => Promise<void>;

export type RemoveStoryFromAnthologyRequest = {
  anthologyId: number;
  storyId: StoryDto["id"];
};

export type RemoveStoryFromAnthology = (
  request: RemoveStoryFromAnthologyRequest,
) => Promise<void>;

export type GetAnthologyStories = (
  anthologyId: number,
) => Promise<ReadonlyArray<Pick<StoryDto, "id" | "title">>>;

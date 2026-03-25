import type { StoryDto } from "../../database/schema.js";

export type PilotStatus = "draft" | "active" | "complete";

export type Pilot = {
  id: number;
  title: string;
  question: string;
  partner: string | null;
  status: PilotStatus;
  startAt: Date | null;
  endAt: Date | null;
  createdAt: Date;
};

export type CreatePilotRequest = {
  title: string;
  question: string;
  partner?: string | null;
  status?: PilotStatus;
  startAt?: Date | null;
  endAt?: Date | null;
};

export type CreatePilot = (request: CreatePilotRequest) => Promise<Pilot>;

export type GetPilot = (pilotId: number) => Promise<Pilot | undefined>;

export type GetPilots = () => Promise<ReadonlyArray<Pilot>>;

export type AssignStoryToPilotRequest = {
  pilotId: number;
  storyId: StoryDto["id"];
};

export type AssignStoryToPilot = (
  request: AssignStoryToPilotRequest,
) => Promise<void>;

export type GetPilotStories = (
  pilotId: number,
) => Promise<ReadonlyArray<Pick<StoryDto, "id" | "title">>>;

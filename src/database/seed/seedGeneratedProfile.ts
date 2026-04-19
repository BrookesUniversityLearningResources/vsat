import { readFileSync } from "node:fs";
import path from "node:path";
import { cwd, env, exit } from "node:process";
import { z } from "zod";

import getEnvironment from "../../environment/getEnvironment.js";

const AuthorModel = z.object({
  ref: z.string().min(1),
  name: z.string().min(1),
  email: z.string().min(1),
});

const ImageModel = z.object({
  url: z.string().url(),
  thumbnailUrl: z.string().url(),
});

const AudioModel = z.object({
  url: z.string().url(),
});

const SceneModel = z.object({
  ref: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  isOpeningScene: z.boolean(),
  image: ImageModel.optional().nullable(),
  audio: AudioModel.optional().nullable(),
});

const StoryModel = z.object({
  ref: z.string().min(1),
  title: z.string().min(1),
  authorRef: z.string().min(1),
  publish: z.boolean().default(false),
  scenes: z.array(SceneModel).min(1),
});

const StoryLinkModel = z.object({
  fromStoryRef: z.string().min(1),
  toStoryRef: z.string().min(1),
  toSceneRef: z.string().min(1).optional().nullable(),
  toPageNumber: z.number().int().positive().optional().nullable(),
  linkType: z.enum(["adjacency", "thematic", "causal", "contrast"]),
  rationale: z.string().min(1),
  createdByAuthorRef: z.string().min(1),
  vote: z.enum(["accept", "reject"]).optional().nullable(),
});

const GeneratedProfileModel = z.object({
  profile: z.string().min(1),
  authors: z.array(AuthorModel).min(1),
  stories: z.array(StoryModel).min(1),
  storyLinks: z.array(StoryLinkModel).optional().default([]),
});

type GeneratedProfile = z.infer<typeof GeneratedProfileModel>;
type GeneratedStory = GeneratedProfile["stories"][number];

function profileSourcePath() {
  const source = env.VSAT_PROFILE_SOURCE ?? "data/futon-profile.json";
  return path.resolve(cwd(), source);
}

function readProfile() {
  const sourcePath = profileSourcePath();
  const rawProfile = JSON.parse(readFileSync(sourcePath, "utf8"));
  const profile = GeneratedProfileModel.parse(rawProfile);

  return { profile, sourcePath };
}

function expectMapValue<K, V>(map: Map<K, V>, key: K, description: string) {
  const value = map.get(key);

  if (value === undefined) {
    throw new Error(`Unknown ${description}: ${String(key)}`);
  }

  return value;
}

function sceneKey(storyRef: string, sceneRef: string) {
  return `${storyRef}:${sceneRef}`;
}

async function main() {
  const {
    log,
    database: { db },
    repositoryStory,
    repositoryStoryLink,
  } = getEnvironment<
    App.WithLog &
      App.WithDatabase &
      App.WithStoryRepository &
      App.WithStoryLinkRepository
  >();

  const { profile, sourcePath } = readProfile();
  const authorByRef = new Map<string, { id: number; name: string }>();
  const storyIdByRef = new Map<string, number>();
  const sceneIdByStoryAndRef = new Map<string, number>();

  log.info(
    {
      sourcePath,
      profile: profile.profile,
      authors: profile.authors.length,
      stories: profile.stories.length,
      scenes: profile.stories.reduce(
        (count, story) => count + story.scenes.length,
        0,
      ),
      storyLinks: profile.storyLinks.length,
    },
    "Seeding generated VSAT profile",
  );

  try {
    for (const authorProfile of profile.authors) {
      const author = await db
        .insertInto("author")
        .values({
          name: authorProfile.name,
          email: authorProfile.email,
        })
        .onConflict((oc) =>
          oc.column("email").doUpdateSet({
            name: authorProfile.name,
            email: authorProfile.email,
          }),
        )
        .returningAll()
        .executeTakeFirstOrThrow();

      authorByRef.set(authorProfile.ref, {
        id: author.id,
        name: author.name,
      });
    }

    for (const storyProfile of profile.stories) {
      const author = expectMapValue(
        authorByRef,
        storyProfile.authorRef,
        "authorRef",
      );

      const story = await repositoryStory.saveStory({
        title: storyProfile.title,
        author,
        scenes: storyProfile.scenes.map((sceneProfile) => ({
          title: sceneProfile.title,
          content: sceneProfile.content,
          isOpeningScene: sceneProfile.isOpeningScene,
          image: sceneProfile.image ?? null,
          audio: sceneProfile.audio ?? null,
        })),
      });

      storyIdByRef.set(storyProfile.ref, story.id);
      mapSceneRefs(storyProfile, story.scenes, sceneIdByStoryAndRef);

      if (storyProfile.publish) {
        const result = await repositoryStory.publishStory(story.id);
        if (result.kind !== "published") {
          throw new Error(
            `Unable to publish generated story "${storyProfile.ref}": ${result.reason}`,
          );
        }
      }
    }

    for (const storyLinkProfile of profile.storyLinks) {
      const fromStoryId = expectMapValue(
        storyIdByRef,
        storyLinkProfile.fromStoryRef,
        "fromStoryRef",
      );
      const toStoryId = expectMapValue(
        storyIdByRef,
        storyLinkProfile.toStoryRef,
        "toStoryRef",
      );
      const createdBy = expectMapValue(
        authorByRef,
        storyLinkProfile.createdByAuthorRef,
        "createdByAuthorRef",
      ).id;

      const toSceneId = storyLinkProfile.toSceneRef
        ? expectMapValue(
            sceneIdByStoryAndRef,
            sceneKey(storyLinkProfile.toStoryRef, storyLinkProfile.toSceneRef),
            "toSceneRef",
          )
        : null;

      const storyLink = await repositoryStoryLink.createStoryLink({
        fromStoryId,
        toStoryId,
        toSceneId,
        toPageNumber: storyLinkProfile.toPageNumber ?? null,
        linkType: storyLinkProfile.linkType,
        rationale: storyLinkProfile.rationale,
        createdBy,
      });

      if (storyLinkProfile.vote) {
        await repositoryStoryLink.voteOnStoryLink({
          linkId: storyLink.id,
          userId: createdBy,
          vote: storyLinkProfile.vote,
        });
      }
    }

    log.info(
      {
        profile: profile.profile,
        authors: authorByRef.size,
        stories: storyIdByRef.size,
        scenes: sceneIdByStoryAndRef.size,
        storyLinks: profile.storyLinks.length,
      },
      "Seeded generated VSAT profile",
    );
    await db.destroy();
    exit(0);
  } catch (err) {
    log.error({ err }, "Error seeding generated VSAT profile");
    await db.destroy();
    exit(1);
  }
}

function mapSceneRefs(
  storyProfile: GeneratedStory,
  scenes: ReadonlyArray<{ id: number }>,
  sceneIdByStoryAndRef: Map<string, number>,
) {
  scenes.forEach((scene, index) => {
    const sceneProfile = storyProfile.scenes[index];
    if (sceneProfile) {
      sceneIdByStoryAndRef.set(
        sceneKey(storyProfile.ref, sceneProfile.ref),
        scene.id,
      );
    }
  });
}

main();

import pg from "pg";

import loadConfig from "../../environment/config.js";
import getEnvironment from "../../environment/getEnvironment.js";
import createKysely from "../createKysely.js";
import type { DatabaseVSP } from "./schemaVsp.js";

/** Run the database import VSP into VSAT. */
async function main() {
  const { database: dbConfig } = loadConfig();

  const {
    log,
    database: { db: dbVsat },
    repositoryStory,
  } = getEnvironment<
    App.WithLog & App.WithDatabase & App.WithStoryRepository
  >();

  if (!dbConfig.import) {
    log.error("Cannot import VSP into VSAT: configuration is missing");
    process.exit(1);
  }

  const connectionPoolVsp = new pg.Pool({
    connectionString: dbConfig.import.connectionString,
  });

  const dbVsp = createKysely<DatabaseVSP>(
    log.child({ component: "db-VSP" }),
    dbConfig.import.log,
    connectionPoolVsp,
  );

  log.info(
    {
      vsp: dbConfig.import.connectionString,
      vsat: dbConfig.connectionString,
    },
    "Started importing VSP into VSAT",
  );

  const storiesToBePublished: number[] = [];

  log.debug("Importing authors");
  const authorsVsp = await dbVsp.selectFrom("author").selectAll().execute();
  await Promise.all(
    authorsVsp.map((authorVsp) =>
      dbVsat
        .insertInto("author")
        .values(authorVsp)
        .onConflict((oc) => oc.doNothing())
        .execute(),
    ),
  );

  log.debug("Importing stories");
  const storiesVsp = await dbVsp.selectFrom("story").selectAll().execute();
  await Promise.all(
    storiesVsp.map((storyVsp) => {
      if (storyVsp.published) {
        storiesToBePublished.push(storyVsp.id);
      }

      return dbVsat
        .insertInto("story")
        .values({
          id: storyVsp.id,
          title: storyVsp.title,
        })
        .onConflict((oc) => oc.doNothing())
        .execute();
    }),
  );

  log.debug("Importing author to story mapping");
  const authorToStoryVsp = await dbVsp
    .selectFrom("authorToStory")
    .selectAll()
    .execute();
  await Promise.all(
    authorToStoryVsp.map((a2sVsp) =>
      dbVsat
        .insertInto("authorToStory")
        .values({
          authorId: a2sVsp.authorId,
          storyId: a2sVsp.storyId,
        })
        .onConflict((oc) => oc.doNothing())
        .execute(),
    ),
  );

  log.debug("Importing images");
  const imagesVsp = await dbVsp.selectFrom("image").selectAll().execute();
  await Promise.all(
    imagesVsp.map((imageVsp) =>
      dbVsat
        .insertInto("image")
        .values(imageVsp)
        .onConflict((oc) => oc.doNothing())
        .execute(),
    ),
  );

  log.debug("Importing audio");
  const audiosVsp = await dbVsp.selectFrom("audio").selectAll().execute();
  await Promise.all(
    audiosVsp.map((audioVsp) =>
      dbVsat
        .insertInto("audio")
        .values(audioVsp)
        .onConflict((oc) => oc.doNothing())
        .execute(),
    ),
  );

  log.debug("Importing scenes");
  const scenesVsp = await dbVsp.selectFrom("scene").selectAll().execute();
  await Promise.all(
    scenesVsp.map((sceneVsp) =>
      dbVsat
        .insertInto("scene")
        .values(sceneVsp)
        .onConflict((oc) => oc.doNothing())
        .execute()
        .catch((err) => {
          log.warn({ err, scene: sceneVsp }, "Error inserting scene");
        }),
    ),
  );

  log.debug("Publishing %d stories", storiesToBePublished.length);

  await Promise.all(
    storiesToBePublished.map((storyId) =>
      repositoryStory.publishStory(storyId),
    ),
  );

  log.info("Completed importing VSP into VSAT");

  await dbVsp.destroy();
  await dbVsat.destroy();

  process.exit(0);
}

main();

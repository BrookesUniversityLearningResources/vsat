import getEnvironment from "../../environment/getEnvironment.js";

/** A `main` program to seed the database with some stories. */
async function main() {
  const {
    log,
    database: { db },
    repositoryStory,
  } = getEnvironment<
    App.WithLog & App.WithDatabase & App.WithStoryRepository
  >();

  log.info("Seeding database");

  try {
    const author = await db
      .insertInto("author")
      .values({
        name: "Cicero",
        email: "cicero@rome.gov",
      })
      .returningAll()
      .onConflict((oc) =>
        oc
          .column("email")
          .doUpdateSet({ name: "Cicero", email: "cicero@rome.gov" }),
      )
      .executeTakeFirstOrThrow();

    const firstStory = await repositoryStory.saveStory({
      title: "Varro",
      author,
      scenes: [
        {
          title: "Introduction",
          content: "# A Heading\n\nSome content...\n",
          isOpeningScene: true,
          image: {
            url: "https://res.cloudinary.com/hp6ok6fmb/image/upload/v1740576161/341-872.jpg",
            thumbnailUrl:
              "https://res.cloudinary.com/hp6ok6fmb/image/upload/w_288,h_192/v1740576161/341-872.jpg",
          },
        },
      ],
    });

    await repositoryStory.publishStory(firstStory.id);

    const secondStory = await repositoryStory.saveStory({
      title: "Consolatio",
      author,
      scenes: [
        {
          title: "Introduction",
          content: "# A Heading\n\nSome content...\n",
          isOpeningScene: true,
          image: {
            url: "https://res.cloudinary.com/hp6ok6fmb/image/upload/v1740576161/341-872.jpg",
            thumbnailUrl:
              "https://res.cloudinary.com/hp6ok6fmb/image/upload/w_288,h_192/v1740576161/341-872.jpg",
          },
        },
      ],
    });

    await repositoryStory.publishStory(secondStory.id);
    await repositoryStory.featurePublishedStory(secondStory.id);

    const thirdStory = await repositoryStory.saveStory({
      title: "De Fato",
      author,
      scenes: [
        {
          title: "Introduction",
          content: "# A Heading\n\nSome content...\n",
          isOpeningScene: true,
          image: {
            url: "https://res.cloudinary.com/hp6ok6fmb/image/upload/v1740576161/341-872.jpg",
            thumbnailUrl:
              "https://res.cloudinary.com/hp6ok6fmb/image/upload/w_288,h_192/v1740576161/341-872.jpg",
          },
        },
      ],
    });

    await repositoryStory.publishStory(thirdStory.id);
    await repositoryStory.featurePublishedStory(thirdStory.id);

    log.info("Seeded database");
    process.exit(1);
  } catch (err) {
    log.error({ err }, "Error seeding database");
  }
}

main();

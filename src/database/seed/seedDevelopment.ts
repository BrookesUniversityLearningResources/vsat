import getEnvironment from "../../environment/getEnvironment.js";

/** A `main` program to seed the database with some stories. */
async function main() {
  const {
    log,
    database: { db },
    repositoryStory,
    repositoryStoryLink,
  } = getEnvironment<
    App.WithLog & App.WithDatabase & App.WithStoryRepository & App.WithStoryLinkRepository
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

    const createStory = async (
      title: string,
      scenes: {
        title: string;
        content: string;
        isOpeningScene: boolean;
      }[],
    ) => {
      const story = await repositoryStory.saveStory({
        title,
        author,
        scenes: scenes.map((scene) => ({
          ...scene,
          image: {
            url: "https://res.cloudinary.com/hp6ok6fmb/image/upload/v1740576161/341-872.jpg",
            thumbnailUrl:
              "https://res.cloudinary.com/hp6ok6fmb/image/upload/w_288,h_192/v1740576161/341-872.jpg",
          },
        })),
      });

      await repositoryStory.publishStory(story.id);
      return story;
    };

    const storyA = await createStory("Varro", [
      {
        title: "Opening the Library",
        content:
          "# Opening the Library\n\nA quiet hall opens before you, columns rising into half-light.\n\n## Listening Room\n\nThe shelves hold echoes of every reader who passed through.\n\n[Consult the maps](maps-of-memory)\n\n[Hear the voices](forum-of-voices)\n",
        isOpeningScene: true,
      },
      {
        title: "Maps of Memory",
        content:
          "# Maps of Memory\n\nLines cross in the atlas, tracing routes between forgotten cities.\n\n## Margins\n\nNotes emerge at the edges where scholars argued in centuries past.\n\n[Return to the hall](opening-the-library)\n\n[Join the forum](forum-of-voices)\n",
        isOpeningScene: false,
      },
      {
        title: "Forum of Voices",
        content:
          "# Forum of Voices\n\nA chorus of timelines speaks at once, each demanding attention.\n\n## Coda\n\nStories fold into one another until the boundaries dissolve.\n\n[Back to the maps](maps-of-memory)\n\n[Re-enter the library](opening-the-library)\n",
        isOpeningScene: false,
      },
    ]);

    const storyB = await createStory("Consolatio", [
      {
        title: "Arrival",
        content:
          "# Arrival\n\nA new cadence begins as the train pulls into the station.\n\n## Turnstile\n\nWe step through the gate into an unfamiliar warmth.\n\n[Walk to the garden](garden-of-letters)\n",
        isOpeningScene: true,
      },
      {
        title: "Garden of Letters",
        content:
          "# Garden of Letters\n\nLetters bloom into paths between the hedgerows, each one a confession.\n\n## Resting Place\n\nA pause between pages where the ink dries slowly.\n\n[Wait for nightfall](night-dialogue)\n\n[Return to the station](arrival)\n",
        isOpeningScene: false,
      },
      {
        title: "Night Dialogue",
        content:
          "# Night Dialogue\n\nQuestions drift into the dark and wait for something to answer them.\n\n## Afterglow\n\nLight returns with a reply that changes everything.\n\n[Revisit the garden](garden-of-letters)\n\n[Start over](arrival)\n",
        isOpeningScene: false,
      },
    ]);

    const storyC = await createStory("De Fato", [
      {
        title: "Threshold",
        content:
          "# Threshold\n\nThe choice is visible: two corridors, one lit, one dark.\n\n## First Thread\n\nA line begins to unspool from your pocket.\n\n[Take the detour](detour)\n\n[Skip ahead](convergence)\n",
        isOpeningScene: true,
      },
      {
        title: "Detour",
        content:
          "# Detour\n\nA fork in the pattern leads somewhere unexpected.\n\n## Hidden Room\n\nPages open unexpectedly, revealing a story within the story.\n\n[Return to the threshold](threshold)\n\n[Find the convergence](convergence)\n",
        isOpeningScene: false,
      },
      {
        title: "Convergence",
        content:
          "# Convergence\n\nThe threads return to a single point of clarity.\n\n## Final Mark\n\nA sign is left behind for whoever follows.\n\n[Retrace the detour](detour)\n\n[Begin again](threshold)\n",
        isOpeningScene: false,
      },
    ]);

    const storyD = await createStory("Platform Telescopes", [
      {
        title: "Platform",
        content:
          "# Platform\n\nA wide sky above the iron grating, stars just emerging.\n\n## Equipment Check\n\nThe dial glows green — the instrument is ready.\n\n[Look through the lens](zodiacal-light)\n\n[Scan the panorama](high-res-panorama)\n",
        isOpeningScene: true,
      },
      {
        title: "Zodiacal Light",
        content:
          "# Zodiacal Light\n\nDust turns into a halo around the ecliptic plane.\n\n## Telescope Notes\n\nThe log book fills with coordinates and small drawings.\n\n[Widen the view](high-res-panorama)\n\n[Return to the platform](platform)\n",
        isOpeningScene: false,
      },
      {
        title: "High-Res Panorama",
        content:
          "# High-Res Panorama\n\nA stitched horizon stretches from north to south.\n\n## Resolution\n\nDetail sharpens until you can see the dust between galaxies.\n\n[Zoom to zodiacal](zodiacal-light)\n\n[Step back](platform)\n",
        isOpeningScene: false,
      },
    ]);

    const storyE = await createStory("Atlas of Drift", [
      {
        title: "Departure",
        content:
          "# Departure\n\nAn archive lifts from the table, pages scattering.\n\n## Bearings\n\nCoordinates align with something half-remembered.\n\n[Enter the overlap](overlap-layer)\n",
        isOpeningScene: true,
      },
      {
        title: "Overlap Layer",
        content:
          "# Overlap Layer\n\nNew meanings assemble where two maps were placed on top of each other.\n\n## Shared Ground\n\nA small commons appears between the territories.\n\n[Find the return path](return-path)\n\n[Go back to departure](departure)\n",
        isOpeningScene: false,
      },
      {
        title: "Return Path",
        content:
          "# Return Path\n\nWe map the echoes of everywhere we have been.\n\n## Landing\n\nStories settle into the landscape like sediment.\n\n[Revisit the overlap](overlap-layer)\n\n[Start from departure](departure)\n",
        isOpeningScene: false,
      },
    ]);

    const storyF = await createStory("Harbor of Reasons", [
      {
        title: "Harbor",
        content:
          "# Harbor\n\nReasons arrive together on the morning tide.\n\n## Dockside\n\nArguments rest on the quay, waiting to be unpacked.\n\n[Examine the causes](causes)\n\n[Take shared action](shared-action)\n",
        isOpeningScene: true,
      },
      {
        title: "Causes",
        content:
          "# Causes\n\nPatterns take hold when you look at enough instances side by side.\n\n## Workshop\n\nWe shape responses from raw material and experience.\n\n[Move to action](shared-action)\n\n[Return to harbor](harbor)\n",
        isOpeningScene: false,
      },
      {
        title: "Shared Action",
        content:
          "# Shared Action\n\nA coordinated step forward, taken together.\n\n## Signal\n\nWe send the mark out across the water.\n\n[Review the causes](causes)\n\n[Back to the harbor](harbor)\n",
        isOpeningScene: false,
      },
    ]);

    const link1 = await repositoryStoryLink.createStoryLink({
      fromStoryId: storyA.id,
      toStoryId: storyB.id,
      toSceneId: storyB.scenes[1]?.id ?? null,
      toPageNumber: 2,
      linkType: "thematic",
      rationale: "Both stories treat memory as a cultivated space.",
      createdBy: author.id,
    });

    const link2 = await repositoryStoryLink.createStoryLink({
      fromStoryId: storyB.id,
      toStoryId: storyC.id,
      toSceneId: storyC.scenes[0]?.id ?? null,
      toPageNumber: 1,
      linkType: "contrast",
      rationale: "One story consoles while the other insists on choice.",
      createdBy: author.id,
    });

    const link3 = await repositoryStoryLink.createStoryLink({
      fromStoryId: storyC.id,
      toStoryId: storyD.id,
      toSceneId: storyD.scenes[2]?.id ?? null,
      toPageNumber: 3,
      linkType: "adjacency",
      rationale: "Threads and telescopes both trace convergences.",
      createdBy: author.id,
    });

    const link4 = await repositoryStoryLink.createStoryLink({
      fromStoryId: storyD.id,
      toStoryId: storyE.id,
      toSceneId: storyE.scenes[1]?.id ?? null,
      toPageNumber: 2,
      linkType: "causal",
      rationale: "Observation feeds the overlap layer.",
      createdBy: author.id,
    });

    const link5 = await repositoryStoryLink.createStoryLink({
      fromStoryId: storyE.id,
      toStoryId: storyF.id,
      toSceneId: storyF.scenes[2]?.id ?? null,
      toPageNumber: 3,
      linkType: "thematic",
      rationale: "Shared ground becomes shared action.",
      createdBy: author.id,
    });

    await repositoryStoryLink.voteOnStoryLink({
      linkId: link1.id,
      userId: author.id,
      vote: "accept",
    });

    await repositoryStoryLink.voteOnStoryLink({
      linkId: link2.id,
      userId: author.id,
      vote: "reject",
    });

    await repositoryStoryLink.voteOnStoryLink({
      linkId: link5.id,
      userId: author.id,
      vote: "accept",
    });

    await repositoryStoryLink.retireStoryLink({
      linkId: link4.id,
      userId: author.id,
    });

    // --- Stress-test story: looping Pitt Rivers adventure (8 scenes, 10 blockLinks, cycles) ---
    const storyG = await createStory("Pitt Rivers Adventure", [
      {
        title: "Marston Meadows Bridge",
        content:
          "# Marston Meadows Bridge\n\nDinosaurs? Where in the world....?\n\n[stomp](stomp)\n",
        isOpeningScene: true,
      },
      {
        title: "Stomp",
        content:
          "# Stomp\n\nGrandad inspects Darwin's work...\n\n[Look out behind you!](dinotastic)\n",
        isOpeningScene: false,
      },
      {
        title: "Dinotastic",
        content:
          "# Dinotastic\n\nBe careful! A T-Rex might eat you!\n\n[Check out the mammoth](hungry-mammoth)\n\n[Then again....](hidden-edmontosaurus)\n\n## Hidden Edmontosaurus\n\nThe Edmontosaurus is also hiding behind the text box.\n\n[Back](dinotastic)\n",
        isOpeningScene: false,
      },
      {
        title: "Hungry Mammoth",
        content:
          "# Hungry Mammoth\n\nMammoths were vegetarians. Darwin is less than impressed....\n\n[The anthropology hall](anthropology)\n",
        isOpeningScene: false,
      },
      {
        title: "Castle Hill",
        content:
          "# Castle Hill\n\nAt the summit of Oxford...\n\n[A bit of history...](well)\n",
        isOpeningScene: false,
      },
      {
        title: "Well",
        content:
          "# Well\n\n13th Century Well-ness?\n\n[To the castle prison](prison)\n",
        isOpeningScene: false,
      },
      {
        title: "Prison",
        content:
          "# Prison\n\nIs it a castle? Not for a long time! Prison-turned-museum-and-hotel now!\n\n[Back home](marston-meadows-bridge)\n",
        isOpeningScene: false,
      },
      {
        title: "Anthropology",
        content:
          "# Anthropology\n\nThe second Pitt Rivers hall/haul....\n\n[Off to Castle Hill](castle-hill)\n",
        isOpeningScene: false,
      },
    ]);

    // Inter-story links connecting the Pitt Rivers story to others
    const link6 = await repositoryStoryLink.createStoryLink({
      fromStoryId: storyG.id,
      toStoryId: storyA.id,
      toSceneId: storyA.scenes[1]?.id ?? null,
      toPageNumber: 1,
      linkType: "thematic",
      rationale: "Both stories explore institutional memory through physical spaces.",
      createdBy: author.id,
    });

    await repositoryStoryLink.voteOnStoryLink({
      linkId: link6.id,
      userId: author.id,
      vote: "accept",
    });

    const link7 = await repositoryStoryLink.createStoryLink({
      fromStoryId: storyD.id,
      toStoryId: storyG.id,
      toSceneId: storyG.scenes[4]?.id ?? null,
      toPageNumber: 1,
      linkType: "adjacency",
      rationale: "Telescopes and castle summits share an elevated vantage point.",
      createdBy: author.id,
    });

    const link8 = await repositoryStoryLink.createStoryLink({
      fromStoryId: storyG.id,
      toStoryId: storyC.id,
      toSceneId: storyC.scenes[2]?.id ?? null,
      toPageNumber: 1,
      linkType: "contrast",
      rationale: "The looping adventure contrasts with De Fato's linear convergence.",
      createdBy: author.id,
    });

    await repositoryStoryLink.voteOnStoryLink({
      linkId: link8.id,
      userId: author.id,
      vote: "accept",
    });

    // --- Linear story (3 scenes, simple forward chain) ---
    const storyH = await createStory("Linear Story", [
      {
        title: "Introduction",
        content:
          "# Introduction\n\nThis is the opening scene.\n\n[Middle](middle)\n",
        isOpeningScene: true,
      },
      {
        title: "Middle",
        content:
          "# Middle\n\nThis is the middle scene.\n\n[Last](end)\n",
        isOpeningScene: false,
      },
      {
        title: "End",
        content:
          "# End\n\nThis is the last scene.\n",
        isOpeningScene: false,
      },
    ]);

    // --- Busted story (3 scenes, dangling links to non-existent targets) ---
    const storyI = await createStory("Busted Story", [
      {
        title: "Introduction",
        content:
          "# Introduction\n\nThis is the opening scene.\n\n[Does not exist yet](room-001)\n",
        isOpeningScene: true,
      },
      {
        title: "Middle",
        content:
          "# Zorbash\n\nThis is the Zorbash scene.\n\n[Still does not exist yet](room-234)\n",
        isOpeningScene: false,
      },
      {
        title: "Chank",
        content:
          "# End\n\nThis is the Chank scene.\n",
        isOpeningScene: false,
      },
    ]);

    // Link the linear story into the constellation
    const link9 = await repositoryStoryLink.createStoryLink({
      fromStoryId: storyH.id,
      toStoryId: storyB.id,
      toSceneId: null,
      toPageNumber: null,
      linkType: "adjacency",
      rationale: "A simple linear narrative sits alongside the consoling one.",
      createdBy: author.id,
    });

    await repositoryStoryLink.voteOnStoryLink({
      linkId: link9.id,
      userId: author.id,
      vote: "accept",
    });

    log.info(
      { storyIds: [storyA.id, storyB.id, storyC.id, storyD.id, storyE.id, storyF.id, storyG.id, storyH.id, storyI.id] },
      "Seeded database",
    );
    process.exit(0);
  } catch (err) {
    log.error({ err }, "Error seeding database");
  }
}

main();

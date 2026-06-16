# VSAT Profile Maker

This is the practical contract for generating a VSAT dataset/profile. A profile
should be generated as structured data first, then loaded by a small importer or
seed script that calls the existing repositories or writes the same tables in the
same order.

## Profile Shape

Use stable string refs in generated data. Let the loader map those refs to
database IDs.

```json
{
  "profile": "futon",
  "authors": [
    {
      "ref": "agent",
      "name": "FUTON Agent",
      "email": "futon-agent@localhost"
    }
  ],
  "stories": [
    {
      "ref": "repo-map",
      "title": "Repository Map",
      "authorRef": "agent",
      "publish": true,
      "scenes": [
        {
          "ref": "overview",
          "title": "Overview",
          "isOpeningScene": true,
          "image": {
            "url": "https://example.test/image.jpg",
            "thumbnailUrl": "https://example.test/thumb.jpg"
          },
          "content": "# Overview\n\nA useful starting point.\n\n[Open the module list](modules)\n"
        },
        {
          "ref": "modules",
          "title": "Modules",
          "isOpeningScene": false,
          "image": {
            "url": "https://example.test/modules.jpg",
            "thumbnailUrl": "https://example.test/modules-thumb.jpg"
          },
          "content": "# Modules\n\nThe codebase divides into a few working areas.\n\n[Return to overview](overview)\n"
        }
      ]
    }
  ],
  "storyLinks": [
    {
      "fromStoryRef": "repo-map",
      "toStoryRef": "another-story",
      "toSceneRef": "opening",
      "toPageNumber": 1,
      "linkType": "thematic",
      "rationale": "Both stories explain how the system is navigated.",
      "createdByAuthorRef": "agent",
      "vote": "accept"
    }
  ]
}
```

## Stories And Scenes

A story has one author, a title, and one or more scenes.

A scene has:

* `title`
* `content`
* `isOpeningScene`
* `image.url` and `image.thumbnailUrl`
* optional `audio.url`

Every publishable scene needs at least one image and at least one page of
content. Prefer exactly one opening scene per story.

## Scene Content Format

Scene content is a small line-oriented Markdown-like format.

```md
# Page Heading

Plain text paragraph.

[Visible link text](target-page)

# Explicit Page | explicit-page-anchor

Another page in the same scene.
```

Rules:

* A page starts with `# Heading`.
* A page can use an explicit anchor with `# Heading | anchor-name`.
* Link targets are normalized to lowercase with spaces converted to hyphens.
* Anonymous heading anchors are derived from heading text, so `# Garden Path`
  becomes `garden-path`.
* Scene titles are also link targets, so a scene titled `Garden Path` can be
  linked as `garden-path`.
* Keep anchors and link targets simple: letters, spaces, and hyphens are the
  safest current subset.
* Links use `[text](target-anchor)`.
* Links must resolve to a page/scene target inside the same story for a clean
  publish.
* Plain text or links before the first heading will fail parsing.

## VSATLATARIUM Links

Inline scene links move around inside a story. VSATLATARIUM links connect one
story to another.

Supported `linkType` values:

* `adjacency`
* `thematic`
* `causal`
* `contrast`

A generated link should include:

* source story ref
* destination story ref
* optional destination scene ref
* optional destination page number
* link type
* rationale
* creator author ref

Links are created as `proposed`. Add an `accept` vote when the generated profile
should treat the link as accepted.

## Loader Protocol

A loader should do this after selecting or creating the target profile database:

1. Run VSAT migrations.
2. Upsert authors by email.
3. Save stories and scenes, mapping generated refs to database IDs.
4. Publish stories marked `publish: true`.
5. Create VSATLATARIUM story links after all story IDs are known.
6. Apply generated votes, pilots, or interpretive notes after links/stories
   exist.

For direct SQL loading, preserve this dependency order:

1. `author`
2. `story`
3. `author_to_story`
4. `image`
5. `audio`
6. `scene`
7. `story_published`
8. `story_link`
9. `link_vote`
10. `pilot`, `pilot_story`, `interpretive_note`

The safer path is to implement the loader as TypeScript and use
`repositoryStory.saveStory`, `repositoryStory.publishStory`, and
`repositoryStoryLink.createStoryLink`, because that keeps generated datasets
inside the same validation path as hand-authored VSAT content.

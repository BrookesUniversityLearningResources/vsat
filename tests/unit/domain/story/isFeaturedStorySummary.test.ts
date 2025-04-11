import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  type PublishedStorySummary,
  isFeaturedStorySummary,
} from "@domain/index";

describe("isFeaturedStorySummary", () => {
  const now: Readonly<Date> = new Date();

  test("given a published story summary that is not featured" +
    " when the isFeaturedStorySummary function is applied" +
    " then the result is false", () => {
    const story: PublishedStorySummary = {
      id: 1,
      author: { id: 2, name: "Ovid" },
      imageUrl: null,
      title: "Metamorphoses",
      publishedOn: now,
      featured: null,
    };

    assert.equal(isFeaturedStorySummary(story), false);
  });

  test("given a published story summary that is not featured" +
    " when the isFeaturedStorySummary function is applied" +
    " then the result is false", () => {
    const story: PublishedStorySummary = {
      id: 1,
      author: { id: 2, name: "Ovid" },
      imageUrl: null,
      title: "Metamorphoses",
      publishedOn: now,
      featured: {
        active: false,
        on: null,
      },
    };

    assert.equal(isFeaturedStorySummary(story), false);
  });

  test("given a published story summary that is actively featured" +
    " but the featured on date is null " +
    " when the isFeaturedStorySummary function is applied" +
    " then the result is false", () => {
    const story: PublishedStorySummary = {
      id: 1,
      author: { id: 2, name: "Ovid" },
      imageUrl: null,
      title: "Metamorphoses",
      publishedOn: now,
      featured: {
        active: true,
        on: null,
      },
    };

    assert.equal(isFeaturedStorySummary(story), false);
  });

  test("given a published story summary that is actively featured" +
    " and the featured on date is not null " +
    " when the isFeaturedStorySummary function is applied" +
    " then the result is true", () => {
    const story: PublishedStorySummary = {
      id: 1,
      author: { id: 2, name: "Ovid" },
      imageUrl: null,
      title: "Metamorphoses",
      publishedOn: now,
      featured: {
        active: true,
        on: now,
      },
    };

    assert.equal(isFeaturedStorySummary(story), true);
  });
});

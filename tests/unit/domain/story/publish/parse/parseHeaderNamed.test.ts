import assert from "node:assert/strict";
import { describe, test } from "node:test";

import parseHeaderNamed from "@domain/story/publish/parse/parseHeaderNamed";

describe("parseHeaderNamed", () => {
  test(
    "given '#Introduction|introduction' then the header is 'Introduction'" +
      " and the name is explicitly 'introduction'",
    () => {
      const input = "#Introduction|introduction";

      const result = parseHeaderNamed()(input, 1);

      assert.equal(result.kind, "headerNamed");
      assert.equal(result.text, "Introduction");
      assert.equal(result.name, "introduction");
    },
  );

  test(
    "given '#Introduction|introduction-2nd' then the header is 'Introduction'" +
      " and the name is explicitly 'introduction-2nd'",
    () => {
      const input = "#Introduction|introduction-2nd";

      const result = parseHeaderNamed()(input, 1);

      assert.equal(result.kind, "headerNamed");
      assert.equal(result.text, "Introduction");
      assert.equal(result.name, "introduction-2nd");
    },
  );

  test(
    "given '#Introduction  |  introduction-2nd  ' then the header is 'Introduction'" +
      " and the name is explicitly 'introduction-2nd'",
    () => {
      const input = "#Introduction  |  introduction-2nd  ";

      const result = parseHeaderNamed()(input, 1);

      assert.equal(result.kind, "headerNamed");
      assert.equal(result.text, "Introduction");
      assert.equal(result.name, "introduction-2nd");
    },
  );

  test(
    "given '#Introduction|a introduction' then the header is 'Introduction'" +
      " and the name is explicitly 'a-introduction'",
    () => {
      const input = "#Introduction|a introduction";

      const result = parseHeaderNamed()(input, 1);

      assert.equal(result.kind, "headerNamed");
      assert.equal(result.text, "Introduction");
      assert.equal(result.name, "a-introduction");
    },
  );

  test(
    "given '#Introduction|an           introduction to   ' then the header is 'Introduction'" +
      " and the name is explicitly 'an-introduction-to'",
    () => {
      const input = "#Introduction|an           introduction to   ";

      const result = parseHeaderNamed()(input, 1);

      assert.equal(result.kind, "headerNamed");
      assert.equal(result.text, "Introduction");
      assert.equal(result.name, "an-introduction-to");
    },
  );
});

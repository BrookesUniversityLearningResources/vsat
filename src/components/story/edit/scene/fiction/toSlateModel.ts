import type { Descendant, Element } from "slate";

import { ErrorCodes } from "@domain/error/errorCode";
import type { PersistentScene } from "@domain/index";
import parse from "@domain/story/publish/parse/parse";
import { parseScene, type ParseError } from "@domain/story/publish/parseStory";
import isLineOrientedError from "@domain/story/publish/support/isLineOrientedError";

export default function toSlateModel(scene: PersistentScene): Descendant[] {
  const result = parseScene(scene);

  switch (result.kind) {
    case "sceneParsed": {
      /*
       * The content of the scene has, at the very least, parsed successfully.
       *
       * It may still have errors in it — semantic or syntactic — so we still
       * need to account for those but at least those lines with errors parsed.
       */
      const descendants = Object.values(result.scene.pages).reduce(
        (model, page) => {
          for (const block of page.content) {
            switch (block.kind) {
              case "blockHeading": {
                model.push(headingBlock(block.text, block.link));
                break;
              }
              case "blockPlaintext": {
                model.push(plaintextBlock(block.text));
                break;
              }
              case "blockLink": {
                model.push(linkBlock(block.text, block.link));
                break;
              }
              default: {
                ((_: never) => _)(block);
              }
            }
          }
          return model;
        },
        [] as Descendant[],
      );

      if (result.errors.length === 0) {
        return descendants;
      }

      // fold any line-oriented errors into the model
      return result.errors
        .filter(isLineOrientedError)
        .reduce((model, error) => {
          model.splice(
            error.line.number,
            0,
            errorBlock(error.line.text, error),
          );
          return model;
        }, descendants);
    }

    case "sceneFailedToParse": {
      /*
       * The scene failed to parse as a whole so there is at least one larger
       * structural error.
       *
       * Let's build up the model by parsing each line individually, thereby
       * surfacing each error on a line-by-line basis.
       */
      const lines = scene.content.split("\n");

      return lines.reduce((model, line, index) => {
        const lineResult = parse(line, index + 1 /* lines are 1-based */);

        switch (lineResult.kind) {
          case "nothing":
          case "emptyLine": {
            model.push(emptyBlock());
            break;
          }
          case "plaintext": {
            model.push(plaintextBlock(lineResult.text));
            break;
          }
          case "link": {
            model.push(linkBlock(lineResult.text, lineResult.link));
            break;
          }
          case "headerNamed": {
            model.push(headingBlock(lineResult.text, lineResult.name));
            break;
          }
          case "headerAnonymous": {
            model.push(headingBlock(lineResult.text));
            break;
          }
          case "error": {
            model.push(
              errorBlock(lineResult.line.text, {
                errorCode: lineResult.errorCode || ErrorCodes.Error,
                reason: lineResult.message,
              }),
            );
            break;
          }
          default: {
            ((_: never) => _)(lineResult);
          }
        }
        return model;
      }, [] as Descendant[]);
    }

    default: {
      ((_: never) => _)(result);
      /*
       * This code path should never run because we're in the "failed the
       * exhaustiveness check" block -- so the error must have surfaced at
       * compile time -- but let's just display the scene content raw in the
       * case of something degenerate.
       */
      return [plaintextBlock(scene.content)];
    }
  }
}

export function emptyBlock(): Element {
  return plaintextBlock("");
}

export function plaintextBlock(text: string): Element {
  return {
    type: "blockPlaintext",
    children: [{ text }],
  };
}

export function headingBlock(text: string, link?: string): Element {
  if (link) {
    return {
      type: "blockHeading",
      children: [{ text: `# ${text} | ${link}` }],
    };
  }

  return {
    type: "blockHeading",
    children: [{ text: `# ${text}` }],
  };
}

export function linkBlock(text: string, link: string): Element {
  return {
    type: "blockLink",
    children: [{ text: `[${text}](${link})` }],
  };
}

export function errorBlock(text: string, error: ParseError): Element {
  return {
    type: "blockError",
    children: [{ text }],
    error: {
      code: error.errorCode,
      message: error.reason,
    },
  };
}

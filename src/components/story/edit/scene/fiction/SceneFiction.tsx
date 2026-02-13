/** biome-ignore-all assist/source/organizeImports: don't care */
import { useMutation } from "@tanstack/react-query";
import {
  type FC,
  type KeyboardEventHandler,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { createEditor, Editor, next, Node, Transforms } from "slate";
import { withHistory } from "slate-history";
import { Editable, Slate, withReact } from "slate-react";

import { ErrorCodes } from "@domain/error/errorCode";
import { ErrorCodedError } from "@domain/error/ErrorCodedError";
import type { PersistentScene, PersistentStory } from "@domain/index";
import unsupported from "@domain/story/client/unsupportedResult";
import parse from "@domain/story/publish/parse/parse";
import parseStory, { type ParsedStory } from "@domain/story/publish/parseStory";
import validateHeader from "@domain/story/publish/validate/links/validateHeader";
import debounce from "@util/function/debounce";

import {
  type WithDeleteScene,
  type WithFeedback,
  type WithSaveSceneContent,
  useEnvironment,
} from "../../context/ClientContext";
import type { OnSceneChanged } from "../types";
import Block from "./block/Block";
import getContent from "./getContent";
import Toolbar from "./Toolbar";
import toSlateModel, { emptyBlock } from "./toSlateModel";

import styles from "./SceneFiction.module.css";

type SceneFictionProps = {
  story: PersistentStory;
  scene: PersistentScene;
  onSceneChanged: OnSceneChanged;
};

const SceneFiction: FC<SceneFictionProps> = ({
  story,
  scene,
  onSceneChanged,
}) => {
  const { t } = useTranslation();

  const { deleteScene, saveSceneContent, feedback } = useEnvironment<
    WithSaveSceneContent & WithDeleteScene & WithFeedback
  >();

  const [editor] = useState(() => withReact(withHistory(createEditor())));

  const [editorState] = useState(toSlateModel(scene));

  const parsedStory = useMemo<ParsedStory | undefined>(() => {
    const psr = parseStory(story);
    if (psr.kind === "storyFailedToParse") {
      return undefined;
    }
    return psr.story;
  }, [story]);

  const saveTheSceneContent = useMutation<string, Error, string>({
    mutationFn: (content) =>
      saveSceneContent({ storyId: story.id, sceneId: scene.id, content }).then(
        (result) => {
          switch (result.kind) {
            case "sceneContentSaved": {
              return content;
            }

            case "error": {
              return Promise.reject(
                new ErrorCodedError(
                  result.error.errorCode,
                  "Error saving scene content",
                  { cause: result.error.context },
                ),
              );
            }

            default: {
              return unsupported(result);
            }
          }
        },
      ),
    onError: feedback.notify.error,
    onSuccess: (content) => {
      onSceneChanged({
        kind: "contentChanged",
        id: scene.id,
        content,
      });
    },
  });

  const onSave = () => {
    saveTheSceneContent.mutate(getContent(editor.children));
  };

  const deleteTheScene = useMutation<unknown, Error, PersistentScene["id"]>({
    mutationFn: (sceneId) =>
      deleteScene({ storyId: story.id, sceneId }).then((result) => {
        switch (result.kind) {
          case "sceneDeleted":
            return;
          case "error":
            return Promise.reject(result.error);
          default:
            return unsupported(result);
        }
      }),
    onError: feedback.notify.error,
    onSuccess: () =>
      onSceneChanged({
        kind: "sceneDeleted",
        id: scene.id,
      }),
  });

  const onDeleteScene = async () => {
    const result = await feedback.dialog.yesNo(
      "scene.action.delete-scene.confirm.prompt",
    );

    if (result.isConfirmed) {
      deleteTheScene.mutate(scene.id);
    }
  };

  const renderBlock = useCallback(Block, []);

  const onKeyDown: KeyboardEventHandler = debounce((e) => {
    if (!editor.selection) {
      return next(editor);
    }

    if (e.key === "Enter") {
      e.preventDefault();

      // add an empty block for the new line
      Transforms.insertNodes(editor, emptyBlock(), {
        at: editor.selection,
      });
      // and move the cursor to that new line
      Transforms.move(editor, {
        distance: 1,
        unit: "word",
      });
    }

    return next(editor);
  });

  const onKeyUp: KeyboardEventHandler = debounce(() => {
    if (!editor.selection) {
      return next(editor);
    }

    // grab the current line
    const currentNode = Editor.node(editor, editor.selection, { depth: 1 });

    // and grab that line's text
    const text = Node.string(currentNode[0]).trim();

    if (text.length > 0) {
      // parse the line to see what kind of line it is
      const parseResult = parse(text, 1);

      switch (parseResult.kind) {
        case "link": {
          Transforms.setNodes(editor, { type: "blockLink" });
          break;
        }
        case "headerNamed":
        case "headerAnonymous": {
          if (parsedStory) {
            // the header parses syntactically but it may be semantically
            // "wrong" such as being a non-unique link target
            const validation = validateHeader(parsedStory)(parseResult);
            if (validation.kind === "invalid") {
              Transforms.setNodes(editor, {
                type: "blockError",
                error: {
                  code: validation.errorCode || ErrorCodes.Error,
                  message: validation.message,
                },
              });
              break;
            }
          }

          Transforms.setNodes(editor, { type: "blockHeading" });
          break;
        }
        case "error": {
          Transforms.setNodes(editor, {
            type: "blockError",
            error: {
              code: parseResult.errorCode || ErrorCodes.Error,
              message: parseResult.message,
            },
          });
          break;
        }

        case "nothing":
        case "emptyLine":
        case "plaintext": {
          // nothing to do for these cases
          break;
        }
      }
    }

    return next(editor);
  });

  return (
    <div className={styles.sceneFiction}>
      <Slate editor={editor} initialValue={editorState}>
        <Toolbar>
          <button
            type="button"
            onClick={onDeleteScene}
            disabled={deleteTheScene.isPending}
          >
            <img
              src="/images/delete.svg"
              alt={t("scene.action.delete-scene.label")}
              title={t("scene.action.delete-scene.label")}
            />
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saveTheSceneContent.isPending}
          >
            <img
              src="/images/save.svg"
              alt={t("scene.action.save.label")}
              title={t("scene.action.save.label")}
            />
          </button>
        </Toolbar>
        <Editable
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          className={styles.editor}
          renderElement={renderBlock}
          readOnly={saveTheSceneContent.isPending}
        />
      </Slate>
    </div>
  );
};

export default SceneFiction;

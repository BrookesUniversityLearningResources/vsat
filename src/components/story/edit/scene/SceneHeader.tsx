import type { FC } from "react";
import { useTranslation } from "react-i18next";

import styles from "./SceneHeader.module.css";

import InlineTextInput, {
  type OnChanged,
} from "@components/input/InlineTextInput/InlineTextInput.js";

import type { PersistentScene } from "../../../../domain/index.js";
import type { StoryMode } from "../../../../domain/story/publish/types.js";

export type SceneHeaderProps = {
  title: PersistentScene["title"];
  onTitleChanged: (title: string) => void;
  linkInfo?: {
    count: number;
    pages: number[];
  };
  onProposeLink?: () => void;
  // null = this scene follows the story's mode
  mode?: StoryMode | null;
  storyMode?: StoryMode;
  onModeChanged?: (mode: StoryMode | null) => void;
  modeSaving?: boolean;
};

const MODE_LABEL: Record<StoryMode, string> = { "360": "360°", "2d": "2D" };

const SceneHeader: FC<SceneHeaderProps> = ({
  title,
  onTitleChanged,
  linkInfo,
  onProposeLink,
  mode = null,
  storyMode = "360",
  onModeChanged,
  modeSaving = false,
}) => {
  const { t } = useTranslation();

  const onChanged: OnChanged = ({ value }) => {
    onTitleChanged(value);
  };

  return (
    <div className={styles.header}>
      <InlineTextInput
        onChanged={onChanged}
        initialValue={title}
        i18n={{
          editing: {
            labelName: t("scene.title.field.label"),
            labelSave: t("scene.title.action.save-title"),
            labelClose: t("common.close"),
          },
          notEditing: { labelEdit: t("scene.title.action.edit-title") },
        }}
        inputAttributes={{
          required: true,
          minLength: 3,
          maxLength: 50,
        }}
      >
        <h2>{t("scene.title.label", { title })}</h2>
      </InlineTextInput>
      <div className={styles.linkMeta}>
        {linkInfo?.count ? (
          <span className={styles.linkBadge}>
            {linkInfo.count} link{linkInfo.count === 1 ? "" : "s"}
          </span>
        ) : (
          <span className={styles.linkBadgeMuted}>No links</span>
        )}
        {linkInfo?.pages?.length ? (
          <span className={styles.pageBadge}>
            Pages {linkInfo.pages.sort((a, b) => a - b).join(", ")}
          </span>
        ) : null}
        {onModeChanged && (
          <fieldset
            className={styles.modeGroup}
            aria-label="How readers see this scene"
            title="How readers see this scene. Readers can't switch; a story can mix 360° and 2D scenes."
          >
            {(
              [
                [null, `Story (${MODE_LABEL[storyMode]})`],
                ["360", MODE_LABEL["360"]],
                ["2d", MODE_LABEL["2d"]],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value ?? "story"}
                type="button"
                className={styles.modeOption}
                aria-pressed={mode === value}
                disabled={modeSaving || mode === value}
                onClick={() => onModeChanged(value)}
              >
                {label}
              </button>
            ))}
          </fieldset>
        )}
        {onProposeLink && (
          <button
            type="button"
            className={styles.proposeLink}
            onClick={onProposeLink}
          >
            Propose link from here
          </button>
        )}
      </div>
    </div>
  );
};

export default SceneHeader;

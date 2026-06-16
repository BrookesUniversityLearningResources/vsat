import type { FC } from "react";
import { useTranslation } from "react-i18next";

import styles from "./SceneHeader.module.css";

import InlineTextInput, {
  type OnChanged,
} from "@components/input/InlineTextInput/InlineTextInput.js";

import type { PersistentScene } from "../../../../domain/index.js";

export type SceneHeaderProps = {
  title: PersistentScene["title"];
  onTitleChanged: (title: string) => void;
  linkInfo?: {
    count: number;
    pages: number[];
  };
  onProposeLink?: () => void;
};

const SceneHeader: FC<SceneHeaderProps> = ({
  title,
  onTitleChanged,
  linkInfo,
  onProposeLink,
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

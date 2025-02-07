import type { FC, PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { HistoryEditor } from "slate-history";
import { useSlate } from "slate-react";

import styles from "./Toolbar.module.css";

type ToolbarProps = PropsWithChildren;

const Toolbar: FC<ToolbarProps> = ({ children: otherButtons }) => {
  const { t } = useTranslation();

  const editor = useSlate();

  const defaultButtons = (() => {
    if (!HistoryEditor.isHistoryEditor(editor)) {
      return [];
    }

    return [
      <button
        key="undo"
        type="button"
        onClick={() => editor.undo()}
        disabled={editor.history.undos.length === 0}
      >
        <img
          src="/images/undo-regular-24.png"
          alt={t("scene.action.undo.label")}
          title={t("scene.action.undo.label")}
        />
      </button>,

      <button
        key="redo"
        type="button"
        onClick={() => editor.redo()}
        disabled={editor.history.redos.length === 0}
      >
        <img
          src="/images/redo-regular-24.png"
          alt={t("scene.action.redo.label")}
          title={t("scene.action.redo.label")}
        />
      </button>,
    ];
  })();

  return (
    <div className={styles.toolbar}>
      {defaultButtons}
      {otherButtons}
    </div>
  );
};

export default Toolbar;

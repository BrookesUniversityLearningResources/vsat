import type { FC } from "react";
import type { RenderElementProps } from "slate-react";

import styles from "./BlockLinkElement.module.css";

const BlockLinkElement: FC<RenderElementProps> = (props) => {
  return (
    <div className={styles.blockLink} {...props.attributes}>
      <div>{props.children}</div>
    </div>
  );
};

export default BlockLinkElement;

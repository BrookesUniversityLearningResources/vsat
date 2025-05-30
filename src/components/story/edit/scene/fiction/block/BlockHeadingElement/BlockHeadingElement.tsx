import type { FC } from "react";
import type { RenderElementProps } from "slate-react";

import styles from "./BlockHeadingElement.module.css";

const BlockHeadingElement: FC<RenderElementProps> = (props) => {
  return (
    <div className={styles.blockHeading} {...props.attributes}>
      <div>{props.children}</div>
      <br />
    </div>
  );
};
export default BlockHeadingElement;

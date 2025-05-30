import type { FC } from "react";

import type { ErrorProps } from "../BlockErrorElement";

import styles from "./SimpleErrorCard.module.css";

/** Display an error using the **not-localized** text from the error itself. */
const SimpleErrorCard: FC<ErrorProps> = (props) => {
  return (
    <div className={styles.blockError} {...props.attributes}>
      <div className={styles.card}>{props.error.message}</div>
      <div>{props.children}</div>
    </div>
  );
};

export default SimpleErrorCard;

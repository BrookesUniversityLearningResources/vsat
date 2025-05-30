import type { FC } from "react";
import { useTranslation } from "react-i18next";

import type { ErrorProps } from "../BlockErrorElement";
import translationKeyFor from "../translationKeyFor";

import styles from "./DetailedErrorCard.module.css";

/**
 * Display an error in a rich, structured, and **localized** format.
 *
 * The structured format displays the error in three sections:
 *
 * * `headline`: a pointed description of what is wrong.
 * * `how to fix`: a short description of how to fix the error.
 * * `example`: a single example of a well-formed block.
 */
const DetailedErrorCard: FC<ErrorProps> = (props) => {
  const error = props.error;

  const { t } = useTranslation();

  const translationKey = translationKeyFor(error.code);

  return (
    <div className={styles.blockError} {...props.attributes}>
      <div className={styles.card}>
        <div className={styles.headline}>{t(`${translationKey}.headline`)}</div>
        <div className={styles.content}>
          <div className={styles.howtofix}>
            {t(`${translationKey}.howtofix`)}
          </div>
          <div className={styles.example}>
            <pre>
              <code>{t(`${translationKey}.example`)}</code>
            </pre>
          </div>
        </div>
      </div>
      <div>{props.children}</div>
    </div>
  );
};

export default DetailedErrorCard;

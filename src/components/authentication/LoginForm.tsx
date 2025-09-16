import { useId, type FC, type FormEventHandler } from "react";
import { useTranslation } from "react-i18next";

import styles from "./Login.module.css";

export type OnLogin = (email: string) => void;

export type LoginFormProps = {
  onLogin: OnLogin;
  error?: Error | undefined;
};

const LoginForm: FC<LoginFormProps> = ({ onLogin, error }) => {
  const { t } = useTranslation();

  const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const data = new FormData(e.currentTarget);
    const email = data.get("email");

    if (typeof email === "string") {
      onLogin(email);
    }
  };

  const idFormHeading = useId();

  return (
    <>
      <h1 id={idFormHeading}>{t("heading")}</h1>
      {error && <div className="error">{t("error")}</div>}
      <form
        method="post"
        className={styles.form}
        onSubmit={onSubmit}
        aria-labelledby={idFormHeading}
      >
        <label htmlFor="email" className="visually-hidden">
          {t("field.email.label")}
        </label>
        <input
          type="email"
          name="email"
          required
          placeholder={t("field.email.placeholder")}
        />

        <button type="submit">{t("submit.label")}</button>
      </form>
    </>
  );
};

export default LoginForm;

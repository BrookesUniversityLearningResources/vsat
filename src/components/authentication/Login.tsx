import type { ResourceKey } from "i18next";
import { type FC, type PropsWithChildren, useState } from "react";
import { I18nextProvider } from "react-i18next";

import authenticateWithServerUsingEmail from "../../authentication/client/authenticateWithServerUsingEmail.js";
import { safeReturnTo } from "../../authentication/returnTo.js";
import useI18N from "../../i18n/client/useI18N.js";
import LoginForm, { type OnLogin } from "./LoginForm.js";

type LoginState =
  | { kind: "loginForm"; err?: Error }
  | { kind: "loginInProgress" };

/**
 * The `children` will be the server-rendered content for the
 * _"login in progress"_ state.
 */
type LoginProps = PropsWithChildren & {
  magicPublicKey: string;
  returnTo: string;
  translations: Record<string, ResourceKey>;
};

const Login: FC<LoginProps> = ({
  magicPublicKey,
  returnTo,
  translations,
  children: loginInProgress,
}) => {
  const i18n = useI18N(translations, navigator.language);
  const safeRedirectPath = safeReturnTo(returnTo);

  const [loginState, setLoginState] = useState<LoginState>({
    kind: "loginForm",
  });

  const onLogin: OnLogin = (email) => {
    setLoginState({ kind: "loginInProgress" });

    authenticateWithServerUsingEmail(magicPublicKey, email, safeRedirectPath)
      .then(() => {
        window.location.href = new URL(
          safeRedirectPath,
          window.location.origin,
        ).href;
      })
      .catch((err) => {
        setLoginState({ kind: "loginForm", err });
      });
  };

  let body: JSX.Element;

  switch (loginState.kind) {
    case "loginForm": {
      body = <LoginForm onLogin={onLogin} error={loginState.err} />;
      break;
    }

    case "loginInProgress": {
      // biome-ignore lint/complexity/noUselessFragments: it is necessary
      body = <>{loginInProgress}</>;
      break;
    }

    default:
      return ((_: never) => null)(loginState);
  }

  return <I18nextProvider i18n={i18n}>{body}</I18nextProvider>;
};

export default Login;

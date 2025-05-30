import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { RenderElementProps } from "slate-react";

import type { ErrorCode } from "@domain/error/errorCode";

import type { ErrorElement } from "../../types";
import DetailedErrorCard from "./DetailedErrorCard/DetailedErrorCard";
import SimpleErrorCard from "./SimpleErrorCard/SimpleErrorCard";
import translationKeyFor from "./translationKeyFor";

export type ErrorProps = RenderElementProps & {
  error: {
    message: string;
    code: ErrorCode;
  };
};

const BlockErrorElement: FC<RenderElementProps> = (props) => {
  const error = (props.element as ErrorElement).error;

  const { i18n } = useTranslation();

  const ErrorComponent = i18n.exists(translationKeyFor(error.code))
    ? DetailedErrorCard
    : SimpleErrorCard;

  const errorProps: ErrorProps = {
    ...props,
    error,
  };

  return <ErrorComponent {...errorProps} />;
};

export default BlockErrorElement;

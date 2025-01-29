import type { i18n } from "i18next";
import SweetAlert from "sweetalert2";

import { ErrorCodedError } from "@domain/error/ErrorCodedError";
import { ErrorCodes } from "@domain/error/errorCode";
import isRecord from "@util/isRecord";

const Toast = SweetAlert.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = SweetAlert.stopTimer;
    toast.onmouseleave = SweetAlert.resumeTimer;
  },
});

export type Notify = {
  error: (error: Error) => void;
  info: (key: string, context?: Record<string, unknown>) => void;
};

export function notifyUsingSweetAlert(i18n: i18n): Notify {
  return {
    error(err) {
      if (err instanceof ErrorCodedError) {
        const context = isRecord(err.cause) ? err.cause : {};

        Toast.fire({
          icon: "error",
          text: i18n.t(`notify.error.code.${err.errorCode}`, context),
        });
      } else {
        Toast.fire({
          icon: "error",
          text: i18n.t(`notify.error.code.${ErrorCodes.Error}`) ?? "😨",
        });
      }
    },

    info(key, context = {}) {
      Toast.fire({
        icon: "info",
        text: i18n.t(`notify.${key}`, context),
      });
    },
  };
}

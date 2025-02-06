import { z } from "zod";

export const ErrorCodes = Object.freeze({
  /**
   * To be used when an exhaustiveness check fails.
   *
   * This should never be encountered in a response because it's a compile-time
   * concern.
   */
  Absurd: 0,

  /**
   * To be used when the server encounters an error processing a request and
   * there's no other more suitable error code.
   *
   * This should only be used in `catch` blocks of last resort at the boundaries
   * of the system.
   */
  Error: 1,

  /**
   * To be used when an (API) request receives a bad request and there's no
   * other more suitable error code.
   */
  Bad_Request: 2,

  /**
   * To be used when an (API) request lacks the proper authorization.
   */
  Unauthorized: 3,

  StoryNotFound: 4,
  SceneNotFound: 5,
  MalformedLink: 6,
  MustAddHeadingBeforeAddingAParagraph: 7,
  MustAddHeadingBeforeAddingALink: 8,
  UnableToParseStory: 9,
  ErrorUploadingImage: 10,
  ErrorUploadingAudio: 11,
  ErrorSavingSceneContent: 12,
  MustHaveAtLeastOneScene: 13,
  AllScenesMustHaveContent: 14,
  AllScenesMustHaveAnImage: 15,
  ErrorSavingStoryTitle: 16,
} as const);

export const ErrorCodeModel = z.nativeEnum(ErrorCodes);

export type ErrorCode = z.infer<typeof ErrorCodeModel>;

export interface ErrorCoded {
  readonly errorCode: ErrorCode;
}

export type ErrorCodedContext<T = unknown> = ErrorCoded & {
  context?: T | undefined;
};

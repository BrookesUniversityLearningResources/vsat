import config from "config";
import { z } from "zod";

export default function loadConfig(): AppConfig {
  const result = AppConfigModel.safeParse(config.util.toObject());

  if (result.error) {
    throw new Error("The app's configuration is malformed", {
      cause: result.error,
    });
  }

  return result.data;
}

export const NetworkPortModel = z.coerce.number().int().min(1024).max(65535);

export type NetworkPort = z.infer<typeof NetworkPortModel>;

const LogConfigModel = z.object({
  level: z.union([
    z.literal("fatal"),
    z.literal("error"),
    z.literal("warn"),
    z.literal("info"),
    z.literal("debug"),
    z.literal("trace"),
  ]),
});

const ServerConfigModel = z.object({
  port: NetworkPortModel.default(3000),
  session: z
    .object({
      secret: z.string().min(10).default("dough verbatim console delicious"),
    })
    .optional()
    .default({}),
});

export type ServerConfig = z.infer<typeof ServerConfigModel>;

const MagicAuthenticationConfigModel = z.object({
  secretKey: z.string().min(3).startsWith("sk"),
  publicKey: z.string().min(3).startsWith("pk"),
});

export type MagicAuthenticationConfig = z.infer<
  typeof MagicAuthenticationConfigModel
>;

const AuthenticationConfigModel = z.object({
  magic: MagicAuthenticationConfigModel,
  pathsRequiringAuthentication: z
    .array(z.string().min(1))
    .optional()
    .default([]),
});

export type AuthenticationConfig = z.infer<typeof AuthenticationConfigModel>;

const CloudinaryConfigModel = z.object({
  url: z.string().min(5).url(),
});

export type CloudinaryConfig = z.infer<typeof CloudinaryConfigModel>;

const DatabaseLogConfigModel = z.object({
  query: z.boolean().default(false),
  error: z.boolean().default(false),
});

/**
 * @see https://kysely.dev/docs/recipes/logging#2-provide-a-custom-logging-function
 */
export type DatabaseLogConfig = z.infer<typeof DatabaseLogConfigModel>;

export const DatabaseConfigModel = z.object({
  connectionString: z.string().min(1).url(),
  log: DatabaseLogConfigModel.optional().default({
    query: false,
    error: false,
  }),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigModel>;

export const AppConfigModel = z
  .object({
    app: z.object({
      name: z.string().min(3),
    }),
    server: ServerConfigModel,
    database: DatabaseConfigModel,
    cloudinary: CloudinaryConfigModel,
    authentication: AuthenticationConfigModel,
    log: LogConfigModel.optional(),
  })
  .strict();

export type AppConfig = z.infer<typeof AppConfigModel>;

export type JsonPrimitive = string | number | boolean | null;

export interface JsonObject
  extends Record<string, JsonPrimitive | JsonArray | JsonObject> {}

export interface JsonArray
  extends Array<JsonPrimitive | JsonArray | JsonObject> {}

export type Json = JsonPrimitive | JsonObject | JsonArray;

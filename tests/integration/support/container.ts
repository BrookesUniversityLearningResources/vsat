import { PostgreSqlContainer } from "@testcontainers/postgresql";

export default function createPostgreSqlContainer() {
  return new PostgreSqlContainer("postgres:13.3-alpine");
}

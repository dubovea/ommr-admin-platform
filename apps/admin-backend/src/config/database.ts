const REQUIRED_DB_ENV = [
  "DB_USER",
  "DB_PASSWORD",
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
] as const;

type RequiredDbEnv = (typeof REQUIRED_DB_ENV)[number];
type DbSslMode = boolean | "allow" | "prefer" | "require" | "verify-full";

export type DatabaseConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: DbSslMode;
};

function getRequiredEnv(name: RequiredDbEnv) {
  const value = process.env[name];

  if (value === undefined || value === "") {
    throw new Error(
      `Missing ${name}. Set ${REQUIRED_DB_ENV.join(
        ", ",
      )} and start Node with --env-file=.env.development or --env-file=.env.production.`,
    );
  }

  return value;
}

function getDatabasePort() {
  const value = getRequiredEnv("DB_PORT");
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("DB_PORT must be an integer between 1 and 65535.");
  }

  return port;
}

function getDatabaseSsl(): DbSslMode {
  const value = process.env.DB_SSL?.trim().toLowerCase();

  if (!value || value === "false" || value === "0" || value === "disable") {
    return false;
  }

  if (value === "true" || value === "1") {
    return true;
  }

  if (
    value === "allow" ||
    value === "prefer" ||
    value === "require" ||
    value === "verify-full"
  ) {
    return value;
  }

  throw new Error(
    "DB_SSL must be one of: false, true, allow, prefer, require, verify-full.",
  );
}

export function getDatabaseConfig(): DatabaseConfig {
  return {
    host: getRequiredEnv("DB_HOST").trim(),
    port: getDatabasePort(),
    user: getRequiredEnv("DB_USER").trim(),
    password: getRequiredEnv("DB_PASSWORD"),
    database: getRequiredEnv("DB_NAME").trim(),
    ssl: getDatabaseSsl(),
  };
}

import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

function zodIssuesToFieldErrors(error: ZodError) {
  return error.issues.reduce<Record<string, string>>((acc, issue) => {
    const key = issue.path.length ? issue.path.join(".") : "root";
    acc[key] = issue.message;
    return acc;
  }, {});
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error);

  if (error instanceof ZodError) {
    res.status(422).json({
      message: "Ошибка валидации",
      error: "Validation error",
      issues: error.issues,
      errors: zodIssuesToFieldErrors(error),
    });
    return;
  }

  res.status(500).json({
    message: error instanceof Error ? error.message : "Internal server error",
    error: error instanceof Error ? error.message : "Internal server error",
  });
};

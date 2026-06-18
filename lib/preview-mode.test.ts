import { afterEach, describe, expect, test } from "bun:test";

import { isDevOnlyRouteEnabled, isPreviewModeEnabled } from "./preview-mode";

const prevPreviewMode = process.env.PREVIEW_MODE;
const prevPreviewModeHyphen = process.env["preview-mode"];
const prevNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  if (prevPreviewMode !== undefined) process.env.PREVIEW_MODE = prevPreviewMode;
  else delete process.env.PREVIEW_MODE;
  if (prevPreviewModeHyphen !== undefined) process.env["preview-mode"] = prevPreviewModeHyphen;
  else delete process.env["preview-mode"];
  if (prevNodeEnv !== undefined) process.env.NODE_ENV = prevNodeEnv;
});

describe("preview-mode", () => {
  test("isPreviewModeEnabled accepts PREVIEW_MODE and preview-mode", () => {
    delete process.env.PREVIEW_MODE;
    delete process.env["preview-mode"];
    expect(isPreviewModeEnabled()).toBe(false);

    process.env.PREVIEW_MODE = "TRUE";
    expect(isPreviewModeEnabled()).toBe(true);

    delete process.env.PREVIEW_MODE;
    process.env["preview-mode"] = "true";
    expect(isPreviewModeEnabled()).toBe(true);
  });

  test("isDevOnlyRouteEnabled true in development", () => {
    process.env.NODE_ENV = "development";
    delete process.env.PREVIEW_MODE;
    expect(isDevOnlyRouteEnabled()).toBe(true);
  });

  test("isDevOnlyRouteEnabled true in production when preview mode set", () => {
    process.env.NODE_ENV = "production";
    process.env.PREVIEW_MODE = "true";
    expect(isDevOnlyRouteEnabled()).toBe(true);
  });
});

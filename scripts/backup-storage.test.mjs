import { describe, expect, it } from "vitest";

import { restoreObject } from "./backup-storage.mjs";

const file = "backup-check/ghost/probe.png";
const body = Buffer.from("png-bytes");

function duplicateError() {
  return {
    status: 400,
    statusCode: "409",
    message: "The resource already exists",
  };
}

function bucketFor(download) {
  const calls = [];
  return {
    calls,
    async upload(_path, _body, options) {
      calls.push(["upload", options.upsert]);
      if (options.upsert) return { error: null };
      return { error: duplicateError() };
    },
    async download() {
      calls.push(["download"]);
      return download();
    },
  };
}

describe("restoreObject", () => {
  it("uploads a path that is not in the bucket", async () => {
    const calls = [];
    const bucket = {
      async upload() {
        calls.push("upload");
        return { error: null };
      },
      async download() {
        calls.push("download");
        return { data: null, error: null };
      },
    };

    await expect(restoreObject(bucket, file, body, "image/png")).resolves.toBe(
      "uploaded",
    );
    expect(calls).toEqual(["upload"]);
  });

  it("skips a duplicate whose bytes download", async () => {
    const bucket = bucketFor(async () => ({
      data: new Blob([body]),
      error: null,
    }));

    await expect(restoreObject(bucket, file, body, "image/png")).resolves.toBe(
      "skipped",
    );
    expect(bucket.calls).toEqual([["upload", false], ["download"]]);
  });

  it("replaces a duplicate whose download fails with the ghost-object 500", async () => {
    const bucket = bucketFor(async () => ({
      data: null,
      error: {
        status: 500,
        statusCode: "500",
        code: "InternalError",
        message: "Internal Server Error",
      },
    }));

    await expect(restoreObject(bucket, file, body, "image/png")).resolves.toBe(
      "replaced",
    );
    expect(bucket.calls).toEqual([
      ["upload", false],
      ["download"],
      ["upload", true],
    ]);
  });

  it("replaces a duplicate the storage API reports as missing", async () => {
    const bucket = bucketFor(async () => ({
      data: null,
      error: {
        status: 404,
        statusCode: "404",
        code: "NoSuchKey",
        message: "Object not found",
      },
    }));

    await expect(restoreObject(bucket, file, body, "image/png")).resolves.toBe(
      "replaced",
    );
    expect(bucket.calls.at(-1)).toEqual(["upload", true]);
  });

  it("replaces a duplicate that downloads as an empty body", async () => {
    const bucket = bucketFor(async () => ({
      data: new Blob([]),
      error: null,
    }));

    await expect(restoreObject(bucket, file, body, "image/png")).resolves.toBe(
      "replaced",
    );
  });

  it("throws when the replacement upload fails, instead of skipping", async () => {
    const bucket = {
      async upload(_path, _body, options) {
        if (!options.upsert) return { error: duplicateError() };
        return { error: { message: "still missing" } };
      },
      async download() {
        return {
          data: null,
          error: {
            status: 404,
            code: "NoSuchKey",
            message: "Object not found",
          },
        };
      },
    };

    await expect(
      restoreObject(bucket, file, body, "image/png"),
    ).rejects.toThrow("backup-check/ghost/probe.png: still missing");
  });

  it("throws on an upload error that is not a duplicate", async () => {
    const calls = [];
    const bucket = {
      async upload() {
        return { error: { status: 500, message: "database timeout" } };
      },
      async download() {
        calls.push("download");
        return { data: null, error: null };
      },
    };

    await expect(
      restoreObject(bucket, file, body, "image/png"),
    ).rejects.toThrow("database timeout");
    expect(calls).toEqual([]);
  });
});

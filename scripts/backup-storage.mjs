// Copies the business-media bucket to a local folder, or puts a copy back.
// Supabase database backups do NOT include Storage files, so this is the only
// backup of logos, covers and catalog photos. See docs/recuperacion.md.
//
//   node --env-file=.env.local scripts/backup-storage.mjs backup [dir]
//   node --env-file=.env.local scripts/backup-storage.mjs restore <dir>
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY of the project
// to copy. Restore skips a path only when that object downloads with content.
// A database restore can bring back storage.objects rows whose bytes were
// deleted later. Upload then reports "already exists" while download fails
// (often 500 InternalError, not 404). Those paths are written again with upsert.
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { createClient } from "@supabase/supabase-js";

const BUCKET = "business-media";
const PAGE = 100;
const TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function storageCode(error) {
  return error.code ?? error.error ?? error.statusCode;
}

export function isDuplicateObject(error) {
  const code = String(storageCode(error) ?? "");
  return (
    code === "ResourceAlreadyExists" ||
    code === "KeyAlreadyExists" ||
    code === "already_exists" ||
    code === "409" ||
    Number(error.status) === 409 ||
    /already exists|duplicate/i.test(error.message ?? "")
  );
}

async function byteSize(data) {
  if (!data) return 0;
  if (typeof data.size === "number") return data.size;
  if (typeof data.byteLength === "number") return data.byteLength;
  if (typeof data.arrayBuffer === "function") {
    return (await data.arrayBuffer()).byteLength;
  }
  return 0;
}

async function objectIsReadable(bucket, file) {
  const { data, error } = await bucket.download(file);
  if (error || !data) return false;
  return (await byteSize(data)) > 0;
}

export async function restoreObject(bucket, file, body, contentType) {
  const created = await bucket.upload(file, body, {
    contentType,
    upsert: false,
  });
  if (!created.error) return "uploaded";
  if (!isDuplicateObject(created.error)) {
    throw new Error(`${file}: ${created.error.message}`);
  }
  if (await objectIsReadable(bucket, file)) return "skipped";

  const replaced = await bucket.upload(file, body, {
    contentType,
    upsert: true,
  });
  if (replaced.error) throw new Error(`${file}: ${replaced.error.message}`);
  return "replaced";
}

async function listFiles(bucket, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await bucket.list(prefix, {
      limit: PAGE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    for (const item of data) {
      const full = prefix ? `${prefix}/${item.name}` : item.name;
      // Folders come back without an id.
      if (item.id === null) files.push(...(await listFiles(bucket, full)));
      else files.push(full);
    }
    if (data.length < PAGE) return files;
  }
}

async function backup(bucket, dir) {
  const files = await listFiles(bucket);
  for (const file of files) {
    const { data, error } = await bucket.download(file);
    if (error || !data) {
      throw new Error(`${file}: ${error?.message ?? "empty download"}`);
    }
    const target = path.join(dir, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(await data.arrayBuffer()));
  }
  return files.length;
}

async function walk(dir, base = dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full, base)));
    else files.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return files;
}

async function restore(bucket, dir) {
  if (!(await stat(dir)).isDirectory()) {
    throw new Error(`${dir} is not a folder`);
  }
  let uploaded = 0;
  let replaced = 0;
  let skipped = 0;
  for (const file of await walk(dir)) {
    const contentType = TYPES[path.extname(file).toLowerCase()];
    if (!contentType) {
      console.warn(`Skipped ${file}: not a jpg, png or webp`);
      skipped += 1;
      continue;
    }
    const outcome = await restoreObject(
      bucket,
      file,
      await readFile(path.join(dir, file)),
      contentType,
    );
    switch (outcome) {
      case "uploaded":
        uploaded += 1;
        break;
      case "replaced":
        replaced += 1;
        break;
      case "skipped":
        skipped += 1;
        break;
      default: {
        const unexpected = outcome;
        throw new Error(`Unexpected restore outcome: ${unexpected}`);
      }
    }
  }
  return { uploaded, replaced, skipped };
}

function runningAsCli() {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(path.resolve(entry)).href;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing (use --env-file)",
    );
  }
  const bucket = createClient(url, key, {
    auth: { persistSession: false },
  }).storage.from(BUCKET);

  const [mode, dirArg] = process.argv.slice(2);
  if (mode === "backup") {
    const stamp = new Date().toISOString().slice(0, 10);
    const dir = dirArg ?? path.join("backups", `storage-${stamp}`);
    const count = await backup(bucket, dir);
    console.log(`Copied ${count} files from ${url} to ${dir}`);
  } else if (mode === "restore" && dirArg) {
    const { uploaded, replaced, skipped } = await restore(bucket, dirArg);
    console.log(
      `Restored ${uploaded} files to ${url}; replaced ${replaced}; skipped ${skipped}`,
    );
  } else {
    console.error("Usage: backup [dir] | restore <dir>");
    process.exit(1);
  }
}

if (runningAsCli()) {
  await main();
}

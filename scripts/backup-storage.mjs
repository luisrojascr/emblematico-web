// Copies the business-media bucket to a local folder, or puts a copy back.
// Supabase database backups do NOT include Storage files, so this is the only
// backup of logos, covers and catalog photos. See docs/recuperacion.md.
//
//   node --env-file=.env.local scripts/backup-storage.mjs backup [dir]
//   node --env-file=.env.local scripts/backup-storage.mjs restore <dir>
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY of the project
// to copy. Restore never overwrites: files that already exist are skipped.
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const BUCKET = "business-media";
const PAGE = 100;
const TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

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

async function listFiles(prefix = "") {
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
      if (item.id === null) files.push(...(await listFiles(full)));
      else files.push(full);
    }
    if (data.length < PAGE) return files;
  }
}

async function backup(dir) {
  const files = await listFiles();
  for (const file of files) {
    const { data, error } = await bucket.download(file);
    if (error) throw new Error(`${file}: ${error.message}`);
    const target = path.join(dir, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(await data.arrayBuffer()));
  }
  console.log(`Copied ${files.length} files from ${url} to ${dir}`);
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

async function restore(dir) {
  if (!(await stat(dir)).isDirectory())
    throw new Error(`${dir} is not a folder`);
  let uploaded = 0;
  let skipped = 0;
  for (const file of await walk(dir)) {
    const contentType = TYPES[path.extname(file).toLowerCase()];
    if (!contentType) {
      console.warn(`Skipped ${file}: not a jpg, png or webp`);
      skipped += 1;
      continue;
    }
    const { error } = await bucket.upload(
      file,
      await readFile(path.join(dir, file)),
      { contentType, upsert: false },
    );
    if (!error) {
      uploaded += 1;
    } else if (/already exists|duplicate/i.test(error.message)) {
      skipped += 1;
    } else {
      throw new Error(`${file}: ${error.message}`);
    }
  }
  console.log(`Restored ${uploaded} files to ${url}; skipped ${skipped}`);
}

const [mode, dirArg] = process.argv.slice(2);
if (mode === "backup") {
  const stamp = new Date().toISOString().slice(0, 10);
  await backup(dirArg ?? path.join("backups", `storage-${stamp}`));
} else if (mode === "restore" && dirArg) {
  await restore(dirArg);
} else {
  console.error("Usage: backup [dir] | restore <dir>");
  process.exit(1);
}

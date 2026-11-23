/**
 * Apply blog-fixes-2026-11 to the database.
 *
 *   node scripts/run-blog-fixes.mjs            # dry run: backup + report, writes nothing
 *   node scripts/run-blog-fixes.mjs --apply    # backup + write changes
 *   node scripts/run-blog-fixes.mjs --restore backups/blogs-XXXX.json   # roll back
 *
 * Always writes a full JSON backup of every blog to backend/backups/ before doing anything.
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { Blog } from '../models/blogModel.js';
import { fixBlog, ALL_PMIDS, POSTS } from './blog-fixes-2026-11.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const RESTORE = args.includes('--restore') ? args[args.indexOf('--restore') + 1] : null;

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not set (backend/.env)');
await mongoose.connect(`${process.env.MONGODB_URI}/e-commerce`);

const all = await Blog.find({}).lean();
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.resolve(__dirname, '../backups');
await fs.mkdir(backupDir, { recursive: true });
const backupFile = path.join(backupDir, `blogs-${stamp}.json`);
await fs.writeFile(backupFile, JSON.stringify(all, null, 1));
console.log(`Backup of ${all.length} blogs -> ${backupFile}`);

if (RESTORE) {
  const docs = JSON.parse(await fs.readFile(path.resolve(RESTORE), 'utf8'));
  for (const d of docs) {
    const { _id, __v, ...rest } = d;
    await Blog.updateOne({ _id }, { $set: rest }, { timestamps: false });
  }
  console.log(`Restored ${docs.length} blogs from ${RESTORE}`);
  await mongoose.disconnect();
  process.exit(0);
}

const res = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ALL_PMIDS.join(',')}`);
const pubmed = (await res.json()).result;
const titles = Object.fromEntries(Object.entries(POSTS).map(([s, p]) => [s, p.title]));

const targets = all.filter(b => POSTS[b.slug]);
const missing = Object.keys(POSTS).filter(s => !all.some(b => b.slug === s));
if (missing.length) console.warn('Planned posts not found in DB:', missing);

let ok = 0;
for (const b of targets) {
  const { changes, log } = fixBlog(b, pubmed, titles); // throws if any edit no longer matches
  const summary = ['edit', 'cite', 'source'].map(k => `${k}:${log.filter(l => l.startsWith(k)).length}`).join(' ');
  const warns = log.filter(l => l.startsWith('WARN'));
  console.log(`${APPLY ? 'UPDATE' : 'would update'} ${b.slug}  ${summary} ${warns.join(' ')}`);
  if (APPLY) {
    const doc = await Blog.findById(b._id);
    doc.set(changes);
    await doc.save(); // runs pre-save hooks (readTime) and bumps updatedAt
  }
  ok++;
}
console.log(`\n${APPLY ? 'Updated' : 'Dry run OK for'} ${ok} posts.${APPLY ? '' : ' Re-run with --apply to write.'}`);
await mongoose.disconnect();

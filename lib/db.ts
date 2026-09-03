import Database from "better-sqlite3";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import type { ProductAnalysis, QaReport, Revision, TechPack } from "@/lib/schemas/tech-pack";
import type { CoreProductSpec } from "@/lib/schemas/universal";

const DATA_DIR =
  process.env.NODE_ENV === "production" || process.env.VERCEL === "1"
    ? path.join(os.tmpdir(), "data") // /tmp/data on Vercel
    : path.join(process.cwd(), "data"); // local dev unchanged

const DB_PATH =
  process.env.DATABASE_URL?.startsWith("file:") &&
  !((process.env.NODE_ENV === "production" || process.env.VERCEL === "1") && process.env.DATABASE_URL.includes("data"))
    ? process.env.DATABASE_URL.replace(/^file:/, "")
    : path.join(DATA_DIR, "app.db");

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(DB_PATH);
try {
  db.pragma("journal_mode = WAL");
} catch {
  // fallback if filesystem doesn't support WAL
}

try {
  db.exec("ALTER TABLE projects ADD COLUMN image_back_path TEXT");
} catch {
  /* column already exists */
}

try {
  db.exec("ALTER TABLE projects ADD COLUMN universal TEXT");
} catch {
  /* column already exists */
}

try {
  db.exec("ALTER TABLE projects ADD COLUMN video_path TEXT");
} catch {
  // already migrated
}
try {
  db.exec("ALTER TABLE revisions ADD COLUMN version TEXT");
} catch {
  // already migrated
}

db.exec(`
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  brand_name TEXT,
  image_path TEXT,
  image_back_path TEXT,
  category TEXT,
  intended_customer TEXT,
  target_market TEXT,
  quantity INTEGER,
  sizes TEXT NOT NULL DEFAULT '[]',
  colorways TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  analysis TEXT,
  tech_pack TEXT,
  qa_report TEXT,
  universal TEXT,
  video_path TEXT,
  version TEXT NOT NULL DEFAULT 'V1.0',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  version TEXT,
  created_at TEXT NOT NULL
);
`);

interface ProjectRow {
  id: string;
  name: string;
  description: string;
  brand_name: string | null;
  image_path: string | null;
  image_back_path: string | null;
  category: string | null;
  intended_customer: string | null;
  target_market: string | null;
  quantity: number | null;
  sizes: string;
  colorways: string;
  notes: string | null;
  status: string;
  analysis: string | null;
  tech_pack: string | null;
  qa_report: string | null;
  universal: string | null;
  video_path: string | null;
  version: string;
  created_at: string;
  updated_at: string;
}

const parse = <T>(s: string | null): T | null => (s ? (JSON.parse(s) as T) : null);

function rowToProject(r: ProjectRow) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    brand_name: r.brand_name ?? undefined,
    image_path: r.image_path ?? undefined,
    image_back_path: r.image_back_path ?? undefined,
    category: r.category ?? undefined,
    intended_customer: r.intended_customer ?? undefined,
    target_market: r.target_market ?? undefined,
    quantity: r.quantity ?? undefined,
    sizes: JSON.parse(r.sizes) as string[],
    colorways: JSON.parse(r.colorways) as Array<{ name: string; code?: string }>,
    notes: r.notes ?? undefined,
    status: r.status,
    analysis: parse<ProductAnalysis>(r.analysis),
    tech_pack: parse<TechPack>(r.tech_pack),
    qa_report: parse<QaReport>(r.qa_report),
    universal: parse<CoreProductSpec>(r.universal),
    video_path: r.video_path ?? undefined,
    version: r.version,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export interface NewProject {
  id: string;
  name: string;
  description: string;
  brand_name?: string;
  image_path?: string;
  image_back_path?: string;
  category?: string;
  intended_customer?: string;
  target_market?: string;
  quantity?: number;
  sizes: string[];
  colorways: Array<{ name: string; code?: string }>;
  notes?: string;
}

const now = () => new Date().toISOString();

export function createProject(p: NewProject) {
  db.prepare(
    `INSERT INTO projects (id, name, description, brand_name, image_path, image_back_path, category, intended_customer,
      target_market, quantity, sizes, colorways, notes, status, version, created_at, updated_at)
     VALUES (@id, @name, @description, @brand_name, @image_path, @image_back_path, @category, @intended_customer,
      @target_market, @quantity, @sizes, @colorways, @notes, 'DRAFT', 'V1.0', @created_at, @updated_at)`
  ).run({
    id: p.id,
    name: p.name,
    description: p.description,
    brand_name: p.brand_name ?? null,
    image_path: p.image_path ?? null,
    image_back_path: p.image_back_path ?? null,
    category: p.category ?? null,
    intended_customer: p.intended_customer ?? null,
    target_market: p.target_market ?? null,
    quantity: p.quantity ?? null,
    sizes: JSON.stringify(p.sizes),
    colorways: JSON.stringify(p.colorways),
    notes: p.notes ?? null,
    created_at: now(),
    updated_at: now(),
  });
}

export function getProject(id: string) {
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined;
  return row ? rowToProject(row) : null;
}

export function getProjects() {
  const rows = db.prepare("SELECT * FROM projects ORDER BY updated_at DESC LIMIT 50").all() as ProjectRow[];
  return rows.map(rowToProject);
}

export function updateProjectMeta(id: string, patch: Partial<Pick<ProjectRow, "name" | "notes">>) {
  db.prepare("UPDATE projects SET name = COALESCE(@name, name), notes = COALESCE(@notes, notes), updated_at = @at WHERE id = @id").run({
    id,
    name: patch.name ?? null,
    notes: patch.notes ?? null,
    at: now(),
  });
}

export function saveGeneration(
  id: string,
  data: {
    analysis: ProductAnalysis | null;
    tech_pack: TechPack;
    qa_report: QaReport;
  }
) {
  db.prepare(
    `UPDATE projects SET analysis = @analysis, tech_pack = @tech_pack, qa_report = @qa_report,
      status = 'REVIEW_REQUIRED', version = @version, updated_at = @at WHERE id = @id`
  ).run({
    id,
    analysis: data.analysis ? JSON.stringify(data.analysis) : null,
    tech_pack: JSON.stringify(data.tech_pack),
    qa_report: JSON.stringify(data.qa_report),
    version: data.tech_pack.version,
    at: now(),
  });
}

export function saveTechPack(
  projectId: string,
  techPack: TechPack,
  qaReport: QaReport | null
) {
  db.prepare(
    `UPDATE projects SET tech_pack = @tech_pack, qa_report = @qa_report,
      version = @version, updated_at = @at WHERE id = @id`
  ).run({
    id: projectId,
    tech_pack: JSON.stringify(techPack),
    qa_report: qaReport ? JSON.stringify(qaReport) : null,
    version: techPack.version,
    at: now(),
  });
}

export function saveUniversal(projectId: string, spec: CoreProductSpec | null) {
  db.prepare(
    `UPDATE projects SET universal = @universal, updated_at = @at WHERE id = @id`
  ).run({
    id: projectId,
    universal: spec ? JSON.stringify(spec) : null,
    at: now(),
  });
}

export function setVideoPath(projectId: string, videoPath: string | null) {
  db.prepare(
    `UPDATE projects SET video_path = @video_path, updated_at = @at WHERE id = @id`
  ).run({
    id: projectId,
    video_path: videoPath,
    at: now(),
  });
}

export function addRevision(projectId: string, field: string, oldValue: unknown, newValue: unknown, reason?: string, version?: string) {
  db.prepare(
    `INSERT INTO revisions (project_id, field, old_value, new_value, reason, version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    projectId,
    field,
    oldValue === undefined ? null : JSON.stringify(oldValue),
    newValue === undefined ? null : JSON.stringify(newValue),
    reason ?? null,
    version ?? null,
    now()
  );
}

export function getRevisions(projectId: string): Revision[] {
  const rows = db
    .prepare("SELECT * FROM revisions WHERE project_id = ? ORDER BY id ASC")
    .all(projectId) as Array<Record<string, string>>;
  return rows.map((r) => ({
    id: Number(r.id),
    project_id: r.project_id,
    field: r.field,
    old_value: r.old_value ? JSON.parse(r.old_value) : undefined,
    new_value: r.new_value ? JSON.parse(r.new_value) : undefined,
    reason: r.reason ?? undefined,
    version: r.version ?? undefined,
    created_at: r.created_at,
  }));
}

/** Bump the tech-pack minor version: V1.0 -> V1.1 -> ... */
export function bumpVersion(version: string): string {
  const m = version.match(/^V(\d+)\.(\d+)$/);
  if (!m) return `${version}.1`;
  return `V${m[1]}.${Number(m[2]) + 1}`;
}

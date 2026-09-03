# AI Tech Pack Generator

Turn a product photo and a plain-language description into a structured,
editable manufacturing tech pack — BOM, POM measurements, construction,
colourways, QC checklist, packaging, assumptions — with provenance tracking,
a deterministic QA gate, revision logging, and PDF/JSON export.

This is not an "LLM wrapper that generates a pretty PDF". Every stage is a
separate, schema-validated step, and every AI-produced value carries machine-
readable provenance so a human reviewer knows exactly what is observed fact,
what is inference, and what is an assumption that must be confirmed.

## How it works

```
Image + description
        |
        v
1. Vision analysis      -> ProductAnalysis  (observed vs inferred vs assumed)
        |
        v
2. Manufacturing spec   -> TechPack JSON    (materials, BOM, POM, construction,
        |                                    colourways, labels, QC, packaging)
        v
3. Zod schema validation (repair loop on invalid output)
        |
        v
4. Deterministic QA engine (23 hard-coded manufacturing checks: blocking /
   warning / info, completeness %, score) merged with optional AI QA review
        |
        v
5. Editable dashboard    -> human edits patch fields, bump the version
        |                  (V1.0 -> V1.1), and append to a revision log
        v
6. PDF / JSON export     (export is blocked while blocking errors exist)
```

### Provenance model

Every AI-produced field is a `{ value, source, confidence, requires_review }`:

| source          | meaning                                        |
| --------------- | ---------------------------------------------- |
| `observed`      | visible in the provided image                  |
| `inferred`      | deduced by the AI from description/context     |
| `assumed`       | industry-norm placeholder                      |
| `user_provided` | entered by the human during review             |
| `verified`      | confirmed by a human after review              |

Editing any field in the UI records the old value, the new value, and the
reviewer's reason in the revision log, and bumps the pack version.

### Deterministic QA engine

`lib/quality/engine.ts` runs 23 hard-coded manufacturing checks — independent
of any AI — including: required fields (blocking), measurement coverage for
every declared size (blocking), two shell layers for reversible products
(blocking), plausible measurement ranges, ascending grading, colourway face
distinctness, GSM/composition verification, estimated consumption flags, label
placement, packaging, and quantity. Blocking errors disable export until they
are resolved or overridden with justification.

## AI providers

The pipeline is provider-agnostic. Set `AI_PROVIDER=auto` (default) and it
uses the first available key:

1. `OPENAI_API_KEY`   -> `gpt-4o`   (override: `OPENAI_MODEL`)
2. `ANTHROPIC_API_KEY` -> `claude-sonnet-4-20250514` (override: `ANTHROPIC_MODEL`)
3. `GOOGLE_API_KEY`   -> `gemini-2.0-flash` (override: `GOOGLE_MODEL`)

With **no keys configured it falls back to a deterministic mock engine**
(`lib/ai/providers/mock-*.ts`) that implements the same three stages with
rule-based heuristics — so the whole product works offline. This is also how
the demo stays reproducible.

Force a provider with `AI_PROVIDER=mock|openai|anthropic|google`.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # vitest (schemas + QA engine)
npm run lint
npx tsc --noEmit
npm run build
```

Click **Try the demo** on the landing page — it generates a full tech pack for
a reversible cotton bucket hat (khaki/black, S/M/L, 100 units) and opens the
review dashboard.

## Configuration

Copy `.env.example` to `.env.local` and fill in what you need:

| Variable           | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `AI_PROVIDER`      | `auto` (default), `mock`, `openai`, `anthropic`, `google` |
| `OPENAI_API_KEY`   | OpenAI key (JSON mode, gpt-4o)                 |
| `ANTHROPIC_API_KEY`| Anthropic key (claude-sonnet)                  |
| `GOOGLE_API_KEY`   | Google key (gemini)                            |
| `DATABASE_URL`     | SQLite file path (default `file:./data/app.db`)|
| `NEXT_PUBLIC_APP_URL` | Public origin, used in exported metadata    |

Storage: SQLite (better-sqlite3, WAL) at `data/app.db`; uploaded images under
`public/uploads/`. Both are git-ignored.

## API surface

| Route                              | Method | Purpose                                          |
| ---------------------------------- | ------ | ------------------------------------------------ |
| `/api/projects`                    | POST   | Create project (multipart: image + description)  |
| `/api/tech-pack/generate`          | POST   | Run the 3-stage pipeline, NDJSON progress stream |
| `/api/tech-pack/[id]`              | GET    | Fetch project + revision log                     |
| `/api/tech-pack/[id]`              | PATCH  | Apply reviewed patches, re-validate, re-QA       |
| `/api/tech-pack/[id]/export`       | GET    | Download pack as JSON                            |
| `/api/tech-pack/validate`          | POST   | Re-run the QA engine on a project                |
| `/api/demo`                        | POST   | One-click demo project                           |

## Testing

`tests/schemas.test.ts` covers Zod schema contracts (provenance enum, confidence
bounds, invalid payloads rejected). `tests/quality-engine.test.ts` covers the
deterministic QA engine: the demo bucket hat produces a headwear category,
reversible two-face colourways, full S/M/L coverage, a GSM warning; adversarial
cases cover size gaps (blocking), single-shell reversible packs (blocking),
same-colour reversible faces (warning), out-of-range measurements, and
completeness/score arithmetic.

## Known limitations

- The mock engine is a heuristic stand-in, not real vision/LLM output; its
  measurements are size-curve assumptions that must be pattern-validated.
- PDF is generated client-side (pdfmake); it is a production-style document
  with AI-provenance banners, not a print-final artwork sheet.
- No auth, billing, multi-user roles, or media caching — out of scope by design.
- Colour hexes are approximate screen values; the factory must confirm with
  Pantone/lab-dip references.
- Consumption figures are marker-estimates flagged `(est.)` until a marker run
  is validated.

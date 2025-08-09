
# Grace Platform Documentation

This directory contains canonical platform documentation and artifacts discovered by the Platform Reports Hub.

## Directory Structure

```
src/platform/
├── docs/           # Documentation files
├── logs/           # Operational logs
└── reports/        # Report templates and analyses
```

## Platform Reports Hub

The Platform Reports Hub automatically scans and catalogs:

- **Documentation files**: README.md, guides, API docs
- **Configuration files**: package.json, config files, schemas  
- **Log files**: Application logs, error reports, audit trails
- **Code artifacts**: TypeScript definitions, utilities

### Automated Discovery

Files are discovered using configurable glob patterns:
- `src/**/*.md`
- `src/**/*.json` 
- `src/**/*.log`
- `supabase/**/*.md`
- `supabase/**/*.sql`
- `README.md`
- `package.json`

### Deduplication

Content is SHA-256 hashed to prevent duplicate ingestion. Only files with content changes are re-ingested.

### Access

Platform Reports are available to super admins at `/platform/reports`.

## Manual Error Reporting

Client-side errors on platform routes are automatically captured. Server errors can be manually reported via the edge function.

---

*Last updated by Platform Reports Hub*

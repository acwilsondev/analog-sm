# Migration Policy

- Tool: Prisma Migrate.
- Migrations are committed and ordered in `prisma/migrations`.
- Pre-release checklist requires verified backup before migration.
- Rollback strategy for destructive changes is restore from known-good backup artifact.

## Pre-release checklist

- [ ] `npm run backup`
- [ ] Backup artifact stored in durable location
- [ ] Restore drill run recently (`npm run backup:validate`)
- [ ] `npm run db:migrate`

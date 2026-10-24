# Workflow Automation

## Installation

### Prerequisites

You need Node.js 22.22 or newer; [nvm](https://github.com/nvm-sh/nvm) is the easiest way to install and switch to it, and `nvm use` picks the version from `.nvmrc`. The repository is a [Rush](https://rushjs.io) monorepo, so install Rush globally with `npm install -g @microsoft/rush`. Signing in requires a GitHub OAuth App (setup steps TBD), and whether Docker is needed for local services is TBD.

### Installing

From the repository root, run `rush install` to install every project's dependencies from the committed lockfile. Run `rush update` instead after changing a `package.json`, so the lockfile is updated too. Then run `rush build` to build every project and `rush test` to run their tests.

## Execution

TBD

## Architectural decisions

- **Rush monorepo with pnpm**: TBD (rationale)
- **MongoDB driver with Zod**: I chose the official MongoDB driver over Mongoose. Zod already describes every entity, so a Mongoose schema would just repeat it. Every write is parsed with Zod before it reaches the database.
- **UUIDs as `_id`**: every id is a UUID from `crypto.randomUUID()`, set explicitly on insert. I use `_id` as is in the database, the API and the frontend, so there's no ObjectId and no mapping to `id`.
- **Soft deletes for workflows**: deleting a workflow sets `deletedAt` instead of removing it, so the events it received can still point back to it. Its GitHub webhook is removed anyway.

### Data model

![Data model](docs/data-model.png)

A user has many workflow configurations, and each configuration has many executions. Every webhook delivery is saved as a workflow event, even when it runs nothing, so we can tell why a workflow didn't fire.

I chose to let the source fan out the events, not the application. Each workflow registers its own webhook and keeps its hook id, so one delivery runs exactly one workflow and a failure in one workflow never affects the others.

An execution points to its event through a unique `eventId`, so an event runs at most one workflow.

## Follow-ups

- Sources that only allow a single subscription (like WhatsApp) would need the application to split each delivery into one job per workflow as soon as it arrives.
- Dropping the unique `eventId` index would allow one event to have many executions, without changing the schema.
- Reprocessing: a retry adds an attempt to the existing execution instead of creating a new one, so an event keeps at most one execution.

## Timeline

| Date | Time (EDT) | With AI | Summary |
| --- | --- | --- | --- |
| 2026-10-24 | 11:00 | No | Elaborated my base design image describing my understanding of the related entities |
| 2026-10-24 | 11:10 | Yes | Shared my base design and discussed how to split the problem into entities (user, workflow configuration, execution and event) and how GitHub events reach each workflow. |
| 2026-10-24 | 11:58 | Yes | Discussed the data shape of the workflow configuration, plus the user and event entities. |
| 2026-10-24 | 13:11 | Yes | Discussed the data shape of the workflow execution, including its attempts. |
| 2026-10-24 | 14:09 – 14:40 | Yes | Agreed the setup of the shared library and built it with the Zod schemas, the app catalog and their tests, then reviewed it. |

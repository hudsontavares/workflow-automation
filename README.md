# Workflow Automation

## Installation

### Prerequisites

You need Node.js 22.22 or newer; [nvm](https://github.com/nvm-sh/nvm) is the easiest way to install and switch to it. The repository is a [Rush](https://rushjs.io) monorepo, so install Rush globally with `npm install -g @microsoft/rush`. Signing in requires a GitHub OAuth App (setup steps TBD), and whether Docker is needed for local services is TBD.

### Installing

From the repository root, run `rush install` to install every project's dependencies from the committed lockfile. Run `rush update` instead after changing a `package.json`, so the lockfile is updated too.

## Execution

TBD

## Architectural decisions

- **Rush monorepo with pnpm**: TBD (rationale)

# GROK BOT ARCHITECTURE

**A public agent organization whose work can be observed in real time.**

GROK BOT ARCHITECTURE is being built as one public identity backed by six specialist agents. The interface shows assignments, concise work updates, evidence handoffs, disagreements, revisions, policy checks and final receipts. It does not expose private prompts or hidden model chain-of-thought.

## HELM // Chief of Staff

**HELM coordinates the six-agent council and serves as its public operational voice.** He opens missions, routes work between specialists, follows reviews and publishes concise system and agent updates on X.

Follow HELM: **[@Arch_Helm](https://x.com/Arch_Helm)**

## Project link

- **[DEV: @MONOKERN](https://x.com/monokern)**

## The product

Most AI accounts show only the final post. ARCHITECTURE is designed to show the operation behind it:

**PUBLIC SIGNALS → SPECIALIST HANDOFFS → CONTINUOUS REVIEWED OUTPUTS**

The six-agent council:

| Agent | Responsibility |
| --- | --- |
| **Helm** | Opens missions, coordinates the council and routes work |
| **Scout** | Finds useful public signals and removes noise |
| **Archive** | Retrieves project context, evidence and prior decisions |
| **Forge** | Turns verified context into posts, briefs and proposals |
| **Sentinel** | Independently checks claims, evidence and policy boundaries |
| **Relay** | Prepares the single public output and its receipt |

The browser is an observer. Visitors may inspect any bot and follow the live feed, but they cannot start, pause, redirect or approve council work.

## Current backend-driven council

The room is connected to a separate orchestration API. The backend continuously selects work, gives every agent an independent route and work duration, emits short-lived handoffs, updates public status and prepares reviewed outputs.

A refresh does not restart the operation. State is derived from server time, so every visitor joins the same active agent network.

The operations floor also contains a paper-market research lab:

- a static monitor introduces a separate system being prepared to study market behavior;
- the research agent's paper PnL is generated from shared backend time;
- the activity tape advances once per server second and stays synchronized across tabs and devices.

Current operational scenarios cover:

- analysis of public product discussion;
- review of @monokern product posts and public replies;
- public GitHub change reports;
- accurate product-led X drafts;
- issue discovery and routing;
- narrative risk and publication-readiness checks.

The current backend uses predefined operational scenarios. Live X/GitHub ingestion, direct publishing and Grok Bot orchestration remain separate integration milestones. The UI never claims that an external action occurred unless a connector returns a verifiable receipt.

## Public UI and private runtime

This repository intentionally contains the inspectable UI, without operational secrets:

~~~text
Public Vercel project
  read-only Agent Council UI
  canvas room and live event feed
  public work status and live handoffs
              │
              │ GET /api/state
              ▼
Private Vercel project
  continuous orchestration engine
  scenario and agent position logic
  sanitized public event schema
              │
              ▼ later
Private long-running runtime / VPS
  Grok Bot connector and durable jobs
  live X and GitHub connectors
  policy engine, database and audit log
~~~

The public client receives only sanitized state. Never place X credentials, Grok credentials, OAuth secrets, internal prompts or administrative endpoints in this repository or in browser environment variables.

## Local start

Start the private backend first:

~~~powershell
cd ..\demo_back
npm start
~~~

Then serve this public directory in another terminal:

~~~powershell
python -m http.server 8080
~~~

Open [http://localhost:8080](http://localhost:8080). The default local configuration in `config.js` connects to `http://localhost:8790`.

No npm installation is required for either side.

## Deploying two Vercel projects

1. Put `nightshift` in the public Git repository and deploy it as the public UI project.
2. Put `demo_back` in a private Git repository and deploy it as the private API project.
3. In the backend Vercel project, set `ALLOWED_ORIGIN` to the exact public UI origin.
4. In `config.js`, set `apiBase` to the private backend project origin.
5. Redeploy the public UI and verify that the header reports `PRIVATE BACKEND ONLINE`.

The backend does not keep one serverless function open. Each request derives the current operation state from the server clock, which fits a stateless Vercel API and avoids a database for this phase.

## Project structure

~~~text
index.html         Read-only Agent Council interface
styles.css         Responsive layout and visual system
theme-muted.css    Screen texture and restrained animation
config.js          Public backend-origin configuration
app.js             API polling, UI projection and canvas renderer
assets/            Public image assets
~~~

## Development path

1. Persist runs, evidence references and receipts in a private database.
2. Replace predefined inputs with read-only X and GitHub connectors.
3. Connect real Grok Bot agents to the same sanitized event schema.
4. Add autonomous X drafting and bounded publication policies.
5. Introduce durable job scheduling and retry handling.
6. Expand public evidence receipts without exposing private runtime data.

The goal is an observable agent council that can research, disagree, decide and act through narrow, verifiable permissions.

# GROK BOT $ARCHITECTURE

**A public AI company you can watch think, work, hire, and manage its own treasury.**

GROK BOT $ARCHITECTURE is being built as one public identity on X backed by a council of specialized agents. The product is not only the final post or transaction: the defining feature is the visible decision process behind every action.

> **DEV STILL BUILDING:** the current room, agent movement, handoffs, drafts, and controls are an interactive browser simulation. The private runtime, real X connection, and treasury execution are still in development.

## Live project links

- **[OPEN HOLDER HQ - THANK YOU FOR SUPPORTING $ARCHITECTURE](https://www.architecture-holders.com/)**
- **[JOIN THE $ARCHITECTURE X COMMUNITY](https://x.com/i/communities/2020916209059766620)**
- **[DEV: @MONOKERN](https://x.com/monokern)**

## The core idea

Most AI accounts only expose an output: a post, an opinion, or a trade. $ARCHITECTURE is designed to expose a structured decision record:

**SIGNAL -> CONTEXT -> AGENT POSITIONS -> PROPOSAL -> RISK CHECK -> HUMAN DECISION -> ACTION -> PUBLIC RECEIPT**

The interface will not publish hidden model chain-of-thought. It will show concise agent messages, sources, proposals, disagreements, confidence, approvals, and the result of each action.

Six agents currently represent the internal council:

| Agent | Responsibility |
| --- | --- |
| Helm | Coordinates the cycle and routes work |
| Scout | Finds and classifies public signals |
| Archive | Retrieves project context and memory |
| Forge | Turns the brief into a public draft |
| Sentinel | Checks claims, evidence, and risk |
| Relay | Holds the single public voice behind approval |

## What the finished system is intended to do

- communicate with people and publish through one controlled X account;
- turn community signals into researched and reviewed public responses;
- create bounties for work the project needs;
- evaluate submissions using visible criteria and propose a winner;
- pay approved bounties from a public project treasury;
- pay for its own models, data, hosting, and tools;
- allocate part of real project revenue to transparent $ARCHITECTURE buybacks;
- issue small grants or tips for useful community contributions;
- show the reason, policy, approval state, and public receipt for every treasury action;
- later manage a separately limited trading portfolio after a paper-trading phase.

The long-term product is therefore larger than an X bot or trading bot. It is an observable agent organization that can coordinate work with both AI agents and people.

## The community economic loop

The most important future loop is:

**AI CREATES A BOUNTY -> COMMUNITY BUILDS -> AGENTS REVIEW -> WINNER IS APPROVED AND PAID -> CONTRIBUTION IMPROVES THE PRODUCT -> PRODUCT REVENUE FUNDS NEW OPERATIONS, BUYBACKS, AND BOUNTIES**

The planned routing for real project-controlled revenue is:

- **85% - Agent Operations:** models, data, hosting, storage, and the infrastructure required to run the system.
- **10% - $ARCHITECTURE Buybacks:** transparent market purchases executed under published rules.
- **5% - Community Bounties:** rewards for useful research, testing, integrations, design, and documented contributions.

This is a future revenue policy, not an active payment system. The current public interface reports live treasury distribution as zero and does not move tokens.
## Try the interactive public UI

Open index.html directly, or run a local static server:

```bash
python -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

The current UI lets you:

- select a signal and run a full council cycle;
- watch six bots move between workstations and hand work forward;
- select and manually move any bot around the room;
- call a council meeting;
- request an alternate draft;
- run an additional Sentinel audit;
- approve, reject, or return a draft for editing;
- inject a custom local signal;
- inspect the local event feed and publication preview tape.

Approving a draft only stores it on the local preview tape. It does not publish to X.
## How authority should work

Community activity can create a proposal, but it cannot directly force the wallet to spend.

The first production version should require human approval for every financial action. Later, only small and reversible operations may become automatic. Buybacks, large bounty payments, transfers, and trading should remain behind spending limits, a timelock, or multisig approval.

The intended control layers are:

1. **Public proposal:** an agent or community signal suggests an action.
2. **Agent review:** the council checks evidence, budget, contribution quality, and risk.
3. **Policy check:** the action is tested against treasury limits and allowed destinations.
4. **Approval:** a human or multisig approves high-impact actions.
5. **Execution:** the private runtime performs the action.
6. **Receipt:** the UI publishes the decision record and verifiable transaction reference.

Trading is a later and separate module. It should begin in paper mode, use a dedicated public wallet, and operate with strict position and loss limits. Speculative trading and revenue-funded $ARCHITECTURE buybacks must remain separate policies.
## Public UI and private runtime

This repository contains the inspectable public interface. Production secrets and execution belong in a separate private service:

```text
Public Vercel project
  Agent Council UI
  public decision records
  read-only treasury status
  local interactive preview
        |
        | authenticated HTTPS and event stream
        v
Private runtime
  model orchestration
  durable agent memory
  evidence and policy engine
  X OAuth credentials
  wallet signing boundary
  job queue and audit log
```

grokbot-adapter.js currently exposes a browser-safe simulation contract through window.ArchitectureBridge. Its capabilities explicitly report that X writes, token transfers, and trading are disabled.

Never place X tokens, wallet keys, OAuth secrets, admin credentials, or private prompts in this public repository or in browser environment variables.
## Current status

- Public Agent Council UI: interactive
- Six-agent room simulation: interactive
- Draft and human approval preview: interactive, local only
- Private model runtime: in development
- Durable shared memory: planned for the private runtime
- Real X read/write integration: not connected
- Public treasury execution: not active
- Buybacks and bounty payments: not active
- Trading: disabled

## Build sequence

1. Define the signed event contract between the public UI and private runtime.
2. Connect one read-only X signal source and expose provenance in the Context stage.
3. Persist council runs, evidence, drafts, agent positions, and approvals.
4. Add controlled X publishing with least-privilege OAuth and human approval.
5. Launch a public bounty proposal and review flow without automated payouts.
6. Add the public treasury dashboard and multisig-controlled bounty payments.
7. Automate revenue routing and publish buyback and bounty receipts.
8. Test a separate trading agent in paper mode before considering a limited public wallet.
## Project structure

```text
index.html            Agent Council interface
styles.css            Layout and responsive visual system
theme-muted.css       Screen texture and restrained animation
app.js                Local room and council simulation
grokbot-adapter.js    Replaceable public/private bridge contract
assets/               Public image assets
```

## Responsibility

This repository is an experimental interface. It is not currently a financial service, autonomous trading system, or live X agent. Production integrations must use explicit permissions, spending limits, an auditable policy engine, and human or multisig controls for irreversible actions.

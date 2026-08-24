# Night Shift

An original interactive control room for autonomous AI agent teams. It visualizes the architecture from `art14.md`: Chief-of-Staff delegation, specialist handoffs, persistent artifacts, review, and an approval boundary for consequential actions.

The current crew has six bots: Helm, Forge, Sentinel, Scout, Archive, and Relay. They occupy one continuous pixel office, wander while idle, follow collision-aware corridor routes, meet at the common handoff table, exchange artifacts, and stop external work at the Approval Airlock.

The built-in NS-INT-042 scenario runs for roughly five minutes at 1x. It researches 24 sources, builds a competitor intelligence brief, indexes an evidence pack, performs an independent audit, and pauses before publication for a human decision.

## Run

No dependencies or build step are required. Open `index.html` in a modern browser.

For a local HTTP server:

```powershell
npx serve .
```

## Controls

- **Start mission** begins the NS-INT-042 simulation.
- **Pause** holds or resumes the timeline.
- **Reset** restores the initial state.
- **1x / 2x / 4x / 10x** changes simulation speed.
- **Inspect / Reject / Approve** resolves the Approval Airlock decision.
- Click agents or rooms to inspect them.
- Keyboard: `Space` starts/pauses, `R` resets.

The current event simulation can later be replaced by WebSocket events from a custom MCP bridge without changing the visual state model.

# prototype/

Drop the claude.ai-generated prototype here as **`habithatch_v1.html`**.

Generate it with the prompt in [`../PROTO-PROMPT.md`](../PROTO-PROMPT.md) (attach
`pawductivity_v1.html` from the Pawductivity repo as the fidelity reference, `../PLAN.md`,
and all files under `../assets/`).

Once it's here, `habithatch_v1.html` is the **1:1 source of truth** for the app build in
[`../BUILD-PROMPT.md`](../BUILD-PROMPT.md) — the Expo/RN app must match it pixel-for-pixel,
exactly like Pawductivity was built from its own `prototype/pawductivity_v1.html`.

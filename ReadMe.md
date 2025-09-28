# MSFS 2024 Dev Learning Notes & Samples

This repository is a personal companion site + sample pack documenting my journey learning Microsoft Flight Simulator 2024 (MSFS2024) content and instrument development. It collects:
- Cleaned-up, corrected versions of official SDK tutorial material (where the docs are outdated or incomplete).
- Working sample source for HTML/JS/CSS instruments.
- Step-by-step notes, pitfalls, and workflow clarifications discovered while building and integrating a custom gauge.

If you're also exploring MSFS2024 development, feel free to read, adapt, and experiment—this is not an authoritative SDK replacement, just a practical, working reference.

---

## Repository Structure

```
Tutorials/
  ReadMe.md        <- Full "Tutorial of the Tutorial" walkthrough (detailed)
  FSAvionics/
    Readme.md      <- Avionics (React/FSComponent) tutorial companion
  Instruments/
    HelloWorldDisplay/
      helloworld.html
      helloworld.js
      helloworld.css      
LICENSE
```

The root `README.md` (this file) gives the overview; the deeper tutorial lives in `Tutorials/ReadMe.md`.

---

# Tutorials
Additional support for those following the following MSFS Tutorial
 * Creating and Embedding a Custom HTML/JS Instrument (HelloWorld)
 * MSFS 2024 Avionics Development
---

## Summary: Creating and Embedding a Custom HTML/JS Instrument (HelloWorld)

The detailed narrative is in `Tutorials/ReadMe.md`; here’s the concise version of what was done and what was fixed.

### Goal
Create a minimal HTML/JS/CSS instrument (“Hello World”) and integrate it into the DA62 SDK sample aircraft without modifying meshes—just swapping one existing display.


### When to Read It
After you are comfortable with the pure HTML/JS HelloWorld example and want to move to the structured FSComponent/React style used by modern MSFS avionics.

---

### Common Pitfalls
| Issue | Symptom | Fix |
|-------|---------|-----|
| Space or mismatch in instrument registration name | Gauge silently fails | Ensure `registerInstrument` name matches usage and has no spaces |
| Editing original standalone folder after import | Changes ignored | Edit the embedded copy under the aircraft’s `PackageSources` hierarchy |
| Using outdated electrical logic | Instrument never powers | TBA |

---

## Avionics (React/FSComponent) Helper

See `Tutorials/FSAvionics/Readme.md` for a companion to the MSFS 2024 Avionics (React-based) development tutorial.

### What it Adds / Clarifies
- Updated `tsconfig.json` guidance (augment defaults instead of blind replacement).
- Mapping from the plain HTML gauge workflow to a React/FSComponent instrument (creating the project, naming, folder placement).
- Correct panel integration examples (replacing the Speed Backup display) for `panel.cfg` and `panel.xml`.
- Use of `type VNode` import pattern to satisfy TypeScript + SDK typings.
- Recommended deploy script example (copy build output into the aircraft `PackageSources` tree) and reminder that import embeds a copy.
- Order-of-operations warning: finish styling (CSS) before attempting the first in-sim build so assets resolve correctly.
- Centering UI content with flex layout for a cleaner default appearance.

### Web Host Preview Utility (Early Prototype)

A lightweight Express-based local host is included at `Tutorials/FSAvionics/web-host` to let you preview `MyInstrument.html` (and the Rollup-built JS/CSS) in a normal browser without launching MSFS. It:

- Serves the compiled instrument script and stylesheet under MSFS-like paths (e.g. `/Pages/VCockpit/Instruments/...`).
- Injects simple emulator scripts (placeholders) so basic layout can render even when SimVar APIs aren’t present.
- Wraps the fragment in a fixed-size (400x512) frame matching the panel config to validate sizing/overflow.
- Provides quick iteration: `npm run build` (root), then from `web-host/` run `npm install && npm start` and open http://localhost:5173.

Limitations: Not a full simulator context (no real SimVars, no Coherent, timing differences). Use it only for rapid styling/layout iteration. Feedback & suggestions welcome—this host is intentionally minimal and may change.

---

## License

See `LICENSE` for repository licensing (does not supersede Microsoft / Asobo SDK terms).  
Respect Microsoft Flight Simulator EULA and SDK redistribution rules for any derived content.

---

## Contributing / Personal Scope

This is primarily a personal learning log. Suggestions or issue reports are welcome, but scope is intentionally narrow: clarity, correctness, and small, reproducible instrument examples.

---

## Where to Go Next

Read the full expanded walkthrough in:  
`Tutorials/ReadMe.md`


Fly safe...

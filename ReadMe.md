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
  Instruments/
    HelloWorldDisplay/
      helloworld.html
      helloworld.js
      helloworld.css      
LICENSE
```

The root `README.md` (this file) gives the overview; the deeper tutorial lives in `Tutorials/ReadMe.md`.

---

## Summary: Creating and Embedding a Custom HTML/JS Instrument (HelloWorld)

The detailed narrative is in `Tutorials/ReadMe.md`; here’s the concise version of what was done and what was fixed.

### Goal
Create a minimal HTML/JS/CSS instrument (“Hello World”) and integrate it into the DA62 SDK sample aircraft without modifying meshes—just swapping one existing display.


### Common Pitfalls
| Issue | Symptom | Fix |
|-------|---------|-----|
| Space or mismatch in instrument registration name | Gauge silently fails | Ensure `registerInstrument` name matches usage and has no spaces |
| Editing original standalone folder after import | Changes ignored | Edit the embedded copy under the aircraft’s `PackageSources` hierarchy |
| Using outdated electrical logic | Instrument never powers | TBA |

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

# Survivor Simulator

A Survivor-style season simulator with both a Python engine and a browser UI. The browser version uses Pyodide and a generated bundle of the local Python source.

## Project Structure

```text
.
|-- SurvivorSimulator.py          # Compatibility launcher for old commands/imports
|-- survivor_sim/                 # Python simulator package and supporting modules
|-- web/
|   |-- index.html                # Browser app entry point
|   |-- scripts/                  # Browser JavaScript
|   |-- styles/                   # Browser CSS
|   `-- generated/                # Generated Pyodide Python bundle
|-- assets/images/                # Static image assets
|-- data/                         # Persistent simulator data, such as social memory
|-- logs/                         # Runtime logs
`-- tools/                        # Maintenance scripts
```

## Run The Browser App

Open `web/index.html` in a browser. The app will load the JavaScript UI and the generated Python bundle from `web/generated/python_sources.generated.js`.

## Run The Python Simulator

```powershell
py SurvivorSimulator.py
```

The root `SurvivorSimulator.py` file is intentionally small. It preserves the original command while the implementation lives in `survivor_sim/simulator.py`. If your Windows Python alias is configured, `python SurvivorSimulator.py` works too.

## Rebuild The Browser Python Bundle

Run this after changing Python source files:

```powershell
.\tools\build_python_bundle.ps1
```

This regenerates `web/generated/python_sources.generated.js` so the Pyodide-powered browser simulator uses the same Python code as the local package.

## Runtime Files

Persistent relationship memory is stored in `data/social_memory.json`. Text logs are written to `logs/survivor_log.txt`.

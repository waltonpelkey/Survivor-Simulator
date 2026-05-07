"""Compatibility launcher for the Survivor simulator.

The simulator implementation now lives in :mod:`survivor_sim.simulator`.
This file keeps existing imports and `python SurvivorSimulator.py` working.
"""

from survivor_sim.simulator import *  # noqa: F401,F403


if __name__ == "__main__":
    import runpy

    runpy.run_module("survivor_sim.simulator", run_name="__main__")

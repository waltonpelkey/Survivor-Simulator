# Survivor Simulator Test Plan

This document is the working checklist for expanding the pytest suite. It is intentionally broader than the current tests so future changes can be made with confidence instead of guessing whether the simulator still works.

## Testing Priorities

1. Fast unit tests for small helpers and data classes.
2. Deterministic tests for strategy, voting, tribe, and social-memory behavior.
3. Integration tests for complete mini-seasons using fixed seeds.
4. Regression tests for bugs found while developing the browser or Python simulator.

## Current Smoke Tests

- `tests/test_imports.py::test_public_simulator_imports_are_available`
- `tests/test_imports.py::test_build_players_from_cast_preserves_basic_cast_data`
- `tests/test_imports.py::test_player_round_reset_clears_transient_state`

## Player Model

Target files:

- `survivor_sim/player.py`
- `survivor_sim/simulator.py` duplicate/primary `Player` implementation

Tests to add:

- `__repr__` returns the player name.
- `ensure_randomized_stats` fills missing strategy, threat, challenge, and social values.
- `ensure_randomized_stats` does not overwrite stats that are already set.
- randomized stats are always between `1` and `5`.
- repeated randomization with the same seeded RNG is deterministic.
- `update_relationship` creates a relationship entry when none exists.
- `update_relationship` adds positive and negative deltas correctly.
- `clamp_relationship` clamps values below the minimum.
- `clamp_relationship` clamps values above the maximum.
- `clamp_relationship` leaves in-range values unchanged.
- `reset_for_round` clears `immune`, `vote_target`, and `left_tribal_no_vote`.
- `reset_for_round` does not clear persistent fields like relationships, inventory, idols, or tribe label.
- `give("idol")` increments both `idols` and inventory.
- `give(non_idol)` increments inventory without changing `idols`.
- `give` supports quantities greater than `1`.
- `take_one` returns `True` and decrements inventory when an advantage exists.
- `take_one("idol")` decrements both inventory and `idols`.
- `take_one` never makes `idols` negative.
- `take_one` returns `False` and leaves state unchanged when the item is absent.

## Config And Plans

Target files:

- `survivor_sim/config.py`
- `survivor_sim/plan.py`
- `survivor_sim/simulator.py` `GameConfig` and `SeasonPlan`

Tests to add:

- default `GameConfig` values match expected runtime paths: `logs/survivor_log.txt` and `data/social_memory.json`.
- finalist choices include only valid counts.
- weighted swap and nominee settings have matching value/weight lengths.
- probability values are between `0.0` and `1.0`.
- color palette contains enough unique values for common tribe counts.
- `SeasonPlan` list fields use independent default lists per instance.
- `SeasonPlan` accepts manual starting tribes and labels without mutation.
- battleback, swap, merge, and demerge plan fields can be combined without constructor errors.

## Logging

Target files:

- `survivor_sim/logger.py`
- `survivor_sim/simulator.py` `Logger`

Tests to add:

- logger creates parent directories for nested log paths.
- logger writes a header on initialization.
- messages below the configured log level are ignored.
- messages at the configured log level are written.
- messages above the configured log level are written.
- `debug`, `info`, `warn`, and `error` delegate to `log` with the correct level.
- logger works when `logfile=None` in the simulator logger.
- logger handles unwritable paths gracefully where the standalone logger is best-effort.
- disabled simulator logger prints and writes nothing.

## Reporting Helpers

Target files:

- `survivor_sim/reporting.py`
- `survivor_sim/reporting_extra.py`

Tests to add:

- empty vote counters produce a sensible empty summary.
- one-candidate final vote formats correctly.
- tied final votes format all tied candidates.
- two-phase summaries include initial counts, revote counts, voided votes, and notes.
- notes are omitted when no notes exist.
- counts sort consistently by vote count and player name.
- summary formatting handles players represented by objects with `name`.
- summary formatting handles string-like fallback objects.
- alliance component extraction returns one component for a connected graph.
- alliance component extraction returns multiple components for disconnected graphs.
- alliance component extraction includes isolated nodes.
- bridge candidate helpers return no bridges when already connected.
- bridge candidate helpers sort by strongest bridge first.

## Cast Builders

Target file:

- `survivor_sim/simulator.py`

Tests to add:

- `build_players_from_cast` preserves names and player IDs.
- `build_players_from_cast` copies strategy, threat, challenge, and social stats.
- `build_players_from_cast` handles missing stat values.
- `build_player_names_from_cast` returns names in input order.
- `build_starting_tribes_from_cast` groups by numeric tribe.
- `build_starting_tribes_from_cast` sorts tribes by tribe number.
- cast members with the same tribe stay in input order inside that tribe.
- empty cast returns empty player and tribe lists.
- duplicate player IDs are detected by simulator initialization or documented as unsupported.

## Social Memory

Target file:

- `survivor_sim/simulator.py` `SocialMemory`

Tests to add:

- new memory starts empty when the file does not exist.
- malformed JSON loads as empty memory without crashing.
- `save` creates the parent directory when needed.
- saved memory reloads relationships, threats, and profiles exactly.
- relationship values are coerced to integers on load.
- threat values are coerced to floats on load.
- invalid nested memory entries are ignored.
- `remember_player` stores latest name by player ID.
- `latest_name_for` returns stored name when available.
- `latest_name_for` falls back to the player ID.
- `player_has_any_history` detects outgoing relationships.
- `player_has_any_history` detects incoming relationships.
- `player_has_any_history` detects threat history.
- `describe_player` returns relationships, threat perceptions, player ID, and latest name.
- `get_relationship` returns default for missing pairs.
- `set_relationship` creates nested observer entries.
- `has_relationship` distinguishes missing relationships from zero-valued relationships.
- `average_threat_for_target` returns `None` when no observers exist.
- `average_threat_for_target` excludes the requested observer.
- `apply_relationships_to_players` supports `overwrite` mode.
- `apply_relationships_to_players` supports `blend` mode.
- relationship application respects clamp min and max.
- `apply_threat_perceptions_to_players` uses saved returning-player memory.
- newbie observers use average historical threat for returning targets.
- missing threat memory keeps current in-season values.
- `update_from_players` merges relationships with previous memory.
- `update_from_players` clamps relationship and threat values.

## Event Bus

Target file:

- `survivor_sim/simulator.py` `EventBus`

Tests to add:

- subscribing to an event stores a handler.
- emitting an event calls all handlers in registration order.
- emitting passes keyword arguments through.
- emitting an event with no handlers is a no-op.
- one failing handler behavior is documented and tested.
- multiple event names stay isolated.

## Strategies

Target file:

- `survivor_sim/strategies.py`

Tests to add:

- `_fallback_target_score` increases for higher threat targets.
- `_fallback_target_score` decreases for stronger voter-target relationships.
- `_score_target` uses a player-specific scoring hook when present.
- `_score_target` falls back when no hook exists.
- `_best_targets_for_voter` returns all equally best targets.
- `_best_targets_for_voter` ignores lower-scored targets.
- `_top_voted_players` handles empty tallies.
- `_top_voted_players` returns no more than `n`.
- `_top_voted_players` includes tied players consistently.
- `DefaultNominationStrategy` returns requested nominee count when enough players exist.
- nominee strategy never returns duplicate players.
- nominee strategy handles desired counts larger than pool size.
- nominee strategy handles empty pools.
- `DefaultVotingStrategy` picks from eligible targets only.
- voting strategy is deterministic when there is one eligible target.
- voting strategy handles ties by random choice among best targets.
- `DefaultIdolPolicy._threshold` decreases/increases correctly by strategy level.
- final-six and final-five advantage windows enforce legal timing.
- idol policy does not play advantages for immune players.
- idol policy plays self-protection when holder is leading vote target.
- idol policy can protect allies when relationship and vote pressure are high.
- idol nullifier removes protection from matching targets.
- 50/50 coin success protects and failure does not.
- super idol handling is deferred to the simulator where intended.
- tie breaker resolves clear revote majorities.
- tie breaker can fall back to rocks when revote remains tied.
- tie breaker handles no rock-eligible players.
- premerge challenge returns one losing tribe.
- premerge challenge respects sit-out behavior.
- individual challenge marks winners immune.
- individual challenge increases winner threat.
- challenge system respects requested number of winners.

## Neural Agents

Target file:

- `survivor_sim/agents.py`

Tests to add:

- `TrainingBuffer` starts empty.
- `clear` removes all samples.
- `add_vote` ignores voters without `_feature_fn`.
- `add_vote` adds one sample per eligible candidate.
- chosen candidate receives label `1`; others receive `0`.
- stored feature arrays are copied, not shared.
- `to_arrays` returns zero-shaped arrays when empty.
- `to_arrays` stacks features and labels correctly.
- `LoggingVotingStrategy` records samples and returns the chosen target.
- `NeuralPolicy.forward` returns a float for one-layer and two-layer policies.
- `NeuralPolicy.forward` handles expected input shape.
- `NeuralAgent` stores feature function and policy.
- `NeuralAgent._score_target_for_voter` delegates to policy output.
- `default_feature_fn` returns a vector of length `8`.
- `default_feature_fn` normalizes relationship, threat, social, and strategy values.
- `default_feature_fn` marks same-tribe status.
- `make_simple_mlp` is deterministic for the same seed.
- `make_simple_mlp` creates expected weight and bias shapes.
- `train_logistic_from_buffer` rejects empty buffers.
- trained logistic policy can score a candidate after fitting.

## Graph Utilities

Target file:

- `survivor_sim/graph_utils.py`

Tests to add:

- `build_alliance_graph` returns all pool members as nodes.
- interest mode includes edges above threshold.
- interest mode excludes edges below threshold.
- relationship mode includes only mutual relationships above minimum.
- relationship mode normalizes weights into a stable range.
- graph edges sort by descending weight.
- `maximum_spanning_forest` returns no edges for zero or one node.
- maximum spanning forest connects components without cycles.
- maximum spanning forest prefers higher-weight edges.
- layout fallback returns one coordinate per node without `networkx`.
- `draw_alliance_graph` no-ops when matplotlib is unavailable.
- `components_from_edges` handles empty nodes.
- `components_from_edges` handles isolated nodes.
- `minimal_strong_bridges` returns bridges between disconnected components.
- `minimal_strong_bridges` returns no bridges for connected components.
- `sample_traversal_path` returns `None` when traversal is impossible.
- `sample_traversal_path` returns a path using only supplied edges.

## Spreadsheet Recorder

Target file:

- `survivor_sim/spreadsheet.py`

Tests to add:

- recorder attaches to simulator event bus.
- tribal-start event creates a round record.
- vote-cast event appends voter and target data to the correct round.
- eliminated event records boot information.
- missing round records are handled gracefully.
- export writes `.xlsx` when openpyxl is available.
- export falls back or errors clearly when spreadsheet dependencies are missing.
- CSV-like export writes headers and rows.
- empty recorder export creates a valid empty report.
- exported paths create parent folders or fail clearly.

## Simulator Core Setup

Target file:

- `survivor_sim/simulator.py` `SurvivorSimulator`

Tests to add:

- initialization stores players, config, logger, and season plan.
- initialization applies deterministic seed behavior.
- players receive randomized stats when missing.
- existing player stats are preserved.
- `find_player_by_id` returns matching player.
- `find_player_by_id` returns `None` for unknown IDs.
- `old_player_memory` delegates to social memory.
- starting tribe count respects explicit plan.
- starting tribe count handles small casts.
- starting colors contain enough unique labels.
- merge point respects locked season plan.
- merge point stays within legal player counts.
- swap trigger planning avoids impossible trigger points.
- vote option count respects weighted choices.
- planned vote option queue has requested length.
- idol seeding gives advantages only to active tribe members.
- merge idol drops only when needed.
- phase progress starts near `0` and increases as players leave.
- threat multipliers update as season progresses.
- relationship initialization creates directional relationships for every pair.
- threat perception initialization creates directional threat values.

## Tribe And Roster Management

Target file:

- `survivor_sim/simulator.py`

Tests to add:

- `split_into_tribes` assigns every player exactly once.
- manual labels are applied when provided.
- tribe split handles uneven tribe sizes.
- emergency rebalance detects empty or invalid tribe states.
- exile sends only active players.
- effective team count lowers impossible requested counts.
- swaps preserve roster integrity.
- swaps do not duplicate or lose players.
- demerge and swap settings interact safely.
- `_assert_roster_integrity` passes valid state.
- `_assert_roster_integrity` fails duplicate player state.
- `_names_to_players` resolves names and IDs.
- unknown names are ignored or rejected consistently.

## Statistics And Tracking

Target file:

- `survivor_sim/simulator.py`

Tests to add:

- stat rows are created lazily for every player.
- found advantages increment the correct stat.
- played advantages increment the correct stat.
- immunity wins increment for all winners.
- return-to-game tracking marks returning players.
- received votes are buffered during a tribal.
- received votes commit into player stats after tribal.
- vote participation marks correct votes, incorrect votes, and non-votes.
- final placement calculation handles finalists and boot order.
- jury votes are recorded in final stats.

## Prediction And Rollout Helpers

Target file:

- `survivor_sim/simulator.py`

Tests to add:

- `_safe_pct` returns `0.0` for zero denominator.
- player lookup maps player IDs to players.
- player state snapshot includes stats, relationships, threats, advantages, and flags.
- restoring a snapshot returns players to exact previous state.
- cloned players preserve IDs, stats, inventory, and relationships.
- cloned tribes preserve tribe membership using cloned players.
- placement from boot order returns winner and eliminated placements correctly.
- prediction aggregate averages placements.
- prediction aggregate computes win, survival, and combined percentages.
- rollout config disables persistence and heavy side effects.
- rollout plan copies relevant season state without mutating the real plan.
- rollout simulator is isolated from real simulator state.
- round prediction summary sorts by configured order.
- prediction chart handles empty rows.

## Rewards, Events, Advantages, And Twists

Target file:

- `survivor_sim/simulator.py`

Tests to add:

- reward challenge can be skipped when disabled.
- reward label chooses premerge and merge categories correctly.
- attached advantages only go to attendees.
- advantage diversity avoids repeatedly overusing the same type when possible.
- family visit changes relationships for involved players.
- auction can award advantages and relationship changes.
- idols expire after legal play windows.
- planned idol finds happen only in the intended round.
- battleback returns one eligible player.
- battleback does nothing when no eligible players exist.
- demerge creates valid temporary tribes.
- demerge rejoins players afterward.

## Alliances And Relationship Drift

Target file:

- `survivor_sim/simulator.py`

Tests to add:

- relationship drift changes relationships within configured bounds.
- bonding drift affects only the provided group.
- `_rel` reads directional relationships correctly.
- alliance candidate generation respects max alliance size.
- top edge pairs are sorted by strongest edge.
- edge weights work in both interest and relationship modes.
- component extraction handles disconnected alliance groups.
- strong bridge detection suggests cross-component bridges.
- traversal path uses connected alliance edges.
- ASCII graph printing works for empty and non-empty pools.
- alliance snapshot printing handles fewer players than requested top counts.

## Voting And Tribal Council

Target file:

- `survivor_sim/simulator.py`

Tests to add:

- eligible target calculation excludes voter.
- eligible target calculation excludes immune players.
- restricted target lists are respected.
- alignment adjustment increases votes toward alliance-preferred targets.
- protective immunity target sanitization removes illegal targets.
- tribal council eliminates exactly one player in normal cases.
- tribal council handles idol plays and voided votes.
- tribal council handles ties, revotes, and rocks.
- vote calculation returns one target per voting player.
- vote calculation skips players with no vote.
- pre-vote advantages can block, steal, or add votes.
- voting alignment effects reward correct alliance voting.
- fire-making selects one eliminated player from contenders.

## Round And Season Flow

Target file:

- `survivor_sim/simulator.py`

Tests to add:

- `run_round` decreases active player count by one in ordinary rounds.
- `run_round` triggers swaps at planned counts.
- `run_round` triggers merge at planned merge count.
- final-three finale produces one winner.
- final-two finale produces one winner.
- return-winner finale variants return the winner object.
- final cast ranking sorts by resume score.
- social memory saves at end only when enabled.
- `run_game` runs until a winner exists.
- `run_game` honors manual tribe count and labels.
- `run_game` honors disabled social memory.
- jury from boot log has expected size.
- jury vote chooses from finalists only.
- final tribal council returns one finalist winner.
- final prediction snapshot handles no prediction data.

## Browser/Pyodide Bundle

Target files:

- `tools/build_python_bundle.ps1`
- `web/generated/python_sources.generated.js`

Tests to add:

- bundle script includes root compatibility launcher.
- bundle script includes every `survivor_sim/*.py` file.
- generated bundle values are plain strings, not `{ value: ... }` objects.
- generated JavaScript defines `window.SURVIVOR_PYTHON_SOURCES`.
- bundle can be regenerated without changing content when source files are unchanged.
- web app source paths in `web/index.html` point to existing files.
- browser runner imports simulator classes from the bundle.

## End-To-End Regression Seasons

Tests to add:

- tiny 4-player season finishes without crashing.
- 8-player season with final 2 finishes with exactly two finalists.
- 9-player season with final 3 finishes with exactly three finalists.
- manual starting tribes preserve original tribe labels.
- forced swap at a specific remaining count happens once.
- forced merge at a specific remaining count happens once.
- disabled random idols produces no random idol finds.
- enabled social memory writes memory data after the season.
- same seed and same cast produce the same winner and boot order.
- different seed can produce a different boot order while preserving invariants.

## Fixtures To Build

- `player_factory`: creates valid players with predictable stats.
- `cast_factory`: creates casts with requested size and tribe count.
- `sim_factory`: creates a simulator with disabled logs, disabled persistence, and deterministic seed.
- `memory_file`: provides a temporary social memory JSON path.
- `dummy_logger`: captures log messages without printing to stdout.
- `dummy_event_bus`: captures emitted spreadsheet/reporting events.
- `small_season_plan`: valid plan for 4-8 player regression tests.

## Coverage Goals

- Start with pure helpers and data classes because they are fast and stable.
- Add simulator integration tests around one behavior at a time.
- Keep full-season tests deterministic and few, since they are slower.
- Any bug fixed in the simulator should get a regression test before the fix is considered done.

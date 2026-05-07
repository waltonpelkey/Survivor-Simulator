from __future__ import annotations
import sys

from survivor_sim.reporting import (
    counts_for_summary as _counts_for_summary,
    format_final_summary as _format_final_summary,
    format_two_phase_summary as _format_two_phase_summary,
    REWARD_BASE_TYPES,
)
from survivor_sim.config import (
    ADV_5050,
    ADV_DOUBLE_IDOL,
    ADV_EXTRA_VOTE,
    ADV_FAKE_HELD,
    ADV_FAKE_KIT,
    ADV_IDOL,
    ADV_KIP,
    ADV_LEGACY,
    ADV_NULLIFIER,
    ADV_SAFETY,
    ADV_SUPER_IDOL,
    ADV_VOTE_BLOCK,
    ADV_VOTE_STEAL,
    LOG_DEBUG,
    LOG_ERROR,
    LOG_INFO,
    LOG_WARNING,
)
from survivor_sim.advantage import AdvantageCopy, AdvantageKnowledge, AdvantageSeed, AdvantageTiming
from survivor_sim.strategies import (
    NominationStrategy,
    VotingStrategy,
    IdolPolicy,
    TieBreakerStrategy,
    ChallengeSystem,
    DefaultNominationStrategy,
    DefaultVotingStrategy,
    DefaultIdolPolicy,
    DefaultTieBreakerStrategy,
    DefaultChallengeSystem,
)

import json
import os
import random
import time
import copy

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, Iterable, List, Optional, Sequence, Set, Tuple, Union, cast
from collections import Counter, defaultdict, deque

from survivor_sim.graph_utils import draw_alliance_graph

PresetRelationshipList = List[Tuple[str, str, int]]
PresetRelationshipMap = Dict[Tuple[str, str], int]
PresetRelationships = Union[PresetRelationshipList, PresetRelationshipMap]


def _empty_str_list() -> List[str]:
    return []


def _empty_int_list() -> List[int]:
    return []


def _empty_prediction_snapshot_map() -> Dict[str, "SimulationPlayerSnapshot"]:
    return {}


def _empty_placement_finishes() -> List[int]:
    return []


def _empty_prediction_rows() -> List["PlayerPredictionAggregate"]:
    return []


def _empty_idol_finds() -> Dict[int, List[str]]:
    return {}


def _empty_preset_relationships() -> PresetRelationshipList:
    return []


def _empty_advantage_seeds() -> List[AdvantageSeed]:
    return []


def _empty_advantage_copies() -> List[AdvantageCopy]:
    return []


def _empty_swap_tribe_labels() -> Dict[int, List[str]]:
    return {}


def _empty_player_relationships() -> Dict["Player", int]:
    return {}


def _empty_threat_perceptions() -> Dict["Player", float]:
    return {}


def _empty_advantage_knowledge() -> Dict[str, AdvantageKnowledge]:
    return {}


def _empty_inventory() -> Counter[str]:
    return Counter()


IDOL_ADVANTAGE_TYPES: Set[str] = {
    ADV_IDOL,
    ADV_SUPER_IDOL,
    ADV_DOUBLE_IDOL,
}

IDOL_REHIDE_ACTIVE_CAP = 4

PROTECTIVE_ADVANTAGE_TYPES: Set[str] = {
    ADV_IDOL,
    ADV_SUPER_IDOL,
    ADV_DOUBLE_IDOL,
    ADV_5050,
    ADV_LEGACY,
    ADV_SAFETY,
}

KIP_IDOL_ASK_TYPES: Tuple[str, ...] = (
    ADV_IDOL,
    ADV_SUPER_IDOL,
    ADV_DOUBLE_IDOL,
)

KIP_ADVANTAGE_ASK_EXCLUSIONS: Set[str] = {
    ADV_IDOL,
    ADV_FAKE_HELD,
    "vote_blocked",
    "extra_ballots",
}


def _threat_level_or(player: "Player", default: float) -> float:
    value = getattr(player, "threat_level", None)
    return float(value) if value is not None else default


def _noop_event_handler(**kwargs: Any) -> None:
    _ = kwargs

# ----------------------------
# Logging (stdout + file)
# ----------------------------


class Logger:
    level_names = {
        LOG_DEBUG: "DEBUG",
        LOG_INFO: "INFO",
        LOG_WARNING: "WARN",
        LOG_ERROR: "ERROR",
    }

    def __init__(
        self,
        logfile: Optional[str] = "logs/survivor_log.txt",
        level: int = LOG_INFO,
        enabled: bool = True,
    ) -> None:
        self.logfile = logfile
        self.level = level
        self.enabled = enabled

        if not self.enabled:
            return

        if self.logfile is not None:
            log_dir = os.path.dirname(self.logfile)
            if log_dir:
                os.makedirs(log_dir, exist_ok=True)
            with open(self.logfile, "w", encoding="utf-8") as f:
                f.write(f"Survivor Simulation Log\n{'=' * 30}\n")
                f.write(f"Started: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")

    def log(self, msg: str, level: int = LOG_INFO) -> None:
        if not self.enabled:
            return
        if level < self.level:
            return

        print(msg)

        if self.logfile is not None:
            log_dir = os.path.dirname(self.logfile)
            if log_dir:
                os.makedirs(log_dir, exist_ok=True)
            with open(self.logfile, "a", encoding="utf-8") as f:
                f.write(msg + "\n")

    def debug(self, msg: str) -> None:
        self.log(msg, LOG_DEBUG)

    def info(self, msg: str) -> None:
        self.log(msg, LOG_INFO)

    def warn(self, msg: str) -> None:
        self.log(msg, LOG_WARNING)

    def error(self, msg: str) -> None:
        self.log(msg, LOG_ERROR)
        

# ----------------------------
# Optional Season Plan (user overrides)
# ----------------------------

@dataclass
class SeasonPlan:
    starting_tribes: Optional[List[List[str]]] = None
    starting_tribe_labels: Optional[List[str]] = None

    finalists_count: Optional[int] = None
    jury_size: Optional[int] = None

    merge_at_remaining: Optional[int] = None
    merge_lock: bool = False

    num_swaps_override: Optional[int] = None
    swap_plan: Optional[List[Tuple[int, int]]] = None
    swap_tribe_labels_by_remaining: Dict[int, List[str]] = field(default_factory=_empty_swap_tribe_labels)

    initial_idol_holders: List[str] = field(default_factory=_empty_str_list)
    idol_finds_by_round: Dict[int, List[str]] = field(default_factory=_empty_idol_finds)
    merge_idol_holders: List[str] = field(default_factory=_empty_str_list)
    disable_random_idols: bool = False

    advantages_total_cap: Optional[int] = None
    advantages_enabled: bool = True
    seed_starting_tribe_idols: bool = True
    seed_merge_idol: bool = True
    advantage_seeds: List[AdvantageSeed] = field(default_factory=_empty_advantage_seeds)
    advantage_copies: List[AdvantageCopy] = field(default_factory=_empty_advantage_copies)
    force_family_visit_round: Optional[int] = None
    force_auction_round: Optional[int] = None

    enable_demerge: bool = False
    demerge_at_remaining: Optional[int] = None

    enable_battleback: bool = False
    battleback_points: List[int] = field(default_factory=_empty_int_list)

    preset_relationships: PresetRelationships = field(default_factory=_empty_preset_relationships)


# ----------------------------
# Game Config (tuning knobs)
# ----------------------------

@dataclass
class GameConfig:
    seed: Optional[int] = None

    finalists_count_choices: Tuple[int, ...] = (2, 3)

    weighted_num_swaps: Tuple[List[int], List[float]] = (
        [0, 1, 2, 3], [0.25, 0.45, 0.25, 0.05]
    )

    weighted_nominee_counts: Tuple[List[int], List[float]] = (
        [2, 3, 4], [0.82, 0.14, 0.04]
    )
    preplan_nominee_queue_len: int = 50

    p_avoid_rocks: float = 0.72
    p_last_chance_flip: float = 0.97

    allow_random_idols: bool = True
    p_exile_idol: float = 0.25
    merge_idol_count: int = 0
    advantages_enabled: bool = True
    seed_starting_tribe_idols: bool = True
    seed_merge_idol: bool = True
    advantage_seeds: List[AdvantageSeed] = field(default_factory=_empty_advantage_seeds)
    advantage_copies: List[AdvantageCopy] = field(default_factory=_empty_advantage_copies)

    logfile: str = "logs/survivor_log.txt"
    log_level: int = LOG_INFO

    postmerge_winners_per_round: int = 1
    enable_events: bool = True

    relationship_min: int = -sys.maxsize - 1
    relationship_max: int = sys.maxsize

    color_palette: Tuple[str, ...] = (
        "Blue", "Orange", "Green", "Purple", "Red", "Yellow",
        "Teal", "Magenta", "Cyan", "Maroon", "Navy", "Gold",
        "Silver", "Aqua", "Lime", "Coral", "Indigo", "Brown", "Pink", "Charcoal"
    )

    threat_curve_base: float = 5.0
    threat_curve_max_multiplier: float = 2.0
    preempt_weight_base: float = 1.6
    strategy_power: float = 1.25
    strategy_vote_weight: float = 2.0
    tie_flip_strat_bonus_max: float = 0.22
    correct_vote_threat_gain_high_strat: float = 0.5
    alignment_bonus_for_strategists: int = 1

    season_has_family_visit_p: float = 0.33
    season_has_auction_p: float = 0.33

    alliance_min_edge: int = 2
    alliance_max_size: int = 4
    alliances_top_k: int = 5
    alliance_show_top_pairs: int = 3

    alliances_use_interest: bool = True
    alliance_topk_targets: int = 3
    alliance_nonagg_topm: int = 2
    alliance_edge_threshold: float = 0.45
    alliance_rel_weight: float = 0.35
    alliance_interest_weight: float = 0.65

    align_nudge_strength: float = 0.35
    align_topk_friends: int = 3
    align_score_delta: float = 1.0

    solo_avoid_prob: float = 0.70
    solo_score_delta: float = 1.5
    plurality_consolidation_prob: float = 0.82
    plurality_consolidation_delta: float = 1.25
    advantage_split_prob: float = 0.22

    ascii_alliance_graph: bool = True
    ascii_graph_top_edges: int = 12
    ascii_graph_min_weight: float = 0.45

    ensure_traversable_graph: bool = True

    # Persistent social memory
    social_memory_file: str = "data/social_memory.json"
    use_social_memory: bool = True

    relationship_memory_mode: str = "blend"  # "blend" or "overwrite"
    relationship_memory_blend_weight: float = 0.75

    threat_memory_blend_weight: float = 0.80
    default_newbie_threat_view: float = 3.0

    save_social_memory_at_end: bool = True

    relationship_memory_clamp_min: int = -sys.maxsize - 1
    relationship_memory_clamp_max: int = sys.maxsize
    threat_memory_clamp_min: float = -sys.maxsize - 1
    threat_memory_clamp_max: float = sys.maxsize

    # Predictive Monte Carlo evaluation
    prediction_enabled: bool = True
    prediction_rollouts: int = 100
    prediction_log_each_round: bool = True
    prediction_include_ascii_chart: bool = True
    prediction_sort_descending: bool = True
    enable_visual_graphs: bool = True


# ----------------------------
# Persistent Social Memory
# ----------------------------

class SocialMemory:
    """
    Stores:
      - pairwise relationship memory: observer_id -> target_id -> int
      - pairwise perceived threat memory: observer_id -> target_id -> float
      - lightweight player profiles so old players are easy to reference by player_id
    """

    def __init__(self, filepath: str = "data/social_memory.json") -> None:
        self.filepath = filepath
        self.relationships: Dict[str, Dict[str, int]] = {}
        self.threat_perceptions: Dict[str, Dict[str, float]] = {}
        self.player_profiles: Dict[str, Dict[str, Any]] = {}
        self.load()

    def load(self) -> None:
        if not os.path.exists(self.filepath):
            self.relationships = {}
            self.threat_perceptions = {}
            self.player_profiles = {}
            return

        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                loaded: Any = json.load(f)

            raw: Dict[str, Any]
            if isinstance(loaded, dict):
                raw = cast(Dict[str, Any], loaded)
            else:
                raw = {}

            rel_raw_any = raw.get("relationships", {})
            thr_raw_any = raw.get("threat_perceptions", {})
            prof_raw_any = raw.get("player_profiles", {})

            rel_raw: Dict[Any, Any] = (
                cast(Dict[Any, Any], rel_raw_any)
                if isinstance(rel_raw_any, dict)
                else {}
            )
            thr_raw: Dict[Any, Any] = (
                cast(Dict[Any, Any], thr_raw_any)
                if isinstance(thr_raw_any, dict)
                else {}
            )
            prof_raw: Dict[Any, Any] = (
                cast(Dict[Any, Any], prof_raw_any)
                if isinstance(prof_raw_any, dict)
                else {}
            )

            relationships: Dict[str, Dict[str, int]] = {}
            for observer, inner_any in rel_raw.items():
                if not isinstance(inner_any, dict):
                    continue

                inner = cast(Dict[Any, Any], inner_any)
                observer_key = str(observer)
                relationships[observer_key] = {}

                for target, value in inner.items():
                    relationships[observer_key][str(target)] = int(value)

            threat_perceptions: Dict[str, Dict[str, float]] = {}
            for observer, inner_any in thr_raw.items():
                if not isinstance(inner_any, dict):
                    continue

                inner = cast(Dict[Any, Any], inner_any)
                observer_key = str(observer)
                threat_perceptions[observer_key] = {}

                for target, value in inner.items():
                    threat_perceptions[observer_key][str(target)] = float(value)

            player_profiles: Dict[str, Dict[str, Any]] = {}
            for pid, info_any in prof_raw.items():
                if not isinstance(info_any, dict):
                    continue

                player_profiles[str(pid)] = dict(cast(Dict[str, Any], info_any))

            self.relationships = relationships
            self.threat_perceptions = threat_perceptions
            self.player_profiles = player_profiles

        except Exception:
            self.relationships = {}
            self.threat_perceptions = {}
            self.player_profiles = {}

    def save(self) -> None:
        payload: Dict[str, Any] = {
            "relationships": self.relationships,
            "threat_perceptions": self.threat_perceptions,
            "player_profiles": self.player_profiles,
        }
        memory_dir = os.path.dirname(self.filepath)
        if memory_dir:
            os.makedirs(memory_dir, exist_ok=True)
        with open(self.filepath, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, sort_keys=True)

    def remember_player(self, player: "Player") -> None:
        self.player_profiles.setdefault(player.player_id, {})
        self.player_profiles[player.player_id]["latest_name"] = player.name

    def latest_name_for(self, player_id: str) -> str:
        return str(self.player_profiles.get(player_id, {}).get("latest_name", player_id))

    def player_has_any_history(self, player_id: str) -> bool:
        if player_id in self.relationships or player_id in self.threat_perceptions:
            return True
        for inner in self.relationships.values():
            if player_id in inner:
                return True
        for inner in self.threat_perceptions.values():
            if player_id in inner:
                return True
        return player_id in self.player_profiles

    def describe_player(self, player_id: str) -> Dict[str, Any]:
        return {
            "player_id": player_id,
            "latest_name": self.latest_name_for(player_id),
            "outgoing_relationships": self.relationships.get(player_id, {}),
            "outgoing_threat_perceptions": self.threat_perceptions.get(player_id, {}),
        }

    def get_relationship(self, observer_id: str, target_id: str, default: int = 0) -> int:
        return int(self.relationships.get(observer_id, {}).get(target_id, default))

    def set_relationship(self, observer_id: str, target_id: str, value: int) -> None:
        self.relationships.setdefault(observer_id, {})[target_id] = int(value)

    def has_relationship(self, observer_id: str, target_id: str) -> bool:
        return target_id in self.relationships.get(observer_id, {})

    def get_threat(self, observer_id: str, target_id: str, default: float = 0.0) -> float:
        return float(self.threat_perceptions.get(observer_id, {}).get(target_id, default))

    def set_threat(self, observer_id: str, target_id: str, value: float) -> None:
        self.threat_perceptions.setdefault(observer_id, {})[
            target_id] = float(value)

    def has_threat(self, observer_id: str, target_id: str) -> bool:
        return target_id in self.threat_perceptions.get(observer_id, {})

    def average_threat_for_target(
        self,
        target_id: str,
        exclude_observer_id: Optional[str] = None
    ) -> Optional[float]:
        vals: List[float] = []
        for observer_id, inner in self.threat_perceptions.items():
            if exclude_observer_id is not None and observer_id == exclude_observer_id:
                continue
            if target_id in inner:
                vals.append(float(inner[target_id]))
        if not vals:
            return None
        return sum(vals) / len(vals)

    def apply_relationships_to_players(
        self,
        players: List["Player"],
        mode: str = "blend",
        blend_weight: float = 0.75,
        clamp_min: int = -sys.maxsize - 1,
        clamp_max: int = sys.maxsize,
    ) -> None:
        for p in players:
            for q in players:
                if p is q:
                    continue
                if not self.has_relationship(p.player_id, q.player_id):
                    continue
                saved = self.get_relationship(p.player_id, q.player_id, 0)
                current = p.relationships.get(q, 0)
                if mode == "overwrite":
                    final_val = saved
                else:
                    final_val = int(
                        round(blend_weight * saved + (1.0 - blend_weight) * current))
                p.relationships[q] = max(clamp_min, min(clamp_max, final_val))

    def apply_threat_perceptions_to_players(
        self,
        players: List["Player"],
        default_newbie_view: float = 3.0,
        blend_weight: float = 0.80,
    ) -> None:
        """
        returning observer -> returning target: use saved directional memory
        newbie observer -> returning target: use avg historical threat from all saved observers
        otherwise leave default in-season view
        """
        for observer in players:
            observer_returning = self.player_has_any_history(
                observer.player_id)

            for target in players:
                if observer is target:
                    continue

                target_returning = self.player_has_any_history(
                    target.player_id)
                current = observer.threat_perceptions.get(
                    target,
                    float(
                        _threat_level_or(target, default_newbie_view)),
                )

                if observer_returning and target_returning and self.has_threat(observer.player_id, target.player_id):
                    saved = self.get_threat(
                        observer.player_id, target.player_id, current)
                    observer.threat_perceptions[target] = float(
                        blend_weight * saved + (1.0 - blend_weight) * current
                    )
                    continue

                if (not observer_returning) and target_returning:
                    avg = self.average_threat_for_target(
                        target.player_id,
                        exclude_observer_id=observer.player_id,
                    )
                    observer.threat_perceptions[target] = float(
                        avg if avg is not None else current)
                    continue

                observer.threat_perceptions[target] = float(current)

    def update_from_players(
        self,
        players: List["Player"],
        rel_clamp_min: int = -sys.maxsize - 1,
        rel_clamp_max: int = sys.maxsize,
        threat_clamp_min: float = -sys.maxsize - 1,
        threat_clamp_max: float = sys.maxsize,
    ) -> None:
        for p in players:
            self.remember_player(p)

        for p in players:
            for q, rel in p.relationships.items():
                if p is q:
                    continue
                old_val = self.get_relationship(p.player_id, q.player_id, 0)
                merged = int(round((old_val + int(rel)) / 2))
                merged = max(rel_clamp_min, min(rel_clamp_max, merged))
                self.set_relationship(p.player_id, q.player_id, merged)

            for q, threat in p.threat_perceptions.items():
                if p is q:
                    continue
                old_val = self.get_threat(
                    p.player_id,
                    q.player_id,
                    float(_threat_level_or(q, 3.0)),
                )
                merged = (old_val + float(threat)) / 2.0
                merged = max(threat_clamp_min, min(threat_clamp_max, merged))
                self.set_threat(p.player_id, q.player_id, merged)


# ----------------------------
# Event System
# ----------------------------

class EventBus:
    def __init__(self) -> None:
        self._subs: Dict[str, List[Callable[..., None]]] = {}

    def on(self, event_name: str, handler: Callable[..., None]) -> None:
        self._subs.setdefault(event_name, []).append(handler)

    def emit(self, event_name: str, **kwargs: Any) -> None:
        for cb in self._subs.get(event_name, []):
            cb(**kwargs)


# ----------------------------
# Player
# ----------------------------

@dataclass(eq=False)
class Player:
    name: str
    player_id: str = ""
    strategy_level: int = cast(int, None)
    threat_level: float = cast(float, None)
    challenge_ability: int = cast(int, None)
    social_skill: int = cast(int, None)

    relationships: Dict["Player", int] = field(default_factory=_empty_player_relationships)
    threat_perceptions: Dict["Player", float] = field(default_factory=_empty_threat_perceptions)
    advantage_knowledge: Dict[str, AdvantageKnowledge] = field(default_factory=_empty_advantage_knowledge)

    immune: bool = False
    vote_target: Optional["Player"] = None
    sat_out_last: bool = False
    idols: int = 0
    tribe_label: Optional[str] = None

    phase_threat_mult: float = 0.0
    phase_preempt_mult: float = 0.0

    inventory: Counter[str] = field(default_factory=_empty_inventory)
    left_tribal_no_vote: bool = False

    def __post_init__(self) -> None:
        if not self.player_id:
            self.player_id = self.name

    def __repr__(self) -> str:
        return self.name

    def ensure_randomized_stats(self, rng: random.Random) -> None:
        if not self.player_id:
            self.player_id = self.name
        if getattr(self, "strategy_level", None) is None:
            self.strategy_level = rng.randint(1, 5)
        if getattr(self, "threat_level", None) is None:
            self.threat_level = rng.randint(1, 5)
        if getattr(self, "challenge_ability", None) is None:
            self.challenge_ability = rng.randint(1, 5)
        if getattr(self, "social_skill", None) is None:
            self.social_skill = rng.randint(1, 5)

    def update_relationship(self, other: "Player", delta: int) -> None:
        self.relationships[other] = self.relationships.get(other, 0) + delta

    def clamp_relationship(self, other: "Player", clamp_min: int, clamp_max: int) -> None:
        val = self.relationships.get(other, 0)
        self.relationships[other] = max(clamp_min, min(clamp_max, val))

    def reset_for_round(self) -> None:
        self.immune = False
        self.vote_target = None
        self.left_tribal_no_vote = False

    def give(self, adv: str, qty: int = 1) -> None:
        if adv == ADV_IDOL:
            self.idols += qty
        self.inventory[adv] += qty

    def take_one(self, adv: str) -> bool:
        if self.inventory.get(adv, 0) > 0:
            self.inventory[adv] -= 1
            if adv == ADV_IDOL:
                self.idols = max(0, self.idols - 1)
            return True
        return False

# ----------------------------
# Predictive / Monte Carlo helpers
# ----------------------------


@dataclass
class SimulationPlayerSnapshot:
    player_id: str
    name: str
    alive: bool
    eliminated: bool
    in_finalists: bool
    won: bool
    placement: int


@dataclass
class SimulationRolloutResult:
    by_player_id: Dict[str, SimulationPlayerSnapshot] = field(
        default_factory=_empty_prediction_snapshot_map)


@dataclass
class PlayerPredictionAggregate:
    player_id: str
    name: str
    runs: int = 0
    wins: int = 0
    finals: int = 0
    placement_sum: float = 0.0
    placement_finishes: List[int] = field(default_factory=_empty_placement_finishes)

    def add_result(self, snap: SimulationPlayerSnapshot) -> None:
        self.runs += 1
        self.placement_sum += float(snap.placement)
        self.placement_finishes.append(int(snap.placement))
        if snap.won:
            self.wins += 1
        if snap.in_finalists:
            self.finals += 1

    @property
    def avg_placement(self) -> float:
        if self.runs <= 0:
            return 0.0
        return self.placement_sum / float(self.runs)

    @property
    def win_chance_pct(self) -> float:
        if self.runs <= 0:
            return 0.0
        return 100.0 * (self.wins / float(self.runs))

    @property
    def survival_chance_pct(self) -> float:
        if self.runs <= 0:
            return 0.0
        return 100.0 * (self.finals / float(self.runs))

    @property
    def combined_pct(self) -> float:
        return (self.win_chance_pct + self.survival_chance_pct) / 2.0


@dataclass
class RoundPredictionSummary:
    round_number: int
    player_rows: List[PlayerPredictionAggregate] = field(default_factory=_empty_prediction_rows)


@dataclass
class EndgamePlayerEvaluation:
    player_id: str
    name: str
    actual_placement: Optional[int] = None
    avg_sim_placement: float = 0.0
    win_chance_pct: float = 0.0
    survival_chance_pct: float = 0.0
    combined_pct: float = 0.0
    immunity_wins: int = 0
    tribals_survived: int = 0
    correct_votes: int = 0
    total_votes_cast: int = 0
    votes_received: int = 0
    idols_found: int = 0
    idols_played: int = 0
    advantages_found: int = 0
    return_count: int = 0

    @property
    def vote_accuracy_pct(self) -> float:
        if self.total_votes_cast <= 0:
            return 0.0
        return 100.0 * (self.correct_votes / float(self.total_votes_cast))

    @property
    def resume_score(self) -> float:
        """
        Final cast ranking score.
        Keeps the prediction metrics as the dominant component, then
        layers in actual game-resume signals without altering sim logic.
        """
        score = 0.0
        score += self.combined_pct * 0.50
        score += self.win_chance_pct * 0.20
        score += self.survival_chance_pct * 0.10

        # lower average placement is better, so invert it
        if self.avg_sim_placement > 0:
            score += max(0.0, 30.0 - self.avg_sim_placement) * 0.60

        # actual season metrics
        score += self.immunity_wins * 1.75
        score += self.tribals_survived * 0.40
        score += self.correct_votes * 0.80
        score += self.vote_accuracy_pct * 0.10
        score += self.idols_found * 0.75
        score += self.idols_played * 1.10
        score += self.advantages_found * 0.35
        score += self.return_count * 0.50

        # being a finalist / winner in the actual timeline should matter
        if self.actual_placement is not None:
            if self.actual_placement == 1:
                score += 15.0
            elif self.actual_placement <= 3:
                score += 8.0
            elif self.actual_placement <= 6:
                score += 3.0

        return score


def _clone_tribes_for_rollout(
    source_tribes: List[List["Player"]],
    cloned_players: List["Player"],
) -> List[List["Player"]]:
    by_id = {p.player_id: p for p in cloned_players}
    new_tribes: List[List[Player]] = []
    for tribe in source_tribes:
        new_tribes.append([by_id[p.player_id]
                          for p in tribe if p.player_id in by_id])
    return new_tribes


def _placement_from_boot_order(
    all_players: List["Player"],
    finalists: List["Player"],
    boot_log: List["Player"],
    winner: Optional["Player"],
) -> Dict[str, int]:
    """
    Returns 1 = winner, 2/3 = finalist losses, larger number = worse placement.
    """
    total = len(all_players)
    out: Dict[str, int] = {}

    boot_ids = [p.player_id for p in boot_log]

    # earliest boot gets worst placement = total
    # latest pre-finale boot gets better placement
    for idx, pid in enumerate(boot_ids):
        out[pid] = total - idx

    losing_finalists = [
        p for p in finalists if winner is None or p.player_id != winner.player_id]

    if winner is not None:
        out[winner.player_id] = 1

    if losing_finalists:
        if len(losing_finalists) == 1:
            out[losing_finalists[0].player_id] = 2
        else:
            # deterministic but tied finalist-loss placement ordering
            for rank_offset, p in enumerate(sorted(losing_finalists, key=lambda x: x.name), start=2):
                out[p.player_id] = rank_offset

    # fallback guard
    for p in all_players:
        out.setdefault(p.player_id, total)

    return out


# ----------------------------
# Phase-aware scoring helpers
# ----------------------------

def _base_score_without_preempt(voter: Player, other: Player) -> float:
    relationship_weight = (100 - (voter.strategy_level - 1) * 20) / 100.0
    raw_threat_weight = (voter.strategy_level - 1) * 20 / 100.0
    threat_weight = raw_threat_weight * voter.phase_threat_mult
    rel_score = voter.relationships.get(other, 0)
    perceived_threat = voter.threat_perceptions.get(
        other,
        float(_threat_level_or(other, 3.0)),
    )
    return (rel_score * relationship_weight) - (perceived_threat * threat_weight)


def _preempt_pressure(voter: Player, other: Player) -> float:
    other_base = _base_score_without_preempt(other, voter)
    danger_from_other = max(0.0, -other_base)
    hostility = max(0, -other.relationships.get(voter, 0))
    phase_emphasis = voter.phase_preempt_mult
    return danger_from_other * (1.0 + 0.15 * hostility) * phase_emphasis


def _score_target_for_voter(voter: Player, other: Player) -> float:
    score = _base_score_without_preempt(voter, other)
    cfg = cast(GameConfig, getattr(voter, "config"))
    strat_scaled = (voter.strategy_level / 5.0) ** max(1.0, cfg.strategy_power)
    preempt_w = strat_scaled * voter.phase_preempt_mult * cfg.preempt_weight_base
    preempt = _preempt_pressure(voter, other)
    return score - preempt_w * preempt


# ----------------------------
# Survivor Simulator (Engine)
# ----------------------------

class SurvivorSimulator:
    def __init__(
        self,
        players: List[Player],
        config: Optional[GameConfig] = None,
        nomination_strategy: Optional[NominationStrategy] = None,
        voting_strategy: Optional[VotingStrategy] = None,
        idol_policy: Optional[IdolPolicy] = None,
        tiebreak_strategy: Optional[TieBreakerStrategy] = None,
        challenge_system: Optional[ChallengeSystem] = None,
        rng: Optional[random.Random] = None,
        logger: Optional[Logger] = None,
        enable_default_events: bool = True,
        season_plan: Optional[SeasonPlan] = None,
    ) -> None:
        self.config = config or GameConfig()
        if rng is None:
            rng = random.Random(self.config.seed)
        self.rng = rng
        self.log = logger or Logger(
            self.config.logfile, level=self.config.log_level)

        self.social_memory = SocialMemory(self.config.social_memory_file)
        self.plan: SeasonPlan = season_plan or SeasonPlan()

        self.players: List[Player] = players[:]
        for p in self.players:
            p.ensure_randomized_stats(self.rng)
            setattr(p, "config", self.config)

        uniform_challenge = 1
        for p in self.players:
            p.challenge_ability = uniform_challenge

        self.starting_player_count = len(self.players)

        self.eliminated_players: List[Player] = []
        self.boot_log: List[Player] = []
        self.round_number: int = 1
        self.episode_number: int = 1
        self.merged: bool = False
        self.tribes: List[List[Player]] = []
        self.tribe_names: List[str] = []
        self.merge_color: Optional[str] = None
        self._used_generated_tribe_names: Set[str] = set()

        if self.plan.finalists_count in (2, 3):
            self.finalists_count = int(self.plan.finalists_count)
        else:
            self.finalists_count = self.rng.choice(
                list(self.config.finalists_count_choices))
        self.log.info(f"Finalists this season: Final {self.finalists_count}")

        self.jury: List[Player] = []
        self.jury_size = self._resolve_jury_size_default()

        self.nomination_strategy = nomination_strategy or DefaultNominationStrategy(
            self.rng)
        self.voting_strategy = voting_strategy or DefaultVotingStrategy()
        self.idol_policy = idol_policy or DefaultIdolPolicy(cast(Any, self.log))
        self.tiebreak_strategy = tiebreak_strategy or DefaultTieBreakerStrategy()
        self.challenge_system = challenge_system or DefaultChallengeSystem()

        self.events = EventBus()
        if enable_default_events and self.config.enable_events:
            self.events.on("round_start", _noop_event_handler)
            self.events.on("tribal_start", _noop_event_handler)
            self.events.on("tribal_end", _noop_event_handler)
            self.events.on("vote_cast", _noop_event_handler)
            self.events.on("eliminated", _noop_event_handler)

        self.exiled_player: Optional[Player] = None

        self.num_planned_swaps = self._draw_num_swaps()
        self.swap_triggers_remaining_counts: set[int] = set()
        self.swap_teams_by_trigger: Dict[int, int] = {}
        self.swap_counter: int = 0

        self.adv_distribution: Counter[str] = Counter()
        self.advantages_issued: int = 0
        self.advantages_enabled = bool(self.config.advantages_enabled and self.plan.advantages_enabled)
        self.seed_starting_tribe_idols = bool(
            self.config.seed_starting_tribe_idols and self.plan.seed_starting_tribe_idols
        )
        self.seed_merge_idol = bool(self.config.seed_merge_idol and self.plan.seed_merge_idol)
        self.advantage_seeds: List[AdvantageSeed] = list(
            self.plan.advantage_seeds if self.plan.advantage_seeds else self.config.advantage_seeds
        )
        self.advantage_copies: List[AdvantageCopy] = copy.deepcopy(
            self.plan.advantage_copies if self.plan.advantage_copies else self.config.advantage_copies
        )
        self._seeded_advantage_seed_indices: Set[int] = set()
        self._seeded_automatic_advantages: Set[str] = set()

        self.merge_at_remaining = self._choose_merge_point()

        self.scripted_immunity: Dict[int, List[str]] = {}
        self.scripted_nominees: Dict[int, List[str]] = {}
        self.scripted_votes: Dict[int, Dict[str, str]] = {}
        self.scripted_elimination: Dict[int, str] = {}

        self._merge_idols_seeded = False

        self.season_has_family_visit: bool = (
            (self.plan.force_family_visit_round is not None)
            or (self.rng.random() < self.config.season_has_family_visit_p)
        )
        self.season_has_auction: bool = (
            (self.plan.force_auction_round is not None)
            or (self.rng.random() < self.config.season_has_auction_p)
        )
        self.family_visit_done = False
        self.auction_done = False
        self.family_visit_round: Optional[int] = self.plan.force_family_visit_round
        self.auction_round: Optional[int] = self.plan.force_auction_round

        self.is_merge_vote = False

        self.battleback_points: List[int] = sorted(
            set(int(x) for x in (self.plan.battleback_points or [])))
        self.battleback_fired: set[int] = set()

        self.demerge_done: bool = False
        self._printed_alliance_snapshots: Set[Tuple[int, str]] = set()

        # Predictive / Monte Carlo state
        self.round_prediction_history: List[RoundPredictionSummary] = []
        self.latest_round_prediction: Optional[RoundPredictionSummary] = None

        # Season-long player metrics for final cast ranking
        self.player_season_stats: Dict[str, Dict[str, Any]] = {
            p.player_id: {
                "name": p.name,
                "immunity_wins": 0,
                "tribals_survived": 0,
                "correct_votes": 0,
                "total_votes_cast": 0,
                "votes_received": 0,
                "idols_found": 0,
                "idols_played": 0,
                "advantages_found": 0,
                "return_count": 0,
                "actual_placement": None,
            }
            for p in self.players
        }

        # internal helpers so we can attribute finds/plays without changing cfg behavior
        self._pending_votes_received_this_tribal: Counter[Player] = Counter()

    # ---------- player-id helpers ----------

    def find_player_by_id(self, player_id: str) -> Optional[Player]:
        for p in (self.players + self.eliminated_players):
            if p.player_id == player_id:
                return p
        return None

    def old_player_memory(self, player_id: str) -> Dict[str, Any]:
        return self.social_memory.describe_player(player_id)

    # ---------- alliance graph ----------

    def _maybe_draw_alliance_graph(self, pool: List["Player"], title: str, save_name: str | None = None) -> None:
        if not getattr(self.config, "enable_visual_graphs", True):
            return
        try:
            draw_alliance_graph(
                sim=self,
                pool=cast(Any, pool),
                mode="interest",
                view="both",
                progressive=False,
                save_path=save_name,
                base_color="black",
                node_face="white",
                node_edge="black",
                text_color="black",
            )
        except Exception as e:
            self.log.warn(f"(graph) skipped â€” {e}")

    # ---------- interest helpers ----------

    def _pref_targets_set(self, voter: Player, pool: List[Player], k: Optional[int] = None) -> List[Player]:
        k = k or self.config.alliance_topk_targets
        eligible = [p for p in pool if p is not voter and not p.immune]
        if not eligible:
            return []
        scored = sorted(
            eligible, key=lambda t: _score_target_for_voter(voter, t))
        return scored[:max(1, min(k, len(scored)))]

    def _rank_of(self, voter: Player, target: Player, pool: List[Player]) -> int:
        eligible = [p for p in pool if p is not voter and not p.immune]
        if not eligible:
            return len(self.players) + 1
        scored = sorted(
            eligible, key=lambda t: _score_target_for_voter(voter, t))
        try:
            return scored.index(target) + 1
        except ValueError:
            return len(scored) + 1

    def _norm_rel(self, a: Player, b: Player) -> float:
        lo, hi = self.config.relationship_min, self.config.relationship_max
        r = min(a.relationships.get(b, 0), b.relationships.get(a, 0))
        return 0.0 if hi == lo else (r - lo) / (hi - lo)

    def _interest_edge_weight(self, a: Player, b: Player, pool: List[Player]) -> float:
        K = max(1, self.config.alliance_topk_targets)
        M = max(1, self.config.alliance_nonagg_topm)
        w_rel = max(0.0, self.config.alliance_rel_weight)
        w_int = max(0.0, self.config.alliance_interest_weight)

        aset = set(self._pref_targets_set(a, pool, K))
        bset = set(self._pref_targets_set(b, pool, K))
        inter = len(aset & bset)
        union = len(aset | bset) or 1
        jacc = inter / union

        ra = self._rank_of(a, b, pool)
        rb = self._rank_of(b, a, pool)
        nonagg = 1.0 if (ra > M and rb > M) else 0.0

        reln = self._norm_rel(a, b)
        interest = 0.75 * jacc + 0.25 * nonagg
        score = w_int * interest + w_rel * reln
        return max(0.0, min(1.0, score))

    # ---------- jury sizing ----------

    def _resolve_jury_size_default(self) -> int:
        default = 8 if self.finalists_count == 3 else 10
        jury_size = self.plan.jury_size if (
            self.plan.jury_size is not None) else default
        base = getattr(self, "starting_player_count", len(self.players))
        max_possible = max(0, base - self.finalists_count)
        jury_size = max(0, min(int(jury_size), max_possible))
        return jury_size

    # ---------- planning ----------

    def _draw_num_swaps(self) -> int:
        if self.plan.swap_plan is not None:
            return len(self.plan.swap_plan)
        if self.plan.num_swaps_override is not None:
            return self.plan.num_swaps_override
        choices, weights = self.config.weighted_num_swaps
        return self.rng.choices(choices, weights=weights, k=1)[0]

    def _plan_swap_triggers(self, total_players: int, num_swaps: int) -> None:
        self.swap_triggers_remaining_counts = set()
        self.swap_teams_by_trigger = {}

        if num_swaps <= 0:
            return

        if self.plan.swap_plan:
            for pr, teams in self.plan.swap_plan:
                trigger_count = int(pr)
                team_count = max(1, int(teams))

                self.swap_triggers_remaining_counts.add(trigger_count)
                self.swap_teams_by_trigger[trigger_count] = team_count

            self.log.info(
                f"Planned swaps/merges: {len(self.plan.swap_plan)} (1 = forced merge)."
            )
            return

        low = max(self.finalists_count + 7, int(0.55 * total_players))
        high = max(low + 1, int(0.85 * total_players))

        chosen: Set[int] = set()
        while len(chosen) < num_swaps:
            trigger_count = self.rng.randint(low, high)
            chosen.add(trigger_count)

        for trigger_count in chosen:
            self.swap_triggers_remaining_counts.add(trigger_count)
            self.swap_teams_by_trigger[trigger_count] = self.rng.choice([2, 3])

    def _draw_vote_option_count(self) -> int:
        choices, weights = self.config.weighted_nominee_counts
        return self.rng.choices(choices, weights=weights, k=1)[0]

    def _contextual_vote_option_count(self, pool: List["Player"]) -> int:
        if len(pool) <= 5:
            return 2

        advantage_pressure = sum(
            1
            for player in pool
            if any(
                int(count) > 0
                for advantage, count in player.inventory.items()
                if advantage not in ("vote_blocked", "extra_ballots")
            )
        )
        large_tribe = len(pool) >= 9
        messy_context = (
            large_tribe
            and (
                self.is_merge_vote
                or len(self.jury) > 0
                or advantage_pressure > 0
            )
        )
        if messy_context and self.rng.random() < (0.24 if advantage_pressure else 0.12):
            return 3
        return 2

    def _select_coalition_nominees(self, pool: List["Player"], desired_k: int) -> List["Player"]:
        eligible = [p for p in pool if not p.immune]
        if len(eligible) <= 2:
            return eligible[:]

        from itertools import combinations

        majority_needed = (len(pool) // 2) + 1
        max_group_size = min(len(pool) - 1, majority_needed + 2)
        plans: List[Tuple[float, float, str, Player]] = []
        checked = 0
        max_checks = 700

        for size in range(majority_needed, max_group_size + 1):
            for group in combinations(pool, size):
                checked += 1
                if checked > max_checks:
                    break
                outsiders = [target for target in eligible if target not in group]
                if not outsiders:
                    continue
                best_target: Optional[Player] = None
                best_score = float("inf")
                for target in outsiders:
                    score = sum(_score_target_for_voter(voter, target) for voter in group) / len(group)
                    if score < best_score:
                        best_score = score
                        best_target = target
                if best_target is None:
                    continue
                cohesion = sum(
                    self._interest_edge_weight(a, b, pool)
                    for a, b in combinations(group, 2)
                ) / max(1, (len(group) * (len(group) - 1)) / 2)
                plans.append((best_score - (0.35 * cohesion), -cohesion, best_target.name, best_target))
            if checked > max_checks:
                break

        if not plans:
            return self.nomination_strategy.select_nominees(cast(Any, pool), desired_k)

        plans.sort(key=lambda item: (item[0], item[1], item[2]))
        nominees: List[Player] = []
        for _, _, _, target in plans:
            if target not in nominees:
                nominees.append(target)
            if len(nominees) >= max(2, desired_k):
                break

        if len(nominees) < 2:
            for candidate in self.nomination_strategy.select_nominees(cast(Any, pool), 2):
                if candidate not in nominees:
                    nominees.append(candidate)
                if len(nominees) >= 2:
                    break

        return nominees[:max(2, desired_k)]

    def _plan_vote_option_counts(self, length: int) -> List[int]:
        return []

    def _choose_starting_tribe_count(self, S: int) -> int:
        base_weights = {2: 0.55, 3: 0.40, 4: 0.05}
        options = [k for k in (2, 3, 4) if S % k == 0]
        if not options:
            return 2
        weights = [base_weights[k] for k in options]
        total = sum(weights)
        weights = [w / total for w in weights]
        return self.rng.choices(options, weights=weights, k=1)[0]

    def _random_syllable(self) -> str:
        consonants = tuple("bcdfghjklmnpqrstvwxyz")
        vowels = tuple("aeiou")
        pattern = self.rng.choice(("cv", "vc", "cvc", "vcv"))
        chars: List[str] = []
        for marker in pattern:
            if marker == "c":
                chars.append(self.rng.choice(consonants))
            else:
                chars.append(self.rng.choice(vowels))
        return "".join(chars)

    def _random_tribe_word(self) -> str:
        syllable_count = self.rng.choices([2, 3, 4], weights=[0.52, 0.40, 0.08], k=1)[0]
        return "".join(self._random_syllable() for _ in range(syllable_count)).capitalize()

    def _generate_unique_tribe_name(self) -> str:
        for _ in range(200):
            word_count = 1 if self.rng.random() < 0.80 else 2
            name = " ".join(self._random_tribe_word() for _ in range(word_count))
            key = name.casefold()
            if key not in self._used_generated_tribe_names:
                self._used_generated_tribe_names.add(key)
                return name

        fallback_index = len(self._used_generated_tribe_names) + 1
        while True:
            fallback = f"Tavu{fallback_index}"
            key = fallback.casefold()
            if key not in self._used_generated_tribe_names:
                self._used_generated_tribe_names.add(key)
                return fallback
            fallback_index += 1

    def _register_tribe_names(self, names: Iterable[str]) -> None:
        for name in names:
            if name:
                self._used_generated_tribe_names.add(name.casefold())

    def _resolve_tribe_labels(self, requested: Sequence[str], count: int) -> List[str]:
        labels: List[str] = []
        self._register_tribe_names(name for name in requested if name)
        for index in range(count):
            if index < len(requested) and str(requested[index]).strip():
                labels.append(str(requested[index]).strip())
            else:
                labels.append(self._generate_unique_tribe_name())
        return labels

    def _choose_starting_colors(self, k: int) -> Tuple[List[str], str]:
        tribe_names = [self._generate_unique_tribe_name() for _ in range(k)]
        merge_name = self._generate_unique_tribe_name()
        return tribe_names, merge_name

    def _choose_merge_point(self) -> int:
        S = self.starting_player_count
        half = S // 2
        lo_merge = max(7, self.finalists_count + 7, half - 3)
        hi_merge = min(S - 1, max(lo_merge, half + 3))
        if self.plan.merge_at_remaining is not None:
            return int(self.plan.merge_at_remaining)
        return self.rng.randint(lo_merge, hi_merge)

    def _next_advantage_copy_ordinal(self, advantage_type: str) -> int:
        return sum(1 for copy_item in self.advantage_copies if copy_item.advantage_type == advantage_type) + 1

    def _add_hidden_advantage_copy(
        self,
        seed: AdvantageSeed,
        *,
        history_note: str | None = None,
    ) -> AdvantageCopy:
        copy_item = AdvantageCopy.from_seed(
            seed,
            self._next_advantage_copy_ordinal(seed.advantage_type),
            seeded_round=self.round_number,
        )
        if history_note:
            copy_item.history.append(history_note)
        self.advantage_copies.append(copy_item)
        return copy_item

    def _active_automatic_idol_count(self) -> int:
        active_states = {"hidden", "held", "transferred", "bequeathed"}
        return sum(
            1
            for copy_item in self.advantage_copies
            if copy_item.advantage_type == ADV_IDOL
            and copy_item.source == "automatic"
            and copy_item.state in active_states
        )

    def _maybe_rehide_idol_after_play(self, played_copy: AdvantageCopy) -> None:
        if (
            not self.advantages_enabled
            or played_copy.advantage_type != ADV_IDOL
            or played_copy.source != "automatic"
            or self._active_automatic_idol_count() >= IDOL_REHIDE_ACTIVE_CAP
        ):
            return

        location = "merge_camp" if self.merged else "tribe_beach"
        seed = AdvantageSeed(
            advantage_type=ADV_IDOL,
            timing=AdvantageTiming(kind="merge" if self.merged else "pre_merge"),
            location=cast(Any, location),
            source="automatic",
        )
        self._add_hidden_advantage_copy(
            seed,
            history_note=f"rehidden_after:{played_copy.copy_id}",
        )
        self.log.info("A new hidden immunity idol is rehidden.")

    def _seed_automatic_advantage(
        self,
        key: str,
        *,
        advantage_type: str,
        timing_kind: str,
        location: str,
        history_note: str | None = None,
    ) -> None:
        if not self.advantages_enabled or key in self._seeded_automatic_advantages:
            return
        seed = AdvantageSeed(
            advantage_type=cast(Any, advantage_type),
            timing=AdvantageTiming(kind=cast(Any, timing_kind)),
            location=cast(Any, location),
            source="automatic",
        )
        self._add_hidden_advantage_copy(seed, history_note=history_note)
        self._seeded_automatic_advantages.add(key)

    def _seed_configured_advantages(self, timing_kind: str, *, remaining_players: int | None = None) -> None:
        if not self.advantages_enabled:
            return
        for index, seed in enumerate(self.advantage_seeds):
            if index in self._seeded_advantage_seed_indices:
                continue
            if seed.enabled is False or seed.timing.kind != timing_kind:
                continue
            if timing_kind == "final_remaining" and seed.timing.remaining_players != remaining_players:
                continue
            self._add_hidden_advantage_copy(seed)
            self._seeded_advantage_seed_indices.add(index)

    def _seed_starting_tribe_idol_copies(self) -> None:
        if not self.advantages_enabled or not self.seed_starting_tribe_idols:
            return
        for tribe_name, tribe in zip(self.tribe_names, self.tribes):
            if not tribe:
                continue
            self._seed_automatic_advantage(
                f"starting-idol:{tribe_name}",
                advantage_type=ADV_IDOL,
                timing_kind="starting_tribe",
                location="tribe_beach",
                history_note=f"tribe:{tribe_name}",
            )

    def _seed_advantages_for_current_player_count(self) -> None:
        self._seed_configured_advantages(
            "final_remaining",
            remaining_players=len(self.players),
        )

    def _seed_idols_for_tribes(self) -> None:
        if (
            not self.advantages_enabled
            or self.plan.disable_random_idols
            or not self.config.allow_random_idols
        ):
            return
        for tribe in self.tribes:
            if not tribe:
                continue
            holder = self.rng.choice(tribe)
            holder.give(ADV_IDOL, 1)
            self._mark_advantage_found(holder, ADV_IDOL, 1)
            self.log.info(
                f"{holder.name} is randomly seeded an idol for their tribe.")

    def _drop_merge_idols_if_needed(self) -> None:
        if self._merge_idols_seeded or not self.merged:
            return
        if not self.advantages_enabled:
            self._merge_idols_seeded = True
            return
        if self.seed_merge_idol:
            self._seed_automatic_advantage(
                "merge-idol",
                advantage_type=ADV_IDOL,
                timing_kind="merge",
                location="merge_camp",
            )
        self._seed_configured_advantages("merge")
        if self.plan.merge_idol_holders:
            for p in self._names_to_players(self.plan.merge_idol_holders):
                p.give(ADV_IDOL, 1)
                self._mark_advantage_found(p, ADV_IDOL, 1)
                self.log.info(f"{p.name} receives a planned merge idol.")
            self._merge_idols_seeded = True
            return
        if self.config.merge_idol_count > 0:
            holders = self.rng.sample(self.players, k=min(
                self.config.merge_idol_count, len(self.players)))
            for p in holders:
                p.give(ADV_IDOL, 1)
                self._mark_advantage_found(p, ADV_IDOL, 1)
                self.log.info(f"{p.name} finds a random merge idol.")
        self._merge_idols_seeded = True

    # ---------- phase weighting ----------

    def _phase_progress(self) -> float:
        start = self.starting_player_count
        end = self.finalists_count
        now = len(self.players)
        denom = max(1, start - end)
        return min(1.0, max(0.0, (start - now) / denom))

    def _threat_multiplier_from_players_left(self) -> float:
        b = max(1.000001, self.config.threat_curve_base)
        t = self._phase_progress()
        curve = (b ** t - 1.0) / (b - 1.0)
        return max(0.0, float(self.config.threat_curve_max_multiplier)) * curve

    def _update_phase_weights(self) -> None:
        phase_threat = self._threat_multiplier_from_players_left()
        phase_preempt = phase_threat ** 0.5 if phase_threat > 0 else 0.0
        for p in self.players:
            p.phase_threat_mult = phase_threat
            p.phase_preempt_mult = phase_preempt

    # ---------- setup ----------

    def initialize_threat_perceptions(self) -> None:
        for observer in self.players:
            for target in self.players:
                if observer is target:
                    continue
                observer.threat_perceptions[target] = float(
                    _threat_level_or(target, self.config.default_newbie_threat_view)
                )

        if self.config.use_social_memory:
            self.social_memory.apply_threat_perceptions_to_players(
                self.players,
                default_newbie_view=self.config.default_newbie_threat_view,
                blend_weight=self.config.threat_memory_blend_weight,
            )
            self.log.info("Applied persistent threat perception memory.")

    def initialize_relationships(self, lo: int = -4, hi: int = 4) -> None:
        for p in self.players:
            for q in self.players:
                if p != q:
                    p.relationships[q] = self.rng.randint(lo, hi)

        if self.config.use_social_memory:
            self.social_memory.apply_relationships_to_players(
                self.players,
                mode=self.config.relationship_memory_mode,
                blend_weight=self.config.relationship_memory_blend_weight,
                clamp_min=self.config.relationship_min,
                clamp_max=self.config.relationship_max,
            )
            self.log.info("Applied persistent relationship memory.")

        pr = self.plan.preset_relationships
        if pr:
            by_name: Dict[str, Player] = {p.name: p for p in self.players}
            by_id: Dict[str, Player] = {p.player_id: p for p in self.players}
            applied = 0
            items: List[Tuple[Tuple[str, str], int]] = []

            if isinstance(pr, dict):
                for key, delta in pr.items():
                    a_key, b_key = key
                    items.append(((str(a_key), str(b_key)), int(delta)))
            else:
                for a_key, b_key, delta in pr:
                    items.append(((str(a_key), str(b_key)), int(delta)))

            for key_pair, delta in items:
                a_key, b_key = key_pair
                pa = by_id.get(a_key) or by_name.get(a_key)
                pb = by_id.get(b_key) or by_name.get(b_key)

                if pa is None or pb is None or pa is pb:
                    continue

                pa.relationships[pb] = pa.relationships.get(pb, 0) + delta
                pb.relationships[pa] = pb.relationships.get(pa, 0) + delta
                applied += 1

            if applied:
                self.log.info(
                    f"Applied {applied} preset relationships from SeasonPlan."
                )

        self.initialize_threat_perceptions()

    def split_into_tribes(self, num_tribes: int, labels: Optional[List[str]] = None) -> None:
        if self.plan.starting_tribes:
            by_name = {p.name: p for p in self.players}
            by_id = {p.player_id: p for p in self.players}
            tribes: List[List[Player]] = []
            for group in self.plan.starting_tribes:
                tribe: List[Player] = []
                for token in group:
                    pl = by_id.get(token) or by_name.get(token)
                    if pl is not None:
                        tribe.append(pl)
                tribes.append(tribe)
            placed = {p for tr in tribes for p in tr}
            unplaced = [p for p in self.players if p not in placed]
            i = 0
            while unplaced:
                tribes[i % len(tribes)].append(unplaced.pop(0))
                i += 1
            self.tribes = tribes
            num_tribes = len(self.tribes)

            if self.plan.starting_tribe_labels and len(self.plan.starting_tribe_labels) >= num_tribes:
                self.tribe_names = self._resolve_tribe_labels(self.plan.starting_tribe_labels, num_tribes)
                self.merge_color = self._generate_unique_tribe_name()
            elif labels and len(labels) >= num_tribes:
                self.tribe_names = self._resolve_tribe_labels(labels, num_tribes)
                self.merge_color = self._generate_unique_tribe_name()
            else:
                colors, merge_color = self._choose_starting_colors(num_tribes)
                self.tribe_names = colors
                self.merge_color = merge_color

            for lab, tribe in zip(self.tribe_names, self.tribes):
                for pl in tribe:
                    pl.tribe_label = lab
        else:
            self.rng.shuffle(self.players)
            self.tribes = [self.players[i::num_tribes]
                           for i in range(num_tribes)]
            requested_labels = self.plan.starting_tribe_labels if self.plan.starting_tribe_labels and len(self.plan.starting_tribe_labels) >= len(self.tribes) else labels
            if requested_labels and len(requested_labels) >= len(self.tribes):
                self.tribe_names = self._resolve_tribe_labels(requested_labels, len(self.tribes))
                self.merge_color = self._generate_unique_tribe_name()
            else:
                colors, merge_color = self._choose_starting_colors(
                    len(self.tribes))
                self.tribe_names = colors
                self.merge_color = merge_color
            for lab, tribe in zip(self.tribe_names, self.tribes):
                for pl in tribe:
                    pl.tribe_label = lab

        for lab in self.tribe_names:
            self.log.info(f"\n{lab}")
            for p in [pl for pl in self.players if pl.tribe_label == lab]:
                self.log.info(p.name)

        self._seed_starting_tribe_idol_copies()
        self._seed_configured_advantages("starting_tribe")
        self._seed_configured_advantages("pre_merge")

        if self.advantages_enabled and self.plan.initial_idol_holders:
            for p in self._names_to_players(self.plan.initial_idol_holders):
                p.give(ADV_IDOL, 1)
                self._mark_advantage_found(p, ADV_IDOL, 1)
                self.log.info(f"{p.name} receives a planned idol (pre-Ep1).")

        self._plan_swap_triggers(
            self.starting_player_count, self.num_planned_swaps)
        if self.num_planned_swaps > 0:
            self.log.info(
                f"Total planned swaps/merges: {self.num_planned_swaps}")

    # ---------- utilities ----------

    def _needs_emergency_rebalance(self) -> bool:
        return (not self.merged) and any(len(tribe) <= 2 for tribe in self.tribes)

    def _send_to_exile(self, active: List[Player]) -> None:
        exile = self.rng.choice(active)
        active.remove(exile)
        self.exiled_player = exile
        self.log.info(
            f"{exile.name} is sent to Exile until after the next Tribal.")
        if self.advantages_enabled and not (self.plan.disable_random_idols or not self.config.allow_random_idols):
            if self.rng.random() < self.config.p_exile_idol:
                exile.give(ADV_IDOL, 1)
                self._mark_advantage_found(exile, ADV_IDOL, 1)
                self.log.info(f"{exile.name} finds an idol on Exile.")

    def _effective_num_teams(self, requested: int, for_split: bool = True) -> Tuple[int, Optional[str]]:
        total_players = len(self.players)
        active_players = len(
            [p for p in self.players if p is not self.exiled_player]) if for_split else total_players

        requested = max(1, int(requested))
        max_allowed = max(1, total_players // 2)
        capped = min(requested, max_allowed)

        if capped <= 1:
            note = None
            if requested != 1:
                note = f"requested {requested} â†’ forced merge (1) due to â‰¤ floor({total_players}/2)={max_allowed}"
            return 1, note

        for t in range(capped, 1, -1):
            if active_players % t == 0:
                if t != requested or requested > max_allowed:
                    return t, f"requested {requested} â†’ {t} team(s) (cap {max_allowed}, divides {active_players})"
                return t, None

        return 1, f"requested {requested} â†’ 1 (merge) since no tâ‰¥2 divides {active_players}"

    def _perform_swap(self, num_teams: int, trigger_left: int) -> None:
        self.swap_counter += 1

        eff_teams, note = self._effective_num_teams(num_teams, for_split=True)
        if note:
            self.log.info(f"[Swap Adjust] {note}")

        if eff_teams == 1:
            merged_list = [p for tribe in self.tribes for p in tribe]

            if self.exiled_player is not None:
                self.log.info(
                    f"{self.exiled_player.name} returns from Exile for the merge.")
                merged_list.append(self.exiled_player)
                self.exiled_player = None

            self.players = merged_list
            self.tribes = [self.players]
            self.merged = True
            for p in self.players:
                p.tribe_label = "Merged"

            self.is_merge_vote = True
            self.log.info(
                f"\nMERGE (Swap #{self.swap_counter}/{self.num_planned_swaps}) at {trigger_left} players remaining â€” forming 1 team."
            )
            self.log.info(f"Merge color: {self.merge_color}")

            self._drop_merge_idols_if_needed()
            self._schedule_merge_specials_if_needed()
            self._assert_roster_integrity()
            return

        active = [p for p in self.players if p is not self.exiled_player]
        self.rng.shuffle(active)

        new_tribes: List[List[Player]] = [[] for _ in range(eff_teams)]
        for i, p in enumerate(active):
            new_tribes[i % eff_teams].append(p)

        requested_labels = self.plan.swap_tribe_labels_by_remaining.get(trigger_left, [])
        self._register_tribe_names(self.tribe_names)
        self._register_tribe_names(name for name in requested_labels if name)
        next_tribe_names: List[str] = []
        for index in range(eff_teams):
            if index < len(requested_labels) and str(requested_labels[index]).strip():
                next_tribe_names.append(str(requested_labels[index]).strip())
            elif index < len(self.tribe_names) and self.tribe_names[index]:
                next_tribe_names.append(self.tribe_names[index])
            else:
                next_tribe_names.append(self._generate_unique_tribe_name())
        self.tribe_names = next_tribe_names

        was_merged = self.merged
        self.tribes = new_tribes
        self.merged = False
        for idx, tribe in enumerate(self.tribes):
            for p in tribe:
                p.tribe_label = self.tribe_names[idx]

        self.players = [p for tribe in self.tribes for p in tribe]
        if self.exiled_player is not None:
            self.players.append(self.exiled_player)

        label = "DEMERGE" if was_merged else "SWAP"
        self.log.info(
            f"\n{label} (Swap #{self.swap_counter}/{self.num_planned_swaps}) at {trigger_left} players remaining â€” forming {eff_teams} team(s)."
        )
        if label == "SWAP":
            self._seed_configured_advantages("swap")
        for lab in self.tribe_names[:eff_teams]:
            self.log.info(f"\n{lab}")
            for p in [pl for pl in self.players if pl.tribe_label == lab]:
                self.log.info(p.name)

        self._assert_roster_integrity()

    def _assert_roster_integrity(self) -> None:
        roster = set(self.players)
        union = {p for tribe in self.tribes for p in tribe}
        if self.exiled_player is not None:
            union.add(self.exiled_player)
        if roster != union:
            missing = [p.name for p in (union - roster)]
            extras = [p.name for p in (roster - union)]
            if missing or extras:
                self.log.warn(
                    f"[INTEGRITY] Fixing roster: +{missing}  -{extras}")
            self.players = list(union)

    def _schedule_merge_specials_if_needed(self) -> None:
        if not self.merged:
            return
        base_round = self.round_number
        if self.season_has_family_visit and self.family_visit_round is None:
            self.family_visit_round = base_round + self.rng.randint(1, 3)
        if self.season_has_auction and self.auction_round is None:
            ar = base_round + self.rng.randint(1, 3)
            if self.family_visit_round is not None and ar == self.family_visit_round:
                ar += 1
            self.auction_round = ar

    def _names_to_players(self, keys: Iterable[str]) -> List[Player]:
        by_name = {p.name: p for p in (self.players + self.eliminated_players)}
        by_id = {p.player_id: p for p in (
            self.players + self.eliminated_players)}
        out: List[Player] = []
        for key in keys:
            p = by_id.get(key) or by_name.get(key)
            if p is not None:
                out.append(p)
        return out

    def _log_idol_holders(self) -> None:
        exact_holders: List[str] = []
        for p in self.players:
            parts: List[str] = []
            if p.inventory.get(ADV_IDOL, 0) > 0:
                parts.append(f"idolÃ—{p.inventory[ADV_IDOL]}")
            for adv in [
                ADV_SUPER_IDOL, ADV_DOUBLE_IDOL, ADV_5050, ADV_LEGACY,
                ADV_NULLIFIER, ADV_VOTE_STEAL, ADV_VOTE_BLOCK, ADV_KIP,
                ADV_EXTRA_VOTE, ADV_SAFETY, ADV_FAKE_KIT
            ]:
                if p.inventory.get(adv, 0) > 0:
                    parts.append(f"{adv}Ã—{p.inventory[adv]}")
            if parts:
                exact_holders.append(f"{p.name} [{', '.join(parts)}]")

        chatter: List[str] = []
        for copy_item in self.advantage_copies:
            if copy_item.state not in {"held", "transferred", "bequeathed"} or not copy_item.owner_id:
                continue
            holder = self.find_player_by_id(copy_item.owner_id)
            if holder is None or holder not in self.players:
                continue
            observers = [
                player
                for player in self.players
                if player is not holder
                and (knowledge := player.advantage_knowledge.get(copy_item.copy_id)) is not None
                and knowledge.confidence >= 0.5
            ]
            if not observers:
                continue
            exact_count = sum(
                1
                for observer in observers
                if observer.advantage_knowledge[copy_item.copy_id].exact
            )
            if exact_count >= 2:
                chatter.append(f"{holder.name} is being linked to {copy_item.advantage_type}")
            else:
                chatter.append(f"{holder.name} is rumored to have something")

        if chatter:
            self.log.info("\nAdvantage Watch: " + "; ".join(sorted(set(chatter))))
        else:
            self.log.info("\nAdvantage Watch: no public advantage chatter")

        if exact_holders:
            self.log.debug("Advantage Ledger (private): " + "; ".join(sorted(exact_holders)))
        else:
            self.log.debug("Advantage Ledger (private): none")

        # ---------- season metric tracking ----------

    def _ensure_player_stat_row(self, player: Player) -> None:
        self.player_season_stats.setdefault(
            player.player_id,
            {
                "name": player.name,
                "immunity_wins": 0,
                "tribals_survived": 0,
                "correct_votes": 0,
                "total_votes_cast": 0,
                "votes_received": 0,
                "idols_found": 0,
                "idols_played": 0,
                "advantages_found": 0,
                "return_count": 0,
                "actual_placement": None,
            },
        )
        self.player_season_stats[player.player_id]["name"] = player.name

    def _mark_advantage_found(self, player: Player, adv: str, qty: int = 1) -> None:
        self._ensure_player_stat_row(player)
        if adv in IDOL_ADVANTAGE_TYPES:
            self.player_season_stats[player.player_id]["idols_found"] += int(
                qty)
        else:
            self.player_season_stats[player.player_id]["advantages_found"] += int(
                qty)

    def _search_drive(self, player: Player) -> float:
        strategy = max(1, min(5, int(player.strategy_level or 1)))
        social = max(1, min(5, int(player.social_skill or 1)))
        average_rel = 0.0
        if player.relationships:
            average_rel = sum(player.relationships.values()) / max(1, len(player.relationships))
        isolated_bonus = 0.06 if average_rel < -1 else (0.03 if average_rel < 1 else 0.0)
        strategy_bonus = 0.018 * strategy
        social_cover_bonus = 0.006 * social
        return min(0.32, 0.035 + strategy_bonus + social_cover_bonus + isolated_bonus)

    def _tribe_name_from_advantage_history(self, copy_item: AdvantageCopy) -> str | None:
        prefix = "tribe:"
        for item in copy_item.history:
            if item.startswith(prefix):
                return item[len(prefix):]
        return None

    def _eligible_searchers_for_advantage(
        self,
        copy_item: AdvantageCopy,
        *,
        attendees: Iterable[Player] | None = None,
    ) -> List[Player]:
        attendee_list = list(attendees) if attendees is not None else []
        location = copy_item.location

        if location == "exile":
            return [self.exiled_player] if self.exiled_player is not None else []
        if location in {"reward", "auction", "journey"}:
            return attendee_list
        if location == "challenge":
            return self.players[:]
        if location == "sit_out_bench":
            return [p for p in self.players if p.sat_out_last]
        if location == "merge_camp":
            return self.players[:] if self.merged else []
        if location == "tribe_beach":
            tribe_name = self._tribe_name_from_advantage_history(copy_item)
            if tribe_name:
                return [p for p in self.players if p.tribe_label == tribe_name]
            return self.players[:]
        return self.players[:]

    def _maybe_witness_advantage_find(
        self,
        finder: Player,
        possible_witnesses: Iterable[Player],
        copy_item: AdvantageCopy,
    ) -> None:
        witnesses = [p for p in possible_witnesses if p is not finder and p in self.players]
        if not witnesses or self.rng.random() >= 0.12:
            return
        witness = self.rng.choice(witnesses)
        finder.threat_level = float(finder.threat_level or 1) + 0.5
        exact = finder.relationships.get(witness, 0) >= 5 and witness.relationships.get(finder, 0) >= 5
        self._record_advantage_knowledge(
            observer=witness,
            holder=finder,
            copy_item=copy_item,
            source="witnessed_find",
            exact=exact,
            confidence=0.9 if exact else 0.55,
        )
        if exact:
            self.log.info(
                f"{witness.name} quietly sees that {finder.name} found {copy_item.advantage_type}."
            )
        else:
            self.log.info(
                f"{witness.name} notices {finder.name} found something while searching."
            )

    def _record_advantage_knowledge(
        self,
        *,
        observer: Player,
        holder: Player,
        copy_item: AdvantageCopy,
        source: str,
        exact: bool,
        confidence: float,
    ) -> None:
        advantage_type = copy_item.advantage_type if exact else None
        current = observer.advantage_knowledge.get(copy_item.copy_id)
        if current is None:
            observer.advantage_knowledge[copy_item.copy_id] = AdvantageKnowledge(
                copy_id=copy_item.copy_id,
                holder_id=holder.player_id,
                advantage_type=advantage_type,
                confidence=min(1.0, max(0.0, confidence)),
                source=source,
                round_number=self.round_number,
                exact=exact,
                sources=[source],
            )
            return
        current.update(
            holder_id=holder.player_id,
            advantage_type=advantage_type,
            confidence=confidence,
            source=source,
            round_number=self.round_number,
            exact=exact,
        )

    def _refresh_advantage_knowledge_owner(self, copy_item: AdvantageCopy) -> None:
        if not copy_item.owner_id:
            return
        for player in self.players + self.eliminated_players:
            known = player.advantage_knowledge.get(copy_item.copy_id)
            if known is not None:
                known.holder_id = copy_item.owner_id

    def _active_known_advantage_for_holder(
        self,
        observer: Player,
        holder: Player,
        *,
        advantage_types: Set[str] | None = None,
    ) -> Tuple[float, str | None]:
        active_copy_ids = {
            copy_item.copy_id
            for copy_item in self.advantage_copies
            if copy_item.owner_id == holder.player_id
            and copy_item.state in {"held", "transferred", "bequeathed"}
        }
        best_confidence = 0.0
        best_type: str | None = None
        for knowledge in observer.advantage_knowledge.values():
            if knowledge.holder_id != holder.player_id:
                continue
            if knowledge.copy_id not in active_copy_ids and knowledge.confidence < 0.5:
                continue
            known_type = knowledge.advantage_type if knowledge.exact else None
            if advantage_types is not None and known_type is not None and known_type not in advantage_types:
                continue
            confidence = min(1.0, max(0.0, float(knowledge.confidence)))
            if confidence > best_confidence:
                best_confidence = confidence
                best_type = known_type
        return best_confidence, best_type

    def _known_protection_pressure(self, observer: Player, holder: Player) -> float:
        confidence, known_type = self._active_known_advantage_for_holder(
            observer,
            holder,
            advantage_types=PROTECTIVE_ADVANTAGE_TYPES,
        )
        if confidence <= 0:
            return 0.0
        if known_type is None:
            return confidence * 0.75
        return confidence

    def _known_kip_target(self, player: Player, pool: List[Player]) -> Tuple[Player | None, str]:
        options: List[Tuple[float, int, Player, str]] = []
        for target in pool:
            if target is player or target.left_tribal_no_vote:
                continue
            confidence, known_type = self._active_known_advantage_for_holder(player, target)
            if confidence < 0.45:
                continue
            ask_kind = "idol" if known_type in KIP_IDOL_ASK_TYPES else "advantage"
            if known_type is None:
                ask_kind = "idol" if self.rng.random() < 0.6 else "advantage"
            relationship_penalty = max(0, player.relationships.get(target, 0))
            options.append((confidence, -relationship_penalty, target, ask_kind))
        if not options:
            return None, "idol"
        options.sort(key=lambda item: (item[0], item[1], float(item[2].threat_level)), reverse=True)
        _, _, target, ask_kind = options[0]
        return target, ask_kind

    def _transfer_kip_award(
        self,
        source: Player,
        target: Player,
        advantage_types: Iterable[str],
    ) -> str | None:
        for adv in advantage_types:
            if target.inventory.get(adv, 0) <= 0:
                continue
            target.take_one(adv)
            source.give(adv, 1)
            self._mark_advantage_found(source, adv, 1)
            self._transfer_held_advantage_copy(target, source, adv)
            return adv
        return None

    def _discover_hidden_advantage(
        self,
        copy_item: AdvantageCopy,
        finder: Player,
        *,
        possible_witnesses: Iterable[Player] | None = None,
    ) -> None:
        finder.give(copy_item.advantage_type, 1)
        copy_item.assign_owner(finder.player_id, round_number=self.round_number)
        self._record_advantage_knowledge(
            observer=finder,
            holder=finder,
            copy_item=copy_item,
            source="found",
            exact=True,
            confidence=1.0,
        )
        self._mark_advantage_found(finder, copy_item.advantage_type, 1)
        finder.threat_level = float(finder.threat_level or 1) + (
            0.35 if copy_item.advantage_type in IDOL_ADVANTAGE_TYPES else 0.2
        )
        if possible_witnesses is not None:
            self._maybe_witness_advantage_find(finder, possible_witnesses, copy_item)
        self.log.info(
            f"{finder.name} finds {copy_item.advantage_type} at {copy_item.location}."
        )

    def _run_hidden_advantage_search(
        self,
        *,
        locations: Iterable[str] | None = None,
        attendees: Iterable[Player] | None = None,
        force: bool = False,
    ) -> None:
        if not self.advantages_enabled:
            return
        allowed_locations = set(locations) if locations is not None else None
        for copy_item in list(self.advantage_copies):
            if copy_item.state != "hidden":
                continue
            if allowed_locations is not None and copy_item.location not in allowed_locations:
                continue
            searchers = self._eligible_searchers_for_advantage(copy_item, attendees=attendees)
            searchers = [p for p in searchers if p in self.players]
            if not searchers:
                continue
            self.rng.shuffle(searchers)
            finder: Player | None = None
            if force:
                finder = searchers[0]
            else:
                for candidate in searchers:
                    if self.rng.random() < self._search_drive(candidate):
                        finder = candidate
                        break
            if finder is None:
                continue
            self._discover_hidden_advantage(
                copy_item,
                finder,
                possible_witnesses=searchers,
            )

    def _maybe_share_advantage_knowledge(self) -> None:
        if not self.advantages_enabled:
            return
        active_set = set(self.players)
        for sharer in list(self.players):
            known_items = [
                item
                for item in sharer.advantage_knowledge.values()
                if item.holder_id == sharer.player_id and item.confidence >= 0.95 and item.exact
            ]
            if not known_items:
                continue
            close_allies = [
                other
                for other in self.players
                if other is not sharer
                and other in active_set
                and sharer.relationships.get(other, 0) >= 5
                and other.relationships.get(sharer, 0) >= 3
            ]
            medium_contacts = [
                other
                for other in self.players
                if other is not sharer
                and other not in close_allies
                and sharer.relationships.get(other, 0) >= 2
            ]
            for knowledge in known_items:
                copy_item = next(
                    (copy for copy in self.advantage_copies if copy.copy_id == knowledge.copy_id),
                    None,
                )
                if copy_item is None or copy_item.state not in {"held", "transferred", "bequeathed"}:
                    continue
                for ally in close_allies:
                    share_chance = 0.08 + 0.04 * int(sharer.social_skill or 1) + 0.03 * int(sharer.strategy_level or 1)
                    if self.rng.random() < min(0.55, share_chance):
                        self._record_advantage_knowledge(
                            observer=ally,
                            holder=sharer,
                            copy_item=copy_item,
                            source="shared_by_holder",
                            exact=True,
                            confidence=0.9,
                        )
                        self.log.info(
                            f"{sharer.name} tells {ally.name} about {copy_item.advantage_type}."
                        )
                for contact in medium_contacts:
                    leak_chance = 0.015 + 0.01 * int(sharer.social_skill or 1)
                    if self.rng.random() < min(0.12, leak_chance):
                        self._record_advantage_knowledge(
                            observer=contact,
                            holder=sharer,
                            copy_item=copy_item,
                            source="rumor",
                            exact=False,
                            confidence=0.35,
                        )
                        self.log.info(
                            f"{contact.name} hears a rumor that {sharer.name} found something."
                        )

    def _mark_advantage_played(self, player: Player, adv: str, qty: int = 1) -> None:
        self._ensure_player_stat_row(player)
        if adv in (ADV_IDOL, ADV_SUPER_IDOL, ADV_DOUBLE_IDOL, ADV_5050):
            self.player_season_stats[player.player_id]["idols_played"] += int(
                qty)

    def _mark_held_advantage_copies_played(self, player: Player, adv: str, qty: int = 1) -> None:
        remaining = max(0, int(qty))
        if remaining <= 0:
            return
        played_copies: List[AdvantageCopy] = []
        for copy_item in self.advantage_copies:
            if remaining <= 0:
                break
            if (
                copy_item.owner_id == player.player_id
                and copy_item.advantage_type == adv
                and copy_item.state in {"held", "transferred", "bequeathed"}
            ):
                copy_item.mark_played(round_number=self.round_number)
                played_copies.append(copy_item)
                remaining -= 1
        self._mark_advantage_played(player, adv, qty - remaining)
        for copy_item in played_copies:
            self._maybe_rehide_idol_after_play(copy_item)

    def _mark_held_advantage_copies_expired(self, player: Player, adv: str, qty: int = 1) -> None:
        remaining = max(0, int(qty))
        if remaining <= 0:
            return
        for copy_item in self.advantage_copies:
            if remaining <= 0:
                break
            if (
                copy_item.owner_id == player.player_id
                and copy_item.advantage_type == adv
                and copy_item.state in {"held", "transferred", "bequeathed"}
            ):
                copy_item.mark_expired(round_number=self.round_number)
                remaining -= 1

    def _mark_hidden_advantage_copies_removed(self, advantage_types: Set[str]) -> None:
        for copy_item in self.advantage_copies:
            if copy_item.state == "hidden" and copy_item.advantage_type in advantage_types:
                copy_item.mark_removed(round_number=self.round_number)

    def _transfer_held_advantage_copy(self, source: Player, target: Player, adv: str) -> None:
        for copy_item in self.advantage_copies:
            if (
                copy_item.owner_id == source.player_id
                and copy_item.advantage_type == adv
                and copy_item.state in {"held", "transferred", "bequeathed"}
            ):
                copy_item.transfer_to(target.player_id)
                self._refresh_advantage_knowledge_owner(copy_item)
                self._record_advantage_knowledge(
                    observer=target,
                    holder=target,
                    copy_item=copy_item,
                    source="received_transfer",
                    exact=True,
                    confidence=1.0,
                )
                return

    def _bequeath_held_advantage_copy(self, source: Player, target: Player, adv: str) -> None:
        for copy_item in self.advantage_copies:
            if (
                copy_item.owner_id == source.player_id
                and copy_item.advantage_type == adv
                and copy_item.state in {"held", "transferred", "bequeathed"}
            ):
                copy_item.mark_bequeathed(target.player_id)
                self._refresh_advantage_knowledge_owner(copy_item)
                self._record_advantage_knowledge(
                    observer=target,
                    holder=target,
                    copy_item=copy_item,
                    source="bequeathed",
                    exact=True,
                    confidence=1.0,
                )
                return

    def _snapshot_advantage_inventory(self, players: Iterable[Player]) -> Dict[str, Counter[str]]:
        return {
            player.player_id: Counter[str](dict(player.inventory))
            for player in players
        }

    def _mark_inventory_decreases_as_played(
        self,
        before: Dict[str, Counter[str]],
        players: Iterable[Player],
    ) -> None:
        tracked = {
            ADV_IDOL,
            ADV_SUPER_IDOL,
            ADV_DOUBLE_IDOL,
            ADV_LEGACY,
            ADV_5050,
            ADV_NULLIFIER,
            ADV_VOTE_STEAL,
            ADV_VOTE_BLOCK,
            ADV_KIP,
            ADV_EXTRA_VOTE,
            ADV_SAFETY,
        }
        for player in players:
            previous = before.get(player.player_id, Counter())
            for adv in tracked:
                delta = int(previous.get(adv, 0)) - int(player.inventory.get(adv, 0))
                if delta > 0:
                    self._mark_held_advantage_copies_played(player, adv, delta)

    def _mark_immunity_win(self, winners: Iterable[Player]) -> None:
        for p in winners:
            self._ensure_player_stat_row(p)
            self.player_season_stats[p.player_id]["immunity_wins"] += 1

    def _mark_return_to_game(self, player: Player) -> None:
        self._ensure_player_stat_row(player)
        self.player_season_stats[player.player_id]["return_count"] += 1

    def _record_votes_received_for_tribal(self, votes: Dict[Player, Player]) -> None:
        self._pending_votes_received_this_tribal = Counter[Player](votes.values())

    def _commit_votes_received_for_tribal(self) -> None:
        if not self._pending_votes_received_this_tribal:
            return
        for target, cnt in self._pending_votes_received_this_tribal.items():
            self._ensure_player_stat_row(target)
            self.player_season_stats[target.player_id]["votes_received"] += int(
                cnt)
        self._pending_votes_received_this_tribal = Counter[Player]()

    def _mark_vote_participation(
        self,
        votes: Dict[Player, Player],
        eliminated: Player,
    ) -> None:
        for voter, target in votes.items():
            self._ensure_player_stat_row(voter)
            self.player_season_stats[voter.player_id]["total_votes_cast"] += 1
            if target is eliminated:
                self.player_season_stats[voter.player_id]["correct_votes"] += 1

        for p in self.players:
            self._ensure_player_stat_row(p)
            if p is not eliminated:
                self.player_season_stats[p.player_id]["tribals_survived"] += 1

    def _finalize_actual_placements(self) -> None:
        """
        Computes actual placements from the true season timeline after the game ends.
        """
        everyone = self.players + self.eliminated_players
        finalists = self.players[:]

        winner: Optional[Player] = None
        if finalists:
            # if there is a single surviving sole survivor stored nowhere else,
            # we infer the winner later from final tribal return path if needed.
            # this gets overwritten by explicit winner-aware path below when available.
            pass

        # We rely on the real endgame call to set _actual_winner_id when available.
        if hasattr(self, "_actual_winner_id") and getattr(self, "_actual_winner_id", None):
            winner = next((p for p in everyone if p.player_id ==
                          self._actual_winner_id), None)

        placement_map = _placement_from_boot_order(
            all_players=everyone,
            finalists=finalists,
            boot_log=self.boot_log[:],
            winner=winner,
        )

        for p in everyone:
            self._ensure_player_stat_row(p)
            self.player_season_stats[p.player_id]["actual_placement"] = placement_map.get(
                p.player_id,
                len(everyone),
            )

    def _active_prediction_players(self) -> List[Player]:
        """
        Players who should appear in the live prediction chart.
        Eliminated players stay hidden unless they have returned and are active again.
        """
        return [p for p in self.players if p not in self.eliminated_players]

    def _format_prediction_chart(self, rows: List[PlayerPredictionAggregate], title: str) -> str:
        if not rows:
            return f"\n{title}\n(no active players)\n"

        name_w = max(12, max(len(r.name) for r in rows))
        lines: List[str] = []
        lines.append("")
        lines.append(title)
        lines.append(
            f"{'Rank':<4}  {'Player':<{name_w}}  {'Win%':>7}  {'Final%':>8}  {'Avg%':>7}  {'AvgPlace':>9}"
        )
        lines.append("-" * (4 + 2 + name_w + 2 + 7 + 2 + 8 + 2 + 7 + 2 + 9))

        for idx, row in enumerate(rows, start=1):
            lines.append(
                f"{idx:<4}  "
                f"{row.name:<{name_w}}  "
                f"{row.win_chance_pct:>6.1f}%  "
                f"{row.survival_chance_pct:>7.1f}%  "
                f"{row.combined_pct:>6.1f}%  "
                f"{row.avg_placement:>9.2f}"
            )

        return "\n".join(lines)

    def _sort_prediction_rows(
        self,
        rows: Iterable[PlayerPredictionAggregate],
    ) -> List[PlayerPredictionAggregate]:
        out = list(rows)
        out.sort(
            key=lambda r: (
                r.combined_pct,
                r.win_chance_pct,
                r.survival_chance_pct,
                -r.avg_placement,
                r.name,
            ),
            reverse=bool(self.config.prediction_sort_descending),
        )
        return out

    # ---------- predictive rollout engine ----------
    def _make_rollout_config(self, rollout_index: int) -> GameConfig:
        rollout_cfg: GameConfig = copy.deepcopy(self.config)

        # Fake rollout branches should be completely silent and should not create
        # their own log files.
        rollout_cfg.logfile = self.config.logfile
        rollout_cfg.log_level = LOG_ERROR

        # Rollouts should never recursively run predictions
        rollout_cfg.prediction_enabled = False
        rollout_cfg.prediction_log_each_round = False
        rollout_cfg.prediction_include_ascii_chart = False

        # Rollouts should never persist anything
        rollout_cfg.save_social_memory_at_end = False
        rollout_cfg.use_social_memory = False

        # Disable all visual graphs during fake simulations
        rollout_cfg.enable_visual_graphs = False

        return rollout_cfg

    def _make_rollout_plan(self) -> SeasonPlan:
        """
        Copy the current season plan exactly so fake simulations continue
        from the same structural rules, but without touching the real plan.
        """
        return copy.deepcopy(self.plan)


    def _build_rollout_simulator(self, rollout_index: int) -> "SurvivorSimulator":
        """
        Creates a fully isolated simulator branch from the CURRENT game state.
        No objects in the returned simulator are shared with the real season.

        Important: all known players are cloned into ONE shared object universe so
        cross-state relationships (active <-> eliminated <-> boot_log) remain intact.
        """
        rollout_cfg = self._make_rollout_config(rollout_index)
        rollout_plan = self._make_rollout_plan()

        # Build one unified player universe first
        source_universe: List[Player] = []
        seen_ids: Set[str] = set()
        for seq in (self.players, self.eliminated_players, self.boot_log):
            for p in seq:
                if p.player_id not in seen_ids:
                    seen_ids.add(p.player_id)
                    source_universe.append(p)

        # Clone all players into one shared map
        cloned_universe: List[Player] = []
        for p in source_universe:
            cp = Player(
                name=p.name,
                player_id=p.player_id,
                strategy_level=p.strategy_level,
                threat_level=p.threat_level,
                challenge_ability=p.challenge_ability,
                social_skill=p.social_skill,
            )
            cp.immune = p.immune
            cp.vote_target = None
            cp.sat_out_last = p.sat_out_last
            cp.idols = p.idols
            cp.tribe_label = p.tribe_label
            cp.phase_threat_mult = p.phase_threat_mult
            cp.phase_preempt_mult = p.phase_preempt_mult
            cp.inventory = Counter(dict(p.inventory))
            cp.left_tribal_no_vote = p.left_tribal_no_vote
            setattr(cp, "config", rollout_cfg)
            cloned_universe.append(cp)

        clone_by_id: Dict[str, Player] = {p.player_id: p for p in cloned_universe}
        orig_by_id: Dict[str, Player] = {p.player_id: p for p in source_universe}

        for cp in cloned_universe:
            op = orig_by_id[cp.player_id]
            cp.relationships = {
                clone_by_id[q.player_id]: int(v)
                for q, v in op.relationships.items()
                if q.player_id in clone_by_id
            }
            cp.threat_perceptions = {
                clone_by_id[q.player_id]: float(v)
                for q, v in op.threat_perceptions.items()
                if q.player_id in clone_by_id
            }
            cp.advantage_knowledge = copy.deepcopy(op.advantage_knowledge)
            if op.vote_target is not None and op.vote_target.player_id in clone_by_id:
                cp.vote_target = clone_by_id[op.vote_target.player_id]

        cloned_active = [clone_by_id[p.player_id] for p in self.players]
        cloned_eliminated = [clone_by_id[p.player_id] for p in self.eliminated_players]
        cloned_boot_log = [clone_by_id[p.player_id] for p in self.boot_log]

        # independent random source
        rollout_seed_base = self.config.seed if self.config.seed is not None else 0
        rollout_rng = random.Random(
            rollout_seed_base
            + (self.round_number * 1000003)
            + (rollout_index * 7919)
            + len(self.players) * 101
        )

        silent_logger = Logger(logfile=None, level=LOG_ERROR, enabled=False)

        rollout_sim = SurvivorSimulator(
            players=cloned_active,
            config=rollout_cfg,
            nomination_strategy=DefaultNominationStrategy(rollout_rng),
            voting_strategy=DefaultVotingStrategy(),
            idol_policy=DefaultIdolPolicy(cast(Any, silent_logger)),
            tiebreak_strategy=DefaultTieBreakerStrategy(),
            challenge_system=DefaultChallengeSystem(),
            rng=rollout_rng,
            logger=silent_logger,
            enable_default_events=False,
            season_plan=rollout_plan,
        )

        # overwrite auto-created state with the CURRENT real season state snapshot
        rollout_sim.starting_player_count = self.starting_player_count
        rollout_sim.finalists_count = self.finalists_count
        rollout_sim.jury_size = self.jury_size

        rollout_sim.round_number = self.round_number
        rollout_sim.episode_number = self.episode_number
        rollout_sim.merged = self.merged

        rollout_sim.tribe_names = copy.deepcopy(self.tribe_names)
        rollout_sim.merge_color = self.merge_color

        rollout_sim.eliminated_players = cloned_eliminated
        rollout_sim.boot_log = cloned_boot_log

        # tribes rebuilt by player_id against cloned_active roster
        rollout_sim.tribes = _clone_tribes_for_rollout(self.tribes, cloned_active)
        rollout_sim.players = cloned_active[:]
        rollout_sim._assert_roster_integrity()

        # map exiled player if present
        rollout_sim.exiled_player = None
        if self.exiled_player is not None and self.exiled_player.player_id in clone_by_id:
            rollout_sim.exiled_player = clone_by_id[self.exiled_player.player_id]

        # carry over planned/scheduled season state exactly
        rollout_sim.num_planned_swaps = self.num_planned_swaps
        rollout_sim.swap_triggers_remaining_counts = set(self.swap_triggers_remaining_counts)
        rollout_sim.swap_teams_by_trigger = dict(self.swap_teams_by_trigger)
        rollout_sim.swap_counter = self.swap_counter

        rollout_sim.adv_distribution = Counter[str](dict(self.adv_distribution))
        rollout_sim.advantages_issued = self.advantages_issued
        rollout_sim.advantages_enabled = self.advantages_enabled
        rollout_sim.seed_starting_tribe_idols = self.seed_starting_tribe_idols
        rollout_sim.seed_merge_idol = self.seed_merge_idol
        rollout_sim.advantage_seeds = copy.deepcopy(self.advantage_seeds)
        rollout_sim.advantage_copies = copy.deepcopy(self.advantage_copies)
        rollout_sim._seeded_advantage_seed_indices = set(self._seeded_advantage_seed_indices)
        rollout_sim._seeded_automatic_advantages = set(self._seeded_automatic_advantages)

        rollout_sim.merge_at_remaining = self.merge_at_remaining

        rollout_sim.scripted_immunity = copy.deepcopy(self.scripted_immunity)
        rollout_sim.scripted_nominees = copy.deepcopy(self.scripted_nominees)
        rollout_sim.scripted_votes = copy.deepcopy(self.scripted_votes)
        rollout_sim.scripted_elimination = copy.deepcopy(self.scripted_elimination)

        rollout_sim._merge_idols_seeded = self._merge_idols_seeded

        rollout_sim.season_has_family_visit = self.season_has_family_visit
        rollout_sim.season_has_auction = self.season_has_auction
        rollout_sim.family_visit_done = self.family_visit_done
        rollout_sim.auction_done = self.auction_done
        rollout_sim.family_visit_round = self.family_visit_round
        rollout_sim.auction_round = self.auction_round

        rollout_sim.is_merge_vote = self.is_merge_vote

        rollout_sim.battleback_points = list(self.battleback_points)
        rollout_sim.battleback_fired = set(self.battleback_fired)

        rollout_sim.demerge_done = self.demerge_done
        rollout_sim._printed_alliance_snapshots = set()

        rollout_sim.vote_option_count_plan = deque(list(self.vote_option_count_plan))

        # metrics do not matter for fake branches, but keep structure valid
        rollout_sim.player_season_stats = copy.deepcopy(self.player_season_stats)
        rollout_sim.round_prediction_history = []
        rollout_sim.latest_round_prediction = None
        rollout_sim._pending_votes_received_this_tribal = Counter()

        return rollout_sim

    def _run_rollout_to_completion(self, rollout_index: int) -> SimulationRolloutResult:
        """
        Runs one fake season branch from the current state through the end.
        This mutates ONLY the rollout simulator, never the real season.
        """
        rollout_sim = self._build_rollout_simulator(rollout_index)

        finale_gate = 5 if rollout_sim.finalists_count == 3 else 4
        while len(rollout_sim.players) > finale_gate:
            rollout_sim.run_round()

        if rollout_sim.finalists_count == 3:
            winner = rollout_sim._run_final_episode_f3_return_winner()
        else:
            winner = rollout_sim._run_final_episode_f2_return_winner()

        everyone = rollout_sim.players + rollout_sim.eliminated_players
        finalists = rollout_sim.players[:]
        placement_map = _placement_from_boot_order(
            all_players=everyone,
            finalists=finalists,
            boot_log=rollout_sim.boot_log[:],
            winner=winner,
        )

        result = SimulationRolloutResult()
        finalist_ids = {p.player_id for p in finalists}
        winner_id = winner.player_id if winner is not None else None
        active_ids = {p.player_id for p in rollout_sim.players}
        eliminated_ids = {p.player_id for p in rollout_sim.eliminated_players}

        for p in everyone:
            result.by_player_id[p.player_id] = SimulationPlayerSnapshot(
                player_id=p.player_id,
                name=p.name,
                alive=(p.player_id in active_ids),
                eliminated=(p.player_id in eliminated_ids),
                in_finalists=(p.player_id in finalist_ids),
                won=(winner_id is not None and p.player_id == winner_id),
                placement=int(placement_map.get(p.player_id, len(everyone))),
            )

        return result

    def _compute_round_predictions(self) -> RoundPredictionSummary:
        """
        Monte Carlo forecast from the CURRENT state.
        Uses cloned branches only, so the actual season state is untouched.
        """
        active_players = self._active_prediction_players()
        rows_by_id: Dict[str, PlayerPredictionAggregate] = {
            p.player_id: PlayerPredictionAggregate(
                player_id=p.player_id, name=p.name)
            for p in active_players
        }

        rollout_count = max(1, int(self.config.prediction_rollouts))
        for rollout_index in range(rollout_count):
            result = self._run_rollout_to_completion(rollout_index)
            for pid, row in rows_by_id.items():
                snap = result.by_player_id.get(pid)
                if snap is None:
                    # should not happen, but guard with worst-case fallback
                    snap = SimulationPlayerSnapshot(
                        player_id=row.player_id,
                        name=row.name,
                        alive=False,
                        eliminated=True,
                        in_finalists=False,
                        won=False,
                        placement=len(active_players),
                    )
                row.add_result(snap)

        rows = self._sort_prediction_rows(rows_by_id.values())
        return RoundPredictionSummary(
            round_number=self.round_number,
            player_rows=rows,
        )

    def _print_round_prediction_summary(self, summary: RoundPredictionSummary, context_label: str) -> None:
        if not self.config.prediction_log_each_round:
            return

        title = (
            f"Monte Carlo Forecast After {context_label} "
            f"(Round {summary.round_number}, {self.config.prediction_rollouts} rollouts)"
        )
        self.log.info(self._format_prediction_chart(
            summary.player_rows, title))

    def _run_and_log_round_predictions(self, context_label: str) -> None:
        if not self.config.prediction_enabled:
            return
        if len(self.players) <= 1:
            return

        summary = self._compute_round_predictions()
        self.latest_round_prediction = summary
        self.round_prediction_history.append(summary)
        self._print_round_prediction_summary(summary, context_label)

    # ---------- threat & social dynamics ----------

    def update_threat_levels(self) -> None:
        for p in self.players:
            perf = sum(p.relationships.values())
            if perf > 100:
                p.threat_level += 1
            elif perf < -100:
                p.threat_level += 1

        for observer in self.players:
            for target in self.players:
                if observer is target:
                    continue
                current = observer.threat_perceptions.get(
                    target,
                    float(
                        _threat_level_or(target, 3.0)),
                )
                updated = 0.85 * current + 0.15 * float(target.threat_level)
                observer.threat_perceptions[target] = updated

    def _relationship_drift(self) -> None:
        clamp_min = self.config.relationship_min
        clamp_max = self.config.relationship_max
        N = len(self.players)
        for i in range(N):
            for j in range(i + 1, N):
                a = self.players[i]
                b = self.players[j]
                avg_skill = (a.social_skill + b.social_skill) / 2.0
                p_pos = 0.24 + 0.14 * (avg_skill / 5.0)
                p_neg = 0.24 - 0.08 * (avg_skill / 5.0)
                p_zero = max(0.0, 1.0 - (p_pos + p_neg))
                r = self.rng.random()
                if r < p_neg:
                    delta = -2 if self.rng.random() < 0.45 else -1
                elif r < p_neg + p_zero:
                    delta = 0
                else:
                    delta = 1 + (1 if self.rng.random() <
                                 (0.18 + 0.12 * (avg_skill / 5.0)) else 0)
                if delta != 0:
                    a.update_relationship(b, delta)
                    b.update_relationship(a, delta)
                    a.clamp_relationship(b, clamp_min, clamp_max)
                    b.clamp_relationship(a, clamp_min, clamp_max)

    def _bonding_drift_within(self, group: List[Player], boost: float = 0.15) -> None:
        clamp_min, clamp_max = self.config.relationship_min, self.config.relationship_max
        for i in range(len(group)):
            for j in range(i + 1, len(group)):
                a, b = group[i], group[j]
                avg_skill = (a.social_skill + b.social_skill) / 2.0
                p_pos = 0.40 + boost + 0.16 * (avg_skill / 5.0)
                p_neg = max(0.04, 0.12 - 0.04 * (avg_skill / 5.0))
                p_zero = max(0.0, 1.0 - (p_pos + p_neg))
                r = self.rng.random()
                if r < p_neg:
                    delta = -2 if self.rng.random() < 0.2 else -1
                elif r < p_neg + p_zero:
                    delta = 0
                else:
                    delta = 1 + (1 if self.rng.random() < 0.38 else 0)
                if delta != 0:
                    a.update_relationship(b, delta)
                    b.update_relationship(a, delta)
                    a.clamp_relationship(b, clamp_min, clamp_max)
                    b.clamp_relationship(a, clamp_min, clamp_max)

    # ---------- reward & specials ----------

    def _maybe_reward_challenge(self) -> None:
        if self.merged:
            self._schedule_merge_specials_if_needed()

            if (self.family_visit_round is not None) and (not self.family_visit_done) and (self.round_number == self.family_visit_round):
                self._run_family_visit()
                self.family_visit_done = True
                return

            if (self.auction_round is not None) and (not self.auction_done) and (self.round_number == self.auction_round):
                self._run_auction()
                self.auction_done = True
                return

        if not self.merged:
            tribe_scores = {
                idx: sum(p.challenge_ability * self.rng.randint(1, 6)
                         for p in tribe)
                for idx, tribe in enumerate(self.tribes)
            }
            win_idx = max(tribe_scores, key=lambda k: tribe_scores[k])
            winners = self.tribes[win_idx][:]
            reward_label, advantage_attached = self._choose_reward_label()
            self.log.info(
                f"\nReward Challenge: {self.tribe_names[win_idx]} win {reward_label}")
            self._run_hidden_advantage_search(
                locations={"reward"},
                attendees=winners,
                force=True,
            )
            if advantage_attached:
                self._maybe_grant_attached_advantage(attendees=winners)
            self._bonding_drift_within(winners, boost=0.20)
        else:
            attendees_limit = max(2, len(self.players) // 2)
            reward_label, advantage_attached = self._choose_reward_label()

            perf = {p: p.challenge_ability *
                    self.rng.randint(1, 6) for p in self.players}
            winner = max(perf, key=lambda p: perf[p])
            attendees = [winner]

            others = [p for p in self.players if p is not winner]
            self.rng.shuffle(others)
            k = self.rng.randint(1, max(1, attendees_limit - 1))
            others.sort(key=lambda x: winner.relationships.get(
                x, 0), reverse=True)
            attendees += others[:k]

            self.log.info(
                f"\nReward Challenge: {winner.name} wins {reward_label} and brings {', '.join([p.name for p in attendees if p is not winner])}"
            )

            for p in self.players:
                if p is winner:
                    continue
                if p in attendees:
                    p.update_relationship(winner, +2)
                    winner.update_relationship(p, +2)
                else:
                    p.update_relationship(winner, -2)
                    winner.update_relationship(p, -1)
                p.clamp_relationship(
                    winner, self.config.relationship_min, self.config.relationship_max)
                winner.clamp_relationship(
                    p, self.config.relationship_min, self.config.relationship_max)

            self._run_hidden_advantage_search(
                locations={"reward"},
                attendees=attendees,
                force=True,
            )
            if advantage_attached:
                self._maybe_grant_attached_advantage(attendees=attendees)
            self._bonding_drift_within(attendees, boost=0.15)

    def _choose_reward_label(self) -> Tuple[str, bool]:
        base = self.rng.choice(REWARD_BASE_TYPES)
        if not self.advantages_enabled:
            return base, False
        cap = self.plan.advantages_total_cap
        can_attach = (cap is None or self.advantages_issued < cap)
        attach = can_attach and (self.rng.random() < 0.20)
        return base + ("+Advantage" if attach else ""), attach

    def _choose_advantage_with_diversity(self, allowed_pool: List[str]) -> str:
        weights: List[float] = []
        for adv in allowed_pool:
            count = self.adv_distribution.get(adv, 0)
            weight = 1.0 / (1.0 + count)
            weight *= (0.90 + 0.20 * self.rng.random())
            weights.append(weight)
        
        total: float = sum(weights)
        
        if total <= 0:
            return self.rng.choice(allowed_pool)
        
        pick: float = self.rng.random() * total
        acc: float = 0.0
        
        for adv, weight in zip(allowed_pool, weights):
            acc += weight
            if pick <= acc:
                return adv
        
        return allowed_pool[-1]

    def _maybe_grant_attached_advantage(self, attendees: List[Player]) -> None:
        if not self.advantages_enabled or not attendees:
            return
        cap = self.plan.advantages_total_cap
        if cap is not None and self.advantages_issued >= cap:
            return

        pool = [
            ADV_VOTE_BLOCK, ADV_EXTRA_VOTE, ADV_VOTE_STEAL, ADV_KIP,
            ADV_SAFETY, ADV_5050, ADV_DOUBLE_IDOL, ADV_FAKE_KIT,
            ADV_NULLIFIER, ADV_SUPER_IDOL, ADV_LEGACY
        ]
        adv = self._choose_advantage_with_diversity(pool)
        taker = self.rng.choice(attendees)
        taker.give(adv, 1)
        self._mark_advantage_found(taker, adv, 1)
        self.adv_distribution[adv] += 1
        self.advantages_issued += 1
        self.log.info(
            f"Advantage found on reward: {taker.name} secretly claims {adv}.")

        if adv == ADV_FAKE_KIT and not self.merged:
            if self.rng.random() < 0.50:
                tribe = [p for p in self.players if p.tribe_label ==
                         taker.tribe_label and p is not taker]
                if tribe:
                    victim = self.rng.choice(tribe)
                    victim.give(ADV_FAKE_HELD, 1)
                    self._mark_advantage_found(victim, ADV_FAKE_HELD, 1)
                    self.log.info(
                        f"(Fake Idol) {taker.name} plants a fake; {victim.name} later 'finds' it and believes it's real."
                    )

    def _run_family_visit(self) -> None:
        if not self.merged:
            return
        perf = {p: p.challenge_ability *
                self.rng.randint(1, 6) for p in self.players}
        winner = max(perf, key=lambda p: perf[p])
        others = [p for p in self.players if p is not winner]
        self.rng.shuffle(others)
        guests = others[:self.rng.randint(2, max(2, min(3, len(others))))]
        self.log.info(
            f"\nFamily Visit: {winner.name} wins and shares with {', '.join([g.name for g in guests])}")
        attendees = [winner] + guests
        self._bonding_drift_within(attendees, boost=0.25)
        for p in self.players:
            if p not in attendees and p is not winner:
                p.update_relationship(winner, -1)
                p.clamp_relationship(
                    winner, self.config.relationship_min, self.config.relationship_max)

    def _run_auction(self) -> None:
        if not self.merged:
            return
        
        self.log.info("\nSurvivor Auction begins!")
        self._seed_configured_advantages("auction")
        self._run_hidden_advantage_search(
            locations={"auction"},
            attendees=self.players,
            force=True,
        )

        cap = self.plan.advantages_total_cap
        advantage_available = self.advantages_enabled and (cap is None or self.advantages_issued < cap)
        advantage_given = False

        results: Dict[Player, List[str]] = {}

        for p in self.players:
            take = self.rng.choices([0, 1, 2, 3], weights=[
                                    0.05, 0.55, 0.30, 0.10], k=1)[0]
            
            items: List[str] = []

            for _ in range(take):
                r = self.rng.random()
                if r < 0.80:
                    items.append("Food")
                elif r < 0.95:
                    items.append("Bath")
                else:
                    items.append("Trip")
            if take == 0:
                items.append("Nothing")

            if (not advantage_given) and advantage_available and any(x in ("Food", "Bath", "Trip") for x in items):
                if self.rng.random() < 0.20:
                    adv = self._choose_advantage_with_diversity([
                        ADV_EXTRA_VOTE, ADV_VOTE_BLOCK, ADV_VOTE_STEAL,
                        ADV_5050, ADV_NULLIFIER, ADV_SUPER_IDOL, ADV_LEGACY, ADV_SAFETY
                    ])
                    p.give(adv, 1)
                    self._mark_advantage_found(p, adv, 1)
                    self.adv_distribution[adv] += 1
                    self.advantages_issued += 1
                    items.append("Advantage")
                    advantage_given = True
                    self.log.info(
                        f"(Auction) {p.name} secretly receives an {adv} attached to their purchase.")

            results[p] = items

        self.log.info("\nAuction results:")
        for p in self.players:
            self.log.info(f"{p.name}: {', '.join(results[p])}")

    # ---------- idol expiry ----------

    def _expire_idols_if_needed(self) -> None:
        non_idol_advantages = {
            ADV_LEGACY,
            ADV_5050,
            ADV_NULLIFIER,
            ADV_VOTE_STEAL,
            ADV_VOTE_BLOCK,
            ADV_KIP,
            ADV_EXTRA_VOTE,
            ADV_SAFETY,
            ADV_FAKE_KIT,
        }
        if len(self.players) <= 5:
            expired_advantages: List[str] = []
            for p in self.players:
                for adv in non_idol_advantages:
                    count = int(p.inventory.get(adv, 0))
                    if count > 0:
                        p.inventory[adv] = 0
                        self._mark_held_advantage_copies_expired(p, adv, count)
                        expired_advantages.append(f"{p.name} {adv}")
            self._mark_hidden_advantage_copies_removed(non_idol_advantages)
            if expired_advantages:
                self.log.info(
                    f"\nAdvantages expire before Final 5: {', '.join(expired_advantages)}")

        if self.merged and len(self.players) == 4:
            expired_names: List[str] = []
            for p in self.players:
                for adv in IDOL_ADVANTAGE_TYPES:
                    count = int(p.inventory.get(adv, 0))
                    if count > 0:
                        p.inventory[adv] = 0
                        if adv == ADV_IDOL:
                            p.idols = 0
                        self._mark_held_advantage_copies_expired(p, adv, count)
                        expired_names.append(f"{p.name} {adv}")
            self._mark_hidden_advantage_copies_removed(IDOL_ADVANTAGE_TYPES)
            if expired_names:
                self.log.info(
                    f"\nIdols expire after the Final 5 Tribal Council: {', '.join(expired_names)}")

    # ---------- demerge ----------

    def _run_demerge_round(self) -> None:
        if not self.merged:
            return
        n = len(self.players)
        if n <= 3:
            return
        self.log.info(
            f"\nDEMERGE TRIGGERED at {n} players: splitting into two tribes; both will attend separate tribals.")

        pool = self.players[:]
        self.rng.shuffle(pool)
        a_size = n // 2
        tribe_a = pool[:a_size]
        tribe_b = pool[a_size:]

        for p in tribe_a:
            p.tribe_label = "Demerge A"
        for p in tribe_b:
            p.tribe_label = "Demerge B"

        self.log.info("\nDemerge A")
        for p in tribe_a:
            self.log.info(p.name)
        self.log.info("\nDemerge B")
        for p in tribe_b:
            self.log.info(p.name)

        self.update_threat_levels()
        self.tribal_council(tribe_a[:])
        self._run_and_log_round_predictions(
            context_label="Demerge Tribal A"
        )
        tribe_b = [p for p in tribe_b if p in self.players]
        if len(tribe_b) >= 2:
            self.update_threat_levels()
            self.tribal_council(tribe_b[:])
            self._run_and_log_round_predictions(
                context_label="Demerge Tribal B"
            )

        for p in self.players:
            p.tribe_label = "Merged"
        self.tribes = [self.players]
        self.merged = True
        self.is_merge_vote = False
        self._assert_roster_integrity()
        self.demerge_done = True
        self.log.info("\nDemerge complete â€” players re-merge.")

    # ---------- battleback ----------

    def _run_battleback(self) -> None:
        if not self.eliminated_players:
            self.log.info(
                "\nBattleback triggered, but there are no eliminated players.")
            return

        pool = self.eliminated_players[:]
        self.rng.shuffle(pool)
        perf = {p: p.challenge_ability * self.rng.randint(1, 6) for p in pool}
        winner = max(perf, key=lambda p: perf[p])

        try:
            self.eliminated_players.remove(winner)
        except ValueError:
            pass

        winner.reset_for_round()
        winner.immune = False

        if self.merged:
            self.players.append(winner)
            if not self.tribes:
                self.tribes = [[winner]]
            else:
                self.tribes[0].append(winner)
            winner.tribe_label = "Merged"
            self.log.info(
                f"\nBattleback: {winner.name} returns to the MERGED tribe.")
        else:
            if not self.tribes:
                self.tribes = [[]]
                self.tribe_names = self.tribe_names or ["Tribe 1"]
            target_idx = min(range(len(self.tribes)), key=lambda i: len(
                self.tribes[i])) if self.tribes else 0
            self.tribes[target_idx].append(winner)
            self.players.append(winner)
            winner.tribe_label = self.tribe_names[target_idx] if self.tribe_names else None
            self.log.info(
                f"\nBattleback: {winner.name} returns to {winner.tribe_label or 'a tribe'}.")

        self._mark_return_to_game(winner)
        self._assert_roster_integrity()

    # ---------- alliances ----------

    def _rel(self, a: Player, b: Player) -> int:
        return a.relationships.get(b, 0)

    def _alliance_candidates(self, pool: List[Player]) -> List[Tuple[Tuple[Player, ...], float, float, bool]]:
        cfg = self.config
        min_edge = cfg.alliance_min_edge
        max_size = max(2, cfg.alliance_max_size)

        def edge_ok_rel(x: Player, y: Player) -> bool:
            return (self._rel(x, y) >= min_edge) and (self._rel(y, x) >= min_edge)

        def edge_ok_interest(x: Player, y: Player) -> bool:
            return self._interest_edge_weight(x, y, pool) >= cfg.alliance_edge_threshold

        use_interest = getattr(cfg, "alliances_use_interest", False)
        edge_ok = edge_ok_interest if use_interest else edge_ok_rel

        from itertools import combinations

        S = pool[:]
        base_pairs = [tuple(sorted((a, b), key=lambda p: p.name))
                      for a, b in combinations(S, 2) if edge_ok(a, b)]
        cand_sets: Set[frozenset[Player]] = set(frozenset(p) for p in base_pairs)

        grown = True
        while grown:
            grown = False
            to_add: Set[frozenset[Player]] = set()
            for c in list(cand_sets):
                if len(c) >= max_size:
                    continue
                members = tuple(c)
                for z in S:
                    if z in c:
                        continue
                    if all(edge_ok(z, m) for m in members):
                        new = frozenset(set(members) | {z})
                        if new not in cand_sets:
                            to_add.add(new)
            if to_add:
                cand_sets |= to_add
                grown = True

        cands: List[Tuple[Tuple[Player, ...], float, float, bool]] = []
        for fs in cand_sets:
            members = tuple(sorted(list(fs), key=lambda p: p.name))
            if len(members) < 2:
                continue

            from itertools import combinations as comb
            pairs = list(comb(members, 2))
            if not pairs:
                continue

            if use_interest:
                edge_vals = [self._interest_edge_weight(
                    x, y, pool) for x, y in pairs]
            else:
                edge_vals = [self._norm_rel(x, y) for x, y in pairs]

            cohesion = sum(edge_vals) / len(edge_vals)

            outsiders = [p for p in pool if p not in members]
            pulls: List[float] = []
            for m in members:
                if use_interest:
                    best = max((self._interest_edge_weight(m, o, pool)
                               for o in outsiders), default=0.0)
                else:
                    best = max((self._norm_rel(m, o)
                               for o in outsiders), default=0.0)
                pulls.append(best)
            ext_pull = sum(pulls) / len(pulls) if pulls else 0.0
            exposure = cohesion - ext_pull

            is_def = True
            for m in members:
                if use_interest:
                    inside = sum(self._interest_edge_weight(m, x, pool)
                                 for x in members if x is not m)
                    outside = sum(self._interest_edge_weight(m, o, pool)
                                  for o in outsiders)
                else:
                    inside = sum(self._norm_rel(m, x)
                                 for x in members if x is not m)
                    outside = sum(self._norm_rel(m, o) for o in outsiders)
                if inside < outside:
                    is_def = False
                    break

            cands.append((members, cohesion, exposure, is_def))

        cands.sort(key=lambda t: (len(t[0]), t[1], t[2], [
                   p.name for p in t[0]]), reverse=True)
        return cands

    def _top_edge_pairs(self, pool: List[Player], limit: int) -> List[Tuple[Player, Player, float]]:
        pos_edges: List[Tuple[Player, Player, float]] = []
        from itertools import combinations
        use_interest = getattr(self.config, "alliances_use_interest", False)
        for a, b in combinations(pool, 2):
            if use_interest:
                w = self._interest_edge_weight(a, b, pool)
                if w >= self.config.alliance_edge_threshold:
                    pos_edges.append((a, b, w))
            else:
                w = self._rel(a, b)
                if w >= self.config.alliance_min_edge:
                    pos_edges.append((a, b, float(w)))
        pos_edges.sort(key=lambda x: (
            x[2], x[0].name, x[1].name), reverse=True)
        return pos_edges[:limit]

    def _edge_weight_any(self, a: Player, b: Player, pool: List[Player]) -> float:
        return self._interest_edge_weight(a, b, pool) if self.config.alliances_use_interest else self._norm_rel(a, b)

    def _components_from_edges(self, nodes: List[Player], edges: List[Tuple[Player, Player]]) -> List[Set[Player]]:
        adj: Dict[Player, Set[Player]] = {n: set() for n in nodes}
        for u, v in edges:
            adj[u].add(v)
            adj[v].add(u)
        seen: Set[Player] = set()
        comps: List[Set[Player]] = []
        for n in nodes:
            if n in seen:
                continue
            stack = [n]
            cur = {n}
            seen.add(n)
            while stack:
                x = stack.pop()
                for y in adj[x]:
                    if y not in seen:
                        seen.add(y)
                        cur.add(y)
                        stack.append(y)
            comps.append(cur)
        return comps

    def _minimal_strong_bridges(self, pool: List[Player], base_edges: List[Tuple[Player, Player]]) -> List[Tuple[Player, Player, float]]:
        nodes = pool[:]
        parent = {p: p for p in nodes}
        rank = {p: 0 for p in nodes}

        def find(x: Player) -> Player:
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        def union(a: Player, b: Player) -> bool:
            ra, rb = find(a), find(b)
            if ra == rb:
                return False
            if rank[ra] < rank[rb]:
                parent[ra] = rb
            elif rank[ra] > rank[rb]:
                parent[rb] = ra
            else:
                parent[rb] = ra
                rank[ra] += 1
            return True

        for u, v in base_edges:
            union(u, v)

        reps = {find(p) for p in nodes}
        if len(reps) <= 1:
            return []

        pairs: List[Tuple[float, Player, Player]] = []
        from itertools import combinations
        for a, b in combinations(nodes, 2):
            w = self._edge_weight_any(a, b, pool)
            if w <= 0.0:
                continue
            pairs.append((w, a, b))

        pairs.sort(key=lambda t: t[0], reverse=True)

        bridges: List[Tuple[Player, Player, float]] = []
        for w, a, b in pairs:
            if union(a, b):
                bridges.append((a, b, w))
                if len({find(p) for p in nodes}) == 1:
                    break
        return bridges

    def _sample_traversal_path(self, nodes: List[Player], edges: List[Tuple[Player, Player]],) -> Optional[List[Player]]: 
        if not nodes: return None

        deg: Counter[Player] = Counter()

        for u, v in edges:
            deg[u] += 1
            deg[v] += 1

        sorted_nodes: List[Player] = [p for p, _ in deg.most_common()]

        if len(sorted_nodes) < 2:
            sorted_nodes = nodes[:]

        if len(sorted_nodes) < 2:
            return None

        src: Player = sorted_nodes[-1]
        dst: Player = sorted_nodes[0]

        if src == dst and len(nodes) >= 2:
            dst = nodes[1]

        adj: Dict[Player, List[Player]] = {n: [] for n in nodes}

        for u, v in edges:
            adj[u].append(v)
            adj[v].append(u)

        queue: deque[Player] = deque([src])
        prev: Dict[Player, Optional[Player]] = {src: None}

        while queue:
            x = queue.popleft()

            if x == dst:
                break

            for y in adj[x]:
                if y not in prev:
                    prev[y] = x
                    queue.append(y)

        if dst not in prev:
            return None

        path: List[Player] = []
        cur: Optional[Player] = dst

        while cur is not None:
            path.append(cur)
            cur = prev[cur]

        path.reverse()
        return path

    def _print_ascii_alliance_graph(self, pool: List[Player], title: str) -> None:
        if not self.config.ascii_alliance_graph:
            return

        use_interest = getattr(self.config, "alliances_use_interest", False)
        topN = max(1, int(self.config.ascii_graph_top_edges))
        thresh = float(self.config.ascii_graph_min_weight)

        from itertools import combinations
        base_edges_weighted: List[Tuple[Player, Player, float]] = []
        for a, b in combinations(pool, 2):
            if use_interest:
                w = self._interest_edge_weight(a, b, pool)
                if w >= thresh:
                    base_edges_weighted.append((a, b, w))
            else:
                rel = float(self._rel(a, b))
                if rel >= self.config.alliance_min_edge:
                    base_edges_weighted.append((a, b, self._norm_rel(a, b)))

        base_edges_weighted.sort(key=lambda e: e[2], reverse=True)
        printable_base = base_edges_weighted[:topN]

        base_pairs = [(u, v) for (u, v, _) in base_edges_weighted]
        bridges = self._minimal_strong_bridges(
            pool, base_pairs) if self.config.ensure_traversable_graph else []
        combined_pairs = base_pairs + [(u, v) for (u, v, _) in bridges]

        if not printable_base and not bridges:
            self.log.info("(Alliance ASCII) no edges above threshold.")
            return

        maxw = 1.0
        if printable_base:
            maxw = max(maxw, max(w for _, _, w in printable_base))
        if bridges:
            maxw = max(maxw, max(w for _, _, w in bridges))

        scale = 12
        lines: List[str] = []
        lines.append("+-" + "-" * 40 + "-+")
        lines.append(f"| Alliance Graph [ASCII] â€” {title}".ljust(43) + " |")
        lines.append("+-" + "-" * 40 + "-+")

        for a, b, w in printable_base:
            bar_len = max(1, int((w / maxw) * scale))
            bar = "â”€" * bar_len
            label = f"{a.name} {bar}({w:.2f}){bar} {b.name}"
            if len(label) > 78:
                label = label[:75] + "..."
            lines.append("| " + label.ljust(78) + " |")

        for a, b, w in bridges:
            bar_len = max(1, int((w / maxw) * scale))
            bar = "â”€" * bar_len
            label = f"{a.name} {bar}({w:.2f}){bar} {b.name} [bridge]"
            if len(label) > 78:
                label = label[:75] + "..."
            lines.append("| " + label.ljust(78) + " |")

        lines.append("+-" + "-" * 40 + "-+")
        self.log.info("\n" + "\n".join(lines))

        comps = self._components_from_edges(pool, combined_pairs)
        if len(comps) <= 1:
            path = self._sample_traversal_path(pool, combined_pairs)
            if path and len(path) >= 2:
                self.log.info("Traversability: " +
                              " -> ".join([p.name for p in path]))
            else:
                self.log.info("Traversability: (graph connected)")
        else:
            comp_sizes = ", ".join(str(len(c)) for c in comps)
            self.log.info(
                f"Traversability: still disconnected (components: {comp_sizes})")

        if bridges:
            text = ", ".join(
                [f"{a.name}â€”{b.name} ({w:.2f})" for a, b, w in bridges])
            self.log.info(f"Bridge suggestions (minimal, strongest): {text}")

    def _print_alliances_snapshot(self, pool: List[Player], title: str) -> None:
        self.log.info(f"\nAlliance Snapshot â€” {title}")
        use_interest = getattr(self.config, "alliances_use_interest", False)
        all_cands = self._alliance_candidates(pool)

        selected: List[Tuple[Tuple[Player, ...], float, float, bool]] = []
        chosen_sets: List[Set[Player]] = []
        max_show = self.config.alliances_top_k

        for members, coh, exp, is_def in all_cands:
            if len(selected) >= max_show:
                break
            mset = set(members)
            if any(mset.issubset(s) for s in chosen_sets):
                continue
            selected.append((members, coh, exp, is_def))
            chosen_sets.append(mset)

        printed_keys: Set[Tuple[str, ...]] = set()

        if not selected:
            self.log.info("â€¢ (no strong multi-way alliances detected)")
            pairs = self._top_edge_pairs(pool, self.config.alliance_show_top_pairs)
            if pairs:
                self.log.info("  Notable pairs:")
                for a, b, w in pairs:
                    key = tuple(sorted((a.name, b.name)))
                    if key in printed_keys:
                        continue
                    printed_keys.add(key)
                    if use_interest:
                        self.log.info(f"  - {a.name} & {b.name} (ally_score {w:.2f})")
                    else:
                        self.log.info(f"  - {a.name} & {b.name} (tie {int(w)})")

            self._print_ascii_alliance_graph(pool, title)

            if getattr(self.config, "enable_visual_graphs", True):
                try:
                    draw_alliance_graph(
                        self,
                        cast(Any, pool),
                        mode="interest" if use_interest else "relationship",
                        view="both",
                        progressive=False,
                        save_path=None,
                        top_edges=getattr(self.config, "ascii_graph_top_edges", None),
                    )
                except Exception as e:
                    self.log.warn(f"(Matplotlib alliance graph skipped): {e}")
            return

        def label(members: Tuple[Player, ...], coh: float, exp: float, is_def: bool) -> str:
            names = ", ".join(p.name for p in members)
            stab = "defensive" if is_def else ("fragile" if exp >= 0.5 else "shaky")
            suffix = " (interest)" if use_interest else ""
            return f"[{names}] â€” cohesion {coh:.2f}, exposure {exp:.2f}, {stab}{suffix}"

        for members, coh, exp, is_def in selected:
            key = tuple(sorted(p.name for p in members))
            if key in printed_keys:
                continue
            printed_keys.add(key)
            self.log.info("â€¢ " + label(members, coh, exp, is_def))

        self._print_ascii_alliance_graph(pool, title)

        if getattr(self.config, "enable_visual_graphs", True):
            try:
                draw_alliance_graph(
                    self,
                    cast(Any, pool),
                    mode="interest" if use_interest else "relationship",
                    view="both",
                    progressive=False,
                    save_path=None,
                    top_edges=getattr(self.config, "ascii_graph_top_edges", None),
                )
            except Exception as e:
                self.log.warn(f"(Matplotlib alliance graph skipped): {e}")

    # ---------- alliance-aware voting ----------

    def _eligible_targets_for_voter(self, pool: List[Player], restricted_targets: Optional[List[Player]], voter: Player) -> List[Player]:
        if restricted_targets is None:
            elig_seed = [p for p in pool if not p.immune]
        else:
            elig_seed = [p for p in restricted_targets if not p.immune]

        eligible = [p for p in elig_seed if p is not voter]
        if len(eligible) < 2:
            pool_extras = [
                p for p in pool if p not in eligible and not p.immune and p is not voter]
            pool_extras.sort(key=lambda x: x.threat_level, reverse=True)
            if pool_extras:
                eligible.append(pool_extras[0])
        return eligible

    def _alignment_vote_adjustment(
        self,
        pool: List[Player],
        votes: Dict[Player, Player],
        restricted_targets: Optional[List[Player]]
    ) -> Dict[Player, Player]:
        if not votes:
            return votes

        cfg = self.config
        min_edge = cfg.alliance_min_edge
        topk = cfg.align_topk_friends
        delta = cfg.align_score_delta
        use_interest = getattr(cfg, "alliances_use_interest", False)

        new_votes = dict(votes)

        # ----------------------------
        # Pass 1: alliance / friend alignment nudges
        # ----------------------------
        for voter in pool:
            if voter.left_tribal_no_vote or voter.inventory.get("vote_blocked", 0) > 0:
                continue

            eligible = self._eligible_targets_for_voter(pool, restricted_targets, voter)
            if not eligible:
                continue

            scores = {t: _score_target_for_voter(voter, t) for t in eligible}

            cur = new_votes.get(voter)

            # If the current target is missing or no longer eligible, reset to best legal target
            if cur is None or cur not in scores:
                if not scores:
                    continue
                cur = min(scores, key=lambda p: scores[p])
                new_votes[voter] = cur

            if use_interest:
                cand_allies = [p for p in pool if p is not voter]
                cand_allies.sort(
                    key=lambda q: self._interest_edge_weight(voter, q, pool),
                    reverse=True
                )
                friends = [
                    q for q in cand_allies
                    if self._interest_edge_weight(voter, q, pool) >= cfg.alliance_edge_threshold
                ][:topk]
            else:
                friends = sorted(
                    [p for p in pool if p is not voter and self._rel(voter, p) >= min_edge],
                    key=lambda q: (self._rel(voter, q), q.name),
                    reverse=True
                )[:topk]

            friend_targets = [
                target
                for f in friends
                if (target := new_votes.get(f)) is not None and target in scores
            ]
            if not friend_targets:
                continue

            counts = Counter(friend_targets)
            best_friend_targets = [
                t for t, c in counts.items()
                if c == max(counts.values())
            ]
            best_friend_targets.sort(key=lambda t: scores[t])
            ally_target = best_friend_targets[0]

            if ally_target not in scores or ally_target is cur:
                continue

            cur_score = scores.get(cur, float("inf"))
            ally_score = scores.get(ally_target, float("inf"))

            if ally_score <= cur_score + delta:
                bloc_allies = [f for f in friends if new_votes.get(f) is ally_target]
                if bloc_allies:
                    if use_interest:
                        avg_closeness = (
                            sum(self._interest_edge_weight(voter, f, pool) for f in bloc_allies)
                            / len(bloc_allies)
                        )
                    else:
                        avg_closeness = (
                            sum(max(0, self._rel(voter, f)) for f in bloc_allies)
                            / len(bloc_allies)
                        )
                else:
                    avg_closeness = 0.0

                p_switch = min(
                    0.9,
                    cfg.align_nudge_strength
                    * (1.0 + 0.05 * len(bloc_allies))
                    * (voter.social_skill / 5.0)
                    * (1.0 + (avg_closeness if use_interest else (avg_closeness / 6.0)))
                )

                if self.rng.random() < p_switch:
                    new_votes[voter] = ally_target
                    self.log.info(
                        f"Alignment nudge: {voter.name} shifts vote to align with allies on {ally_target.name}."
                    )

        # ----------------------------
        # Pass 2: soft consolidation away from isolated votes
        # ----------------------------
        tally = Counter(new_votes.values())

        for voter, target in list(new_votes.items()):
            if voter.left_tribal_no_vote or voter.inventory.get("vote_blocked", 0) > 0:
                continue

            eligible = self._eligible_targets_for_voter(pool, restricted_targets, voter)
            if not eligible:
                continue

            scores = {t: _score_target_for_voter(voter, t) for t in eligible}

            # If current target is no longer valid, repair it first
            if target not in scores:
                if scores:
                    repaired = min(scores, key=lambda p: scores[p])
                    if repaired is not target:
                        tally[target] -= 1
                        if tally[target] <= 0:
                            del tally[target]
                        tally[repaired] += 1
                        new_votes[voter] = repaired
                        target = repaired
                else:
                    continue

            if tally.get(target, 0) <= 1:
                strategic_consolidator = voter.strategy_level >= 4
                social_consolidator = voter.social_skill >= 4

                if not (strategic_consolidator or social_consolidator):
                    continue

                bloc_targets = [
                    t for t, c in tally.items()
                    if c >= 2 and t in scores and t is not target
                ]
                bloc_targets.sort(key=lambda t: scores[t])

                current_score = scores.get(target, float("inf"))

                for cand in bloc_targets:
                    cand_score = scores.get(cand, float("inf"))
                    if cand_score <= current_score + cfg.solo_score_delta:
                        if self.rng.random() < cfg.solo_avoid_prob:
                            new_votes[voter] = cand
                            tally[target] -= 1
                            if tally[target] <= 0:
                                del tally[target]
                            tally[cand] += 1
                            self.log.info(
                                f"Soft consolidation: {voter.name} shifts from {target.name} to {cand.name}."
                            )
                            break

        # ----------------------------
        # Pass 3: avoid accidental plurality votes
        # ----------------------------
        tally = Counter(new_votes.values())
        active_vote_count = sum(tally.values())
        majority_needed = (active_vote_count // 2) + 1
        if active_vote_count >= 5 and tally:
            ordered_targets = sorted(
                tally,
                key=lambda p: (tally[p], p.name),
                reverse=True,
            )
            leader = ordered_targets[0]
            leader_count = tally[leader]
            runner_up_count = tally[ordered_targets[1]] if len(ordered_targets) > 1 else 0
            leader_pressure = max(
                (self._known_protection_pressure(voter, leader) for voter in pool),
                default=0.0,
            )

            if (
                leader_count < majority_needed
                and leader_count > runner_up_count
                and leader_pressure < 0.65
            ):
                movable_voters = [
                    voter for voter, target in list(new_votes.items())
                    if target is not leader
                    and tally.get(target, 0) <= runner_up_count
                    and not voter.left_tribal_no_vote
                    and voter.inventory.get("vote_blocked", 0) <= 0
                ]
                movable_voters.sort(
                    key=lambda voter: (
                        int(voter.strategy_level or 1) + int(voter.social_skill or 1),
                        self._rel(voter, leader),
                        voter.name,
                    ),
                    reverse=True,
                )

                for voter in movable_voters:
                    if tally[leader] >= majority_needed:
                        break
                    eligible = self._eligible_targets_for_voter(pool, restricted_targets, voter)
                    if leader not in eligible:
                        continue
                    target = new_votes.get(voter)
                    if target is None:
                        continue
                    scores = {t: _score_target_for_voter(voter, t) for t in eligible}
                    leader_score = scores.get(leader, float("inf"))
                    current_score = scores.get(target, float("inf"))
                    can_consolidate = (
                        leader_score <= current_score + cfg.plurality_consolidation_delta
                        or int(voter.social_skill or 1) >= 4
                        or int(voter.strategy_level or 1) >= 4
                    )
                    if can_consolidate and self.rng.random() < cfg.plurality_consolidation_prob:
                        new_votes[voter] = leader
                        tally[target] -= 1
                        if tally[target] <= 0:
                            del tally[target]
                        tally[leader] += 1
                        self.log.info(
                            f"Vote consolidation: {voter.name} shifts from {target.name} to {leader.name} to avoid an accidental plurality."
                        )

        return self._apply_advantage_vote_counterplay(pool, new_votes, restricted_targets)

    def _apply_advantage_vote_counterplay(
        self,
        pool: List[Player],
        votes: Dict[Player, Player],
        restricted_targets: Optional[List[Player]],
    ) -> Dict[Player, Player]:
        if not votes or len(pool) < 5:
            return votes

        adjusted = dict(votes)
        tally = Counter(adjusted.values())
        changed = False
        splits_used = 0
        max_splits = 2 if len(pool) >= 8 else 1

        for voter, target in list(adjusted.items()):
            if splits_used >= max_splits:
                break
            if voter.left_tribal_no_vote or voter.inventory.get("vote_blocked", 0) > 0:
                continue
            if int(voter.strategy_level or 1) < 5:
                continue
            pressure = self._known_protection_pressure(voter, target)
            target_vote_count = tally.get(target, 0)
            if pressure < 0.70 or target_vote_count < 4:
                continue
            high_certainty_split = pressure >= 0.85 and target_vote_count >= 5
            if not high_certainty_split and self.rng.random() >= self.config.advantage_split_prob:
                continue

            eligible = [
                candidate
                for candidate in self._eligible_targets_for_voter(pool, restricted_targets, voter)
                if candidate is not target
            ]
            if not eligible:
                continue

            scores = {candidate: _score_target_for_voter(voter, candidate) for candidate in eligible}
            current_score = _score_target_for_voter(voter, target)
            acceptable = [
                candidate
                for candidate in eligible
                if scores[candidate] <= current_score + (1.5 + 1.5 * pressure)
            ]
            if not acceptable:
                continue

            acceptable.sort(key=lambda candidate: (tally.get(candidate, 0), scores[candidate], candidate.name))
            alternate = acceptable[0]
            if tally.get(alternate, 0) >= tally.get(target, 0) - 1:
                continue

            adjusted[voter] = alternate
            tally[target] -= 1
            tally[alternate] += 1
            splits_used += 1
            changed = True
            self.log.info(
                f"Advantage counterplay: {voter.name} splits the vote onto {alternate.name} because {target.name} may have protection."
            )

        return adjusted if changed else votes

    def _maybe_show_alliances_for_tribal(self, pool: List[Player], title: str) -> None:
        try:
            key = (self.round_number, title or "Merged")
            if not hasattr(self, "_printed_alliance_snapshots"):
                self._printed_alliance_snapshots = set()
            if key in self._printed_alliance_snapshots:
                return
            self._printed_alliance_snapshots.add(key)
            self._print_alliances_snapshot(pool, title or "Merged")
        except Exception as e:
            self.log.warn(f"(Alliance snapshot error ignored): {e}")

    # ---------- idol sanity helpers ----------

    def _snapshot_protective_capacities(self, pool: List[Player]) -> Dict[Player, int]:
        caps: Dict[Player, int] = {}
        for p in pool:
            cap = 0
            cap += int(p.inventory.get(ADV_IDOL, 0))
            cap += int(p.inventory.get(ADV_5050, 0))
            cap += int(p.inventory.get(ADV_DOUBLE_IDOL, 0)) * 2
            if cap > 0:
                caps[p] = cap
        return caps

    def _sanitize_protective_immunity_targets(
        self,
        pool: List[Player],
        votes: Dict[Player, Player],
        idol_immune: Iterable[Player],
        protective_caps_before: Dict[Player, int],
    ) -> Tuple[Set[Player], List[str]]:
        """
        A protection target is only accepted if there exists a plausible holder
        with available protective capacity who did NOT vote for that target.
        """
        notes: List[str] = []
        remaining_caps = dict(protective_caps_before)
        valid_targets: Set[Player] = set()

        targets = list(dict.fromkeys(idol_immune))

        for target in targets:
            eligible_holders = [
                holder for holder, cap in remaining_caps.items()
                if cap > 0 and votes.get(holder) is not target
            ]
            if not eligible_holders:
                notes.append(
                    f"Sanity guard removed protection on {target.name} (no plausible non-contradictory holder)."
                )
                continue

            chosen_holder = target if target in eligible_holders else sorted(
                eligible_holders, key=lambda h: h.name
            )[0]

            remaining_caps[chosen_holder] -= 1
            valid_targets.add(target)

        return valid_targets, notes

    # ---------- tribal council ----------

    def tribal_council(self, pool: List[Player]) -> Player:
        self.events.emit("tribal_start", round=self.round_number, pool=pool[:])
        self._update_phase_weights()

        desired_k = self._contextual_vote_option_count(pool)

        scripted_nominees_names = self.scripted_nominees.get(self.round_number)
        if scripted_nominees_names:
            nominees: List[Player] = [
                p for p in self._names_to_players(scripted_nominees_names)
                if p in pool and not p.immune
            ]
        else:
            nominees = self._select_coalition_nominees(pool, desired_k)

        if len(nominees) < 2:
            nominees = self._ensure_two_targets(pool, cast(Any, nominees))

        pre_vote_inventory = self._snapshot_advantage_inventory(pool)
        self._pre_vote_advantages_phase(pool, cast(Any, nominees))
        self._mark_inventory_decreases_as_played(pre_vote_inventory, pool)

        scripted_votes = self.scripted_votes.get(self.round_number)
        if scripted_votes:
            votes: Dict[Player, Player] = {}
            by_name: Dict[str, Player] = {p.name: p for p in pool}
            by_id: Dict[str, Player] = {p.player_id: p for p in pool}

            for voter_key, target_key in scripted_votes.items():
                voter = by_id.get(voter_key) or by_name.get(voter_key)
                target = by_id.get(target_key) or by_name.get(target_key)

                if voter is None or target is None:
                    continue
                if target.immune or voter is target:
                    continue
                if nominees and target not in nominees:
                    continue
                if voter.left_tribal_no_vote:
                    continue

                votes[voter] = target
                voter.vote_target = target
                self.events.emit(
                    "vote_cast",
                    voter=voter,
                    target=target,
                    round=self.round_number,
                )

            missing_voters: List[Player] = [v for v in pool if v not in votes]
            if missing_voters:
                auto_votes = self._calculate_votes(
                    missing_voters,
                    restricted_targets=cast(Any, nominees if nominees else None),
                )
                votes.update(auto_votes)
        else:
            votes = self._calculate_votes(pool, restricted_targets=cast(Any, nominees))

        for voter, target in votes.items():
            self.log.info(f"{voter.name} -> {target.name}")

        self._record_votes_received_for_tribal(votes)
        original_vote_targets: Counter[Player] = Counter(votes.values())

        protective_caps_before = self._snapshot_protective_capacities(pool)
        idol_inventory_before = self._snapshot_advantage_inventory(pool)
        idol_immune_raw, play_notes = self.idol_policy.decide_idol_plays(
            self,
            cast(Any, pool),
            cast(Any, votes),
        )
        self._mark_inventory_decreases_as_played(idol_inventory_before, pool)
        idol_immune: List[Player] = idol_immune_raw

        protected_ids: Set[str] = {p.player_id for p in idol_immune}
        if protected_ids:
            for p in pool:
                had_protective = (
                    p.inventory.get(ADV_IDOL, 0) > 0
                    or p.inventory.get(ADV_SUPER_IDOL, 0) > 0
                    or p.inventory.get(ADV_DOUBLE_IDOL, 0) > 0
                    or p.inventory.get(ADV_5050, 0) > 0
                )
                if p.player_id in protected_ids or had_protective:
                    pass

        if play_notes:
            for note in play_notes:
                self.log.info(str(note))

        idol_immune_raw, sanity_notes = self._sanitize_protective_immunity_targets(
            pool=pool,
            votes=votes,
            idol_immune=cast(Any, idol_immune),
            protective_caps_before=protective_caps_before,
        )
        idol_immune = cast(List[Player], idol_immune_raw)

        for note in sanity_notes:
            self.log.warn(note)

        total_voided = 0
        if idol_immune:
            immune_set: Set[Player] = set(idol_immune)

            for voter, tgt in list(votes.items()):
                if tgt in immune_set:
                    total_voided += 1
                    del votes[voter]

        emergency_note: Optional[str] = None

        if not votes:
            eligible: List[Player] = [
                p for p in pool if p not in idol_immune and not p.immune
            ]

            names = " v ".join(p.name for p in eligible)
            self.log.info(f"\nOfficial revote: every vote was nullified.")
            self.log.info(f"Revote {names}")

            votes = {}
            for voter in pool:
                if voter.left_tribal_no_vote:
                    continue
                if voter.inventory.get("vote_blocked", 0) > 0:
                    continue
                voter_targets = [p for p in eligible if p is not voter]
                if not voter_targets:
                    continue
                target = self.voting_strategy.choose_target(cast(Any, voter), cast(Any, voter_targets))
                votes[voter] = target
                voter.vote_target = target
                self.events.emit(
                    "vote_cast",
                    voter=voter,
                    target=target,
                    round=self.round_number,
                )

            for voter, target in votes.items():
                self.log.info(f"{voter.name} -> {target.name}")

            self._record_votes_received_for_tribal(votes)
            emergency_note = "Official Revote"

        adjusted_tally: Counter[Player] = Counter(votes.values())

        forced = self.scripted_elimination.get(self.round_number)
        final_tally: Counter[Player] = adjusted_tally
        special_note: Optional[str] = None
        summary: Optional[str] = None
        eliminated: Optional[Player] = None

        if forced:
            by_name = {p.name: p for p in pool}
            by_id = {p.player_id: p for p in pool}
            forced_player = by_id.get(forced) or by_name.get(forced)

            if forced_player is not None and not forced_player.immune:
                eliminated = forced_player
                self.log.warn(
                    f"Scripted elimination overrides vote: {eliminated.name}"
                )
                final_tally = Counter(
                    {eliminated: max(1, adjusted_tally.get(eliminated, 1))}
                )
                special_note = "Scripted"
            else:
                self.log.warn("Scripted elimination invalid; falling back to votes.")
                forced = None

        if not forced:
            if not adjusted_tally:
                elig: List[Player] = [p for p in pool if not p.immune]
                elig = self._ensure_two_targets(pool, cast(Any, elig))
                eliminated = self.rng.choice(elig)
                final_tally = Counter({eliminated: 1})
                special_note = "Random Among Eligible"

                summary_notes: List[str] = []
                if emergency_note is not None:
                    summary_notes.append(emergency_note)
                summary_notes.append(special_note)
                    
                summary = _format_final_summary(
                    final_tally,
                    total_voided,
                    summary_notes,
                )
            else:
                max_votes = max(adjusted_tally.values())
                finalists: List[Player] = [
                    p for p, cnt in adjusted_tally.items() if cnt == max_votes
                ]

                if self.merged and len(pool) == 4 and len(finalists) >= 2:
                    eliminated = self._fire_making(finalists[:2])
                    final_tally = adjusted_tally
                    special_note = "Fire-Making"

                    summary_notes = []
                    if emergency_note is not None:
                        summary_notes.append(emergency_note)
                    summary_notes.append(special_note)

                    summary = _format_final_summary(
                        final_tally,
                        total_voided,
                        summary_notes,
                    )
                elif len(finalists) == 1:
                    eliminated = finalists[0]
                    final_tally = adjusted_tally

                    summary_notes = []
                    if emergency_note is not None:
                        summary_notes.append(emergency_note)

                    summary = _format_final_summary(
                        final_tally,
                        total_voided,
                        summary_notes,
                    )
                else:
                    resolved, tie_note, revote_tally = self.tiebreak_strategy.resolve_tie(
                        self,
                        cast(Any, pool),
                        cast(Any, finalists),
                    )
                    eliminated = resolved

                    initial_counts = sorted(
                        [adjusted_tally.get(p, 0) for p in finalists],
                        reverse=True,
                    )

                    if revote_tally is not None:
                        typed_revote_tally = revote_tally
                        revote_counts = sorted(typed_revote_tally.values(), reverse=True)

                        two_phase_notes: List[str] = []
                        if emergency_note is not None:
                            two_phase_notes.append(emergency_note)
                        if tie_note and tie_note != "Revote":
                            two_phase_notes.append(tie_note)

                        summary = _format_two_phase_summary(
                            initial_counts,
                            revote_counts,
                            total_voided,
                            two_phase_notes,
                        )
                        final_tally = typed_revote_tally
                    else:
                        final_tally = adjusted_tally

                        summary_notes = []
                        if emergency_note is not None:
                            summary_notes.append(emergency_note)
                        if tie_note:
                            summary_notes.append(tie_note)

                        summary = _format_final_summary(
                            final_tally,
                            total_voided,
                            summary_notes,
                        )

        if eliminated is None:
            elig = [p for p in pool if not p.immune]
            elig = self._ensure_two_targets(pool, cast(Any, elig))
            eliminated = self.rng.choice(elig)
            final_tally = Counter({eliminated: 1})
            special_note = "Random Among Eligible"

            summary_notes = []
            if emergency_note is not None:
                summary_notes.append(emergency_note)
            summary_notes.append(special_note)
                
            summary = _format_final_summary(
                final_tally,
                total_voided,
                summary_notes,
            )

        eliminated_player: Player = eliminated

        if (
            len(self.players) >= 5
            and eliminated_player.inventory.get(ADV_SUPER_IDOL, 0) > 0
        ):
            eliminated_player.take_one(ADV_SUPER_IDOL)
            self._mark_held_advantage_copies_played(eliminated_player, ADV_SUPER_IDOL, 1)
            self.log.info(
                f"\n{eliminated_player.name} plays a Super Idol AFTER the votes are read!"
            )

            without_elim: Counter[Player] = Counter(final_tally)
            if eliminated_player in without_elim:
                del without_elim[eliminated_player]

            if without_elim:
                next_max = max(without_elim.values())
                contenders: List[Player] = [
                    p for p, c in without_elim.items() if c == next_max
                ]

                if len(contenders) == 1:
                    eliminated_player = contenders[0]
                    self.log.info(
                        f"Super Idol forces elimination to shift to {eliminated_player.name}."
                    )
                else:
                    resolved, tie_note, revote_tally = self.tiebreak_strategy.resolve_tie(
                        self,
                        cast(Any, pool),
                        cast(Any, contenders),
                    )
                    eliminated_player = resolved
                    self.log.info(
                        f"Super Idol caused new tie; resolved via {tie_note}. Eliminated: {eliminated_player.name}"
                    )
            else:
                elig = [
                    p for p in pool
                    if not p.immune and p is not eliminated_player
                ]
                if elig:
                    saved_player = eliminated_player
                    eliminated_player = self.rng.choice(elig)
                    self.log.info(
                        f"Super Idol saved {saved_player.name}; random elimination becomes {eliminated_player.name}."
                    )

        for voter, target in votes.items():
            if target is eliminated_player:
                if voter.strategy_level >= 4:
                    voter.threat_level += self.config.correct_vote_threat_gain_high_strat
                else:
                    voter.threat_level += 1
            else:
                voter.threat_level -= 1

        if eliminated_player.inventory.get(ADV_LEGACY, 0) > 0:
            eliminated_player.take_one(ADV_LEGACY)
            others = [p for p in self.players if p is not eliminated_player]

            if others:
                tgt = self.rng.choice(others)
                tgt.give(ADV_LEGACY, 1)
                self._bequeath_held_advantage_copy(eliminated_player, tgt, ADV_LEGACY)
                self.log.info(
                    f"{eliminated_player.name} wills the Legacy Advantage to {tgt.name}."
                )

        if summary is None:
            summary = _format_final_summary(final_tally, total_voided, [])

        self._commit_votes_received_for_tribal()
        self._mark_vote_participation(votes, eliminated_player)

        self.players.remove(eliminated_player)

        for tribe in self.tribes:
            if eliminated_player in tribe:
                tribe.remove(eliminated_player)

        self._ensure_player_stat_row(eliminated_player)
        self.eliminated_players.append(eliminated_player)
        self.boot_log.append(eliminated_player)

        if eliminated_player in self.players:
            self.players.remove(eliminated_player)

        self.log.info(f"\n{eliminated_player.name} has been eliminated {summary}")

        self.events.emit(
            "eliminated",
            round=self.round_number,
            player=eliminated_player,
            final_tally=final_tally.copy(),
            original_vote_targets=original_vote_targets.copy(),
            nullified_targets=list(idol_immune),
        )

        self._apply_voting_alignment_effects(pool, votes)
        self._relationship_drift()

        if self.is_merge_vote:
            self.is_merge_vote = False

        self._assert_roster_integrity()
        return eliminated_player
    def _ensure_two_targets(self, pool: List[Player], restricted_targets: Optional[List[Player]]) -> List[Player]:
        if restricted_targets is None:
            elig = [p for p in pool if not p.immune]
        else:
            elig = [p for p in restricted_targets if not p.immune]
        if len(elig) >= 2:
            return elig
        extra = [p for p in pool if not p.immune and p not in elig]
        extra.sort(key=lambda x: x.threat_level, reverse=True)
        while len(elig) < 2 and extra:
            elig.append(extra.pop(0))
        return elig

    def _calculate_votes(self, pool: List[Player], restricted_targets: Optional[List[Player]] = None) -> Dict[Player, Player]:
        votes: Dict[Player, Player] = {}
        elig_seed = self._ensure_two_targets(pool, cast(Any, restricted_targets))
        for voter in pool:
            if voter.left_tribal_no_vote:
                continue
            if voter.inventory.get("vote_blocked", 0) > 0:
                continue
            eligible: List[Player] = [p for p in elig_seed if p is not voter]
            if len(eligible) < 2:
                pool_extras: List[Player] = [
                    p for p in pool if p not in eligible and not p.immune and p is not voter]
                pool_extras.sort(key=lambda x: x.threat_level, reverse=True)
                if pool_extras:
                    eligible.append(pool_extras[0])
            if not eligible:
                continue

            target = self.voting_strategy.choose_target(cast(Any, voter), cast(Any, eligible))
            votes[voter] = target
            voter.vote_target = target
            self.events.emit("vote_cast", voter=voter,
                             target=target, round=self.round_number)

        for p in pool:
            p.inventory["vote_blocked"] = 0
            p.inventory["extra_ballots"] = 0

        return self._alignment_vote_adjustment(pool, votes, restricted_targets)

    def _pre_vote_advantages_phase(self, pool: List[Player], nominees: List[Player]) -> None:
        for p in pool:
            if p.inventory.get(ADV_SAFETY, 0) > 0 and len(self.players) <= 10 and not p.immune:
                if p in nominees or self.rng.random() < 0.10:
                    p.take_one(ADV_SAFETY)
                    p.left_tribal_no_vote = True
                    p.immune = True
                    self.log.info(
                        f"{p.name} plays Safety Without Power â€” leaves Tribal (no vote, cannot be voted against).")

        for p in pool:
            if p.inventory.get(ADV_EXTRA_VOTE, 0) > 0 and len(self.players) <= 6:
                if self.rng.random() < 0.50:
                    p.take_one(ADV_EXTRA_VOTE)
                    p.inventory["extra_ballots"] += 1
                    self.log.info(f"{p.name} uses Extra Vote (2 ballots).")

            if p.inventory.get(ADV_VOTE_BLOCK, 0) > 0 and len(self.players) <= 6:
                possible = [
                    x for x in pool if x is not p and not x.left_tribal_no_vote and not x.immune]
                if possible:
                    target = self.rng.choice(possible)
                    p.take_one(ADV_VOTE_BLOCK)
                    target.inventory["vote_blocked"] += 1
                    self.log.info(
                        f"{p.name} plays Vote Block on {target.name}.")

            if p.inventory.get(ADV_VOTE_STEAL, 0) > 0 and len(self.players) <= 6:
                victims = [x for x in pool if x is not p and not x.left_tribal_no_vote and x.inventory.get(
                    "vote_blocked", 0) == 0]
                if victims and self.rng.random() < 0.35:
                    target = self.rng.choice(victims)
                    p.take_one(ADV_VOTE_STEAL)
                    target.inventory["vote_blocked"] += 1
                    p.inventory["extra_ballots"] += 1
                    self.log.info(
                        f"{p.name} plays Vote Steal on {target.name} (target loses vote; {p.name} +1 ballot).")

        for p in pool:
            if p.inventory.get(ADV_KIP, 0) > 0 and len(self.players) <= 6:
                targets: List[Player] = [
                    x for x in pool if x is not p and not x.left_tribal_no_vote]
                if not targets:
                    continue
                known_target, ask_kind = self._known_kip_target(p, targets)
                tgt = known_target or self.rng.choice(targets)
                if known_target is None:
                    ask_kind = "idol" if self.rng.random() < 0.6 else "advantage"

                p.take_one(ADV_KIP)
                if ask_kind == "idol":
                    stolen = self._transfer_kip_award(p, tgt, KIP_IDOL_ASK_TYPES)
                    if stolen is not None:
                        self.log.info(
                            f"{p.name} plays Knowledge Is Power on {tgt.name} (asks for Idol) - SUCCESS, transfers {stolen}."
                        )
                    else:
                        self.log.info(
                            f"{p.name} plays Knowledge Is Power on {tgt.name} (asks for Idol) - misses."
                        )
                    continue
                candidates = [
                    adv for adv, ct in tgt.inventory.items()
                    if ct > 0 and adv not in KIP_ADVANTAGE_ASK_EXCLUSIONS
                ]
                stolen = self._transfer_kip_award(p, tgt, candidates)
                if stolen is not None:
                    self.log.info(
                        f"{p.name} plays Knowledge Is Power on {tgt.name} (asks for Advantage) - {stolen} transferred."
                    )
                else:
                    self.log.info(
                        f"{p.name} plays Knowledge Is Power on {tgt.name} (asks for Advantage) - misses."
                    )
                continue

    def _apply_voting_alignment_effects(self, pool: List[Player], votes: Dict[Player, Player]) -> None:
        clamp_min = self.config.relationship_min
        clamp_max = self.config.relationship_max

        by_target: Dict[Player, List[Player]] = {}
        for voter, target in votes.items():
            by_target.setdefault(target, []).append(voter)

        voters = list(votes.keys())

        for group in by_target.values():
            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    a, b = group[i], group[j]
                    bonus = self.config.alignment_bonus_for_strategists if (
                        a.strategy_level >= 4 or b.strategy_level >= 4) else 0
                    delta = 2 + bonus
                    a.update_relationship(b, +delta)
                    b.update_relationship(a, +delta)
                    a.clamp_relationship(b, clamp_min, clamp_max)
                    b.clamp_relationship(a, clamp_min, clamp_max)

        for i in range(len(voters)):
            for j in range(i + 1, len(voters)):
                a, b = voters[i], voters[j]
                if votes[a] is not votes[b]:
                    a.update_relationship(b, -2)
                    b.update_relationship(a, -2)
                    a.clamp_relationship(b, clamp_min, clamp_max)
                    b.clamp_relationship(a, clamp_min, clamp_max)

        for voter, target in votes.items():
            backlash = -3 if target in self.eliminated_players else -2
            target.update_relationship(voter, backlash)
            voter.update_relationship(target, -1)
            target.clamp_relationship(voter, clamp_min, clamp_max)
            voter.clamp_relationship(target, clamp_min, clamp_max)

    def _fire_making(self, contenders: List[Player]) -> Player:
        perf = {p: p.challenge_ability *
                self.rng.randint(1, 6) for p in contenders}
        sorted_perf = sorted(perf.items(), key=lambda kv: kv[1], reverse=True)
        winner = sorted_perf[0][0]
        loser = [p for p in contenders if p is not winner][0]
        winner.threat_level += 2
        self._ensure_player_stat_row(winner)
        self.player_season_stats[winner.player_id]["immunity_wins"] += 1
        self.log.info(
            f"Fire-making result: {winner.name} wins; {loser.name} loses.")
        return loser

    # ---------- pacing ----------

    def _pause_for_next_episode(self, next_episode_number: int) -> None:
        print("\n" + "-" * 60)
        print(f"Ready for Episode {next_episode_number}?")
        print("Press SPACE then Enter to continue, or 'q' then Enter to quit.")
        while True:
            try:
                resp = input("> ").strip().lower()
            except EOFError:
                return
            if resp == "q":
                self.log.info("User quit the simulation.")
                raise SystemExit(0)
            if resp == "" or resp == " ":
                return
            print("Please press SPACE + Enter to continue, or 'q' + Enter to quit.")

    # ---------- round / game ----------

    def _apply_planned_idol_finds_for_current_round(self) -> None:
        names = self.plan.idol_finds_by_round.get(self.round_number, [])
        if not names:
            return
        for p in self._names_to_players(names):
            p.give(ADV_IDOL, 1)
            self._mark_advantage_found(p, ADV_IDOL, 1)
            self.log.info(
                f"{p.name} receives a planned idol (round {self.round_number}).")

    def run_round(self) -> None:
        total_players = len(self.players)

        if hasattr(self, "_printed_alliance_snapshots"):
            self._printed_alliance_snapshots.clear()

        self._seed_advantages_for_current_player_count()
        self._apply_planned_idol_finds_for_current_round()
        self._run_hidden_advantage_search(
            locations={"random", "camp", "tribe_beach", "merge_camp", "exile"},
        )
        self._maybe_share_advantage_knowledge()

        if not self.merged and self._needs_emergency_rebalance():
            if len(self.players) <= self.finalists_count + 7:
                self._perform_swap(num_teams=1, trigger_left=total_players)
            else:
                self.log.warn("Emergency swap executed.")
                self._perform_swap(num_teams=2, trigger_left=total_players)

        if (not self.merged) or (self.merged and self.plan.swap_plan):
            if total_players in self.swap_triggers_remaining_counts:
                self.swap_triggers_remaining_counts.remove(total_players)
                requested_teams = self.swap_teams_by_trigger.get(total_players, 2)
                self._perform_swap(
                    num_teams=requested_teams,
                    trigger_left=total_players,
                )

        if not self.merged:
            if self.plan.merge_lock:
                if len(self.players) == self.merge_at_remaining:
                    self._perform_swap(num_teams=1, trigger_left=len(self.players))
            else:
                if len(self.players) <= self.merge_at_remaining:
                    self._perform_swap(num_teams=1, trigger_left=len(self.players))

        if self.plan.enable_battleback and self.battleback_points:
            cur = len(self.players)
            if cur in self.battleback_points and cur not in self.battleback_fired:
                self._run_battleback()
                self.battleback_fired.add(cur)
                total_players = len(self.players)

        if (
            self.plan.enable_demerge
            and self.plan.demerge_at_remaining is not None
            and self.merged
            and len(self.players) == self.plan.demerge_at_remaining
            and not self.demerge_done
        ):
            self._run_demerge_round()
            self.round_number += 1
            self.episode_number += 1
            self._expire_idols_if_needed()
            return

        self._log_idol_holders()
        self._maybe_reward_challenge()

        scripted_winners = self.scripted_immunity.get(self.round_number, [])

        if not self.merged:
            losing_tribe = self.challenge_system.premerge_team_challenge(cast(Any, self))

            winning_tribes: List[List[Player]] = [tribe for tribe in self.tribes if tribe is not losing_tribe]

            winner_labels: List[str] = [self.tribe_names[self.tribes.index(tribe)] for tribe in winning_tribes]

            losing_label = self.tribe_names[self.tribes.index(losing_tribe)]

            if winner_labels:
                self.log.info(
                    f"\nEpisode {self.episode_number}: {', '.join(winner_labels)} win immunity"
                )
            else:
                self.log.info(
                    f"\nEpisode {self.episode_number}: No tribe wins immunity"
                )

            self._run_hidden_advantage_search(
                locations={"challenge", "sit_out_bench"},
            )

            for tribe in self.tribes:
                label = self.tribe_names[self.tribes.index(tribe)]
                self._maybe_show_alliances_for_tribal(tribe, label)

            self.log.info(f"\n{losing_label} Tribal")

            if scripted_winners:
                by_name: Dict[str, Player] = {p.name: p for p in losing_tribe}
                by_id: Dict[str, Player] = {p.player_id: p for p in losing_tribe}
                forced: List[Player] = []

                for key in scripted_winners:
                    pl = by_id.get(key) or by_name.get(key)
                    if pl is not None:
                        forced.append(pl)

                for p in forced:
                    p.immune = True

                if forced:
                    self.log.warn(
                        f"Scripted immunity applied: {[p.name for p in forced]}"
                    )

            self.update_threat_levels()
            self.tribal_council(cast(Any, losing_tribe))
            self._run_and_log_round_predictions(
                context_label=f"Tribal Council ({losing_label})"
            )

        else:
            winners: List[Player] = []

            if scripted_winners:
                by_name = {p.name: p for p in self.players}
                by_id = {p.player_id: p for p in self.players}

                for key in scripted_winners:
                    winner = by_id.get(key) or by_name.get(key)
                    if winner is not None:
                        winners.append(winner)

                for winner in winners:
                    winner.immune = True
                    winner.threat_level += 2
            else:
                winners = self.challenge_system.postmerge_individual_challenge(
                        cast(Any, self),
                        self.config.postmerge_winners_per_round,
                    )

            if winners:
                self._mark_immunity_win(winners)
                self.log.info(
                    f"\nEpisode {self.episode_number}: {winners[0].name} wins immunity"
                )
            else:
                self.log.info(
                    f"\nEpisode {self.episode_number}: No immunity winner"
                )

            self._run_hidden_advantage_search(
                locations={"challenge", "sit_out_bench"},
            )

            self._maybe_show_alliances_for_tribal(
                self.players,
                self.merge_color or "Merged",
            )
            self.log.info(f"\nMerge Tribal ({self.merge_color})")

            self.update_threat_levels()
            self.tribal_council(cast(Any, self.players))
            self._run_and_log_round_predictions(
                context_label=f"Merge Tribal ({self.merge_color or 'Merged'})"
            )

        self.round_number += 1
        self.episode_number += 1
        self._expire_idols_if_needed()

    # ---------- finale ----------
    def _run_final_episode_f3(self) -> None:
        self._seed_advantages_for_current_player_count()
        self._run_hidden_advantage_search(
            locations={"random", "camp", "merge_camp"},
        )
        self._maybe_share_advantage_knowledge()
        self.log.info(f"\nEpisode {self.episode_number}: Finale")
        self._log_idol_holders()

        if len(self.players) == 5:
            winners = self.challenge_system.postmerge_individual_challenge(self, 1)
            if winners:
                self._mark_immunity_win(cast(Any, winners))
                self.log.info(f"\n{winners[0].name} wins immunity")
            self._maybe_draw_alliance_graph(
                self.players[:], title="Final 5", save_name="alliances_finale_F5.png")
            self.update_threat_levels()
            self.tribal_council(self.players)
            self._expire_idols_if_needed()

        if len(self.players) == 4:
            winners = self.challenge_system.postmerge_individual_challenge(self, 1)
            if winners:
                self._mark_immunity_win(cast(Any, winners))
                self.log.info(f"\n{winners[0].name} wins immunity")
            self._maybe_draw_alliance_graph(
                self.players[:], title="Final 4", save_name="alliances_finale_F4.png")
            self.update_threat_levels()
            self.tribal_council(self.players)

        if len(self.players) == 3:
            self.final_tribal_council()

        self.episode_number += 1
    
    
    def _run_final_episode_f2(self) -> None:
        self._seed_advantages_for_current_player_count()
        self._run_hidden_advantage_search(
            locations={"random", "camp", "merge_camp"},
        )
        self._maybe_share_advantage_knowledge()
        self.log.info(f"\nEpisode {self.episode_number}: Finale")
        self._log_idol_holders()

        if len(self.players) == 4:
            winners = self.challenge_system.postmerge_individual_challenge(cast(Any, self), 1)

            if winners:
                winner = winners[0]
                self._mark_immunity_win(cast(Any, winners))
                self.log.info(f"\n{winner.name} wins immunity")

            self._maybe_draw_alliance_graph(
                self.players[:],
                title="Final 4",
                save_name="alliances_finale_F4.png",
            )
            self.update_threat_levels()
            self.tribal_council(cast(Any, self.players))

        if len(self.players) == 3:
            winners = self.challenge_system.postmerge_individual_challenge(cast(Any, self), 1)
            
            if winners:
                self._mark_immunity_win(cast(Any, winners))

                winner = winners[0]
                self.log.info(f"\n{winner.name} wins immunity")

                self._maybe_draw_alliance_graph(
                    self.players[:],
                    title="Final 3 (F2 path)",
                    save_name="alliances_finale_F3.png",
                )

                others: List[Player] = []
                for p in self.players:
                    if p.player_id != winner.player_id:
                        others.append(p)

                target = self._choose_final_two_boot(winner, others)
              

                self.log.info(f"{winner.name} -> {target.name}")
                winner.threat_level += 1

                final_tally: Counter[Player] = Counter({target: 1})
                summary = _format_final_summary(final_tally, 0, [])

                self.players.remove(cast(Any, target))

                for tribe in self.tribes:
                    if any(p.player_id == target.player_id for p in tribe):
                        tribe[:] = [p for p in tribe if p.player_id != target.player_id]

                self._ensure_player_stat_row(cast(Any, target))
                self.eliminated_players.append(cast(Any, target))
                self.boot_log.append(cast(Any, target))

                self.log.info(f"\n{target.name} has been eliminated {summary}")

                for p in self.players:
                    p.immune = False

        if len(self.players) == 2:
            self._maybe_draw_alliance_graph(
                self.players[:],
                title="Final 2",
                save_name="alliances_finale_F2.png",
            )
            self.final_tribal_council()

        self.episode_number += 1

    def _choose_final_two_boot(self, immunity_winner: Player, options: List[Player]) -> Player:
        """At Final 3, cut the finalist most likely to beat the immunity winner."""
        if len(options) <= 1:
            return options[0]

        jurors = self._compute_jury_from_boot_log()

        def projected_votes(candidate: Player) -> Tuple[int, float, float]:
            if jurors:
                votes = 0
                for juror in jurors:
                    choice = self._jury_vote_for(juror, [immunity_winner, candidate])
                    if choice.player_id == candidate.player_id:
                        votes += 1
                return (
                    votes,
                    float(candidate.threat_level),
                    float(sum(j.relationships.get(candidate, 0) for j in jurors)),
                )
            return (
                0,
                float(candidate.threat_level),
                float(immunity_winner.relationships.get(candidate, 0)),
            )

        return max(options, key=projected_votes)
    
    # ---------- rollout finale helpers ----------

    def _run_final_episode_f3_return_winner(self) -> Optional[Player]:
        if len(self.players) == 5:
            self.challenge_system.postmerge_individual_challenge(self, 1)
            self.update_threat_levels()
            self.tribal_council(self.players)

        if len(self.players) == 4:
            self.challenge_system.postmerge_individual_challenge(self, 1)
            self.update_threat_levels()
            self.tribal_council(self.players)

        if len(self.players) == 3:
            return self.final_tribal_council()

        return self.players[0] if len(self.players) == 1 else None

    def _run_final_episode_f2_return_winner(self) -> Optional[Player]:
        if len(self.players) == 4:
            self.challenge_system.postmerge_individual_challenge(cast(Any, self), 1)
            self.update_threat_levels()
            self.tribal_council(cast(Any, self.players))

        if len(self.players) == 3:
            winners = self.challenge_system.postmerge_individual_challenge(cast(Any, self), 1)

            if winners:
                winner = winners[0]

                others: List[Player] = [
                    p for p in self.players if p.player_id != winner.player_id
                ]

                if others:
                    target = self._choose_final_two_boot(winner, others)

                    self.players[:] = [
                        p for p in self.players if p.player_id != target.player_id
                    ]

                    self.eliminated_players.append(cast(Any, target))
                    self.boot_log.append(cast(Any, target))

        if len(self.players) == 2:
            return self.final_tribal_council()

        return self.players[0] if len(self.players) == 1 else None

    # ---------- final cast ranking / postseason evaluation ----------

    def _build_final_cast_ranking(self) -> List[EndgamePlayerEvaluation]:
        """
        Combines:
        - Monte Carlo forecast metrics
        - actual season resume metrics
        - actual placement
        into one final cast ranking.
        """
        everyone = self.players + self.eliminated_players

        # Use the latest forecast if available; otherwise compute one final forecast
        if self.latest_round_prediction is None and len(self.players) >= 1 and self.config.prediction_enabled:
            try:
                self.latest_round_prediction = self._compute_round_predictions()
            except Exception:
                self.latest_round_prediction = RoundPredictionSummary(
                    round_number=self.round_number,
                    player_rows=[],
                )

        prediction_by_id: Dict[str, PlayerPredictionAggregate] = {}
        for hist in self.round_prediction_history:
            for row in hist.player_rows:
                # Keep the most recent row seen for each player
                prediction_by_id[row.player_id] = row

        if self.latest_round_prediction is not None:
            for row in self.latest_round_prediction.player_rows:
                prediction_by_id[row.player_id] = row

        evaluations: List[EndgamePlayerEvaluation] = []
        for p in everyone:
            self._ensure_player_stat_row(p)
            stats = self.player_season_stats.get(p.player_id, {})
            pred = prediction_by_id.get(
                p.player_id,
                PlayerPredictionAggregate(player_id=p.player_id, name=p.name),
            )

            ev = EndgamePlayerEvaluation(
                player_id=p.player_id,
                name=p.name,
                actual_placement=stats.get("actual_placement"),
                avg_sim_placement=pred.avg_placement,
                win_chance_pct=pred.win_chance_pct,
                survival_chance_pct=pred.survival_chance_pct,
                combined_pct=pred.combined_pct,
                immunity_wins=int(stats.get("immunity_wins", 0)),
                tribals_survived=int(stats.get("tribals_survived", 0)),
                correct_votes=int(stats.get("correct_votes", 0)),
                total_votes_cast=int(stats.get("total_votes_cast", 0)),
                votes_received=int(stats.get("votes_received", 0)),
                idols_found=int(stats.get("idols_found", 0)),
                idols_played=int(stats.get("idols_played", 0)),
                advantages_found=int(stats.get("advantages_found", 0)),
                return_count=int(stats.get("return_count", 0)),
            )
            evaluations.append(ev)

        evaluations.sort(
            key=lambda e: (
                e.resume_score,
                e.combined_pct,
                e.win_chance_pct,
                e.survival_chance_pct,
                -e.avg_sim_placement,
                -(9999 if e.actual_placement is None else e.actual_placement),
                e.name,
            ),
            reverse=True,
        )
        return evaluations

    def _format_final_cast_ranking(self, rows: List[EndgamePlayerEvaluation]) -> str:
        if not rows:
            return "\nFinal Cast Ranking\n(no players)\n"

        name_w = max(12, max(len(r.name) for r in rows))
        lines: List[str] = []
        lines.append("")
        lines.append("Final Full-Cast Ranking")
        lines.append(
            f"{'Rank':<4}  {'Player':<{name_w}}  {'Score':>7}  {'Place':>5}  {'Win%':>7}  {'Final%':>8}  {'Avg%':>7}  {'AvgPlace':>9}"
        )
        lines.append("-" * (4 + 2 + name_w + 2 + 7 + 2 +
                     5 + 2 + 7 + 2 + 8 + 2 + 7 + 2 + 9))

        for idx, row in enumerate(rows, start=1):
            place_str = str(
                row.actual_placement) if row.actual_placement is not None else "-"
            lines.append(
                f"{idx:<4}  "
                f"{row.name:<{name_w}}  "
                f"{row.resume_score:>7.2f}  "
                f"{place_str:>5}  "
                f"{row.win_chance_pct:>6.1f}%  "
                f"{row.survival_chance_pct:>7.1f}%  "
                f"{row.combined_pct:>6.1f}%  "
                f"{row.avg_sim_placement:>9.2f}"
            )

        lines.append("")
        lines.append("Legend:")
        lines.append(
            "Win% = chance to win the season in the rollout simulations")
        lines.append(
            "Final% = chance to reach the finals in the rollout simulations")
        lines.append("Avg% = average of Win% and Final%")
        lines.append(
            "AvgPlace = average placement across the rollout simulations")
        return "\n".join(lines)

    def _print_final_cast_ranking(self) -> None:
        self._finalize_actual_placements()
        rows = self._build_final_cast_ranking()
        self.log.info(self._format_final_cast_ranking(rows))

    # ---------- save memory ----------

    def save_social_memory(self) -> None:
        if not self.config.save_social_memory_at_end:
            return
        everyone_seen = self.players + self.eliminated_players
        self.social_memory.update_from_players(
            everyone_seen,
            rel_clamp_min=self.config.relationship_memory_clamp_min,
            rel_clamp_max=self.config.relationship_memory_clamp_max,
            threat_clamp_min=self.config.threat_memory_clamp_min,
            threat_clamp_max=self.config.threat_memory_clamp_max,
        )
        self.social_memory.save()
        self.log.info(
            f"Saved social memory to {self.config.social_memory_file}")

    def run_game(self, num_tribes: Optional[int] = None, tribe_labels: Optional[List[str]] = None) -> None:
        self.log.info("\nStarting Survivor Season...")
        self.initialize_relationships()

        if num_tribes is None and not self.plan.starting_tribes:
            num_tribes = self._choose_starting_tribe_count(
                self.starting_player_count)
        elif self.plan.starting_tribes:
            num_tribes = len(self.plan.starting_tribes)
        assert num_tribes is not None

        if self.starting_player_count % num_tribes != 0 and not self.plan.starting_tribes:
            self.log.warn(
                f"Requested num_tribes={num_tribes} doesn't evenly split {self.starting_player_count}. Choosing a valid split."
            )
            num_tribes = self._choose_starting_tribe_count(
                self.starting_player_count)

        self.split_into_tribes(num_tribes, labels=tribe_labels)

        self.vote_option_count_plan: deque[int] = deque(
            self._plan_vote_option_counts(
                self.config.preplan_nominee_queue_len)
        )

        finale_gate = 5 if self.finalists_count == 3 else 4
        while len(self.players) > finale_gate:
            self.run_round()
            self._pause_for_next_episode(self.episode_number)

        self._pause_for_next_episode(self.episode_number)
        if self.finalists_count == 3:
            self._run_final_episode_f3()
        else:
            self._run_final_episode_f2()

        self._print_final_prediction_snapshot()
        self._print_final_cast_ranking()
        self.save_social_memory()

    # ---------- jury ----------

    def _compute_jury_from_boot_log(self) -> List[Player]:
        target = max(0, int(self.jury_size))
        jurors: List[Player] = []
        seen_ids: Set[str] = set()
        active_ids: Set[str] = {p.player_id for p in self.players}

        for p in reversed(self.boot_log):
            if p.player_id in active_ids:
                continue
            if p.player_id not in seen_ids:
                seen_ids.add(p.player_id)
                jurors.append(p)
                if len(jurors) == target:
                    break

        jurors.reverse()
        return jurors

    def _jury_vote_for(self, juror: Player, finalists: List[Player]) -> Player:
        w_thr = 0.01 + 0.075 * (juror.strategy_level - 1) + 0.1
        w_rel = 1.0 - w_thr
        scored = {
            f: w_rel * juror.relationships.get(f, 0) + w_thr * f.threat_level
            for f in finalists
        }
        items = list(scored.items())
        self.rng.shuffle(items)
        items.sort(key=lambda kv: kv[1], reverse=True)
        return items[0][0]

    def final_tribal_council(self) -> Player:
        self.jury = self._compute_jury_from_boot_log()
        self.log.info(
            f"\nJury size set to {len(self.jury)} (target {self.jury_size})")

        finalists = self.players[:]
        header = " v ".join(p.name for p in finalists)
        self.log.info(f"\nFinal Tribal {header}")

        votes_for: Dict[Player, int] = {f: 0 for f in finalists}
        for juror in self.jury:
            choice = self._jury_vote_for(juror, finalists)
            votes_for[choice] += 1
            self.log.info(f"{juror.name} -> {choice.name}")

        top = max(votes_for.values()) if votes_for else 0
        contenders = [f for f, cnt in votes_for.items() if cnt == top]

        if len(finalists) == 2:
            if len(contenders) > 1:
                a, b = contenders
                sum_rel_a = sum(j.relationships.get(a, 0) for j in self.jury)
                sum_rel_b = sum(j.relationships.get(b, 0) for j in self.jury)
                winner = a if sum_rel_a >= sum_rel_b else b
            else:
                winner = contenders[0] if contenders else finalists[0]
        else:
            if len(contenders) == 2:
                third = [f for f in finalists if f not in contenders][0]
                decider_choice = self._jury_vote_for(third, contenders)
                votes_for[decider_choice] += 1
                self.log.info(
                    f"\n{third.name} (finalist) casts deciding vote -> {decider_choice.name}")
                top = max(votes_for.values())
                contenders = [f for f, cnt in votes_for.items() if cnt == top]
            winner = contenders[0] if contenders else finalists[0]

        final_tally = Counter(votes_for)
        counts = _counts_for_summary(final_tally)
        tally_str = "(" + "-".join(counts) + ")" if counts else "(none)"

        self._actual_winner_id = winner.player_id
        self.log.info(f"\nThe Sole Survivor is {winner.name} {tally_str}")
        return winner

    def _print_final_prediction_snapshot(self) -> None:
        if not self.config.prediction_enabled:
            return
        if len(self.players) <= 0:
            return
        summary = self._compute_round_predictions()
        self.latest_round_prediction = summary
        self.round_prediction_history.append(summary)
        self.log.info(
            self._format_prediction_chart(
                summary.player_rows,
                f"Final Monte Carlo Forecast ({self.config.prediction_rollouts} rollouts)"
            )
        )


# ----------------------------
# Centralized Cast Definition Helpers
# ----------------------------

@dataclass(frozen=True)
class CastMember:
    name: str
    player_id: str
    tribe: Optional[int] = None


def build_players_from_cast(cast: List[CastMember]) -> List[Player]:
    return [Player(name=cm.name, player_id=cm.player_id) for cm in cast]


def build_player_names_from_cast(cast: List[CastMember]) -> List[str]:
    return [cm.name for cm in cast]


def build_starting_tribes_from_cast(cast: List[CastMember]) -> List[List[str]]:
    grouped: Dict[int, List[str]] = defaultdict(list)
    for cm in cast:
        if cm.tribe is None:
            raise ValueError(
                f"Cast member {cm.name} is missing a tribe assignment.")
        grouped[int(cm.tribe)].append(cm.player_id)

    tribe_indices = sorted(grouped.keys())
    return [grouped[i] for i in tribe_indices]


# ----------------------------
# Example Usage
# ----------------------------

if __name__ == "__main__":
    CAST: List[CastMember] = [
        CastMember(name="Kitty Powers", player_id="kitty_powers", tribe=1),
        CastMember(name="Serena Williams", player_id="serena_williams", tribe=1),
        CastMember(name="Dee", player_id="dee", tribe=1),
        CastMember(name="Q", player_id="q", tribe=1),
        CastMember(name="TJ Klune", player_id="tj_klune", tribe=1),
        CastMember(name="Spongebob", player_id="spongebob", tribe=1),
        CastMember(name="Peeta", player_id="peeta", tribe=1),

        CastMember(name="Wendy Williams", player_id="wendy_williams", tribe=2),
        CastMember(name="Pinkie Pie", player_id="pinkie_pie", tribe=2),
        CastMember(name="Holly", player_id="holly", tribe=2),
        CastMember(name="Lizzie", player_id="lizzie", tribe=2),
        CastMember(name="Forest", player_id="forest", tribe=2),
        CastMember(name="Balloony", player_id="balloony", tribe=2),
        CastMember(name="Tom Holland", player_id="tom_holland", tribe=2),
    ]

    players = build_players_from_cast(CAST)

    plan = SeasonPlan(
        finalists_count=2,
        jury_size=7,
        merge_at_remaining=9,
        merge_lock=True,
        swap_plan=[(12, 3)],
        starting_tribes=build_starting_tribes_from_cast(CAST),
        enable_demerge=False,
        demerge_at_remaining=12,
        enable_battleback=False,
        battleback_points=[],
        preset_relationships=[],
    )

    cfg = GameConfig(
        logfile="logs/survivor_log.txt",
        log_level=LOG_INFO,
        ascii_alliance_graph=True,
        ascii_graph_top_edges=100,
        ascii_graph_min_weight=-100,
        ensure_traversable_graph=False,

        alliances_use_interest=False,

        social_memory_file="data/social_memory.json",
        use_social_memory=True,

        relationship_memory_mode="blend",
        relationship_memory_blend_weight=0.15,
        threat_memory_blend_weight=0.10,
        default_newbie_threat_view=3.0,
        save_social_memory_at_end=True,

        threat_curve_base=1.5,
        preempt_weight_base=0.45,
        strategy_power=1,

        align_nudge_strength=0.02,
        solo_avoid_prob=0.00,
        solo_score_delta=0.01,

        alliance_min_edge=4,
        align_topk_friends=0,


    )

    sim = SurvivorSimulator(players, config=cfg, season_plan=plan)
    sim.run_game()

from dataclasses import dataclass, field
from typing import List, Tuple

from survivor_sim.advantage import AdvantageCopy, AdvantageSeed

# Logging levels
LOG_DEBUG = 0
LOG_INFO = 1
LOG_WARNING = 2
LOG_ERROR = 3

# Advantage / Inventory Constants
ADV_IDOL = "idol"
ADV_SUPER_IDOL = "super_idol"
ADV_DOUBLE_IDOL = "double_idol"
ADV_LEGACY = "legacy_adv"
ADV_5050 = "coin_50_50"
ADV_NULLIFIER = "idol_nullifier"
ADV_VOTE_STEAL = "vote_steal"
ADV_VOTE_BLOCK = "vote_block"
ADV_KIP = "knowledge_is_power"
ADV_EXTRA_VOTE = "extra_vote"
ADV_SAFETY = "safety_without_power"
ADV_FAKE_KIT = "fake_idol_kit"
ADV_FAKE_HELD = "fake_idol"


def _empty_advantage_seeds() -> list[AdvantageSeed]:
    return []


def _empty_advantage_copies() -> list[AdvantageCopy]:
    return []


@dataclass
class GameConfig:
    seed: int | None = None
    finalists_count_choices: Tuple[int, ...] = (2, 3)
    weighted_num_swaps: Tuple[List[int], List[float]] = (
        [0, 1, 2, 3], [0.25, 0.45, 0.25, 0.05])
    weighted_nominee_counts: Tuple[List[int], List[float]] = ([2, 3, 4], [
                                                              0.82, 0.14, 0.04])
    preplan_nominee_queue_len: int = 50
    p_avoid_rocks: float = 0.72
    p_last_chance_flip: float = 0.97
    allow_random_idols: bool = True
    p_exile_idol: float = 0.25
    merge_idol_count: int = 0
    advantages_enabled: bool = True
    seed_starting_tribe_idols: bool = True
    seed_merge_idol: bool = True
    advantage_seeds: list[AdvantageSeed] = field(default_factory=_empty_advantage_seeds)
    advantage_copies: list[AdvantageCopy] = field(default_factory=_empty_advantage_copies)
    logfile: str = "logs/survivor_log.txt"
    log_level: int = LOG_INFO
    postmerge_winners_per_round: int = 1
    enable_events: bool = True
    relationship_min: int = -12
    relationship_max: int = 12
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
    save_alliance_graphs: bool = False

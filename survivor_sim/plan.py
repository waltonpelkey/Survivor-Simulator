from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Union

from survivor_sim.advantage import AdvantageCopy, AdvantageSeed

PresetRelationshipList = List[Tuple[str, str, int]]
PresetRelationshipMap = Dict[Tuple[str, str], int]
PresetRelationships = Union[PresetRelationshipList, PresetRelationshipMap]


def _empty_str_list() -> List[str]:
    return []


def _empty_int_list() -> List[int]:
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

from dataclasses import dataclass, field
from typing import Dict, Optional, cast
from collections import Counter
import random

from survivor_sim.advantage import AdvantageKnowledge


def _empty_relationships() -> Dict["Player", int]:
    return {}


def _empty_inventory() -> Counter[str]:
    return Counter()


def _empty_threat_perceptions() -> Dict["Player", float]:
    return {}


def _empty_advantage_knowledge() -> Dict[str, AdvantageKnowledge]:
    return {}


@dataclass(eq=False)
class Player:
    name: str
    strategy_level: int = cast(int, None)
    threat_level: float = cast(float, None)
    challenge_ability: int = cast(int, None)
    social_skill: int = cast(int, None)

    relationships: Dict["Player", int] = field(default_factory=_empty_relationships)
    threat_perceptions: Dict["Player", float] = field(default_factory=_empty_threat_perceptions)
    advantage_knowledge: Dict[str, AdvantageKnowledge] = field(default_factory=_empty_advantage_knowledge)
    immune: bool = False
    vote_target: Optional["Player"] = None
    sat_out_last: bool = False
    idols: int = 0
    tribe_label: str | None = None
    phase_threat_mult: float = 0.0
    phase_preempt_mult: float = 0.0
    inventory: Counter[str] = field(default_factory=_empty_inventory)
    left_tribal_no_vote: bool = False

    def __repr__(self) -> str:
        return self.name

    def ensure_randomized_stats(self, rng: random.Random) -> None:
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
        if adv == "idol":
            self.idols += qty
        self.inventory[adv] += qty

    def take_one(self, adv: str) -> bool:
        if self.inventory.get(adv, 0) > 0:
            self.inventory[adv] -= 1
            if adv == "idol":
                self.idols = max(0, self.idols - 1)
            return True
        return False

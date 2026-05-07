from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

AdvantageType = Literal[
    "idol",
    "super_idol",
    "double_idol",
    "legacy_adv",
    "coin_50_50",
    "idol_nullifier",
    "vote_steal",
    "vote_block",
    "knowledge_is_power",
    "extra_vote",
    "safety_without_power",
    "fake_idol_kit",
]

AdvantageTimingKind = Literal[
    "starting_tribe",
    "pre_merge",
    "swap",
    "merge",
    "auction",
    "final_remaining",
]

AdvantageLocation = Literal[
    "camp",
    "tribe_beach",
    "merge_camp",
    "exile",
    "journey",
    "auction",
    "reward",
    "challenge",
    "sit_out_bench",
    "random",
]

AdvantageLifecycleState = Literal[
    "hidden",
    "found",
    "held",
    "transferred",
    "played",
    "expired",
    "removed",
    "bequeathed",
]

IMPLEMENTED_ADVANTAGE_TYPES: tuple[AdvantageType, ...] = (
    "idol",
    "super_idol",
    "double_idol",
    "legacy_adv",
    "coin_50_50",
    "idol_nullifier",
    "vote_steal",
    "vote_block",
    "knowledge_is_power",
    "extra_vote",
    "safety_without_power",
    "fake_idol_kit",
)

ADVANTAGE_LOCATIONS: tuple[AdvantageLocation, ...] = (
    "camp",
    "tribe_beach",
    "merge_camp",
    "exile",
    "journey",
    "auction",
    "reward",
    "challenge",
    "sit_out_bench",
    "random",
)


def _empty_history() -> list[str]:
    return []


def _empty_sources() -> list[str]:
    return []


def is_implemented_advantage(value: str) -> bool:
    return value in IMPLEMENTED_ADVANTAGE_TYPES


def advantage_copy_id(advantage_type: str, ordinal: int) -> str:
    safe_type = advantage_type.strip().lower().replace(" ", "_")
    return f"{safe_type}-{ordinal:03d}"


@dataclass(frozen=True)
class AdvantageTiming:
    kind: AdvantageTimingKind
    remaining_players: int | None = None

    def __post_init__(self) -> None:
        if self.kind == "final_remaining" and self.remaining_players is None:
            raise ValueError("final_remaining timing requires remaining_players.")
        if self.kind != "final_remaining" and self.remaining_players is not None:
            raise ValueError("remaining_players is only valid for final_remaining timing.")

    @classmethod
    def at_final(cls, remaining_players: int) -> "AdvantageTiming":
        return cls(kind="final_remaining", remaining_players=remaining_players)


@dataclass(frozen=True)
class AdvantageSeed:
    advantage_type: AdvantageType
    timing: AdvantageTiming
    location: AdvantageLocation = "random"
    enabled: bool = True
    source: str = "user"

    def __post_init__(self) -> None:
        if not is_implemented_advantage(self.advantage_type):
            raise ValueError(f"Unsupported advantage type: {self.advantage_type}")


@dataclass
class AdvantageCopy:
    copy_id: str
    advantage_type: AdvantageType
    timing: AdvantageTiming
    location: AdvantageLocation
    state: AdvantageLifecycleState = "hidden"
    owner_id: str | None = None
    seeded_round: int | None = None
    found_round: int | None = None
    played_round: int | None = None
    expired_round: int | None = None
    removed_round: int | None = None
    source: str = "user"
    history: list[str] = field(default_factory=_empty_history)

    @classmethod
    def from_seed(
        cls,
        seed: AdvantageSeed,
        ordinal: int,
        *,
        seeded_round: int | None = None,
    ) -> "AdvantageCopy":
        return cls(
            copy_id=advantage_copy_id(seed.advantage_type, ordinal),
            advantage_type=seed.advantage_type,
            timing=seed.timing,
            location=seed.location,
            seeded_round=seeded_round,
            source=seed.source,
            history=[f"seeded:{seed.source}"],
        )

    def assign_owner(self, player_id: str, round_number: int | None = None) -> None:
        self.owner_id = player_id
        self.state = "held"
        self.found_round = round_number
        self.history.append(f"held:{player_id}")

    def transfer_to(self, player_id: str) -> None:
        previous = self.owner_id or ""
        self.owner_id = player_id
        self.state = "transferred"
        self.history.append(f"transfer:{previous}->{player_id}")

    def mark_played(self, round_number: int | None = None) -> None:
        self.state = "played"
        self.played_round = round_number
        self.history.append("played")

    def mark_expired(self, round_number: int | None = None) -> None:
        self.state = "expired"
        self.expired_round = round_number
        self.history.append("expired")

    def mark_removed(self, round_number: int | None = None) -> None:
        self.state = "removed"
        self.removed_round = round_number
        self.history.append("removed")

    def mark_bequeathed(self, player_id: str) -> None:
        previous = self.owner_id or ""
        self.owner_id = player_id
        self.state = "bequeathed"
        self.history.append(f"bequeathed:{previous}->{player_id}")


@dataclass
class AdvantageKnowledge:
    copy_id: str
    holder_id: str
    advantage_type: AdvantageType | None = None
    confidence: float = 0.0
    source: str = "unknown"
    round_number: int | None = None
    exact: bool = False
    sources: list[str] = field(default_factory=_empty_sources)

    def update(
        self,
        *,
        holder_id: str,
        advantage_type: AdvantageType | None,
        confidence: float,
        source: str,
        round_number: int | None,
        exact: bool,
    ) -> None:
        self.holder_id = holder_id
        if exact or self.advantage_type is None:
            self.advantage_type = advantage_type
        self.confidence = max(self.confidence, min(1.0, max(0.0, confidence)))
        self.source = source
        self.round_number = round_number
        self.exact = self.exact or exact
        if source not in self.sources:
            self.sources.append(source)

import random
from collections import Counter
from typing import Any, Protocol, cast

import pytest  # type: ignore[import-not-found]

from survivor_sim.player import Player as PackagePlayer
from survivor_sim.simulator import Player as SimulatorPlayer


class PlayerLike(Protocol):
    name: str
    strategy_level: int
    threat_level: float
    challenge_ability: int
    social_skill: int
    relationships: dict[Any, int]
    immune: bool
    vote_target: Any | None
    left_tribal_no_vote: bool
    sat_out_last: bool
    idols: int
    tribe_label: str | None
    inventory: Counter[str]

    def ensure_randomized_stats(self, rng: random.Random) -> None: ...
    def update_relationship(self, other: Any, delta: int) -> None: ...
    def clamp_relationship(self, other: Any, clamp_min: int, clamp_max: int) -> None: ...
    def reset_for_round(self) -> None: ...
    def give(self, adv: str, qty: int = 1) -> None: ...
    def take_one(self, adv: str) -> bool: ...


class PlayerFactory(Protocol):
    def __call__(
        self,
        name: str,
        strategy_level: int | None = None,
        threat_level: int | None = None,
        challenge_ability: int | None = None,
        social_skill: int | None = None,
    ) -> PlayerLike: ...


@pytest.fixture(
    params=[PackagePlayer, SimulatorPlayer],
    ids=["package-player", "simulator-player"],
)
def player_cls(request: Any) -> PlayerFactory:
    return cast(PlayerFactory, request.param)


def test_repr_returns_player_name(player_cls: PlayerFactory) -> None:
    player = player_cls("Ada")

    assert repr(player) == "Ada"


def test_ensure_randomized_stats_fills_missing_values_in_valid_range(player_cls: PlayerFactory) -> None:
    player = player_cls("Ada")

    player.ensure_randomized_stats(random.Random(12))

    assert 1 <= player.strategy_level <= 5
    assert 1 <= player.threat_level <= 5
    assert 1 <= player.challenge_ability <= 5
    assert 1 <= player.social_skill <= 5


def test_ensure_randomized_stats_preserves_existing_values(player_cls: PlayerFactory) -> None:
    player = player_cls(
        "Ada",
        strategy_level=5,
        threat_level=4,
        challenge_ability=3,
        social_skill=2,
    )

    player.ensure_randomized_stats(random.Random(99))

    assert player.strategy_level == 5
    assert player.threat_level == 4
    assert player.challenge_ability == 3
    assert player.social_skill == 2


def test_ensure_randomized_stats_is_deterministic_for_same_seed(player_cls: PlayerFactory) -> None:
    first = player_cls("Ada")
    second = player_cls("Grace")

    first.ensure_randomized_stats(random.Random(7))
    second.ensure_randomized_stats(random.Random(7))

    assert (
        first.strategy_level,
        first.threat_level,
        first.challenge_ability,
        first.social_skill,
    ) == (
        second.strategy_level,
        second.threat_level,
        second.challenge_ability,
        second.social_skill,
    )


def test_simulator_player_defaults_player_id_to_name_when_randomizing_stats() -> None:
    player = SimulatorPlayer("Ada")

    player.ensure_randomized_stats(random.Random(1))

    assert player.player_id == "Ada"


def test_simulator_player_preserves_existing_player_id_when_randomizing_stats() -> None:
    player = SimulatorPlayer("Ada", player_id="ada-lovelace")

    player.ensure_randomized_stats(random.Random(1))

    assert player.player_id == "ada-lovelace"


def test_update_relationship_creates_and_accumulates_relationship(player_cls: PlayerFactory) -> None:
    player = player_cls("Ada")
    other = player_cls("Grace")

    player.update_relationship(other, 2)
    player.update_relationship(other, -5)

    assert player.relationships[other] == -3


@pytest.mark.parametrize(
    ("starting_value", "clamp_min", "clamp_max", "expected"),
    [
        (-10, -4, 4, -4),
        (10, -4, 4, 4),
        (2, -4, 4, 2),
    ],
)
def test_clamp_relationship_bounds_values(
    player_cls: PlayerFactory, starting_value: int, clamp_min: int, clamp_max: int, expected: int
) -> None:
    player = player_cls("Ada")
    other = player_cls("Grace")
    player.relationships[other] = starting_value

    player.clamp_relationship(other, clamp_min, clamp_max)

    assert player.relationships[other] == expected


def test_clamp_relationship_creates_missing_relationship_at_clamped_zero(player_cls: PlayerFactory) -> None:
    player = player_cls("Ada")
    other = player_cls("Grace")

    player.clamp_relationship(other, -4, 4)

    assert player.relationships[other] == 0


def test_reset_for_round_clears_only_transient_round_state(player_cls: PlayerFactory) -> None:
    player = player_cls("Ada")
    target = player_cls("Grace")
    player.immune = True
    player.vote_target = target
    player.left_tribal_no_vote = True
    player.sat_out_last = True
    player.idols = 1
    player.tribe_label = "Blue"
    player.inventory.update({"idol": 1, "extra_vote": 2})
    player.relationships[target] = 3

    player.reset_for_round()

    assert player.immune is False
    assert player.vote_target is None
    assert player.left_tribal_no_vote is False
    assert player.sat_out_last is True
    assert player.idols == 1
    assert player.tribe_label == "Blue"
    assert player.inventory == Counter({"extra_vote": 2, "idol": 1})
    assert player.relationships[target] == 3


def test_give_idol_updates_idol_count_and_inventory(player_cls: PlayerFactory) -> None:
    player = player_cls("Ada")

    player.give("idol", qty=2)

    assert player.idols == 2
    assert player.inventory["idol"] == 2


def test_give_non_idol_updates_inventory_only(player_cls: PlayerFactory) -> None:
    player = player_cls("Ada")

    player.give("extra_vote", qty=3)

    assert player.idols == 0
    assert player.inventory["extra_vote"] == 3


def test_take_one_existing_advantage_decrements_inventory(player_cls: PlayerFactory) -> None:
    player = player_cls("Ada")
    player.give("extra_vote", qty=2)

    taken = player.take_one("extra_vote")

    assert taken is True
    assert player.inventory["extra_vote"] == 1
    assert player.idols == 0


def test_take_one_existing_idol_decrements_inventory_and_idol_count(player_cls: PlayerFactory) -> None:
    player = player_cls("Ada")
    player.give("idol", qty=2)

    taken = player.take_one("idol")

    assert taken is True
    assert player.inventory["idol"] == 1
    assert player.idols == 1


def test_take_one_idol_never_makes_idol_count_negative(player_cls: PlayerFactory) -> None:
    player = player_cls("Ada")
    player.inventory["idol"] = 1
    player.idols = 0

    taken = player.take_one("idol")

    assert taken is True
    assert player.inventory["idol"] == 0
    assert player.idols == 0


def test_take_one_missing_advantage_returns_false_and_leaves_state(player_cls: PlayerFactory) -> None:
    player = player_cls("Ada")
    player.give("idol")

    taken = player.take_one("extra_vote")

    assert taken is False
    assert player.idols == 1
    assert player.inventory == Counter({"idol": 1})

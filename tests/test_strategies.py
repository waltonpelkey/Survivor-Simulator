from __future__ import annotations

# pyright: reportPrivateUsage=false
# pyright: reportArgumentType=false
# pyright: reportUnknownMemberType=false

import random
from collections import Counter
from dataclasses import dataclass, field
from typing import Any, Dict, List, cast

import pytest

from survivor_sim.config import (
    ADV_5050,
    ADV_DOUBLE_IDOL,
    ADV_IDOL,
    ADV_LEGACY,
    ADV_NULLIFIER,
    ADV_SUPER_IDOL,
)
from survivor_sim.strategies import (
    DefaultChallengeSystem,
    DefaultIdolPolicy,
    DefaultNominationStrategy,
    DefaultTieBreakerStrategy,
    DefaultVotingStrategy,
    _best_targets_for_voter,
    _fallback_target_score,
    _score_target,
    _strategy_level,
)


def _empty_fake_relationships() -> Dict["FakePlayer", int]:
    return {}


def _empty_fake_threat_perceptions() -> Dict["FakePlayer", float]:
    return {}


def _empty_fake_inventory() -> Counter[str]:
    return Counter()


@dataclass(eq=False)
class FakePlayer:
    name: str
    strategy_level: int = 3
    threat_level: float = 3.0
    challenge_ability: int = 1
    immune: bool = False
    sat_out_last: bool = False
    relationships: Dict["FakePlayer", int] = field(default_factory=_empty_fake_relationships)
    threat_perceptions: Dict["FakePlayer", float] = field(default_factory=_empty_fake_threat_perceptions)
    inventory: Counter[str] = field(default_factory=_empty_fake_inventory)

    def reset_for_round(self) -> None:
        self.immune = False

    def take_one(self, adv: str) -> bool:
        if self.inventory.get(adv, 0) <= 0:
            return False
        self.inventory[adv] -= 1
        return True


class FakeLogger:
    def __init__(self) -> None:
        self.messages: List[str] = []

    def info(self, msg: str) -> None:
        self.messages.append(msg)


class FakeConfig:
    p_avoid_rocks = 1.0
    p_last_chance_flip = 0.0
    tie_flip_strat_bonus_max = 0.12


class FakeSim:
    def __init__(self, players: List[FakePlayer], seed: int = 1) -> None:
        self.players = players
        self.rng = random.Random(seed)
        self.log = FakeLogger()
        self.config = FakeConfig()
        self.is_merge_vote = False
        self.tribes: List[List[FakePlayer]] = []


def p(name: str, strat: int = 3, threat: float = 3.0, challenge: int = 1) -> FakePlayer:
    return FakePlayer(
        name=name,
        strategy_level=strat,
        threat_level=threat,
        challenge_ability=challenge,
    )


# ----------------------------
# Shared helpers
# ----------------------------

def test_fallback_target_score_uses_relationship_and_threat() -> None:
    voter = p("Voter")
    target = p("Target", threat=8.0)
    voter.relationships[target] = -3

    assert _fallback_target_score(cast(Any, voter), cast(Any, target)) == 11.0


def test_fallback_target_score_uses_perceived_threat_over_actual_threat() -> None:
    voter = p("Voter")
    target = p("Target", threat=8.0)
    voter.relationships[target] = 2
    voter.threat_perceptions[target] = 1.5

    assert _fallback_target_score(cast(Any, voter), cast(Any, target)) == pytest.approx(-0.5)


def test_score_target_uses_custom_scorer_when_available() -> None:
    voter = p("Voter")
    target = p("Target")

    def custom_score(voter_arg: object, target_arg: object) -> float:
        assert voter_arg is voter
        assert target_arg is target
        return -99.0

    setattr(voter, "_score_target_for_voter", custom_score)

    assert _score_target(cast(Any, voter), cast(Any, target)) == -99.0


def test_score_target_falls_back_when_custom_scorer_raises() -> None:
    voter = p("Voter")
    target = p("Target", threat=5.0)

    def broken_score(voter_arg: object, target_arg: object) -> float:
        raise RuntimeError("broken")

    setattr(voter, "_score_target_for_voter", broken_score)

    assert _score_target(cast(Any, voter), cast(Any, target)) == 5.0


def test_strategy_level_returns_integer_strategy_level() -> None:
    player = p("Player", strat=5)

    assert _strategy_level(cast(Any, player)) == 5


def test_best_targets_for_voter_sorts_lowest_score_first() -> None:
    voter = p("Voter")
    a = p("A", threat=9.0)
    b = p("B", threat=1.0)
    c = p("C", threat=5.0)

    assert _best_targets_for_voter(cast(Any, voter), cast(Any, [a, b, c])) == [b, c, a]


# ----------------------------
# NominationStrategy
# ----------------------------

def test_nomination_selects_two_nominees_by_default() -> None:
    strategy = DefaultNominationStrategy(random.Random(1))

    voter = p("Voter")
    a = p("A", threat=1.0)
    b = p("B", threat=9.0)
    c = p("C", threat=5.0)

    nominees = strategy.select_nominees(cast(Any, [voter, a, b, c]), desired_k=0)

    assert len(nominees) == 2
    assert all(not nominee.immune for nominee in nominees)


def test_nomination_caps_desired_k_to_eligible_count() -> None:
    strategy = DefaultNominationStrategy(random.Random(2))
    players = [p("A"), p("B"), p("C")]

    nominees = strategy.select_nominees(cast(Any, players), desired_k=99)

    assert len(nominees) == 3


def test_nomination_respects_immune_players() -> None:
    strategy = DefaultNominationStrategy(random.Random(3))
    a = p("A")
    b = p("B")
    c = p("C")
    c.immune = True

    nominees = strategy.select_nominees(cast(Any, [a, b, c]), desired_k=3)

    assert c not in nominees
    assert nominees == [a, b] or nominees == [b, a]


def test_nomination_with_less_than_two_eligible_returns_available_nonimmune_players() -> None:
    strategy = DefaultNominationStrategy(random.Random(4))
    a = p("A", threat=1.0)
    b = p("B", threat=9.0)
    a.immune = True

    nominees = strategy.select_nominees(cast(Any, [a, b]), desired_k=2)

    assert nominees == [b]


def test_nomination_with_all_immune_returns_empty_list() -> None:
    strategy = DefaultNominationStrategy(random.Random(5))
    a = p("A")
    b = p("B")
    a.immune = True
    b.immune = True

    assert strategy.select_nominees(cast(Any, [a, b]), desired_k=2) == []


# ----------------------------
# VotingStrategy
# ----------------------------

def test_voting_raises_when_no_eligibles() -> None:
    strategy = DefaultVotingStrategy()

    with pytest.raises(ValueError):
        strategy.choose_target(cast(Any, p("Voter")), cast(Any, []))


def test_voting_strategy_level_one_uses_relationship_then_threat() -> None:
    strategy = DefaultVotingStrategy()
    voter = p("Voter", strat=1)
    liked = p("Liked", threat=10.0)
    disliked = p("Disliked", threat=1.0)

    voter.relationships[liked] = 5
    voter.relationships[disliked] = -5

    assert strategy.choose_target(cast(Any, voter), cast(Any, [liked, disliked])) is disliked


def test_voting_strategy_level_one_breaks_equal_relationship_by_higher_threat() -> None:
    strategy = DefaultVotingStrategy()
    voter = p("Voter", strat=1)
    low_threat = p("Low", threat=1.0)
    high_threat = p("High", threat=9.0)

    voter.relationships[low_threat] = 0
    voter.relationships[high_threat] = 0

    assert strategy.choose_target(cast(Any, voter), cast(Any, [low_threat, high_threat])) is high_threat


def test_voting_strategy_uses_score_for_strategic_players() -> None:
    strategy = DefaultVotingStrategy()
    voter = p("Voter", strat=5)
    a = p("A", threat=1.0)
    b = p("B", threat=9.0)

    voter.relationships[a] = 10
    voter.relationships[b] = -10

    assert strategy.choose_target(cast(Any, voter), cast(Any, [a, b])) is a


# ----------------------------
# IdolPolicy static helpers
# ----------------------------

def test_idol_thresholds() -> None:
    assert DefaultIdolPolicy._threshold(5) == 1
    assert DefaultIdolPolicy._threshold(4) == 1
    assert DefaultIdolPolicy._threshold(3) == 2
    assert DefaultIdolPolicy._threshold(2) == 3
    assert DefaultIdolPolicy._threshold(1) == 3


def test_holder_vote_target_returns_vote_or_none() -> None:
    holder = p("Holder")
    target = p("Target")

    assert DefaultIdolPolicy._holder_vote_target(cast(Any, {holder: target}), cast(Any, holder)) is target
    assert DefaultIdolPolicy._holder_vote_target(cast(Any, {}), cast(Any, holder)) is None


def test_final_windows() -> None:
    assert DefaultIdolPolicy._is_final_6_window(6)
    assert DefaultIdolPolicy._is_final_6_window(7)
    assert not DefaultIdolPolicy._is_final_6_window(5)

    assert DefaultIdolPolicy._is_final_5_window(5)
    assert DefaultIdolPolicy._is_final_5_window(6)
    assert not DefaultIdolPolicy._is_final_5_window(4)


def test_safe_protection_targets_excludes_holder_vote_and_immune_targets() -> None:
    holder = p("Holder")
    a = p("A")
    b = p("B")
    c = p("C")
    c.immune = True

    votes = {holder: a}
    tally = Counter({a: 3, b: 2, c: 1, holder: 1})

    targets = DefaultIdolPolicy._safe_protection_targets(
        holder=cast(Any, holder),
        pool=cast(Any, [holder, a, b, c]),
        votes=cast(Any, votes),
        tally=cast(Any, tally),
        include_self=True,
    )

    assert a not in targets
    assert c not in targets
    assert b in targets
    assert holder in targets


def test_safe_protection_targets_excludes_self_when_include_self_false() -> None:
    holder = p("Holder")
    tally = Counter({holder: 5})

    targets = DefaultIdolPolicy._safe_protection_targets(
        holder=cast(Any, holder),
        pool=cast(Any, [holder]),
        votes=cast(Any, {}),
        tally=cast(Any, tally),
        include_self=False,
    )

    assert holder not in targets


def test_ally_candidates_filters_by_relationship() -> None:
    holder = p("Holder")
    ally = p("Ally")
    neutral = p("Neutral")
    holder.relationships[ally] = 4
    holder.relationships[neutral] = 2

    assert DefaultIdolPolicy._ally_candidates(
        cast(Any, holder),
        cast(Any, [ally, neutral]),
        min_rel=3,
    ) == [ally]


def test_likely_idol_holder_candidates_detects_visible_protection() -> None:
    holder = p("Holder")
    target = p("Target")
    target.inventory[ADV_IDOL] = 1
    tally = Counter({target: 3})

    candidates = DefaultIdolPolicy._likely_idol_holder_candidates(
        holder=cast(Any, holder),
        pool=cast(Any, [holder, target]),
        votes=cast(Any, {holder: target}),
        tally=cast(Any, tally),
    )

    assert candidates == [target]


def test_likely_idol_holder_candidates_detects_likely_saved_by_allies() -> None:
    holder = p("Holder")
    target = p("Target")
    ally1 = p("Ally1")
    ally2 = p("Ally2")
    ally1.relationships[target] = 4
    ally2.relationships[target] = 4

    candidates = DefaultIdolPolicy._likely_idol_holder_candidates(
        holder=cast(Any, holder),
        pool=cast(Any, [holder, target, ally1, ally2]),
        votes=cast(Any, {}),
        tally=cast(Any, Counter({target: 2})),
    )

    assert candidates == [target]


# ----------------------------
# IdolPolicy decide_idol_plays
# ----------------------------

def test_hidden_idol_self_play_at_final_five_window() -> None:
    holder = p("Holder", strat=5)
    target = p("Target")
    holder.inventory[ADV_IDOL] = 1
    sim = FakeSim([holder, target], seed=1)
    sim.players = [holder, target, p("A"), p("B"), p("C")]

    immune, notes = DefaultIdolPolicy(cast(Any, sim.log)).decide_idol_plays(
        cast(Any, sim),
        cast(Any, [holder, target]),
        cast(Any, {target: holder}),
    )

    assert holder in immune
    assert holder.inventory[ADV_IDOL] == 0
    assert holder in notes


def test_hidden_idol_not_playable_at_final_four() -> None:
    holder = p("Holder", strat=5)
    target = p("Target")
    holder.inventory[ADV_IDOL] = 1
    sim = FakeSim([holder, target, p("A"), p("B")], seed=1)

    immune, notes = DefaultIdolPolicy(cast(Any, sim.log)).decide_idol_plays(
        cast(Any, sim),
        cast(Any, [holder, target]),
        cast(Any, {target: holder}),
    )

    assert immune == []
    assert notes == {}
    assert holder.inventory[ADV_IDOL] == 1


def test_hidden_idol_is_used_on_last_playable_round_even_without_votes() -> None:
    holder = p("Holder", strat=1)
    voter = p("Voter")
    holder.inventory[ADV_IDOL] = 1
    sim = FakeSim([holder, voter, p("A"), p("B"), p("C")], seed=1)

    immune, notes = DefaultIdolPolicy(cast(Any, sim.log)).decide_idol_plays(
        cast(Any, sim),
        cast(Any, [holder, voter]),
        cast(Any, {holder: voter}),
    )

    assert holder in immune
    assert holder.inventory[ADV_IDOL] == 0
    assert holder in notes


def test_legacy_advantage_plays_on_merge_vote() -> None:
    holder = p("Holder", strat=5)
    target = p("Target")
    holder.inventory[ADV_LEGACY] = 1
    sim = FakeSim([holder, target, p("A"), p("B"), p("C"), p("D")], seed=1)
    sim.is_merge_vote = True

    immune, notes = DefaultIdolPolicy(cast(Any, sim.log)).decide_idol_plays(
        cast(Any, sim),
        cast(Any, [holder, target]),
        cast(Any, {target: holder}),
    )

    assert holder in immune
    assert holder.inventory[ADV_LEGACY] == 0
    assert holder in notes


def test_legacy_advantage_is_used_on_last_playable_round() -> None:
    holder = p("Holder", strat=2)
    voter = p("Voter")
    holder.inventory[ADV_LEGACY] = 1
    sim = FakeSim([holder, voter, p("A"), p("B"), p("C"), p("D")], seed=1)

    immune, notes = DefaultIdolPolicy(cast(Any, sim.log)).decide_idol_plays(
        cast(Any, sim),
        cast(Any, [holder, voter]),
        cast(Any, {holder: voter}),
    )

    assert holder in immune
    assert holder.inventory[ADV_LEGACY] == 0
    assert holder in notes


def test_double_idol_can_protect_two_targets() -> None:
    holder = p("Holder", strat=5)
    ally = p("Ally")
    target = p("Target")
    extra = p("Extra")
    holder.inventory[ADV_DOUBLE_IDOL] = 1
    holder.relationships[ally] = 5
    sim = FakeSim([holder, ally, target, extra, p("A"), p("B")], seed=1)

    votes = {
        ally: holder,
        target: ally,
        extra: holder,
    }

    immune, notes = DefaultIdolPolicy(cast(Any, sim.log)).decide_idol_plays(
        cast(Any, sim),
        cast(Any, [holder, ally, target, extra]),
        cast(Any, votes),
    )

    assert holder in immune
    assert len(immune) <= 2
    assert holder.inventory[ADV_DOUBLE_IDOL] == 0
    assert holder in notes


def test_5050_coin_consumes_advantage_when_holder_receives_votes() -> None:
    holder = p("Holder", strat=5)
    voter = p("Voter")
    holder.inventory[ADV_5050] = 1
    sim = FakeSim([holder, voter, p("A"), p("B"), p("C"), p("D")], seed=2)

    immune, notes = DefaultIdolPolicy(cast(Any, sim.log)).decide_idol_plays(
        cast(Any, sim),
        cast(Any, [holder, voter]),
        cast(Any, {voter: holder}),
    )

    assert holder.inventory[ADV_5050] == 0
    assert holder in notes or holder in immune


def test_5050_coin_is_used_on_last_playable_round_even_without_votes() -> None:
    holder = p("Holder", strat=2)
    voter = p("Voter")
    holder.inventory[ADV_5050] = 1
    sim = FakeSim([holder, voter, p("A"), p("B"), p("C"), p("D")], seed=2)

    immune, notes = DefaultIdolPolicy(cast(Any, sim.log)).decide_idol_plays(
        cast(Any, sim),
        cast(Any, [holder, voter]),
        cast(Any, {holder: voter}),
    )

    assert holder.inventory[ADV_5050] == 0
    assert holder in notes or holder in immune


def test_nullifier_removes_existing_protection() -> None:
    holder = p("Holder", strat=5)
    protected_target = p("Protected")
    voter = p("Voter")
    holder.inventory[ADV_NULLIFIER] = 1
    protected_target.inventory[ADV_IDOL] = 1
    sim = FakeSim([holder, protected_target, voter, p("A"), p("B")], seed=1)

    votes = {
        holder: protected_target,
        voter: protected_target,
        protected_target: voter,
    }

    immune, notes = DefaultIdolPolicy(cast(Any, sim.log)).decide_idol_plays(
        cast(Any, sim),
        cast(Any, [holder, protected_target, voter]),
        cast(Any, votes),
    )

    assert protected_target not in immune
    assert holder.inventory[ADV_NULLIFIER] == 0
    assert holder in notes


def test_super_idol_is_not_preplayed_by_idol_policy() -> None:
    holder = p("Holder", strat=5)
    voter = p("Voter")
    holder.inventory[ADV_SUPER_IDOL] = 1
    sim = FakeSim([holder, voter, p("A"), p("B"), p("C")], seed=1)

    immune, _notes = DefaultIdolPolicy(cast(Any, sim.log)).decide_idol_plays(
        cast(Any, sim),
        cast(Any, [holder, voter]),
        cast(Any, {voter: holder}),
    )

    assert holder not in immune
    assert holder.inventory[ADV_SUPER_IDOL] == 1


# ----------------------------
# TieBreakerStrategy
# ----------------------------

def test_tiebreaker_returns_revote_winner_when_revote_has_single_leader() -> None:
    sim = FakeSim([], seed=1)
    sim.config.p_avoid_rocks = 1.0
    sim.config.p_last_chance_flip = 0.0

    a = p("A")
    b = p("B")
    v1 = p("V1")
    v2 = p("V2")
    v3 = p("V3")

    for voter in [v1, v2, v3]:
        voter.relationships[a] = -10
        voter.relationships[b] = 10

    result, note, tally = DefaultTieBreakerStrategy().resolve_tie(
        cast(Any, sim),
        pool=cast(Any, [a, b, v1, v2, v3]),
        tied_players=cast(Any, [a, b]),
    )

    assert result in [a, b]
    assert note == "Revote"
    assert tally is not None
    assert max(tally.values()) == 3


def test_tiebreaker_random_among_tied_when_no_rock_eligible() -> None:
    sim = FakeSim([], seed=1)
    a = p("A")
    b = p("B")

    result, note, tally = DefaultTieBreakerStrategy().resolve_tie(
        cast(Any, sim),
        pool=cast(Any, [a, b]),
        tied_players=cast(Any, [a, b]),
    )

    assert result in [a, b]
    assert note == "Random Among Tied"
    assert tally is None


def test_tiebreaker_rocks_out_non_safe_player_when_deadlock_remains() -> None:
    sim = FakeSim([], seed=1)
    sim.config.p_avoid_rocks = 0.0
    sim.config.p_last_chance_flip = 0.0

    a = p("A")
    b = p("B")
    c = p("C")
    d = p("D")

    result, note, tally = DefaultTieBreakerStrategy().resolve_tie(
        cast(Any, sim),
        pool=cast(Any, [a, b, c, d]),
        tied_players=cast(Any, [a, b]),
    )

    assert result in [c, d]
    assert note == "Rocked Out"
    assert tally is None


# ----------------------------
# ChallengeSystem
# ----------------------------

def test_premerge_team_challenge_returns_one_of_the_tribes() -> None:
    sim = FakeSim([], seed=1)
    tribe1 = [p("A"), p("B")]
    tribe2 = [p("C"), p("D")]
    sim.tribes = [tribe1, tribe2]

    losing = DefaultChallengeSystem().premerge_team_challenge(cast(Any, sim))

    assert losing in [tribe1, tribe2]


def test_premerge_team_challenge_with_one_tribe_returns_that_tribe() -> None:
    sim = FakeSim([], seed=1)
    tribe = [p("A"), p("B")]
    sim.tribes = [tribe]

    assert DefaultChallengeSystem().premerge_team_challenge(cast(Any, sim)) is tribe


def test_premerge_team_challenge_sets_sat_out_flags() -> None:
    sim = FakeSim([], seed=1)
    tribe1 = [p("A"), p("B"), p("C")]
    tribe2 = [p("D"), p("E")]
    sim.tribes = [tribe1, tribe2]

    DefaultChallengeSystem().premerge_team_challenge(cast(Any, sim))

    assert sum(player.sat_out_last for player in tribe1) == 1
    assert sum(player.sat_out_last for player in tribe2) == 0


def test_postmerge_individual_challenge_returns_requested_number_of_winners() -> None:
    players = [p("A"), p("B"), p("C")]
    sim = FakeSim(players, seed=1)

    winners = DefaultChallengeSystem().postmerge_individual_challenge(cast(Any, sim), 2)

    assert len(winners) == 2
    assert all(winner.immune for winner in winners)


def test_postmerge_individual_challenge_caps_winners_to_player_count() -> None:
    players = [p("A"), p("B")]
    sim = FakeSim(players, seed=1)

    winners = DefaultChallengeSystem().postmerge_individual_challenge(cast(Any, sim), 99)

    assert len(winners) == 2


def test_postmerge_individual_challenge_zero_winners_is_allowed() -> None:
    players = [p("A"), p("B")]
    sim = FakeSim(players, seed=1)

    winners = DefaultChallengeSystem().postmerge_individual_challenge(cast(Any, sim), 0)

    assert winners == []
    assert all(not player.immune for player in players)


def test_postmerge_individual_challenge_resets_existing_immunity_before_running() -> None:
    a = p("A")
    b = p("B")
    a.immune = True
    b.immune = True
    sim = FakeSim([a, b], seed=1)

    winners = DefaultChallengeSystem().postmerge_individual_challenge(cast(Any, sim), 1)

    assert len(winners) == 1
    assert sum(player.immune for player in [a, b]) == 1

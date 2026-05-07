import pytest  # type: ignore[import-not-found]

from survivor_sim import AdvantageCopy, AdvantageKnowledge, AdvantageSeed, AdvantageTiming
from survivor_sim import GameConfig, Logger, Player, SeasonPlan, SurvivorSimulator
from survivor_sim.advantage import (
    IMPLEMENTED_ADVANTAGE_TYPES,
    advantage_copy_id,
    is_implemented_advantage,
)


def test_implemented_advantage_catalog_contains_current_types() -> None:
    assert "idol" in IMPLEMENTED_ADVANTAGE_TYPES
    assert "knowledge_is_power" in IMPLEMENTED_ADVANTAGE_TYPES
    assert is_implemented_advantage("double_idol") is True
    assert is_implemented_advantage("custom_advantage") is False


def test_advantage_knowledge_record_updates_confidence_and_exact_type() -> None:
    knowledge = AdvantageKnowledge(
        copy_id="idol-001",
        holder_id="ada",
        confidence=0.35,
        source="rumor",
    )

    knowledge.update(
        holder_id="ada",
        advantage_type="idol",
        confidence=0.9,
        source="shared",
        round_number=4,
        exact=True,
    )

    assert knowledge.advantage_type == "idol"
    assert knowledge.confidence == 0.9
    assert knowledge.exact is True
    assert knowledge.sources == ["shared"]


def test_advantage_copy_id_is_stable_and_readable() -> None:
    assert advantage_copy_id("idol", 1) == "idol-001"
    assert advantage_copy_id("knowledge is power", 12) == "knowledge_is_power-012"


def test_final_remaining_timing_requires_remaining_players() -> None:
    with pytest.raises(ValueError):
        AdvantageTiming(kind="final_remaining")

    timing = AdvantageTiming.at_final(5)

    assert timing.kind == "final_remaining"
    assert timing.remaining_players == 5


def test_non_final_timing_rejects_remaining_players() -> None:
    with pytest.raises(ValueError):
        AdvantageTiming(kind="merge", remaining_players=8)


def test_advantage_copy_from_seed_starts_hidden_with_unique_id() -> None:
    seed = AdvantageSeed(
        advantage_type="idol",
        timing=AdvantageTiming(kind="merge"),
        location="merge_camp",
    )

    copy = AdvantageCopy.from_seed(seed, 3, seeded_round=7)

    assert copy.copy_id == "idol-003"
    assert copy.advantage_type == "idol"
    assert copy.location == "merge_camp"
    assert copy.state == "hidden"
    assert copy.owner_id is None
    assert copy.seeded_round == 7
    assert copy.history == ["seeded:user"]


def test_advantage_copy_tracks_lifecycle() -> None:
    seed = AdvantageSeed(
        advantage_type="legacy_adv",
        timing=AdvantageTiming(kind="pre_merge"),
    )
    copy = AdvantageCopy.from_seed(seed, 1)

    copy.assign_owner("ada", round_number=2)
    copy.transfer_to("grace")
    copy.mark_played(round_number=5)

    assert copy.owner_id == "grace"
    assert copy.state == "played"
    assert copy.found_round == 2
    assert copy.played_round == 5
    assert copy.history == [
        "seeded:user",
        "held:ada",
        "transfer:ada->grace",
        "played",
    ]


def _players(count: int = 12) -> list[Player]:
    return [Player(f"Player {index}") for index in range(1, count + 1)]


def _quiet_logger() -> Logger:
    return Logger(logfile=None, enabled=False)


def test_starting_tribe_idols_seed_hidden_copies_without_player_inventory() -> None:
    sim = SurvivorSimulator(
        _players(),
        config=GameConfig(seed_starting_tribe_idols=True),
        season_plan=SeasonPlan(seed_starting_tribe_idols=True),
        logger=_quiet_logger(),
    )

    sim.split_into_tribes(2)

    copies = [copy for copy in sim.advantage_copies if copy.advantage_type == "idol"]
    assert len(copies) == 2
    assert {copy.location for copy in copies} == {"tribe_beach"}
    assert {copy.state for copy in copies} == {"hidden"}
    assert sum(player.inventory.get("idol", 0) for player in sim.players) == 0


def test_merge_idol_toggle_seeds_one_hidden_merge_copy() -> None:
    sim = SurvivorSimulator(
        _players(),
        config=GameConfig(seed_starting_tribe_idols=False, seed_merge_idol=True),
        season_plan=SeasonPlan(seed_starting_tribe_idols=False, seed_merge_idol=True),
        logger=_quiet_logger(),
    )
    sim.split_into_tribes(2)

    sim._perform_swap(num_teams=1, trigger_left=len(sim.players))

    copies = [copy for copy in sim.advantage_copies if copy.location == "merge_camp"]
    assert len(copies) == 1
    assert copies[0].advantage_type == "idol"
    assert copies[0].state == "hidden"


def test_configured_final_remaining_seed_happens_once() -> None:
    seed = AdvantageSeed(
        advantage_type="extra_vote",
        timing=AdvantageTiming.at_final(12),
        location="camp",
    )
    sim = SurvivorSimulator(
        _players(),
        config=GameConfig(seed_starting_tribe_idols=False, seed_merge_idol=False),
        season_plan=SeasonPlan(
            seed_starting_tribe_idols=False,
            seed_merge_idol=False,
            advantage_seeds=[seed],
        ),
        logger=_quiet_logger(),
    )

    sim._seed_advantages_for_current_player_count()
    sim._seed_advantages_for_current_player_count()

    copies = [copy for copy in sim.advantage_copies if copy.advantage_type == "extra_vote"]
    assert len(copies) == 1
    assert copies[0].timing.kind == "final_remaining"
    assert copies[0].location == "camp"


def test_global_advantages_disabled_blocks_hidden_seeding() -> None:
    sim = SurvivorSimulator(
        _players(),
        config=GameConfig(advantages_enabled=False),
        season_plan=SeasonPlan(),
        logger=_quiet_logger(),
    )

    sim.split_into_tribes(2)
    sim._perform_swap(num_teams=1, trigger_left=len(sim.players))

    assert sim.advantage_copies == []


def test_hidden_advantage_search_moves_copy_to_inventory_and_stats() -> None:
    seed = AdvantageSeed(
        advantage_type="extra_vote",
        timing=AdvantageTiming(kind="pre_merge"),
        location="camp",
    )
    sim = SurvivorSimulator(
        _players(),
        config=GameConfig(seed_starting_tribe_idols=False, seed_merge_idol=False),
        season_plan=SeasonPlan(
            seed_starting_tribe_idols=False,
            seed_merge_idol=False,
            advantage_seeds=[seed],
        ),
        logger=_quiet_logger(),
    )
    sim.split_into_tribes(2)

    sim._run_hidden_advantage_search(locations={"camp"}, force=True)

    found = [copy for copy in sim.advantage_copies if copy.advantage_type == "extra_vote"]
    assert len(found) == 1
    assert found[0].state == "held"
    assert found[0].owner_id is not None
    holder = sim.find_player_by_id(found[0].owner_id)
    assert holder is not None
    assert holder.inventory["extra_vote"] == 1
    assert sim.player_season_stats[holder.player_id]["advantages_found"] == 1
    knowledge = holder.advantage_knowledge[found[0].copy_id]
    assert knowledge.holder_id == holder.player_id
    assert knowledge.advantage_type == "extra_vote"
    assert knowledge.exact is True
    assert knowledge.confidence == 1.0


def test_starting_tribe_beach_search_can_find_each_hidden_idol() -> None:
    sim = SurvivorSimulator(
        _players(),
        config=GameConfig(seed_starting_tribe_idols=True, seed_merge_idol=False),
        season_plan=SeasonPlan(seed_starting_tribe_idols=True, seed_merge_idol=False),
        logger=_quiet_logger(),
    )
    sim.split_into_tribes(2)

    sim._run_hidden_advantage_search(locations={"tribe_beach"}, force=True)

    assert sum(player.inventory.get("idol", 0) for player in sim.players) == 2
    assert all(copy.state == "held" for copy in sim.advantage_copies)
    idol_holders = [
        player
        for player in sim.players
        if player.inventory.get("idol", 0) > 0
    ]
    assert sum(sim.player_season_stats[player.player_id]["idols_found"] for player in idol_holders) == 2


def test_auction_seed_is_found_when_auction_runs() -> None:
    seed = AdvantageSeed(
        advantage_type="vote_steal",
        timing=AdvantageTiming(kind="auction"),
        location="auction",
    )
    sim = SurvivorSimulator(
        _players(),
        config=GameConfig(seed_starting_tribe_idols=False, seed_merge_idol=False),
        season_plan=SeasonPlan(
            seed_starting_tribe_idols=False,
            seed_merge_idol=False,
            advantage_seeds=[seed],
        ),
        logger=_quiet_logger(),
    )
    sim.split_into_tribes(2)
    sim._perform_swap(num_teams=1, trigger_left=len(sim.players))

    sim._run_auction()

    found = [copy for copy in sim.advantage_copies if copy.advantage_type == "vote_steal"]
    assert len(found) == 1
    assert found[0].state == "held"
    assert sum(player.inventory.get("vote_steal", 0) for player in sim.players) >= 1


def test_inventory_decrease_marks_matching_copy_played() -> None:
    seed = AdvantageSeed(
        advantage_type="extra_vote",
        timing=AdvantageTiming(kind="pre_merge"),
        location="camp",
    )
    sim = SurvivorSimulator(
        _players(),
        config=GameConfig(seed_starting_tribe_idols=False, seed_merge_idol=False),
        season_plan=SeasonPlan(
            seed_starting_tribe_idols=False,
            seed_merge_idol=False,
            advantage_seeds=[seed],
        ),
        logger=_quiet_logger(),
    )
    sim.split_into_tribes(2)
    sim._run_hidden_advantage_search(locations={"camp"}, force=True)
    copy = next(copy for copy in sim.advantage_copies if copy.advantage_type == "extra_vote")
    holder = sim.find_player_by_id(copy.owner_id or "")
    assert holder is not None

    before = sim._snapshot_advantage_inventory([holder])
    assert holder.take_one("extra_vote") is True
    sim._mark_inventory_decreases_as_played(before, [holder])

    assert copy.state == "played"
    assert copy.played_round == sim.round_number


def test_advantages_expire_before_final_five_and_hidden_copies_are_removed() -> None:
    seed = AdvantageSeed(
        advantage_type="extra_vote",
        timing=AdvantageTiming(kind="pre_merge"),
        location="camp",
    )
    sim = SurvivorSimulator(
        _players(),
        config=GameConfig(seed_starting_tribe_idols=False, seed_merge_idol=False),
        season_plan=SeasonPlan(
            seed_starting_tribe_idols=False,
            seed_merge_idol=False,
            advantage_seeds=[seed],
        ),
        logger=_quiet_logger(),
    )
    sim.split_into_tribes(2)
    sim._run_hidden_advantage_search(locations={"camp"}, force=True)
    copy = next(copy for copy in sim.advantage_copies if copy.advantage_type == "extra_vote")
    holder = sim.find_player_by_id(copy.owner_id or "")
    assert holder is not None
    hidden_seed = AdvantageSeed(
        advantage_type="vote_block",
        timing=AdvantageTiming.at_final(5),
        location="camp",
    )
    hidden_copy = sim._add_hidden_advantage_copy(hidden_seed)
    remaining = [player for player in sim.players if player is not holder]
    sim.players = ([holder] + remaining)[:5]

    sim._expire_idols_if_needed()

    assert copy.state == "expired"
    assert holder.inventory["extra_vote"] == 0
    assert hidden_copy.state == "removed"


def test_idol_copies_expire_before_final_four() -> None:
    sim = SurvivorSimulator(
        _players(),
        config=GameConfig(seed_starting_tribe_idols=True, seed_merge_idol=False),
        season_plan=SeasonPlan(seed_starting_tribe_idols=True, seed_merge_idol=False),
        logger=_quiet_logger(),
    )
    sim.split_into_tribes(2)
    sim._run_hidden_advantage_search(locations={"tribe_beach"}, force=True)
    held_idols = [copy for copy in sim.advantage_copies if copy.state == "held"]
    assert held_idols
    holders = [
        sim.find_player_by_id(copy.owner_id or "")
        for copy in held_idols
    ]
    active_holders = [player for player in holders if player is not None]
    remaining = [player for player in sim.players if player not in active_holders]
    sim.players = (active_holders + remaining)[:4]

    sim._expire_idols_if_needed()

    assert all(copy.state == "expired" for copy in held_idols)
    assert sum(player.inventory.get("idol", 0) for player in sim.players) == 0


def test_transferred_copy_refreshes_known_owner() -> None:
    sim = SurvivorSimulator(
        _players(),
        config=GameConfig(seed_starting_tribe_idols=True, seed_merge_idol=False),
        season_plan=SeasonPlan(seed_starting_tribe_idols=True, seed_merge_idol=False),
        logger=_quiet_logger(),
    )
    sim.split_into_tribes(2)
    sim._run_hidden_advantage_search(locations={"tribe_beach"}, force=True)
    copy = next(copy for copy in sim.advantage_copies if copy.state == "held")
    holder = sim.find_player_by_id(copy.owner_id or "")
    target = next(player for player in sim.players if player is not holder)
    assert holder is not None
    assert holder.take_one("idol") is True
    target.give("idol")

    sim._transfer_held_advantage_copy(holder, target, "idol")

    assert copy.owner_id == target.player_id
    assert holder.advantage_knowledge[copy.copy_id].holder_id == target.player_id
    assert target.advantage_knowledge[copy.copy_id].holder_id == target.player_id
    assert target.advantage_knowledge[copy.copy_id].exact is True


class _AlwaysShareRng:
    def random(self) -> float:
        return 0.0


def test_close_ally_can_learn_exact_advantage_from_holder() -> None:
    sim = SurvivorSimulator(
        _players(),
        config=GameConfig(seed_starting_tribe_idols=False, seed_merge_idol=False),
        season_plan=SeasonPlan(seed_starting_tribe_idols=False, seed_merge_idol=False),
        logger=_quiet_logger(),
    )
    sim.split_into_tribes(2)
    holder, ally = sim.players[0], sim.players[1]
    holder.relationships[ally] = 6
    ally.relationships[holder] = 6
    seed = AdvantageSeed(
        advantage_type="knowledge_is_power",
        timing=AdvantageTiming(kind="pre_merge"),
        location="camp",
    )
    copy = sim._add_hidden_advantage_copy(seed)
    sim._discover_hidden_advantage(copy, holder)
    sim.rng = _AlwaysShareRng()  # type: ignore[assignment]

    sim._maybe_share_advantage_knowledge()

    learned = ally.advantage_knowledge[copy.copy_id]
    assert learned.holder_id == holder.player_id
    assert learned.advantage_type == "knowledge_is_power"
    assert learned.exact is True
    assert learned.confidence == 0.9


def test_knowledge_is_power_uses_known_idol_holder() -> None:
    sim = SurvivorSimulator(
        _players(),
        config=GameConfig(seed_starting_tribe_idols=False, seed_merge_idol=False),
        season_plan=SeasonPlan(seed_starting_tribe_idols=False, seed_merge_idol=False),
        logger=_quiet_logger(),
    )
    sim.players = sim.players[:6]
    holder, target = sim.players[0], sim.players[1]
    holder.give("knowledge_is_power")
    target.give("idol")
    seed = AdvantageSeed(
        advantage_type="idol",
        timing=AdvantageTiming(kind="pre_merge"),
        location="camp",
    )
    copy = sim._add_hidden_advantage_copy(seed)
    copy.assign_owner(target.player_id, round_number=sim.round_number)
    sim._record_advantage_knowledge(
        observer=holder,
        holder=target,
        copy_item=copy,
        source="shared_by_holder",
        exact=True,
        confidence=0.95,
    )

    sim._pre_vote_advantages_phase(sim.players, nominees=[])

    assert holder.inventory["knowledge_is_power"] == 0
    assert holder.inventory["idol"] == 1
    assert target.inventory["idol"] == 0
    assert copy.owner_id == holder.player_id
    assert holder.advantage_knowledge[copy.copy_id].holder_id == holder.player_id


def test_known_protection_can_trigger_split_vote_counterplay() -> None:
    sim = SurvivorSimulator(
        _players(),
        config=GameConfig(seed_starting_tribe_idols=False, seed_merge_idol=False),
        season_plan=SeasonPlan(seed_starting_tribe_idols=False, seed_merge_idol=False),
        logger=_quiet_logger(),
    )
    sim.players = sim.players[:6]
    for player in sim.players:
        player.strategy_level = 5
    voter, target = sim.players[0], sim.players[4]
    seed = AdvantageSeed(
        advantage_type="idol",
        timing=AdvantageTiming(kind="pre_merge"),
        location="camp",
    )
    copy = sim._add_hidden_advantage_copy(seed)
    copy.assign_owner(target.player_id, round_number=sim.round_number)
    sim._record_advantage_knowledge(
        observer=voter,
        holder=target,
        copy_item=copy,
        source="witnessed_find",
        exact=True,
        confidence=0.9,
    )
    votes = {
        sim.players[0]: target,
        sim.players[1]: target,
        sim.players[2]: target,
        sim.players[3]: target,
        sim.players[4]: sim.players[5],
        sim.players[5]: target,
    }

    adjusted = sim._apply_advantage_vote_counterplay(sim.players, votes, None)

    assert adjusted[voter] is not target
    assert sum(1 for voted in adjusted.values() if voted is target) < 5


def test_played_automatic_idol_rehides_when_under_cap() -> None:
    sim = SurvivorSimulator(
        _players(),
        config=GameConfig(seed_starting_tribe_idols=False, seed_merge_idol=False),
        season_plan=SeasonPlan(seed_starting_tribe_idols=False, seed_merge_idol=False),
        logger=_quiet_logger(),
    )
    holder = sim.players[0]
    seed = AdvantageSeed(
        advantage_type="idol",
        timing=AdvantageTiming(kind="pre_merge"),
        location="tribe_beach",
        source="automatic",
    )
    copy = sim._add_hidden_advantage_copy(seed)
    copy.assign_owner(holder.player_id, round_number=sim.round_number)
    holder.give("idol")

    sim._mark_held_advantage_copies_played(holder, "idol")

    rehidden = [
        copy_item
        for copy_item in sim.advantage_copies
        if copy_item.state == "hidden"
        and any(note == f"rehidden_after:{copy.copy_id}" for note in copy_item.history)
    ]
    assert copy.state == "played"
    assert rehidden


def test_automatic_idol_rehide_respects_active_automatic_cap() -> None:
    sim = SurvivorSimulator(
        _players(),
        config=GameConfig(seed_starting_tribe_idols=False, seed_merge_idol=False),
        season_plan=SeasonPlan(seed_starting_tribe_idols=False, seed_merge_idol=False),
        logger=_quiet_logger(),
    )
    holder = sim.players[0]
    seed = AdvantageSeed(
        advantage_type="idol",
        timing=AdvantageTiming(kind="pre_merge"),
        location="tribe_beach",
        source="automatic",
    )
    played_copy = sim._add_hidden_advantage_copy(seed)
    played_copy.assign_owner(holder.player_id, round_number=sim.round_number)
    holder.give("idol")
    for _ in range(4):
        sim._add_hidden_advantage_copy(seed)

    sim._mark_held_advantage_copies_played(holder, "idol")

    assert played_copy.state == "played"
    assert not any(
        copy_item.state == "hidden"
        and any(note == f"rehidden_after:{played_copy.copy_id}" for note in copy_item.history)
        for copy_item in sim.advantage_copies
    )


def test_user_seeded_idols_do_not_block_automatic_rehide_cap() -> None:
    sim = SurvivorSimulator(
        _players(),
        config=GameConfig(seed_starting_tribe_idols=False, seed_merge_idol=False),
        season_plan=SeasonPlan(seed_starting_tribe_idols=False, seed_merge_idol=False),
        logger=_quiet_logger(),
    )
    holder = sim.players[0]
    automatic_seed = AdvantageSeed(
        advantage_type="idol",
        timing=AdvantageTiming(kind="pre_merge"),
        location="tribe_beach",
        source="automatic",
    )
    user_seed = AdvantageSeed(
        advantage_type="idol",
        timing=AdvantageTiming(kind="pre_merge"),
        location="camp",
        source="user",
    )
    played_copy = sim._add_hidden_advantage_copy(automatic_seed)
    played_copy.assign_owner(holder.player_id, round_number=sim.round_number)
    holder.give("idol")
    for _ in range(5):
        sim._add_hidden_advantage_copy(user_seed)

    sim._mark_held_advantage_copies_played(holder, "idol")

    assert any(
        copy_item.state == "hidden"
        and any(note == f"rehidden_after:{played_copy.copy_id}" for note in copy_item.history)
        for copy_item in sim.advantage_copies
    )


def test_advantage_watch_hides_private_holder_details_from_info_log(capsys: pytest.CaptureFixture[str]) -> None:
    sim = SurvivorSimulator(
        _players(),
        config=GameConfig(seed_starting_tribe_idols=False, seed_merge_idol=False),
        season_plan=SeasonPlan(seed_starting_tribe_idols=False, seed_merge_idol=False),
        logger=Logger(logfile=None),
    )
    holder = sim.players[0]
    holder.give("idol")

    sim._log_idol_holders()

    output = capsys.readouterr().out
    assert "Advantage Watch: no public advantage chatter" in output
    assert f"{holder.name} [" not in output

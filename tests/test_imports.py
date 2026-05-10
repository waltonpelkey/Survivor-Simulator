from survivor_sim import (
    AdvantageCopy,
    AdvantageSeed,
    AdvantageTiming,
    CastMember,
    GameConfig,
    Logger,
    Player,
    SeasonPlan,
    SurvivorSimulator,
    build_players_from_cast,
    build_starting_tribes_from_cast,
)


def test_public_simulator_imports_are_available():
    assert SurvivorSimulator is not None
    assert GameConfig().logfile == "logs/survivor_log.txt"
    assert SeasonPlan() is not None
    assert AdvantageTiming(kind="merge") is not None
    assert AdvantageSeed(advantage_type="idol", timing=AdvantageTiming(kind="merge")) is not None
    assert AdvantageCopy.from_seed(
        AdvantageSeed(advantage_type="idol", timing=AdvantageTiming(kind="merge")),
        1,
    ).copy_id == "idol-001"


def test_build_players_from_cast_preserves_basic_cast_data():
    cast = [
        CastMember(name="Ada", player_id="ada", tribe=1),
        CastMember(name="Grace", player_id="grace", tribe=2),
    ]

    players = build_players_from_cast(cast)
    starting_tribes = build_starting_tribes_from_cast(cast)

    assert [player.name for player in players] == ["Ada", "Grace"]
    assert [player.player_id for player in players] == ["ada", "grace"]
    assert starting_tribes == [["ada"], ["grace"]]


def test_player_round_reset_clears_transient_state():
    player = Player("Test Player")
    player.immune = True
    player.vote_target = Player("Target")
    player.left_tribal_no_vote = True

    player.reset_for_round()

    assert player.immune is False
    assert player.vote_target is None
    assert player.left_tribal_no_vote is False


def test_threat_awareness_curve_is_sigmoid_and_triples_by_end() -> None:
    players = [Player(f"Player {index}") for index in range(1, 13)]
    sim = SurvivorSimulator(
        players,
        config=GameConfig(seed=5, seed_starting_tribe_idols=False, seed_merge_idol=False),
        season_plan=SeasonPlan(seed_starting_tribe_idols=False, seed_merge_idol=False),
        logger=Logger(logfile=None, enabled=False),
    )
    sim.finalists_count = 3
    sim.players = players[:]
    sim.starting_player_count = len(players)

    sim._update_phase_weights()
    assert all(player.phase_threat_mult == 0 for player in sim.players)
    assert all(player.phase_preempt_mult == 0 for player in sim.players)

    sim.players = players[:10]
    sim._update_phase_weights()
    early = sim.players[0].phase_threat_mult

    sim.players = players[:7]
    sim._update_phase_weights()
    merge_window = sim.players[0].phase_threat_mult

    sim.players = players[:5]
    sim._update_phase_weights()
    endgame = sim.players[0].phase_threat_mult

    sim.players = players[:3]
    sim._update_phase_weights()
    assert all(player.phase_threat_mult == 3 for player in sim.players)
    assert all(player.phase_preempt_mult == 3 ** 0.5 for player in sim.players)
    assert 0 < early < 0.25
    assert 1.25 < merge_window < 1.5
    assert 2.5 < endgame < 2.75


def test_generated_tribe_names_are_unique_syllable_words() -> None:
    players = [Player(f"Player {index}") for index in range(1, 13)]
    sim = SurvivorSimulator(
        players,
        config=GameConfig(seed=7, seed_starting_tribe_idols=False, seed_merge_idol=False),
        season_plan=SeasonPlan(seed_starting_tribe_idols=False, seed_merge_idol=False),
        logger=Logger(logfile=None, enabled=False),
    )

    sim.split_into_tribes(3)

    assert len(sim.tribe_names) == 3
    assert len(set(name.casefold() for name in sim.tribe_names)) == 3
    assert all(name and not name.startswith("Tribe ") for name in sim.tribe_names)


def test_manual_starting_tribe_names_override_random_names() -> None:
    players = [Player(f"P{i}") for i in range(1, 13)]
    sim = SurvivorSimulator(
        players,
        config=GameConfig(seed=17, seed_starting_tribe_idols=False, seed_merge_idol=False),
        season_plan=SeasonPlan(
            starting_tribe_labels=["Mara", ""],
            seed_starting_tribe_idols=False,
            seed_merge_idol=False,
        ),
        logger=Logger(logfile=None, enabled=False),
    )

    sim.split_into_tribes(2)

    assert sim.tribe_names[0] == "Mara"
    assert sim.tribe_names[1]
    assert sim.tribe_names[1] != "Mara"
    assert not sim.tribe_names[1].startswith("Tribe ")


def test_swap_preserves_existing_tribe_names_and_adds_unique_new_name() -> None:
    players = [Player(f"Player {index}") for index in range(1, 13)]
    sim = SurvivorSimulator(
        players,
        config=GameConfig(seed=11, seed_starting_tribe_idols=False, seed_merge_idol=False),
        season_plan=SeasonPlan(seed_starting_tribe_idols=False, seed_merge_idol=False),
        logger=Logger(logfile=None, enabled=False),
    )
    sim.split_into_tribes(2)
    original_names = list(sim.tribe_names)

    sim._perform_swap(2, trigger_left=len(sim.players))
    assert sim.tribe_names[:2] == original_names

    sim._perform_swap(3, trigger_left=len(sim.players))
    assert sim.tribe_names[:2] == original_names
    assert len(sim.tribe_names) >= 3
    assert sim.tribe_names[2].casefold() not in {name.casefold() for name in original_names}


def test_swap_tribe_names_can_be_overridden_per_trigger() -> None:
    players = [Player(f"P{i}") for i in range(1, 13)]
    sim = SurvivorSimulator(
        players,
        config=GameConfig(seed=23, seed_starting_tribe_idols=False, seed_merge_idol=False),
        season_plan=SeasonPlan(
            starting_tribe_labels=["Luma", "Tavi"],
            swap_tribe_labels_by_remaining={12: ["", "Voro", "Sika"]},
            seed_starting_tribe_idols=False,
            seed_merge_idol=False,
        ),
        logger=Logger(logfile=None, enabled=False),
    )

    sim.split_into_tribes(2)
    sim._perform_swap(3, trigger_left=12)

    assert sim.tribe_names[:3] == ["Luma", "Voro", "Sika"]

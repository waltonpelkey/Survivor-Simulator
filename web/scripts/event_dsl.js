// Event DSL authoring guide:
// - `actors` binds contestants into the scene as names like `player1`.
// - `conditions` and `chance` are evaluated against those actors plus
//   `tribe_label`, `tribe_size`, `tribe_advantage_available`,
//   `relationship(playerA, playerB)`, `advantage_count(player)`, and `has_advantage(player)`.
// - `text.success` / `text.fail` can interpolate tokens like `{player1}`.
// - `effects` can change relationships, threat, tribe flags, and gameplay advantages.
// - `grant_game_advantage` supports temporary fields like `targetShield`,
//   `nomineeShield`, `challengeBonus`, `remainingTribals`, and `remainingChallenges`.

window.SURVIVOR_EVENT_DSL_LIBRARY = [
  // Premerge life
  {
    id: "solo_advantage_search",
    phase: "premerge",
    scope: "tribe",
    weight: 2,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 3",
      "tribe_advantage_available == true",
      "player1.strategy >= 4"
    ],
    chance: "0.05 + (player1.strategy * 0.06)",
    text: {
      success: "{player1} looks for an advantage in the bushes around camp and finds one, giving them extra safety at their next tribal council.",
      fail: "{player1} looks for an advantage in the bushes around camp but comes up empty."
    },
    effects: {
      success: [
        { type: "set_tribe_flag", key: "advantageAvailable", value: false },
        {
          type: "grant_game_advantage",
          player: "player1",
          label: "Camp Advantage",
          targetShield: 4,
          nomineeShield: true,
          remainingTribals: 1
        },
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "duo_advantage_search",
    phase: "premerge",
    scope: "tribe",
    weight: 1.5,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 4",
      "tribe_advantage_available == true",
      "player1.strategy >= 3",
      "player2.strategy >= 3",
      "relationship(player1, player2) >= 1"
    ],
    chance: "0.04 + ((player1.strategy + player2.strategy) * 0.05)",
    derived: {
      success: {
        finder: { type: "random_actor", choices: ["player1", "player2"] }
      }
    },
    text: {
      success: "{player1} and {player2} look for an advantage in the forest around camp together. {finder} ends up claiming it and gains extra safety at their next tribal council.",
      fail: "{player1} and {player2} look for an advantage in the forest around camp together, but they find nothing."
    },
    effects: {
      success: [
        { type: "set_tribe_flag", key: "advantageAvailable", value: false },
        {
          type: "grant_game_advantage",
          player: "finder",
          label: "Camp Advantage",
          targetShield: 4,
          nomineeShield: true,
          remainingTribals: 1
        },
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 }
      ]
    }
  },
  {
    id: "firewood_bonding",
    phase: "premerge",
    scope: "tribe",
    weight: 2.8,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "player1.social >= 2",
      "player2.social >= 2",
      "relationship(player1, player2) >= -1"
    ],
    chance: "0.34 + ((player1.social + player2.social) * 0.05)",
    text: {
      success: "{player1} and {player2} go to collect firewood together and come back feeling much tighter as allies.",
      fail: "{player1} and {player2} spend time gathering firewood together, but the conversation never really gets anywhere."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "shelter_builders",
    phase: "premerge",
    scope: "tribe",
    weight: 2.4,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "player1.challenge >= 3",
      "player2.challenge >= 3"
    ],
    chance: "0.26 + ((player1.challenge + player2.challenge) * 0.05)",
    text: {
      success: "{player1} and {player2} take the lead on improving the shelter, and the tribe appreciates the effort.",
      fail: "{player1} and {player2} try to improve the shelter, but the work turns messy and frustrating."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 },
        { type: "adjust_relationship_with_tribe", player: "player1", delta: 1, exclude: ["player2"] },
        { type: "adjust_relationship_with_tribe", player: "player2", delta: 1, exclude: ["player1"] }
      ],
      fail: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: -1 }
      ]
    }
  },
  {
    id: "provider_fishing_run",
    phase: "premerge",
    scope: "tribe",
    weight: 2.1,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "player1.challenge >= 3",
      "player2.challenge >= 2"
    ],
    chance: "0.22 + ((player1.challenge + player2.challenge) * 0.05)",
    derived: {
      success: {
        provider: { type: "random_actor", choices: ["player1", "player2"] }
      }
    },
    text: {
      success: "{player1} and {player2} head out to fish, and {provider} comes back having helped feed the tribe.",
      fail: "{player1} and {player2} spend hours trying to fish, but they return empty-handed."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 },
        { type: "adjust_relationship_with_tribe", player: "provider", delta: 1, exclude: ["player1", "player2"] },
        { type: "adjust_threat", player: "provider", delta: 1 },
        {
          type: "grant_game_advantage",
          player: "provider",
          label: "Provider Momentum",
          challengeBonus: 1,
          remainingChallenges: 1
        }
      ],
      fail: []
    }
  },
  {
    id: "camp_bonding",
    phase: "premerge",
    scope: "tribe",
    weight: 3,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "player1.social >= 3",
      "player2.social >= 3",
      "relationship(player1, player2) >= -1"
    ],
    chance: "0.35 + ((player1.social + player2.social) * 0.05)",
    text: {
      success: "{player1} and {player2} spend time together around camp and grow closer.",
      fail: "{player1} and {player2} try to connect around camp, but it never quite clicks."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "camp_story_circle",
    phase: "premerge",
    scope: "tribe",
    weight: 1.8,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] },
      player3: { source: "tribe_member", distinctFrom: ["player1", "player2"] }
    },
    conditions: [
      "tribe_size >= 4",
      "player1.social >= 3",
      "player2.social >= 3",
      "player3.social >= 2"
    ],
    chance: "0.2 + ((player1.social + player2.social + player3.social) * 0.04)",
    text: {
      success: "{player1}, {player2}, and {player3} open up to one another late at night, and the moment creates a real sense of trust.",
      fail: "{player1}, {player2}, and {player3} try to have a heartfelt camp conversation, but it feels a little forced."
    },
    effects: {
      success: [
        { type: "adjust_pairwise_relationships", players: ["player1", "player2", "player3"], delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "strategic_pitch",
    phase: "premerge",
    scope: "tribe",
    weight: 2.5,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "player1.strategy >= 4",
      "relationship(player1, player2) >= 0"
    ],
    chance: "0.2 + (player1.strategy * 0.08) + (Math.max(0, relationship(player1, player2)) * 0.03)",
    text: {
      success: "{player1} pulls {player2} aside to talk strategy, and the conversation lands well.",
      fail: "{player1} tries to pitch a plan to {player2}, but the idea does not fully stick."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 },
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: -1 }
      ]
    }
  },
  {
    id: "three_person_bloc_forms",
    phase: "premerge",
    scope: "tribe",
    weight: 1.8,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] },
      player3: { source: "tribe_member", distinctFrom: ["player1", "player2"] }
    },
    conditions: [
      "tribe_size >= 5",
      "player1.strategy >= 4",
      "player2.strategy >= 3",
      "player3.strategy >= 3",
      "relationship(player1, player2) >= 0",
      "relationship(player1, player3) >= 0"
    ],
    chance: "0.12 + ((player1.strategy + player2.strategy + player3.strategy) * 0.04)",
    text: {
      success: "{player1} quietly locks in something real with {player2} and {player3}, forming the bones of a voting bloc.",
      fail: "{player1} tries to organize something with {player2} and {player3}, but the numbers do not feel stable yet."
    },
    effects: {
      success: [
        { type: "adjust_pairwise_relationships", players: ["player1", "player2", "player3"], delta: 1 },
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "challenge_practice_pair",
    phase: "premerge",
    scope: "tribe",
    weight: 1.9,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "player1.challenge >= 3",
      "player2.challenge >= 3"
    ],
    chance: "0.24 + ((player1.challenge + player2.challenge) * 0.05)",
    derived: {
      success: {
        standout: { type: "random_actor", choices: ["player1", "player2"] }
      }
    },
    text: {
      success: "{player1} and {player2} spend time practicing puzzle and balance work around camp. {standout} looks especially sharp heading into the next challenge.",
      fail: "{player1} and {player2} try to practice for the next challenge, but it does not translate into much confidence."
    },
    effects: {
      success: [
        {
          type: "grant_game_advantage",
          player: "standout",
          label: "Challenge Prep",
          challengeBonus: 2,
          remainingChallenges: 1
        },
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "homesick_comfort",
    phase: "premerge",
    scope: "tribe",
    weight: 1.6,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "player2.social >= 3"
    ],
    chance: "0.2 + (player2.social * 0.07)",
    text: {
      success: "{player1} has a rough moment missing home, and {player2} is there to steady them.",
      fail: "{player1} opens up to {player2}, but the exchange feels awkward more than comforting."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: -1 }
      ]
    }
  },
  {
    id: "workhorse_gains_respect",
    phase: "premerge",
    scope: "tribe",
    weight: 1.8,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 3",
      "player1.challenge >= 4"
    ],
    chance: "0.16 + (player1.challenge * 0.07)",
    text: {
      success: "{player1} works nonstop around camp, and that effort does not go unnoticed by the tribe.",
      fail: "{player1} throws themself into camp work, but the gesture does not really change how anyone feels."
    },
    effects: {
      success: [
        { type: "adjust_relationship_with_tribe", player: "player1", delta: 1 },
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "bossiness_rubs_people_wrong",
    phase: "premerge",
    scope: "tribe",
    weight: 1.5,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 4",
      "player1.strategy >= 4",
      "player1.social <= 3"
    ],
    chance: "0.12 + (player1.strategy * 0.05)",
    text: {
      success: "{player1} gets a little too directive around camp, and several tribemates start to bristle at it.",
      fail: "{player1} starts to take charge around camp, but manages not to make it a problem."
    },
    effects: {
      success: [
        { type: "adjust_relationship_with_tribe", player: "player1", delta: -1 },
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "rice_portion_argument",
    phase: "premerge",
    scope: "tribe",
    weight: 1.4,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 4",
      "relationship(player1, player2) <= 1"
    ],
    chance: "0.16 + (Math.max(player1.strategy, player2.strategy) * 0.04)",
    text: {
      success: "{player1} and {player2} clash over camp chores and rice portions, and the tension becomes hard to ignore.",
      fail: "{player1} and {player2} nearly get into it over rice and camp work, but the moment passes."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: -2 }
      ],
      fail: []
    }
  },
  {
    id: "camp_argument",
    phase: "premerge",
    scope: "tribe",
    weight: 1.5,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "relationship(player1, player2) <= 0"
    ],
    chance: "0.18 + (Math.max(player1.strategy, player2.strategy) * 0.04)",
    text: {
      success: "{player1} and {player2} get into a tense disagreement around camp.",
      fail: "{player1} and {player2} nearly spark an argument, but it fizzles out before it becomes a real issue."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: -2 }
      ],
      fail: []
    }
  },
  {
    id: "fake_advantage_bluff",
    phase: "premerge",
    scope: "tribe",
    weight: 1.2,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 4",
      "player1.strategy >= 4",
      "relationship(player1, player2) >= -1",
      "has_advantage(player1) == false"
    ],
    chance: "0.08 + (player1.strategy * 0.05)",
    text: {
      success: "{player1} lets just enough information slip to make {player2} think they might have an advantage, buying a little breathing room.",
      fail: "{player1} tries to hint that they may have something up their sleeve, but {player2} does not seem convinced."
    },
    effects: {
      success: [
        {
          type: "grant_game_advantage",
          player: "player1",
          label: "Bluff Protection",
          targetShield: 2,
          remainingTribals: 1
        },
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "night_search_causes_suspicion",
    phase: "premerge",
    scope: "tribe",
    weight: 1.3,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 4",
      "player1.strategy >= 3"
    ],
    chance: "0.1 + (player1.strategy * 0.04)",
    text: {
      success: "{player1} slips off on a late-night search, and even without finding anything the move leaves people suspicious.",
      fail: "{player1} sneaks away from camp for a bit, but no one seems to notice."
    },
    effects: {
      success: [
        { type: "adjust_relationship_with_tribe", player: "player1", delta: -1 },
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },

  // Swap and demerge turbulence
  {
    id: "swap_old_bond_reconnects",
    phase: "swapped",
    scope: "tribe",
    weight: 1.8,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 4",
      "player1.originalTribeLabel == player2.originalTribeLabel",
      "relationship(player1, player2) >= 0"
    ],
    chance: "0.24 + (Math.max(relationship(player1, player2), 0) * 0.05)",
    text: {
      success: "{player1} and {player2} find each other after the swap and quickly re-establish trust.",
      fail: "{player1} and {player2} try to reconnect after the swap, but the new numbers make things feel uncertain."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "swap_cross_tribe_mistrust",
    phase: "swapped",
    scope: "tribe",
    weight: 1.7,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 4",
      "player1.originalTribeLabel != player2.originalTribeLabel",
      "relationship(player1, player2) <= 1"
    ],
    chance: "0.18 + (Math.max(player1.strategy, player2.strategy) * 0.04)",
    text: {
      success: "{player1} and {player2} come from opposite original tribes, and neither seems willing to fully trust the other.",
      fail: "{player1} and {player2} eye each other carefully after the swap, but the tension does not boil over."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: -2 }
      ],
      fail: []
    }
  },
  {
    id: "swap_numbers_scramble",
    phase: "swapped",
    scope: "tribe",
    weight: 1.6,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] },
      player3: { source: "tribe_member", distinctFrom: ["player1", "player2"] }
    },
    conditions: [
      "tribe_size >= 5",
      "player1.strategy >= 4",
      "player2.strategy >= 3",
      "player3.strategy >= 3"
    ],
    chance: "0.12 + ((player1.strategy + player2.strategy + player3.strategy) * 0.04)",
    text: {
      success: "{player1} works overtime after the swap and manages to settle on a fragile plan with {player2} and {player3}.",
      fail: "{player1} tries to sort out the post-swap numbers with {player2} and {player3}, but the structure still feels shaky."
    },
    effects: {
      success: [
        { type: "adjust_pairwise_relationships", players: ["player1", "player2", "player3"], delta: 1 },
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "demerge_fresh_start",
    phase: "demerged",
    scope: "tribe",
    weight: 1.6,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "relationship(player1, player2) >= -1"
    ],
    chance: "0.22 + ((player1.social + player2.social) * 0.04)",
    text: {
      success: "{player1} and {player2} treat the demerge like a clean slate and find themselves working surprisingly well together.",
      fail: "{player1} and {player2} try to use the demerge as a reset point, but old concerns still linger."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },

  // Merge life
  {
    id: "merge_beach_reconnection",
    phase: "merged",
    scope: "tribe",
    weight: 2.2,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.social >= 3",
      "player2.social >= 3"
    ],
    chance: "0.22 + ((player1.social + player2.social) * 0.05)",
    text: {
      success: "{player1} and {player2} reconnect on the merged beach and realize they may still be valuable to one another.",
      fail: "{player1} and {player2} catch up after the merge, but the conversation stays mostly surface level."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "merge_feast_storytime",
    phase: "merged",
    scope: "tribe",
    weight: 1.7,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] },
      player3: { source: "tribe_member", distinctFrom: ["player1", "player2"] }
    },
    conditions: [
      "tribe_size >= 7",
      "player1.social >= 3",
      "player2.social >= 3",
      "player3.social >= 3"
    ],
    chance: "0.14 + ((player1.social + player2.social + player3.social) * 0.04)",
    text: {
      success: "{player1}, {player2}, and {player3} settle into an easy rhythm at camp after the merge, and the vibe starts to feel important.",
      fail: "{player1}, {player2}, and {player3} spend time together at the merged camp, but the new social web still feels hard to read."
    },
    effects: {
      success: [
        { type: "adjust_pairwise_relationships", players: ["player1", "player2", "player3"], delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "merge_paranoia_spreads",
    phase: "merged",
    scope: "tribe",
    weight: 2,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.strategy >= 4"
    ],
    chance: "0.14 + (player1.strategy * 0.05)",
    text: {
      success: "{player1} starts spiraling over where the votes may be landing, and that paranoia leaks into the rest of camp.",
      fail: "{player1} grows nervous about the vote, but manages to keep the anxiety mostly contained."
    },
    effects: {
      success: [
        { type: "adjust_relationship_with_tribe", player: "player1", delta: -1 },
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "challenge_beast_target_grows",
    phase: "merged",
    scope: "tribe",
    weight: 1.7,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.challenge >= 4"
    ],
    chance: "0.14 + (player1.challenge * 0.05)",
    text: {
      success: "{player1}'s challenge ability becomes hard to ignore now that the merge is on, and people start looking at them differently.",
      fail: "{player1}'s challenge reputation comes up at camp, but the target does not fully form around them yet."
    },
    effects: {
      success: [
        { type: "adjust_relationship_with_tribe", player: "player1", delta: -1 },
        { type: "adjust_threat", player: "player1", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "underdogs_compare_notes",
    phase: "merged",
    scope: "tribe",
    weight: 2,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.strategy >= 3",
      "player2.strategy >= 3",
      "relationship(player1, player2) >= -1"
    ],
    chance: "0.18 + ((player1.strategy + player2.strategy) * 0.05)",
    text: {
      success: "{player1} and {player2} compare notes and realize the power structure may not be as fixed as it seems.",
      fail: "{player1} and {player2} talk numbers, but cannot quite decide whether they really trust each other enough to move."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "meat_shield_conversation",
    phase: "merged",
    scope: "tribe",
    weight: 1.5,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.strategy >= 4",
      "player2.threat >= 3",
      "relationship(player1, player2) >= 0"
    ],
    chance: "0.12 + ((player1.strategy + player2.threat) * 0.05)",
    text: {
      success: "{player1} pitches a meat-shield style arrangement to {player2}, and both can see why keeping big threats around might help for now.",
      fail: "{player1} tries to sell {player2} on a shield arrangement, but the logic does not fully land."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 },
        {
          type: "grant_game_advantage",
          player: "player2",
          label: "Meat Shield Cover",
          targetShield: 2,
          remainingTribals: 1
        }
      ],
      fail: []
    }
  },
  {
    id: "jury_management_chat",
    phase: "merged",
    scope: "tribe",
    weight: 1.6,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.social >= 4",
      "player1.strategy >= 3"
    ],
    chance: "0.12 + ((player1.social + player1.strategy) * 0.05)",
    text: {
      success: "{player1} has a measured conversation with {player2} that feels less about this vote and more about long-term positioning.",
      fail: "{player1} tries to smooth things over with {player2}, but the interaction feels more gamey than genuine."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 },
        { type: "adjust_threat", player: "player1", delta: -1 }
      ],
      fail: []
    }
  },
  {
    id: "live_tribal_whisper_chain",
    phase: "merged",
    scope: "tribe",
    weight: 1.5,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] },
      player3: { source: "tribe_member", distinctFrom: ["player1", "player2"] }
    },
    conditions: [
      "tribe_size >= 7",
      "player1.strategy >= 4",
      "player2.strategy >= 3",
      "player3.strategy >= 3"
    ],
    chance: "0.1 + ((player1.strategy + player2.strategy + player3.strategy) * 0.04)",
    text: {
      success: "{player1} sparks a rapid whisper network with {player2} and {player3}, and suddenly the vote feels more fluid than it did a few minutes ago.",
      fail: "{player1} tries to stir up a late whisper scramble with {player2} and {player3}, but the urgency never quite catches."
    },
    effects: {
      success: [
        { type: "adjust_pairwise_relationships", players: ["player1", "player2", "player3"], delta: 1 },
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "merge_sleeping_spot_dispute",
    phase: "merged",
    scope: "tribe",
    weight: 1.2,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 6",
      "relationship(player1, player2) <= 0"
    ],
    chance: "0.14 + (Math.max(player1.social, player2.social) * 0.03)",
    text: {
      success: "{player1} and {player2} get on each other's nerves around camp, and even something as small as where to sleep turns into a problem.",
      fail: "{player1} and {player2} irritate one another around camp, but the friction never becomes an open conflict."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: -2 }
      ],
      fail: []
    }
  },
  {
    id: "challenge_focus_session",
    phase: "merged",
    scope: "tribe",
    weight: 1.4,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.challenge >= 4"
    ],
    chance: "0.16 + (player1.challenge * 0.05)",
    text: {
      success: "{player1} spends the day mentally resetting for the next immunity challenge and looks locked in.",
      fail: "{player1} tries to center themself before the next challenge, but it does not seem to create much momentum."
    },
    effects: {
      success: [
        {
          type: "grant_game_advantage",
          player: "player1",
          label: "Challenge Focus",
          challengeBonus: 2,
          remainingChallenges: 1
        }
      ],
      fail: []
    }
  },
  {
    id: "name_starts_circulating",
    phase: "merged",
    scope: "tribe",
    weight: 1.8,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.threat >= 4"
    ],
    chance: "0.14 + (player1.threat * 0.05)",
    text: {
      success: "{player1}'s name starts floating more openly around camp, and they can feel the heat building.",
      fail: "{player1} gets a little nervous that their name is out there, but nothing concrete seems to lock in."
    },
    effects: {
      success: [
        { type: "adjust_relationship_with_tribe", player: "player1", delta: -1 },
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "idol_holder_gets_spooked",
    phase: "merged",
    scope: "tribe",
    weight: 1.3,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 6",
      "has_advantage(player1) == true",
      "player2.strategy >= 3"
    ],
    chance: "0.12 + (player2.strategy * 0.05)",
    text: {
      success: "{player2} says just enough to make {player1} wonder whether their advantage may need to come into play soon.",
      fail: "{player2} tries to rattle {player1}, but {player1} does not seem especially moved by it."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: -1 },
        {
          type: "grant_game_advantage",
          player: "player1",
          label: "Paranoia Protection",
          targetShield: 2,
          remainingTribals: 1
        }
      ],
      fail: []
    }
  },
  {
    id: "goat_shield_talk",
    phase: "merged",
    scope: "tribe",
    weight: 1.2,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.strategy >= 4",
      "player2.social <= 3"
    ],
    chance: "0.1 + (player1.strategy * 0.05)",
    text: {
      success: "{player1} quietly decides that keeping {player2} around may be useful deeper into the game, and starts treating them as an asset rather than a target.",
      fail: "{player1} considers whether {player2} could be useful later, but never fully acts on the instinct."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 },
        { type: "adjust_threat", player: "player1", delta: -1 }
      ],
      fail: []
    }
  },
  {
    id: "provider_still_valuable_at_merge",
    phase: "merged",
    scope: "tribe",
    weight: 1.3,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.challenge >= 4"
    ],
    chance: "0.1 + (player1.challenge * 0.05)",
    text: {
      success: "{player1} remains one of the most useful people around camp even after the merge, and that buys them a little goodwill.",
      fail: "{player1} keeps trying to be useful around camp, but the merge dynamics make that hard to convert into trust."
    },
    effects: {
      success: [
        { type: "adjust_relationship_with_tribe", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },

  // Late-game intensity
  {
    id: "final_numbers_lock_in",
    phase: "merged",
    scope: "tribe",
    weight: 1.5,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] },
      player3: { source: "tribe_member", distinctFrom: ["player1", "player2"] }
    },
    conditions: [
      "tribe_size <= 7",
      "tribe_size >= 5",
      "player1.strategy >= 4",
      "player2.strategy >= 3",
      "player3.strategy >= 3"
    ],
    chance: "0.12 + ((player1.strategy + player2.strategy + player3.strategy) * 0.04)",
    text: {
      success: "{player1}, {player2}, and {player3} start talking in a way that makes it feel like the endgame is beginning to take shape.",
      fail: "{player1}, {player2}, and {player3} compare late-game options, but no one wants to commit too hard just yet."
    },
    effects: {
      success: [
        { type: "adjust_pairwise_relationships", players: ["player1", "player2", "player3"], delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "endgame_betrayal_fear",
    phase: "merged",
    scope: "tribe",
    weight: 1.4,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size <= 7",
      "player1.strategy >= 4",
      "relationship(player1, player2) >= 1"
    ],
    chance: "0.12 + (player1.strategy * 0.05)",
    text: {
      success: "{player1} starts to wonder whether {player2} could cut them late, and it changes the tone of their relationship.",
      fail: "{player1} briefly worries about what {player2} might do late in the game, but decides not to overreact."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: -1 }
      ],
      fail: []
    }
  },
  {
    id: "endgame_underdog_push",
    phase: "merged",
    scope: "tribe",
    weight: 1.5,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size <= 7",
      "player1.strategy >= 3",
      "player2.strategy >= 3",
      "relationship(player1, player2) >= 0"
    ],
    chance: "0.16 + ((player1.strategy + player2.strategy) * 0.05)",
    text: {
      success: "{player1} and {player2} sense the game tightening and begin talking seriously about making a move before it is too late.",
      fail: "{player1} and {player2} flirt with the idea of an endgame strike, but neither seems ready to be the first to jump."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "late_game_clutch_focus",
    phase: "merged",
    scope: "tribe",
    weight: 1.2,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size <= 6",
      "player1.challenge >= 3"
    ],
    chance: "0.18 + (player1.challenge * 0.05)",
    text: {
      success: "{player1} can feel the game narrowing and sharpens their focus for the next critical challenge.",
      fail: "{player1} tries to get into the right headspace for the next challenge, but the nerves are still there."
    },
    effects: {
      success: [
        {
          type: "grant_game_advantage",
          player: "player1",
          label: "Clutch Focus",
          challengeBonus: 2,
          remainingChallenges: 1
        }
      ],
      fail: []
    }
  },
  {
    id: "late_game_social_repair",
    phase: "merged",
    scope: "tribe",
    weight: 1.3,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size <= 6",
      "player1.social >= 4",
      "relationship(player1, player2) <= 0"
    ],
    chance: "0.14 + (player1.social * 0.06)",
    text: {
      success: "{player1} recognizes that every relationship matters now and makes a real effort to repair things with {player2}.",
      fail: "{player1} tries to patch things up with {player2}, but the history between them is still hard to shake."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "beach_walk_bonding",
    phase: "premerge",
    scope: "tribe",
    weight: 2.2,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "player1.social >= 2",
      "player2.social >= 2",
      "relationship(player1, player2) >= -1"
    ],
    chance: "0.24 + ((player1.social + player2.social) * 0.05)",
    text: {
      success: "{player1} and {player2} drift down the beach together and come back feeling much more naturally connected.",
      fail: "{player1} and {player2} try to get away for a beach walk, but the conversation stays polite instead of meaningful."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "water_run_gossip",
    phase: "premerge",
    scope: "tribe",
    weight: 2.1,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "player1.social >= 3",
      "player2.strategy >= 2"
    ],
    chance: "0.21 + ((player1.social + player2.strategy) * 0.05)",
    text: {
      success: "{player1} and {player2} head to the well together and the light gossip quietly turns into real strategic trust.",
      fail: "{player1} and {player2} spend a water run trading surface-level chatter, but neither really gives much away."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "morning_energy_annoys_tribe",
    phase: "premerge",
    scope: "tribe",
    weight: 1.6,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 4",
      "player1.social <= 3"
    ],
    chance: "0.14 + ((6 - player1.social) * 0.05)",
    text: {
      success: "{player1} comes into the morning with a lot of energy, but the tribe mostly experiences it as a little too much.",
      fail: "{player1} tries to rally camp early, but the moment passes without really affecting anything."
    },
    effects: {
      success: [
        { type: "adjust_relationship_with_tribe", player: "player1", delta: -1 }
      ],
      fail: []
    }
  },
  {
    id: "provider_overpromises",
    phase: "premerge",
    scope: "tribe",
    weight: 1.5,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 4",
      "player1.challenge >= 3"
    ],
    chance: "0.12 + (player1.challenge * 0.04)",
    text: {
      success: "{player1} talks a big game about what they are going to provide, but the tribe starts feeling like the promises are outpacing the results.",
      fail: "{player1} tries to position themselves as a provider, but no one seems especially moved one way or the other."
    },
    effects: {
      success: [
        { type: "adjust_relationship_with_tribe", player: "player1", delta: -1 },
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "comic_relief_bond",
    phase: "premerge",
    scope: "tribe",
    weight: 1.9,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "player1.social >= 3",
      "player2.social >= 2"
    ],
    chance: "0.22 + ((player1.social + player2.social) * 0.05)",
    text: {
      success: "{player1} gets {player2} laughing around camp, and the silly little moment ends up building real warmth.",
      fail: "{player1} tries to keep camp loose with {player2}, but the vibe is too tense for the joke to land."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "rainstorm_shelter_scramble",
    phase: "premerge",
    scope: "tribe",
    weight: 2,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] },
      player3: { source: "tribe_member", distinctFrom: ["player1", "player2"] }
    },
    conditions: [
      "tribe_size >= 4",
      "player1.challenge >= 2",
      "player2.challenge >= 2",
      "player3.challenge >= 2"
    ],
    chance: "0.16 + ((player1.challenge + player2.challenge + player3.challenge) * 0.04)",
    text: {
      success: "{player1}, {player2}, and {player3} scramble during a rough stretch of weather and end up earning real credit from camp.",
      fail: "{player1}, {player2}, and {player3} try to hold things together in bad weather, but the shelter scramble mostly creates more irritation."
    },
    effects: {
      success: [
        { type: "adjust_pairwise_relationships", players: ["player1", "player2", "player3"], delta: 1 }
      ],
      fail: [
        { type: "adjust_pairwise_relationships", players: ["player1", "player2", "player3"], delta: -1 }
      ]
    }
  },
  {
    id: "secret_signal_between_allies",
    phase: "premerge",
    scope: "tribe",
    weight: 1.4,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 4",
      "relationship(player1, player2) >= 2",
      "player1.strategy >= 3"
    ],
    chance: "0.16 + ((player1.strategy + player2.social) * 0.05)",
    text: {
      success: "{player1} and {player2} settle into a quiet little communication rhythm that makes them feel even more locked in.",
      fail: "{player1} tries to establish a subtle rhythm with {player2}, but it just feels too forced to matter."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "loner_creeps_people_out",
    phase: "premerge",
    scope: "tribe",
    weight: 1.6,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 4",
      "player1.social <= 2"
    ],
    chance: "0.16 + ((5 - player1.social) * 0.05)",
    text: {
      success: "{player1} keeps slipping off alone, and the tribe starts reading more into it than they probably should.",
      fail: "{player1} spends a little time apart from camp, but nobody seems to care very much."
    },
    effects: {
      success: [
        { type: "adjust_relationship_with_tribe", player: "player1", delta: -1 },
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "unexpected_pairing_improves",
    phase: "premerge",
    scope: "tribe",
    weight: 1.9,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "relationship(player1, player2) <= 0"
    ],
    chance: "0.18 + ((player1.social + player2.social) * 0.05)",
    text: {
      success: "{player1} and {player2} end up working together almost by accident, and both leave the moment with a better read on each other.",
      fail: "{player1} and {player2} try to bridge a gap around camp, but the connection still feels off."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "challenge_beast_downplays_talent",
    phase: "premerge",
    scope: "tribe",
    weight: 1.4,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "player1.challenge >= 4",
      "player2.social >= 2"
    ],
    chance: "0.16 + ((player1.challenge + player2.social) * 0.04)",
    text: {
      success: "{player1} quietly downplays their challenge ability to {player2}, hoping not to become the obvious physical threat too early.",
      fail: "{player1} tries to seem smaller to {player2}, but the effort reads more awkward than convincing."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 },
        { type: "adjust_threat", player: "player1", delta: -1 }
      ],
      fail: []
    }
  },
  {
    id: "swap_old_story_reconnect",
    phase: "swapped",
    scope: "tribe",
    weight: 1.7,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "relationship(player1, player2) >= 1"
    ],
    chance: "0.18 + ((player1.social + player2.social) * 0.05)",
    text: {
      success: "{player1} and {player2} reconnect through an old shared camp story, and the familiarity quickly matters on the swapped tribe.",
      fail: "{player1} and {player2} try to lean on an old connection after the swap, but the vibe around the new tribe still feels too unstable."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "swap_majority_bluff",
    phase: "swapped",
    scope: "tribe",
    weight: 1.5,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 4",
      "player1.strategy >= 4"
    ],
    chance: "0.12 + (player1.strategy * 0.05)",
    text: {
      success: "{player1} confidently sells {player2} on the idea that the numbers are already there, even though the truth is much murkier.",
      fail: "{player1} tries to bluff certainty to {player2}, but the shaky details make the pitch hard to buy."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 }
      ],
      fail: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: -1 }
      ]
    }
  },
  {
    id: "swap_cross_tribe_respect",
    phase: "swapped",
    scope: "tribe",
    weight: 1.6,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "player1.challenge >= 3",
      "player2.challenge >= 3"
    ],
    chance: "0.17 + ((player1.challenge + player2.challenge) * 0.05)",
    text: {
      success: "{player1} and {player2} find a surprising amount of mutual respect on the swapped tribe and start taking each other more seriously.",
      fail: "{player1} and {player2} try to connect through work and challenge prep, but the new tribe still feels too segmented."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "demerge_old_rivalry_returns",
    phase: "demerged",
    scope: "tribe",
    weight: 1.5,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "relationship(player1, player2) <= 0"
    ],
    chance: "0.15 + ((6 - player1.social) * 0.04)",
    text: {
      success: "{player1} and {player2} fall right back into an old discomfort after the demerge, and the reset suddenly feels much less fresh.",
      fail: "{player1} braces for the old tension with {player2} after the demerge, but the interaction never really escalates."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: -2 }
      ],
      fail: []
    }
  },
  {
    id: "merge_food_sharing_bond",
    phase: "merged",
    scope: "tribe",
    weight: 1.8,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.social >= 3",
      "player2.social >= 2"
    ],
    chance: "0.18 + ((player1.social + player2.social) * 0.05)",
    text: {
      success: "{player1} quietly shares what little they have with {player2}, and the small gesture lands bigger than either expected.",
      fail: "{player1} tries to build a little goodwill with {player2}, but the merged camp is too suspicious for the gesture to travel far."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "merge_public_credit_backfires",
    phase: "merged",
    scope: "tribe",
    weight: 1.4,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.social <= 4"
    ],
    chance: "0.12 + ((6 - player1.social) * 0.04)",
    text: {
      success: "{player1} talks a little too openly about everything they have done to get here, and the merged tribe starts hearing it as self-congratulation.",
      fail: "{player1} reflects a little on their game around camp, but nobody seems especially bothered."
    },
    effects: {
      success: [
        { type: "adjust_relationship_with_tribe", player: "player1", delta: -1 },
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "merge_sleeper_threat_realized",
    phase: "merged",
    scope: "tribe",
    weight: 1.6,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 7",
      "player1.social >= 4",
      "player2.strategy >= 3"
    ],
    chance: "0.15 + ((player1.social + player2.strategy) * 0.04)",
    text: {
      success: "{player2} starts to realize just how naturally liked {player1} is, and the discovery subtly changes how they see the board.",
      fail: "{player2} tries to get a read on {player1}'s social game, but the insight never quite sharpens into anything useful."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player2", b: "player1", delta: -1 },
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "merge_night_watch_conspiracy",
    phase: "merged",
    scope: "tribe",
    weight: 1.5,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] },
      player3: { source: "tribe_member", distinctFrom: ["player1", "player2"] }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.strategy >= 3",
      "player2.strategy >= 3",
      "player3.strategy >= 2"
    ],
    chance: "0.12 + ((player1.strategy + player2.strategy + player3.strategy) * 0.04)",
    text: {
      success: "{player1}, {player2}, and {player3} linger awake late enough for the conversation to stop being casual and start becoming dangerous.",
      fail: "{player1}, {player2}, and {player3} stay up late talking, but the energy never fully clicks into a plan."
    },
    effects: {
      success: [
        { type: "adjust_pairwise_relationships", players: ["player1", "player2", "player3"], delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "merge_fake_peace_offer",
    phase: "merged",
    scope: "tribe",
    weight: 1.4,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.strategy >= 4",
      "relationship(player1, player2) <= 0"
    ],
    chance: "0.11 + (player1.strategy * 0.05)",
    text: {
      success: "{player1} extends a very polished peace offering to {player2}, but the warmth feels more strategic than genuine.",
      fail: "{player1} tries to smooth things over with {player2}, but the attempt comes off too transparent to do much."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 }
      ],
      fail: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: -1 }
      ]
    }
  },
  {
    id: "merge_majority_gets_lazy",
    phase: "merged",
    scope: "tribe",
    weight: 1.3,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 7",
      "player1.strategy >= 3",
      "player2.strategy >= 3",
      "relationship(player1, player2) >= 1"
    ],
    chance: "0.12 + ((player1.strategy + player2.strategy) * 0.04)",
    text: {
      success: "{player1} and {player2} notice that some people are starting to get comfortable with the numbers, and both immediately think that kind of laziness can be punished.",
      fail: "{player1} and {player2} talk about whether anyone is getting too comfortable, but the read still feels murky."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "merge_floating_middle_confidence",
    phase: "merged",
    scope: "tribe",
    weight: 1.6,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 7",
      "player1.social >= 4",
      "player1.strategy >= 3"
    ],
    chance: "0.14 + ((player1.social + player1.strategy) * 0.04)",
    text: {
      success: "{player1} realizes they are hearing from almost everyone and starts to understand how powerful the middle can be.",
      fail: "{player1} senses they may be positioned well between groups, but the feeling is still more instinct than certainty."
    },
    effects: {
      success: [
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "merge_old_vote_regret",
    phase: "merged",
    scope: "tribe",
    weight: 1.4,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 6",
      "relationship(player1, player2) <= 1"
    ],
    chance: "0.14 + ((player1.social + player2.social) * 0.04)",
    text: {
      success: "{player1} admits a little regret to {player2} about an earlier vote, and the honesty unexpectedly softens something between them.",
      fail: "{player1} tries to revisit old history with {player2}, but the conversation never really finds solid footing."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "merge_camouflage_plan",
    phase: "merged",
    scope: "tribe",
    weight: 1.4,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.strategy >= 4",
      "relationship(player1, player2) >= 0"
    ],
    chance: "0.13 + (player1.strategy * 0.05)",
    text: {
      success: "{player1} tells {player2} that the smartest move right now may be to act smaller than they really are, and the idea resonates.",
      fail: "{player1} pitches a quieter, lower-profile path to {player2}, but it sounds a little too cautious to be inspiring."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 },
        { type: "adjust_threat", player: "player1", delta: -1 }
      ],
      fail: []
    }
  },
  {
    id: "merge_trust_test",
    phase: "merged",
    scope: "tribe",
    weight: 1.5,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.strategy >= 3",
      "relationship(player1, player2) >= 1"
    ],
    chance: "0.15 + ((player1.strategy + player2.social) * 0.04)",
    text: {
      success: "{player1} quietly tests how much they can really trust {player2}, and the answer makes them feel better than expected.",
      fail: "{player1} probes a little with {player2}, but the response only leaves more room for doubt."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: -1 }
      ]
    }
  },
  {
    id: "merge_bigmove_hype",
    phase: "merged",
    scope: "tribe",
    weight: 1.3,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.strategy >= 4"
    ],
    chance: "0.13 + (player1.strategy * 0.05)",
    text: {
      success: "{player1} starts talking like the game is begging for a move, and the restless energy begins to spread.",
      fail: "{player1} tries to inject a little big-move energy into camp, but most people still seem more interested in caution."
    },
    effects: {
      success: [
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "final_six_loyalty_crack",
    phase: "merged",
    scope: "tribe",
    weight: 1.5,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size <= 6",
      "relationship(player1, player2) >= 1"
    ],
    chance: "0.14 + ((player1.strategy + player2.strategy) * 0.04)",
    text: {
      success: "{player1} and {player2} both realize the endgame is close enough that loyalty suddenly feels a lot less simple than it did before.",
      fail: "{player1} and {player2} try to talk honestly about endgame loyalty, but neither seems ready to say the dangerous part out loud."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "late_game_finale_resume_pitch",
    phase: "merged",
    scope: "tribe",
    weight: 1.2,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size <= 6",
      "player1.strategy >= 4"
    ],
    chance: "0.12 + (player1.strategy * 0.05)",
    text: {
      success: "{player1} starts thinking very consciously about what their endgame story sounds like, and it changes the way they approach camp.",
      fail: "{player1} tries to picture how the jury might see their path, but the image is still too fuzzy to guide much."
    },
    effects: {
      success: [
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "late_game_goat_fear",
    phase: "merged",
    scope: "tribe",
    weight: 1.3,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size <= 6",
      "player1.strategy >= 3",
      "player2.strategy >= 3"
    ],
    chance: "0.13 + ((player1.strategy + player2.strategy) * 0.05)",
    text: {
      success: "{player1} worries to {player2} that somebody is going to get dragged to the end as an easy beat, and neither likes what that says about the board.",
      fail: "{player1} raises the ugly possibility of an easy endgame goat to {player2}, but the read never fully crystallizes."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "late_game_firemaking_shadow",
    phase: "merged",
    scope: "tribe",
    weight: 1.2,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size <= 5",
      "player1.challenge >= 2",
      "player2.challenge >= 2"
    ],
    chance: "0.12 + ((player1.challenge + player2.challenge) * 0.04)",
    text: {
      success: "{player1} and {player2} spend a little time thinking about fire-making, because the end is finally close enough that it no longer feels theoretical.",
      fail: "{player1} and {player2} bring up fire-making for a moment, but the topic still feels too scary to sit with for long."
    },
    effects: {
      success: [
        {
          type: "grant_game_advantage",
          player: "player1",
          label: "Fire Practice",
          challengeBonus: 1,
          remainingChallenges: 1
        }
      ],
      fail: []
    }
  },
  {
    id: "late_game_last_minute_bond",
    phase: "merged",
    scope: "tribe",
    weight: 1.3,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size <= 5",
      "player1.social >= 3",
      "player2.social >= 3"
    ],
    chance: "0.14 + ((player1.social + player2.social) * 0.05)",
    text: {
      success: "{player1} and {player2} find one more genuine point of connection at exactly the part of the game where those moments become dangerous.",
      fail: "{player1} and {player2} try to connect late in the game, but everything now feels a little too loaded."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "late_game_control_slips",
    phase: "merged",
    scope: "tribe",
    weight: 1.4,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size <= 6",
      "player1.strategy >= 4"
    ],
    chance: "0.11 + (player1.strategy * 0.05)",
    text: {
      success: "{player1} can feel parts of the board slipping out of their control, and the loss of certainty makes them noticeably sharper.",
      fail: "{player1} senses the endgame tightening in complicated ways, but they still cannot quite identify the exact danger."
    },
    effects: {
      success: [
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "late_game_mercy_pitch",
    phase: "merged",
    scope: "tribe",
    weight: 1.1,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size <= 5",
      "player1.social >= 3",
      "relationship(player1, player2) >= 0"
    ],
    chance: "0.11 + ((player1.social + player2.social) * 0.04)",
    text: {
      success: "{player1} makes a softer, more human pitch to {player2} about the endgame, hoping emotion can do what pure strategy no longer can.",
      fail: "{player1} tries to connect with {player2} on a more emotional level, but this late in the game even honesty feels strategic."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "seashell_collection_bond",
    phase: "premerge",
    scope: "tribe",
    weight: 1.8,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "player1.social >= 2",
      "player2.social >= 2"
    ],
    chance: "0.22 + ((player1.social + player2.social) * 0.05)",
    text: {
      success: "{player1} and {player2} wander the shoreline collecting odd shells and drift into an unexpectedly warm conversation.",
      fail: "{player1} and {player2} spend a little time poking around the beach together, but the moment never becomes much."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "camp_impression_game",
    phase: "premerge",
    scope: "tribe",
    weight: 1.6,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] },
      player3: { source: "tribe_member", distinctFrom: ["player1", "player2"] }
    },
    conditions: [
      "tribe_size >= 4",
      "player1.social >= 3",
      "player2.social >= 2",
      "player3.social >= 2"
    ],
    chance: "0.18 + ((player1.social + player2.social + player3.social) * 0.04)",
    text: {
      success: "{player1} starts doing goofy impressions around camp, and {player2} and {player3} end up laughing hard enough for the whole tribe mood to lift.",
      fail: "{player1} tries to get a silly impression bit going with {player2} and {player3}, but camp is not really in a playful mood."
    },
    effects: {
      success: [
        { type: "adjust_pairwise_relationships", players: ["player1", "player2", "player3"], delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "nickname_attempt_lands",
    phase: "premerge",
    scope: "tribe",
    weight: 1.4,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "player1.social >= 3"
    ],
    chance: "0.16 + (player1.social * 0.05)",
    text: {
      success: "{player1} starts calling {player2} by a goofy little nickname, and somehow it actually helps the two feel closer instead of annoyed.",
      fail: "{player1} tries to stick {player2} with a nickname around camp, but it mostly lands with a polite stare."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 }
      ],
      fail: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: -1 }
      ]
    }
  },
  {
    id: "stargazing_connection",
    phase: "premerge",
    scope: "tribe",
    weight: 1.9,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "player1.social >= 2",
      "player2.social >= 2"
    ],
    chance: "0.2 + ((player1.social + player2.social) * 0.05)",
    text: {
      success: "{player1} and {player2} end up staring out at the night sky together, and the quiet turns into one of those surprisingly meaningful camp moments.",
      fail: "{player1} and {player2} spend a quiet stretch of the night together, but neither really opens up enough for it to stick."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "beach_art_project",
    phase: "premerge",
    scope: "tribe",
    weight: 1.4,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] },
      player3: { source: "tribe_member", distinctFrom: ["player1", "player2"] }
    },
    conditions: [
      "tribe_size >= 4",
      "player1.social >= 2",
      "player2.social >= 2",
      "player3.social >= 2"
    ],
    chance: "0.16 + ((player1.social + player2.social + player3.social) * 0.04)",
    text: {
      success: "{player1}, {player2}, and {player3} start making a ridiculous little beach art project, and the tribe ends up weirdly charmed by it.",
      fail: "{player1}, {player2}, and {player3} try to make camp feel a little more fun with a goofy beach project, but nobody really buys in."
    },
    effects: {
      success: [
        { type: "adjust_pairwise_relationships", players: ["player1", "player2", "player3"], delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "playful_mock_argument",
    phase: "premerge",
    scope: "tribe",
    weight: 1.3,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "relationship(player1, player2) >= 1"
    ],
    chance: "0.18 + ((player1.social + player2.social) * 0.04)",
    text: {
      success: "{player1} and {player2} get into a completely unserious mock argument that somehow leaves both of them feeling even more comfortable.",
      fail: "{player1} and {player2} try to keep things playful around camp, but the fake argument never quite finds the right tone."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "lucky_shell_superstition",
    phase: "premerge",
    scope: "tribe",
    weight: 1.2,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 3",
      "player1.social >= 2"
    ],
    chance: "0.15 + (player1.social * 0.04)",
    text: {
      success: "{player1} becomes a little attached to a so-called lucky shell around camp, and the harmless superstition weirdly makes them more endearing.",
      fail: "{player1} jokes around about a lucky beach trinket, but the bit never really catches on."
    },
    effects: {
      success: [
        { type: "adjust_relationship_with_tribe", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "camp_game_invents_inside_joke",
    phase: "premerge",
    scope: "tribe",
    weight: 1.5,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] },
      player3: { source: "tribe_member", distinctFrom: ["player1", "player2"] }
    },
    conditions: [
      "tribe_size >= 4",
      "player1.social >= 3"
    ],
    chance: "0.17 + ((player1.social + player2.social + player3.social) * 0.04)",
    text: {
      success: "{player1}, {player2}, and {player3} invent a dumb little camp game, and the resulting inside joke gives the tribe some badly needed levity.",
      fail: "{player1} tries to get a silly camp game going with {player2} and {player3}, but nobody really commits to the bit."
    },
    effects: {
      success: [
        { type: "adjust_pairwise_relationships", players: ["player1", "player2", "player3"], delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "swap_accidental_besties",
    phase: "swapped",
    scope: "tribe",
    weight: 1.6,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "relationship(player1, player2) >= -1"
    ],
    chance: "0.18 + ((player1.social + player2.social) * 0.05)",
    text: {
      success: "{player1} and {player2} land on the swapped tribe assuming they would never work together, then spend the day becoming unexpectedly inseparable.",
      fail: "{player1} and {player2} look like they might click on the swapped tribe, but the connection never quite fully forms."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "swap_story_trading",
    phase: "swapped",
    scope: "tribe",
    weight: 1.5,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 3",
      "player1.social >= 2",
      "player2.social >= 2"
    ],
    chance: "0.17 + ((player1.social + player2.social) * 0.05)",
    text: {
      success: "{player1} and {player2} start trading old tribe stories, and the swapped beach suddenly feels a lot less cold.",
      fail: "{player1} and {player2} swap a few stories about the old tribes, but the exchange stays more polite than useful."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "swap_weird_habit_noticed",
    phase: "swapped",
    scope: "tribe",
    weight: 1.2,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 3"
    ],
    chance: "0.13 + (player1.social * 0.03)",
    text: {
      success: "{player1} arrives on the swapped tribe with one tiny weird camp habit, and the new group cannot stop quietly talking about it.",
      fail: "{player1}'s little quirks on the swapped tribe get noticed, but they never quite become a thing."
    },
    effects: {
      success: [
        { type: "adjust_relationship_with_tribe", player: "player1", delta: -1 }
      ],
      fail: []
    }
  },
  {
    id: "merge_midnight_laughter_circle",
    phase: "merged",
    scope: "tribe",
    weight: 1.6,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] },
      player3: { source: "tribe_member", distinctFrom: ["player1", "player2"] }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.social >= 3",
      "player2.social >= 2",
      "player3.social >= 2"
    ],
    chance: "0.16 + ((player1.social + player2.social + player3.social) * 0.04)",
    text: {
      success: "{player1}, {player2}, and {player3} get caught in one of those late-night laughing fits that makes camp feel almost normal for a second.",
      fail: "{player1}, {player2}, and {player3} try to lighten the merged camp mood, but everyone is a little too guarded for it to really take."
    },
    effects: {
      success: [
        { type: "adjust_pairwise_relationships", players: ["player1", "player2", "player3"], delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "merge_personality_clash_over_nothing",
    phase: "merged",
    scope: "tribe",
    weight: 1.4,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 6"
    ],
    chance: "0.14 + ((6 - player1.social) * 0.03) + ((6 - player2.social) * 0.03)",
    text: {
      success: "{player1} and {player2} manage to grate on each other over something so small that it somehow makes the tension worse.",
      fail: "{player1} and {player2} nearly spark a pointless merged-camp feud, but the moment passes before it really becomes anything."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: -2 }
      ],
      fail: []
    }
  },
  {
    id: "merge_casual_story_raises_profile",
    phase: "merged",
    scope: "tribe",
    weight: 1.3,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.social >= 3"
    ],
    chance: "0.13 + (player1.social * 0.04)",
    text: {
      success: "{player1} tells a casual story that lands really well around camp, and it quietly reminds everyone how naturally magnetic they are.",
      fail: "{player1} has a chance to charm the merged camp with a story, but the moment does not quite hit."
    },
    effects: {
      success: [
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "merge_three_way_gossip_hub",
    phase: "merged",
    scope: "tribe",
    weight: 1.5,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] },
      player3: { source: "tribe_member", distinctFrom: ["player1", "player2"] }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.strategy >= 3",
      "player2.social >= 2",
      "player3.social >= 2"
    ],
    chance: "0.14 + ((player1.strategy + player2.social + player3.social) * 0.04)",
    text: {
      success: "{player1}, {player2}, and {player3} slip into a juicy little gossip rhythm that feels harmless on the surface and dangerous underneath.",
      fail: "{player1}, {player2}, and {player3} start circling camp chatter together, but the exchange never really becomes strategic."
    },
    effects: {
      success: [
        { type: "adjust_pairwise_relationships", players: ["player1", "player2", "player3"], delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "merge_tense_apology",
    phase: "merged",
    scope: "tribe",
    weight: 1.3,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 6",
      "relationship(player1, player2) <= 0",
      "player1.social >= 3"
    ],
    chance: "0.12 + (player1.social * 0.05)",
    text: {
      success: "{player1} offers {player2} a careful apology for old friction, and the merged camp suddenly feels a little less brittle.",
      fail: "{player1} tries to apologize to {player2}, but the conversation is too stiff to really repair much."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "merge_showboat_moment",
    phase: "merged",
    scope: "tribe",
    weight: 1.2,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.threat >= 3"
    ],
    chance: "0.13 + (player1.threat * 0.04)",
    text: {
      success: "{player1} has a tiny little showboat moment around camp, and while some people laugh, others start filing it away as a problem.",
      fail: "{player1} almost turns camp attention into a showy moment, but the beat never really catches."
    },
    effects: {
      success: [
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "merge_fake_relaxation_bit",
    phase: "merged",
    scope: "tribe",
    weight: 1.2,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size >= 6",
      "player1.strategy >= 3"
    ],
    chance: "0.12 + (player1.strategy * 0.04)",
    text: {
      success: "{player1} deliberately acts more relaxed than they feel around {player2}, trying to make their whole game look smaller than it really is.",
      fail: "{player1} tries to project total calm to {player2}, but the performance comes off just a little too rehearsed."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 1 },
        { type: "adjust_threat", player: "player1", delta: -1 }
      ],
      fail: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: -1 }
      ]
    }
  },
  {
    id: "late_game_bucket_list_chat",
    phase: "merged",
    scope: "tribe",
    weight: 1.3,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size <= 6",
      "player1.social >= 3",
      "player2.social >= 3"
    ],
    chance: "0.14 + ((player1.social + player2.social) * 0.05)",
    text: {
      success: "{player1} and {player2} get weirdly punchy talking about life after the game, and the odd little bucket-list chat leaves both softer toward the other.",
      fail: "{player1} and {player2} try to talk about life beyond the island, but this late in the game even that feels a little guarded."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "late_game_gallows_humor",
    phase: "merged",
    scope: "tribe",
    weight: 1.2,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] },
      player3: { source: "tribe_member", distinctFrom: ["player1", "player2"] }
    },
    conditions: [
      "tribe_size <= 6",
      "player1.social >= 2",
      "player2.social >= 2",
      "player3.social >= 2"
    ],
    chance: "0.13 + ((player1.social + player2.social + player3.social) * 0.04)",
    text: {
      success: "{player1}, {player2}, and {player3} slip into that strange late-game gallows humor where everybody laughs because the stakes are too high not to.",
      fail: "{player1}, {player2}, and {player3} try to find some levity in how intense the endgame feels, but the laugh never really comes."
    },
    effects: {
      success: [
        { type: "adjust_pairwise_relationships", players: ["player1", "player2", "player3"], delta: 1 }
      ],
      fail: []
    }
  },
  {
    id: "late_game_last_joke_backfires",
    phase: "merged",
    scope: "tribe",
    weight: 1.1,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size <= 5"
    ],
    chance: "0.12 + ((6 - player2.social) * 0.04)",
    text: {
      success: "{player1} tries to keep things light with {player2}, but the joke lands badly and lingers in the air way longer than it should.",
      fail: "{player1} makes a nervous little joke to {player2}, but the moment passes before it becomes a problem."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: -2 }
      ],
      fail: []
    }
  },
  {
    id: "late_game_midnight_promise",
    phase: "merged",
    scope: "tribe",
    weight: 1.2,
    actors: {
      player1: { source: "tribe_member" },
      player2: { source: "tribe_member", distinctFrom: ["player1"] }
    },
    conditions: [
      "tribe_size <= 5",
      "relationship(player1, player2) >= 1"
    ],
    chance: "0.13 + ((player1.social + player2.social) * 0.04)",
    text: {
      success: "{player1} and {player2} make one of those intense little late-night promises that feels emotionally real even if it may not survive the round.",
      fail: "{player1} and {player2} try to lock something in late at night, but the promise still feels too fragile to trust."
    },
    effects: {
      success: [
        { type: "adjust_relationship_pair", a: "player1", b: "player2", delta: 2 }
      ],
      fail: []
    }
  },
  {
    id: "late_game_jury_audition_energy",
    phase: "merged",
    scope: "tribe",
    weight: 1.2,
    actors: {
      player1: { source: "tribe_member" }
    },
    conditions: [
      "tribe_size <= 6",
      "player1.social >= 3",
      "player1.strategy >= 3"
    ],
    chance: "0.12 + ((player1.social + player1.strategy) * 0.04)",
    text: {
      success: "{player1} starts carrying themselves like they know they are being watched by the jury now, and not everyone loves the energy.",
      fail: "{player1} tries to look composed and finalist-ready, but the effort does not really seem to register with anyone."
    },
    effects: {
      success: [
        { type: "adjust_threat", player: "player1", delta: 1 }
      ],
      fail: []
    }
  }
];

window.SURVIVOR_CONFESSIONAL_LIBRARY = {
  generic: [
    "I can feel this game moving every minute, and the people who keep up are the people who survive.",
    "Out here, one conversation can change everything, so I am trying to pay attention to every little shift.",
    "Everybody is smiling, but that does not mean everybody is comfortable.",
    "The hard part is figuring out which relationships are real and which ones are only real for the day.",
    "I do not want to be caught reacting late, because that is how people end up getting blindsided.",
    "This game is a lot less about comfort than it is about reading discomfort before other people do.",
    "Every round has its own weather, and right now the weather feels like it could turn fast.",
    "What makes Survivor dangerous is that people can be sincere and strategic in the exact same breath.",
    "I keep trying to zoom out, because if you only follow one conversation at a time you miss the actual story.",
    "The tribe always tells on itself if you watch closely enough. The trick is noticing it before it is too late."
  ],
  alliance_formed: [
    "{alliance} feels real to me now, and if we stay disciplined we can actually steer this vote.",
    "When {alliance} came together, it finally felt like I had some structure in the game.",
    "I trust the people in {alliance} more than most, and that matters when the numbers start tightening.",
    "{alliance} gives me a little room to breathe, but only if everyone inside it stays calm.",
    "This game is brutal without numbers, so seeing {alliance} come together is a huge relief.",
    "{alliance} is the first thing out here that has felt sturdy instead of temporary.",
    "I know alliances can crack in a second, but right now {alliance} feels like something worth betting on.",
    "There is a difference between having people to talk to and having people who might actually move with you. {alliance} feels closer to the second thing.",
    "The best part about {alliance} is not just the votes. It is knowing I do not have to navigate every hour alone.",
    "I am not naive enough to think {alliance} is unbreakable, but I would rather have it than be out here improvising forever."
  ],
  alliance_target: [
    "If {alliance} gets one more round together, they could own this tribe.",
    "The problem with {alliance} is not just loyalty, it is that everybody can see how close they are.",
    "{alliance} is getting too comfortable, and comfort is dangerous out here.",
    "People act like {alliance} is harmless, but that is exactly how a bloc takes over the game.",
    "I am looking at {alliance} and thinking if we do not break that up soon, we deserve what happens next.",
    "{alliance} does not even have to be huge to be dangerous. Sometimes three steady votes are enough to ruin your whole game.",
    "The scary part about {alliance} is that they are starting to look like they think tomorrow belongs to them too.",
    "You can always feel when a group starts believing it is safe, and {alliance} is getting close to that line.",
    "I do not care how nice {alliance} seems. Nice little structures are still structures, and structures beat chaos.",
    "If you wait until {alliance} is obvious to everyone, you have already waited too long."
  ],
  duo_warning: [
    "When two people are that tight, you are never really just voting out one of them.",
    "{target} look like a pair, and pairs become problems before people are ready to admit it.",
    "I keep seeing {target} together, and I do not want to sit around until that becomes the whole game.",
    "Out here, visible closeness is basically a target, because everybody else notices it too.",
    "The tribe may not want to say it out loud, but {target} are clearly locked in.",
    "A duo changes the whole texture of a vote because now every conversation has a witness attached to it.",
    "{target} may think they are being subtle, but the beach is not that big and people notice patterns.",
    "If those two really are a pair, then waiting another round only makes them harder to separate.",
    "Sometimes the cleanest move is not about the biggest threat. It is about the closest two people.",
    "The moment I started clocking {target} as a pair, I stopped feeling relaxed about this tribe."
  ],
  alliance_defense: [
    "If people start throwing {target}'s name around, I am not just going to sit back and nod.",
    "I am not eager to let somebody take out one of my numbers without a fight.",
    "Once somebody in your circle gets targeted, you find out real fast who you can trust.",
    "I need people to understand that pushing {target} is not a neutral move for me.",
    "If the tribe thinks I am going to calmly accept losing {target}, they are reading me wrong.",
    "This is the stage of the game where defending one person can expose your whole hand, and I am aware of that.",
    "I do not love showing my cards, but if the vote lands on {target}, I may not get to stay quiet.",
    "Protecting {target} is risky, but letting them go without resistance is risky too.",
    "The tribe always acts like loyalty is suspicious right up until they need somebody to be loyal to them.",
    "I am not pretending I am neutral here. If the name is {target}, then yes, that matters to me."
  ],
  reward_win: [
    "Any time you get {reward} out here, it is huge, but the real value is who you get to share it with.",
    "Winning {reward} is nice, but I am thinking just as much about the social fallout as the food.",
    "{reward} buys goodwill, and goodwill can become leverage if you use it correctly.",
    "A reward win lets you strengthen bonds without making it look like strategy, and that matters a lot.",
    "You cannot underestimate what one good reward can do for morale and trust.",
    "{reward} is one of those things where everybody says congratulations while quietly judging every social choice you make around it.",
    "A reward is never just a reward. It is a statement about who feels included and who does not.",
    "You learn a lot about the game from who relaxes on reward and who comes back even sharper.",
    "When you win {reward}, you are not just feeding people. You are shaping how they remember you.",
    "The menu matters less than the company, and the company always has consequences."
  ],
  immunity_win: [
    "Once that necklace is around your neck, the whole day feels different.",
    "Winning immunity buys you one more round, and sometimes one more round is all you need.",
    "Tonight I can breathe, and that means I get to watch everybody else scramble.",
    "Immunity changes the conversation immediately, because people have to look for another option.",
    "This is the kind of win that can shift an entire vote, not just save one person.",
    "The best thing about immunity is the silence that comes with knowing your name cannot be the one tonight.",
    "I do not just like immunity because it keeps me safe. I like what it reveals about everyone else.",
    "There is something deeply satisfying about becoming unavailable right when people were probably starting to eye you.",
    "Immunity does not end the paranoia, but it does redirect it, and that is almost as good.",
    "One challenge win can change a whole season if it lands on the right day."
  ],
  heading_to_tribal: [
    "The second we lost, the beach went quiet in that dangerous way.",
    "Nobody wants to be the name tonight, so every conversation suddenly matters twice as much.",
    "Heading to tribal is when you find out whether your relationships are real or imagined.",
    "Once the challenge ends and you know you are vulnerable, the paranoia hits fast.",
    "This is the part of the day where one bad read can send you home.",
    "The walk back from a loss is always the loudest silence of the day.",
    "Everybody tries to act normal after a loss, and that performance is its own kind of information.",
    "You can tell how dangerous tribal is going to be by how quickly people start disappearing in pairs.",
    "After a loss, time speeds up and trust gets expensive.",
    "The tribe is still technically one group right now, but emotionally it already feels like five separate games."
  ],
  merge: [
    "The merge is where old tribe lines become excuses and new loyalties actually decide the game.",
    "Everybody says it is a fresh start at merge, but really it is just a bigger battlefield.",
    "At the merge, threat level matters more because everybody can finally compare notes.",
    "This is where the game becomes less about tribe survival and more about who can actually win.",
    "Merge is exciting, but it is also where obvious connections become a lot more dangerous.",
    "The merge is glamorous for about five minutes and then it becomes terrifyingly exposed.",
    "A merge beach is basically a rumor factory with coconuts.",
    "The hardest part of merge is that everybody is suddenly looking at the same board, and some of them see you as the biggest piece on it.",
    "You can hide inside tribe lines for a while, but the merge drags everybody into the same light.",
    "Merge should feel like freedom, but honestly it feels more like an audit."
  ],
  swap: [
    "A swap resets everything except the impressions people already have of you.",
    "Any time tribes reshuffle, the first question is whether you still have numbers or not.",
    "A swap is chaos, and chaos favors the people who can adapt fastest.",
    "New tribe means new social math, and that math can get ugly in a hurry.",
    "You can have a perfect plan on one beach and lose all of it the second a swap hits.",
    "A swap makes everyone reintroduce themselves as the version they hope survives.",
    "You do not really know how well you are playing until a swap strips the comfort away.",
    "The cruel thing about a swap is that it punishes people for feeling settled.",
    "A new tribe can turn your best friend into a liability or your enemy into a lifeline in about ten minutes.",
    "Swaps are where confidence goes to get tested."
  ],
  bonding: [
    "Small moments matter because those are the things people remember when it is time to vote.",
    "If I can make somebody feel good around camp, that can pay off later in a huge way.",
    "The social game is built in these quiet little conversations that do not look important at first.",
    "The more natural a bond feels, the more dangerous it can become for everybody else.",
    "You never know which camp conversation is going to become a real working relationship.",
    "A genuine bond is one of the only things out here that still cuts through pure strategy.",
    "People vote with logic until they do not, and when they do not, relationships usually explain why.",
    "Bonding does not always look flashy. Sometimes it is just noticing who makes camp feel easier.",
    "I am always paying attention to who people relax around, because that tells you a lot about where power might be forming.",
    "The strongest relationships often start in moments nobody else even clocks."
  ],
  conflict: [
    "Tension at camp never stays small for long, especially when people are hungry and exhausted.",
    "Once emotions start leaking out, it gets much harder to pretend the tribe is unified.",
    "Arguments are dangerous because even when they end, people remember exactly how they felt.",
    "You can tell when frustration is becoming personal, and that is when the game starts changing.",
    "Conflict tells you where the cracks are, and smart players pay attention to those cracks.",
    "The ugly thing about camp conflict is that you do not need a huge explosion. A few little resentments can do the job.",
    "Some people think drama is noise. I think drama is information.",
    "When camp gets tense, the most important thing is not who is loudest. It is who quietly starts taking mental notes.",
    "There is no such thing as a fully private argument on Survivor. The consequences always spread.",
    "The tribe may act like the fight is over, but emotionally those things stay alive for a while."
  ],
  camp_life: [
    "Camp life sounds small, but it shapes how people feel about each other every single day.",
    "Out here, who works and who does not work becomes part of the social game immediately.",
    "People absolutely notice who helps, who disappears, and who makes life easier around camp.",
    "The camp stuff is not separate from strategy. It is strategy, just in a quieter form.",
    "If somebody is useful around camp, that can buy them more grace than people realize.",
    "Camp habits become character narratives really fast, and those narratives matter at tribal.",
    "You can learn a tribe hierarchy just by watching who gets thanked and who gets taken for granted.",
    "The ordinary routine is where a lot of the emotional game actually lives.",
    "People say camp life should not matter, but it always matters because fatigue turns tiny details into huge impressions.",
    "How somebody lives with you is often the first draft of how you eventually vote on them."
  ],
  strategy: [
    "I am always listening for who is setting the tone of the conversation, because that person is dangerous.",
    "The strategy today is not just about naming a target. It is about making the target feel inevitable.",
    "I do not need everybody to love the plan. I just need enough people to feel safe with it.",
    "A lot of Survivor is repetition. The more often a name comes up, the more real it becomes.",
    "Strategy is really about timing. The same move can be brilliant or terrible depending on the round.",
    "The best strategic conversations usually sound less like speeches and more like shared realizations.",
    "I do not trust the loudest plan by default. Usually the best plan is the one that spreads quietly.",
    "A target becomes dangerous the moment multiple people think they discovered the idea themselves.",
    "There is a version of strategy that is just patience, and a lot of people never master it.",
    "Sometimes control is not about directing every vote. It is about making sure you are never surprised by one."
  ],
  jury_threat: [
    "Once the jury starts, you cannot just ask who we can beat today. You have to ask who we can beat at the end.",
    "Jury perception is real, and ignoring it is how somebody sleeps their way to a win.",
    "If people already respect {target}, then every extra round they survive only makes them scarier.",
    "Sometimes the most dangerous player is not the loudest one. It is the one the jury already likes.",
    "I keep thinking about final tribal because if {target} gets there, they may already have the story.",
    "A player can look manageable inside the game and still be terrifying once you imagine them in front of a jury.",
    "You do not need to have every jury vote locked up to be a huge problem. Sometimes three likely votes is enough to change everything.",
    "The longer {target} stays, the more time the jury has to turn them from impressive into inevitable.",
    "I am less interested in who is flashy than who is becoming believable as a winner, and {target} worries me there.",
    "Jury threat is dangerous because it sneaks up on people who are only thinking about the next tribal."
  ],
  vote_split: [
    "Vote splits sound clean on paper, but they get messy the second people start panicking.",
    "The danger with a split is that everybody thinks somebody else will keep the math straight.",
    "I hate sloppy split votes because one tiny mistake can hand power to the wrong person.",
    "When backup names start floating around, that is when trust gets tested the hardest.",
    "Split votes only work when the tribe is calm, and calm is not exactly the mood right now.",
    "Every split vote contains a tiny dare: do you really trust these people to execute something delicate?",
    "A backup plan sounds comforting until you realize it also gives people somewhere else to hide their uncertainty.",
    "The more complicated the math gets, the more nervous I get about human beings being in charge of it.",
    "Vote splits are where confidence and precision have to overlap, and that overlap is rarer than people think.",
    "I understand why people like split plans. I just do not enjoy betting my life on them."
  ],
  advantage_found: [
    "Any time an advantage enters the game, everybody else's plans get a little shakier.",
    "Finding something out here is huge, but keeping it from changing how you act is even harder.",
    "An advantage only helps if nobody can read it all over your face.",
    "The best part of an advantage is not just safety. It is what people do not know you can do.",
    "Once an advantage appears, paranoia spreads even if nobody can prove anything.",
    "An advantage does not just give somebody power. It makes everybody else second-guess their certainty.",
    "The real challenge after finding something is not gloating, not freezing, and not suddenly acting weird.",
    "I do not even need to know who has the advantage for it to affect my thinking. The possibility is enough.",
    "Advantages are dangerous because they invite overconfidence from one person and overreaction from everyone else.",
    "The second a twist enters the ecosystem, every simple plan starts feeling a little less simple."
  ]
};

(function extendSurvivorConfessionals() {
  const extraConfessionals = {
    generic: [
      "I do not need camp to be calm. I need to know who gets twitchy when it stops being calm.",
      "There is always a person on this beach pretending they have more control than they do. I am trying to spot them before everyone else does.",
      "The smiles out here are cheap. The timing behind them is where the real information lives.",
      "I can feel where the pressure is building, and I would rather move early than sit here acting shocked later.",
      "Everybody wants this round to feel simple. That usually means it is about to get messy.",
      "The beach keeps pretending this is one tribe. It is not. It is a stack of private agendas standing too close together.",
      "I do not trust easy votes. Easy votes are usually the ones hiding the sharpest edge.",
      "This game rewards the people who notice the mood shift before the words catch up."
    ],
    alliance_formed: [
      "{alliance} is not just a nice little group chat. It is the first thing in this game that feels like actual cover.",
      "I can finally stop surviving conversation to conversation. {alliance} gives me somewhere solid to stand.",
      "If {alliance} stays tight for even two more rounds, we can stop reacting and start deciding.",
      "What I like about {alliance} is that it gives me numbers without making me feel boxed in.",
      "{alliance} makes this tribe look a lot less random to me.",
      "This is the first time I have looked around and thought, yes, these are votes I can actually build with.",
      "{alliance} gives me a lane, and lanes are everything once a tribe starts panicking.",
      "I am not confusing {alliance} with family, but I finally have a structure that can hold weight."
    ],
    alliance_target: [
      "{alliance} is starting to carry itself like nobody can touch it, and that is exactly when I want to touch it.",
      "The minute a group starts sounding permanent, I want a wrench in it.",
      "{alliance} does not have to be loud to be dangerous. Quiet groups are usually worse.",
      "I am watching {alliance} build comfort, and comfort is what turns three people into a real problem.",
      "If we let {alliance} coast one more round, we are volunteering to play from underneath them.",
      "{alliance} is making the tribe smaller than it looks, and I do not plan on being outside that math for long.",
      "There is a shelf life on letting a bloc feel secure. I think {alliance} is at the end of it.",
      "The danger with {alliance} is that other people are starting to treat it like the weather instead of a choice."
    ],
    duo_warning: [
      "{target} are glued together, and I am not interested in letting that become normal.",
      "When two people stop checking where the other one is, that means they already trust it. That is bad news for the rest of us.",
      "I do not care how harmless {target} look. A visible pair is a loaded weapon once the numbers get tight.",
      "{target} are giving me the exact energy of two people who think they will have time later. I would rather take away later.",
      "The whole tribe can see {target} moving like a package deal. That never stays cute for long.",
      "You do not split up a pair because it is flashy. You do it because leaving it alone is lazy.",
      "I keep catching {target} sharing the same reaction before anyone else has one. That is a real bond, and real bonds win rounds.",
      "When two people start sounding like one person, somebody needs to cut the wire."
    ],
    alliance_defense: [
      "If the plan is {target}, people are about to learn I am not as neutral as I have looked.",
      "I did not spend all this time building trust just to hand {target} over because the tribe got jumpy.",
      "Losing {target} does real damage to my game, so no, I am not shrugging and calling it fine.",
      "If I let {target} go without a fight, I am basically writing my own name in pencil for later.",
      "People always act offended when you defend an ally, like loyalty is suspicious only when it is not theirs.",
      "I know protecting {target} exposes me a little, but letting them die quietly exposes me more.",
      "If this vote lands on {target}, the tribe is going to get a very clear answer about where I stand.",
      "I am not risking my whole position for nothing, but I am also not pretending {target} is disposable."
    ],
    reward_win: [
      "You can feed people and still make them furious. Reward decisions cut that close out here.",
      "The food is great. The real question is who feels chosen and who feels dismissed.",
      "A reward win buys me hours where people let their guard slip. That is worth almost more than the meal.",
      "Everybody claps for the reward. Then they start counting who got left behind.",
      "If I handle this reward right, I get more than full stomachs. I get leverage.",
      "Reward tells you who still wants to be close to you when they get to relax a little.",
      "I do not think people realize how much one reward can redraw the social mood back at camp.",
      "You can lose a vote with one sloppy reward choice, so I am paying attention to every face."
    ],
    immunity_win: [
      "That necklace buys me the one thing nobody can fake out here: actual breathing room.",
      "I love immunity because it forces everybody else to reveal their second choice.",
      "The second I was safe, I stopped hearing noise and started hearing information.",
      "There is a huge difference between talking strategy and talking strategy while untouchable.",
      "Winning immunity turns tonight from survival into observation, and that is a great trade.",
      "This kind of win matters because it changes whose fear fills the beach.",
      "I can see the disappointment in a few faces, which tells me that necklace landed exactly where it needed to.",
      "Nothing sharpens my read on the tribe like becoming unavailable."
    ],
    heading_to_tribal: [
      "You can smell the nerves the second a tribe knows it is going to tribal.",
      "The loss is one thing. The hour after the loss is the part that actually kills people.",
      "Everybody wants to be calm on the walk back. Nobody actually is.",
      "This is the window where the wrong ten-minute conversation can end somebody's season.",
      "Once tribal is on the table, even eye contact starts to feel strategic.",
      "People are pretending they need water, firewood, anything at all, just to get one more private minute with the right person.",
      "After a challenge loss, the beach turns into a room full of half-finished lies.",
      "This is the exact part of the day where confidence becomes either a shield or a coffin."
    ],
    merge: [
      "The merge gives everybody more options and fewer places to hide.",
      "Now the game gets honest. Nobody is voting for tribe strength anymore.",
      "At merge, every story people told about themselves gets stress-tested at the same time.",
      "This beach is too crowded for secrets and too paranoid for trust.",
      "The merge is where middle positions become gold and obvious power becomes bait.",
      "Everybody came into this merge wanting a reset. Not everybody deserves one.",
      "Now I get to see whose reputation survived the beach they built it on.",
      "Merge is where a good premerge becomes either a platform or a target."
    ],
    swap: [
      "A swap does not just reshuffle tribes. It exposes whether your game works without familiar faces.",
      "I do not care what somebody promised on the old beach. The only thing that matters now is what helps them tonight.",
      "Swaps punish lazy social games immediately.",
      "You get about ten minutes on a swapped tribe before first impressions start hardening into votes.",
      "A swap is brutal because you bring your reputation with you even when your numbers stay behind.",
      "Everybody says they want flexibility until the tribe changes and suddenly they need loyalty.",
      "This is the part where old labels disappear and raw survival takes over.",
      "The good thing about a swap is that it gives you new doors. The bad thing is everybody else gets them too."
    ],
    bonding: [
      "If somebody genuinely enjoys being around you out here, that can save you when the numbers get ugly.",
      "I do not need every bond to be deep. I need it to be real enough that a vote feels costly.",
      "The best social work out here does not look like work at all.",
      "You can watch a relationship become dangerous in real time when two people start defaulting to each other.",
      "Tiny moments become voting reasons later, even if nobody says that part out loud.",
      "A strong bond on Survivor feels soft on the surface and brutal in the math.",
      "I pay attention to who people laugh with because that is usually where future loyalty is hiding.",
      "When somebody starts feeling easy to live with, that is when they get hard to vote out."
    ],
    conflict: [
      "Once a tribe starts getting short with each other, the vote usually follows the same direction.",
      "I do not even need a full fight. One ugly tone is enough to shift how people feel.",
      "Camp conflict never ends when the yelling stops. It just goes quieter.",
      "The tribe can call it a misunderstanding if it wants. I can still see the damage sitting there.",
      "People forgive words faster than they forgive how a moment made them feel.",
      "When tension gets personal, logic usually loses a few points immediately.",
      "You learn a lot from who starts the fight, but you learn even more from who enjoys it.",
      "A bad camp mood has a way of turning one name from possible to easy."
    ],
    camp_life: [
      "How you live on this beach becomes part of your case whether you want it to or not.",
      "People act like camp life should not matter. Then they vote based on it anyway.",
      "The person making camp easier gets more grace. The person making camp heavier gets remembered.",
      "Work ethic is not just chores out here. It is reputation.",
      "The tribe keeps a silent ledger on camp effort, and that ledger always comes due.",
      "Somebody can be strategically brilliant and still vote themselves out by being miserable to live with.",
      "Little camp habits get turned into big character judgments faster than people admit.",
      "You can feel who this tribe respects just by watching whose work gets noticed."
    ],
    strategy: [
      "I am not selling a name. I am selling comfort around a name.",
      "The best plan is the one people repeat like it was their idea first.",
      "Tonight is not about finding a target. It is about finding a target the tribe will not panic about.",
      "I want the vote to land hard and clean, not drift there by accident.",
      "A strategic plan is only real once the nervous people stop poking holes in it.",
      "I do not need to dominate the conversation. I need to shape the version of it that survives.",
      "The tribe is looking for certainty. Whoever provides it gets more power than they probably should.",
      "My favorite kind of control is the kind nobody bothers naming out loud."
    ],
    jury_threat: [
      "Once jurors exist, every round is two games at once: tonight's vote and the story people are carrying out the door.",
      "I am not just asking who scares me here. I am asking who sounds expensive in front of a jury.",
      "{target} already has the kind of respect that gets dangerous once people start comparing notes at Ponderosa.",
      "A jury threat does not need perfect numbers. They just need a believable case, and {target} is getting one.",
      "If {target} keeps stacking respect round after round, we are going to regret calling them manageable.",
      "There is a point where somebody stops being useful and starts being impossible to sit next to. {target} is flirting with that line.",
      "Jury management is not a finale problem. It starts the second the first juror leaves mad or impressed.",
      "I do not want to be the idiot who knew {target} could win and still handed them one more day."
    ],
    vote_split: [
      "A split vote is basically a trust fall with worse consequences.",
      "The math is easy. The human beings doing the math are the part that worries me.",
      "People love talking about backup plans until they realize backup plans require discipline.",
      "If even one person tries to get cute inside a split, the whole thing can blow up in our faces.",
      "A split is only elegant when everybody is scared of the same outcome.",
      "The danger is not the numbers. The danger is somebody deciding they want to freelance inside them.",
      "Every split vote carries the same question: do I trust these people to be boring for one night?",
      "The plan sounds clean enough that I am immediately suspicious of it."
    ],
    advantage_found: [
      "If I find an advantage, the hardest part starts after the discovery: acting normal.",
      "An advantage is power, but it is also temptation, and temptation makes people sloppy.",
      "The second an advantage enters camp, everybody else's certainty gets a crack in it.",
      "I do not need the advantage to be flashy. I need it to land exactly when somebody thinks they have me boxed in.",
      "A hidden advantage is great. A hidden advantage on a player who still acts calm is lethal.",
      "Once there might be an advantage in play, every confident plan deserves side-eye.",
      "The secret is never the item. The secret is whether the person holding it can stop performing different.",
      "An advantage does not just save a player. It forces the whole tribe to do worse math."
    ]
  };

  Object.keys(extraConfessionals).forEach((key) => {
    window.SURVIVOR_CONFESSIONAL_LIBRARY[key] = (window.SURVIVOR_CONFESSIONAL_LIBRARY[key] || [])
      .concat(extraConfessionals[key]);
  });
})();

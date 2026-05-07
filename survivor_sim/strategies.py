from __future__ import annotations

import random
from typing import Callable, List, Dict, Optional, Tuple, Set, TYPE_CHECKING, Any, cast
from collections import Counter

from survivor_sim.config import (
    ADV_IDOL,
    ADV_SUPER_IDOL,
    ADV_DOUBLE_IDOL,
    ADV_LEGACY,
    ADV_5050,
    ADV_NULLIFIER,
)

if TYPE_CHECKING:
    from survivor_sim.simulator import Logger, Player


VoteTally = Counter["Player"]


# ----------------------------
# Shared helper scoring
# ----------------------------

def _fallback_target_score(voter: "Player", target: "Player") -> float:
    """
    Lower score = more likely vote target.

    Safe local fallback used by strategies.py so we do not rely on simulator
    methods being attached to Player instances.
    """
    rel = voter.relationships.get(target, 0)
    perceived_threat = voter.threat_perceptions.get(
        target,
        float(target.threat_level),
    )
    phase_threat = float(getattr(voter, "phase_threat_mult", 1.0) or 0.0)

    # Lower relationship and higher threat should make someone more targetable.
    return (rel * -1.0) + (perceived_threat * phase_threat)


def _score_target(voter: "Player", target: "Player") -> float:
    """
    Prefer the simulator-provided scorer if it exists on the voter object.
    Otherwise use the local fallback.
    """
    fn = getattr(voter, "_score_target_for_voter", None)
    if callable(fn):
        try:
            scorer = cast(Callable[[Any, Any], float], fn)
            return float(scorer(voter, target))
        except Exception:
            pass
    return _fallback_target_score(voter, target)


def _strategy_level(player: "Player") -> int:
    return int(player.strategy_level)


def _best_targets_for_voter(voter: "Player", eligibles: List["Player"]) -> List["Player"]:
    return sorted(eligibles, key=lambda p: _score_target(voter, p))


# ----------------------------
# Strategies
# ----------------------------

class NominationStrategy:
    def select_nominees(self, pool: List["Player"], desired_k: int) -> List["Player"]:
        raise NotImplementedError


class VotingStrategy:
    def choose_target(self, voter: "Player", eligibles: List["Player"]) -> "Player":
        raise NotImplementedError


class IdolPolicy:
    def decide_idol_plays(
        self,
        sim: "Any",
        pool: List["Player"],
        votes: Dict["Player", "Player"]
    ) -> Tuple[List["Player"], Dict["Player", List[str]]]:
        raise NotImplementedError


class TieBreakerStrategy:
    def resolve_tie(
        self,
        sim: "Any",
        pool: List["Player"],
        tied_players: List["Player"]
    ) -> Tuple["Player", str, Optional[VoteTally]]:
        raise NotImplementedError


class ChallengeSystem:
    def premerge_team_challenge(self, sim: "Any") -> List["Player"]:
        raise NotImplementedError

    def postmerge_individual_challenge(self, sim: "Any", num_winners: int) -> List["Player"]:
        raise NotImplementedError


# ----------------------------
# Default implementations
# ----------------------------

class DefaultNominationStrategy(NominationStrategy):
    def __init__(self, rng: random.Random) -> None:
        self.rng = rng

    def select_nominees(self, pool: List["Player"], desired_k: int) -> List["Player"]:
        elig = [p for p in pool if not p.immune]
        if len(elig) < 2:
            sorted_pool = sorted(
                [p for p in pool if not p.immune],
                key=lambda x: float(x.threat_level),
                reverse=True,
            )
            return sorted_pool[:2]

        if desired_k <= 0:
            desired_k = 2
        desired_k = max(2, min(desired_k, len(elig)))

        rank_sums: Dict["Player", float] = {p: 0.0 for p in elig}
        rank_counts: Dict["Player", int] = {p: 0 for p in elig}

        for voter in pool:
            voter_elig = [p for p in elig if p is not voter]
            if not voter_elig:
                continue
            ranked = _best_targets_for_voter(voter, voter_elig)
            for r, cand in enumerate(ranked, start=1):
                rank_sums[cand] += r
                rank_counts[cand] += 1

        mean_ranks: List[Tuple[float, "Player"]] = []
        for cand in elig:
            mean = rank_sums[cand] / rank_counts[cand] if rank_counts[cand] > 0 else float("inf")
            mean_ranks.append((mean, cand))

        self.rng.shuffle(mean_ranks)
        mean_ranks.sort(key=lambda x: x[0])

        nominees = [cand for _, cand in mean_ranks[:desired_k]]
        if len(nominees) < 2:
            nominees = [cand for _, cand in mean_ranks[:2]]
        return nominees


class DefaultVotingStrategy(VotingStrategy):
    def choose_target(self, voter: "Player", eligibles: List["Player"]) -> "Player":
        if not eligibles:
            raise ValueError("No eligible vote targets were provided.")

        if _strategy_level(voter) == 1:
            return min(
                eligibles,
                key=lambda p: (
                    voter.relationships.get(p, 0),
                    -float(p.threat_level),
                ),
            )

        scored = {other: _score_target(voter, other) for other in eligibles}
        return min(scored, key=lambda p: scored[p])


class DefaultIdolPolicy(IdolPolicy):
    """
    Play-window rules enforced here:

    - Final 6 is the LAST round for:
        * double idol
        * legacy advantage
        * 50/50 coin

    - Final 5 is the LAST round for:
        * hidden immunity idol
        * super idol
        * idol nullifier
    """

    def __init__(self, log: "Logger") -> None:
        self.log = log

    @staticmethod
    def _threshold(strategy_level: int) -> int:
        if strategy_level >= 4:
            return 1
        if strategy_level == 3:
            return 2
        return 3

    @staticmethod
    def _holder_vote_target(votes: Dict["Player", "Player"], holder: "Player") -> Optional["Player"]:
        return votes.get(holder)

    @staticmethod
    def _is_final_6_window(players_left: int) -> bool:
        return players_left >= 6

    @staticmethod
    def _is_final_5_window(players_left: int) -> bool:
        return players_left >= 5

    @staticmethod
    def _is_last_final_6_window(players_left: int) -> bool:
        return players_left == 6

    @staticmethod
    def _is_last_final_5_window(players_left: int) -> bool:
        return players_left == 5

    @staticmethod
    def _safe_protection_targets(
        holder: "Player",
        pool: List["Player"],
        votes: Dict["Player", "Player"],
        tally: VoteTally,
        include_self: bool,
    ) -> List["Player"]:
        """
        Legal-ish protection targets:
        - can include self when applicable
        - cannot protect someone the holder is actively voting against
        - should be receiving votes
        """
        holder_vote = votes.get(holder)
        candidates: List["Player"] = []

        for target, count in tally.most_common():
            if count <= 0:
                continue
            if target not in pool:
                continue
            if target.immune:
                continue
            if target is holder and not include_self:
                continue
            if holder_vote is target:
                continue
            candidates.append(target)

        if include_self and holder in pool and not holder.immune and holder not in candidates:
            if tally.get(holder, 0) > 0:
                candidates.insert(0, holder)

        return candidates

    @staticmethod
    def _ally_candidates(
        holder: "Player",
        candidates: List["Player"],
        min_rel: int = 3,
    ) -> List["Player"]:
        return [
            p for p in candidates
            if p is not holder and holder.relationships.get(p, 0) >= min_rel
        ]

    @staticmethod
    def _likely_idol_holder_candidates(
        holder: "Player",
        pool: List["Player"],
        votes: Dict["Player", "Player"],
        tally: VoteTally,
    ) -> List["Player"]:
        """
        Reasonable Idol Nullifier targets:
        - not the holder
        - not immune
        - likely to receive votes
        - likely to have an idol or be protected
        - preferably the person the holder is voting for
        """
        holder_vote = votes.get(holder)

        candidates: List["Player"] = []
        for target, count in tally.most_common():
            if count <= 0:
                continue
            if target not in pool:
                continue
            if target is holder or target.immune:
                continue

            has_visible_protection = (
                target.inventory.get(ADV_IDOL, 0) > 0
                or target.inventory.get(ADV_SUPER_IDOL, 0) > 0
                or target.inventory.get(ADV_DOUBLE_IDOL, 0) > 0
                or target.inventory.get(ADV_5050, 0) > 0
                or target.inventory.get(ADV_LEGACY, 0) > 0
            )

            likely_saved_by_allies = sum(
                1 for p in pool
                if p is not target and p.relationships.get(target, 0) >= 4
            ) >= 2

            if has_visible_protection or likely_saved_by_allies or target is holder_vote:
                candidates.append(target)

        if holder_vote is not None and holder_vote in candidates:
            candidates.sort(key=lambda p: (p is not holder_vote, -tally.get(p, 0)))
        else:
            candidates.sort(key=lambda p: -tally.get(p, 0))

        return candidates

    def decide_idol_plays(
        self,
        sim: "Any",
        pool: List["Player"],
        votes: Dict["Player", "Player"]
    ) -> Tuple[List["Player"], Dict["Player", List[str]]]:

        rng = sim.rng
        tally: VoteTally = Counter(votes.values())
        idol_immune: List["Player"] = []
        play_notes: Dict["Player", List[str]] = {}
        protected: Set["Player"] = set()
        players_left = len(sim.players)

        allow_f6_advs = self._is_final_6_window(players_left)
        allow_f5_advs = self._is_final_5_window(players_left)
        last_f6_window = self._is_last_final_6_window(players_left)
        last_f5_window = self._is_last_final_5_window(players_left)

        def protect(target: "Player", by_holder: "Player", note: str, log_msg: str) -> bool:
            if target in protected or target.immune:
                return False
            idol_immune.append(target)
            protected.add(target)
            play_notes.setdefault(by_holder, []).append(note)
            self.log.info(log_msg)
            return True

        # ----------------------------
        # Legacy Advantage
        # Last playable at Final 6
        # ----------------------------
        if allow_f6_advs and (sim.is_merge_vote or players_left == 6):
            for p in list(pool):
                if p.inventory.get(ADV_LEGACY, 0) <= 0 or p.immune:
                    continue

                p_strategy = _strategy_level(p)
                th = self._threshold(p_strategy)
                v_self = tally.get(p, 0)
                top_votes = max(tally.values()) if tally else 0

                should_play = (
                    (v_self >= th and v_self >= top_votes)
                    or (p_strategy >= 4 and v_self > 0 and rng.random() < 0.20)
                    or last_f6_window
                )

                if should_play:
                    p.take_one(ADV_LEGACY)
                    protect(
                        p,
                        p,
                        "plays Legacy Advantage",
                        f"\n{p.name} plays the Legacy Advantage for self-protection."
                    )

        # ----------------------------
        # Main protection holders
        # Build holder list only for things still legal at this player count
        # ----------------------------
        holders: List["Player"] = []
        for p in pool:
            has_any = False

            if allow_f6_advs and p.inventory.get(ADV_DOUBLE_IDOL, 0) > 0:
                has_any = True
            if allow_f6_advs and p.inventory.get(ADV_5050, 0) > 0:
                has_any = True
            if allow_f5_advs and p.inventory.get(ADV_IDOL, 0) > 0:
                has_any = True
            if allow_f5_advs and p.inventory.get(ADV_SUPER_IDOL, 0) > 0:
                has_any = True

            if has_any:
                holders.append(p)

        rng.shuffle(holders)

        for holder in holders:
            if holder.immune:
                continue

            th = self._threshold(_strategy_level(holder))
            v_self = tally.get(holder, 0)
            top_votes = max(tally.values()) if tally else 0

            # ----------------------------
            # Double Idol
            # Last playable at Final 6
            # ----------------------------
            if allow_f6_advs and holder.inventory.get(ADV_DOUBLE_IDOL, 0) > 0:
                safe_targets = self._safe_protection_targets(
                    holder=holder,
                    pool=pool,
                    votes=votes,
                    tally=tally,
                    include_self=True,
                )
                ally_targets = self._ally_candidates(holder, safe_targets, min_rel=3)

                chosen_targets: List["Player"] = []

                if (
                    (v_self >= th and v_self >= top_votes)
                    or last_f6_window
                ) and holder not in protected:
                    chosen_targets.append(holder)

                for cand in ally_targets:
                    if cand not in chosen_targets and len(chosen_targets) < 2:
                        if tally.get(cand, 0) <= 0 and not last_f6_window:
                            continue
                        chosen_targets.append(cand)

                for cand in safe_targets:
                    if cand not in chosen_targets and len(chosen_targets) < 2:
                        if tally.get(cand, 0) <= 0 and not last_f6_window:
                            continue
                        chosen_targets.append(cand)

                if chosen_targets:
                    holder.take_one(ADV_DOUBLE_IDOL)
                    for target in chosen_targets[:2]:
                        protect(
                            target,
                            holder,
                            f"plays Double Idol on {target.name}",
                            f"\n{holder.name} plays a Double Idol on {target.name}."
                        )
                    continue

            # ----------------------------
            # Hidden Immunity Idol
            # Last playable at Final 5
            # ----------------------------
            if allow_f5_advs and holder.inventory.get(ADV_IDOL, 0) > 0:
                played = False

                if (
                    (v_self >= th and v_self >= top_votes)
                    or (last_f5_window and holder not in protected)
                ) and holder not in protected:
                    holder.take_one(ADV_IDOL)
                    protect(
                        holder,
                        holder,
                        "plays a Hidden Immunity Idol",
                        f"\n{holder.name} plays a Hidden Immunity Idol for self-protection."
                    )
                    played = True

                else:
                    safe_targets = self._safe_protection_targets(
                        holder=holder,
                        pool=pool,
                        votes=votes,
                        tally=tally,
                        include_self=False,
                    )
                    ally_targets = self._ally_candidates(holder, safe_targets, min_rel=4)

                    if ally_targets:
                        ally_targets.sort(
                            key=lambda p: (-tally.get(p, 0), -holder.relationships.get(p, 0))
                        )
                        ally = ally_targets[0]

                        ally_pressure = tally.get(ally, 0)
                        ally_play_chance = 0.18
                        if holder.strategy_level >= 4:
                            ally_play_chance += 0.18
                        if last_f5_window:
                            ally_play_chance = max(ally_play_chance, 0.55)

                        if ally_pressure >= th and rng.random() < ally_play_chance:
                            holder.take_one(ADV_IDOL)
                            protect(
                                ally,
                                holder,
                                f"plays a Hidden Immunity Idol on {ally.name}",
                                f"\n{holder.name} plays a Hidden Immunity Idol on {ally.name}."
                            )
                            played = True

                if played:
                    continue

            # ----------------------------
            # Super Idol
            # Last playable at Final 5
            # Do not use here; simulator resolves it after the vote read.
            # We only ensure it is not pre-played outside its legal window by
            # simply never touching it here.
            # ----------------------------

            # ----------------------------
            # 50/50 Coin
            # Last playable at Final 6
            # Holder only, self only
            # ----------------------------
            if allow_f6_advs and holder.inventory.get(ADV_5050, 0) > 0:
                if v_self >= th or (top_votes > 0 and v_self == top_votes) or last_f6_window:
                    holder.take_one(ADV_5050)
                    flip_success = rng.choice([True, False])

                    if flip_success:
                        protect(
                            holder,
                            holder,
                            "plays 50/50 Coin (success)",
                            f"\n{holder.name} plays the 50/50 Coin — SUCCESS."
                        )
                    else:
                        play_notes.setdefault(holder, []).append("plays 50/50 Coin (fail)")
                        self.log.info(f"\n{holder.name} plays the 50/50 Coin — FAIL.")
                    continue

        # ----------------------------
        # Idol Nullifier
        # Last playable at Final 5
        # ----------------------------
        nullify_targets: Dict["Player", int] = {}

        if allow_f5_advs:
            for holder in pool:
                while holder.inventory.get(ADV_NULLIFIER, 0) > 0:
                    candidates = self._likely_idol_holder_candidates(
                        holder=holder,
                        pool=pool,
                        votes=votes,
                        tally=tally,
                    )
                    if not candidates:
                        break

                    target = candidates[0]
                    if target is holder:
                        break

                    holder.take_one(ADV_NULLIFIER)
                    nullify_targets[target] = nullify_targets.get(target, 0) + 1
                    play_notes.setdefault(holder, []).append(
                        f"plays Idol Nullifier on {target.name}"
                    )
                    self.log.info(
                        f"\n{holder.name} plays an Idol Nullifier on {target.name}."
                    )
                    break

        if nullify_targets and idol_immune:
            kept: List["Player"] = []
            for protected_target in idol_immune:
                if nullify_targets.get(protected_target, 0) > 0:
                    self.log.info(f"Protection on {protected_target.name} is NULLIFIED.")
                else:
                    kept.append(protected_target)
            idol_immune = kept

        return idol_immune, play_notes


class DefaultTieBreakerStrategy(TieBreakerStrategy):
    def resolve_tie(
        self,
        sim: "Any",
        pool: List["Player"],
        tied_players: List["Player"]
    ) -> Tuple["Player", str, Optional[VoteTally]]:
        log = sim.log
        rng = sim.rng

        revote_voters = [v for v in pool if v not in tied_players]
        revote_votes: Dict["Player", "Player"] = {}
        current_counts: VoteTally = Counter()

        header_names = " v ".join(p.name for p in tied_players)
        log.info(f"\nRevote {header_names}")

        for voter in revote_voters:
            elig = [p for p in tied_players if p is not voter and not p.immune]
            if len(elig) < 2:
                extra = [x for x in tied_players if x not in elig and not x.immune]
                if extra:
                    elig = list(dict.fromkeys(elig + extra))[:2]
            if not elig:
                continue

            base_choice = DefaultVotingStrategy().choose_target(voter, elig)
            choice = base_choice

            if len(elig) >= 2 and rng.random() < 0.45:
                alts = [x for x in elig if x is not choice]
                if alts:
                    alt_scores = {alt: _score_target(voter, alt) for alt in alts}
                    choice = min(alt_scores, key=lambda p: alt_scores[p])

            if len(elig) >= 2:
                outcomes: Dict["Player", Tuple[bool, int]] = {}
                for cand in elig:
                    temp = current_counts.copy()
                    temp[cand] += 1
                    maxv = max(temp.values()) if temp else 0
                    leaders = [p for p, c in temp.items() if c == maxv]
                    outcomes[cand] = (len(leaders) == 1, maxv)

                breakers = [cand for cand, (unique, _) in outcomes.items() if unique]
                if breakers and rng.random() < sim.config.p_avoid_rocks:
                    best_count = max(outcomes[b][1] for b in breakers)
                    best_breakers = [b for b in breakers if outcomes[b][1] == best_count]

                    if base_choice in best_breakers:
                        choice = base_choice
                    else:
                        choice = DefaultVotingStrategy().choose_target(voter, best_breakers)

            revote_votes[voter] = choice
            current_counts[choice] += 1
            log.info(f"{voter.name} -> {choice.name}")

        if revote_votes:
            revote_tally: VoteTally = Counter(revote_votes.values())
            max_votes = max(revote_tally.values())
            leaders = [p for p, c in revote_tally.items() if c == max_votes]

            if len(leaders) == 1:
                return leaders[0], "Revote", revote_tally

            if rng.random() < sim.config.p_last_chance_flip:
                def fence_gap(v: "Player") -> int:
                    if len(tied_players) == 2:
                        a, b = tied_players[0], tied_players[1]
                        return abs(v.relationships.get(a, 0) - v.relationships.get(b, 0))
                    rels = sorted([v.relationships.get(x, 0) for x in tied_players], reverse=True)
                    return abs(rels[0] - rels[1]) if len(rels) >= 2 else 0

                ranked = sorted(revote_votes.keys(), key=fence_gap)
                k = max(1, len(ranked) // 5)
                candidates = ranked[:k]

                for voter in candidates:
                    curr_target = revote_votes[voter]
                    gap = fence_gap(voter)

                    base = 0.28
                    max_bonus = sim.config.tie_flip_strat_bonus_max
                    strat_bonus = max(0.0, (_strategy_level(voter) - 3) * (max_bonus / 2.0))
                    gap_bonus = 0.22 if gap <= 1 else (0.12 if gap == 2 else 0.04)
                    p_flip = min(0.88, base + gap_bonus + strat_bonus)

                    alts = [p for p in tied_players if p is not voter and not p.immune and p is not curr_target]
                    rng.shuffle(alts)

                    for alt in alts:
                        temp = revote_tally.copy()
                        temp[curr_target] -= 1
                        temp[alt] += 1
                        maxv = max(temp.values())
                        leaders2 = [p for p, c in temp.items() if c == maxv]

                        if len(leaders2) == 1 and rng.random() < p_flip:
                            revote_tally[curr_target] -= 1
                            revote_tally[alt] += 1
                            revote_votes[voter] = alt
                            log.info(
                                f"{voter.name} (on-the-fence) flips from {curr_target.name} to {alt.name}."
                            )
                            return leaders2[0], "Targeted Flip", revote_tally

            if rng.random() < sim.config.p_avoid_rocks:
                def consensus_pressure(target: "Player") -> Tuple[float, float, str]:
                    voters = [p for p in pool if p is not target]
                    avg_rel = (
                        sum(v.relationships.get(target, 0) for v in voters) / max(1, len(voters))
                    )
                    threat = float(getattr(target, "threat_level", 0) or 0)
                    return (avg_rel, -threat, target.name)

                consensus_pool = list(dict.fromkeys(
                    leaders + [p for p in pool if p not in tied_players and not p.immune]
                ))
                consensus_target = min(consensus_pool, key=consensus_pressure)
                log.info(
                    f"The revote stays tied, but the tribe reaches consensus on {consensus_target.name} to avoid rocks."
                )
                return consensus_target, "Consensus", revote_tally

        safe = set(tied_players) | {p for p in pool if p.immune}
        rock_eligible = [p for p in pool if p not in safe]

        if not rock_eligible:
            return rng.choice(tied_players), "Random Among Tied", None

        unlucky = rng.choice(rock_eligible)
        return unlucky, "Rocked Out", None


class DefaultChallengeSystem(ChallengeSystem):
    def premerge_team_challenge(self, sim: "Any") -> List["Player"]:
        rng = sim.rng
        tribes = sim.tribes
        if len(tribes) < 2:
            return tribes[0]

        sizes = [len(t) for t in tribes]
        min_size = min(sizes)

        scores: Dict[int, int] = {}
        for tribe in tribes:
            available = [p for p in tribe if not p.sat_out_last] or tribe[:]
            rng.shuffle(available)
            comp = available[:min_size]
            comp_set = set(comp)

            for p in tribe:
                p.sat_out_last = (p not in comp_set)

            score = sum(int(p.challenge_ability or 1) * rng.randint(1, 6) for p in comp)
            scores[id(tribe)] = score

        losing_tribe = min(tribes, key=lambda tr: scores[id(tr)])
        return losing_tribe

    def postmerge_individual_challenge(self, sim: "Any", num_winners: int) -> List["Player"]:
        rng = sim.rng

        for p in sim.players:
            p.reset_for_round()

        perf: Dict["Player", int] = {
            p: int(p.challenge_ability or 1) * rng.randint(1, 6) for p in sim.players
        }

        sorted_players = sorted(perf.items(), key=lambda kv: kv[1], reverse=True)
        winners = [
            pl for pl, _ in sorted_players[:max(0, min(num_winners, len(sim.players)))]
        ]

        for w in winners:
            w.immune = True

        for p in winners:
            p.threat_level = float(p.threat_level or 1) + 2

        return winners

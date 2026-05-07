from __future__ import annotations

from collections import Counter
from typing import Any

VoteSubject = Any


def _vote_subject_name(subject: VoteSubject) -> str:
    return str(getattr(subject, "name", subject))


def _vote_count_sort_key(item: tuple[VoteSubject, int]) -> tuple[int, str]:
    subject, count = item
    return -count, _vote_subject_name(subject)


def _counts_for_summary(tally: Counter[VoteSubject]) -> list[str]:
    if not tally:
        return []
    items: list[tuple[VoteSubject, int]] = sorted(
        tally.items(),
        key=_vote_count_sort_key,
    )
    return [str(count) for _subject, count in items]


counts_for_summary = _counts_for_summary


def _format_final_summary(final_tally: Counter[VoteSubject], total_voided: int, notes: list[str]) -> str:
    parts: list[str] = []
    if total_voided > 0:
        parts.append(f"{total_voided}*")
    parts.extend(_counts_for_summary(final_tally))
    base = "(" + "-".join(parts) + ")" if parts else "(none)"
    if notes:
        return base[:-1] + (", " + ", ".join(notes) + ")") if base.endswith(")") else base + " (" + ", ".join(notes) + ")"
    return base


format_final_summary = _format_final_summary


def _format_two_phase_summary(initial_counts: list[int], revote_counts: list[int], total_voided: int, notes: list[str]) -> str:
    seg1_list: list[str] = []
    if total_voided > 0:
        seg1_list.append(f"{total_voided}*")
    seg1_list += [str(x) for x in initial_counts]
    seg1 = "-".join(seg1_list) if seg1_list else ""
    seg2 = "-".join(str(x) for x in revote_counts) if revote_counts else ""
    if seg1 and seg2:
        base = f"({seg1}, {seg2})"
    elif seg1:
        base = f"({seg1})"
    elif seg2:
        base = f"({seg2})"
    else:
        base = "(none)"
    if notes:
        return base[:-1] + (", " + ", ".join(notes) + ")") if base.endswith(")") else base + " (" + ", ".join(notes) + ")"
    return base


format_two_phase_summary = _format_two_phase_summary


REWARD_BASE_TYPES = ["Food", "Supplies", "Spa", "Trip"]

__all__ = [
    "REWARD_BASE_TYPES",
    "counts_for_summary",
    "format_final_summary",
    "format_two_phase_summary",
    "_counts_for_summary",
    "_format_final_summary",
    "_format_two_phase_summary",
]

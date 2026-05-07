from collections import Counter
from typing import Any, Dict, List, Set, Tuple

REWARD_BASE_TYPES = ("final", "challenge", "immunity", "reward")


def _display_name(value: Any) -> str:
    return str(getattr(value, "name", value))


def counts_for_summary(players: List[Any]) -> Dict[str, int]:
    c: Counter[str] = Counter()
    for p in players:
        if hasattr(p, "status"):
            c[str(getattr(p, "status"))] += 1
        elif hasattr(p, "is_active"):
            c["active"] += 1 if bool(getattr(p, "is_active")) else 0
    return dict(c)


def format_final_summary(winner: Any, final_three: List[Any]) -> str:
    parts: List[str] = []
    parts.append(f"Winner: {_display_name(winner)}")
    parts.append("Final three:")
    parts.extend([f" - {_display_name(p)}" for p in final_three])
    return "\n".join(parts)


def format_two_phase_summary(phase1: List[Any], phase2: List[Any]) -> str:
    return (
        "Phase 1 survivors:\n"
        + "\n".join([_display_name(p) for p in phase1])
        + "\n\nPhase 2 survivors:\n"
        + "\n".join([_display_name(p) for p in phase2])
    )


def extract_alliance_components(nodes: List[Any], edges: List[Tuple[Any, Any]]) -> List[Set[Any]]:
    adj: Dict[Any, Set[Any]] = {n: set() for n in nodes}
    for u, v in edges:
        adj.setdefault(u, set()).add(v)
        adj.setdefault(v, set()).add(u)
    seen: Set[Any] = set()
    comps: List[Set[Any]] = []
    for n in nodes:
        if n in seen:
            continue
        stack: List[Any] = [n]
        cur: Set[Any] = {n}
        seen.add(n)
        while stack:
            x = stack.pop()
            for y in adj.get(x, ()):  # defensive
                if y not in seen:
                    seen.add(y)
                    cur.add(y)
                    stack.append(y)
        comps.append(cur)
    return comps


def minimal_bridge_candidates(sim: Any, pool: List[Any], base_edges: List[Tuple[Any, Any]]) -> List[Tuple[Any, Any, float]]:
    # lightweight wrapper that defers to sim._edge_weight_any if available
    nodes = pool[:]
    from itertools import combinations

    pairs: List[Tuple[float, Any, Any]] = []
    for a, b in combinations(nodes, 2):
        try:
            w = float(sim._edge_weight_any(a, b, pool))
        except Exception:
            w = 0.0
        if w > 0.0:
            pairs.append((w, a, b))
    pairs.sort(key=lambda t: t[0], reverse=True)

    # Kruskal-like union to connect components
    parent: Dict[Any, Any] = {p: p for p in nodes}

    def find(x: Any) -> Any:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a: Any, b: Any) -> bool:
        ra, rb = find(a), find(b)
        if ra == rb:
            return False
        parent[rb] = ra
        return True

    for u, v in base_edges:
        union(u, v)

    bridges: List[Tuple[Any, Any, float]] = []
    for w, a, b in pairs:
        if union(a, b):
            bridges.append((a, b, w))
            if len({find(p) for p in nodes}) == 1:
                break
    return bridges

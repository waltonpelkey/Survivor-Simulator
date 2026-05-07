from __future__ import annotations

import math
from collections import defaultdict, Counter
from typing import Any, List, Tuple, Dict, Optional, TYPE_CHECKING, Callable, cast

if TYPE_CHECKING:
    from survivor_sim.simulator import Player
    from networkx import Graph as NxGraph  # type: ignore[import-not-found]


GraphEdge = tuple[int, int, float]
PlayerEdge = Tuple["Player", "Player"]
PlayerBridge = Tuple["Player", "Player", float]
WeightedPlayerPair = tuple[float, "Player", "Player"]
Position = tuple[float, float]

try:
    import networkx as nx  # type: ignore[import-not-found]
except Exception:
    nx = None


def build_alliance_graph(sim: "Any", pool: List["Player"], *, mode: str = "interest", interest_thresh: float | None = None, rel_min_edge: int | None = None) -> tuple[List["Player"], list[tuple[int, int, float]], str]:
    nodes = list(pool)
    edges: list[tuple[int, int, float]] = []

    if mode == "interest":
        wlabel = "ally_score"
        thresh = float(sim.config.alliance_edge_threshold) if interest_thresh is None else float(
            interest_thresh)
        for i in range(len(nodes)):
            for j in range(i + 1, len(nodes)):
                a, b = nodes[i], nodes[j]
                w = sim._interest_edge_weight(a, b, pool)
                if w >= thresh:
                    edges.append((i, j, w))
    else:
        wlabel = "tie"
        min_edge = sim.config.alliance_min_edge if rel_min_edge is None else int(
            rel_min_edge)
        lo, hi = sim.config.relationship_min, sim.config.relationship_max
        span = max(1, hi - lo)
        for i in range(len(nodes)):
            for j in range(i + 1, len(nodes)):
                a, b = nodes[i], nodes[j]
                ra, rb = a.relationships.get(b, 0), b.relationships.get(a, 0)
                if ra >= min_edge and rb >= min_edge:
                    w = (min(ra, rb) - lo) / span
                    edges.append((i, j, float(w)))

    edges.sort(key=lambda e: e[2], reverse=True)
    return nodes, edges, wlabel


def _disjoint_set(n: int) -> tuple[Callable[[int], int], Callable[[int, int], bool]]:
    parent = list(range(n))
    rank = [0] * n

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a: int, b: int) -> bool:
        ra, rb = find(a), find(b)
        if ra == rb:
            return False
        if rank[ra] < rank[rb]:
            parent[ra] = rb
        elif rank[rb] < rank[ra]:
            parent[rb] = ra
        else:
            parent[rb] = ra
            rank[ra] += 1
        return True

    return find, union


def maximum_spanning_forest(n_nodes: int, edges_sorted_desc: list[GraphEdge]) -> list[GraphEdge]:
    _, union = _disjoint_set(n_nodes)
    mst: list[GraphEdge] = []
    for i, j, w in edges_sorted_desc:
        if union(i, j):
            mst.append((i, j, w))
    return mst


def _auto_layout(nodes: list["Player"], edges: list[GraphEdge]) -> dict[int, Position]:
    if nx is not None:
        G: NxGraph[int] = nx.Graph()
        G.add_nodes_from(range(len(nodes)))
        for i, j, w in edges:
            G.add_edge(i, j, weight=w)
        raw_pos: dict[int, Any] = nx.spring_layout(G, k=None, weight="weight", seed=42)
        return {int(k): (float(v[0]), float(v[1])) for k, v in raw_pos.items()}

    N = max(1, len(nodes))
    pos = {i: (math.cos(2 * math.pi * i / N), math.sin(2 * math.pi * i / N))
           for i in range(N)}
    for _ in range(20):
        disp: defaultdict[int, list[float]] = defaultdict(lambda: [0.0, 0.0])
        for i, j, w in edges:
            xi, yi = pos[i]
            xj, yj = pos[j]
            dx, dy = xj - xi, yj - yi
            dist = math.hypot(dx, dy) + 1e-6
            f = 0.005 * w
            disp[i][0] += f * dx / dist
            disp[i][1] += f * dy / dist
            disp[j][0] -= f * dx / dist
            disp[j][1] -= f * dy / dist
        for i in pos:
            pos[i] = (pos[i][0] + disp[i][0], pos[i][1] + disp[i][1])
    return pos


def draw_alliance_graph(sim: "Any", pool: List["Player"], *, mode: str = "interest", view: str = "both", progressive: bool = False, save_path: str | None = None, top_edges: int | None = None, base_color: str = "0.15", node_face: str = "0.85", node_edge: str = "0.05", text_color: str = "0.10") -> None:
    nodes, edges, _ = build_alliance_graph(sim, pool, mode=mode)

    try:
        import matplotlib.pyplot as plt  # type: ignore[import-not-found]
    except Exception:
        # matplotlib not available or headless; skip drawing silently
        return

    if top_edges is not None and top_edges > 0:
        edges = edges[:top_edges]

    n = len(nodes)
    mst = maximum_spanning_forest(n, edges)

    layout_edges = edges if edges else [
        (i, (i + 1) % n, 0.1) for i in range(n)]
    pos = _auto_layout(nodes, layout_edges)

    def _node_style(p: "Player") -> tuple[float, float]:
        threat = float(p.threat_level)
        size = int(300 + 40 * threat)
        lw = 2.5 if p.immune else 0.8
        return size, lw

    def _draw_frame(current_mst_edges: list[GraphEdge] | None = None, subtitle: str = "") -> None:
        plt.figure(figsize=(8, 6))  # type: ignore[reportUnknownMemberType]

        if view in ("full", "both"):
            for i, j, w in edges:
                x1, y1 = pos[i]
                x2, y2 = pos[j]
                plt.plot([x1, x2], [y1, y2], linewidth=1 + 3 * w,  # type: ignore[reportUnknownMemberType]
                         alpha=0.25, color=base_color, zorder=1)

        if view in ("mst", "both"):
            use = current_mst_edges if current_mst_edges is not None else mst
            for i, j, w in use:
                x1, y1 = pos[i]
                x2, y2 = pos[j]
                plt.plot([x1, x2], [y1, y2], linewidth=2 + 5 * w,  # type: ignore[reportUnknownMemberType]
                         alpha=0.9, color=base_color, zorder=2)

        for idx, p in enumerate(nodes):
            x, y = pos[idx]
            size, lw = _node_style(p)
            plt.scatter([x], [y], s=size, facecolors=node_face,  # type: ignore[reportUnknownMemberType]
                        edgecolors=node_edge, linewidths=lw, zorder=3)
            plt.text(x, y, p.name, fontsize=9, ha="center",  # type: ignore[reportUnknownMemberType]
                     va="center", color=text_color, zorder=4)

        title_mode = "interest" if mode == "interest" else "relationship"
        plt.title(  # type: ignore[reportUnknownMemberType]
            f"Alliance Graph ({title_mode}) {subtitle}", color=text_color)
        plt.axis("off")  # type: ignore[reportUnknownMemberType]
        plt.tight_layout()

    if progressive:
        frames: list[Any] = []
        try:
            import imageio.v2 as imageio  # type: ignore[import-not-found]
        except Exception:
            imageio = None

        built: list[tuple[int, int, float]] = []
        for k in range(len(mst)):
            built.append(mst[k])
            _draw_frame(current_mst_edges=built,
                        subtitle=f"— backbone step {k+1}/{len(mst)}")
            if save_path and imageio:
                try:
                    fig = plt.gcf()
                    fig.canvas.draw()  # type: ignore[reportUnknownMemberType]
                    import numpy as np  # type: ignore[import-not-found]
                    w, h = fig.canvas.get_width_height()
                    canvas = cast(Any, fig.canvas)
                    buf = np.frombuffer(canvas.buffer_rgba(), dtype="uint8")
                    arr = buf.reshape((h, w, 4))[:, :, :3]
                    frames.append(arr)
                except Exception:
                    # If we can't capture the canvas, skip saving this frame
                    pass
            plt.show()  # type: ignore[reportUnknownMemberType]

            if save_path and imageio and frames:
                if not save_path.lower().endswith(".gif"):
                    save_path = save_path + ".gif"
                try:
                    imageio.mimsave(save_path, frames, duration=0.8)  # type: ignore[reportUnknownMemberType]
                except Exception:
                    # non-fatal: skip saving if it fails
                    pass
    else:
        _draw_frame()
        # If requested, allow saving to GIF (capture canvas in-memory).
        if save_path:
            if save_path.lower().endswith(".gif"):
                try:
                    import imageio.v2 as imageio  # type: ignore[import-not-found]
                    fig = plt.gcf()
                    fig.canvas.draw()  # type: ignore[reportUnknownMemberType]
                    import numpy as np  # type: ignore[import-not-found]
                    w, h = fig.canvas.get_width_height()
                    canvas = cast(Any, fig.canvas)
                    buf = np.frombuffer(canvas.buffer_rgba(), dtype="uint8")
                    arr = buf.reshape((h, w, 4))[:, :, :3]
                    imageio.mimsave(save_path, [arr], duration=0.8)  # type: ignore[reportUnknownMemberType]
                except Exception:
                    pass
            # Explicitly skip PNG saves to avoid writing .png files
        plt.show()  # type: ignore[reportUnknownMemberType]
        plt.close()


def components_from_edges(nodes: List["Player"], edges: List[PlayerEdge]) -> List[set["Player"]]:
    adj: Dict["Player", set["Player"]] = {n: set() for n in nodes}
    for u, v in edges:
        adj[u].add(v)
        adj[v].add(u)
    seen: set["Player"] = set()
    comps: list[set["Player"]] = []
    for n in nodes:
        if n in seen:
            continue
        stack = [n]
        cur = {n}
        seen.add(n)
        while stack:
            x = stack.pop()
            for y in adj[x]:
                if y not in seen:
                    seen.add(y)
                    cur.add(y)
                    stack.append(y)
        comps.append(cur)
    return comps


def minimal_strong_bridges(sim: "Any", pool: List["Player"], base_edges: List[PlayerEdge]) -> List[PlayerBridge]:
    # DSU on pool
    nodes = pool[:]
    parent = {p: p for p in nodes}
    rank = {p: 0 for p in nodes}

    def find(x: "Player") -> "Player":
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a: "Player", b: "Player") -> bool:
        ra, rb = find(a), find(b)
        if ra == rb:
            return False
        if rank[ra] < rank[rb]:
            parent[ra] = rb
        elif rank[ra] > rank[rb]:
            parent[rb] = ra
        else:
            parent[rb] = ra
            rank[ra] += 1
        return True

    for u, v in base_edges:
        union(u, v)

    reps = {find(p) for p in nodes}
    if len(reps) <= 1:
        return []

    pairs: list[WeightedPlayerPair] = []
    from itertools import combinations
    for a, b in combinations(nodes, 2):
        w = sim._edge_weight_any(a, b, pool)
        if w <= 0.0:
            continue
        pairs.append((w, a, b))
    pairs.sort(key=lambda t: t[0], reverse=True)

    bridges: list[PlayerBridge] = []
    for w, a, b in pairs:
        if union(a, b):
            bridges.append((a, b, w))
            if len({find(p) for p in nodes}) == 1:
                break
    return bridges


def sample_traversal_path(nodes: List["Player"], edges: List[PlayerEdge]) -> Optional[List["Player"]]:
    if not nodes:
        return None
    deg: Counter["Player"] = Counter()
    for u, v in edges:
        deg[u] += 1
        deg[v] += 1
    sorted_nodes = [p for p, _ in deg.most_common()]
    if len(sorted_nodes) < 2:
        sorted_nodes = nodes[:]
    if len(sorted_nodes) < 2:
        return None
    src = sorted_nodes[-1]
    dst = sorted_nodes[0]
    if src == dst and len(nodes) >= 2:
        dst = nodes[1]

    adj: Dict["Player", List["Player"]] = {n: [] for n in nodes}
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    from collections import deque as dq
    Q = dq([src])
    prev: Dict["Player", Optional["Player"]] = {src: None}
    while Q:
        x = Q.popleft()
        if x == dst:
            break
        for y in adj[x]:
            if y not in prev:
                prev[y] = x
                Q.append(y)
    if dst not in prev:
        return None
    path: list["Player"] = []
    cur = dst
    while cur is not None:
        path.append(cur)
        cur = prev[cur]
    path.reverse()
    return path

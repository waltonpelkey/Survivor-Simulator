from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Iterable, List, Tuple, TYPE_CHECKING, cast

import numpy as np  # type: ignore[import-not-found]

from survivor_sim.player import Player as BasePlayer
from survivor_sim.strategies import DefaultVotingStrategy

if TYPE_CHECKING:
    from survivor_sim.simulator import Player as StrategyPlayer
else:
    StrategyPlayer = Any

# Signature for feature extraction: takes (voter, other) and returns a vector.
FeatureFn = Callable[[Any, Any], np.ndarray]
ActivationFn = Callable[[np.ndarray], np.ndarray]


def tanh_activation(x: np.ndarray) -> np.ndarray:
    return np.tanh(x)


def identity_activation(x: np.ndarray) -> np.ndarray:
    return x


class TrainingBuffer:
    """Collects (feature, label) pairs for offline training."""

    def __init__(self) -> None:
        self.samples: list[Tuple[np.ndarray, int]] = []

    def clear(self) -> None:
        self.samples.clear()

    def add_vote(
        self,
        voter: StrategyPlayer,
        eligibles: Iterable[StrategyPlayer],
        choice: StrategyPlayer,
    ) -> None:
        # Only log for NeuralAgents (they have feature_fn)
        if not hasattr(voter, "_feature_fn"):
            return
        feature_fn = cast(FeatureFn, getattr(voter, "_feature_fn"))
        for cand in eligibles:
            feats = feature_fn(voter, cand)
            label = 1 if cand is choice else 0
            # store copies to avoid mutation side-effects
            self.samples.append((feats.astype(np.float32).copy(), int(label)))

    def to_arrays(self) -> tuple[np.ndarray, np.ndarray]:
        if not self.samples:
            return np.zeros((0, 0), dtype=np.float32), np.zeros((0,), dtype=np.float32)
        X = np.stack([x for x, _ in self.samples])
        y = np.array([y for _, y in self.samples], dtype=np.float32)
        return X, y


# Global buffer used when training mode is enabled.
TRAIN_BUFFER = TrainingBuffer()


class LoggingVotingStrategy(DefaultVotingStrategy):
    """
    Voting strategy that proxies DefaultVotingStrategy and logs training
    samples for NeuralAgents into the global TRAIN_BUFFER.
    """

    def choose_target(
        self,
        voter: StrategyPlayer,
        eligibles: List[StrategyPlayer],
    ) -> StrategyPlayer:
        choice = super().choose_target(voter, eligibles)
        TRAIN_BUFFER.add_vote(voter, eligibles, choice)
        return choice


@dataclass
class NeuralPolicy:
    """Minimal MLP-like policy using NumPy arrays for weights and biases."""

    weights: List[np.ndarray]
    bias: List[np.ndarray]
    activation: ActivationFn = tanh_activation

    def forward(self, x: np.ndarray) -> float:
        h = x
        for w, b in zip(self.weights[:-1], self.bias[:-1]):
            h = self.activation(h @ w + b)
        out = h @ self.weights[-1] + self.bias[-1]
        return float(out.squeeze())


class NeuralAgent(BasePlayer):
    """
    Player variant that defers its target scoring to a tiny neural policy.
    Hooks into existing strategies via _score_target_for_voter.
    """

    def __init__(
        self,
        name: str,
        strategy_level: int | None = None,
        threat_level: int | None = None,
        challenge_ability: int | None = None,
        social_skill: int | None = None,
        *,
        feature_fn: FeatureFn,
        policy: NeuralPolicy,
    ) -> None:
        super().__init__(
            name=name,
            strategy_level=cast(Any, strategy_level),
            threat_level=cast(Any, threat_level),
            challenge_ability=cast(Any, challenge_ability),
            social_skill=cast(Any, social_skill),
        )
        self._feature_fn = feature_fn
        self._policy = policy

    def _score_target_for_voter(self, voter: BasePlayer, other: BasePlayer) -> float:
        feats = self._feature_fn(voter, other)
        return self._policy.forward(feats)


def default_feature_fn(voter: BasePlayer, other: BasePlayer) -> np.ndarray:
    """
    Small, normalized feature vector for voting decisions.
    Adjust or extend as you iterate on the policy.
    """
    rel_cap = float(getattr(voter, "config").relationship_max) if hasattr(
        voter, "config") else 12.0
    rel_to_other = voter.relationships.get(other, 0) / rel_cap
    rel_from_other = other.relationships.get(voter, 0) / rel_cap
    threat = (other.threat_level or 1) / 5.0
    social = (other.social_skill or 1) / 5.0
    strat = (voter.strategy_level or 1) / 5.0
    same_tribe = 1.0 if voter.tribe_label and voter.tribe_label == other.tribe_label else 0.0
    preempt = voter.phase_preempt_mult
    phase_threat = voter.phase_threat_mult
    return np.array(
        [
            rel_to_other,
            rel_from_other,
            threat,
            social,
            strat,
            same_tribe,
            preempt,
            phase_threat,
        ],
        dtype=np.float32,
    )


def make_simple_mlp(input_size: int = 8, hidden: int = 12, seed: int | None = 0) -> NeuralPolicy:
    """
    Convenience helper to create a small, random-initialized policy.
    Swap this out with trained weights later.
    """
    rng = np.random.default_rng(seed)
    w1 = rng.normal(scale=0.4, size=(input_size, hidden)).astype(np.float32)
    b1 = np.zeros((hidden,), dtype=np.float32)
    w2 = rng.normal(scale=0.4, size=(hidden, 1)).astype(np.float32)
    b2 = np.zeros((1,), dtype=np.float32)
    return NeuralPolicy(weights=[w1, w2], bias=[b1, b2])


def train_logistic_from_buffer(
    buffer: TrainingBuffer,
    lr: float = 0.1,
    epochs: int = 300,
    l2: float = 1e-3,
) -> NeuralPolicy:
    """
    Fit a single-layer logistic model (no hidden layer) on the collected samples.
    Returns a NeuralPolicy you can plug back into NeuralAgents.
    """
    X, y = buffer.to_arrays()
    if X.size == 0:
        raise ValueError("Training buffer is empty; run a simulation with logging enabled first.")
    n, d = X.shape
    w = np.zeros((d, 1), dtype=np.float32)
    b = np.zeros((1,), dtype=np.float32)

    for _ in range(epochs):
        pred = 1.0 / (1.0 + np.exp(-(X @ w + b)))  # (n,1)
        err = pred.squeeze() - y  # (n,)
        grad_w = (X.T @ err.reshape(-1, 1)) / n + l2 * w
        grad_b = np.array([err.mean()], dtype=np.float32)
        w -= lr * grad_w
        b -= lr * grad_b

    # Single-layer policy (no activation needed; keep identity)
    return NeuralPolicy(weights=[w], bias=[b], activation=identity_activation)

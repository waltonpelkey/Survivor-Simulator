from __future__ import annotations

# pyright: reportPrivateUsage=false
# pyright: reportUnknownVariableType=false

import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Dict, List

import pytest

from survivor_sim.spreadsheet import (
    SpreadsheetRecorder,
    _iter_objects,
    _name_of,
    _round_value,
)


@dataclass
class FakePlayer:
    name: str


class FakeEvents:
    def __init__(self) -> None:
        self.handlers: Dict[str, List[Callable[..., None]]] = {}

    def on(self, event_name: str, handler: Callable[..., None]) -> None:
        self.handlers.setdefault(event_name, []).append(handler)

    def emit(self, event_name: str, **kwargs: Any) -> None:
        for handler in self.handlers.get(event_name, []):
            handler(**kwargs)


class FakeSim:
    def __init__(self) -> None:
        self.events = FakeEvents()
        self.players: List[FakePlayer] = []
        self.boot_log: List[FakePlayer] = []


def make_recorder() -> tuple[FakeSim, SpreadsheetRecorder]:
    sim = FakeSim()
    recorder = SpreadsheetRecorder(sim)
    return sim, recorder


def test_round_value_returns_int_for_int() -> None:
    assert _round_value(3) == 3


def test_round_value_returns_none_for_non_int() -> None:
    assert _round_value("3") is None
    assert _round_value(None) is None
    assert _round_value(3.5) is None


def test_name_of_uses_name_attribute() -> None:
    assert _name_of(FakePlayer("A")) == "A"


def test_name_of_falls_back_to_string() -> None:
    assert _name_of(123) == "123"


def test_iter_objects_none_returns_empty_iterable() -> None:
    assert list(_iter_objects(None)) == []


def test_iter_objects_string_returns_empty_iterable() -> None:
    assert list(_iter_objects("abc")) == []
    assert list(_iter_objects(b"abc")) == []


def test_iter_objects_list_returns_items() -> None:
    values = [1, 2, 3]
    assert list(_iter_objects(values)) == values


def test_iter_objects_single_non_iterable_returns_empty() -> None:
    assert list(_iter_objects(123)) == []


def test_recorder_attaches_event_handlers() -> None:
    sim, _recorder = make_recorder()

    assert "tribal_start" in sim.events.handlers
    assert "vote_cast" in sim.events.handlers
    assert "eliminated" in sim.events.handlers


def test_tribal_start_creates_round_record() -> None:
    sim, recorder = make_recorder()
    a = FakePlayer("A")
    b = FakePlayer("B")

    sim.events.emit("tribal_start", round=1, pool=[a, b])

    assert recorder.records == [
        {
            "round": 1,
            "pool": ["A", "B"],
            "votes": {},
            "eliminated": None,
        }
    ]


def test_tribal_start_handles_missing_round_and_pool() -> None:
    sim, recorder = make_recorder()

    sim.events.emit("tribal_start")

    assert recorder.records == [
        {
            "round": None,
            "pool": [],
            "votes": {},
            "eliminated": None,
        }
    ]


def test_find_record_for_round_returns_none_when_empty() -> None:
    _sim, recorder = make_recorder()

    assert recorder._find_record_for_round(1) is None


def test_find_record_for_round_none_returns_latest_record() -> None:
    sim, recorder = make_recorder()

    sim.events.emit("tribal_start", round=1, pool=[])
    sim.events.emit("tribal_start", round=2, pool=[])

    assert recorder._find_record_for_round(None) is recorder.records[-1]


def test_find_record_for_round_returns_matching_record() -> None:
    sim, recorder = make_recorder()

    sim.events.emit("tribal_start", round=1, pool=[])
    sim.events.emit("tribal_start", round=2, pool=[])

    assert recorder._find_record_for_round(1) is recorder.records[0]
    assert recorder._find_record_for_round(2) is recorder.records[1]


def test_find_record_for_round_returns_none_for_missing_round() -> None:
    sim, recorder = make_recorder()

    sim.events.emit("tribal_start", round=1, pool=[])

    assert recorder._find_record_for_round(99) is None


def test_vote_cast_adds_vote_to_existing_round_record() -> None:
    sim, recorder = make_recorder()
    a = FakePlayer("A")
    b = FakePlayer("B")

    sim.events.emit("tribal_start", round=1, pool=[a, b])
    sim.events.emit("vote_cast", round=1, voter=a, target=b)

    assert recorder.records[0]["votes"] == {"A": "B"}


def test_vote_cast_creates_record_if_round_missing() -> None:
    sim, recorder = make_recorder()
    a = FakePlayer("A")
    b = FakePlayer("B")

    sim.events.emit("vote_cast", round=3, voter=a, target=b)

    assert recorder.records == [
        {
            "round": 3,
            "pool": [],
            "votes": {"A": "B"},
            "eliminated": None,
        }
    ]


def test_vote_cast_uses_latest_record_when_round_missing_from_event() -> None:
    sim, recorder = make_recorder()
    a = FakePlayer("A")
    b = FakePlayer("B")

    sim.events.emit("tribal_start", round=1, pool=[a, b])
    sim.events.emit("vote_cast", voter=a, target=b)

    assert recorder.records[0]["votes"] == {"A": "B"}


def test_vote_cast_does_not_write_when_voter_missing() -> None:
    sim, recorder = make_recorder()
    b = FakePlayer("B")

    sim.events.emit("tribal_start", round=1, pool=[b])
    sim.events.emit("vote_cast", round=1, target=b)

    assert recorder.records[0]["votes"] == {}


def test_vote_cast_does_not_write_when_target_missing() -> None:
    sim, recorder = make_recorder()
    a = FakePlayer("A")

    sim.events.emit("tribal_start", round=1, pool=[a])
    sim.events.emit("vote_cast", round=1, voter=a)

    assert recorder.records[0]["votes"] == {}


def test_vote_cast_overwrites_same_voter_vote() -> None:
    sim, recorder = make_recorder()
    a = FakePlayer("A")
    b = FakePlayer("B")
    c = FakePlayer("C")

    sim.events.emit("tribal_start", round=1, pool=[a, b, c])
    sim.events.emit("vote_cast", round=1, voter=a, target=b)
    sim.events.emit("vote_cast", round=1, voter=a, target=c)

    assert recorder.records[0]["votes"] == {"A": "C"}


def test_eliminated_sets_eliminated_on_existing_round_record() -> None:
    sim, recorder = make_recorder()
    a = FakePlayer("A")

    sim.events.emit("tribal_start", round=1, pool=[a])
    sim.events.emit("eliminated", round=1, player=a)

    assert recorder.records[0]["eliminated"] == "A"


def test_eliminated_creates_record_if_round_missing() -> None:
    sim, recorder = make_recorder()
    a = FakePlayer("A")

    sim.events.emit("eliminated", round=2, player=a)

    assert recorder.records == [
        {
            "round": 2,
            "pool": [],
            "votes": {},
            "eliminated": "A",
        }
    ]


def test_eliminated_handles_missing_player() -> None:
    sim, recorder = make_recorder()

    sim.events.emit("eliminated", round=2)

    assert recorder.records == [
        {
            "round": 2,
            "pool": [],
            "votes": {},
            "eliminated": None,
        }
    ]


def test_eliminated_triggers_auto_save_when_enabled(tmp_path: Path) -> None:
    sim, recorder = make_recorder()
    out_path = tmp_path / "season.xlsx"

    recorder.auto_save = True
    recorder.auto_save_path = str(out_path)

    sim.events.emit("tribal_start", round=1, pool=[FakePlayer("A")])
    sim.events.emit("eliminated", round=1, player=FakePlayer("A"))

    assert out_path.exists()


def test_eliminated_auto_save_swallows_export_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    sim, recorder = make_recorder()
    recorder.auto_save = True
    recorder.auto_save_path = "bad.xlsx"

    def broken_export(path: str) -> None:
        raise RuntimeError("export failed")

    monkeypatch.setattr(recorder, "export_xlsx", broken_export)

    sim.events.emit("eliminated", round=1, player=FakePlayer("A"))

    assert recorder.records[0]["eliminated"] == "A"


def test_export_csv_like_writes_expected_matrix(tmp_path: Path) -> None:
    sim, recorder = make_recorder()

    a = FakePlayer("A")
    b = FakePlayer("B")
    c = FakePlayer("C")
    sim.boot_log = [c]
    sim.players = [a, b]

    sim.events.emit("tribal_start", round=1, pool=[a, b, c])
    sim.events.emit("vote_cast", round=1, voter=a, target=c)
    sim.events.emit("vote_cast", round=1, voter=b, target=c)
    sim.events.emit("vote_cast", round=1, voter=c, target=b)
    sim.events.emit("eliminated", round=1, player=c)

    out_path = tmp_path / "season.csv"
    recorder._export_csv_like(str(out_path))

    with out_path.open(newline="", encoding="utf-8") as fh:
        rows = list(csv.reader(fh))

    assert rows[0] == ["", "Episode 1"]
    assert rows[1] == ["Eliminated", "C"]
    assert rows[2] == ["Vote", "C-B"]
    assert ["C", "B"] in rows
    assert ["A", "C"] in rows
    assert ["B", "C"] in rows


def test_export_csv_like_appends_csv_extension_when_needed(tmp_path: Path) -> None:
    _sim, recorder = make_recorder()

    out_path = tmp_path / "season"
    recorder._export_csv_like(str(out_path))

    assert (tmp_path / "season.csv").exists()


def test_export_csv_like_uses_records_pool_when_sim_names_fail(tmp_path: Path) -> None:
    sim, recorder = make_recorder()

    sim.boot_log = None  # type: ignore[assignment]
    sim.players = None  # type: ignore[assignment]

    sim.events.emit("tribal_start", round=1, pool=[FakePlayer("A"), FakePlayer("B")])

    out_path = tmp_path / "fallback.csv"
    recorder._export_csv_like(str(out_path))

    with out_path.open(newline="", encoding="utf-8") as fh:
        rows = list(csv.reader(fh))

    assert ["A", ""] in rows
    assert ["B", ""] in rows


def test_export_csv_like_uses_records_pool_when_sim_players_empty(tmp_path: Path) -> None:
    sim, recorder = make_recorder()

    sim.boot_log = [FakePlayer("C")]
    sim.players = []

    sim.events.emit("tribal_start", round=1, pool=[FakePlayer("A"), FakePlayer("B")])

    out_path = tmp_path / "fallback.csv"
    recorder._export_csv_like(str(out_path))

    with out_path.open(newline="", encoding="utf-8") as fh:
        rows = list(csv.reader(fh))

    assert ["A", ""] in rows
    assert ["B", ""] in rows


def test_export_xlsx_creates_workbook(tmp_path: Path) -> None:
    pytest.importorskip("openpyxl")

    sim, recorder = make_recorder()
    a = FakePlayer("A")
    b = FakePlayer("B")

    sim.boot_log = [b]
    sim.players = [a]

    sim.events.emit("tribal_start", round=1, pool=[a, b])
    sim.events.emit("vote_cast", round=1, voter=a, target=b)
    sim.events.emit("eliminated", round=1, player=b)

    out_path = tmp_path / "season.xlsx"
    recorder.export_xlsx(str(out_path))

    assert out_path.exists()


def test_export_xlsx_content_basic_cells(tmp_path: Path) -> None:
    openpyxl = pytest.importorskip("openpyxl")

    sim, recorder = make_recorder()
    a = FakePlayer("A")
    b = FakePlayer("B")

    sim.boot_log = [b]
    sim.players = [a]

    sim.events.emit("tribal_start", round=1, pool=[a, b])
    sim.events.emit("vote_cast", round=1, voter=a, target=b)
    sim.events.emit("eliminated", round=1, player=b)

    out_path = tmp_path / "season.xlsx"
    recorder.export_xlsx(str(out_path))

    wb = openpyxl.load_workbook(out_path)
    ws = wb["Season"]

    assert ws.cell(row=1, column=2).value == "Episode 1"
    assert ws.cell(row=2, column=2).value == "B"
    assert ws.cell(row=3, column=2).value == "B"
    assert ws.cell(row=4, column=1).value == "B"
    assert ws.cell(row=5, column=1).value == "A"


def test_export_xlsx_freeze_panes(tmp_path: Path) -> None:
    openpyxl = pytest.importorskip("openpyxl")

    sim, recorder = make_recorder()
    sim.events.emit("tribal_start", round=1, pool=[FakePlayer("A")])

    out_path = tmp_path / "season.xlsx"
    recorder.export_xlsx(str(out_path))

    wb = openpyxl.load_workbook(out_path)
    ws = wb["Season"]

    assert ws.freeze_panes == "B4"


def test_export_xlsx_falls_back_to_csv_when_openpyxl_missing(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _sim, recorder = make_recorder()

    real_import = __import__

    def fake_import(name: str, *args: Any, **kwargs: Any) -> Any:
        if name.startswith("openpyxl"):
            raise ImportError("no openpyxl")
        return real_import(name, *args, **kwargs)

    monkeypatch.setattr("builtins.__import__", fake_import)

    out_path = tmp_path / "season.xlsx"
    recorder.export_xlsx(str(out_path))

    assert (tmp_path / "season.xlsx.csv").exists()
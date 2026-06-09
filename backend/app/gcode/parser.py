import re
from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class GCodeCommand:
    line_number: int
    command: str
    x: Optional[float] = None
    y: Optional[float] = None
    z: Optional[float] = None
    feed_rate: Optional[float] = None
    spindle_speed: Optional[float] = None

@dataclass
class GCodeAnalysis:
    total_lines: int = 0
    total_commands: int = 0
    rapid_moves: int = 0
    cutting_moves: int = 0
    max_feed_rate: float = 0.0
    min_feed_rate: float = float("inf")
    max_spindle_speed: float = 0.0
    estimated_cutting_distance: float = 0.0
    commands: List[GCodeCommand] = field(default_factory=list)

def parse_value(line: str, letter: str) -> Optional[float]:
    match = re.search(rf"{letter}([-+]?\d*\.?\d+)", line, re.IGNORECASE)
    return float(match.group(1)) if match else None

def parse_gcode(gcode_text: str) -> GCodeAnalysis:
    analysis = GCodeAnalysis()
    lines = gcode_text.strip().split("\n")
    analysis.total_lines = len(lines)

    prev_x, prev_y, prev_z = 0.0, 0.0, 0.0

    for i, line in enumerate(lines):
        line = line.strip()
        if not line or line.startswith(";"):
            continue

        command_match = re.search(r"[GM]\d+", line, re.IGNORECASE)
        if not command_match:
            continue

        command = command_match.group(0).upper()
        x = parse_value(line, "X")
        y = parse_value(line, "Y")
        z = parse_value(line, "Z")
        feed_rate = parse_value(line, "F")
        spindle_speed = parse_value(line, "S")

        gcode_cmd = GCodeCommand(
            line_number=i + 1,
            command=command,
            x=x, y=y, z=z,
            feed_rate=feed_rate,
            spindle_speed=spindle_speed
        )
        analysis.commands.append(gcode_cmd)
        analysis.total_commands += 1

        if command == "G0":
            analysis.rapid_moves += 1
        elif command == "G1":
            analysis.cutting_moves += 1
            if feed_rate:
                analysis.max_feed_rate = max(analysis.max_feed_rate, feed_rate)
                analysis.min_feed_rate = min(analysis.min_feed_rate, feed_rate)
            curr_x = x if x is not None else prev_x
            curr_y = y if y is not None else prev_y
            curr_z = z if z is not None else prev_z
            distance = ((curr_x - prev_x)**2 + (curr_y - prev_y)**2 + (curr_z - prev_z)**2) ** 0.5
            analysis.estimated_cutting_distance += distance

        if spindle_speed:
            analysis.max_spindle_speed = max(analysis.max_spindle_speed, spindle_speed)

        if x is not None: prev_x = x
        if y is not None: prev_y = y
        if z is not None: prev_z = z

    if analysis.min_feed_rate == float("inf"):
        analysis.min_feed_rate = 0.0

    return analysis
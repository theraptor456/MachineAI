from typing import List, Dict
from app.gcode.parser import GCodeAnalysis


def validate_gcode(analysis: GCodeAnalysis, safe_z: float = 5.0) -> List[Dict]:
    """
    Runs rule-based checks against parsed G-Code and returns a list of warnings.
    Each warning has: line_number, severity ("warning" | "error"), message.
    """
    warnings = []

    for cmd in analysis.commands:
        if cmd.command == "G1":
            if not cmd.spindle_on:
                warnings.append({
                    "line_number": cmd.line_number,
                    "severity": "error",
                    "message": "Cutting move (G1) executed with spindle off. Add M3 before this move."
                })
            if cmd.feed_rate is not None and cmd.feed_rate == 0:
                warnings.append({
                    "line_number": cmd.line_number,
                    "severity": "error",
                    "message": "Cutting move (G1) has a feed rate of 0, tool will not move."
                })

        if cmd.command == "G0":
            moving_down_fast = cmd.end_z < cmd.start_z
            below_safe_height = cmd.end_z < safe_z and cmd.start_z < safe_z
            if moving_down_fast and cmd.end_z < 0:
                warnings.append({
                    "line_number": cmd.line_number,
                    "severity": "warning",
                    "message": f"Rapid move (G0) plunges below Z0 ({cmd.end_z}). Verify this is intentional, rapid moves into material can break tools."
                })

        if cmd.end_z < -50 or cmd.end_z > 200:
            warnings.append({
                "line_number": cmd.line_number,
                "severity": "warning",
                "message": f"Z position ({cmd.end_z}) is far outside a typical working range. Check for a decimal or unit error."
            })

    return warnings

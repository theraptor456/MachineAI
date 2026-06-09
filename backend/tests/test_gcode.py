from app.gcode.parser import parse_gcode

def test_parse_basic_gcode():
    sample = """
G0 X0 Y0 Z5
G1 X10 Y0 Z0 F500
G1 X10 Y10 Z0 F500
G1 X0 Y10 Z0 F500
G1 X0 Y0 Z0 F500
G0 Z5
"""
    result = parse_gcode(sample)
    assert result.total_commands > 0
    assert result.cutting_moves == 4
    assert result.rapid_moves == 2
    assert result.max_feed_rate == 500.0
    assert result.estimated_cutting_distance > 0

def test_empty_gcode():
    result = parse_gcode("")
    assert result.total_commands == 0
    assert result.cutting_moves == 0
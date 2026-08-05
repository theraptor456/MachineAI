import numpy as np
from stl import mesh
from scipy.spatial import ConvexHull
from typing import Optional
import io


def load_stl_geometry(file_bytes: bytes) -> dict:
    """
    Loads an STL file from bytes and returns its bounding box and
    XY footprint (convex hull) in the part's native units.
    """
    stl_mesh = mesh.Mesh.from_file(None, fh=io.BytesIO(file_bytes))
    points = stl_mesh.vectors.reshape(-1, 3)

    min_x, min_y, min_z = points.min(axis=0)
    max_x, max_y, max_z = points.max(axis=0)

    xy_points = points[:, :2]
    hull = ConvexHull(xy_points)
    hull_points = xy_points[hull.vertices]

    return {
        "bounding_box": {
            "min_x": float(min_x), "max_x": float(max_x),
            "min_y": float(min_y), "max_y": float(max_y),
            "min_z": float(min_z), "max_z": float(max_z),
        },
        "hull_points": hull_points.tolist(),
    }


def point_in_convex_hull(point: np.ndarray, hull_points: np.ndarray) -> bool:
    """Checks if a point lies inside a convex polygon using the cross-product sign test."""
    n = len(hull_points)
    sign = None
    for i in range(n):
        a = hull_points[i]
        b = hull_points[(i + 1) % n]
        edge = b - a
        to_point = point - a
        cross = edge[0] * to_point[1] - edge[1] * to_point[0]
        if abs(cross) < 1e-9:
            continue
        current_sign = cross > 0
        if sign is None:
            sign = current_sign
        elif sign != current_sign:
            return False
    return True


def hull_x_interval_at_y(y: float, hull_points: np.ndarray) -> Optional[tuple]:
    """
    For a horizontal line at the given Y, finds the [min_x, max_x] interval
    where that line crosses through the convex hull, if any. Since the hull
    is convex, a horizontal line intersects its boundary at exactly two
    points (or zero, if the line misses the hull entirely).
    Returns None if the line does not cross the hull at all.
    """
    n = len(hull_points)
    intersections = []
    for i in range(n):
        a = hull_points[i]
        b = hull_points[(i + 1) % n]
        ay, by = a[1], b[1]
        if (ay <= y < by) or (by <= y < ay):
            t = (y - ay) / (by - ay)
            x = a[0] + t * (b[0] - a[0])
            intersections.append(x)

    if len(intersections) < 2:
        return None

    return (min(intersections), max(intersections))


def generate_roughing_gcode(
    geometry: dict,
    stock_margin: float = 5.0,
    depth_per_pass: float = 2.0,
    tool_diameter: float = 6.0,
    feed_rate: float = 800.0,
    plunge_rate: float = 300.0,
    spindle_speed: int = 10000,
    safe_z: float = 10.0,
) -> str:
    """
    Generates a 2.5D profile roughing G-Code program that clears stock
    material outside the part's convex XY footprint, stepping down in Z
    from the top of the stock to the top of the part.
    """
    bbox = geometry["bounding_box"]
    hull_points = np.array(geometry["hull_points"])

    stock_min_x = bbox["min_x"] - stock_margin
    stock_max_x = bbox["max_x"] + stock_margin
    stock_min_y = bbox["min_y"] - stock_margin
    stock_max_y = bbox["max_y"] + stock_margin
    stock_top_z = bbox["max_z"] + stock_margin
    part_top_z = bbox["max_z"]

    stepover = max(tool_diameter * 0.6, 1.0)

    lines = []
    lines.append("; MachineAI generated roughing toolpath")
    lines.append(f"; Stock: X[{stock_min_x:.2f} to {stock_max_x:.2f}] Y[{stock_min_y:.2f} to {stock_max_y:.2f}]")
    lines.append(f"; Clearing down to part top Z={part_top_z:.2f}")
    lines.append("G21 ; millimeters")
    lines.append("G90 ; absolute positioning")
    lines.append(f"M3 S{spindle_speed}")
    lines.append(f"G0 Z{safe_z:.2f}")

    current_z = stock_top_z
    y_positions = np.arange(stock_min_y, stock_max_y + stepover, stepover)

    while current_z > part_top_z:
        current_z = max(current_z - depth_per_pass, part_top_z)
        lines.append(f"; --- Layer Z={current_z:.2f} ---")
        lines.append(f"G0 Z{safe_z:.2f}")

        direction = 1
        for y in y_positions:
            interval = hull_x_interval_at_y(y, hull_points)

            if interval is None:
                # Line does not cross the part's footprint at this Y, safe to cut straight across
                segments = [(stock_min_x, stock_max_x)]
            else:
                hull_min_x, hull_max_x = interval
                segments = []
                if stock_min_x < hull_min_x:
                    segments.append((stock_min_x, hull_min_x))
                if hull_max_x < stock_max_x:
                    segments.append((hull_max_x, stock_max_x))

            if direction < 0:
                segments = [(b, a) for a, b in reversed(segments)]

            for x_start, x_end in segments:
                lines.append(f"G0 X{x_start:.2f} Y{y:.2f}")
                lines.append(f"G1 Z{current_z:.2f} F{plunge_rate:.0f}")
                lines.append(f"G1 X{x_end:.2f} Y{y:.2f} F{feed_rate:.0f}")

            direction *= -1

        if current_z <= part_top_z:
            break

    lines.append(f"G0 Z{safe_z:.2f}")
    lines.append("M5")
    lines.append("M2")

    return "\n".join(lines)

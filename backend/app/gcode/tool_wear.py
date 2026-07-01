from typing import Optional

MATERIAL_WEAR_FACTOR = {
    "aluminum": 0.3,
    "steel": 1.0,
    "stainless_steel": 1.4,
    "titanium": 2.0,
    "wood": 0.1,
    "plastic": 0.1,
    "unknown": 0.5
}

def predict_tool_wear(
    runtime_minutes: float,
    material: str = "unknown",
    depth_of_cut: float = 1.0,
    cutting_distance: float = 0.0
) -> dict:
    material_key = material.lower().replace(" ", "_")
    wear_factor = MATERIAL_WEAR_FACTOR.get(material_key, 0.5)
    wear_score = (runtime_minutes * 0.4 + cutting_distance * 0.01 + depth_of_cut * 0.5) * wear_factor
    wear_score = round(min(wear_score, 100.0), 2)

    if wear_score < 20:
        wear_level = "Low"
        recommendation = "Tool is in good condition, no action needed."
    elif wear_score < 50:
        wear_level = "Moderate"
        recommendation = "Monitor tool closely, consider inspection after this job."
    elif wear_score < 75:
        wear_level = "High"
        recommendation = "Tool replacement recommended before next job."
    else:
        wear_level = "Critical"
        recommendation = "Replace tool immediately."

    return {
        "wear_score": wear_score,
        "wear_level": wear_level,
        "recommendation": recommendation
    }

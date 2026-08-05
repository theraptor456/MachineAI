export const glossary: Record<string, string> = {
  "total lines": "The number of lines in the raw G-Code file, including comments and blank lines.",
  "total commands": "The number of actual machine instructions parsed from the file (movement, spindle, and tool commands).",
  "rapid moves": "Fast, non-cutting moves (G0) used to reposition the tool quickly, typically when not touching the material.",
  "cutting moves": "Moves that cut material (G1), performed at a controlled feed rate rather than full speed.",
  "max feed rate": "The fastest cutting speed used anywhere in the program, in units per minute.",
  "min feed rate": "The slowest cutting speed used anywhere in the program, in units per minute.",
  "max spindle speed": "The highest spindle RPM (rotations per minute) commanded in the program.",
  "estimated cutting distance": "The total distance the tool travels while actively cutting material.",
  "estimated rapid distance": "The total distance the tool travels during fast repositioning moves, not cutting.",
  "estimated runtime minutes": "An estimate of how long the whole program will take to run, based on feed rates and distances.",
  "estimated cost": "A rough cost estimate based on estimated machine runtime.",
  "tool wear": "A prediction of how much this job will wear down the cutting tool, based on material, depth of cut, and runtime.",
  "wear score": "A 0-100 score estimating cumulative tool wear for this job. Higher means more wear.",
  "wear level": "A simplified category (Low, Moderate, High, Critical) summarizing the wear score.",
  "recommendation": "A suggested next step based on the predicted tool wear.",
  "manufacturing risk": "An overall risk rating for this job, derived from the predicted tool wear.",
  "material": "The stock material being machined, which affects cutting speeds, tool wear, and surface finish.",
  "tool name": "The specific cutting tool selected for this job.",
  "feed rate": "How fast the tool moves through material while cutting, usually in mm/min or in/min. Too fast can break a tool; too slow can burn the material.",
  "spindle speed": "How fast the tool itself spins, measured in RPM.",
  "chip load": "The thickness of material removed per cutting edge per revolution. A key factor in tool life and surface finish.",
}

export function glossaryLookup(label: string): string | null {
  return glossary[label.trim().toLowerCase()] || null
}

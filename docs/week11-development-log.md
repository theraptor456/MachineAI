# Week 11 Development Log

**Project:** MachineAI
**Date:** August 5, 2026

## Project Overview

Week 11 closed out the two features scoped at the end of Week 10: a toolpath simulation and validation view, and a G-Code generator that produces a working roughing toolpath directly from an uploaded STL file. Alongside these, a full visual polish pass was 
carried out across every page, lightweight page transitions were added, and a real correctness bug was caught and fixed in the toolpath generator before it shipped.

By the end of the week, MachineAI could take a 3D model as input and carry it all the way through to a simulated, validated, ready-to-run G-Code program, entirely within the platform.

---

## Development Objectives

The goals for this development cycle were:

* Apply a consistent visual polish pass across every page: spacing, typography hierarchy, hover states, and card treatment
* Add lightweight page transitions
* Build a G-Code toolpath simulation view with rule-based error checking
* Build a 2.5D roughing G-Code generator driven by an uploaded STL file
* Correct scope by formally dropping a previously planned RC car component

---

## Interface Polish Pass

With the industrial visual identity established in Week 10, this week focused on refining the execution of that identity rather than changing it. A generic "premium SaaS" redesign prompt was evaluated and deliberately set aside, since its rounded, gradient-heavy 
direction would have undone the distinct, non-generic look established the week prior. Instead, spacing, typography hierarchy, and interactive states were tightened while keeping the existing color system and sharp-cornered layout intact.

### Consistency Pass

Every page, the dashboard, login, registration, project detail, and the AI assistant, was brought in line with a shared set of conventions: uniform card borders and padding, small uppercase section labels above headings, monospace formatting for numeric data, and 
consistent button hierarchy so that each page has one clear primary action rather than several competing ones. Hover states were added to interactive cards and buttons to make the interface feel responsive rather than static.

### Page Transitions

A lightweight fade-and-slide transition was added on page mount, applied uniformly across all five pages through a small reusable wrapper component, giving navigation a smoother feel without introducing an animation library or any meaningful complexity.

---

## G-Code Toolpath Simulation

The G-Code parser built in earlier weeks already tracked feed rates, distances, and command types, but had no way to visualize a program or catch mistakes before it reached a machine. This week added both.

### Move Export and Validation

The parser was extended to resolve and store the absolute start and end coordinates of every move, along with whether the spindle was active at that point in the program. A new validation module runs a set of rule-based checks across every parsed move: cutting 
moves executed with the spindle off, a cutting feed rate of zero, and Z positions far outside a typical working range. A new endpoint returns both the resolved move list and any warnings found.

### Toolpath Viewer

A canvas-based visualizer was built to plot every move as a line, with rapid moves rendered as dashed gray segments and cutting moves rendered in the platform's accent color, automatically scaled and centered regardless of the part's actual size. Any move flagged 
by validation is highlighted directly on the plotted path in red or amber depending on severity, so a problem can be traced visually to the exact segment that caused it, alongside a written list of warnings below the plot.

### Verification

This was tested with deliberately broken G-Code, a cutting move issued before the spindle was turned on, and confirmed to correctly flag only that specific move both in the warnings list and in the rendered path, while leaving valid moves elsewhere in the same 
program unaffected.

---

## STL-to-G-Code Generation

The larger addition this week was a generator capable of producing a real, runnable roughing toolpath directly from an uploaded 3D model, rather than requiring G-Code to be written or exported from separate CAD software.

### Geometry Extraction

An uploaded STL file is parsed to obtain its full set of vertices, from which a bounding box and the convex hull of the part's top-down footprint are computed. This footprint stands in for the part's outer silhouette, a deliberate simplification that handles 
straightforward geometry well without attempting full adaptive machining of arbitrary 3D shapes.

### Roughing Strategy

The generator produces a 2.5D profile roughing program: starting from the top of a stock block sized around the part with a configurable margin, it steps downward in Z by a configurable depth per pass, and at each level runs a back-and-forth raster pattern across 
the stock, clearing material everywhere outside the part's footprint.

### A Correctness Bug Caught Before Shipping

The first working version of this generator only checked whether the starting point of each raster line fell inside the part's footprint, and skipped the entire line if so. Testing against a simple block-shaped test part revealed the actual problem: rows that 
began outside the footprint but passed through it partway across would still be cut in a single straight line, running directly through the interior of the part rather than around it, which would gouge a real workpiece rather than clear stock around it.

This was corrected by computing, for each raster row, the exact interval where that row's line crosses the convex hull, and cutting only the segments of that row lying outside the part, split into two separate passes on either side where necessary. Retesting 
against the same test part confirmed the fix: rows crossing the part's footprint now correctly rapid over the interior and only cut on either side of it, matching what the toolpath simulation view also confirmed visually as a clean, part-avoiding path.

### End-to-End Integration

An upload control was added directly to the dashboard, sending a selected STL file to the generator with a fixed set of starting parameters and loading the resulting G-Code straight into the existing analyzer text area, so a generated toolpath can be immediately 
analyzed and simulated without leaving the page or re-entering anything manually.

---

## Scope Confirmation

The RC car component considered earlier in the project was formally dropped to keep remaining development time focused on depth within the core platform.

---

## Challenges Encountered

### A Silent Correctness Bug in Generated Toolpaths

The most significant issue this week was not a crash or a visible error, but a toolpath that looked plausible and ran without complaint while actually being wrong: it would have cut through the part it was supposed to machine around. This was only caught by 
actually inspecting the generated G-Code output closely rather than assuming a successful API response meant a correct result, reinforcing that verifying the actual content of generated output matters as much as verifying that generation succeeded.

### Development Environment Interruptions

Multiple points this week involved the local environment needing to be re-verified after being closed and reopened, including a Homebrew internal error that broke the `brew services list` command itself on this machine's older macOS version. This was resolved by 
checking PostgreSQL's actual running state directly through `pg_isready` and process inspection rather than relying on the broken command, confirming the underlying service was healthy despite the tooling around it failing.

### Automated Multi-Component File Edits

An automated find-and-replace intended to wrap each page in a transition component assumed one component per file, which broke on the one file containing two components, mismatching an opening and closing tag across the wrong pair. This was caught immediately by 
the resulting build error and corrected by manually locating and pairing the tags for the correct component.

---

## Lessons Learned

* A successful response from a generation pipeline is not the same as a correct one; generated output, especially anything meant to drive physical machinery, needs to be inspected on its own terms before being trusted.
* Simplifying a hard problem, such as reducing 3D part geometry to a 2D outer footprint, can produce a genuinely useful result, but the simplification's boundaries need to be enforced correctly rather than partially, since a partial implementation of a 
safety-relevant check is often worse than none, as it creates false confidence.
* When automation assumes a pattern (one component per file, one visual identity per prompt), verifying that assumption holds before trusting the automation's output at scale saves significant rework.
* Tooling issues on an unsupported or older platform configuration are worth diagnosing independently from the underlying service they wrap, since the two can fail separately.

---

## Impact on Project

Week 11 completed the last two mandatory features of the project: MachineAI can now simulate and validate a G-Code program visually before it ever reaches a machine, and can generate a working roughing toolpath directly from a 3D model rather than requiring one 
to be written by hand. Combined with the interface polish and transitions, the platform now presents a complete, coherent workflow from model upload through to a verified, ready-to-run program, closing the gap between MachineAI as a set of individual tools and 
MachineAI as a single, usable platform.

---

## Goals for Week 12

* Expand automated test coverage across the G-Code parser, validation logic, and STL generator
* Review and, where useful, expose additional generation parameters (stock margin, depth per pass, tool diameter) directly in the upload UI rather than fixed defaults
* Begin preparing the project for deployment outside of local development

---

## Project Status

**Current Status:** Full Model-to-Verified-G-Code Workflow Operational

**Next Milestone:** Testing Expansion and Deployment Preparation

**Estimated Project Stage:** 92% Complete

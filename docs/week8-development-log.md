# Week 8 Development Log

**Project:** MachineAI
**Date:** June 30, 2026

## Project Overview

This week began with a platform change, moving primary development from a Windows machine to a Mac, which required rebuilding the local environment from the ground up. With that groundwork complete, focus shifted to the core Week 8 objective: replacing 
placeholder runtime and risk calculations with a real runtime estimation engine and a functioning tool wear prediction model.

By the end of the week, MachineAI's G-Code analyzer produced genuinely calculated results rather than static placeholders, factoring in rapid versus cutting motion, per-segment feed rates, and material-based tool wear, with a manufacturing risk level derived 
directly from that wear score.

---

## Development Objectives

The goals for this development cycle were:

* Migrate the local development environment from Windows to macOS
* Establish a working PostgreSQL instance without relying on Docker
* Upgrade the G-Code parser to calculate runtime using rapid and cutting feed rates separately
* Build a tool wear prediction model based on material, depth of cut, and cutting distance
* Replace the hardcoded manufacturing risk value with a calculated risk level
* Verify the updated analysis workflow end-to-end through the frontend

---

## Environment Migration to macOS

Development infrastructure had to be rebuilt after switching primary hardware from Windows to a Mac running an older version of macOS.

### Docker Compatibility Issue

Docker Desktop requires macOS 14 or later, which was not available on the machine in use. Rather than attempting to work around this limitation, the decision was made to drop the Docker-based database setup entirely in favor of a native PostgreSQL installation 
managed through Homebrew.

### Native PostgreSQL Setup

PostgreSQL was installed and configured directly on the host machine. This required:

* Installing PostgreSQL through Homebrew
* Manually initializing the database data directory, which had not been created automatically
* Starting the PostgreSQL service and confirming it was running
* Creating a dedicated `machineai` role and `machineai_db` database

This approach removes Docker as a dependency for local development going forward, at the cost of losing the one-command environment setup Docker previously provided.

### Locating the Project and Rebuilding the Python Environment

The project directory had been placed in Downloads rather than the home folder, which initially caused navigation errors. Once located, a fresh Python virtual environment was created and all backend dependencies were reinstalled, including the PostgreSQL driver, 
which had been missed on the first pass and had to be added separately before the server would start.

---

## Runtime Estimation Engine

The G-Code parser was upgraded to produce a meaningfully more accurate runtime estimate than the previous single-formula calculation.

### Separating Rapid and Cutting Motion

Previously, runtime was estimated using a single feed rate applied to the total cutting distance. The parser now tracks rapid moves and cutting moves independently, applying a fixed rapid traverse rate to `G0` movements and the actual programmed feed rate to `G1` 
movements, then sums the time contribution of each move as it is parsed.

### Additional Metrics

The parser now also reports:

* Estimated rapid distance, separate from cutting distance
* A running total of estimated runtime in minutes, calculated per segment rather than from total distance alone

This produces a runtime estimate that responds correctly to G-Code containing a mix of fast positioning moves and slower cutting moves, rather than treating all movement as uniform.

---

## Tool Wear Prediction

A new module was introduced to estimate tool wear based on manufacturing conditions rather than returning a static value.

### Wear Calculation

Tool wear is calculated from three inputs: runtime, depth of cut, and cutting distance, combined and then scaled by a material-specific wear factor. Materials such as titanium and stainless steel are weighted to produce faster wear accumulation than materials 
like aluminum or plastic, reflecting real-world tooling behavior.

### Wear Levels and Recommendations

The resulting wear score is mapped to one of four levels — Low, Moderate, High, or Critical — each paired with a corresponding recommendation ranging from no action needed to immediate tool replacement.

### Risk Level Integration

The manufacturing risk level returned by the analysis endpoint, previously hardcoded to "Low" in all cases, is now derived directly from the calculated wear score, so risk and tool condition stay consistent with one another.

---

## Analysis Endpoint Updates

The G-Code analysis route was updated to tie the parser and tool wear modules together into a single response.

### Expanded Request Parameters

The endpoint now accepts optional material, depth of cut, and tool name parameters in addition to the G-Code text, allowing the wear calculation to reflect the actual job conditions rather than defaulting silently.

### Expanded Response

The response now includes rapid distance, calculated runtime, the full tool wear object, and the derived manufacturing risk level, alongside the metrics already being returned from previous weeks.

---

## Database Schema Resolution

Setting up the database on the new machine surfaced a recurring issue from earlier in the project: a leftover, unused version of the backend configuration and initial migration that does not match the application's actual models.

### Root Cause

An earlier, abandoned scaffold of the project had defined its own version of the users table and its own database URL default, using a different PostgreSQL driver than the one actually installed. Running migrations against a fresh database applied this outdated 
schema, producing a users table missing the `username` column required by the real application.

### Resolution

The mismatched configuration default was corrected to reference the installed driver, and the incorrect users table was dropped. Rather than continuing to rely on the outdated migration, the schema was generated directly from the application's actual SQLAlchemy 
models, producing a correct table structure that matched what the backend code expects.

---

## Frontend Rendering Fix

Testing the updated analyzer revealed that the newly added tool wear data was not displaying correctly in the dashboard, showing as a generic object reference instead of its individual fields.

### Cause

The analyzer results grid rendered every field returned by the API using a single generic formatter, which works for simple values but does not handle nested objects like the new tool wear data.

### Fix

The rendering logic was updated to detect object-type values and display their individual key-value pairs, while leaving simple values formatted as before. This allows the wear score, wear level, and recommendation to each display correctly without requiring a 
dedicated component.

---

## Source Control Access Issue

Pushing the completed work revealed that the local Git credentials on the new machine were tied to a different GitHub account than the one with write access to the repository.

### Resolution

The cached credential was cleared, and GitHub's command-line tool was installed to handle authentication through the browser rather than relying on a stored credential that had become inconsistent between the terminal and the code editor. Once authenticated under 
the correct account, the push completed successfully.

---

## End-to-End Verification

Once all fixes were in place, the complete Week 8 workflow was tested and confirmed working:

* Sample G-Code containing both rapid and cutting moves was submitted through the dashboard analyzer
* Rapid distance, cutting distance, and runtime were all calculated and displayed correctly
* Tool wear score, wear level, and recommendation displayed correctly as individual fields
* Manufacturing risk level reflected the calculated wear score rather than a static value

---

## Challenges Encountered

### Recurring Configuration Drift

This is the second time a leftover, unused scaffold file has caused a database schema mismatch. As with the earlier occurrence, the fix required tracing the issue back to a configuration default rather than the migration files themselves.

### Cross-Machine Environment Setup

Rebuilding the development environment on a new operating system surfaced several small but blocking issues in sequence, including a missing database driver, an uninitialized PostgreSQL data directory, and a permissions error on the frontend's build tool, each of 
which had to be resolved before development could resume.

### Git Identity Conflicts Across Machines

Switching development machines also introduced a Git authentication conflict, since the new machine's cached GitHub identity did not match the account with access to the repository. This was resolved by clearing the credential cache and re-authenticating through 
the GitHub CLI.

---

## Lessons Learned

* Leftover scaffold files from earlier project iterations continue to be a recurring source of subtle bugs and should eventually be removed entirely rather than left in the repository.
* When migrating development environments, database and credential setup should be verified independently before resuming feature work, rather than assumed to carry over.
* Generating a database schema directly from the application's models is a reliable fallback when migration history does not match the current codebase.
* Generic, type-agnostic rendering logic in the frontend breaks down once the backend starts returning structured, nested data, and should be handled explicitly.

---

## Impact on Project

Week 8 replaced the project's last remaining placeholder logic — static runtime estimation and a hardcoded risk level — with calculations grounded in actual G-Code content and manufacturing conditions. MachineAI's analysis engine now behaves consistently with how 
a real CNC job would be evaluated, distinguishing between rapid and cutting motion and connecting tool wear directly to manufacturing risk. The successful migration to macOS also confirms the project is not tied to a single development environment, which reduces 
risk heading into the final weeks.

---

## Goals for Week 9

* Integrate material and tool selection into the analyzer interface so wear predictions no longer default to unknown conditions
* Begin development of the AI CNC Assistant, using the Claude API as the primary provider
* Implement provider rotation to fall back to alternate AI providers if the primary is unavailable
* Expand automated test coverage to include the new parser and tool wear logic

---

## Project Status

**Current Status:** Runtime Estimation Engine and Tool Wear Prediction Operational

**Next Milestone:** AI CNC Assistant with Multi-Provider Rotation

**Estimated Project Stage:** 68% Complete

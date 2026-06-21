\# Week 7 Development Log



\*\*Project:\*\* MachineAI

\*\*Date:\*\* June 19, 2026



\## Project Overview



This week focused on expanding the MachineAI backend with tooling and material management capabilities, and on connecting G-Code analysis results directly to individual projects. The primary objective was to move beyond a single, generic analysis tool and toward a system where manufacturing data is organized and tracked on a per-project basis, mirroring how an engineer would actually use the platform.



By the end of the week, MachineAI supported full tool and material management through the API, and users could open a specific project, run a G-Code analysis against it, and see that analysis saved and displayed as part of the project's history.



\---



\## Development Objectives



The goals for this development cycle were:



\* Create API endpoints for managing CNC tooling data

\* Create API endpoints for managing manufacturing material data

\* Link G-Code analysis results to specific projects rather than treating each analysis as a standalone request

\* Build a project detail page in the frontend to display project-specific analysis history

\* Verify the full workflow from project selection through analysis and result storage



\---



\## Tool and Material Management API



Dedicated service and route files were created to support full CRUD-style management of CNC tooling and manufacturing materials.



\### Tool Management



The tools endpoint supports:



\* Listing all tools

\* Adding a new tool with diameter, flute count, maximum RPM, and maximum feed rate

\* Removing a tool by ID



\### Material Management



The materials endpoint supports:



\* Listing all materials

\* Adding a new material with hardness, tensile strength, and recommended feed rate and RPM

\* Removing a material by ID



Both endpoint groups were registered with the main application and verified through the FastAPI interactive documentation, confirming that all routes function correctly and require authentication.



\---



\## Linking Analysis Results to Projects



Previously, G-Code analysis was a standalone operation that returned results without storing them anywhere. This week, the G-Code analysis endpoint was updated to optionally accept a project ID, allowing results to be saved directly against a project.



\### Analysis Service



A new service layer was introduced to handle saving and retrieving analysis results, separating that logic from the route handling code.



\### Updated Analysis Endpoint



The G-Code analysis endpoint was expanded to calculate an estimated runtime and estimated cost based on the parsed G-Code metrics, in addition to the metrics already being returned. When a project ID is supplied, the result is saved to the database and associated with that project.



\### Project Analysis History Endpoint



A new endpoint was added to the projects router allowing the frontend to retrieve the full analysis history for a specific project.



\---



\## Project Detail Page



A new frontend page was created to give each project its own dedicated view.



\### Page Functionality



The project detail page includes:



\* The project name and description

\* A G-Code input panel scoped to that specific project

\* An analysis history section displaying previously saved results, including estimated runtime, estimated cost, and manufacturing risk



\### Dashboard Integration



The main dashboard was updated so that clicking on a project navigates directly to its detail page, creating a natural workflow from the project list to project-specific analysis.



\---



\## Debugging and File Integrity Issues



Several issues this week stemmed from file content not saving correctly when pasted through the editor, a recurring pattern from previous weeks.



\### Empty Service File



The analysis service file was created but saved empty, causing an import error on backend startup. This was resolved by writing the file contents directly through the terminal rather than relying on manual paste-and-save.



\### Stale Route File



After updating the G-Code analysis route to support project linking, testing revealed that analysis results were not being saved to the database despite the API returning a successful response. Investigation showed that the route file still contained the original, unmodified version from Week 4, meaning the new logic had never actually been saved. This was resolved the same way, by writing the corrected file directly through the terminal and verifying its contents before restarting the server.



\### Verification Process



Both issues were caught using a combination of the browser network inspector, direct database queries, and direct file inspection in the terminal, confirming at each step whether the problem was in the frontend request, the backend logic, or the saved file contents.



\---



\## End-to-End Verification



Once the file issues were resolved, the complete workflow was tested and confirmed working:



\* Opening a project from the dashboard

\* Submitting G-Code for analysis from within the project detail page

\* Confirming the analysis was saved to the database

\* Confirming the saved analysis appeared correctly in the project's analysis history, including calculated runtime and cost



\---



\## Challenges Encountered



\### Recurring File Save Issues



This week reinforced a pattern first seen in earlier weeks, where pasted file content does not always save correctly through the code editor. Writing files directly through the terminal proved to be a more reliable method for ensuring code changes are actually applied before testing.



\### Misleading Success Responses



The G-Code analysis endpoint returned a successful response even when the underlying save operation was not actually being reached, because the outdated route file did not contain the save logic at all. This highlighted the importance of verifying actual database state rather than relying solely on HTTP status codes when debugging.



\---



\## Lessons Learned



\* A successful HTTP response does not guarantee that the expected backend logic actually executed; database state should be checked directly when behavior seems inconsistent with expectations.

\* Writing files directly through the terminal is more reliable than pasting into an editor when working through many file changes quickly.

\* Linking related data, such as analysis results to projects, significantly improves the practical usefulness of an API over standalone, disconnected endpoints.

\* Separating database logic into dedicated service files continues to make new features easier to add without modifying route logic directly.



\---



\## Impact on Project



Week 7 moved MachineAI from a platform with isolated features into one with a coherent, connected workflow. Tooling and material data can now be managed through the API, and most importantly, manufacturing analysis is no longer disconnected from the projects it belongs to. Users can now build a history of analysis results for each project, which is a foundational requirement for the prediction and optimization features planned in later phases.



\---



\## Goals for Week 8



\* Begin development of the runtime estimation engine using tool and material data

\* Incorporate tool and material selection into the G-Code analysis workflow

\* Lay the groundwork for tool wear prediction

\* Expand automated test coverage for the new tool, material, and analysis endpoints

\* Continue refining the frontend interface ahead of the planned visual redesign



\---



\## Project Status



\*\*Current Status:\*\* Tool and Material Management Complete, Project-Linked Analysis Operational



\*\*Next Milestone:\*\* Runtime Estimation Engine and Tool Wear Prediction Foundations



\*\*Estimated Project Stage:\*\* 58% Complete


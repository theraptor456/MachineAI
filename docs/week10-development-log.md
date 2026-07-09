# Week 10 Development Log

**Project:** MachineAI
**Date:** July 7, 2026

## Project Overview

Week 10 focused on two fronts: giving MachineAI a visual identity of its own, and rounding out the AI CNC Assistant into a genuinely capable feature rather than a basic chat box. The platform's 
interface was redesigned around an industrial, machinist-inspired aesthetic instead of a generic dark dashboard, and the assistant was extended to understand a user's selected material and tool, 
identify both directly from a photo, and fall back across multiple AI providers if needed.

By the end of the week, MachineAI looked and felt distinct from a templated AI-generated app, and its assistant could ground its advice in a user's actual project context instead of speaking 
only in generalities.

---

## Development Objectives

The goals for this development cycle were:

* Replace the platform's generic dark dashboard styling with a visual identity grounded in the CNC/machining domain
* Allow the AI Assistant to take a selected material and tool into account when answering
* Let users identify a tool or material automatically from a photo instead of entering it manually
* Support capturing that photo directly from a camera, on any device
* Complete the AI provider rotation by implementing the remaining fallback provider

---

## UI Redesign

The platform's original interface, dark backgrounds, rounded corners, and a purple-toned accent color, was functional but visually indistinguishable from a generic templated dashboard. Since 
MachineAI's actual subject matter is CNC machining, the interface was redesigned to draw from that world directly rather than conventional SaaS design patterns.

### Design Direction

The new direction pulls from machine shop signage and technical tooling interfaces: a graphite background instead of blue-black, safety-orange as the sole accent color reserved for primary 
actions, sharp two-pixel corners instead of soft rounded ones, and a geometric display typeface paired with a monospace font for all numeric data and G-Code, so coordinates and stats read the 
way they would on an actual piece of shop equipment.

### Implementation

Fonts were added at the document level, and a base stylesheet was introduced to standardize input, button, and typography treatment across the app. Color values were then swept across every page 
component, with the swap deliberately scoped to color values only after an initial pass accidentally caught spacing and font-size values as well. That first attempt was caught before being 
committed and cleanly reverted, and a second, narrower pass corrected the palette without disturbing layout.

### Button Hierarchy

With the new accent color in place, every button had briefly become equally prominent. A pass was made to reserve the orange accent for each page's single primary action, restyling secondary 
actions like navigation and list-add buttons to a muted, bordered style so the interface communicates priority rather than treating every action as equally important.

---

## Material and Tool Context in the AI Assistant

The AI Assistant previously answered every question in the abstract, with no awareness of what a user was actually working with. This week it was connected to the platform's existing material 
and tool data.

### Backend Changes

The chat endpoint was extended to accept an optional material and tool name alongside a user's message. The AI service builds a short context statement from these values and prepends it to the 
system prompt before the request reaches whichever provider is handling it, so the assistant's advice is grounded in the user's actual setup without the user needing to restate it in every 
message.

### Frontend Selection

Two dropdowns were added to the assistant interface, populated from the platform's existing materials and tools endpoints, allowing a user to select their current material and tool before 
starting a conversation. Selections persist across the conversation and are sent with every message automatically.

---

## Image-Based Tool and Material Identification

Rather than requiring users to manually search for and select their material or tool, a new capability was added to identify either one directly from a photograph.

### Vision Integration

A new function was added to the AI service that sends an uploaded image to Gemini's vision capability along with a prompt requesting a structured description of the item, either a cutting tool's 
type, material, diameter, and flute count, or a stock material's name and mechanical properties, returned strictly as JSON.

### Endpoint and Auto-Creation

A new endpoint accepts an uploaded image and a type indicating whether it depicts a tool or a material, passes it to the vision function, and automatically creates the corresponding database 
record from the result. The newly identified item is immediately selected in the assistant's dropdowns, so the flow requires no manual data entry at any point.

### Frontend Upload Flow

Each dropdown gained an upload control allowing a user to select an existing photo from their device, triggering identification and record creation as soon as a file is chosen.

---

## Cross-Platform Camera Capture

An initial attempt to support taking a photo directly, rather than only uploading an existing one, relied on a native file input's camera capture attribute. This worked on mobile browsers but 
had no equivalent behavior on desktop, where it simply fell back to a standard file picker with no way to actually use a connected camera.

### Live Camera Modal

This was replaced with a dedicated camera capture interface built on the browser's standard media device API, which is supported consistently across desktop and mobile browsers regardless of 
operating system. Selecting the camera option opens a modal with a live video preview from the device's camera, a capture button that freezes and saves the current frame as an image, and a 
cancel option that releases the camera without submitting anything.

### Verification

This was tested directly on the development machine and confirmed to request camera permission and display a live feed as expected, providing a genuinely working camera flow on a laptop rather 
than one that silently degrades to a file picker.

---

## Completing the AI Provider Rotation

With Gemini already live as the assistant's primary, free-tier provider, the remaining fallback provider was implemented to complete the rotation architecture first designed in Week 9.

### OpenAI Fallback

The previously unimplemented OpenAI function was built out, converting the conversation history and context into the message format that provider expects and returning its response through the 
same structure already used by the other providers. Since no OpenAI or Anthropic key has been added yet, deliberately avoiding further spending beyond the free tier for now, this fallback 
remains inactive but fully implemented, and will begin working the moment a key is added to the environment file, exactly as Gemini did in Week 9.

---

## Challenges Encountered

### Overly Broad Find-and-Replace During the Redesign

The first pass at repainting the interface's color palette used a script that also matched numeric spacing and radius values sharing the same digits as the old color codes, corrupting font 
sizes, padding, and gaps across every page. Because this was caught through visual inspection before anything was committed, it was resolved by reverting the affected files entirely and 
rewriting the replacement script to match color values exclusively.

### Native Camera Capture Not Working Cross-Platform

The initial camera implementation appeared to work in principle but only actually engaged a camera on mobile devices, silently falling back to a plain file picker on desktop with no indication 
anything was different. This was identified through direct testing rather than assumption, and resolved by moving to a live video-based capture approach that behaves consistently regardless of 
platform.

---

## Lessons Learned

* Broad find-and-replace operations across a codebase should be scoped as narrowly as possible, matching by property name rather than by value alone, since identical-looking values can serve 
entirely different purposes in different places.
* Visually verifying a change before committing it is what caught the redesign issue this week; a change that runs without errors is not the same as a change that behaves correctly.
* Platform-specific browser behavior should be tested directly on the platforms it claims to support rather than assumed from documentation, since a feature can appear to work while silently 
degrading on another device.
* Completing a rotation architecture's remaining providers ahead of actually needing them, as was done here with OpenAI, means the platform can absorb future provider outages or rate limits 
without additional development work later.

---

## Impact on Project

Week 10 gave MachineAI a visual identity that matches its subject matter rather than reading as a generic AI-generated dashboard, and turned the AI Assistant from a standalone chatbot into a 
feature genuinely integrated with the rest of the platform, aware of a user's material and tool, and capable of identifying either directly from a photo taken on any device. Combined with the 
completed provider rotation, the platform is closer than ever to something ready to be used and shared by others.

---

## Goals for Week 11

* Conduct a final review pass of the redesigned interface across all remaining pages and states
* Expand automated test coverage to include the AI service, image identification, and camera capture flow
* Begin preparing the project for deployment outside of local development

---

## Project Status

**Current Status:** Redesigned UI with Context-Aware, Vision-Enabled AI Assistant

**Next Milestone:** Testing Expansion and Deployment Preparation

**Estimated Project Stage:** 85% Complete

# Week 9 Development Log

**Project:** MachineAI
**Date:** July 3, 2026

## Project Overview

Week 9 introduced the AI CNC Assistant, the platform's most significant new feature to date. This gives users a conversational way to get machining guidance directly inside MachineAI, rather 
than relying solely on the G-Code analyzer. The assistant was built around a multi-provider architecture from the start, so the platform is not dependent on any single AI vendor, and a free-tier 
provider was integrated first to validate the entire pipeline before any paid usage begins.

By the end of the week, the assistant was answering real, detailed machining questions through a purpose-built chat interface, while correctly declining questions unrelated to CNC machining and 
manufacturing.

---

## Development Objectives

The goals for this development cycle were:

* Design a provider-agnostic AI service layer that can rotate between multiple AI vendors
* Build a chat endpoint and connect it to the existing authentication system
* Verify the full request/response flow before connecting any real AI provider
* Integrate a free-tier AI provider to avoid unnecessary spending during development
* Restrict the assistant's responses to CNC and manufacturing topics only
* Build a dedicated chat interface in the frontend, consistent with the rest of the platform's design
* Improve the readability of the API documentation page

---

## AI Service Architecture

The core of this week's work is a dedicated service layer that separates the concept of "getting an AI response" from any specific provider's API.

### Provider Rotation Design

The service defines a list of available providers, checked in order, with the first configured provider handling the request and any exception triggering a fallback to the next. This means 
adding, removing, or reordering providers is a small, isolated change rather than something that touches the route or frontend at all.

### Mock Mode

Before any provider was connected, the service was built to detect the absence of any API key and automatically return a clearly labeled mock response instead of failing outright. This allowed 
the entire request pipeline, authentication, routing, and frontend, to be built and verified independently of any external service or cost.

---

## Backend Endpoint

A new authenticated route was added to accept a user's message and optional conversation history, pass it to the AI service, and return the response along with which provider handled it. This 
was registered alongside the platform's existing routes for projects, tools, materials, and G-Code analysis, following the same authentication pattern already in place.

---

## End-to-End Testing in Mock Mode

Before connecting a real provider, the full flow was verified using the existing authentication system: logging in to obtain a token, then calling the new endpoint directly with that token 
attached. The endpoint correctly identified that no provider was configured and returned a clearly labeled placeholder response, confirming that authentication, routing, and the service layer 
were all working correctly together prior to introducing any external dependency.

---

## Choosing a Free-Tier Provider

Rather than connecting a paid provider immediately, the decision was made to first validate the assistant using a provider with a genuine no-cost tier, delaying any spending until the feature 
was fully built and tested.

### Provider Selection

Of the options considered, Google's Gemini offered the most viable free tier with no payment method required to get started, making it the natural first provider to integrate, with paid 
providers already structured into the rotation for later use if needed.

### API Key Setup

An API key was generated through Google AI Studio and stored in a local environment file, which is already excluded from version control, so the key is never exposed in the repository.

---

## Environment Configuration Issue

Connecting the new API key surfaced another instance of the configuration drift issue encountered in previous weeks.

### Root Cause

The backend's settings class was defined to reject any environment variable it did not explicitly expect. Adding the new API key to the environment file caused the entire application to fail on 
startup, since the settings class had no knowledge of it.

### Resolution

The settings class was updated to ignore unrecognized environment variables rather than rejecting them outright. Separately, it was discovered that the AI service itself was not loading the 
environment file directly, so even after the settings fix, the key was not visible to the code that needed it. Explicit environment loading was added to the service module to resolve this.

---

## Connecting the Live Provider

With the configuration issue resolved, the Gemini integration was implemented as the first fully functional provider in the rotation, converting the conversation history into a prompt format the 
provider expects and returning its response through the same response structure already used by mock mode.

---

## Scope Restriction

Once the assistant was live, a decision was made to keep it strictly focused on CNC and manufacturing topics rather than allowing it to function as a general-purpose chatbot.

### Implementation

The assistant's system prompt was updated to explicitly define its scope, covering CNC machining, G-Code, tools, materials, machine setup, and the platform itself, and to instruct it to politely 
decline and redirect any question outside that scope, even if a user rephrases or insists.

### Verification

This was tested with two contrasting prompts: a detailed, technical machining question and an unrelated general knowledge question. The technical question received a thorough, accurate response 
covering tool selection, roughing versus finishing passes, and calculated spindle speed and feed rate values. The unrelated question was correctly declined with a redirect back to CNC topics, 
confirming the scope restriction works as intended.

---

## Frontend Chat Interface

A dedicated assistant page was built to give users a proper conversational interface, rather than exposing the feature only through the API.

### Design

The interface follows the same dark color scheme and layout conventions already established in the dashboard, so it feels like a natural part of the platform rather than a bolted-on feature. 
Messages are displayed in a scrolling conversation view, with user and assistant messages visually distinguished, and a loading indicator while a response is pending.

### Integration

The page was added to the application's routing alongside the existing protected pages, and an entry point was added to the dashboard so users can reach the assistant directly from their project 
view.

---

## API Documentation Styling

The interactive API documentation page was restyled to match the platform's dark visual identity instead of using its bright default appearance.

### Implementation

A custom version of the documentation page was served with an injected stylesheet targeting the documentation library's components directly, covering backgrounds, borders, buttons, and text 
colors, including the request/response schema section, which required additional targeting after an initial pass left some elements unstyled.

---

## Challenges Encountered

### Configuration Class Rejecting New Variables

As with schema drift encountered in earlier weeks, a settings class that was too strict about its expected inputs caused the backend to fail outright the moment a new, valid environment variable 
was introduced. This was resolved by allowing unrecognized variables to be ignored rather than treated as errors.

### Environment Variables Not Reaching the Service Layer

Even after the settings class was corrected, the AI service itself was not loading the environment file independently, since it did not rely on the settings class for its own configuration. This 
required explicitly loading the environment file within the service module itself.

### Styling a Third-Party Documentation Library

The interactive documentation page is generated by a third-party library with deeply nested default styling. Achieving a fully consistent dark theme required more than one pass, as some 
sections, particularly the schema reference area, retained their original appearance until targeted directly.

---

## Lessons Learned

* Configuration classes that reject unexpected input are safer in principle but need to be paired with a clear process for adding new variables, since they will fail the entire application 
otherwise.
* Not every module that needs environment configuration necessarily shares the same loading mechanism, so new modules should have their environment access verified independently rather than 
assumed.
* Building a feature in a clearly labeled mock mode before connecting any external, cost-incurring service is an effective way to validate architecture and catch integration issues early, 
without financial risk.
* Restricting an AI assistant's scope through its system prompt is straightforward to implement but should be explicitly tested with both in-scope and out-of-scope prompts to confirm it behaves 
as intended.

---

## Impact on Project

Week 9 gave MachineAI its most user-facing feature yet: a working conversational assistant that provides genuinely useful, detailed machining guidance while staying within the platform's 
intended scope. The provider rotation architecture means the platform is not locked into a single AI vendor, and the free-tier-first approach allowed the entire feature to be built and validated 
without any spending. Combined with the improved documentation styling, the platform is noticeably more polished and closer to something ready to be shared with and used by others.

---

## Goals for Week 10

* Add material and tool selection to the AI Assistant so its recommendations can be grounded in a user's actual project context
* Implement the remaining fallback providers in the rotation
* Conduct a full pass of UI polish across the dashboard, project view, and assistant page
* Prepare the project for final deployment

---

## Project Status

**Current Status:** AI CNC Assistant Operational on Free-Tier Provider

**Next Milestone:** UI Polish and Deployment Preparation

**Estimated Project Stage:** 78% Complete

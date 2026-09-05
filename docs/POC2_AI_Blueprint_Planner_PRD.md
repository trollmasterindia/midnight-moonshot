# POC 2: AI Blueprint Planner & Historical Dashboard PRD

## 1. Executive Summary
This document outlines the Product Requirements for "POC 2" of the PhysioSync tele-rehab application. POC 2 expands the platform from a real-time intervention tool into a comprehensive, long-term training and rehabilitation planner. It introduces historical session tracking, an AI-powered blueprint planner for constructing structured workouts, and a live session execution interface that utilizes these blueprints.

## 2. Core Features

### 2.1. Historical Calendar View
**Problem:** PTs need context on what the client has done over the past month to track progress and prevent overtraining.
**Solution:**
- **UI Component:** A calendar or historical timeline view integrated into the PT's Client Profile / Room view.
- **Functionality:** 
  - Displays all completed sessions and workouts for the past month.
  - Clicking on a past date reveals the specific exercises performed, sets, reps, and the PT’s clinician notes for that day.
- **Technical Implication:** Requires expanding the SpaceTimeDB schema. Instead of just tracking `last_session_notes` on the `room` table, we will need a dedicated `session_log` or `workout_history` table to store multiple past events per client.

### 2.2. AI Blueprint Planner (Prototype)
**Problem:** Manually programming long-term exercise routines that balance muscle groups, rehabilitation needs, and performance goals is time-consuming.
**Solution:**
- **UI Component:** A prototype chat interface available in the PT dashboard allowing the PT to draft future sessions ("Blueprints").
- **Functionality:**
  - The PT converses with an AI chatbot (representing the WikiGem Engine / Gemini).
  - The PT provides the client's goal (e.g., "Hypertrophy focus on quads, rehab for right meniscus, basketball performance").
  - The AI suggests a structured workout session, ensuring adequate muscle coverage throughout the week and blending different training modalities.
  - The AI's output is structured data (a "Blueprint") that can be saved to the database.
- **Constraints:** For this POC, the chat interface can be a prototype (simulated or a basic Gemini integration) that outputs a structured JSON blueprint.

### 2.3. Blueprint Structure & Live Session Execution
**Problem:** During a live session, the PT needs a structured plan to follow that includes warmups, variable sets, and specific exercise types.
**Solution:**
- **Data Structure (The Blueprint):**
  - **Core Exercise Name**
  - **Warmup/Activation:** Specific preparatory exercises directly linked to a core exercise (e.g., "Glute Activation Bridges" before "Squats").
  - **Sets & Reps:** Detailed configuration for each set.
  - **Variations:** Support for varying weights across sets, or setting specific sets as "Static Holds" (e.g., Set 1: 10 reps @ 50lbs, Set 2: 30-second static hold).
- **Live Session UI:**
  - When starting a new session with a client, the PT is prompted to select an existing "Blueprint" for the day, or use the AI planner to generate one on the fly.
  - Once selected, the Live Session dashboard loads the Blueprint, allowing the PT to check off exercises, record actual performance, and push specific active exercises to the client's screen.

## 3. Technical Requirements & Next Steps

1. **SpaceTimeDB Schema Updates:**
   - Create `session_history` table to support the Calendar View.
   - Create `blueprint` and `blueprint_exercise` tables to store the planned sessions.
2. **Frontend UI:**
   - Add a "History" tab or Calendar widget in `PTRoomView`.
   - Create an "AI Planner" modal/page with a chat UI.
   - Update the Live Session start flow to include Blueprint selection.
3. **AI Integration:**
   - Integrate with an LLM (e.g. Gemini via Firebase AI Logic) to process the chat and return structured JSON matching the Blueprint schema.

## 4. Success Criteria for POC 2
- [ ] PT can view a calendar of past sessions for a client.
- [ ] PT can open the AI chat, prompt a goal, and receive a structured Blueprint.
- [ ] PT can start a live session using a saved Blueprint, and the UI displays the structured warmups, core exercises, and variable sets correctly.

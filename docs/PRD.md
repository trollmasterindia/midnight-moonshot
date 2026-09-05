# Product Requirement Document (PRD): PhysioSync

**Project:** PhysioSync – Real-Time AI Tele-Rehab Room  
**Hackathon:** Midnight Moonshot  
**Target Platform:** SpaceTimeDB + WikiGem Engine  
**Primary Focus:** Squat Biomechanics & Diagnostic Interventions  

---

## 1. Executive Summary & Vision

**PhysioSync** is a real-time collaborative tele-rehab add-on designed for Physical Therapists (PTs) conducting online video consultations.

Instead of verbally explaining form tweaks over video calls, the PT shares a private room link. Inside the live room (powered by **SpaceTimeDB**), the PT assigns exercises, triggers 3D anatomical target overlays, receives real-time feedback on muscle recruitment/pain, and uses **WikiGem's Diagnostic Engine** to prescribe immediate corrective interventions.

---

## 2. Core Target Persona & Value Proposition

### Physical Therapist (PT / Supervisor)
- **Pain Point:** Hard to communicate spatial anatomical adjustments over a 2D webcam video stream.
- **Value:** Real-time visual overlay controls, automated diagnostic suggestions from WikiGem, and multi-client dashboard tracking.

### Patient / Client
- **Pain Point:** Unsure if performing movements correctly; struggle to describe pain or muscle engagement verbally.
- **Value:** Zero friction join (no registration), interactive visual body map, instant visual corrective cards sent by PT.

---

## 3. Key Feature Specifications

### Feature 0: Pre-Loaded Patient Clinical History & PT Session Start
- **PT Dashboard:** PT selects a client record (e.g., *"Alex"*).
- **Clinical Sidebar (PT View):** Loads pre-existing history directly inside the room UI:
  - Past Injury Record (e.g., *"L4-L5 Lumbar Herniation, Right Ankle Sprain"*).
  - Clinical Notes & Reminders (e.g., *"Glute activation latency; responds best to banded primers"*).
  - Baseline Mobility Measurements (e.g., *"Ankle dorsiflexion restricted to 35°"*).
  - Last Session Summary & Prescriptions.
- **Session Initiation:** PT starts room `physiosync.app/room/squat-diag-101` linked to Alex's profile.

### Feature 1: Personalized Link & PT Waiting Room Authorization
- **Personalized Room Link:** PT generates a client-specific secret link (e.g. `physiosync.app/room/alex-squat-8f92a`).
- **Client Entry Request:** Client opens their secret link, inputs their name (*"Alex"*), and submits.
- **Waiting Room State:** Client enters a real-time waiting screen (*"Waiting for PT to approve entry..."*).
- **PT Authorization Modal:** On the PT Supervisor View, a notification pops up showing the client's submitted name and token match.
- **1-Click PT Approval:** PT clicks **"Approve Entry"**, triggering SpaceTimeDB to transition the client's state to `"CONNECTED"` and load the live room interface.

### Feature 2: Exercise Assignment & Video Demo
- **Exercise Library:** 5 core movements (Squat, Deadlift, Lunge, Glute Bridge, Wall Sit).
- **Demo Default:** PT selects **Squat**.
- **Client UI:** Instantly updates to display:
  - Exercise Name & Target Objectives.
  - Embedded looping exercise demo (GIF / YouTube Short).

### Feature 3: PT-Triggered 3D Anatomical Map Overlay
- PT clicks **"Show Target Muscles"**.
- Client UI animates an interactive 3D Body Representation (or 2D SVG canvas fallback):
  - **Prime Movers highlighted:** Quadriceps, Gluteus Maximus.
  - **Stabilizers highlighted:** Core / Transverse Abdominis, Erector Spinae.

### Feature 4: Interactive Muscle & Pain Logging
Either the **Client** or **PT** can log execution feelings during/after a set:
1. **Engaged Muscles Checkbox:** Select which muscles were actually felt (e.g., *"Felt Quads, Did NOT feel Glutes"*).
2. **Pain / Discomfort Pointing:** Click directly on the 3D Body Representation to drop a marker on the pain location.
3. **Pain Type & Context:** Dropdown selecting pain type (*Sharp, Dull Ache, Tightness, Pinching*) + text notes.

### Feature 5: WikiGem Diagnostic & Recommendation Push
- Movement log triggers **WikiGem Rule Engine**.
- System computes root causes & corrective interventions.
- PT reviews suggestion on Supervisor View and clicks **"Approve & Push"**.
- Client UI displays visual fix card immediately.

---

## 4. Performance & Reliability Requirements

- **Latency:** State updates synced via SpaceTimeDB WebSockets in under 100ms.
- **Client Onboarding:** < 5 seconds from link click to active room state.
- **Browser Compatibility:** Works across modern desktop and mobile browsers (Chrome, Safari, Firefox).

# PhysioSync – Real-Time AI Tele-Rehab Room

> **Target Platform:** SpaceTimeDB + WikiGem Diagnostic Engine  
> **Demo Focus:** Squat Biomechanics & Diagnostic Interventions  
> **Hackathon:** Midnight Moonshot  

---

## 💡 Executive Summary & Vision

**PhysioSync** is a real-time collaborative tele-rehab platform built for Physical Therapists (PTs) conducting online video consultations.

Instead of relying on passive verbal feedback over standard video calls, the PT shares a private room link with the patient. Inside the live room (powered by **SpaceTimeDB**):
- PTs assign exercises with rich visual demos.
- PTs trigger **3D anatomical target overlays** directly on the client's screen.
- Clients provide **real-time feedback** on muscle recruitment and pain locations.
- **WikiGem's Diagnostic Engine** computes immediate, targeted corrective interventions for the PT to review, approve, and push to the client.

---

## 🎯 Problem Statement & Solution

### The Problem
Traditional tele-rehab consultations suffer from:
1. **Verbal Confusion:** PTs struggle to explain form adjustments remotely without spatial visual cues.
2. **Passive Client Experience:** Clients lack visual feedback on which muscles *should* be working vs. which *are* working.
3. **Delayed Diagnostic Response:** PTs must manually compute corrective drills on the fly while managing the session.
4. **Poor Scalability:** A PT can only monitor one client at a time without state synchronization tooling.

### The PhysioSync Solution
1. **Zero-Friction Access:** No app store installs, accounts, or passwords. Instant web links.
2. **Real-Time State Synchronization:** SpaceTimeDB handles sub-millisecond state sync between PT and client.
3. **Visual Interactive Body Canvas:** Highlighting target muscles, stabilizer muscles, and precision pain markers.
4. **WikiGem AI/Diagnostic Engine:** Automated decision tree detecting movement faults (e.g. dormant glutes, lower back pain, ankle tightness) and suggesting immediate fix protocols.
5. **Multi-Client PT Matrix:** Scalable subscription grid enabling 1 PT to monitor up to 10 clients with real-time red alert badges on movement faults.

---

## 🏗️ Dual-Phase Architecture Overview

```
                               ┌─────────────────────────┐
                               │  SpaceTimeDB Maincloud  │
                               │  (Multi-Room State)     │
                               └───────────┬─────────────┘
                                           │
          ┌────────────────────────────────┼────────────────────────────────┐
          ▼                                ▼                                ▼
┌──────────────────────┐        ┌──────────────────────┐        ┌──────────────────────┐
│   Client 1 Room      │        │   Client 2 Room      │        │   Client 10 Room     │
│ (Alex - Squatting)   │        │ (Sarah - Lunge)      │        │ (Chris - Deadlift)   │
└──────────┬───────────┘        └──────────┬───────────┘        └──────────┬───────────┘
           │                               │                               │
           └───────────────────────────────┼───────────────────────────────┘
                                           ▼
                       ┌───────────────────────────────────────┐
                       │     PT Multi-Client Dashboard         │
                       │ - 2x5 Grid of 10 Active Clients       │
                       │ - Real-time Red Alert Badges on Fault │
                       │ - 1-Click Expand to Focus & Prescribe │
                       └───────────────────────────────────────┘
```

- **Phase 1 (MVP - 1-on-1 Focus):** Powered by **SpaceTimeDB** real-time WebSockets for sub-millisecond state coordination between 1 PT and 1 Client (exercise selection, 3D anatomical overlays, muscle/pain feedback, and WikiGem prescription push).
- **Phase 2 (PT Dashboard Matrix - 1 PT ↔ 10 Clients):** Leverages SpaceTimeDB WebSocket query subscriptions (`SELECT * FROM Room WHERE pt_name = ...`) streaming real-time alerts across up to 10 simultaneous patient rooms into a 2x5 PT matrix grid.

---

## ⚡ Tech Stack

- **State Database & Real-Time Sync:** [SpaceTimeDB](https://spacetimedb.com/) (Rust Module, Maincloud Deployed)
- **Diagnostic Engine:** WikiGem Decision Tree (Rules Engine for Movement Biomechanics)
- **Frontend Framework:** React / Vite / JavaScript + Tailwind CSS
- **Interactive Visuals:** 3D / SVG Interactive Body Map (Target Muscle & Pain Location Overlay)

---

## 📂 Project Documentation Directory

Detailed specifications and architectural guides are stored in the `/docs` folder:

- 📄 [PRD Specifications](file:///Users/nipunmehra/Midnight%20Moonshot/docs/PRD.md)
- 📐 [System Architecture & Multi-Client Grid](file:///Users/nipunmehra/Midnight%20Moonshot/docs/ARCHITECTURE.md)
- 🧠 [WikiGem Diagnostic Engine & Decision Trees](file:///Users/nipunmehra/Midnight%20Moonshot/docs/WIKIGEM_DIAGNOSTICS.md)
- 🗄️ [SpaceTimeDB Rust/C# Database Schema & Reducers](file:///Users/nipunmehra/Midnight%20Moonshot/docs/DATABASE_SCHEMA.md)
- ⏱️ [Hackathon Development & Demo Roadmap](file:///Users/nipunmehra/Midnight%20Moonshot/docs/HACKATHON_PLAN.md)

---

## 🚀 Quick Start & Demo Flow

```bash
# Clone the repository
git clone https://github.com/trollmaster699/midnight-moonshot.git
cd midnight-moonshot

# (Development instructions will be added as frontend/backend components are built)
```

### Demo Script (Hackathon Demo Checklist)
1. **PT Room Creation:** PT opens app -> Clicks "Create Private Room".
2. **Zero-Friction Client Join:** Client opens link on phone/laptop -> Enters name *"Alex"*.
3. **Exercise Assignment:** PT selects **Squat** -> Client screen shows live Squat Demo GIF.
4. **Anatomical Overlay:** PT clicks **"Highlight Muscles"** -> Client body map animates Quads & Glutes.
5. **Pain & Fault Logging:** Client logs *"Lower Back Pain"* + *"Glutes Not Felt"*.
6. **WikiGem Prescription:** PT dashboard gets alert + WikiGem suggestions (*3-Point Foot Contact Cue*, *Glute Bridge Primer*).
7. **Approve & Push:** PT clicks **"Approve & Push"** -> Client screen immediately updates with visual fix card!

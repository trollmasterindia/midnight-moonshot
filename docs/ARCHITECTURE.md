# System Architecture & Multi-Client Matrix

**Platform:** SpaceTimeDB + WebSockets  
**Project:** PhysioSync  

---

## 1. Dual-Phase Multi-Client Architecture

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

---

## 2. Phase Details

### Phase 1: MVP Core (1-on-1 Focus)
- Built for the initial Mentors Checkpoint (17:00 deadline).
- 1 PT ↔ 1 Client private room.
- Fully powered by **SpaceTimeDB WebSockets** for real-time bi-directional synchronization (PT assigns exercises/3D overlays, Client logs pain/engagement, SpaceTimeDB runs WikiGem logic, PT pushes prescriptions).

### Phase 2: Multi-Client Dashboard Expansion (1 PT ↔ 10 Clients)
- **Scalable Subscription:** SpaceTimeDB allows the PT client to subscribe to `SELECT * FROM Room WHERE pt_name = 'Dr_Smith'`, streaming updates for up to 10 rooms simultaneously without performance degradation.
- **UI Grid Layout:** The PT view transitions from single-room focus to a **2x5 Grid Matrix** showing all 10 clients' live status.
- **Real-time Alert Badges:** When Client #4 logs *"Lower Back Pain"* or *"Glutes Not Felt"*, Card #4 on the PT dashboard flashes **Red** with an alert icon and the pre-computed WikiGem suggestion.
- **1-Click Deep Dive:** The PT clicks Card #4 to expand it into full-screen focus mode, approves/edits the WikiGem prescription, and pushes it instantly to Client #4.

---

## 3. Real-Time Data Flow (SpaceTimeDB Subscription Model)

```
[ Client / PT Action ]
        │
        ▼
[ Call SpaceTimeDB Reducer ]
        │ (e.g. submit_movement_log)
        ▼
[ Reducer executes state update on Server ]
        │
        ▼
[ SpaceTimeDB auto-evaluates WikiGem rule engine & inserts Prescription ]
        │
        ▼
[ WebSocket Broadcast to Subscribed Clients ]
        ├──> PT View: Flashes Red Alert Badge + Suggestion
        └──> Client View: Updates interactive anatomical map / prescription card
```

# Product Requirement Document (PRD): SpaceTimeDB Setup & POC

**Project:** PhysioSync – SpaceTimeDB Setup and POC  
**Target:** Real-Time Room Entry & PT Approval Flow  

---

## 1. Objective

Build a working Proof of Concept (POC) demonstrating real-time bi-directional state synchronization between a Physical Therapist (PT) on Laptop and a Client on Mobile using **SpaceTimeDB**.

---

## 2. POC Scope & Verification Workflow

### Step 1: PT Session Launch (Laptop)
- PT opens `http://<laptop-ip>:5173/pt` on laptop.
- Room is initialized with `expected_client_name: "Nipun"`.
- PT enters waiting room monitoring mode.

### Step 2: Client Entry Request (Mobile)
- Client opens personalized link `http://<laptop-ip>:5173/room/nipun-squat` on mobile phone over local Wi-Fi.
- Client inputs name `"Nipun"` and taps **"Join Room"**.
- SpaceTimeDB verifies `submitted_client_name == "Nipun"`.
- Sets state to `client_status: "WAITING_APPROVAL"`.
- Client screen displays: *"Waiting for Physio to approve entry..."*.

### Step 3: PT Approval & State Sync (Laptop ↔ Mobile)
- PT laptop screen receives real-time WebSocket update: **"Nipun is requesting entry to the room"**.
- PT taps **"Approve Entry"**.
- SpaceTimeDB executes `approve_client_entry` reducer -> sets `client_status: "CONNECTED"`.
- Mobile client screen automatically unlocks to: **"Session Active: Connected with Physical Therapist"**.

---

## 3. Architecture & Data Model

```
[ Client Mobile Browser ]
       │ (1. Enters "Nipun")
       ▼
[ SpaceTimeDB Reducer: request_room_entry ]
       │
       ├──> Validates name "Nipun" == expected_client_name
       └──> Updates Room Table: client_status = "WAITING_APPROVAL"
       │
       ▼
[ WebSocket Broadcast to PT Laptop ]
       │
       ▼
[ PT Laptop UI: Shows "Nipun requesting entry" Banner ]
       │ (2. Clicks "Approve Entry")
       ▼
[ SpaceTimeDB Reducer: approve_client_entry ]
       │
       └──> Updates Room Table: client_status = "CONNECTED"
       │
       ▼
[ WebSocket Broadcast to Client Mobile ]
       │
       ▼
[ Mobile Client UI: Unlocks Live Room ]
```

---

## 4. Setup Plan

1. **Install SpaceTimeDB CLI:** `curl -sSf https://install.spacetimedb.com | sh`
2. **Initialize Database Module:** Create local Rust/TS SpaceTimeDB tables & reducers.
3. **Frontend Application:** Vite + React + Tailwind + `spacetimedb` SDK.
4. **Local Network Binding:** Serve Vite on `0.0.0.0:5173` for mobile Wi-Fi connectivity.

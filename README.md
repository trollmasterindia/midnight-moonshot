# PhysioSync – Real-Time AI Tele-Rehab Room & Multi-Client Matrix

> **Target Platform:** SpaceTimeDB + WikiGem Diagnostic Engine  
> **Demo Focus:** Squat Biomechanics & Diagnostic Interventions  
> **Hackathon:** Midnight Moonshot  
> **Live Deployment:** [https://physiosync-squat-poc.web.app/pt](https://physiosync-squat-poc.web.app/pt)  
> **SpaceTimeDB Maincloud DB:** `thug-submission` (`wss://maincloud.spacetimedb.com`)

---

## ⚡ Current Status: POC 1 is 100% COMPLETE ✅

All Phase 1 & POC 1 core requirements have been successfully built, deployed, and verified live on **SpaceTimeDB Maincloud** and **Firebase Hosting**.

---

## 💡 Architecture & Setup Knowledge Base

*(Keep this section updated so anyone pulling this repo on a new laptop has full deployment and account context).*

### ☁️ Live Cloud Environment & Deployment Details

- **Frontend Hosting:** Firebase Hosting ([Project Console](https://console.firebase.google.com/project/physiosync-squat-poc/overview))
  - **Live URL:** [https://physiosync-squat-poc.web.app](https://physiosync-squat-poc.web.app)
  - **Hosting Config:** `firebase.json` & `.firebaserc` in repository root.
- **Backend Database:** SpaceTimeDB Maincloud
  - **Server URI:** `wss://maincloud.spacetimedb.com`
  - **Database Identity Name:** `thug-submission`
  - **CLI binary path:** `~/.local/bin/spacetime`

---

## 🏗️ Core System Structure

```
.
├── client/                     # Vite + React + TypeScript + React Router DOM
│   ├── src/
│   │   ├── App.tsx             # Main Router (/pt, /pt/room/:roomId, /client/:roomToken)
│   │   ├── module_bindings/    # Generated SpaceTimeDB client bindings
│   │   └── main.tsx
│   └── package.json
│
├── server/
│   └── spacetimedb/            # SpaceTimeDB Rust module
│       └── src/
│           └── index.ts        # Room table definitions, init seeder, and reducers
│
├── firebase.json               # Firebase Hosting configuration (rewrites for SPA)
└── .firebaserc                 # Project mapping (`physiosync-squat-poc`)
```

---

## 🗄️ SpaceTimeDB Backend Architecture (`server/spacetimedb`)

### Data Model (`Room` Table)
| Field | Type | Description |
| :--- | :--- | :--- |
| `roomId` | Primary Key (String) | Unique room ID (e.g. `squat-diag-101`) |
| `roomToken` | Unique String | Secret client token URL identifier (e.g. `client-token-1`) |
| `ptName` | String | Assigned Physio name |
| `expectedClientName` | String | Patient name expected by PT (e.g. `Nipun`) |
| `submittedClientName` | String | Name entered by client in mobile entry form |
| `clientStatus` | String | Status: `"NONE"`, `"WAITING_APPROVAL"`, `"CONNECTED"` |

### Reducers
1. `requestRoomEntry({ roomToken, submittedName })`: Triggered by client mobile view. Validates room token and updates `clientStatus` to `"WAITING_APPROVAL"`.
2. `approveClientEntry({ roomId, approve })`: Triggered by PT Supervisor. If `approve: true`, sets status to `"CONNECTED"`; if `false`, resets to `"NONE"`.
3. `resetRoom({ roomId })`: Resets room back to initial state for testing.

### Auto-Seeded Rooms (5 Concurrent Client Support)
On startup, the server automatically seeds 5 distinct client rooms:
1. `squat-diag-101` (Token: `client-token-1`, Expected Client: **Nipun**)
2. `squat-diag-102` (Token: `client-token-2`, Expected Client: **Alex**)
3. `squat-diag-103` (Token: `client-token-3`, Expected Client: **Sarah**)
4. `squat-diag-104` (Token: `client-token-4`, Expected Client: **Mike**)
5. `squat-diag-105` (Token: `client-token-5`, Expected Client: **Emma**)

---

## 🎨 Frontend Application (`client`)

### Routing Structure
- `/pt`: **PT Dashboard Matrix** — Real-time monitoring grid displaying all 5 client rooms, statuses (`NONE`, `WAITING_APPROVAL`, `CONNECTED`), and client names synced over SpaceTimeDB WebSockets.
- `/pt/room/:roomId`: **PT Live Supervisor Console** — Isolated room view with patient clinical history sidebar, dynamic client invitation link generator, and 1-click Approve / Deny entry buttons.
- `/client/:roomToken`: **Client Mobile UI** — Dedicated client interface accessible strictly via secret token URL. Contains name verification, entry waiting screen, and muscle engagement interactive view.

---

## 💻 New Laptop Setup & Deployment Guide

### 1. Prerequisites
- **Node.js**: v20+ and `npm`
- **SpaceTimeDB CLI**: Installed at `~/.local/bin/spacetime`

### 2. Running Locally
```bash
# Clone the repository
git clone https://github.com/trollmaster699/midnight-moonshot.git
cd midnight-moonshot

# Install frontend dependencies
cd client
npm install
npm run dev
# App will run at http://localhost:5173/pt
```

### 3. Re-Publishing SpaceTimeDB to Maincloud
```bash
cd server/spacetimedb
~/.local/bin/spacetime login
~/.local/bin/spacetime publish --server maincloud -c thug-submission
```

### 4. Deploying Frontend Updates to Firebase
```bash
# From repository root
cd client && npm run build && cd ..
npx -y firebase-tools@latest deploy --only hosting --project physiosync-squat-poc
```

---

## ✅ POC 1 Checklist & Verification Summary

| Feature Requirement | Status | Implementation Details |
| :--- | :---: | :--- |
| **SpaceTimeDB Integration** | ✅ Complete | Live WebSocket state synchronization over `wss://maincloud.spacetimedb.com`. |
| **Isolated PT Dashboard** | ✅ Complete | Separate `/pt` dashboard grid showing all 5 active client rooms. No mode-toggle switches. |
| **Multi-Client Support** | ✅ Complete | 5 pre-configured rooms with unique access tokens (`client-token-1` to `5`). |
| **Token-Based Client Access** | ✅ Complete | Client view restricted strictly to `/client/:roomToken`. |
| **Name Validation & Approval** | ✅ Complete | Client inputs name "Nipun"; PT gets real-time entry notification and approves entry. |
| **Public Internet Access** | ✅ Complete | Deployed on Firebase Hosting + SpaceTimeDB Maincloud (accessible on cellular/5G). |

---

## 🚀 Proposal for POC 2 (Phase 2 Scope)

Now that POC 1 is complete, we propose initiating **POC 2**:

### 🎯 Key Goals for POC 2:
1. **Multimodal AI Vision Stream (Gemini 2.0 Flash Vision)**:
   - Sample client webcam frames (1 FPS) during squat execution.
   - Stream frames to Gemini Vision API to detect movement faults in real-time (e.g. knee valgus collapse, shallow depth, excessive forward lean).
2. **Proactive Issue Surfacing & Educational Cue Cards**:
   - Surface top posture issues automatically to both PT dashboard and client screen without overwhelming the user.
   - Interactive 3D / SVG Muscle Engagement Canvas allowing both PT and Client to trigger muscle focus maps.
3. **WikiGem Prescription Engine Integration**:
   - PT receives automated corrective drill recommendations based on AI-detected biomechanical issues and approves fixes to client in 1 click.

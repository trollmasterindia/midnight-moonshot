# Hackathon Execution Strategy & Demo Roadmap

**Hackathon:** Midnight Moonshot  
**Project:** PhysioSync – Real-Time AI Tele-Rehab Room  

---

## 🕒 Hackathon Timeline & Milestones

| Milestone | Target Time | Key Deliverables & PRD Alignment | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **14:00 - 15:00** | **Setup & Skeleton:** Deploy SpaceTimeDB module with `Room`, `MovementLog`, `Prescription` tables. | 🔄 Pending |
| **Phase 2** | **15:00 - 17:00** | **Core Loop (Mentors Checkpoint):** PT selects Squat -> Client sees demo -> Client logs pain/fault -> PT sees WikiGem suggestion -> Syncs to Client. | 🔄 Pending |
| **Phase 3** | **19:00 - 21:30** | **Zero-Friction Join & UI Polish:** Client enters room via private URL + name. Polish 3D/SVG anatomical overlays & PT multi-client grid. | 🔄 Pending |
| **Phase 4** | **21:30** | **Public Launch:** Deploy live URL on Vercel/Netlify for 25 real users to test. | 🔄 Pending |

---

## 📋 Task Checklist

### Backend & SpaceTimeDB
- [ ] Initialize SpaceTimeDB module project (Rust/C#).
- [ ] Implement `Room`, `MovementLog`, `Prescription` tables.
- [ ] Write reducers: `join_room`, `select_exercise`, `toggle_muscle_overlay`, `submit_movement_log`, `approve_prescription`, `swap_exercise`.
- [ ] Deploy module to SpaceTimeDB Maincloud.

### WikiGem Diagnostic Engine
- [ ] Embed WikiGem decision rules for Cases A, B, C, D in JSON / Reducer logic.
- [ ] Connect issue category flags (`GLUTE_OFF`, `DEPTH_FAIL`, `BACK_PAIN`) to diagnostic prescription templates.

### Frontend Client & PT Views
- [ ] Setup Vite + React + Tailwind CSS project skeleton.
- [ ] Connect SpaceTimeDB WebSocket client SDK.
- [ ] Build Zero-Friction Room Router (`/room/:roomId`).
- [ ] Build Exercise View (Video Demo / GIF loop).
- [ ] Build Interactive SVG/3D Body Map canvas (Target Muscle Highlights & Pain Point Marker picker).
- [ ] Build PT Supervisor View (Single Room focus & 2x5 Multi-Client Matrix Grid).
- [ ] Build Red Alert Badge notifications on PT dashboard.
- [ ] Build Prescription Card Push modal.

---

## 🎬 Mentors & Final Demo Script

1. **PT Creates Room:** PT launches app and creates room `squat-diag-101`.
2. **Client Joins:** Client enters link on phone/laptop as "Alex" (no login).
3. **Exercise Selected:** PT sets exercise to **Squat**.
4. **Muscle Target Displayed:** PT toggles **Highlight Target Muscles** -> Client sees Quads & Glutes highlighted.
5. **Issue Logged:** Client taps Lumbar Spine (pain) and unchecks Glutes (inactivity).
6. **AI Suggestion:** PT dashboard flashes **RED** with WikiGem suggestions:
   - *3-Point Foot Contact Cue*
   - *Glute Bridge Activation Drills*
7. **Prescription Pushed:** PT clicks **Approve & Push** -> Client receives instant visual correction card!

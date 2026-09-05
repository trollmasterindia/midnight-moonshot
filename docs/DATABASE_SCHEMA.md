# SpaceTimeDB Database Schema & Reducers

**Module Language:** Rust (or C#)  
**Database System:** SpaceTimeDB  

---

## 1. SpaceTimeDB Tables

```rust
use spacetimedb::{spacetimedb, ReducerContext, Identity, Timestamp};

// 1. Live Session Room
#[spacetimedb(table)]
pub struct Room {
    #[primarykey]
    pub room_id: String,
    pub room_token: String,        // Unique personalized link token (e.g. "alex-squat-8f92a")
    pub pt_name: String,
    pub client_name: String,
    pub client_status: String,      // "WAITING_APPROVAL", "CONNECTED", "DENIED"
    pub active_exercise: String,
    pub show_muscle_overlay: bool,
}

// 2. Muscle Engagement & Pain Logs
#[spacetimedb(table)]
pub struct MovementLog {
    #[primarykey]
    pub log_id: u32,
    pub room_id: String,
    pub logged_by: String,     // "PT" or "Client"
    pub felt_glutes: bool,
    pub felt_quads: bool,
    pub pain_location_x: f32,  // Normalized 3D/2D coordinates (0.0 to 1.0)
    pub pain_location_y: f32,
    pub pain_type: String,     // "Sharp", "Dull", "Tightness", "Pinching"
    pub issue_category: String,// "GLUTE_OFF", "DEPTH_FAIL", "BACK_PAIN"
}

// 3. WikiGem Prescriptions & Interventions
#[spacetimedb(table)]
pub struct Prescription {
    #[primarykey]
    pub prescription_id: u32,
    pub room_id: String,
    pub title: String,
    pub description: String,
    pub media_url: String,
    pub status: String,        // "SUGGESTED", "APPROVED_BY_PT", "COMPLETED"
}

// 4. Pre-existing Patient History & Clinical Records
#[spacetimedb(table)]
pub struct ClientRecord {
    #[primarykey]
    pub client_name: String,   // e.g. "Alex"
    pub past_injuries: String, // e.g. "L4-L5 Lumbar Herniation, Right Ankle Sprain"
    pub clinical_notes: String,// e.g. "Glute activation latency; responds best to banded primers"
    pub baseline_mobility: String, // e.g. "Ankle dorsiflexion restricted (35 deg)"
    pub last_session_summary: String, // e.g. "Squat depth improved with heel wedge"
}
```

---

## 2. Reducer Function Signatures

1. `request_room_entry(ctx: ReducerContext, room_token: String, client_name: String)`
   - Validates personalized token and sets client state to `"WAITING_APPROVAL"`.

2. `approve_client_entry(ctx: ReducerContext, room_id: String, approve: bool)`
   - PT approves or denies client entry. Sets `client_status` to `"CONNECTED"` or `"DENIED"`.

3. `select_exercise(ctx: ReducerContext, room_id: String, exercise_name: String)`
   - Updates `active_exercise` for all room subscribers.

4. `toggle_muscle_overlay(ctx: ReducerContext, room_id: String, enabled: bool)`
   - Toggles 3D/SVG muscle highlighting overlay on client UI.

5. `submit_movement_log(ctx: ReducerContext, room_id: String, felt_glutes: bool, felt_quads: bool, pain_x: f32, pain_y: f32, pain_type: String, issue_category: String)`
   - Inserts movement log and automatically triggers WikiGem suggestion logic.

6. `approve_prescription(ctx: ReducerContext, prescription_id: u32)`
   - Updates status to `"APPROVED_BY_PT"`, pushing prescription visual card to Client.

7. `swap_exercise(ctx: ReducerContext, room_id: String, new_exercise_name: String)`
   - Swaps active exercise based on WikiGem alternative exercise recommendation.

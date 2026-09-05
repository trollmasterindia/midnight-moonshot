# WikiGem Diagnostic & Recommendation Engine

**Core Engine:** Hardcoded Decision Tree & Rule Engine for Movement Biomechanics  
**Focus:** Squat Biomechanics, Muscle Activation, and Corrective Protocols  

---

## 1. High-Level Decision Flow

```
                  ┌──────────────────────────────┐
                  │    User / PT Logs Issue      │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Case A: Glute   │     │ Case B: Unable  │     │ Case C: Lower   │
│ Not Engaged     │     │ to Reach Depth  │     │ Back Pain       │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ - Foot 3-Point  │     │ - Test 1: Heel  │     │ - Activation:   │
│   Contact Cue   │     │   Elevated      │     │   Glute/Core/   │
│ - Banded Squats │     │   Squat (Ankle) │     │   Hamstrings    │
│ - Glute Bridge  │     │ - Test 2: Thomas│     │ - Pelvic Tilt   │
│   Activation    │     │   Test (Hip)    │     │   Correction    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 2. Detailed Rules & Prescriptions

### Case A: Glute & Target Muscle Not Being Felt
- **Trigger:** Client reports `felt_glutes == false` while performing Squat.
- **Root Cause 1: Foot Weight Distribution**
  - *WikiGem Suggestion:* **Foot Position Correction**.
  - *Action Pushed to Client:* Visual card explaining 3-point foot contact (Big Toe, Pinky Toe, Heel).
- **Root Cause 2: Dormant Glute Recruitment**
  - *WikiGem Suggestion:* **Glute Activation Drills**.
  - *Action Options Pushed to Client:*
    - Option 1: Banded Squats (Resistance band above knees).
    - Option 2: Floor Glute Bridge (2 sets of 10 reps).

---

### Case B: Unable to Squat to Depth / Excessive Torso Flexion
- **Trigger:** Client logs depth limitation or PT flags torso collapse.
- **Diagnostic Test 1 (Ankle Mobility):**
  - *WikiGem Prescribes:* **Heel-Elevated Squat Test**.
  - *Instruction:* Place small plates/wedge under heels and re-test depth.
  - *Outcome:* If depth improves, trigger Ankle Mobility Stretch (Knee-to-Wall).
- **Diagnostic Test 2 (Hip Mobility):**
  - *WikiGem Prescribes:* **Thomas Test / Hip Flexor Screen**.
  - *Instruction:* Assess hip flexor tightness and prescribe Couch Stretch.

---

### Case C: Lower Back Pain / Discomfort
- **Trigger:** Pain marker placed on Lumbar Spine / Erector Spinae region.
- **Sub-Case 1: Muscle Activation Failure**
  - *WikiGem Prescribes:* **Primer Triad** (Glute Activation + Core Deadbugs + Hamstring Bridge).
- **Sub-Case 2: Pelvic Tilt Form Issue**
  - *WikiGem Prescribes:* **Pelvic Alignment Cue**.
  - *Action Pushed to Client:* Animation showing Neutral Spine vs. Anterior Pelvic Tilt ("Butt Wink").

---

### Case D: Exercise Swap Engine
- **Trigger:** PT clicks **"Swap Exercise"** due to acute pain or client limitation.
- **WikiGem Engine Action:** Filters alternative exercises matching the exact target muscle profile:
  - *Squat Alternatives:* Leg Press / Goblet Squat / Bulgarian Split Squat.
  - *Deadlift Alternatives:* Romanian Deadlift / Glute Bridge / Cable Pull-Through.

---

## 3. Client Proactive Diagnostic Cues & Multimodal AI Integration

### A. Proactive Post-Set Guided Cues (Active Surfacing)
Because patients often don't know what issues to look for, the UI surfaces 1-tap guided prompts post-set:
- **Cue 1 (Recruitment Check):** *"Did your glutes fire, or did your quads take over 100%?"* -> Tapping `[ Quads Only ]` triggers Case A (Glute Activation Drills).
- **Cue 2 (Form Check):** *"Did your heels lift or knees drift inward?"* -> Tapping `[ Knees Inward ]` triggers Case B (Ankle/Hip Screening).
- **Cue 3 (Discomfort Check):** *"Any lower back tightness?"* -> Tapping `[ Yes ]` triggers Case C (Primer Triad).

### B. Client Top Issues Digest (Educational & 1-Tap Trigger Cards)
For each active exercise, WikiGem provides a 3-item visual educational summary for the Client with 1-tap logging:
- **Squat Top Issues:**
  1. 🦵 **Knee Valgus:** Knees collapse inward on descent/ascent. (*1-Tap Flag to PT*).
  2. 🦶 **Heel Lifting:** Heels rise off floor due to tight ankles. (*1-Tap Flag to PT*).
  3. 🍑 **Butt Wink:** Tailbone tucks under at bottom. (*1-Tap Flag to PT*).

### C. Next-Gen Scope: Gemini Multimodal Vision AI Pipeline
- **Stream Ingestion:** HTML5 Canvas extracts 1 frame per second from client's webcam feed.
- **Biomechanical Vision Prompt:** Sends image frame to Gemini 2.0 Flash Vision API:
  - *"Analyze squat form. Detect if knees cave inward (knee valgus) or lower back rounds (butt wink)."*
- **Real-Time Alert Dispatch:**
  - If Gemini detects form fault -> dispatches `submit_movement_log(logged_by="GeminiVisionAI", issue_category="KNEE_VALGUS_DETECTED")`.
  - Instantly renders **"AI Detected Potential Issue"** badge on both PT and Client views!

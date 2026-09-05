import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { DbConnection } from './module_bindings';
import { 
  Activity, ShieldCheck, UserCheck, Smartphone, 
  AlertCircle, CheckCircle2, Clock, Sparkles, QrCode, Send, UserX, Check, Users,
  LogOut, FileText, Calendar, ClipboardList, CheckCircle, Copy, Search, Brain, ChevronRight,
  Dumbbell, Play, Video, PlayCircle, Eye, RefreshCw, X, Plus, Repeat
} from 'lucide-react';

// -------------------------------------------------------
// AI API Integration (Supports OpenAI gpt-4o & Gemini 1.5 Flash)
// -------------------------------------------------------
// -------------------------------------------------------
// AI API Integration (Supports OpenAI gpt-4o & Gemini 3.6 Flash)
// -------------------------------------------------------
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-3.6-flash';
const OPENAI_MODEL = 'gpt-5-nano';

export function detectIsStaticHold(exerciseName: string): boolean {
  const lower = (exerciseName || '').toLowerCase();
  return (
    lower.includes('plank') ||
    lower.includes('wall sit') ||
    lower.includes('hold') ||
    lower.includes('stretch') ||
    lower.includes('static') ||
    lower.includes('90/90') ||
    lower.includes('hang') ||
    lower.includes('iso')
  );
}

export interface CandidateVideo {
  id: string;
  title: string;
  creator: string;
  embedUrl: string;
  whyRecommended: string;
}

export interface DiagnosticOption {
  id: string;
  label: string;
  instruction: string;
  expectedOutcome: string;
  suggestedFixExercise?: string;
  candidateVideos: CandidateVideo[];
  approvedVideo?: CandidateVideo | null;
}

export const VERIFIED_CANDIDATE_VIDEOS: Record<string, CandidateVideo[]> = {
  ankle: [
    {
      id: 'v-ankle-1',
      title: 'Banded Ankle Mobilization Drill',
      creator: 'Squat University',
      embedUrl: 'https://www.youtube.com/embed/IikP_TEEAlk',
      whyRecommended: 'Uses band distraction to clear anterior talocrural impingement and maximize knee-past-toes angle.'
    },
    {
      id: 'v-ankle-2',
      title: 'Knee-to-Wall Ankle Mobility Test & Fix',
      creator: 'The Prehab Guys',
      embedUrl: 'https://www.youtube.com/embed/2v7WqT_V_oM',
      whyRecommended: 'Objective baseline test showing exact progress in centimeters from wall without lifting heel.'
    },
    {
      id: 'v-ankle-3',
      title: 'Deep Soleus & Achilles Eccentric Drop',
      creator: 'Athlean-X',
      embedUrl: 'https://www.youtube.com/embed/QPtS0hF9B8c',
      whyRecommended: 'Addresses soft-tissue stiffness in deep soleus muscle that limits bottom squat depth.'
    }
  ],
  heel_elevation: [
    {
      id: 'v-heel-1',
      title: 'Why Elevating Heels Immediately Fixes Squat Form',
      creator: 'Squat University',
      embedUrl: 'https://www.youtube.com/embed/jdc2m_Oqgq8',
      whyRecommended: 'Decreases dorsiflexion demand instantly, keeping trunk upright and protecting lumbar spine.'
    },
    {
      id: 'v-heel-2',
      title: 'Slant Board & Wedge Squat Biomechanics',
      creator: 'Renaissance Periodization',
      embedUrl: 'https://www.youtube.com/embed/1vR_s6-yG2A',
      whyRecommended: 'Shows optimal 15-20 degree incline to overload quads cleanly without spinal shear.'
    },
    {
      id: 'v-heel-3',
      title: 'Box Squat Technique for Depth & Balance',
      creator: 'Alan Thrall / Untamed Strength',
      embedUrl: 'https://www.youtube.com/embed/u_XgT7K_X5M',
      whyRecommended: 'Provides tactile target for depth and teaches client to sit back into hips safely.'
    }
  ],
  glute_hip: [
    {
      id: 'v-glute-1',
      title: 'The Perfect Banded Clamshell for Glute Medius',
      creator: 'Squat University',
      embedUrl: 'https://www.youtube.com/embed/q6U1j0jWwEE',
      whyRecommended: 'Isolates gluteus medius to stop knees collapsing inward (valgus collapse).'
    },
    {
      id: 'v-glute-2',
      title: 'Glute Bridge Activation (Stop Hamstring Cramps)',
      creator: 'Squat University',
      embedUrl: 'https://www.youtube.com/embed/wPM8icPu6H8',
      whyRecommended: 'Teaches posterior pelvic tilt to fire glute max without hyperextending lower back.'
    },
    {
      id: 'v-glute-3',
      title: 'Side-Lying Hip Abduction & Monster Walk',
      creator: 'Bob & Brad Physical Therapy',
      embedUrl: 'https://www.youtube.com/embed/XqE_c0V3eP4',
      whyRecommended: 'Dynamic lateral stability drill for single-leg knee tracking.'
    }
  ],
  core_spine: [
    {
      id: 'v-core-1',
      title: 'Dead Bug Progression (Keep Lower Back Glued)',
      creator: 'Squat University',
      embedUrl: 'https://www.youtube.com/embed/g_BYB0R-4Ws',
      whyRecommended: 'Gold-standard anti-extension drill preventing anterior pelvic tilt and rib flare.'
    },
    {
      id: 'v-core-2',
      title: 'The McGill Bird Dog for Spinal Stability',
      creator: 'Dr. Stuart McGill / BackFitPro',
      embedUrl: 'https://www.youtube.com/embed/wiFNA3sqjCA',
      whyRecommended: 'High back-extensor endurance with minimal compressive load on the lumbar discs.'
    },
    {
      id: 'v-core-3',
      title: 'Hollow Body Hold & Ribcage Down Cue',
      creator: 'Calisthenicmovement',
      embedUrl: 'https://www.youtube.com/embed/pSHjTRCQxIw',
      whyRecommended: 'Develops deep transverse abdominis tension required for bracing during heavy compound lifts.'
    }
  ],
  hinge_back: [
    {
      id: 'v-hinge-1',
      title: 'Master the Hip Hinge (Wall Tap Drill)',
      creator: 'Squat University',
      embedUrl: 'https://www.youtube.com/embed/NDfZi5fDaVM',
      whyRecommended: 'Instant tactile feedback using wall to ensure hips slide backward instead of knees bending.'
    },
    {
      id: 'v-hinge-2',
      title: 'Dowel Rod 3-Point Neutral Spine Drill',
      creator: 'Tony Gentilcore',
      embedUrl: 'https://www.youtube.com/embed/R9lZ2-Vd8U8',
      whyRecommended: 'Maintains contact at head, thoracic spine, and sacrum to prevent rounding.'
    },
    {
      id: 'v-hinge-3',
      title: 'How to Hinge with Lat Tension (No Back Pain)',
      creator: 'Renaissance Periodization',
      embedUrl: 'https://www.youtube.com/embed/L2tJ62d7c0E',
      whyRecommended: 'Locks bar to shins with lats, dramatically cutting lower back shear forces.'
    }
  ],
  push_shoulder: [
    {
      id: 'v-push-1',
      title: 'Scapular Push-Up for Serratus & Scapular Winging',
      creator: 'Athlean-X',
      embedUrl: 'https://www.youtube.com/embed/IODxDxX7oi4',
      whyRecommended: 'Builds serratus anterior strength to keep shoulder blade flush against ribcage.'
    },
    {
      id: 'v-push-2',
      title: 'Hands Elevated Incline Push-Up for Core Integrity',
      creator: 'Squat University',
      embedUrl: 'https://www.youtube.com/embed/bt5b9x9N0KU',
      whyRecommended: 'Enables full depth and rigid plank line without sagging hips.'
    },
    {
      id: 'v-push-3',
      title: 'Face Pull Form & External Rotator Prehab',
      creator: 'Jeff Nippard',
      embedUrl: 'https://www.youtube.com/embed/rep-qVOkqgk',
      whyRecommended: 'Balances internal rotation from pressing movements and restores shoulder posture.'
    }
  ]
};

export function enrichOptionVideos(rawOpt: any): DiagnosticOption {
  const text = `${rawOpt.label || ''} ${rawOpt.instruction || ''} ${rawOpt.suggestedFixExercise || ''} ${rawOpt.expectedOutcome || ''}`.toLowerCase();
  let defaultSet = VERIFIED_CANDIDATE_VIDEOS.heel_elevation;

  if (text.includes('ankle') || text.includes('dorsiflex') || text.includes('calf') || text.includes('knee-to-wall')) {
    defaultSet = VERIFIED_CANDIDATE_VIDEOS.ankle;
  } else if (text.includes('heel') || text.includes('slant') || text.includes('wedge') || text.includes('box squat') || text.includes('depth')) {
    defaultSet = VERIFIED_CANDIDATE_VIDEOS.heel_elevation;
  } else if (text.includes('glute') || text.includes('clamshell') || text.includes('valgus') || text.includes('knee cave') || text.includes('bridge') || text.includes('abduct')) {
    defaultSet = VERIFIED_CANDIDATE_VIDEOS.glute_hip;
  } else if (text.includes('dead bug') || text.includes('bird dog') || text.includes('core') || text.includes('spine') || text.includes('back straight') || text.includes('hollow') || text.includes('pelvic tilt')) {
    defaultSet = VERIFIED_CANDIDATE_VIDEOS.core_spine;
  } else if (text.includes('hinge') || text.includes('rdl') || text.includes('deadlift') || text.includes('hamstring') || text.includes('butt wink')) {
    defaultSet = VERIFIED_CANDIDATE_VIDEOS.hinge_back;
  } else if (text.includes('push') || text.includes('scapula') || text.includes('shoulder') || text.includes('press') || text.includes('elbow') || text.includes('serratus')) {
    defaultSet = VERIFIED_CANDIDATE_VIDEOS.push_shoulder;
  }

  // If rawOpt already came with valid candidate videos, merge or use them
  const rawVideos = Array.isArray(rawOpt.candidateVideos) && rawOpt.candidateVideos.length >= 2 
    ? rawOpt.candidateVideos 
    : defaultSet;

  return {
    id: rawOpt.id || `opt-${Date.now()}`,
    label: rawOpt.label || 'Diagnostic Test Screen',
    instruction: rawOpt.instruction || 'Perform test movement under PT observation.',
    expectedOutcome: rawOpt.expectedOutcome || 'Confirms or rules out suspected mechanical fault.',
    suggestedFixExercise: rawOpt.suggestedFixExercise || '',
    candidateVideos: rawVideos,
    approvedVideo: null
  };
}

async function callLLMDiagnostic(
  issueText: string,
  clientName: string,
  clientGoal: string,
  dbExercises?: ExerciseDictionaryData[]
): Promise<{
  potentialCause: string;
  confidence: string;
  dbExercisesReferenced?: string[];
  ptOptions: DiagnosticOption[];
  outOfScope?: string;
}> {
  // Format verified exercises from SpaceTimeDB to ground the AI in our DB
  const dbContext = (dbExercises && dbExercises.length > 0)
    ? dbExercises.slice(0, 15).map(e => {
        let faults = '';
        try {
          if (e.commonIssuesJson && e.commonIssuesJson !== '[]') {
            faults = ' | Common faults: ' + JSON.parse(e.commonIssuesJson).map((c: any) => c.title).join(', ');
          }
        } catch {}
        return `- ${e.name} (${e.category} / ${e.targetMuscle}): ${e.description}${faults}`;
      }).join('\n')
    : `- Bodyweight Squat (Rehab / Quads/Glutes): Basic functional movement | Common faults: Knees Collapsing Inward, Heels Lifting Off Floor, Lower Back Rounding\n- Ankle Dorsiflexion stretch (Mobility / Ankle): Improves squat depth and prevents excessive forward lean\n- Glute Bridge (Rehab / Glutes): Core and glute activation\n- Dead Bug (Core / Core): Anterior core control, prevents lumbar hyperextension\n- Bird Dog (Core / Core/Back): Spinal stability and back extensor endurance\n- 90/90 Hip Stretch (Mobility / Hips): Hip internal and external rotation`;

  const systemPrompt = `You are WikiGem, an expert clinical biomechanics AI assistant for physical therapists.
You diagnose movement faults and prescribe diagnostic screens and corrective exercises.

You MUST GROUND your diagnostic reasoning in our verified Biomechanics & Exercise Database:
${dbContext}

Decision Rules & Biomechanics Principles across major movements:
- Squat Case 1 (Unable to keep back straight / Forward Trunk Lean / Heels Lifting): Typically driven by Ankle Dorsiflexion restriction (forcing trunk forward to maintain center of gravity) OR fatigue/inhibition of Spinal Erectors / Anterior Core (Dead Bug, Bird Dog).
- Squat Case 2 (Knees Collapsing Inward / Knee Valgus): Weak gluteus medius/abductors (Clamshells, Glute Bridge) or foot pronation.
- Squat Case 3 (Lower Back Pain / Butt Wink): Lumbar rounding at depth due to tight hamstrings/adductors or pelvic tilt control.
- Hinge / RDL Case (Back rounding / bar drifting): Hamstring restriction or lat disengagement.
- Push-Up Case (Hips sagging / shoulder pinch): Anterior core weakness or elbow flaring > 75 degrees.
- Press Case (Excessive lumbar arching): Thoracic mobility or lat stiffness.

For each option in "ptOptions", propose a concrete test label, instructions, expected outcome, suggestedFixExercise, and 2-3 candidateVideos with YouTube embed URLs (from verified creators like Squat University, Renaissance Periodization, Athlean-X, The Prehab Guys).

Respond ONLY in this JSON format (no markdown):
{
  "potentialCause": "Detailed clinical analysis explaining the physiological mechanism and why this fault happens",
  "confidence": "High / Medium",
  "dbExercisesReferenced": ["Exact Name of relevant exercise 1 from DB", "Exact Name of relevant exercise 2 from DB"],
  "ptOptions": [
    {
      "id": "opt1",
      "label": "Name of diagnostic test (e.g. Heel-Elevated Squat Screen)",
      "instruction": "Concrete step-by-step cue for client",
      "expectedOutcome": "What result confirms or rules out this cause",
      "suggestedFixExercise": "Heel Elevated Squat",
      "candidateVideos": [
        {
          "id": "v1",
          "title": "Why Elevating Heels Immediately Fixes Squat Form",
          "creator": "Squat University",
          "embedUrl": "https://www.youtube.com/embed/jdc2m_Oqgq8",
          "whyRecommended": "Instant clinical screen for ankle dorsiflexion deficit"
        },
        {
          "id": "v2",
          "title": "Slant Board & Wedge Squat Biomechanics",
          "creator": "Renaissance Periodization",
          "embedUrl": "https://www.youtube.com/embed/1vR_s6-yG2A",
          "whyRecommended": "Shows optimal wedge mechanics to isolate quads safely"
        }
      ]
    }
  ],
  "outOfScope": "Leave empty if covered by database, or note any web-retrieved research"
}`;

  const userPrompt = `Client: ${clientName}
Client Goal: ${clientGoal}
Movement Fault / Complaint: "${issueText}"

Cross-reference our database, identify the biomechanical cause, and output the JSON diagnostic options with candidate tutorial videos.`;

  // 1. Try OpenAI if API Key present
  if (OPENAI_API_KEY) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3
        })
      });
      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.potentialCause && parsed.ptOptions && parsed.ptOptions.length > 0) {
          parsed.ptOptions = parsed.ptOptions.map(enrichOptionVideos);
          return parsed;
        }
      }
    } catch (e) {
      console.error('OpenAI API error:', e);
    }
  }

  // 2. Try Gemini if API Key present
  if (GEMINI_API_KEY) {
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
        })
      });
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.potentialCause && parsed.ptOptions && parsed.ptOptions.length > 0) {
          parsed.ptOptions = parsed.ptOptions.map(enrichOptionVideos);
          return parsed;
        }
      }
    } catch (e) {
      console.error('Gemini API error:', e);
    }
  }

  // 3. Fallback demo response grounded in DB
  const fallbackOptions = [
    {
      id: 'opt1',
      label: 'Heel-Elevated Squat Screen (Ankle vs Trunk)',
      instruction: 'Place small wedges or 2.5kg plates under both heels and re-test the squat. Keep chest proud.',
      expectedOutcome: 'If client can keep back straight with heels elevated, root cause is ankle dorsiflexion restriction.',
      suggestedFixExercise: 'Heel Elevated Squat',
      candidateVideos: VERIFIED_CANDIDATE_VIDEOS.heel_elevation
    },
    {
      id: 'opt2',
      label: 'Wall Facing Squat Screen (Thoracic & Core Control)',
      instruction: 'Stand 4 inches from a wall facing it with hands up. Perform a squat without hands or chest touching the wall.',
      expectedOutcome: 'If client cannot perform without touching wall, confirms thoracic extension / anterior core control deficit.',
      suggestedFixExercise: 'Dead Bug / Wall Squat',
      candidateVideos: VERIFIED_CANDIDATE_VIDEOS.core_spine
    }
  ];

  return {
    potentialCause: 'Unable to keep the back straight during a squat is most commonly caused by restricted ankle dorsiflexion mobility (forcing excessive forward trunk pitch to maintain the center of mass over midfoot) or weak spinal erectors / anterior core stability (failing to resist trunk flexion).',
    confidence: 'High',
    dbExercisesReferenced: ['Bodyweight Squat', 'Ankle Dorsiflexion stretch', 'Dead Bug', 'Bird Dog'],
    ptOptions: fallbackOptions.map(enrichOptionVideos)
  };
}

async function callLLMAutoLog(issue: string, approvedOption: string, clientResult: string, clientName: string): Promise<{ patientLogNote: string; suggestedExercise: string; suggestedExerciseSets: number; suggestedExerciseReps: number; conclusion: string }> {
  const systemPrompt = `You are WikiGem, a biomechanics AI. Generate a clinical patient log entry and exercise recommendation based on the diagnostic session outcome. Respond ONLY in valid JSON.`;
  const prompt = `Client: ${clientName}
Issue Logged: ${issue}
Diagnostic Test Approved by PT: ${approvedOption}
Client Result / Feedback: ${clientResult}

Respond ONLY in this JSON format (no markdown):
{
  "conclusion": "One sentence root cause conclusion (e.g. Ankle mobility restriction confirmed)",
  "patientLogNote": "Professional clinical note 2-3 sentences for patient record",
  "suggestedExercise": "Name of corrective exercise to add to blueprint",
  "suggestedExerciseSets": 3,
  "suggestedExerciseReps": 30
}`;

  if (OPENAI_API_KEY) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2
        })
      });
      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.conclusion && parsed.suggestedExercise) return parsed;
      }
    } catch (e) {
      console.error('OpenAI AutoLog error:', e);
    }
  }

  if (GEMINI_API_KEY) {
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
        })
      });
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.conclusion && parsed.suggestedExercise) return parsed;
      }
    } catch (e) {
      console.error('Gemini AutoLog error:', e);
    }
  }

  return {
    conclusion: 'Ankle mobility restriction confirmed as primary limiting factor.',
    patientLogNote: `${clientName} demonstrated significantly improved squat depth with heel elevation, confirming ankle dorsiflexion restriction. Hip flexor assessment ruled out as primary cause. Ankle mobility stretching protocol added to session blueprint.`,
    suggestedExercise: 'Ankle Dorsiflexion Stretch (Knee-to-Wall)',
    suggestedExerciseSets: 3,
    suggestedExerciseReps: 45
  };
}

async function callLLMBlueprintPlanner(promptText: string): Promise<{
  name: string;
  targetGoal: string;
  warning: string | null;
  exercises: { exerciseName: string; sets: number; reps: number | string; weight: string; isStaticHold: boolean }[];
}> {
  const systemPrompt = `You are WikiGem, an AI Blueprint Planner for Physiotherapists.
Your job is to generate a structured workout session blueprint based on the PT's prompt.
You must return the output in a strict JSON format.

If you detect the PT's prompt contradicts biomechanics goals, provide a warning. Specifically check for these two scenarios:
1. If the PT prompt mentions user goal is plyometrics or force generation BUT includes heavy lifting, add a warning: "Goal Alignment Reminder: User goal is plyometrics/force generation but prompt suggests heavy lifting. The plan has been adjusted to emphasize power." and adjust the exercises accordingly (e.g. bodyweight or light jumps).
2. If the prompt mentions a weak tendon or prior tendon issues, add a warning: "Client faced issues with this exercise earlier due to weak tendon. Added tendon strengthening isometric exercises this week." and include isometric holds in the exercises (set isStaticHold: true, and reps can be time like "45s").

Respond ONLY in this JSON format (no markdown):
{
  "name": "Name of the Session (e.g. Plyometric Power Phase)",
  "targetGoal": "The original goal stated",
  "warning": "Any warning string if applicable, otherwise null",
  "exercises": [
    {
      "exerciseName": "Name of exercise",
      "sets": 3,
      "reps": "10",
      "weight": "Bodyweight or % or Lbs",
      "isStaticHold": false
    }
  ]
}`;

  if (OPENAI_API_KEY) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: promptText }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3
        })
      });
      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.name && parsed.exercises && parsed.exercises.length > 0) return parsed;
      }
    } catch (e) {
      console.error('OpenAI Blueprint error:', e);
    }
  }

  if (GEMINI_API_KEY) {
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
        })
      });
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.name && parsed.exercises && parsed.exercises.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Gemini Blueprint error:', e);
    }
  }

  // Fallback demo response
  const lowerPrompt = promptText.toLowerCase();
  let fallback: any = {
    name: "AI Generated Session",
    targetGoal: promptText,
    warning: null,
    exercises: []
  };

  if (lowerPrompt.includes("plyometric") || lowerPrompt.includes("force")) {
    if (lowerPrompt.includes("heavy") || lowerPrompt.includes("lifting")) {
      fallback.warning = "Goal Alignment Reminder: User goal is plyometrics/force generation but prompt suggests heavy lifting. The plan has been adjusted to emphasize power over maximal strength.";
    }
    fallback.name = "Plyometric Power Phase";
    fallback.exercises = [
      { exerciseName: "Box Jump", sets: 4, reps: 5, weight: "Bodyweight", isStaticHold: false },
      { exerciseName: "Lateral Bound (Skater)", sets: 3, reps: 8, weight: "Bodyweight", isStaticHold: false },
      { exerciseName: "Push Press", sets: 4, reps: 6, weight: "Moderate", isStaticHold: false },
    ];
  } else if (lowerPrompt.includes("tendon") || lowerPrompt.includes("isometric")) {
    fallback.warning = "Client faced issues with this exercise earlier due to weak tendon. Added tendon strengthening isometric exercises this week.";
    fallback.name = "Tendon Rehab & Strengthening";
    fallback.exercises = [
      { exerciseName: "Bodyweight Squat", sets: 3, reps: "45s", weight: "Bodyweight", isStaticHold: true },
      { exerciseName: "Calf Raises", sets: 3, reps: "30s", weight: "Bodyweight", isStaticHold: true },
      { exerciseName: "Straight Leg Raise", sets: 3, reps: 15, weight: "Light", isStaticHold: false }
    ];
  } else {
    fallback.name = "General Hypertrophy";
    fallback.exercises = [
      { exerciseName: "Barbell Back Squat", sets: 4, reps: 10, weight: "70%", isStaticHold: false },
      { exerciseName: "Romanian Deadlift (RDL)", sets: 3, reps: 12, weight: "60%", isStaticHold: false },
      { exerciseName: "Leg Extension", sets: 3, reps: 15, weight: "Moderate", isStaticHold: false }
    ];
  }
  return fallback;
}

interface RoomData {
  roomId: string;
  roomToken: string;
  ptName: string;
  expectedClientName: string;
  submittedClientName: string;
  clientStatus: string;
  lastSessionNotes?: string;
  lastSessionTimestamp?: string;
}

interface SessionHistoryData {
  logId: string;
  roomId: string;
  timestamp: string;
  notes: string;
  completedExercisesJson: string;
}

interface BlueprintData {
  blueprintId: string;
  roomId: string;
  name: string;
  targetGoal: string;
  isActiveDayPlan: boolean;
}

interface BlueprintExerciseData {
  id: string;
  blueprintId: string;
  exerciseName: string;
  warmupFor: string;
  sets: number;
  reps: number;
  weight: string;
  isStaticHold: boolean;
  orderIndex: number;
}

interface ExerciseDictionaryData {
  exerciseId: string;
  name: string;
  category: string;
  targetMuscle: string;
  description: string;
  videoUrl: string;
  imageUrl: string;
  commonIssuesJson: string;
}

// Custom hook to manage SpaceTimeDB connection
function useSpaceTimeDB() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryData[]>([]);
  const [blueprints, setBlueprints] = useState<BlueprintData[]>([]);
  const [blueprintExercises, setBlueprintExercises] = useState<BlueprintExerciseData[]>([]);
  const [exerciseDictionary, setExerciseDictionary] = useState<ExerciseDictionaryData[]>([]);
  const [dbConn, setDbConn] = useState<DbConnection | null>(null);

  useEffect(() => {
    const spacetimedbUri = import.meta.env.VITE_SPACETIMEDB_URI || 'wss://maincloud.spacetimedb.com';
    const dbName = import.meta.env.VITE_SPACETIMEDB_NAME || 'thug-submission';
    console.log(`Connecting to SpaceTimeDB at ${spacetimedbUri} (${dbName})...`);

    try {
      const conn = DbConnection.builder()
        .withUri(spacetimedbUri)
        .withDatabaseName(dbName)
        .onConnect(() => {
          console.log('✅ SpaceTimeDB WebSocket Connected!');
          setIsConnected(true);
        })
        .onDisconnect(() => {
          console.log('❌ SpaceTimeDB Disconnected');
          setIsConnected(false);
        })
        .onConnectError((_ctx: any, err: any) => {
          console.error('SpaceTimeDB Connection Error:', err);
          setIsConnected(false);
        })
        .build();

      setDbConn(conn);

      const updateRooms = () => setRooms(Array.from(conn.db.room.iter()));
      const updateSessionHistory = () => setSessionHistory(Array.from(conn.db.sessionHistory.iter()));
      const updateBlueprints = () => {
        setBlueprints(Array.from(conn.db.blueprint.iter()));
        setBlueprintExercises(Array.from(conn.db.blueprintExercise.iter()));
      };
      const updateExerciseDictionary = () => setExerciseDictionary(Array.from((conn.db as any).exerciseDictionary.iter()));

      conn.subscriptionBuilder()
        .onApplied(() => {
          updateRooms();
          updateSessionHistory();
          updateBlueprints();
          updateExerciseDictionary();
        })
        .subscribe(['SELECT * FROM room', 'SELECT * FROM session_history', 'SELECT * FROM blueprint', 'SELECT * FROM blueprint_exercise', 'SELECT * FROM exercise_dictionary']);

      conn.db.room.onInsert(updateRooms);
      conn.db.room.onUpdate(updateRooms);
      conn.db.room.onDelete(updateRooms);
      
      conn.db.sessionHistory.onInsert(updateSessionHistory);
      conn.db.sessionHistory.onUpdate(updateSessionHistory);
      conn.db.sessionHistory.onDelete(updateSessionHistory);

      conn.db.blueprint.onInsert(updateBlueprints);
      conn.db.blueprint.onUpdate(updateBlueprints);
      conn.db.blueprint.onDelete(updateBlueprints);
      
      conn.db.blueprintExercise.onInsert(updateBlueprints);
      conn.db.blueprintExercise.onUpdate(updateBlueprints);
      conn.db.blueprintExercise.onDelete(updateBlueprints);

      return () => conn.disconnect();
    } catch (err) {
      console.error('Failed to initialize SpaceTimeDB connection:', err);
    }
  }, []);

  return { isConnected, rooms, sessionHistory, blueprints, blueprintExercises, exerciseDictionary, dbConn };
}

// -------------------------------------------------------------
// AI Blueprint Planner Modal
// -------------------------------------------------------------
function AIPlannerModal({ 
  isOpen, 
  onClose, 
  roomId, 
  dbConn 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  roomId: string;
  dbConn: DbConnection | null;
}) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBlueprint, setGeneratedBlueprint] = useState<any>(null);
  const [warning, setWarning] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setWarning(null);
    setGeneratedBlueprint(null);

    const result = await callLLMBlueprintPlanner(prompt);
    
    // Ensure exercises have orderIndex and ID for UI
    const exercisesWithIds = result.exercises.map((ex: any, idx: number) => ({
      ...ex,
      orderIndex: idx,
      id: `gen-${Date.now()}-${idx}`
    }));

    setWarning(result.warning);
    setGeneratedBlueprint({
      name: result.name,
      targetGoal: result.targetGoal,
      exercises: exercisesWithIds
    });
    
    setIsGenerating(false);
  };

  const handleSave = () => {
    if (!dbConn || !generatedBlueprint) return;
    
    dbConn.reducers.saveBlueprint({
      blueprintId: `bp-${Date.now()}`,
      roomId,
      name: generatedBlueprint.name,
      targetGoal: generatedBlueprint.targetGoal,
      isActiveDayPlan: false,
      exercisesJson: JSON.stringify(generatedBlueprint.exercises)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">AI Blueprint Planner</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <UserX className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {!generatedBlueprint && !isGenerating && (
            <div className="space-y-4">
              <p className="text-slate-300">Describe the client's long-term goals and any specific focuses for this phase.</p>
              <textarea 
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                placeholder="e.g. 'Build a plyometric focused session, client has weak tendons so keep lifting light...'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button 
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Generate Blueprint
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-indigo-400 font-medium animate-pulse">WikiGem AI is analyzing goals and formulating blueprint...</p>
            </div>
          )}

          {generatedBlueprint && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {warning && (
                <div className="bg-amber-900/40 border border-amber-700/50 rounded-lg p-4 flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-200 text-sm leading-relaxed">{warning}</p>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-indigo-400" />
                  {generatedBlueprint.name}
                </h3>
                <div className="space-y-2">
                  {generatedBlueprint.exercises.map((ex: any, idx: number) => (
                    <div key={idx} className="bg-slate-800/80 rounded-lg p-3 flex justify-between items-center border border-slate-700/50">
                      <div>
                        <p className="font-medium text-slate-200">{ex.exerciseName}</p>
                        <p className="text-xs text-slate-400">
                          {ex.isStaticHold ? `${ex.reps} seconds hold` : `${ex.sets} sets × ${ex.reps} reps`} 
                          {ex.weight && ` @ ${ex.weight}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {generatedBlueprint && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/50 flex justify-end gap-3">
            <button 
              onClick={() => { setGeneratedBlueprint(null); setWarning(null); }}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Discard & Retry
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Save Blueprint
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Blueprint Editor Modal (with exercise search)
// -------------------------------------------------------------
function BlueprintEditorModal({
  isOpen,
  onClose,
  blueprint,
  exercises,
  exerciseDictionary,
  dbConn
}: {
  isOpen: boolean;
  onClose: () => void;
  blueprint: BlueprintData | null;
  exercises: BlueprintExerciseData[];
  exerciseDictionary: ExerciseDictionaryData[];
  dbConn: DbConnection | null;
}) {
  const [name, setName] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [editedExercises, setEditedExercises] = useState<any[]>([]);
  const [searchTerms, setSearchTerms] = useState<Record<number, string>>({});
  const [showDropdown, setShowDropdown] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (blueprint) {
      setName(blueprint.name || '');
      setTargetGoal(blueprint.targetGoal || '');
      if (exercises && exercises.length > 0) {
        setEditedExercises(exercises.map(ex => ({ ...ex })));
      } else if (blueprint.blueprintId.startsWith('new-manual')) {
        setEditedExercises([
          {
            id: `new-${Date.now()}-0`,
            exerciseName: starterExercises[0].name,
            sets: 3,
            reps: 10,
            weight: 'Bodyweight',
            isStaticHold: false,
            orderIndex: 0
          }
        ]);
      } else {
        setEditedExercises([]);
      }
    }
  }, [blueprint, exercises]);

  if (!isOpen || !blueprint) return null;

  const isNew = blueprint.blueprintId.startsWith('new-manual');

  const handleSave = () => {
    if (!dbConn) return;
    const finalBpId = isNew ? `bp-${Date.now()}` : blueprint.blueprintId;
    dbConn.reducers.saveBlueprint({
      blueprintId: finalBpId,
      roomId: blueprint.roomId,
      name: name.trim() || (isNew ? 'Custom Session Plan' : blueprint.name),
      targetGoal: targetGoal.trim() || 'Personalized Rehabilitation Protocol',
      isActiveDayPlan: isNew ? true : blueprint.isActiveDayPlan,
      exercisesJson: JSON.stringify(editedExercises)
    });
    onClose();
  };

  const addExercise = () => {
    setEditedExercises(prev => [
      ...prev,
      {
        id: `new-${Date.now()}-${prev.length}`,
        exerciseName: '',
        sets: 3,
        reps: 10,
        weight: 'Bodyweight',
        isStaticHold: false,
        orderIndex: prev.length
      }
    ]);
  };

  const updateExercise = (index: number, field: string, value: any) => {
    const newExs = [...editedExercises];
    newExs[index] = { ...newExs[index], [field]: value };
    setEditedExercises(newExs);
  };

  const selectExerciseFromList = (index: number, exName: string) => {
    const isHold = detectIsStaticHold(exName);
    const newExs = [...editedExercises];
    newExs[index] = {
      ...newExs[index],
      exerciseName: exName,
      isStaticHold: isHold,
      reps: isHold ? 30 : 10
    };
    setEditedExercises(newExs);
    setSearchTerms(prev => ({ ...prev, [index]: exName }));
    setShowDropdown(prev => ({ ...prev, [index]: false }));
  };

  const getFilteredExercises = (term: string) => {
    if (!term || term.trim().length === 0) {
      return starterExercises.slice(0, 8).map(s => ({
        exerciseId: s.id,
        name: s.name,
        category: s.category,
        targetMuscle: s.musclesTargeted
      }));
    }
    const dictMatches = exerciseDictionary
      .filter(e => e.name.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 8);
    if (dictMatches.length > 0) return dictMatches;
    return starterExercises
      .filter(s => s.name.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 8)
      .map(s => ({
        exerciseId: s.id,
        name: s.name,
        category: s.category,
        targetMuscle: s.musclesTargeted
      }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/60">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-400" />
              {isNew ? 'Create Manual Session Plan' : `Edit Blueprint: ${blueprint.name}`}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isNew ? 'Configure custom exercises, sets, reps, and hold times.' : 'Update protocol exercises and prescribing parameters.'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Blueprint Name & Goal (Always editable, essential for manual blueprints) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Plan Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Lower Body Rehab Protocol"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Target Clinical Goal
              </label>
              <input
                type="text"
                value={targetGoal}
                onChange={e => setTargetGoal(e.target.value)}
                placeholder="e.g. Ankle dorsiflexion & glute activation"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Exercise Items List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Exercises in Plan ({editedExercises.length})
              </h3>
              <span className="text-[11px] text-indigo-400">Sets, reps, and hold times auto-calibrate</span>
            </div>

            {editedExercises.map((ex, idx) => {
              const isHold = !!ex.isStaticHold;
              return (
                <div key={ex.id || idx} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3.5 shadow-sm">
                  {/* Exercise Name + Search Dropdown */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 mt-2 border border-indigo-500/30">
                      {idx + 1}
                    </div>
                    <div className="flex-1 relative">
                      <label className="block text-[11px] text-slate-400 font-medium mb-1">
                        Exercise Name (Search or type custom)
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                          type="text"
                          value={searchTerms[idx] !== undefined ? searchTerms[idx] : ex.exerciseName}
                          onChange={e => {
                            setSearchTerms(prev => ({ ...prev, [idx]: e.target.value }));
                            setShowDropdown(prev => ({ ...prev, [idx]: true }));
                          }}
                          onFocus={() => setShowDropdown(prev => ({ ...prev, [idx]: true }))}
                          onBlur={() => setTimeout(() => setShowDropdown(prev => ({ ...prev, [idx]: false })), 250)}
                          placeholder="Search database or select starter movement..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
                        />
                      </div>

                      {/* Dropdown Options */}
                      {showDropdown[idx] && (
                        <div className="absolute top-full left-0 right-0 z-30 bg-slate-900 border border-slate-700 rounded-xl mt-1 shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-800">
                          {getFilteredExercises(searchTerms[idx] || '').map(dictEx => (
                            <button
                              key={dictEx.exerciseId}
                              type="button"
                              onClick={() => selectExerciseFromList(idx, dictEx.name)}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex justify-between items-center transition-colors"
                            >
                              <div>
                                <span className="text-white text-xs font-bold block">{dictEx.name}</span>
                                <span className="text-[10px] text-slate-400">{dictEx.category} · {dictEx.targetMuscle}</span>
                              </div>
                              {detectIsStaticHold(dictEx.name) && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                                  Isometric Hold
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditedExercises(prev => prev.filter((_, i) => i !== idx))}
                      className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors mt-6"
                      title="Remove exercise"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Parameter Controls: Exercise Type, Sets, Reps/Time, Weight */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-700/60 items-center">
                    {/* Exercise Type Segmented Control */}
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                        Execution Type
                      </label>
                      <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            updateExercise(idx, 'isStaticHold', false);
                            if (ex.reps > 20) updateExercise(idx, 'reps', 10);
                          }}
                          className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all flex items-center justify-center gap-1 ${
                            !isHold ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Repeat className="w-3 h-3" />
                          <span>Reps</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateExercise(idx, 'isStaticHold', true);
                            if (ex.reps <= 15) updateExercise(idx, 'reps', 30);
                          }}
                          className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all flex items-center justify-center gap-1 ${
                            isHold ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>Hold</span>
                        </button>
                      </div>
                    </div>

                    {/* Sets Stepper & Presets */}
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                        Sets
                      </label>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700 p-0.5">
                          <button
                            type="button"
                            onClick={() => updateExercise(idx, 'sets', Math.max(1, (ex.sets || 3) - 1))}
                            className="w-6 h-6 hover:bg-slate-800 text-slate-300 rounded flex items-center justify-center text-xs font-bold"
                          >-</button>
                          <span className="w-8 text-center text-white text-xs font-bold">{ex.sets || 3}</span>
                          <button
                            type="button"
                            onClick={() => updateExercise(idx, 'sets', (ex.sets || 3) + 1)}
                            className="w-6 h-6 hover:bg-slate-800 text-slate-300 rounded flex items-center justify-center text-xs font-bold"
                          >+</button>
                        </div>
                        <div className="flex gap-1">
                          {[2, 3, 4].map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => updateExercise(idx, 'sets', s)}
                              className={`px-2 py-1 text-[10px] rounded font-bold transition-all ${
                                ex.sets === s ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40' : 'bg-slate-900 text-slate-400 hover:text-white'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Reps or Hold Seconds Stepper & Presets */}
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                        {isHold ? 'Duration (Seconds)' : 'Repetitions'}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700 p-0.5">
                          <button
                            type="button"
                            onClick={() => updateExercise(idx, 'reps', Math.max(isHold ? 5 : 1, (ex.reps || 10) - (isHold ? 5 : 1)))}
                            className="w-6 h-6 hover:bg-slate-800 text-slate-300 rounded flex items-center justify-center text-xs font-bold"
                          >-</button>
                          <span className="w-12 text-center text-white text-xs font-bold">
                            {ex.reps || (isHold ? 30 : 10)}{isHold ? 's' : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateExercise(idx, 'reps', (ex.reps || 10) + (isHold ? 5 : 1))}
                            className="w-6 h-6 hover:bg-slate-800 text-slate-300 rounded flex items-center justify-center text-xs font-bold"
                          >+</button>
                        </div>
                        <div className="flex gap-1">
                          {(isHold ? [20, 30, 45] : [8, 10, 12]).map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => updateExercise(idx, 'reps', val)}
                              className={`px-1.5 py-1 text-[10px] rounded font-bold transition-all ${
                                ex.reps === val ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-400 hover:text-white'
                              }`}
                            >
                              {val}{isHold ? 's' : ''}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Weight / Resistance Quick Chips & Input */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700/40">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Weight:</span>
                    <input
                      type="text"
                      value={ex.weight || 'Bodyweight'}
                      onChange={e => updateExercise(idx, 'weight', e.target.value)}
                      placeholder="e.g. Bodyweight, 10kg"
                      className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-1 overflow-x-auto">
                      {['Bodyweight', 'Dumbbells', 'Barbell', 'Band'].map(w => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => updateExercise(idx, 'weight', w)}
                          className={`px-2 py-0.5 text-[10px] rounded font-medium transition-all ${
                            ex.weight === w ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addExercise}
            className="w-full py-2.5 border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl text-indigo-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-900/40 hover:bg-slate-900"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Exercise</span>
          </button>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/60 flex justify-between items-center">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isNew ? 'Create & Activate Plan' : 'Save Plan Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// PT Dashboard Component
// -------------------------------------------------------------
function PTDashboard({ rooms }: { rooms: RoomData[] }) {
  const navigate = useNavigate();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleCopyClientLink = (roomToken: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/client/${roomToken}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(roomToken);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              PT Dashboard - Active Client Rooms
            </h2>
            <p className="text-xs text-slate-400">Manage multiple client tele-rehab sessions</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map(room => (
            <div 
              key={room.roomId} 
              className="bg-slate-900/60 p-5 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between gap-4"
              onClick={() => navigate(`/pt/room/${room.roomId}`)}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-white font-semibold">Room: {room.roomId}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                    room.clientStatus === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    room.clientStatus === 'WAITING_APPROVAL' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {room.clientStatus === 'CONNECTED' ? 'LIVE' :
                     room.clientStatus === 'WAITING_APPROVAL' ? 'ACTION NEEDED' :
                     'INACTIVE'}
                  </span>
                </div>
                <div className="text-sm text-slate-400 space-y-1.5">
                  <p>Expected Client: <span className="text-slate-200 font-medium">{room.expectedClientName}</span></p>
                  {room.submittedClientName && (
                    room.clientStatus === 'WAITING_APPROVAL' ||
                    (room.clientStatus === 'DENIED' && room.submittedClientName.trim().toLowerCase() !== room.expectedClientName.trim().toLowerCase())
                  ) && (
                    <p>Submitted Name: <span className="text-amber-300 font-medium">{room.submittedClientName}</span></p>
                  )}

                  {/* Inline Client Link with minimal Copy CTA */}
                  <div className="flex items-center justify-between bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/90 mt-2">
                    <div className="truncate mr-2">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Client Link</span>
                      <span className="font-mono text-xs text-indigo-300 truncate block">
                        {`${window.location.origin}/client/${room.roomToken}`}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleCopyClientLink(room.roomToken, e)}
                      title="Copy Link to Clipboard"
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center space-x-1 shrink-0 ${
                        copiedToken === room.roomToken
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {copiedToken === room.roomToken ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Subtext Area: Last session date & time and notes */}
                {room.lastSessionTimestamp ? (
                  <div className="mt-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-xs">
                    <p className="text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      Last Session: <span className="text-indigo-300">{room.lastSessionTimestamp}</span>
                    </p>
                    {room.lastSessionNotes && (
                      <p className="text-slate-400 italic line-clamp-2 mt-1">
                        "{room.lastSessionNotes}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-slate-500 italic">
                    No previous sessions logged
                  </div>
                )}
              </div>
            </div>
          ))}
          {rooms.length === 0 && (
            <div className="col-span-3 text-center py-10 text-slate-400">
              No rooms found in SpaceTimeDB. Please wait for sync or initialize DB.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// PT Room View Component
// -------------------------------------------------------// DiagnosticState shared between PT console and Client view via sessionStorage
const DIAG_STATE_KEY = 'physiosync_diag_state';

export interface StarterExercise {
  id: string;
  name: string;
  category: string;
  videoUrl: string;
  imageUrl: string;
  musclesTargeted: string;
  commonIssues: { id: string; title: string; icon: string }[];
}

export const starterExercises: StarterExercise[] = [
  {
    id: 'bodyweight-squat',
    name: 'Bodyweight Squat',
    category: 'Lower Body Push',
    musclesTargeted: 'Quads, Gluteus Maximus, Adductor Magnus',
    videoUrl: 'https://www.youtube.com/embed/dW3zj79xfrc',
    imageUrl: 'https://i0.wp.com/www.strengthlog.com/wp-content/uploads/2020/05/Squat-muscles-worked.png?resize=700%2C700&ssl=1',
    commonIssues: [
      { id: 'heel-lift', title: 'Heels Lifting Off Floor / Unable to keep back straight', icon: '🦶' },
      { id: 'knee-valgus', title: 'Knees Collapsing Inward (Valgus)', icon: '🦵' },
      { id: 'butt-wink', title: 'Lower Back Rounding at Bottom (Butt Wink)', icon: '🍑' },
      { id: 'no-depth', title: "Cannot Reach Parallel Depth", icon: '⬇️' },
      { id: 'back-pain', title: 'Excessive Forward Lean / Lower Back Discomfort', icon: '🔴' }
    ]
  },
  {
    id: 'rdl',
    name: 'Romanian Deadlift (RDL)',
    category: 'Lower Body Hinge',
    musclesTargeted: 'Hamstrings, Gluteus Maximus, Erector Spinae',
    videoUrl: 'https://www.youtube.com/embed/NDfZi5fDaVM',
    imageUrl: 'https://i0.wp.com/www.strengthlog.com/wp-content/uploads/2020/12/Romanian-deadlift-muscles-worked.png?resize=700%2C700&ssl=1',
    commonIssues: [
      { id: 'rdl-lumbar-round', title: 'Lower Back Rounding During Descent', icon: '🔴' },
      { id: 'rdl-bar-drift', title: 'Weight Drifting Away from Shins / Legs', icon: '↔️' },
      { id: 'rdl-hyperextend', title: 'Hyperextending Lumbar Spine at Lockout', icon: '⚡' },
      { id: 'rdl-knee-bend', title: 'Bending Knees Too Much (Turning into Squat)', icon: '🦵' },
      { id: 'rdl-hamstring-tight', title: 'Hamstring Pain / Inability to Push Hips Back', icon: '🍑' }
    ]
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    category: 'Lower Body Unilateral',
    musclesTargeted: 'Quads, Gluteus Medius, Core Stability',
    videoUrl: 'https://www.youtube.com/embed/2C-uNgKwPLE',
    imageUrl: 'https://i0.wp.com/www.strengthlog.com/wp-content/uploads/2020/12/Bulgarian-split-squat-muscles-worked.png?resize=700%2C700&ssl=1',
    commonIssues: [
      { id: 'bss-valgus', title: 'Front Knee Wobbling or Collapsing Inward', icon: '🦵' },
      { id: 'bss-balance', title: 'Losing Balance / Shaky Ankle Stability', icon: '⚖️' },
      { id: 'bss-hip-flexor', title: 'Pinching or Strain in Rear Hip Flexor', icon: '🔴' },
      { id: 'bss-torso-drop', title: 'Torso Collapsing Forward Over Front Thigh', icon: '⬇️' },
      { id: 'bss-heel-lift', title: 'Front Heel Lifting Off Ground', icon: '🦶' }
    ]
  },
  {
    id: 'push-up',
    name: 'Push-Up',
    category: 'Upper Body Push',
    musclesTargeted: 'Pectoralis Major, Anterior Deltoid, Triceps, Anterior Core',
    videoUrl: 'https://www.youtube.com/embed/IODxDxX7oi4',
    imageUrl: 'https://i0.wp.com/www.strengthlog.com/wp-content/uploads/2020/11/Push-up-muscles-worked.png?resize=700%2C700&ssl=1',
    commonIssues: [
      { id: 'pu-hip-sag', title: 'Hips Sagging / Lumbar Arching (Weak Core)', icon: '⬇️' },
      { id: 'pu-elbow-flare', title: 'Elbows Flaring Out 90° (Shoulder Impingement)', icon: '📐' },
      { id: 'pu-winging', title: 'Scapular Winging / Chest Not Touching Depth', icon: '🪽' },
      { id: 'pu-head-poke', title: 'Forward Head Poke / Neck Strain', icon: '🗣️' },
      { id: 'pu-wrist-pain', title: 'Wrist Extension Discomfort', icon: '✋' }
    ]
  },
  {
    id: 'overhead-press',
    name: 'Overhead Dumbbell Press',
    category: 'Upper Body Vertical Push',
    musclesTargeted: 'Anterior & Lateral Deltoids, Triceps, Upper Trapezius',
    videoUrl: 'https://www.youtube.com/embed/2yjwXTZQDDI',
    imageUrl: 'https://i0.wp.com/www.strengthlog.com/wp-content/uploads/2020/12/Dumbbell-shoulder-press-muscles-worked.png?resize=700%2C700&ssl=1',
    commonIssues: [
      { id: 'ohp-lumbar-arch', title: 'Excessive Lower Back Arching to Push Upward', icon: '🔴' },
      { id: 'ohp-pinch', title: 'Shoulder Pinching / Impingement at Top', icon: '⚡' },
      { id: 'ohp-flare', title: 'Flaring Elbows Behind Plane of Torso', icon: '📐' },
      { id: 'ohp-uneven', title: 'Uneven Pressing (Dominant Side Locks Early)', icon: '⚖️' },
      { id: 'ohp-shrug', title: 'Shrugging Traps into Neck Rather Than Upward Rotate', icon: '💆' }
    ]
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    category: 'Rehab / Posterior Chain',
    musclesTargeted: 'Gluteus Maximus, Hamstrings, Core Bracing',
    videoUrl: 'https://www.youtube.com/embed/wPM8icPu6H8',
    imageUrl: 'https://i0.wp.com/www.strengthlog.com/wp-content/uploads/2021/04/Glute-bridge-muscles-worked.png?resize=700%2C700&ssl=1',
    commonIssues: [
      { id: 'gb-hamstring-cramp', title: 'Hamstrings Cramping Instead of Glutes Firing', icon: '⚡' },
      { id: 'gb-lower-back', title: 'Arching Lumbar Spine Instead of Pelvic Tilt', icon: '🔴' },
      { id: 'gb-toe-push', title: 'Pushing Through Toes Instead of Driving Heels', icon: '🦶' },
      { id: 'gb-sag', title: 'Incomplete Hip Extension / Hips Dropping Early', icon: '⬇️' },
      { id: 'gb-knee-valgus', title: 'Knees Flaring or Collapsing Inward', icon: '🦵' }
    ]
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    category: 'Core Anti-Extension',
    musclesTargeted: 'Transverse Abdominis, Rectus Abdominis, Hip Flexors',
    videoUrl: 'https://www.youtube.com/embed/g_BYB0R-4Ws',
    imageUrl: 'https://i0.wp.com/www.strengthlog.com/wp-content/uploads/2022/01/Dead-bug-muscles-worked.png?resize=700%2C700&ssl=1',
    commonIssues: [
      { id: 'db-back-arch', title: 'Lower Back Lifting Off Floor When Extending Limbs', icon: '🔴' },
      { id: 'db-rib-flare', title: 'Ribcage Flaring Upward / Loss of Hollow Body', icon: '💨' },
      { id: 'db-neck-strain', title: 'Tensing Neck & Upper Traps', icon: '💆' },
      { id: 'db-hip-click', title: 'Clicking or Popping in Anterior Hip Capsule', icon: '🦴' },
      { id: 'db-momentum', title: 'Rushing Movement / Lack of Controlled Tempo', icon: '⚡' }
    ]
  },
  {
    id: 'bird-dog',
    name: 'Bird Dog',
    category: 'Spinal Stability / Posterior Chain',
    musclesTargeted: 'Erector Spinae, Multifidus, Glutes, Deltoids',
    videoUrl: 'https://www.youtube.com/embed/wiFNA3sqjCA',
    imageUrl: 'https://i0.wp.com/www.strengthlog.com/wp-content/uploads/2022/01/Bird-dog-muscles-worked.png?resize=700%2C700&ssl=1',
    commonIssues: [
      { id: 'bd-pelvis-tilt', title: 'Pelvis Rotating or Dipping to One Side', icon: '⚖️' },
      { id: 'bd-hyperextend', title: 'Lower Back Hyperextending / Sagging', icon: '🔴' },
      { id: 'bd-neck-crane', title: 'Craning Neck Upward Instead of Packing Chin', icon: '🗣️' },
      { id: 'bd-shrug', title: 'Supporting Shoulder Collapsing into Ear', icon: '📐' },
      { id: 'bd-wobble', title: 'Shaking on Supporting Knee & Hand', icon: '⚡' }
    ]
  },
  {
    id: 'clamshells',
    name: 'Clamshells',
    category: 'Hip Rehab / Glute Medius',
    musclesTargeted: 'Gluteus Medius, Gluteus Minimus, Deep External Rotators',
    videoUrl: 'https://www.youtube.com/embed/q6U1j0jWwEE',
    imageUrl: 'https://i0.wp.com/www.strengthlog.com/wp-content/uploads/2021/04/Clamshell-muscles-worked.png?resize=700%2C700&ssl=1',
    commonIssues: [
      { id: 'cs-roll-back', title: 'Rolling Pelvis Backward When Opening Knee', icon: '🔄' },
      { id: 'cs-tfl-burn', title: 'Feeling Burn in Front TFL Instead of Lateral Glute', icon: '🔴' },
      { id: 'cs-foot-lift', title: 'Feet Separating from Each Other', icon: '🦶' },
      { id: 'cs-limited-rom', title: 'Extremely Limited Knee Separation Angle', icon: '📐' },
      { id: 'cs-spine-twist', title: 'Twisting Lumbar Spine to Assist Movement', icon: '⚡' }
    ]
  },
  {
    id: 'side-plank',
    name: 'Side Plank',
    category: 'Core Anti-Lateral Flexion',
    musclesTargeted: 'Obliques, Quadratus Lumborum, Gluteus Medius',
    videoUrl: 'https://www.youtube.com/embed/K2VljzCC16g',
    imageUrl: 'https://i0.wp.com/www.strengthlog.com/wp-content/uploads/2021/03/Side-plank-muscles-worked.png?resize=700%2C700&ssl=1',
    commonIssues: [
      { id: 'sp-hip-sag', title: 'Hips Sagging Downward Toward the Floor', icon: '⬇️' },
      { id: 'sp-rotation', title: 'Top Hip Rolling Forward or Backward', icon: '🔄' },
      { id: 'sp-shoulder-sink', title: 'Bottom Shoulder Collapsing / Ear Sinking', icon: '📐' },
      { id: 'sp-neck-strain', title: 'Head Hanging Down / Severe Neck Strain', icon: '🗣️' },
      { id: 'sp-elbow-pain', title: 'Elbow Pressure on Floor', icon: '⚡' }
    ]
  },
  {
    id: 'inverted-row',
    name: 'Inverted Row / Pull-Up',
    category: 'Upper Body Pull',
    musclesTargeted: 'Latissimus Dorsi, Rhomboids, Biceps, Core',
    videoUrl: 'https://www.youtube.com/embed/e50eWd0A_jE',
    imageUrl: 'https://i0.wp.com/www.strengthlog.com/wp-content/uploads/2020/12/Pull-up-muscles-worked.png?resize=700%2C700&ssl=1',
    commonIssues: [
      { id: 'row-shoulder-dump', title: 'Shoulders Dumping Forward at Top of Pull', icon: '🔴' },
      { id: 'row-no-retract', title: 'Pulling with Arms Without Retracting Scapulae', icon: '📐' },
      { id: 'row-bicep-cramp', title: 'Overusing Forearms / Biceps and Not Feeling Back', icon: '💪' },
      { id: 'row-hip-sag', title: 'Hips Dropping Down (Breaking Rigid Body Line)', icon: '⬇️' },
      { id: 'row-half-rep', title: 'Inability to Touch Chest to Bar / Ring', icon: '⚡' }
    ]
  },
  {
    id: 'ankle-dorsiflexion',
    name: 'Ankle Dorsiflexion Mobility',
    category: 'Mobility Screen & Rehab',
    musclesTargeted: 'Soleus, Gastrocnemius, Talocrural Joint Capsule',
    videoUrl: 'https://www.youtube.com/embed/2v7WqT_V_oM',
    imageUrl: 'https://i0.wp.com/www.strengthlog.com/wp-content/uploads/2020/05/Squat-muscles-worked.png?resize=700%2C700&ssl=1',
    commonIssues: [
      { id: 'ankle-early-lift', title: 'Heel Lifting Early in Knee-to-Wall Drive', icon: '🦶' },
      { id: 'ankle-pinch', title: 'Anterior Joint Pinching in Front of Ankle', icon: '🔴' },
      { id: 'ankle-pronation', title: 'Foot Collapsing / Rolling Inward to Cheat Range', icon: '🔄' },
      { id: 'ankle-knee-caving', title: 'Knee Tracking Inside Big Toe Rather Than 2nd Toe', icon: '🦵' },
      { id: 'ankle-asymmetry', title: 'Significant Asymmetry Between Left and Right Ankle', icon: '⚖️' }
    ]
  }
];

export const squatExerciseTemplate = starterExercises[0];

export interface SetExecutionLog {
  actualReps: number | string;
  actualWeight: string;
  actualTime: string;
  completed: boolean;
  loggedBy?: 'PT' | 'CLIENT';
}

interface DiagnosticState {
  assignedExercise: StarterExercise | null;
  issueText: string;
  loggedBy: 'PT' | 'CLIENT';
  analysis: any | null;
  approvedOption: DiagnosticOption | null;
  clientResult: string;
  autoLogResult: any | null;
  executionLog?: Record<string, SetExecutionLog[]>;
  status: 'idle' | 'needs_pt_analysis' | 'analyzing' | 'awaiting_pt_approval' | 'awaiting_client_result' | 'client_result_submitted' | 'auto_logging' | 'complete';
}

export function resolveExerciseDetails(
  nameOrId: string,
  starterExercisesList: StarterExercise[],
  exerciseDictionaryList: ExerciseDictionaryData[]
): StarterExercise {
  const norm = (nameOrId || '').toLowerCase().trim();
  
  // 1. Check starterExercises by id or exact/partial name match
  const starter = starterExercisesList.find(s => 
    s.id.toLowerCase() === norm || 
    s.name.toLowerCase() === norm ||
    norm.includes(s.name.toLowerCase()) || 
    s.name.toLowerCase().includes(norm)
  );
  if (starter) return starter;

  // 2. Check exerciseDictionary
  const dict = exerciseDictionaryList.find(d => 
    d.exerciseId.toLowerCase() === norm || 
    d.name.toLowerCase() === norm || 
    norm.includes(d.name.toLowerCase()) || 
    d.name.toLowerCase().includes(norm)
  );
  if (dict) {
    let commonIssues: { id: string; title: string; icon: string }[] = [];
    try {
      commonIssues = JSON.parse(dict.commonIssuesJson || '[]');
    } catch {}
    if (!commonIssues.length) {
      commonIssues = [
        { id: 'fatigue', title: 'Loss of posture / Early fatigue', icon: '⚡' },
        { id: 'form-break', title: 'Form breakdown / Joint strain', icon: '🔴' },
        { id: 'range', title: 'Limited range of motion / tightness', icon: '↔️' }
      ];
    }
    return {
      id: dict.exerciseId || 'dict-' + dict.name.toLowerCase().replace(/\s+/g, '-'),
      name: dict.name,
      category: dict.category || 'Rehabilitation & Strength',
      videoUrl: dict.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      imageUrl: dict.imageUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=60',
      musclesTargeted: dict.targetMuscle || 'Target Muscle Group & Core',
      commonIssues
    };
  }

  // 3. Fallback dynamically generated
  const isHold = detectIsStaticHold(nameOrId);
  return {
    id: 'custom-' + norm.replace(/[^a-z0-9]/g, '-'),
    name: nameOrId,
    category: isHold ? 'Isometric & Stability' : 'Strength & Mobility',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=60',
    musclesTargeted: isHold ? 'Core & Stabilizers' : 'Primary Kinetic Chain',
    commonIssues: [
      { id: 'form-break', title: 'Loss of spinal alignment / compensations', icon: '🔴' },
      { id: 'muscle-fatigue', title: 'Early fatigue / Shaking', icon: '⚡' },
      { id: 'pain-discomfort', title: 'Joint pinching / Local discomfort', icon: '⚠️' }
    ]
  };
}

function PTRoomView({ dbConn, rooms, sessionHistory, blueprints, blueprintExercises, exerciseDictionary }: { dbConn: DbConnection | null, rooms: RoomData[], sessionHistory: SessionHistoryData[], blueprints: BlueprintData[], blueprintExercises: BlueprintExerciseData[], exerciseDictionary: ExerciseDictionaryData[] }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const roomState = rooms.find(r => r.roomId === roomId);
  const [isEndingSession, setIsEndingSession] = useState<boolean>(false);
  const [notesInput, setNotesInput] = useState<string>('');
  const [copiedBanner, setCopiedBanner] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'console' | 'history' | 'planner'>('console');
  const [isAIPlannerOpen, setIsAIPlannerOpen] = useState(false);
  const [editingBlueprint, setEditingBlueprint] = useState<BlueprintData | null>(null);
  
  // Diagnostic AI state synced over SpaceTimeDB via blueprint table
  const diagBlueprint = blueprints.find(b => b.roomId === roomState?.roomId && b.name === '__DIAGNOSTIC_STATE__');
  const [diagState, setDiagState] = useState<DiagnosticState>({
    assignedExercise: null,
    issueText: '', loggedBy: 'PT', analysis: null, approvedOption: null,
    clientResult: '', autoLogResult: null, status: 'idle'
  });
  const [ptIssueInput, setPtIssueInput] = useState('');
  const [selectedStarterExId, setSelectedStarterExId] = useState<string>(starterExercises[0].id);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState<boolean>(false);
  const [previewingOption, setPreviewingOption] = useState<DiagnosticOption | null>(null);
  const [selectedCandidateVideo, setSelectedCandidateVideo] = useState<CandidateVideo | null>(null);

  const handleAssignExercise = (ex: StarterExercise) => {
    updateDiagState({ assignedExercise: ex });
    setIsExercisePickerOpen(false);
  };

  const handleSelectActiveBlueprintExercise = (ex: BlueprintExerciseData) => {
    const fullEx = resolveExerciseDetails(ex.exerciseName, starterExercises, exerciseDictionary);
    handleAssignExercise(fullEx);
  };

  const activeBlueprint = blueprints.find(b => b.roomId === roomState?.roomId && b.isActiveDayPlan && b.name !== '__DIAGNOSTIC_STATE__');
  const activeBlueprintExercises = activeBlueprint ? blueprintExercises.filter(e => e.blueprintId === activeBlueprint.blueprintId).sort((a,b) => a.orderIndex - b.orderIndex) : [];
  
  // executionLog maps exercise id to array of set performances
  const [executionLog, setExecutionLog] = useState<Record<string, SetExecutionLog[]>>({});

  if (!roomState) {
    return <div className="text-white p-6 text-center">Room not found or loading...</div>;
  }

  const handleApprove = (approve: boolean) => {
    if (!dbConn) return;
    dbConn.reducers.approveClientEntry({ roomId: roomState.roomId, approve });
  };

  const handleSetActivePlan = (blueprint: BlueprintData) => {
    if (!dbConn) return;
    const exs = blueprintExercises.filter(e => e.blueprintId === blueprint.blueprintId);
    dbConn.reducers.saveBlueprint({
      blueprintId: blueprint.blueprintId,
      roomId: blueprint.roomId,
      name: blueprint.name,
      targetGoal: blueprint.targetGoal,
      isActiveDayPlan: true,
      exercisesJson: JSON.stringify(exs)
    });
  };

  // Broadcast diag state to SpaceTimeDB so external PCs receive it in real-time
  const broadcastDiagState = (next: DiagnosticState) => {
    setDiagState(next);
    try { sessionStorage.setItem(DIAG_STATE_KEY + '_' + roomId, JSON.stringify(next)); } catch {}
    if (dbConn && roomState) {
      dbConn.reducers.saveBlueprint({
        blueprintId: 'diag-' + roomState.roomId,
        roomId: roomState.roomId,
        name: '__DIAGNOSTIC_STATE__',
        targetGoal: JSON.stringify(next),
        isActiveDayPlan: false,
        exercisesJson: '[]'
      });
    }
  };

  const updateDiagState = (partial: Partial<DiagnosticState>) => {
    setDiagState(prev => {
      const next = { ...prev, ...partial };
      broadcastDiagState(next);
      return next;
    });
  };

  // Sync diagnostic state from SpaceTimeDB blueprint broadcast (external PC support)
  const lastHandledIssueRef = useRef<string>('');
  useEffect(() => {
    if (!diagBlueprint?.targetGoal) return;
    try {
      const remote = JSON.parse(diagBlueprint.targetGoal) as DiagnosticState;
      if (remote.executionLog) {
        setExecutionLog(prev => ({ ...prev, ...remote.executionLog }));
      }
      if (remote.status === 'needs_pt_analysis' && lastHandledIssueRef.current !== remote.issueText) {
        lastHandledIssueRef.current = remote.issueText;
        setDiagState(remote);
        handleLogIssue(remote.issueText, remote.loggedBy || 'CLIENT');
      } else if (remote.status === 'client_result_submitted' || (remote.clientResult && remote.clientResult !== diagState.clientResult)) {
        setDiagState(prev => ({ ...prev, clientResult: remote.clientResult, status: 'awaiting_client_result' }));
      } else {
        setDiagState(prev => ({ ...prev, ...remote }));
      }
    } catch {}
  }, [diagBlueprint?.targetGoal]);

  const handleLogIssue = async (issueText: string, loggedBy: 'PT' | 'CLIENT') => {
    if (!issueText.trim()) return;
    updateDiagState({ issueText, loggedBy, status: 'analyzing', analysis: null, approvedOption: null, clientResult: '', autoLogResult: null });
    setActiveTab('console');
    const currentMovement = diagState.assignedExercise?.name || 'Movement';
    const result = await callLLMDiagnostic(issueText, roomState?.expectedClientName || 'Client', `${currentMovement} Rehab / Biomechanics Assessment`, exerciseDictionary);
    updateDiagState({ analysis: result, status: 'awaiting_pt_approval' });
    if (result.ptOptions && result.ptOptions.length > 0) {
      setPreviewingOption(result.ptOptions[0]);
      if (result.ptOptions[0].candidateVideos && result.ptOptions[0].candidateVideos.length > 0) {
        setSelectedCandidateVideo(result.ptOptions[0].candidateVideos[0]);
      }
    }
  };

  const handleApproveOption = async (option: DiagnosticOption, chosenVideo?: CandidateVideo | null) => {
    const fullOption: DiagnosticOption = {
      ...option,
      approvedVideo: chosenVideo || null
    };
    updateDiagState({ approvedOption: fullOption, status: 'awaiting_client_result' });
    setPreviewingOption(null);
    setSelectedCandidateVideo(null);
  };

  const handleAutoLog = async () => {
    if (!diagState.approvedOption || !diagState.clientResult.trim()) return;
    updateDiagState({ status: 'auto_logging' });
    const result = await callLLMAutoLog(
      diagState.issueText, 
      diagState.approvedOption.label,
      diagState.clientResult,
      roomState?.expectedClientName || 'Client'
    );
    updateDiagState({ autoLogResult: result, status: 'complete' });
    
    // Auto-update blueprint
    if (dbConn && roomState) {
      const bpId = activeBlueprint?.blueprintId || `bp-diag-${Date.now()}`;
      const existingExs = activeBlueprintExercises.map(e => ({...e}));
      const newEx = {
        id: `diag-${Date.now()}`,
        exerciseName: result.suggestedExercise,
        warmupFor: '',
        sets: result.suggestedExerciseSets,
        reps: result.suggestedExerciseReps,
        weight: 'Bodyweight',
        isStaticHold: result.suggestedExerciseReps > 20,
        orderIndex: existingExs.length
      };
      dbConn.reducers.saveBlueprint({
        blueprintId: bpId,
        roomId: roomState.roomId,
        name: activeBlueprint?.name || 'Diagnostic Session Plan',
        targetGoal: activeBlueprint?.targetGoal || 'Squat Rehab',
        isActiveDayPlan: true,
        exercisesJson: JSON.stringify([...existingExs, newEx])
      });
    }
  };

  const updateExecutionSet = (exId: string, setIdx: number, field: string, value: any, loggedBy: 'PT' | 'CLIENT' = 'PT') => {
    setExecutionLog(prev => {
      const exLog = prev[exId] ? [...prev[exId]] : [];
      while(exLog.length <= setIdx) {
        exLog.push({ actualReps: 0, actualWeight: '', actualTime: '', completed: false });
      }
      exLog[setIdx] = { ...exLog[setIdx], [field]: value, loggedBy };
      const nextLog = { ...prev, [exId]: exLog };
      const exObj = activeBlueprintExercises.find(e => e.id === exId);
      if (exObj) {
        nextLog[exObj.exerciseName] = exLog;
      }
      updateDiagState({ executionLog: nextLog });
      return nextLog;
    });
  };

  const handleConfirmEndSession = () => {
    if (!dbConn) return;
    const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    // Format execution log for DB
    let executedExercises = activeBlueprintExercises.map(ex => {
      const setsData = executionLog[ex.id] || executionLog[ex.exerciseName] || [];
      return {
        exerciseName: ex.exerciseName,
        isStaticHold: ex.isStaticHold,
        sets: ex.sets, // planned sets
        reps: ex.reps, // planned reps/time
        weight: ex.weight, // planned weight
        actualSets: setsData
      };
    });

    if (executedExercises.length === 0 && diagState.assignedExercise) {
      const exName = diagState.assignedExercise.name;
      const setsData = executionLog[diagState.assignedExercise.id] || executionLog[exName] || [];
      executedExercises = [{
        exerciseName: exName,
        isStaticHold: detectIsStaticHold(exName),
        sets: Math.max(3, setsData.length),
        reps: detectIsStaticHold(exName) ? 30 : 10,
        weight: 'Bodyweight',
        actualSets: setsData
      }];
    }

    const completedExercisesJson = JSON.stringify(executedExercises);

    dbConn.reducers.endSession({
      roomId: roomState.roomId,
      notes: notesInput.trim() || 'Client completed session protocol.',
      timestamp: timestamp,
      completedExercisesJson: completedExercisesJson,
    });
    setIsEndingSession(false);
    navigate('/pt');
  };

  const mobileUrl = `${window.location.origin}/client/${roomState.roomToken}`;

  const handleCopyBannerLink = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopiedBanner(true);
    setTimeout(() => setCopiedBanner(false), 2000);
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
      {/* Mobile Testing Network Banner */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-indigo-500/20 bg-indigo-950/20">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/30 text-indigo-400">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Client Link (WhatsApp / Chat)</p>
            <p className="text-sm font-mono text-slate-200 mt-0.5">
              Share link: <span className="text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-emerald-500/30 break-all">{mobileUrl}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleCopyBannerLink}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-lg ${
            copiedBanner
              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
          }`}
        >
          {copiedBanner ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient Clinical History Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <h2 className="font-semibold text-slate-200 text-sm">Patient Clinical History</h2>
              </div>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Pre-Loaded</span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">{roomState.expectedClientName}</h3>
              <p className="text-xs text-slate-400">Target: Squat Rehab</p>
            </div>

            {/* Display Past Notes if available */}
            {roomState.lastSessionNotes && (
              <div className="bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-500/30 text-xs">
                <span className="text-indigo-300 font-bold block mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Previous Session Notes ({roomState.lastSessionTimestamp}):
                </span>
                <p className="text-slate-200 italic">{roomState.lastSessionNotes}</p>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium block mb-1">🏥 Clinical History:</span>
                <p className="text-slate-200">Needs monitoring for biomechanics during squat variations.</p>
              </div>
            </div>
            
            <button onClick={() => navigate('/pt')} className="mt-4 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm text-center">
              &larr; Back to Dashboard
            </button>
          </div>
        </div>

        {/* Right Column (2 cols): PT Live Supervisor Console OR End Session Form */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* PT Navigation Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('console')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'console' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Live Console</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Session History</span>
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'planner' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Session Planner</span>
            </button>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-6">
            
            {activeTab === 'planner' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-indigo-400" />
                      Client Session Planner
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Manage and generate blueprints for {roomState.expectedClientName}.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        const newManualBp: BlueprintData = {
                          blueprintId: 'new-manual-' + Date.now(),
                          roomId: roomState.roomId,
                          name: 'Custom Session Plan',
                          targetGoal: 'Targeted Movement Training',
                          isActiveDayPlan: true
                        };
                        setEditingBlueprint(newManualBp);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-lg text-sm font-bold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4 text-indigo-400" />
                      Create Manual Plan
                    </button>
                    <button 
                      onClick={() => setIsAIPlannerOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      Create AI Blueprint
                    </button>
                  </div>
                </div>

                <div className="grid gap-4">
                  {blueprints.filter(b => b.roomId === roomState.roomId && b.name !== '__DIAGNOSTIC_STATE__').length === 0 ? (
                    <div className="text-center py-10 border border-slate-800 border-dashed rounded-xl bg-slate-900/50">
                      <ClipboardList className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">No blueprints saved for this client yet.</p>
                      <p className="text-xs text-slate-500 mt-1">Create a plan manually or use the AI Planner to generate one.</p>
                    </div>
                  ) : (
                    blueprints.filter(b => b.roomId === roomState.roomId && b.name !== '__DIAGNOSTIC_STATE__').map(bp => {
                      const exCount = blueprintExercises.filter(e => e.blueprintId === bp.blueprintId).length;
                      return (
                        <div key={bp.blueprintId} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 flex justify-between items-center group">
                          <div>
                            <h3 className="text-white font-bold text-sm flex items-center gap-2">
                              {bp.name}
                              {bp.isActiveDayPlan && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider">Active Day Plan</span>}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">Goal: {bp.targetGoal}</p>
                            <p className="text-xs text-indigo-300 mt-1">{exCount} exercises</p>
                          </div>
                          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setEditingBlueprint(bp)}
                              className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg border border-slate-600"
                            >
                              Edit Exercises
                            </button>
                            {!bp.isActiveDayPlan && (
                              <button 
                                onClick={() => handleSetActivePlan(bp)}
                                className="text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30"
                              >
                                Set as Active Plan
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* The AI Planner Modal Component */}
                <AIPlannerModal 
                  isOpen={isAIPlannerOpen} 
                  onClose={() => setIsAIPlannerOpen(false)} 
                  roomId={roomState.roomId}
                  dbConn={dbConn}
                />

                {/* Blueprint Editor Modal */}
                <BlueprintEditorModal
                  isOpen={!!editingBlueprint}
                  onClose={() => setEditingBlueprint(null)}
                  blueprint={editingBlueprint}
                  exercises={editingBlueprint ? blueprintExercises.filter(e => e.blueprintId === editingBlueprint.blueprintId) : []}
                  exerciseDictionary={exerciseDictionary}
                  dbConn={dbConn}
                />
              </div>
            )}

            {activeTab === 'console' && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  PT Supervisor Room Console
                </h2>
                <p className="text-xs text-slate-400">Room: <span className="font-mono text-indigo-300">{roomState.roomId}</span> • Clinician: {roomState.ptName}</p>
              </div>

              {!isEndingSession && (
                  <button
                    onClick={() => setIsEndingSession(true)}
                    className="flex items-center space-x-1.5 text-xs bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 px-3.5 py-2 rounded-xl font-bold transition-all shadow-md shadow-rose-950/50 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>End Session</span>
                  </button>
              )}
            </div>

            {/* End Session Summary Form */}
            {isEndingSession ? (
              <div className="bg-slate-900/90 p-6 rounded-2xl border border-indigo-500/40 flex flex-col gap-5">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-indigo-400" />
                      Session Summary & Clinical Logging
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Client: <span className="text-slate-200 font-bold">{roomState.expectedClientName}</span> • Date & Time: <span className="text-indigo-300 font-mono">{new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </p>
                  </div>
                </div>

                {/* Exercises & Interventions Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <h4 className="font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      Exercises Completed
                    </h4>
                    <ul className="space-y-1.5 text-slate-300">
                      {activeBlueprintExercises.length > 0 ? activeBlueprintExercises.map(ex => {
                        const completedCount = (executionLog[ex.id] || []).filter(s => s.completed).length;
                        if (completedCount === 0) return null;
                        return (
                          <li key={ex.id}>• {ex.exerciseName} ({completedCount} sets completed)</li>
                        );
                      }) : (
                        <li>• No blueprint exercises logged.</li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <h4 className="font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Interventions Applied
                    </h4>
                    <ul className="space-y-1.5 text-slate-300">
                      <li>• 3-Point Foot Contact Cueing</li>
                      <li>• Ankle Mobility Warm-up</li>
                      <li>• 3D Muscle Engagement Map (Quads & Glutes)</li>
                    </ul>
                  </div>
                </div>

                {/* Personal Notes Textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    PT Personal Notes & Recommendations for Next Session
                  </label>
                  <textarea
                    rows={3}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="e.g. Client showed improved knee tracking after foot contact cue. Recommend 2x daily glute bridges."
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-3 text-white placeholder-slate-500 text-sm outline-none transition-all"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    onClick={() => setIsEndingSession(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmEndSession}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-5 rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Summary & Complete Session</span>
                  </button>
                </div>
              </div>
            ) : roomState.clientStatus === 'WAITING_APPROVAL' ? (
              <div className="bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-transparent p-6 rounded-2xl border border-amber-500/40 animate-pulse-subtle flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-amber-500 p-3 rounded-xl text-slate-950 font-bold shadow-lg shadow-amber-500/30">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs uppercase font-bold tracking-wider text-amber-400">Entry Request Pending</span>
                      <h3 className="text-xl font-extrabold text-white">{roomState.submittedClientName} is requesting room entry</h3>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={() => handleApprove(true)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <Check className="w-5 h-5" />
                    <span>Approve Entry to Live Room</span>
                  </button>
                  <button
                    onClick={() => handleApprove(false)}
                    className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all"
                  >
                    <UserX className="w-5 h-5" />
                    <span>Deny</span>
                  </button>
                </div>
              </div>
            ) : roomState.clientStatus === 'CONNECTED' ? (
              <div className="bg-emerald-950/30 p-6 rounded-2xl border border-emerald-500/30 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Live Session Active</span>
                      <h3 className="text-xl font-bold text-white">Patient {roomState.submittedClientName} Connected</h3>
                    </div>
                  </div>
                </div>

                {/* ─── EXERCISE ASSIGNMENT STATUS ─── */}
                {!diagState.assignedExercise || isExercisePickerOpen ? (
                  <div className="border-2 border-indigo-500/50 bg-indigo-950/40 rounded-xl p-4 flex flex-col gap-3 shadow-lg shadow-indigo-950/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/30 text-indigo-400">
                          <Dumbbell className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                              {diagState.assignedExercise ? 'Switch Exercise' : 'Action Required'}
                            </span>
                            <span className="text-xs text-amber-300 font-medium">
                              {diagState.assignedExercise ? 'Patient connected' : 'Patient waiting on screen'}
                            </span>
                          </div>
                          <h4 className="text-white font-bold text-base mt-0.5">Select & Assign Starter Exercise</h4>
                        </div>
                      </div>
                      {diagState.assignedExercise && (
                        <button
                          onClick={() => setIsExercisePickerOpen(false)}
                          className="text-xs text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-indigo-500/20">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-slate-300 font-bold uppercase tracking-wider block mb-1.5">
                          Choose Starter Movement ({starterExercises.length} available):
                        </label>
                        <select
                          value={selectedStarterExId}
                          onChange={e => setSelectedStarterExId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-2.5 outline-none focus:border-indigo-500"
                        >
                          {starterExercises.map(ex => (
                            <option key={ex.id} value={ex.id}>
                              {ex.name} — {ex.category} ({ex.commonIssues.length} failure cues)
                            </option>
                          ))}
                        </select>
                        {(() => {
                          const ex = starterExercises.find(e => e.id === selectedStarterExId) || starterExercises[0];
                          return (
                            <p className="text-[11px] text-slate-400 mt-1.5">
                              <span className="text-indigo-300 font-semibold">Muscles:</span> {ex.musclesTargeted}
                            </p>
                          );
                        })()}
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            const ex = starterExercises.find(e => e.id === selectedStarterExId) || starterExercises[0];
                            handleAssignExercise(ex);
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all h-[38px]"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Assign to Patient</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-emerald-500/40 bg-emerald-950/20 rounded-xl p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400 border border-emerald-500/30">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Active On Patient Screen</span>
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">Live</span>
                          <span className="text-[10px] text-slate-400">({diagState.assignedExercise.category})</span>
                        </div>
                        <h4 className="text-white font-bold text-sm">{diagState.assignedExercise.name}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsExercisePickerOpen(true)}
                        className="text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-all flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Switch Exercise</span>
                      </button>
                      <button
                        onClick={() => handleAssignExercise(diagState.assignedExercise!)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-all shrink-0"
                      >
                        Re-push
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── LIVE PATIENT FLAGGED ISSUE BANNER ─── */}
                {diagState.issueText && (
                  <div className="bg-amber-950/50 border-2 border-amber-500/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                          {diagState.loggedBy === 'CLIENT' ? '🚨 Live Issue Flagged by Patient' : 'Observed Issue'}
                        </span>
                        <span className="text-xs text-amber-300 font-mono">Real-time Sync</span>
                      </div>
                      <p className="text-white font-bold text-sm italic">"{diagState.issueText}"</p>
                      {diagState.status === 'needs_pt_analysis' && (
                        <p className="text-xs text-amber-200/90">The patient entered this manual issue on their screen. Click to generate AI diagnosis.</p>
                      )}
                    </div>
                    {diagState.status === 'needs_pt_analysis' && (
                      <button
                        onClick={() => handleLogIssue(diagState.issueText, 'CLIENT')}
                        className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 shrink-0 transition-all"
                      >
                        <Brain className="w-4 h-4" />
                        <span>Analyze with AI</span>
                      </button>
                    )}
                  </div>
                )}

                {/* ─── AI DIAGNOSTIC PANEL ─── */}
                <div className="border border-indigo-500/30 bg-indigo-950/30 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-white font-bold text-sm">AI Diagnostic Console</h4>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">WikiGem Engine</span>
                  </div>

                  {diagState.status === 'idle' && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-400">Log an issue observed during the session. The AI will analyze it and suggest diagnostic steps.</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ptIssueInput}
                          onChange={e => setPtIssueInput(e.target.value)}
                          placeholder="e.g. Client cannot reach depth, heels lifting..."
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-indigo-500 outline-none"
                          onKeyDown={e => e.key === 'Enter' && handleLogIssue(ptIssueInput, 'PT')}
                        />
                        <button
                          onClick={() => handleLogIssue(ptIssueInput, 'PT')}
                          disabled={!ptIssueInput.trim()}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Brain className="w-3.5 h-3.5" />
                          Analyze
                        </button>
                      </div>
                    </div>
                  )}

                  {diagState.status === 'analyzing' && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <div>
                        <p className="text-indigo-300 text-sm font-bold">WikiGem AI analyzing biomechanics...</p>
                        <p className="text-xs text-slate-400">Cross-referencing diagnostic tree for: "{diagState.issueText}"</p>
                      </div>
                    </div>
                  )}

                  {diagState.status === 'awaiting_pt_approval' && diagState.analysis && (
                    <div className="space-y-3">
                      <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-700">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Issue Reported</p>
                        <p className="text-slate-200 text-sm italic">"{diagState.issueText}"</p>
                      </div>
                      <div className="bg-slate-900/80 rounded-lg p-3 border border-amber-500/30">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs text-amber-400 uppercase tracking-wider font-bold">AI Potential Cause</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ diagState.analysis.confidence === 'High' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400' }`}>{diagState.analysis.confidence} Confidence</span>
                        </div>
                        <p className="text-slate-200 text-xs leading-relaxed">{diagState.analysis.potentialCause}</p>
                        {diagState.analysis.dbExercisesReferenced && diagState.analysis.dbExercisesReferenced.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-700/60">
                            <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-400" /> Grounded in DB:
                            </span>
                            {diagState.analysis.dbExercisesReferenced.map((exName: string, idx: number) => (
                              <span key={idx} className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                                {exName}
                              </span>
                            ))}
                          </div>
                        )}
                        {diagState.analysis.outOfScope && (
                          <p className="text-xs text-indigo-300 mt-2 italic">📡 {diagState.analysis.outOfScope}</p>
                        )}
                      </div>

                      {/* ─── PT DIAGNOSTIC ACTION & VIDEO SELECTION ─── */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Select Diagnostic Action & Preview Videos:
                          </p>
                          <span className="text-[10px] text-indigo-400 font-medium">PT Review Mode</span>
                        </div>

                        {/* List of Diagnostic Options */}
                        <div className="space-y-2">
                          {diagState.analysis.ptOptions?.map((opt: DiagnosticOption) => {
                            const isSelected = previewingOption?.id === opt.id;
                            return (
                              <div
                                key={opt.id}
                                onClick={() => {
                                  setPreviewingOption(opt);
                                  if (opt.candidateVideos && opt.candidateVideos.length > 0) {
                                    setSelectedCandidateVideo(opt.candidateVideos[0]);
                                  }
                                }}
                                className={`cursor-pointer w-full text-left rounded-xl p-3.5 transition-all border ${
                                  isSelected
                                    ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-950/50'
                                    : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-700'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-white font-bold text-xs flex items-center gap-2">
                                    <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400 rotate-90' : 'text-slate-500'} transition-transform`} />
                                    {opt.label}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {opt.candidateVideos && opt.candidateVideos.length > 0 && (
                                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Video className="w-3 h-3" /> {opt.candidateVideos.length} Videos
                                      </span>
                                    )}
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                      {isSelected ? 'Previewing' : 'Inspect'}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-slate-400 text-xs mt-1.5 ml-5 leading-relaxed">{opt.instruction}</p>
                              </div>
                            );
                          })}
                        </div>

                        {/* ─── VIDEO CANDIDATE PREVIEW & SELECTION CARD ─── */}
                        {previewingOption && (
                          <div className="bg-slate-900 border-2 border-indigo-500/60 rounded-xl p-4 space-y-3.5 mt-3 shadow-xl">
                            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2.5">
                              <div>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 flex items-center gap-1.5">
                                  <Eye className="w-3.5 h-3.5" /> PT Video Preview & Selection
                                </span>
                                <h5 className="text-white font-bold text-sm mt-0.5">{previewingOption.label}</h5>
                              </div>
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                                Form Demo
                              </span>
                            </div>

                            {/* Candidate Video Selector Tabs */}
                            {previewingOption.candidateVideos && previewingOption.candidateVideos.length > 0 ? (
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-slate-300 font-bold mb-1.5">Select from Top YouTube Shorts / Demos:</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {previewingOption.candidateVideos.map((vid, vIdx) => {
                                      const isVidSelected = selectedCandidateVideo?.id === vid.id;
                                      return (
                                        <button
                                          key={vid.id || vIdx}
                                          onClick={() => setSelectedCandidateVideo(vid)}
                                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 border ${
                                            isVidSelected
                                              ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30'
                                              : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                                          }`}
                                        >
                                          <PlayCircle className="w-3.5 h-3.5 text-indigo-300" />
                                          <span>Video {vIdx + 1}: {vid.creator}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Active Preview Player */}
                                {selectedCandidateVideo && (
                                  <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-white font-bold">{selectedCandidateVideo.title}</span>
                                      <span className="text-indigo-400 font-mono text-[10px] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                        By {selectedCandidateVideo.creator}
                                      </span>
                                    </div>
                                    <div className="rounded-xl overflow-hidden border border-slate-700 aspect-video bg-black shadow-inner">
                                      <iframe
                                        src={selectedCandidateVideo.embedUrl}
                                        title={selectedCandidateVideo.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full"
                                      />
                                    </div>
                                    <p className="text-[11px] text-slate-400 italic">
                                      💡 <span className="font-semibold text-slate-300">Why AI Picked:</span> {selectedCandidateVideo.whyRecommended}
                                    </p>
                                  </div>
                                )}

                                {/* Approval Action Buttons */}
                                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-800">
                                  <button
                                    onClick={() => handleApproveOption(previewingOption, selectedCandidateVideo)}
                                    className="w-full sm:flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                                  >
                                    <Check className="w-4 h-4" />
                                    <span>Approve & Deploy Video to Patient</span>
                                  </button>

                                  <button
                                    onClick={() => handleApproveOption(previewingOption, null)}
                                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 px-3 rounded-xl text-xs font-medium border border-slate-700 transition-all"
                                  >
                                    Deploy Text Only (Skip Video)
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <p className="text-xs text-slate-400">No video attached for this drill.</p>
                                <button
                                  onClick={() => handleApproveOption(previewingOption, null)}
                                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>Approve Diagnostic Test</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <button onClick={() => updateDiagState({ status: 'idle', issueText: '' })} className="text-xs text-slate-500 hover:text-slate-300">← Start Over</button>
                    </div>
                  )}

                  {diagState.status === 'awaiting_client_result' && diagState.approvedOption && (
                    <div className="space-y-3">
                      <div className="bg-emerald-900/30 border border-emerald-500/40 rounded-lg p-3">
                        <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">✅ Sent to Client</p>
                        <p className="text-white text-sm font-bold">{diagState.approvedOption.label}</p>
                        <p className="text-slate-400 text-xs mt-1">{diagState.approvedOption.instruction}</p>
                      </div>
                      <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-3 animate-pulse">
                        <p className="text-xs text-slate-400">⏳ Waiting for client to complete the test and log their result...</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400 font-bold">Or log client result yourself:</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={diagState.clientResult}
                            onChange={e => updateDiagState({ clientResult: e.target.value })}
                            placeholder="e.g. Depth significantly improved with heel elevation"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
                          />
                          <button
                            onClick={handleAutoLog}
                            disabled={!diagState.clientResult.trim()}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Auto-Log
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {diagState.status === 'auto_logging' && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-emerald-300 text-sm font-bold">AI generating clinical log & updating blueprint...</p>
                    </div>
                  )}

                  {diagState.status === 'complete' && diagState.autoLogResult && (
                    <div className="space-y-3">
                      <div className="bg-emerald-900/30 border border-emerald-500/40 rounded-lg p-3">
                        <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">✅ AI Diagnostic Complete</p>
                        <p className="text-white font-bold text-sm">{diagState.autoLogResult.conclusion}</p>
                        <p className="text-slate-300 text-xs mt-2 leading-relaxed">{diagState.autoLogResult.patientLogNote}</p>
                      </div>
                      <div className="bg-indigo-900/30 border border-indigo-500/40 rounded-lg p-3">
                        <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-1">🔄 Blueprint Auto-Updated</p>
                        <p className="text-slate-200 text-xs">Added <span className="text-white font-bold">{diagState.autoLogResult.suggestedExercise}</span> ({diagState.autoLogResult.suggestedExerciseSets} sets × {diagState.autoLogResult.suggestedExerciseReps}s) to the active plan.</p>
                      </div>
                      <button onClick={() => updateDiagState({ status: 'idle', issueText: '', analysis: null, approvedOption: null, clientResult: '', autoLogResult: null })} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold">+ Log Another Issue</button>
                    </div>
                  )}
                </div>

                <div className="mt-2 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                    <h4 className="text-white font-bold text-sm">
                      {activeBlueprint ? `Execution Tracker: ${activeBlueprint.name}` : 'No Active Plan'}
                    </h4>
                    {activeBlueprint && (
                      <button
                        onClick={() => setEditingBlueprint(activeBlueprint)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Edit / Add Exercises</span>
                      </button>
                    )}
                  </div>

                  {activeBlueprintExercises.length > 0 ? (
                    activeBlueprintExercises.map((ex, idx) => {
                      const setsData = executionLog[ex.id] || [];
                      const isCurrent = diagState.assignedExercise?.name?.toLowerCase() === ex.exerciseName.toLowerCase();
                      return (
                        <div key={ex.id} className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${isCurrent ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/30 shadow-md' : 'bg-slate-900/80 border-slate-800'}`}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 font-mono">#{idx + 1}</span>
                                <span className="text-white font-bold text-sm">{ex.exerciseName}</span>
                              </div>
                              <span className="text-slate-400 text-xs mt-0.5 block">
                                Target: {ex.sets} sets × {ex.reps} {ex.isStaticHold ? 'sec hold' : 'reps'} @ {ex.weight}
                              </span>
                            </div>

                            <div>
                              {isCurrent ? (
                                <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                  <span>Active on Client Screen</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleSelectActiveBlueprintExercise(ex)}
                                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer"
                                  title="Push video and movement guide for this exercise to the client's screen"
                                >
                                  <PlayCircle className="w-3.5 h-3.5" />
                                  <span>Select & Push to Client</span>
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {Array.from({ length: ex.sets }).map((_, setIdx) => {
                              const setLog = setsData[setIdx] || { actualReps: ex.isStaticHold ? 0 : ex.reps, actualWeight: ex.weight || 'BW', actualTime: ex.isStaticHold ? String(ex.reps) : '', completed: false };
                              return (
                                <div key={setIdx} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all flex-wrap ${setLog.completed ? 'bg-emerald-950/30 border-emerald-700/50' : 'bg-slate-950 border border-slate-800'}`}>
                                  <label className="flex items-center gap-2 cursor-pointer w-20">
                                    <input 
                                      type="checkbox" 
                                      checked={setLog.completed}
                                      onChange={(e) => updateExecutionSet(ex.id, setIdx, 'completed', e.target.checked, 'PT')}
                                      className="rounded bg-slate-900 border-slate-700 text-emerald-500 w-4 h-4 cursor-pointer"
                                    />
                                    <span className="text-xs font-bold text-slate-200">Set {setIdx + 1}</span>
                                  </label>
                                  
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">{ex.isStaticHold ? 'Sec:' : 'Reps:'}</span>
                                    <input 
                                      type="number"
                                      placeholder={ex.isStaticHold ? `${ex.reps}s` : `${ex.reps}`}
                                      value={ex.isStaticHold ? setLog.actualTime : setLog.actualReps}
                                      onChange={(e) => updateExecutionSet(ex.id, setIdx, ex.isStaticHold ? 'actualTime' : 'actualReps', e.target.value, 'PT')}
                                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-white text-xs font-bold focus:border-indigo-500 outline-none"
                                    />
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Weight:</span>
                                    <input 
                                      type="text"
                                      placeholder={ex.weight || "BW"}
                                      value={setLog.actualWeight}
                                      onChange={(e) => updateExecutionSet(ex.id, setIdx, 'actualWeight', e.target.value, 'PT')}
                                      className="w-24 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs font-bold focus:border-indigo-500 outline-none"
                                    />
                                  </div>

                                  {setLog.loggedBy && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ml-auto ${
                                      setLog.loggedBy === 'CLIENT' 
                                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' 
                                        : 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                                    }`}>
                                      {setLog.loggedBy === 'CLIENT' ? 'Patient Logged ✓' : 'PT Logged'}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-slate-400 text-xs py-4 text-center border border-slate-800 border-dashed rounded-lg bg-slate-900/40">
                      No blueprint assigned. Go to the Session Planner tab to set an Active Day Plan or create one manually.
                    </div>
                  )}
                </div>
              </div>
            ) : roomState.clientStatus === 'DENIED' ? (
              <div className="bg-rose-950/20 p-6 rounded-2xl border border-rose-500/30 flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 text-rose-400" />
                <div>
                  <h3 className="text-base font-bold text-rose-300">Client Entry Denied</h3>
                  <p className="text-xs text-slate-400">Submitted name did not match or entry was declined by PT.</p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-800 text-center flex flex-col items-center gap-3">
                <Clock className="w-8 h-8 text-slate-500 animate-spin" />
                <h3 className="text-base font-medium text-slate-300">Waiting for Client to Enter Room</h3>
              </div>
            )}
              </>
            )}
            

            {activeTab === 'history' && (
              <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-400" />
                      Patient Session History
                    </h2>
                    <p className="text-xs text-slate-400">Past performance logs and exercise data</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {sessionHistory
                    .filter(h => h.roomId === roomState.roomId)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((session) => {
                      let exercises: any[] = [];
                      try {
                        exercises = JSON.parse(session.completedExercisesJson || "[]");
                      } catch (e) {
                        console.error("Failed to parse exercises", e);
                      }

                      return (
                        <div key={session.logId} className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 flex flex-col gap-3">
                          <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
                            <span className="text-indigo-300 font-bold flex items-center gap-1.5 text-sm">
                              <Calendar className="w-4 h-4 text-indigo-400" />
                              {session.timestamp}
                            </span>
                          </div>
                          
                          {session.notes && (
                            <div className="text-sm">
                              <span className="text-slate-400 font-bold block mb-1">Clinician Notes:</span>
                              <p className="text-slate-200">{session.notes}</p>
                            </div>
                          )}

                          {exercises.length > 0 && (
                            <div className="mt-2">
                              <span className="text-slate-400 font-bold block mb-2 text-sm">Completed Exercises:</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {exercises.map((ex, exIdx) => (
                                  <div key={exIdx} className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1.5">
                                    <div className="flex justify-between font-bold text-slate-200 text-xs">
                                      <span>{exIdx + 1}. {ex.exerciseName}</span>
                                      <span className="text-indigo-400">{ex.sets}x{ex.reps} {ex.isStaticHold ? '(Hold)' : ''}</span>
                                    </div>
                                    {ex.weight && ex.weight !== 'BW' && (
                                      <p className="text-slate-400 text-[10px]">Target Weight: {ex.weight}</p>
                                    )}
                                    {ex.actualSets && ex.actualSets.length > 0 && (
                                      <div className="pt-1 flex flex-wrap gap-1.5">
                                        {ex.actualSets.map((s: any, sIdx: number) => (
                                          <span key={sIdx} className={`text-[10px] px-2 py-0.5 rounded border font-mono ${s.completed ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                                            Set {sIdx + 1}: {ex.isStaticHold ? `${s.actualTime || s.actualReps}s` : `${s.actualReps} reps`} @ {s.actualWeight || 'BW'} {s.completed ? '✓' : ''}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {sessionHistory.filter(h => h.roomId === roomState.roomId).length === 0 && (
                    <div className="text-center py-10 text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800 border-dashed">
                      <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No historical sessions found for this patient.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Client Exercise View Sub-Component (for CONNECTED state)
// -------------------------------------------------------------
function ClientExerciseView({ 
  roomState, 
  dbConn, 
  blueprints,
  blueprintExercises,
  exerciseDictionary: _exerciseDictionary
}: { 
  roomState: RoomData, 
  dbConn: DbConnection | null, 
  blueprints: BlueprintData[],
  blueprintExercises: BlueprintExerciseData[],
  exerciseDictionary: ExerciseDictionaryData[]
}) {
  const [issueInput, setIssueInput] = useState('');
  const [submittedIssue, setSubmittedIssue] = useState('');
  const [clientResult, setClientResult] = useState('');
  const [resultSubmitted, setResultSubmitted] = useState(false);

  // Sync diagnostic state from SpaceTimeDB blueprint broadcast (external PC support)
  const diagBlueprint = blueprints.find(b => b.roomId === roomState.roomId && b.name === '__DIAGNOSTIC_STATE__');
  const [clientDiagState, setClientDiagState] = useState<DiagnosticState | null>(null);

  const activeBlueprint = blueprints.find(b => b.roomId === roomState.roomId && b.isActiveDayPlan && b.name !== '__DIAGNOSTIC_STATE__');
  const planExercises = activeBlueprint 
    ? blueprintExercises.filter(e => e.blueprintId === activeBlueprint.blueprintId).sort((a,b) => a.orderIndex - b.orderIndex) 
    : [];

  useEffect(() => {
    if (diagBlueprint?.targetGoal) {
      try {
        const parsed = JSON.parse(diagBlueprint.targetGoal) as DiagnosticState;
        setClientDiagState(parsed);
        if (parsed.issueText) setSubmittedIssue(parsed.issueText);
      } catch {}
    }
  }, [diagBlueprint?.targetGoal]);

  const syncDiagState = (updated: Partial<DiagnosticState>) => {
    const next = { ...(clientDiagState || {}), ...updated } as DiagnosticState;
    setClientDiagState(next);
    try { sessionStorage.setItem(DIAG_STATE_KEY + '_' + roomState.roomId, JSON.stringify(next)); } catch {}
    if (dbConn) {
      dbConn.reducers.saveBlueprint({
        blueprintId: 'diag-' + roomState.roomId,
        roomId: roomState.roomId,
        name: '__DIAGNOSTIC_STATE__',
        targetGoal: JSON.stringify(next),
        isActiveDayPlan: false,
        exercisesJson: '[]'
      });
    }
  };

  const handleClientLogIssue = (text: string) => {
    setSubmittedIssue(text);
    syncDiagState({ issueText: text, loggedBy: 'CLIENT', status: 'needs_pt_analysis', approvedOption: null, clientResult: '', autoLogResult: null });
  };

  const handleClientSubmitResult = () => {
    if (!clientResult.trim()) return;
    setResultSubmitted(true);
    syncDiagState({ clientResult, status: 'client_result_submitted' });
  };

  const currentExercise = clientDiagState?.assignedExercise;
  const currentPlanExIndex = currentExercise 
    ? planExercises.findIndex(e => e.exerciseName.toLowerCase() === currentExercise.name.toLowerCase()) 
    : -1;

  const activePlanEx = currentPlanExIndex >= 0 ? planExercises[currentPlanExIndex] : null;
  const activeExId = activePlanEx?.id || currentExercise?.id || 'active-ex';
  const targetSets = activePlanEx?.sets || 3;
  const targetReps = activePlanEx?.reps || 10;
  const targetWeight = activePlanEx?.weight || 'Bodyweight';
  const isStaticHold = activePlanEx?.isStaticHold ?? (currentExercise ? detectIsStaticHold(currentExercise.name) : false);

  const clientExecutionLog: Record<string, SetExecutionLog[]> = clientDiagState?.executionLog || {};
  const setsData = clientExecutionLog[activeExId] || (activePlanEx ? clientExecutionLog[activePlanEx.exerciseName] : []) || [];

  const updateClientExecutionSet = (setIdx: number, field: string, value: any) => {
    const currentLog = setsData.length > 0 ? [...setsData] : [];
    while (currentLog.length <= setIdx) {
      currentLog.push({ 
        actualReps: isStaticHold ? 0 : targetReps, 
        actualWeight: targetWeight, 
        actualTime: isStaticHold ? String(targetReps) : '', 
        completed: false 
      });
    }
    currentLog[setIdx] = { ...currentLog[setIdx], [field]: value, loggedBy: 'CLIENT' };
    const nextLog = { ...clientExecutionLog, [activeExId]: currentLog };
    if (activePlanEx?.exerciseName) {
      nextLog[activePlanEx.exerciseName] = currentLog;
    }
    syncDiagState({ executionLog: nextLog });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Session Active Banner */}
      <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl flex items-center gap-3">
        <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400 border border-emerald-500/30">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Live Session Active</span>
          <p className="text-xs text-slate-300">Connected with {roomState.ptName}</p>
        </div>
      </div>

      {/* Session Plan Progress Header (Stepper) - shows session progress across exercises */}
      {activeBlueprint && planExercises.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">{activeBlueprint.name}</span>
            </div>
            <span className="text-[11px] text-indigo-300 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              {currentPlanExIndex >= 0 ? `Exercise ${currentPlanExIndex + 1} of ${planExercises.length}` : `${planExercises.length} Total Exercises`}
            </span>
          </div>

          {/* Compact exercise chips showing status */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {planExercises.map((pEx, idx) => {
              const isActive = currentPlanExIndex === idx;
              const isDone = currentPlanExIndex > idx;
              return (
                <div 
                  key={pEx.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all border shrink-0 ${
                    isActive 
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold ring-1 ring-indigo-500 shadow-sm' 
                      : isDone 
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400' 
                        : 'bg-slate-950/80 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-indigo-500 text-white' : isDone ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isDone ? '✓' : idx + 1}
                  </span>
                  <span>{pEx.exerciseName}</span>
                  {isActive && (
                    <span className="text-[9px] bg-indigo-400/20 text-indigo-300 px-1 rounded uppercase tracking-wider font-semibold">
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── CASE A: PT HAS NOT YET ASSIGNED EXERCISE ─── */}
      {!currentExercise ? (
        <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto text-indigo-400 border border-indigo-500/30 animate-pulse">
            <Dumbbell className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-white font-bold text-lg">Waiting for Exercise Assignment</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
              Your physiotherapist, <span className="text-white font-semibold">{roomState.ptName}</span>, is setting up your exercise. Once assigned, your movement guide will appear here immediately.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700 text-xs text-slate-300">
            <Clock className="w-4 h-4 text-amber-400 animate-spin" />
            <span>Standing by for PT...</span>
          </div>
        </div>
      ) : (
        /* ─── CASE B: EXERCISE ASSIGNED BY PT ─── */
        <>
          {/* Exercise: Video */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-base">Assigned Exercise: {currentExercise.name}</h3>
              <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                PT Prescribed
              </span>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-700 aspect-video">
              <iframe
                src={currentExercise.videoUrl}
                title="Exercise Form Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <p className="text-xs text-slate-400">Watch the full video to learn proper form before starting.</p>
          </div>

          {/* Muscles + Common Issues */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider">Muscles Targeted</h4>
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                <img src={currentExercise.imageUrl} alt="Muscles worked in exercise" className="w-full object-contain" />
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider">Common Issues (Tap to Flag)</h4>
              <div className="space-y-1.5">
                {currentExercise.commonIssues.map(issue => (
                  <button
                    key={issue.id}
                    onClick={() => { setSubmittedIssue(''); handleClientLogIssue(issue.title); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${
                      submittedIssue === issue.title
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-slate-900 border-slate-700 hover:border-amber-500/40 text-slate-300 hover:text-amber-300'
                    }`}
                  >
                    <span>{issue.icon}</span>
                    <span className="leading-tight">{issue.title}</span>
                    {submittedIssue === issue.title && <span className="ml-auto text-amber-400 shrink-0">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── LIVE SET & REP LOGGER (PATIENT & PT SYNCED) ─── */}
          <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-indigo-400" />
                <h4 className="text-white font-bold text-xs uppercase tracking-wider">
                  Log Your Sets & Weight
                </h4>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Syncing Live with PT
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Target Prescription: <span className="text-indigo-300 font-semibold">{targetSets} sets × {targetReps} {isStaticHold ? 'sec hold' : 'reps'} @ {targetWeight}</span>
            </p>

            <div className="space-y-2.5">
              {Array.from({ length: targetSets }).map((_, setIdx) => {
                const setLog = setsData[setIdx] || { 
                  actualReps: isStaticHold ? 0 : targetReps, 
                  actualWeight: targetWeight, 
                  actualTime: isStaticHold ? String(targetReps) : '', 
                  completed: false,
                  loggedBy: undefined
                };

                return (
                  <div 
                    key={setIdx} 
                    className={`p-3 rounded-xl border transition-all flex flex-col gap-2.5 ${
                      setLog.completed 
                        ? 'bg-emerald-950/30 border-emerald-500/40 ring-1 ring-emerald-500/20' 
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          setLog.completed ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {setLog.completed ? '✓' : setIdx + 1}
                        </span>
                        <span className="text-xs font-bold text-white">Set {setIdx + 1}</span>
                        {setLog.loggedBy && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 border border-slate-700">
                            Logged by {setLog.loggedBy === 'CLIENT' ? 'You' : 'PT'}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => updateClientExecutionSet(setIdx, 'completed', !setLog.completed)}
                        className={`text-xs px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                          setLog.completed 
                            ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{setLog.completed ? 'Completed' : 'Mark Done'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {/* Actual Reps or Hold Time */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block">
                          {isStaticHold ? 'Time Held (Sec)' : 'Actual Reps'}
                        </label>
                        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => {
                              const currentVal = Number(isStaticHold ? setLog.actualTime : setLog.actualReps) || 0;
                              const newVal = Math.max(0, currentVal - 1);
                              updateClientExecutionSet(setIdx, isStaticHold ? 'actualTime' : 'actualReps', newVal);
                            }}
                            className="px-2.5 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={isStaticHold ? (setLog.actualTime ?? targetReps) : (setLog.actualReps ?? targetReps)}
                            onChange={(e) => updateClientExecutionSet(setIdx, isStaticHold ? 'actualTime' : 'actualReps', e.target.value)}
                            className="w-full bg-transparent text-center text-white text-xs font-bold focus:outline-none p-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const currentVal = Number(isStaticHold ? setLog.actualTime : setLog.actualReps) || 0;
                              updateClientExecutionSet(setIdx, isStaticHold ? 'actualTime' : 'actualReps', currentVal + 1);
                            }}
                            className="px-2.5 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Actual Weight */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block">
                          Weight / Load
                        </label>
                        <input
                          type="text"
                          placeholder={targetWeight || "e.g. 10kg, BW"}
                          value={setLog.actualWeight}
                          onChange={(e) => updateClientExecutionSet(setIdx, 'actualWeight', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-bold focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ─── FREE TEXT MANUAL ISSUE LOGGING (ALWAYS AVAILABLE) ─── */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider">
            {submittedIssue ? 'Add / Update Discomfort Note' : 'Describe Discomfort / Manual Issue'}
          </h4>
          <span className="text-[10px] text-indigo-400 font-medium">Visible to PT live</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={issueInput}
            onChange={e => setIssueInput(e.target.value)}
            placeholder="e.g. Unable to keep back straight, knees shaking..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500/60 outline-none"
            onKeyDown={e => { if (e.key === 'Enter' && issueInput.trim()) { handleClientLogIssue(issueInput); setIssueInput(''); } }}
          />
          <button
            onClick={() => { if (issueInput.trim()) { handleClientLogIssue(issueInput); setIssueInput(''); } }}
            disabled={!issueInput.trim()}
            className="bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send to PT</span>
          </button>
        </div>
      </div>

      {/* Flagged issue confirmation */}
      {submittedIssue && !clientDiagState?.approvedOption && (
        <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-amber-400 font-bold">⚡ Issue Flagged – PT has been notified</p>
            <span className="text-[10px] text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Synced to PT Screen</span>
          </div>
          <p className="text-slate-200 text-xs italic">"{submittedIssue}"</p>
          <p className="text-slate-400 text-xs">Your physiotherapist is analyzing and will send instructions shortly.</p>
        </div>
      )}

      {/* PT approved diagnostic instruction */}
      {clientDiagState?.status === 'awaiting_client_result' && clientDiagState.approvedOption && !resultSubmitted && (
        <div className="bg-indigo-950/50 border border-indigo-500/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-400" />
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">PT Diagnostic Test for You</p>
          </div>
          <p className="text-white font-bold">{clientDiagState.approvedOption.label}</p>
          <p className="text-slate-300 text-sm leading-relaxed">{clientDiagState.approvedOption.instruction}</p>

          {/* PT Approved Demonstration Video */}
          {clientDiagState.approvedOption.approvedVideo && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-indigo-300 font-medium">
                <span className="flex items-center gap-1.5 font-bold">
                  <PlayCircle className="w-4 h-4 text-indigo-400" />
                  Form Video Selected by Your PT:
                </span>
                <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30 text-indigo-200">
                  {clientDiagState.approvedOption.approvedVideo.creator}
                </span>
              </div>
              <div className="rounded-xl overflow-hidden border border-indigo-500/40 aspect-video bg-black shadow-lg">
                <iframe
                  src={clientDiagState.approvedOption.approvedVideo.embedUrl}
                  title={clientDiagState.approvedOption.approvedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <p className="text-[11px] text-slate-400 italic">
                "{clientDiagState.approvedOption.approvedVideo.whyRecommended}"
              </p>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-indigo-500/30">
            <p className="text-xs text-slate-400 font-bold">After completing the test, tell us how it went:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={clientResult}
                onChange={e => setClientResult(e.target.value)}
                placeholder="e.g. Much easier with heels elevated!"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-emerald-500 outline-none"
              />
              <button
                onClick={handleClientSubmitResult}
                disabled={!clientResult.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {resultSubmitted && (
        <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-3">
          <p className="text-xs text-emerald-400 font-bold">✅ Result logged! Your PT will review and update your plan.</p>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Client Mobile View Component
// -------------------------------------------------------------
function ClientView({ 
  isConnected, 
  dbConn, 
  rooms, 
  sessionHistory, 
  blueprints,
  blueprintExercises,
  exerciseDictionary
}: { 
  isConnected: boolean, 
  dbConn: DbConnection | null, 
  rooms: RoomData[], 
  sessionHistory: SessionHistoryData[], 
  blueprints: BlueprintData[],
  blueprintExercises: BlueprintExerciseData[],
  exerciseDictionary: ExerciseDictionaryData[]
}) {
  const { roomToken } = useParams();
  const [inputName, setInputName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'session' | 'homework'>('session');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<boolean>(false);
  
  const roomState = rooms.find(r => r.roomToken === roomToken);

  // Auto-verify if user is connected or waiting for approval
  useEffect(() => {
    if (!roomState) return;
    if (roomState.clientStatus === 'CONNECTED' || roomState.clientStatus === 'WAITING_APPROVAL') {
      setIsVerified(true);
    }
  }, [roomState]);

  const handleRequestEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbConn || !inputName.trim() || !roomToken || !roomState) return;

    const matches = inputName.trim().toLowerCase() === roomState.expectedClientName.toLowerCase();
    if (matches) {
      setIsVerified(true);
      setVerificationError(false);
    } else {
      setVerificationError(true);
    }

    dbConn.reducers.requestRoomEntry({
      roomToken: roomToken,
      clientName: inputName.trim(),
    });
  };

  const handleVerifyIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomState || !inputName.trim()) return;

    const matches = inputName.trim().toLowerCase() === roomState.expectedClientName.toLowerCase();
    if (matches) {
      setIsVerified(true);
      setVerificationError(false);
    } else {
      setVerificationError(true);
    }
  };

  if (!roomState) {
    return (
      <div className="max-w-md mx-auto w-full flex flex-col gap-6 p-6 mt-10">
        <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-800 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-300">Room Not Found</h3>
          <p className="text-xs text-slate-500 mt-2">Invalid or expired link token.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full flex flex-col gap-6 p-6 mt-4">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col gap-6 shadow-2xl">
        
        {/* Header & Client Navigation Tabs */}
        <div className="flex flex-col gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5 text-indigo-400" />
              <h2 className="font-bold text-white text-base">PhysioSync Client</h2>
            </div>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-mono">
              {roomState.roomId}
            </span>
          </div>

          {/* Client Navigation Tabs: Live Session vs My Homework */}
          <div className="grid grid-cols-2 bg-slate-900 p-1 rounded-xl border border-slate-800 gap-1 mt-1">
            <button
              onClick={() => setActiveTab('session')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'session' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Live Room</span>
            </button>
            <button
              onClick={() => setActiveTab('homework')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'homework' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>My Homework</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Live Room Session */}
        {activeTab === 'session' && (
          <div className="flex flex-col gap-4">

            {/* Form to enter name & request entry (active when status is NONE, DENIED, or SESSION_ENDED) */}
            {(!roomState.clientStatus || roomState.clientStatus === 'NONE' || roomState.clientStatus === 'DENIED' || roomState.clientStatus === 'SESSION_ENDED') && (
              <form onSubmit={handleRequestEntry} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Enter Your Full Name to Start Session
                  </label>
                  <input
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                    className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-all"
                  />
                </div>

                {(roomState.clientStatus === 'DENIED' || verificationError) && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                    ⚠️ Name did not match our records for this link. Please check spelling and try again.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!inputName.trim() || !isConnected}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Request Entry for Session</span>
                </button>
              </form>
            )}

            {/* State 2: Waiting for PT Approval */}
            {roomState.clientStatus === 'WAITING_APPROVAL' && (
              <div className="bg-amber-950/30 border border-amber-500/40 p-6 rounded-2xl text-center flex flex-col items-center gap-4 animate-pulse-subtle">
                <div className="bg-amber-500/20 p-4 rounded-full text-amber-400 border border-amber-500/30">
                  <Clock className="w-8 h-8 animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-300">Waiting for PT Approval</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {roomState.ptName} has been notified on their console. Entry will unlock automatically once approved.
                  </p>
                </div>
              </div>
            )}

            {/* State 3: Live Session Active - Rich Exercise View */}
            {roomState.clientStatus === 'CONNECTED' && (
              <ClientExerciseView 
                roomState={roomState} 
                dbConn={dbConn} 
                blueprints={blueprints}
                blueprintExercises={blueprintExercises}
                exerciseDictionary={exerciseDictionary}
              />
            )}
          </div>
        )}

        {/* Tab 2: My Homework (Home Rx & History) */}
        {activeTab === 'homework' && (
          isVerified ? (
            <div className="flex flex-col gap-4 text-xs">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <h3 className="font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Session History & Homework
                  </h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                    Verified: {roomState.expectedClientName}
                  </span>
                </div>

                <div className="space-y-4">
                  {sessionHistory
                    .filter(h => h.roomId === roomState.roomId)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((session, index) => {
                      let exercises: any[] = [];
                      try {
                        exercises = JSON.parse(session.completedExercisesJson || "[]");
                      } catch (e) {
                        console.error("Failed to parse exercises", e);
                      }

                      return (
                        <div key={session.logId} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
                            <span className="text-indigo-300 font-bold flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-emerald-400" />
                              {session.timestamp}
                            </span>
                            {index === 0 && (
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded uppercase tracking-wider font-bold">Latest</span>
                            )}
                          </div>
                          
                          {/* PT Notes */}
                          {session.notes && (
                            <div className="bg-indigo-950/30 p-3 rounded-lg border border-indigo-500/20">
                              <span className="text-slate-400 font-bold block mb-1">🏥 PT Clinician Notes:</span>
                              <p className="text-slate-200 italic">"{session.notes}"</p>
                            </div>
                          )}

                          {/* Exercises from this session */}
                          {exercises.length > 0 ? (
                            <div className="space-y-2 mt-2">
                              <h4 className="text-slate-300 font-bold mb-2 flex items-center gap-1">
                                <Activity className="w-3.5 h-3.5 text-purple-400" />
                                Assigned Exercises
                              </h4>
                              {exercises.map((ex, exIdx) => (
                                <div key={exIdx} className="bg-slate-900 p-2.5 rounded border border-slate-800 space-y-1.5">
                                  <div className="flex justify-between font-bold text-slate-200 text-xs">
                                    <span>{exIdx + 1}. {ex.exerciseName}</span>
                                    <span className="text-indigo-400">{ex.sets} sets x {ex.reps} reps {ex.isStaticHold ? '(Hold)' : ''}</span>
                                  </div>
                                  {ex.weight && ex.weight !== 'BW' && (
                                    <p className="text-slate-400 text-[10px]">• Target Weight: {ex.weight}</p>
                                  )}
                                  {ex.actualSets && ex.actualSets.length > 0 && (
                                    <div className="pt-1 flex flex-wrap gap-1.5">
                                      {ex.actualSets.map((s: any, sIdx: number) => (
                                        <span key={sIdx} className={`text-[10px] px-2 py-0.5 rounded border font-mono ${s.completed ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                                          Set {sIdx + 1}: {ex.isStaticHold ? `${s.actualTime || s.actualReps}s` : `${s.actualReps} reps`} @ {s.actualWeight || 'BW'} {s.completed ? '✓' : ''}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-500 italic mt-2">No specific exercises logged for this session.</p>
                          )}
                        </div>
                      );
                    })}
                  
                  {sessionHistory.filter(h => h.roomId === roomState.roomId).length === 0 && (
                    <div className="text-center py-6 text-slate-500">
                      <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No past sessions recorded yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Confidential Security Lock Card */
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl text-center flex flex-col items-center gap-4">
              <div className="bg-indigo-500/20 p-3.5 rounded-full text-indigo-400 border border-indigo-500/30">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Identity Verification Required</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Prescribed home rehab plans contain confidential health data. Please enter your full name to verify identity and unlock your plan.
                </p>
              </div>

              <form onSubmit={handleVerifyIdentity} className="w-full space-y-3 mt-1">
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-all text-center font-medium"
                />

                {verificationError && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                    ⚠️ Name did not match our records for this link. Please try again.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!inputName.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Identity & Unlock Homework</span>
                </button>
              </form>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Main App Router Component
// -------------------------------------------------------------
export function App() {
  const { isConnected, rooms, sessionHistory, blueprints, blueprintExercises, exerciseDictionary, dbConn } = useSpaceTimeDB();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <Link to="/pt">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent hover:text-white transition-colors">
                PhysioSync
              </h1>
            </Link>
            <p className="text-xs text-slate-400">Real-Time Tele-Rehab Room Authorization</p>
          </div>
        </div>

        {/* SpaceTimeDB Connection Badge */}
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
            isConnected 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span>{isConnected ? 'SpaceTimeDB Active' : 'Connecting to SpaceTimeDB...'}</span>
          </div>
        </div>
      </header>

      {/* Routing Logic */}
      <Routes>
        <Route path="/" element={<PTDashboard rooms={rooms} />} />
        <Route path="/pt" element={<PTDashboard rooms={rooms} />} />
        <Route path="/pt/room/:roomId" element={<PTRoomView dbConn={dbConn} rooms={rooms} sessionHistory={sessionHistory} blueprints={blueprints} blueprintExercises={blueprintExercises} exerciseDictionary={exerciseDictionary} />} />
        <Route path="/client/:roomToken" element={<ClientView isConnected={isConnected} dbConn={dbConn} rooms={rooms} sessionHistory={sessionHistory} blueprints={blueprints} blueprintExercises={blueprintExercises} exerciseDictionary={exerciseDictionary} />} />
        <Route path="*" element={<PTDashboard rooms={rooms} />} />
      </Routes>
    </div>
  );
}

export default App;

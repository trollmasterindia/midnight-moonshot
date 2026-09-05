import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { DbConnection } from './module_bindings';
import { 
  Activity, ShieldCheck, UserCheck, Smartphone, 
  AlertCircle, CheckCircle2, Clock, Sparkles, QrCode, Send, UserX, Check, Users,
  LogOut, FileText, Calendar, ClipboardList, CheckCircle, Copy, Search, Brain, ChevronRight
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

async function callLLMDiagnostic(
  issueText: string,
  clientName: string,
  clientGoal: string,
  dbExercises?: ExerciseDictionaryData[]
): Promise<{
  potentialCause: string;
  confidence: string;
  dbExercisesReferenced?: string[];
  ptOptions: { id: string; label: string; instruction: string; expectedOutcome: string }[];
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

Decision Rules & Biomechanics Principles:
- Case 1 (Unable to keep back straight / Forward Trunk Lean / Heels Lifting): Typically driven by Ankle Dorsiflexion restriction (forcing trunk forward to maintain center of gravity) OR fatigue/inhibition of Spinal Erectors / Anterior Core (Dead Bug, Bird Dog).
- Case 2 (Knees Collapsing Inward / Knee Valgus): Weak gluteus medius/abductors (Clamshells, Glute Bridge) or foot pronation.
- Case 3 (Lower Back Pain / Butt Wink): Lumbar rounding at depth due to tight hamstrings/adductors or pelvic tilt control.
- If issue extends beyond squats, correlate with other joint/muscle mechanics from the database.

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
      "expectedOutcome": "What result confirms or rules out this cause"
    },
    {
      "id": "opt2",
      "label": "Alternative diagnostic screen",
      "instruction": "...",
      "expectedOutcome": "..."
    }
  ],
  "outOfScope": "Leave empty if covered by database, or note any web-retrieved research"
}`;

  const userPrompt = `Client: ${clientName}
Client Goal: ${clientGoal}
Movement Fault / Complaint: "${issueText}"

Cross-reference our database, identify the biomechanical cause, and output the JSON diagnostic options.`;

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
          return parsed;
        }
      }
    } catch (e) {
      console.error('Gemini API error:', e);
    }
  }

  // 3. Fallback demo response grounded in DB
  return {
    potentialCause: 'Unable to keep the back straight during a squat is most commonly caused by restricted ankle dorsiflexion mobility (forcing excessive forward trunk pitch to maintain the center of mass over midfoot) or weak spinal erectors / anterior core stability (failing to resist trunk flexion).',
    confidence: 'High',
    dbExercisesReferenced: ['Bodyweight Squat', 'Ankle Dorsiflexion stretch', 'Dead Bug', 'Bird Dog'],
    ptOptions: [
      {
        id: 'opt1',
        label: 'Heel-Elevated Squat Screen (Ankle vs Trunk)',
        instruction: 'Place small wedges or 2.5kg plates under both heels and re-test the Bodyweight Squat. Keep chest proud.',
        expectedOutcome: 'If client can keep back straight with heels elevated, root cause is ankle dorsiflexion restriction.'
      },
      {
        id: 'opt2',
        label: 'Wall Facing Squat Screen (Thoracic & Core Control)',
        instruction: 'Stand 4 inches from a wall facing it with hands up. Perform a squat without hands or chest touching the wall.',
        expectedOutcome: 'If client cannot perform without touching wall, confirms thoracic extension / anterior core control deficit.'
      }
    ]
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
  const [editedExercises, setEditedExercises] = useState<any[]>([]);
  const [searchTerms, setSearchTerms] = useState<Record<number, string>>({});
  const [showDropdown, setShowDropdown] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (blueprint && exercises) {
      setEditedExercises(exercises.map(ex => ({ ...ex })));
    }
  }, [blueprint, exercises]);

  if (!isOpen || !blueprint) return null;

  const handleSave = () => {
    if (!dbConn) return;
    dbConn.reducers.saveBlueprint({
      blueprintId: blueprint.blueprintId,
      roomId: blueprint.roomId,
      name: blueprint.name,
      targetGoal: blueprint.targetGoal,
      isActiveDayPlan: blueprint.isActiveDayPlan,
      exercisesJson: JSON.stringify(editedExercises)
    });
    onClose();
  };

  const addExercise = () => {
    setEditedExercises(prev => [...prev, { id: `new-${Date.now()}`, exerciseName: '', sets: 3, reps: 10, weight: 'BW', isStaticHold: false, orderIndex: prev.length }]);
  };

  const updateExercise = (index: number, field: string, value: any) => {
    const newExs = [...editedExercises];
    newExs[index] = { ...newExs[index], [field]: value };
    setEditedExercises(newExs);
  };

  const getFilteredExercises = (term: string) => {
    if (!term || term.length < 2) return [];
    return exerciseDictionary.filter(e => e.name.toLowerCase().includes(term.toLowerCase())).slice(0, 8);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-400" />
            Edit Blueprint: {blueprint.name}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><UserX className="w-6 h-6" /></button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {editedExercises.sort((a,b) => a.orderIndex - b.orderIndex).map((ex, idx) => (
            <div key={ex.id || idx} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              {/* Exercise name with search */}
              <div className="relative mb-3">
                <label className="block text-xs text-slate-400 mb-1">Exercise Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input 
                    type="text" 
                    value={searchTerms[idx] !== undefined ? searchTerms[idx] : ex.exerciseName}
                    onChange={(e) => {
                      setSearchTerms(prev => ({ ...prev, [idx]: e.target.value }));
                      setShowDropdown(prev => ({ ...prev, [idx]: true }));
                    }}
                    onBlur={() => setTimeout(() => setShowDropdown(prev => ({ ...prev, [idx]: false })), 200)}
                    placeholder="Search exercises..."
                    className="w-full bg-slate-900 border border-slate-700 rounded pl-9 pr-3 py-2 text-white text-sm"
                  />
                </div>
                {showDropdown[idx] && getFilteredExercises(searchTerms[idx] || '').length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-slate-800 border border-slate-700 rounded-lg mt-1 shadow-xl overflow-hidden">
                    {getFilteredExercises(searchTerms[idx] || '').map(dictEx => (
                      <button
                        key={dictEx.exerciseId}
                        onClick={() => {
                          updateExercise(idx, 'exerciseName', dictEx.name);
                          setSearchTerms(prev => ({ ...prev, [idx]: dictEx.name }));
                          setShowDropdown(prev => ({ ...prev, [idx]: false }));
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-700 flex justify-between items-center"
                      >
                        <span className="text-white text-sm">{dictEx.name}</span>
                        <span className="text-xs text-slate-400">{dictEx.category} · {dictEx.targetMuscle}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 items-center flex-wrap">
                <div className="w-16">
                  <label className="block text-xs text-slate-400 mb-1">Sets</label>
                  <input type="number" value={ex.sets} onChange={(e) => updateExercise(idx, 'sets', parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                </div>
                <div className="w-20">
                  <label className="block text-xs text-slate-400 mb-1">{ex.isStaticHold ? 'Time (s)' : 'Reps'}</label>
                  <input type="number" value={ex.reps} onChange={(e) => updateExercise(idx, 'reps', parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-slate-400 mb-1">Weight</label>
                  <input type="text" value={ex.weight} onChange={(e) => updateExercise(idx, 'weight', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                </div>
                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={ex.isStaticHold} onChange={(e) => updateExercise(idx, 'isStaticHold', e.target.checked)} className="rounded bg-slate-900 border-slate-700 text-indigo-500" />
                    <span className="text-xs text-slate-300">Time-Based</span>
                  </label>
                </div>
                <button onClick={() => setEditedExercises(prev => prev.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-rose-300 text-xs pt-4">Remove</button>
              </div>
            </div>
          ))}
          <button onClick={addExercise} className="w-full py-2 border border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 hover:border-slate-500 text-sm transition-colors">+ Add Exercise</button>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors">
            <CheckCircle className="w-4 h-4" />
            Save Changes
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

interface DiagnosticState {
  issueText: string;
  loggedBy: 'PT' | 'CLIENT';
  analysis: any | null;
  approvedOption: any | null;
  clientResult: string;
  autoLogResult: any | null;
  status: 'idle' | 'needs_pt_analysis' | 'analyzing' | 'awaiting_pt_approval' | 'awaiting_client_result' | 'client_result_submitted' | 'auto_logging' | 'complete';
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
    issueText: '', loggedBy: 'PT', analysis: null, approvedOption: null,
    clientResult: '', autoLogResult: null, status: 'idle'
  });
  const [ptIssueInput, setPtIssueInput] = useState('');

  const activeBlueprint = blueprints.find(b => b.roomId === roomState?.roomId && b.isActiveDayPlan && b.name !== '__DIAGNOSTIC_STATE__');
  const activeBlueprintExercises = activeBlueprint ? blueprintExercises.filter(e => e.blueprintId === activeBlueprint.blueprintId).sort((a,b) => a.orderIndex - b.orderIndex) : [];
  
  // executionLog maps exercise id to array of set performances
  const [executionLog, setExecutionLog] = useState<Record<string, { actualReps: number, actualWeight: string, actualTime: string, completed: boolean }[]>>({});

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
      if (remote.status === 'needs_pt_analysis' && lastHandledIssueRef.current !== remote.issueText) {
        lastHandledIssueRef.current = remote.issueText;
        handleLogIssue(remote.issueText, 'CLIENT');
      } else if (remote.status === 'client_result_submitted' || (remote.clientResult && remote.clientResult !== diagState.clientResult)) {
        setDiagState(prev => ({ ...prev, clientResult: remote.clientResult, status: 'awaiting_client_result' }));
      }
    } catch {}
  }, [diagBlueprint?.targetGoal]);

  const handleLogIssue = async (issueText: string, loggedBy: 'PT' | 'CLIENT') => {
    if (!issueText.trim()) return;
    updateDiagState({ issueText, loggedBy, status: 'analyzing', analysis: null, approvedOption: null, clientResult: '', autoLogResult: null });
    setActiveTab('console');
    const result = await callLLMDiagnostic(issueText, roomState?.expectedClientName || 'Client', 'Squat Rehab / Biomechanics Improvement', exerciseDictionary);
    updateDiagState({ analysis: result, status: 'awaiting_pt_approval' });
  };

  const handleApproveOption = async (option: any) => {
    updateDiagState({ approvedOption: option, status: 'awaiting_client_result' });
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

  const updateExecutionSet = (exId: string, setIdx: number, field: string, value: any) => {
    setExecutionLog(prev => {
      const exLog = prev[exId] ? [...prev[exId]] : [];
      while(exLog.length <= setIdx) {
        exLog.push({ actualReps: 0, actualWeight: '', actualTime: '', completed: false });
      }
      exLog[setIdx] = { ...exLog[setIdx], [field]: value };
      return { ...prev, [exId]: exLog };
    });
  };

  const handleConfirmEndSession = () => {
    if (!dbConn) return;
    const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    // Format execution log for DB
    const executedExercises = activeBlueprintExercises.map(ex => {
      const setsData = executionLog[ex.id] || [];
      return {
        exerciseName: ex.exerciseName,
        isStaticHold: ex.isStaticHold,
        sets: ex.sets, // planned sets
        reps: ex.reps, // planned reps/time
        weight: ex.weight, // planned weight
        actualSets: setsData
      };
    });

    const completedExercisesJson = activeBlueprint ? JSON.stringify(executedExercises) : "[]";

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
                  <button 
                    onClick={() => setIsAIPlannerOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Create AI Blueprint
                  </button>
                </div>

                <div className="grid gap-4">
                  {blueprints.filter(b => b.roomId === roomState.roomId && b.name !== '__DIAGNOSTIC_STATE__').length === 0 ? (
                    <div className="text-center py-10 border border-slate-800 border-dashed rounded-xl bg-slate-900/50">
                      <ClipboardList className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">No blueprints saved for this client yet.</p>
                      <p className="text-xs text-slate-500 mt-1">Use the AI Planner to generate one.</p>
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
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Select Diagnostic Action to Send to Client:</p>
                        {diagState.analysis.ptOptions?.map((opt: any) => (
                          <button
                            key={opt.id}
                            onClick={() => handleApproveOption(opt)}
                            className="w-full text-left bg-slate-800 hover:bg-indigo-900/40 border border-slate-700 hover:border-indigo-500/60 rounded-lg p-3 transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-white font-bold text-xs flex items-center gap-2">
                                <ChevronRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                                {opt.label}
                              </span>
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">Approve & Send</span>
                            </div>
                            <p className="text-slate-400 text-xs mt-1 ml-5">{opt.expectedOutcome}</p>
                          </button>
                        ))}
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
                  <h4 className="text-white font-bold text-sm border-b border-emerald-500/30 pb-2">
                    {activeBlueprint ? `Execution Tracker: ${activeBlueprint.name}` : 'No Active Plan'}
                  </h4>
                  {activeBlueprintExercises.length > 0 ? (
                    activeBlueprintExercises.map(ex => {
                      const setsData = executionLog[ex.id] || [];
                      return (
                        <div key={ex.id} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
                          <div>
                            <span className="text-white font-bold text-sm">{ex.exerciseName}</span>
                            <span className="text-slate-400 text-xs ml-2">
                              Target: {ex.sets} sets × {ex.reps} {ex.isStaticHold ? 'sec hold' : 'reps'} @ {ex.weight}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            {Array.from({ length: ex.sets }).map((_, setIdx) => {
                              const setLog = setsData[setIdx] || { actualReps: 0, actualWeight: '', actualTime: '', completed: false };
                              return (
                                <div key={setIdx} className={`flex items-center gap-3 p-2 rounded ${setLog.completed ? 'bg-emerald-900/20 border border-emerald-800' : 'bg-slate-950 border border-slate-800'}`}>
                                  <label className="flex items-center gap-2 cursor-pointer w-20">
                                    <input 
                                      type="checkbox" 
                                      checked={setLog.completed}
                                      onChange={(e) => updateExecutionSet(ex.id, setIdx, 'completed', e.target.checked)}
                                      className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                                    />
                                    <span className="text-xs text-slate-300">Set {setIdx + 1}</span>
                                  </label>
                                  
                                  <input 
                                    type="number"
                                    placeholder={ex.isStaticHold ? "Time (s)" : "Reps"}
                                    value={ex.isStaticHold ? setLog.actualTime : setLog.actualReps}
                                    onChange={(e) => updateExecutionSet(ex.id, setIdx, ex.isStaticHold ? 'actualTime' : 'actualReps', e.target.value)}
                                    disabled={setLog.completed}
                                    className="w-20 bg-slate-900 border border-slate-700 rounded p-1 text-white text-xs disabled:opacity-50"
                                  />
                                  <input 
                                    type="text"
                                    placeholder="Weight"
                                    value={setLog.actualWeight}
                                    onChange={(e) => updateExecutionSet(ex.id, setIdx, 'actualWeight', e.target.value)}
                                    disabled={setLog.completed}
                                    className="w-24 bg-slate-900 border border-slate-700 rounded p-1 text-white text-xs disabled:opacity-50"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-slate-400 text-xs py-4 text-center border border-slate-800 border-dashed rounded-lg bg-slate-900/40">
                      No blueprint assigned. Go to the Session Planner tab to set an Active Day Plan.
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
                                  <div key={exIdx} className="bg-slate-950 p-2.5 rounded border border-slate-800">
                                    <div className="flex justify-between font-bold text-slate-200 text-xs">
                                      <span>{exIdx + 1}. {ex.exerciseName}</span>
                                      <span className="text-indigo-400">{ex.sets}x{ex.reps} {ex.isStaticHold ? '(Hold)' : ''}</span>
                                    </div>
                                    {ex.weight && ex.weight !== 'BW' && (
                                      <p className="text-slate-400 text-[10px] mt-1">Weight: {ex.weight}</p>
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
function ClientExerciseView({ roomState, dbConn, blueprints }: { roomState: RoomData, dbConn: DbConnection | null, blueprints: BlueprintData[] }) {
  const squatExercise = {
    name: 'Bodyweight Squat',
    videoUrl: 'https://www.youtube.com/embed/dW3zj79xfrc',
    imageUrl: 'https://i0.wp.com/www.strengthlog.com/wp-content/uploads/2020/05/Squat-muscles-worked.png?resize=700%2C700&ssl=1',
    commonIssues: [
      { id: 'knee-valgus', title: 'Knees Collapsing Inward', icon: '🦵' },
      { id: 'heel-lift', title: 'Heels Lifting Off Floor / Unable to keep back straight', icon: '🦶' },
      { id: 'butt-wink', title: 'Lower Back Rounding', icon: '🍑' },
      { id: 'no-depth', title: "Can't Reach Depth", icon: '⬇️' },
      { id: 'back-pain', title: 'Lower Back Discomfort', icon: '🔴' },
    ]
  };

  const [issueInput, setIssueInput] = useState('');
  const [submittedIssue, setSubmittedIssue] = useState('');
  const [clientResult, setClientResult] = useState('');
  const [resultSubmitted, setResultSubmitted] = useState(false);

  // Sync diagnostic state from SpaceTimeDB blueprint broadcast (external PC support)
  const diagBlueprint = blueprints.find(b => b.roomId === roomState.roomId && b.name === '__DIAGNOSTIC_STATE__');
  const [clientDiagState, setClientDiagState] = useState<DiagnosticState | null>(null);

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

      {/* Exercise: Video */}
      <div className="space-y-2">
        <h3 className="text-white font-bold text-base">Today's Exercise: {squatExercise.name}</h3>
        <div className="rounded-xl overflow-hidden border border-slate-700 aspect-video">
          <iframe
            src={squatExercise.videoUrl}
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
            <img src={squatExercise.imageUrl} alt="Muscles worked in squat" className="w-full object-contain" />
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider">Common Issues (Tap to Flag)</h4>
          <div className="space-y-1.5">
            {squatExercise.commonIssues.map(issue => (
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

      {/* Free text issue logging */}
      {!submittedIssue && (
        <div className="space-y-2">
          <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider">Describe Discomfort</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={issueInput}
              onChange={e => setIssueInput(e.target.value)}
              placeholder="e.g. I feel tightness in my lower back..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500/60 outline-none"
              onKeyDown={e => { if (e.key === 'Enter' && issueInput.trim()) { handleClientLogIssue(issueInput); setIssueInput(''); } }}
            />
            <button
              onClick={() => { if (issueInput.trim()) { handleClientLogIssue(issueInput); setIssueInput(''); } }}
              disabled={!issueInput.trim()}
              className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Flagged issue confirmation */}
      {submittedIssue && !clientDiagState?.approvedOption && (
        <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3 space-y-1">
          <p className="text-xs text-amber-400 font-bold">⚡ Issue Flagged – PT has been notified</p>
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
function ClientView({ isConnected, dbConn, rooms, sessionHistory, blueprints }: { isConnected: boolean, dbConn: DbConnection | null, rooms: RoomData[], sessionHistory: SessionHistoryData[], blueprints: BlueprintData[] }) {
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
              <ClientExerciseView roomState={roomState} dbConn={dbConn} blueprints={blueprints} />
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
                                <div key={exIdx} className="bg-slate-900 p-2.5 rounded border border-slate-800 space-y-1">
                                  <div className="flex justify-between font-bold text-slate-200 text-xs">
                                    <span>{exIdx + 1}. {ex.exerciseName}</span>
                                    <span className="text-indigo-400">{ex.sets} sets x {ex.reps} reps {ex.isStaticHold ? '(Hold)' : ''}</span>
                                  </div>
                                  {ex.weight && ex.weight !== 'BW' && (
                                    <p className="text-slate-400 text-[10px]">• Weight: {ex.weight}</p>
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
        <Route path="/client/:roomToken" element={<ClientView isConnected={isConnected} dbConn={dbConn} rooms={rooms} sessionHistory={sessionHistory} blueprints={blueprints} />} />
        <Route path="*" element={<PTDashboard rooms={rooms} />} />
      </Routes>
    </div>
  );
}

export default App;

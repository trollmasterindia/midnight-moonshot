import { schema, table, t } from 'spacetimedb/server';

const spacetimedb = schema({
  room: table(
    { public: true },
    {
      roomId: t.string().primaryKey(),
      roomToken: t.string(),
      ptName: t.string(),
      expectedClientName: t.string(),
      submittedClientName: t.string(),
      clientStatus: t.string(), // "NONE", "WAITING_APPROVAL", "CONNECTED", "DENIED", "SESSION_ENDED"
      lastSessionNotes: t.string(),
      lastSessionTimestamp: t.string(),
    }
  ),
  session_history: table(
    { public: true },
    {
      logId: t.string().primaryKey(),
      roomId: t.string(),
      timestamp: t.string(),
      notes: t.string(),
      completedExercisesJson: t.string(),
    }
  ),
  blueprint: table(
    { public: true },
    {
      blueprintId: t.string().primaryKey(),
      roomId: t.string(),
      name: t.string(),
      targetGoal: t.string(),
      isActiveDayPlan: t.bool(),
    }
  ),
  blueprint_exercise: table(
    { public: true },
    {
      id: t.string().primaryKey(),
      blueprintId: t.string(),
      exerciseName: t.string(),
      warmupFor: t.string(), 
      sets: t.u32(),
      reps: t.u32(),
      weight: t.string(),
      isStaticHold: t.bool(),
      orderIndex: t.u32(),
    }
  ),
  exercise_dictionary: table(
    { public: true },
    {
      exerciseId: t.string().primaryKey(),
      name: t.string(),
      category: t.string(), // e.g. Rehab, Hypertrophy, Power, Mobility, Core
      targetMuscle: t.string(),
      description: t.string(),
    }
  ),
});

export default spacetimedb;

export const init = spacetimedb.init(ctx => {
  // Seed initial 5 rooms for POC
  const clients = ['Nipun', 'Alex', 'Sarah', 'Mike', 'Emma'];
  
  clients.forEach((client, index) => {
    const id = index + 1;
    ctx.db.room.insert({
      roomId: `squat-diag-10${id}`,
      roomToken: `client-token-${id}`,
      ptName: 'Dr. Smith',
      expectedClientName: client,
      submittedClientName: '',
      clientStatus: 'NONE',
      lastSessionNotes: '',
      lastSessionTimestamp: '',
    });
  });

  // Seed top 30 exercises
  const exercises = [
    // Rehab & Mobility
    { id: 'ex-1', name: 'Bodyweight Squat', cat: 'Rehab', mus: 'Quads/Glutes', desc: 'Basic functional movement' },
    { id: 'ex-2', name: 'Glute Bridge', cat: 'Rehab', mus: 'Glutes', desc: 'Core and glute activation' },
    { id: 'ex-3', name: 'Clamshells', cat: 'Rehab', mus: 'Hip Abductors', desc: 'Strengthens gluteus medius' },
    { id: 'ex-4', name: 'Straight Leg Raise', cat: 'Rehab', mus: 'Quads', desc: 'Knee rehabilitation' },
    { id: 'ex-5', name: 'Calf Raises', cat: 'Rehab', mus: 'Calves', desc: 'Ankle stability' },
    { id: 'ex-6', name: 'Bird Dog', cat: 'Core', mus: 'Core/Back', desc: 'Spinal stability' },
    { id: 'ex-7', name: 'Dead Bug', cat: 'Core', mus: 'Core', desc: 'Anterior core control' },
    { id: 'ex-8', name: 'Side Plank', cat: 'Core', mus: 'Obliques', desc: 'Lateral core stability' },
    { id: 'ex-9', name: 'Ankle Dorsiflexion stretch', cat: 'Mobility', mus: 'Ankle', desc: 'Improves squat depth' },
    { id: 'ex-10', name: '90/90 Hip Stretch', cat: 'Mobility', mus: 'Hips', desc: 'Hip internal/external rotation' },

    // Hypertrophy
    { id: 'ex-11', name: 'Barbell Back Squat', cat: 'Hypertrophy', mus: 'Quads/Glutes', desc: 'Primary lower body builder' },
    { id: 'ex-12', name: 'Romanian Deadlift (RDL)', cat: 'Hypertrophy', mus: 'Hamstrings', desc: 'Posterior chain builder' },
    { id: 'ex-13', name: 'Bulgarian Split Squat', cat: 'Hypertrophy', mus: 'Quads/Glutes', desc: 'Unilateral leg strength' },
    { id: 'ex-14', name: 'Leg Press', cat: 'Hypertrophy', mus: 'Quads', desc: 'Machine leg builder' },
    { id: 'ex-15', name: 'Leg Extension', cat: 'Hypertrophy', mus: 'Quads', desc: 'Isolated quad growth' },
    { id: 'ex-16', name: 'Lying Leg Curl', cat: 'Hypertrophy', mus: 'Hamstrings', desc: 'Isolated hamstring growth' },
    { id: 'ex-17', name: 'Bench Press', cat: 'Hypertrophy', mus: 'Chest', desc: 'Upper body pushing' },
    { id: 'ex-18', name: 'Overhead Press', cat: 'Hypertrophy', mus: 'Shoulders', desc: 'Vertical pushing strength' },
    { id: 'ex-19', name: 'Pull-up', cat: 'Hypertrophy', mus: 'Lats/Back', desc: 'Vertical pulling' },
    { id: 'ex-20', name: 'Barbell Row', cat: 'Hypertrophy', mus: 'Back', desc: 'Horizontal pulling' },
    
    // Sports Performance & Power
    { id: 'ex-21', name: 'Box Jump', cat: 'Power', mus: 'Full Lower', desc: 'Explosive vertical power' },
    { id: 'ex-22', name: 'Power Clean', cat: 'Power', mus: 'Full Body', desc: 'Olympic weightlifting movement' },
    { id: 'ex-23', name: 'Kettlebell Swing', cat: 'Power', mus: 'Posterior Chain', desc: 'Explosive hip hinge' },
    { id: 'ex-24', name: 'Medicine Ball Slam', cat: 'Power', mus: 'Core/Lats', desc: 'Explosive upper body' },
    { id: 'ex-25', name: 'Sprint', cat: 'Performance', mus: 'Full Body', desc: 'Max velocity mechanics' },
    { id: 'ex-26', name: 'Lateral Bound (Skater)', cat: 'Power', mus: 'Glutes', desc: 'Lateral explosive power' },
    { id: 'ex-27', name: 'Depth Jump', cat: 'Power', mus: 'Lower Body', desc: 'Advanced plyometric impact absorption' },
    { id: 'ex-28', name: 'Agility Ladder Drills', cat: 'Performance', mus: 'Calves/Ankles', desc: 'Footwork and coordination' },
    { id: 'ex-29', name: 'Push Press', cat: 'Power', mus: 'Shoulders/Triceps', desc: 'Explosive overhead push' },
    { id: 'ex-30', name: 'Trap Bar Deadlift', cat: 'Performance', mus: 'Full Lower', desc: 'Maximal strength and power' }
  ];

  for (const ex of exercises) {
    ctx.db.exercise_dictionary.insert({
      exerciseId: ex.id,
      name: ex.name,
      category: ex.cat,
      targetMuscle: ex.mus,
      description: ex.desc
    });
  }
});

export const seedExercises = spacetimedb.reducer(
  {},
  (ctx) => {
    // Seed top 30 exercises
    const exercises = [
      // Rehab & Mobility
      { id: 'ex-1', name: 'Bodyweight Squat', cat: 'Rehab', mus: 'Quads/Glutes', desc: 'Basic functional movement' },
      { id: 'ex-2', name: 'Glute Bridge', cat: 'Rehab', mus: 'Glutes', desc: 'Core and glute activation' },
      { id: 'ex-3', name: 'Clamshells', cat: 'Rehab', mus: 'Hip Abductors', desc: 'Strengthens gluteus medius' },
      { id: 'ex-4', name: 'Straight Leg Raise', cat: 'Rehab', mus: 'Quads', desc: 'Knee rehabilitation' },
      { id: 'ex-5', name: 'Calf Raises', cat: 'Rehab', mus: 'Calves', desc: 'Ankle stability' },
      { id: 'ex-6', name: 'Bird Dog', cat: 'Core', mus: 'Core/Back', desc: 'Spinal stability' },
      { id: 'ex-7', name: 'Dead Bug', cat: 'Core', mus: 'Core', desc: 'Anterior core control' },
      { id: 'ex-8', name: 'Side Plank', cat: 'Core', mus: 'Obliques', desc: 'Lateral core stability' },
      { id: 'ex-9', name: 'Ankle Dorsiflexion stretch', cat: 'Mobility', mus: 'Ankle', desc: 'Improves squat depth' },
      { id: 'ex-10', name: '90/90 Hip Stretch', cat: 'Mobility', mus: 'Hips', desc: 'Hip internal/external rotation' },

      // Hypertrophy
      { id: 'ex-11', name: 'Barbell Back Squat', cat: 'Hypertrophy', mus: 'Quads/Glutes', desc: 'Primary lower body builder' },
      { id: 'ex-12', name: 'Romanian Deadlift (RDL)', cat: 'Hypertrophy', mus: 'Hamstrings', desc: 'Posterior chain builder' },
      { id: 'ex-13', name: 'Bulgarian Split Squat', cat: 'Hypertrophy', mus: 'Quads/Glutes', desc: 'Unilateral leg strength' },
      { id: 'ex-14', name: 'Leg Press', cat: 'Hypertrophy', mus: 'Quads', desc: 'Machine leg builder' },
      { id: 'ex-15', name: 'Leg Extension', cat: 'Hypertrophy', mus: 'Quads', desc: 'Isolated quad growth' },
      { id: 'ex-16', name: 'Lying Leg Curl', cat: 'Hypertrophy', mus: 'Hamstrings', desc: 'Isolated hamstring growth' },
      { id: 'ex-17', name: 'Bench Press', cat: 'Hypertrophy', mus: 'Chest', desc: 'Upper body pushing' },
      { id: 'ex-18', name: 'Overhead Press', cat: 'Hypertrophy', mus: 'Shoulders', desc: 'Vertical pushing strength' },
      { id: 'ex-19', name: 'Pull-up', cat: 'Hypertrophy', mus: 'Lats/Back', desc: 'Vertical pulling' },
      { id: 'ex-20', name: 'Barbell Row', cat: 'Hypertrophy', mus: 'Back', desc: 'Horizontal pulling' },
      
      // Sports Performance & Power
      { id: 'ex-21', name: 'Box Jump', cat: 'Power', mus: 'Full Lower', desc: 'Explosive vertical power' },
      { id: 'ex-22', name: 'Power Clean', cat: 'Power', mus: 'Full Body', desc: 'Olympic weightlifting movement' },
      { id: 'ex-23', name: 'Kettlebell Swing', cat: 'Power', mus: 'Posterior Chain', desc: 'Explosive hip hinge' },
      { id: 'ex-24', name: 'Medicine Ball Slam', cat: 'Power', mus: 'Core/Lats', desc: 'Explosive upper body' },
      { id: 'ex-25', name: 'Sprint', cat: 'Performance', mus: 'Full Body', desc: 'Max velocity mechanics' },
      { id: 'ex-26', name: 'Lateral Bound (Skater)', cat: 'Power', mus: 'Glutes', desc: 'Lateral explosive power' },
      { id: 'ex-27', name: 'Depth Jump', cat: 'Power', mus: 'Lower Body', desc: 'Advanced plyometric impact absorption' },
      { id: 'ex-28', name: 'Agility Ladder Drills', cat: 'Performance', mus: 'Calves/Ankles', desc: 'Footwork and coordination' },
      { id: 'ex-29', name: 'Push Press', cat: 'Power', mus: 'Shoulders/Triceps', desc: 'Explosive overhead push' },
      { id: 'ex-30', name: 'Trap Bar Deadlift', cat: 'Performance', mus: 'Full Lower', desc: 'Maximal strength and power' }
    ];

    for (const ex of exercises) {
      // Avoid inserting duplicates if called multiple times
      let exists = false;
      for (const e of ctx.db.exercise_dictionary.iter()) {
        if (e.exerciseId === ex.id) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        ctx.db.exercise_dictionary.insert({
          exerciseId: ex.id,
          name: ex.name,
          category: ex.cat,
          targetMuscle: ex.mus,
          description: ex.desc
        });
      }
    }
  }
);

export const requestRoomEntry = spacetimedb.reducer(
  { roomToken: t.string(), clientName: t.string() },
  (ctx, { roomToken, clientName }) => {
    for (const r of ctx.db.room.iter()) {
      if (r.roomToken === roomToken) {
        const matches = clientName.trim().toLowerCase() === r.expectedClientName.toLowerCase();
        ctx.db.room.delete(r);
        ctx.db.room.insert({
          ...r,
          submittedClientName: clientName,
          clientStatus: matches ? 'WAITING_APPROVAL' : 'DENIED',
        });
      }
    }
  }
);

export const approveClientEntry = spacetimedb.reducer(
  { roomId: t.string(), approve: t.bool() },
  (ctx, { roomId, approve }) => {
    for (const r of ctx.db.room.iter()) {
      if (r.roomId === roomId) {
        ctx.db.room.delete(r);
        ctx.db.room.insert({
          ...r,
          clientStatus: approve ? 'CONNECTED' : 'DENIED',
        });
      }
    }
  }
);

export const endSession = spacetimedb.reducer(
  { roomId: t.string(), notes: t.string(), timestamp: t.string(), completedExercisesJson: t.string() },
  (ctx, { roomId, notes, timestamp, completedExercisesJson }) => {
    for (const r of ctx.db.room.iter()) {
      if (r.roomId === roomId) {
        ctx.db.room.delete(r);
        ctx.db.room.insert({
          ...r,
          clientStatus: 'SESSION_ENDED',
          lastSessionNotes: notes,
          lastSessionTimestamp: timestamp,
        });
        
        ctx.db.session_history.insert({
          logId: `${roomId}-${ctx.timestamp}`,
          roomId: roomId,
          timestamp: timestamp,
          notes: notes,
          completedExercisesJson: completedExercisesJson,
        });
      }
    }
  }
);

export const resetRoom = spacetimedb.reducer(
  { roomId: t.string() },
  (ctx, { roomId }) => {
    for (const r of ctx.db.room.iter()) {
      if (r.roomId === roomId) {
        ctx.db.room.delete(r);
        ctx.db.room.insert({
          ...r,
          submittedClientName: '',
          clientStatus: 'NONE',
        });
      }
    }
  }
);

export const saveBlueprint = spacetimedb.reducer(
  { 
    blueprintId: t.string(), 
    roomId: t.string(), 
    name: t.string(), 
    targetGoal: t.string(), 
    isActiveDayPlan: t.bool(),
    exercisesJson: t.string(),
  },
  (ctx, { blueprintId, roomId, name, targetGoal, isActiveDayPlan, exercisesJson }) => {
    // Delete existing blueprint if updating
    for (const b of ctx.db.blueprint.iter()) {
      if (b.blueprintId === blueprintId) {
        ctx.db.blueprint.delete(b);
      }
    }
    
    // Delete old exercises
    for (const e of ctx.db.blueprint_exercise.iter()) {
      if (e.blueprintId === blueprintId) {
        ctx.db.blueprint_exercise.delete(e);
      }
    }

    // Insert blueprint
    ctx.db.blueprint.insert({
      blueprintId,
      roomId,
      name,
      targetGoal,
      isActiveDayPlan,
    });

    // Parse exercises and insert
    try {
      const exercises = JSON.parse(exercisesJson);
      for (const ex of exercises) {
        ctx.db.blueprint_exercise.insert({
          id: ex.id || `${blueprintId}-${ex.orderIndex}`,
          blueprintId,
          exerciseName: ex.exerciseName || '',
          warmupFor: ex.warmupFor || '',
          sets: ex.sets || 0,
          reps: ex.reps || 0,
          weight: ex.weight || '',
          isStaticHold: !!ex.isStaticHold,
          orderIndex: ex.orderIndex || 0,
        });
      }
    } catch (e) {
      console.error("Failed to parse exercisesJson", e);
    }
  }
);


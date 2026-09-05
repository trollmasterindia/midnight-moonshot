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
});

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


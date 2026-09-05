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
  { roomId: t.string(), notes: t.string(), timestamp: t.string() },
  (ctx, { roomId, notes, timestamp }) => {
    for (const r of ctx.db.room.iter()) {
      if (r.roomId === roomId) {
        ctx.db.room.delete(r);
        ctx.db.room.insert({
          ...r,
          clientStatus: 'SESSION_ENDED',
          lastSessionNotes: notes,
          lastSessionTimestamp: timestamp,
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


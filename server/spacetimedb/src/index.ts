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
      clientStatus: t.string(), // "NONE", "WAITING_APPROVAL", "CONNECTED", "DENIED"
    }
  ),
});

export default spacetimedb;

export const init = spacetimedb.init(ctx => {
  // Seed initial room for POC: room_id="squat-diag-101", token="nipun-squat", pt="Dr. Smith", expected="Nipun"
  ctx.db.room.insert({
    roomId: 'squat-diag-101',
    roomToken: 'nipun-squat',
    ptName: 'Dr. Smith',
    expectedClientName: 'Nipun',
    submittedClientName: '',
    clientStatus: 'NONE',
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

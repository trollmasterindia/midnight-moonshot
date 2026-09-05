import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { DbConnection } from './module_bindings';
import { 
  Activity, ShieldCheck, UserCheck, Smartphone, 
  AlertCircle, CheckCircle2, Clock, Sparkles, QrCode, Send, UserX, Check, Users,
  LogOut, FileText, Calendar, ClipboardList, CheckCircle, Copy
} from 'lucide-react';

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

// Custom hook to manage SpaceTimeDB connection
function useSpaceTimeDB() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [rooms, setRooms] = useState<RoomData[]>([]);
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

      const updateRooms = () => {
        setRooms(Array.from(conn.db.room.iter()));
      };

      conn.subscriptionBuilder()
        .onApplied(() => {
          updateRooms();
        })
        .subscribe(['SELECT * FROM room']);

      conn.db.room.onInsert(updateRooms);
      conn.db.room.onUpdate(updateRooms);
      conn.db.room.onDelete(updateRooms);

      return () => {
        conn.disconnect();
      };
    } catch (err) {
      console.error('Failed to initialize SpaceTimeDB connection:', err);
    }
  }, []);

  return { isConnected, rooms, dbConn };
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
                  {(room.clientStatus === 'WAITING_APPROVAL' || room.clientStatus === 'DENIED') && room.submittedClientName && (
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
// -------------------------------------------------------------
function PTRoomView({ dbConn, rooms }: { dbConn: DbConnection | null, rooms: RoomData[] }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const roomState = rooms.find(r => r.roomId === roomId);
  const [isEndingSession, setIsEndingSession] = useState<boolean>(false);
  const [notesInput, setNotesInput] = useState<string>('');
  const [copiedBanner, setCopiedBanner] = useState<boolean>(false);

  if (!roomState) {
    return <div className="text-white p-6 text-center">Room not found or loading...</div>;
  }

  const handleApprove = (approve: boolean) => {
    if (!dbConn) return;
    dbConn.reducers.approveClientEntry({ roomId: roomState.roomId, approve });
  };

  const handleConfirmEndSession = () => {
    if (!dbConn) return;
    const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    dbConn.reducers.endSession({
      roomId: roomState.roomId,
      notes: notesInput.trim() || 'Client completed squat rehab protocol. Good form stability.',
      timestamp: timestamp,
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
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-6">
            
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
                roomState.clientStatus === 'CONNECTED' ? (
                  <button
                    onClick={() => setIsEndingSession(true)}
                    className="flex items-center space-x-1.5 text-xs bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 px-3.5 py-2 rounded-xl font-bold transition-all shadow-md shadow-rose-950/50 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>End Session</span>
                  </button>
                ) : (
                  <button
                    disabled
                    title="Session must be active and connected before ending"
                    className="flex items-center space-x-1.5 text-xs bg-slate-800/60 text-slate-500 border border-slate-800 px-3.5 py-2 rounded-xl font-medium cursor-not-allowed opacity-60"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>End Session (Not Started)</span>
                  </button>
                )
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
                      <li>• Bodyweight Squats (3 sets x 10 reps)</li>
                      <li>• Glute Activation Bridges</li>
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

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Active Exercise Assigned</span>
                    <span className="text-white font-bold text-sm">Squat Biomechanics & Diagnostic Screen</span>
                  </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Client Mobile View Component
// -------------------------------------------------------------
function ClientView({ isConnected, dbConn, rooms }: { isConnected: boolean, dbConn: DbConnection | null, rooms: RoomData[] }) {
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
                    placeholder={`e.g. ${roomState.expectedClientName}`}
                    required
                    className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-all"
                  />
                </div>

                {(roomState.clientStatus === 'DENIED' || verificationError) && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                    ⚠️ Name did not match expected client name for this link ({roomState.expectedClientName}). Please check spelling and try again.
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

            {/* State 3: Live Session Active */}
            {roomState.clientStatus === 'CONNECTED' && (
              <div className="bg-emerald-950/30 border border-emerald-500/40 p-6 rounded-2xl flex flex-col gap-4 text-center">
                <div className="bg-emerald-500/20 p-4 rounded-full text-emerald-400 border border-emerald-500/30 mx-auto">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Access Granted</span>
                  <h3 className="text-xl font-extrabold text-white mt-1">Live Session Active</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Connected in private room with {roomState.ptName}.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: My Homework (Home Rx) */}
        {activeTab === 'homework' && (
          isVerified ? (
            <div className="flex flex-col gap-4 text-xs">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <h3 className="font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Prescribed Home Rehab Plan
                  </h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                    Verified: {roomState.expectedClientName}
                  </span>
                </div>

                <div className="space-y-3 text-slate-300">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex justify-between font-bold text-white text-sm">
                      <span>1. Bodyweight Squat Calibration</span>
                      <span className="text-indigo-400 text-xs">3 sets x 10 reps</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      • Maintain 3-point foot contact. Push knees outward over toes without caving in.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex justify-between font-bold text-white text-sm">
                      <span>2. Glute Activation Bridges</span>
                      <span className="text-indigo-400 text-xs">2 sets x 12 reps</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      • Drive through heels and squeeze glutes at peak hold for 2 seconds before lowering.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex justify-between font-bold text-white text-sm">
                      <span>3. Wall Ankle Dorsiflexion Drill</span>
                      <span className="text-indigo-400 text-xs">2 sets x 10 reps</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      • Keep heel firmly on ground while bending knee forward toward wall.
                    </p>
                  </div>
                </div>
              </div>

              {/* Clinician Feedback */}
              {roomState.lastSessionNotes && (
                <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                    <span className="text-indigo-300 font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      Previous Session Logged
                    </span>
                    {roomState.lastSessionTimestamp && (
                      <span className="text-indigo-400/80 font-mono text-[10px]">{roomState.lastSessionTimestamp}</span>
                    )}
                  </div>
                  <span className="text-slate-400 font-bold block mb-1">🏥 PT Clinician Notes:</span>
                  <p className="text-slate-200 italic">"{roomState.lastSessionNotes}"</p>
                </div>
              )}
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
                  placeholder={`e.g. ${roomState.expectedClientName}`}
                  required
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-all text-center font-medium"
                />

                {verificationError && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                    ⚠️ Name did not match expected client name for this link ({roomState.expectedClientName}). Please try again.
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
  const { isConnected, rooms, dbConn } = useSpaceTimeDB();

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
        <Route path="/pt" element={<PTDashboard rooms={rooms} />} />
        <Route path="/pt/room/:roomId" element={<PTRoomView dbConn={dbConn} rooms={rooms} />} />
        <Route path="/client/:roomToken" element={<ClientView isConnected={isConnected} dbConn={dbConn} rooms={rooms} />} />
        {/* Default Redirect to PT dashboard */}
        <Route path="*" element={<PTDashboard rooms={rooms} />} />
      </Routes>
    </div>
  );
}

export default App;

import React, { useEffect, useState } from 'react';
import { DbConnection } from './module_bindings';
import { 
  Activity, ShieldCheck, UserCheck, Smartphone, Laptop, RefreshCw, 
  AlertCircle, CheckCircle2, Clock, Sparkles, QrCode, Send, UserX, Check
} from 'lucide-react';

interface RoomData {
  roomId: string;
  roomToken: string;
  ptName: string;
  expectedClientName: string;
  submittedClientName: string;
  clientStatus: string;
}

export function App() {
  const [activeTab, setActiveTab] = useState<'pt' | 'client'>('pt');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [roomState, setRoomState] = useState<RoomData | null>(null);
  const [inputName, setInputName] = useState<string>('');
  const [dbConn, setDbConn] = useState<DbConnection | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname || 'localhost';
    const wsUrl = `ws://${hostname}:3000`;
    console.log(`Connecting to SpaceTimeDB at ${wsUrl}...`);

    try {
      const conn = DbConnection.builder()
        .withUri(wsUrl)
        .withDatabaseName('squat-poc')
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

      // Subscribe to room table updates
      conn.subscriptionBuilder()
        .onApplied(() => {
          console.log('Subscription applied');
          const rooms = Array.from(conn.db.room.iter());
          if (rooms.length > 0) {
            setRoomState({ ...rooms[0] });
          }
        })
        .subscribe(['SELECT * FROM room']);

      // Listen for insert/update events
      conn.db.room.onInsert((_ctx: any, row: any) => {
        setRoomState({ ...row });
      });

      conn.db.room.onUpdate((_ctx: any, _oldRow: any, newRow: any) => {
        setRoomState({ ...newRow });
      });

      return () => {
        conn.disconnect();
      };
    } catch (err) {
      console.error('Failed to initialize SpaceTimeDB connection:', err);
    }
  }, []);

  const handleRequestEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbConn || !inputName.trim()) return;

    dbConn.reducers.requestRoomEntry({
      roomToken: 'nipun-squat',
      clientName: inputName.trim(),
    });
  };

  const handleApprove = (approve: boolean) => {
    if (!dbConn || !roomState) return;

    dbConn.reducers.approveClientEntry({
      roomId: roomState.roomId,
      approve,
    });
  };

  const handleReset = () => {
    if (!dbConn || !roomState) return;

    dbConn.reducers.resetRoom({
      roomId: roomState.roomId,
    });
    setInputName('');
  };

  const mobileUrl = `http://192.168.0.215:5173`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              PhysioSync <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono ml-2">SpaceTimeDB POC</span>
            </h1>
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
            <span>{isConnected ? 'SpaceTimeDB WebSockets Active' : 'Connecting to SpaceTimeDB...'}</span>
          </div>

          {/* Mode View Switcher */}
          <div className="bg-slate-800/80 p-1 rounded-xl flex border border-slate-700/50">
            <button
              onClick={() => setActiveTab('pt')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'pt'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>PT View (Laptop)</span>
            </button>
            <button
              onClick={() => setActiveTab('client')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'client'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Client View (Mobile)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* Mobile Testing Network Banner */}
        <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between border border-indigo-500/20 bg-indigo-950/20">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/30 text-indigo-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Test on Your Mobile Phone</p>
              <p className="text-sm font-mono text-slate-200 mt-0.5">
                Open on mobile browser: <span className="text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-emerald-500/30">{mobileUrl}</span>
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            Make sure your phone is connected to the same Wi-Fi network!
          </div>
        </div>

        {/* Tab View Render */}
        {activeTab === 'pt' ? (
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
                  <h3 className="text-lg font-bold text-white">Nipun</h3>
                  <p className="text-xs text-slate-400">Patient ID: #NP-8842 • Target: Squat Rehab</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-medium block mb-1">🏥 Injury History:</span>
                    <p className="text-slate-200">L4-L5 Lumbar Herniation (2024), Right Ankle Sprain (2025)</p>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-medium block mb-1">📋 Clinical Notes:</span>
                    <p className="text-slate-200">Dormant glutes under load; responds well to 3-point foot cues & banded glute primers.</p>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-medium block mb-1">📐 Baseline Mobility:</span>
                    <p className="text-slate-200">Ankle Dorsiflexion: <span className="text-indigo-300 font-semibold">35° (Restricted)</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (2 cols): PT Live Supervisor Dashboard */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-6">
                
                {/* Room State Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                      PT Supervisor Room Console
                    </h2>
                    <p className="text-xs text-slate-400">Room: <span className="font-mono text-indigo-300">squat-diag-101</span> • Clinician: Dr. Smith</p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Room State</span>
                  </button>
                </div>

                {/* Real-time Status Card */}
                {roomState?.clientStatus === 'WAITING_APPROVAL' ? (
                  <div className="bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-transparent p-6 rounded-2xl border border-amber-500/40 animate-pulse-subtle flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-amber-500 p-3 rounded-xl text-slate-950 font-bold shadow-lg shadow-amber-500/30">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs uppercase font-bold tracking-wider text-amber-400">Entry Request Pending</span>
                          <h3 className="text-xl font-extrabold text-white">{roomState.submittedClientName} is requesting room entry</h3>
                          <p className="text-xs text-slate-300 mt-0.5">Submitted via secret link token: <span className="font-mono text-amber-200">nipun-squat</span></p>
                        </div>
                      </div>
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-1 rounded-full font-medium">Name Verification Match</span>
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
                ) : roomState?.clientStatus === 'CONNECTED' ? (
                  <div className="bg-emerald-950/30 p-6 rounded-2xl border border-emerald-500/30 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Live Session Active</span>
                          <h3 className="text-xl font-bold text-white">Patient {roomState.submittedClientName} Connected</h3>
                          <p className="text-xs text-slate-400">Bi-directional WebSockets synchronized via SpaceTimeDB</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 block mb-1">Active Exercise Assigned</span>
                        <span className="text-white font-bold text-sm">Squat Biomechanics & Diagnostic Screen</span>
                      </div>
                      <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg font-semibold">
                        Ready for 3D Overlay & Diagnostics
                      </span>
                    </div>
                  </div>
                ) : roomState?.clientStatus === 'DENIED' ? (
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
                    <p className="text-xs text-slate-500 max-w-md">
                      Open the Client View tab or visit <span className="font-mono text-indigo-400">{mobileUrl}</span> on your mobile phone to test entry authorization.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* Client Mobile Mode View */
          <div className="max-w-md mx-auto w-full flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col gap-6 shadow-2xl">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-bold text-white text-base">PhysioSync Client</h2>
                </div>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-mono">
                  room: nipun-squat
                </span>
              </div>

              {/* State 1: Input Name Form */}
              {(!roomState?.clientStatus || roomState?.clientStatus === 'NONE' || roomState?.clientStatus === 'DENIED') && (
                <form onSubmit={handleRequestEntry} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Enter Your Full Name
                    </label>
                    <input
                      type="text"
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      placeholder="e.g. Nipun"
                      required
                      className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-all"
                    />
                  </div>

                  {roomState?.clientStatus === 'DENIED' && (
                    <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                      ⚠️ Name did not match expected client name. Please re-enter "Nipun".
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={!inputName.trim() || !isConnected}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Join Room</span>
                  </button>
                </form>
              )}

              {/* State 2: Waiting for PT Approval */}
              {roomState?.clientStatus === 'WAITING_APPROVAL' && (
                <div className="bg-amber-950/30 border border-amber-500/40 p-6 rounded-2xl text-center flex flex-col items-center gap-4 animate-pulse-subtle">
                  <div className="bg-amber-500/20 p-4 rounded-full text-amber-400 border border-amber-500/30">
                    <Clock className="w-8 h-8 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-300">Waiting for PT Approval</h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Dr. Smith has been notified on their laptop console. Entry will unlock automatically once approved.
                    </p>
                  </div>
                </div>
              )}

              {/* State 3: Live Session Active */}
              {roomState?.clientStatus === 'CONNECTED' && (
                <div className="bg-emerald-950/30 border border-emerald-500/40 p-6 rounded-2xl flex flex-col gap-4 text-center">
                  <div className="bg-emerald-500/20 p-4 rounded-full text-emerald-400 border border-emerald-500/30 mx-auto">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Access Granted</span>
                    <h3 className="text-xl font-extrabold text-white mt-1">Session Active</h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Connected in private room with Dr. Smith.
                    </p>
                  </div>

                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-left space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Active Exercise:</span>
                      <span className="text-white font-bold">Squat Biomechanics</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Target Muscles:</span>
                      <span className="text-indigo-400 font-semibold">Quads & Glutes</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

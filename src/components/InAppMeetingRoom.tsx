import React, { useState, useEffect, useRef } from "react";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Send, 
  Users, 
  X, 
  HelpCircle, 
  Tv, 
  Sparkles, 
  Check, 
  Monitor, 
  Layers, 
  MessageSquare, 
  Palette, 
  Trash2, 
  RefreshCw, 
  ExternalLink,
  Laptop,
  AlertCircle,
  Clock,
  Shield,
  Activity,
  User,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { getJitsiUrl } from "../lib/jitsi";
import { 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  setDoc,
  deleteDoc,
  getDocs
} from "firebase/firestore";

interface InAppMeetingRoomProps {
  meetingTitle: string;
  meetingUrl: string;
  studentName: string;
  studentEmail: string;
  onLeave: () => void;
  isTrainer?: boolean;
  courseModules?: any[];
  activeLessonId?: string;
}

export default function InAppMeetingRoom({ 
  meetingTitle, 
  meetingUrl, 
  studentName, 
  studentEmail, 
  onLeave,
  isTrainer,
  courseModules,
  activeLessonId
}: InAppMeetingRoomProps) {
  // Tabs for the main panel: "room" | "whiteboard" | "iframe"
  const [activePanel, setActivePanel] = useState<"room" | "whiteboard" | "iframe">("room");
  
  // Media states
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "participants" | "notes" | "polls">("chat");
  const [teachingNotes, setTeachingNotes] = useState(() => {
    return localStorage.getItem("coimbatore_teaching_notes") || "";
  });

  useEffect(() => {
    localStorage.setItem("coimbatore_teaching_notes", teachingNotes);
  }, [teachingNotes]);

  // Local media stream references
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Whiteboard Canvas states & references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [brushColor, setBrushColor] = useState("#4f46e5"); // indigo
  const [brushSize, setBrushSize] = useState(4);
  const [canvasCleared, setCanvasCleared] = useState(false);

  // Trainer & Participants States
  const [trainerSpeaking, setTrainerSpeaking] = useState(true);
  const [participants, setParticipants] = useState<any[]>([
    { name: "Mike Vance (Director)", email: "mike@coimbatore.growth", role: "Trainer", speaking: true, camera: true },
    { name: "Aravind Kumar", email: "aravind@gmail.com", role: "Peer", speaking: false, camera: false },
    { name: "Neha Sharma", email: "neha@gmail.com", role: "Peer", speaking: false, camera: true },
  ]);

  // Audio waveform animation helper
  const [waveHeights, setWaveHeights] = useState<number[]>([15, 8, 25, 12, 30, 10, 18]);

  // Live Classroom Poll States
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [activeQuestionResponse, setActiveQuestionResponse] = useState<any>(null);
  const [liveResponses, setLiveResponses] = useState<any[]>([]);
  const [showPollToast, setShowPollToast] = useState(false);

  // Listen to the active webinar broadcast and polls
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "config", "live_class"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const question = data.activeQuestion || null;
        setActiveQuestion(question);
        
        // Show toast notification if a new question is initiated and user hasn't submitted yet
        if (question) {
          setShowPollToast(true);
        } else {
          setShowPollToast(false);
        }
      } else {
        setActiveQuestion(null);
        setShowPollToast(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to student's response to the active question in real-time
  useEffect(() => {
    if (!studentEmail || !activeQuestion?.id) {
      setActiveQuestionResponse(null);
      return;
    }
    const responseId = `${activeQuestion.id}_${studentEmail}`;
    const unsubscribe = onSnapshot(doc(db, "live_class_responses", responseId), (docSnap) => {
      if (docSnap.exists()) {
        setActiveQuestionResponse(docSnap.data());
        // Hide toast if already submitted
        setShowPollToast(false);
      } else {
        setActiveQuestionResponse(null);
      }
    });
    return () => unsubscribe();
  }, [studentEmail, activeQuestion?.id]);

  // Listen to all responses for statistical rendering
  useEffect(() => {
    if (!activeQuestion?.id) {
      setLiveResponses([]);
      return;
    }
    const q = query(
      collection(db, "live_class_responses"),
      where("questionId", "==", activeQuestion.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const responsesList: any[] = [];
      snapshot.forEach((docSnap) => {
        responsesList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setLiveResponses(responsesList);
    });
    return () => unsubscribe();
  }, [activeQuestion?.id]);

  const handleSubmitPollAnswer = async (optionIndex: number) => {
    if (!studentEmail || !activeQuestion) return;
    const isCorrect = optionIndex === activeQuestion.correctAnswer;
    const responseId = `${activeQuestion.id}_${studentEmail}`;
    try {
      await setDoc(doc(db, "live_class_responses", responseId), {
        questionId: activeQuestion.id,
        studentEmail: studentEmail,
        studentName: studentName || "Anonymous Scholar",
        selectedOptionIndex: optionIndex,
        isCorrect,
        submittedAt: new Date().toISOString()
      });
      setShowPollToast(false);
    } catch (error) {
      console.error("Error submitting in-meeting answer:", error);
    }
  };

  // Firestore path safely derived from meetingUrl
  const normalizedMeetingId = encodeURIComponent(meetingUrl.replace(/[^a-zA-Z0-9]/g, "_"));

  // Start real-time chat listener linked to this specific meeting
  useEffect(() => {
    const chatQuery = query(
      collection(db, "meeting_chats"),
      where("meetingId", "==", normalizedMeetingId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const messages: any[] = [];
      snapshot.forEach((docSnap) => {
        messages.push({ id: docSnap.id, ...docSnap.data() });
      });
      setChatMessages(messages);
    });

    return () => unsubscribe();
  }, [normalizedMeetingId]);

  // Animate speaker volume bars randomly to look natural & live
  useEffect(() => {
    const interval = setInterval(() => {
      if (trainerSpeaking) {
        setWaveHeights(Array.from({ length: 7 }, () => Math.floor(Math.random() * 28) + 4));
      } else {
        setWaveHeights([4, 4, 4, 4, 4, 4, 4]);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [trainerSpeaking]);

  // Handle local video/audio device streams
  useEffect(() => {
    if (cameraEnabled) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [cameraEnabled]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360 },
        audio: micEnabled
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Could not capture local video camera: ", err);
      setCameraEnabled(false);
    }
  };

  const stopCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  // Screen sharing handle
  const handleToggleScreenShare = async () => {
    if (screenShareEnabled) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      setScreenShareEnabled(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      screenStreamRef.current = stream;
      setScreenShareEnabled(true);
      
      stream.getVideoTracks()[0].onended = () => {
        setScreenShareEnabled(false);
        screenStreamRef.current = null;
      };
    } catch (err) {
      console.warn("Screen share request denied or restricted: ", err);
      setScreenShareEnabled(false);
    }
  };

  // Clean up all streams on leaving
  useEffect(() => {
    return () => {
      stopCamera();
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Submit in-meeting chat to Firestore
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      const msgData = {
        meetingId: normalizedMeetingId,
        senderName: studentName,
        senderEmail: studentEmail,
        message: chatInput.trim(),
        timestamp: new Date().toISOString()
      };
      
      setChatInput("");
      await addDoc(collection(db, "meeting_chats"), msgData);
    } catch (err) {
      console.error("Error dispatching in-app meeting chat: ", err);
    }
  };

  // Whiteboard Canvas Event Handlers
  useEffect(() => {
    if (activePanel === "whiteboard") {
      initCanvas();
    }
  }, [activePanel]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high pixel density display support
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Default styling
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCoordinates(e);
    if (!coords) return;
    
    isDrawingRef.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
    }
  };

  const handleDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const handleStopDrawing = () => {
    isDrawingRef.current = false;
  };

  const handleClearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Quick Chat Auto-Responses to simulate live peer interactivity!
  const triggerMockAttendeeReply = async () => {
    const mockResponses = [
      "Can we combine the AIDA formula directly inside meta tags?",
      "Mike, the screen share is clear. Good summary on CPC ratios.",
      "Yes, the landing page is where conversions usually drop without strong PAS copy.",
      "This live class format inside the app is fantastic!",
      "I've saved this consultation slot."
    ];
    const names = ["Aravind Kumar", "Neha Sharma"];
    const emails = ["aravind@gmail.com", "neha@gmail.com"];
    const idx = Math.floor(Math.random() * mockResponses.length);
    const peerIdx = Math.floor(Math.random() * names.length);

    try {
      await addDoc(collection(db, "meeting_chats"), {
        meetingId: normalizedMeetingId,
        senderName: names[peerIdx],
        senderEmail: emails[peerIdx],
        message: mockResponses[idx],
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Could not post mock reply", e);
    }
  };

  // Auto trigger peer activity occasionally
  useEffect(() => {
    const interval = setInterval(() => {
      // 15% chance to post mock message every 12 seconds
      if (Math.random() < 0.15) {
        triggerMockAttendeeReply();
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [normalizedMeetingId]);

  return (
    <div className="bg-slate-950 text-white rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl flex flex-col h-[680px] relative">
      
      {/* HEADER BAR */}
      <header className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 shrink-0">
            <Video className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-indigo-400">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              Secured In-App Live Arena
            </span>
            <h3 className="font-extrabold text-sm sm:text-base text-white truncate mt-0.5" title={meetingTitle}>
              {meetingTitle}
            </h3>
          </div>
        </div>

        {/* Tab Controls inside Header */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex bg-slate-800 p-1 rounded-xl border border-slate-750 text-xs">
            <button 
              onClick={() => setActivePanel("room")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${activePanel === "room" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              <Tv className="w-3.5 h-3.5" /> Webinar Room
            </button>
            <button 
              onClick={() => setActivePanel("whiteboard")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${activePanel === "whiteboard" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              <Palette className="w-3.5 h-3.5" /> Interactive Board
            </button>
            <button 
              onClick={() => setActivePanel("iframe")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${activePanel === "iframe" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              <Monitor className="w-3.5 h-3.5" /> Sandbox Frame
            </button>
          </div>

          <button 
            onClick={onLeave}
            className="p-2 bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs"
            title="Leave Meeting Room"
          >
            <X className="w-4 h-4" />
            <span className="hidden xs:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* MOBILE TAB SWITCH PANEL */}
      <div className="sm:hidden bg-slate-900 border-b border-slate-800 p-2 flex justify-around text-[10px]">
        <button 
          onClick={() => setActivePanel("room")}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${activePanel === "room" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
        >
          <Tv className="w-3 h-3" /> Room
        </button>
        <button 
          onClick={() => setActivePanel("whiteboard")}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${activePanel === "whiteboard" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
        >
          <Palette className="w-3 h-3" /> Whiteboard
        </button>
        <button 
          onClick={() => setActivePanel("iframe")}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${activePanel === "iframe" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
        >
          <Monitor className="w-3 h-3" /> Frame
        </button>
      </div>

      {/* MAIN CONTAINER GRID */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12">
        
        {/* LEFT VIEWPORT CANVAS (Active Panel Content) */}
        <div className="lg:col-span-8 bg-slate-950 flex flex-col min-h-0 relative border-r border-slate-800/80">
          
          {/* FLOATING CLASSROOM POLL NOTIFICATION TOAST */}
          <AnimatePresence>
            {showPollToast && activeQuestion && !isTrainer && !activeQuestionResponse && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="absolute top-4 left-4 right-4 bg-slate-900 border-2 border-rose-500 rounded-2xl p-4 shadow-2xl z-50 flex items-center justify-between gap-4 text-left animate-pulse"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 shrink-0">
                    <HelpCircle className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[8px] font-black rounded uppercase tracking-wider font-mono">
                      ⚡ LIVE COHORT POLL
                    </span>
                    <h5 className="font-extrabold text-xs text-white mt-1 leading-snug">
                      {activeQuestion.questionText}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Your trainer Mike Vance just launched a live question. Answer now to build your accuracy streak!
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setActiveTab("polls");
                      setShowPollToast(false);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black rounded-xl cursor-pointer transition shadow-md"
                  >
                    Answer Poll
                  </button>
                  <button
                    onClick={() => setShowPollToast(false)}
                    className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 rounded-xl cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* VIEWPORT 1: MAIN WEBINAR ROOM */}
          {activePanel === "room" && (
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto min-h-0">
              
              {/* REAL JITSI MEET IFRAME */}
              <div className="flex-1 min-h-[400px] bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden relative shadow-lg flex items-center justify-center">
                <iframe
                  allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                  src={getJitsiUrl(meetingUrl || `https://meet.ffmuc.net/cohort-room-default`, studentName)}
                  style={{ width: '100%', height: '100%', border: '0px' }}
                ></iframe>
              </div>

              {/* ACTION INFO BANNER CARD */}
              <div className="p-4 bg-indigo-950/50 border border-indigo-900/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <div className="space-y-1">
                  <h4 className="font-black text-xs text-indigo-300 uppercase tracking-widest flex items-center gap-1 font-mono">
                    <Sparkles className="w-3.5 h-3.5" /> Interactive Features Unlocked
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-normal">
                    This in-app arena allows you to collaborate during meetings! Toggle to the **Interactive Board** to draw, or access the **Sandbox Frame** to use direct tools side-by-side.
                  </p>
                </div>
                <button 
                  onClick={() => setActivePanel("whiteboard")}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shrink-0 cursor-pointer shadow-md transition"
                >
                  Launch Whiteboard
                </button>
              </div>

            </div>
          )}

          {/* VIEWPORT 2: HTML5 INTERACTIVE WHITEBOARD */}
          {activePanel === "whiteboard" && (
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden min-h-0">
              
              {/* Whiteboard Controls */}
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase text-indigo-400 font-mono flex items-center gap-1">
                    <Palette className="w-4 h-4" /> Sketchboard Canvas
                  </span>
                  
                  {/* Color Shelf */}
                  <div className="flex items-center gap-1.5 border-l border-slate-750 pl-3">
                    {["#4f46e5", "#ec4899", "#10b981", "#f59e0b", "#ffffff"].map((color) => (
                      <button
                        key={color}
                        onClick={() => setBrushColor(color)}
                        className="w-5 h-5 rounded-full cursor-pointer transition transform hover:scale-110 border"
                        style={{ 
                          backgroundColor: color, 
                          borderColor: brushColor === color ? "#ffffff" : "transparent"
                        }}
                      />
                    ))}
                  </div>

                  {/* Brush Size Slider */}
                  <div className="flex items-center gap-1.5 border-l border-slate-750 pl-3">
                    <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">Size:</span>
                    <input 
                      type="range" 
                      min="1" 
                      max="12" 
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-16 h-1 cursor-pointer accent-indigo-500 bg-slate-750 rounded-full"
                    />
                  </div>
                </div>

                <button
                  onClick={handleClearWhiteboard}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              </div>

              {/* Interactive Canvas container */}
              <div className="flex-1 bg-white rounded-2xl relative overflow-hidden shadow-inner border border-slate-800">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleStartDrawing}
                  onMouseMove={handleDrawing}
                  onMouseUp={handleStopDrawing}
                  onMouseLeave={handleStopDrawing}
                  className="w-full h-full cursor-crosshair bg-white"
                />
                
                <div className="absolute bottom-3 left-3 bg-slate-900/90 text-[9px] font-bold text-slate-300 px-2.5 py-1 rounded-lg pointer-events-none font-mono uppercase tracking-wider border border-slate-700/60 shadow flex items-center gap-1.5">
                  ✏️ Drawing Tool Enabled &bull; Press Left Click and drag to write notes
                </div>
              </div>

            </div>
          )}

          {/* VIEWPORT 3: THE EMBEDDED IFRAME SANDBOX */}
          {activePanel === "iframe" && (
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden min-h-0">
              
              {/* Iframe Warning / Alert banner */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-xs">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>External Content Isolation Framework</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal max-w-xl">
                    Commercial conferencing tools like Google Meet or Zoom enforce security rules (<strong className="text-slate-300">X-Frame-Options</strong>) preventing live viewport embeds. If the embedded sandbox below is blocked by your browser, launch it cleanly in a secured native viewport tab.
                  </p>
                </div>
                
                <a 
                  href={meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5 shadow shrink-0 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Launch External Tab
                </a>
              </div>

              {/* Actual physical Iframe wrapper */}
              <div className="flex-1 bg-slate-950 rounded-2xl relative border border-slate-800 overflow-hidden shadow-inner flex flex-col">
                <iframe
                  title="In-App Secured Frame"
                  src={getJitsiUrl(meetingUrl, studentName)}
                  allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts allow-downloads"
                  className="w-full flex-1 bg-slate-900 border-none"
                  onError={() => console.warn("Iframe blocked by security constraints")}
                />
                
                <div className="p-3 bg-slate-900 border-t border-slate-850 flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span className="truncate">Resource: {meetingUrl}</span>
                  <span className="text-indigo-400">Secured SSL Session</span>
                </div>
              </div>

            </div>
          )}

          {/* BOTTOM MEDIA CONFLICTS / MEDIA CONTROLS FLOATING BAR */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap justify-between items-center gap-3 z-10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMicEnabled(!micEnabled)}
                className={`p-3 rounded-xl cursor-pointer transition ${micEnabled ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-slate-800 hover:bg-slate-750 text-slate-400"}`}
                title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
              >
                {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-rose-400" />}
              </button>
              
              <button
                onClick={() => setCameraEnabled(!cameraEnabled)}
                className={`p-3 rounded-xl cursor-pointer transition ${cameraEnabled ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-slate-800 hover:bg-slate-750 text-slate-400"}`}
                title={cameraEnabled ? "Disable Webcam" : "Enable Webcam"}
              >
                {cameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4 text-rose-400" />}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 font-mono font-bold hidden xs:inline">
                Connection: <span className="text-emerald-500 font-extrabold">● SECURE & LIVE</span>
              </span>
              <button 
                onClick={onLeave}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md shadow-rose-950/20"
              >
                End Connection
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT INTERACTIVE COL: LIVE GROUP CHAT & PARTICIPANTS PANEL */}
        <div className="lg:col-span-4 bg-slate-900 flex flex-col min-h-0 z-10">
          
          {/* TAB BAR FOR CHAT OR PARTICIPANTS */}
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between gap-1">
            <div className="flex gap-1 flex-1">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 py-2 font-black text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "chat" ? "bg-slate-800 text-white border border-slate-700" : "text-slate-400 hover:text-white"}`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                Live Chat
                {chatMessages.length > 0 && (
                  <span className="bg-indigo-600 text-white text-[8px] px-1.5 py-0.2 rounded-full font-bold">
                    {chatMessages.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("participants")}
                className={`flex-1 py-2 font-black text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "participants" ? "bg-slate-800 text-white border border-slate-700" : "text-slate-400 hover:text-white"}`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Scholars ({participants.length + 1})
              </button>
              <button
                onClick={() => setActiveTab("polls")}
                className={`flex-1 py-2 font-black text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 relative ${activeTab === "polls" ? "bg-slate-800 text-white border border-slate-700" : "text-slate-400 hover:text-white"}`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                Polls
                {activeQuestion && !activeQuestionResponse && !isTrainer && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                )}
                {activeQuestion && (
                  <span className="bg-rose-600 text-white text-[7px] px-1 py-0.2 rounded font-black font-mono tracking-widest ml-1">
                    LIVE
                  </span>
                )}
              </button>
              {isTrainer && (
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`flex-1 py-2 font-black text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "notes" ? "bg-slate-800 text-white border border-slate-700" : "text-slate-400 hover:text-white"}`}
                  title="Teaching Reference"
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  Notes
                </button>
              )}
            </div>
          </div>

          {/* CHAT TAB WINDOW */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Messages viewport */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center p-6 text-slate-500 space-y-2 mt-8">
                    <MessageSquare className="w-8 h-8 text-slate-700 mx-auto" />
                    <p className="font-bold text-xs text-slate-400">Class chat ledger is clear</p>
                    <p className="text-[10px] text-slate-600">Send an active question, note, or strategic query to the attending cohort below!</p>
                  </div>
                ) : (
                  chatMessages.map((msg, mIdx) => {
                    const isSelf = msg.senderEmail === studentEmail;
                    return (
                      <div key={mIdx} className={`text-left max-w-[88%] ${isSelf ? "ml-auto" : "mr-auto"}`}>
                        <span className={`text-[9px] font-black block ${isSelf ? "text-indigo-400 text-right" : "text-slate-400"}`}>
                          {msg.senderName}
                          <span className="text-[8px] font-normal font-mono text-slate-500 ml-1.5">
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Live"}
                          </span>
                        </span>
                        <div className={`p-2.5 rounded-2xl text-xs mt-1 leading-normal ${
                          isSelf 
                            ? "bg-indigo-600 text-white rounded-tr-none shadow-sm" 
                            : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-750"
                        }`}>
                          <p className="font-medium whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendChat} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder="Type in-meeting note..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)} // Keep a local change handler
                  className="hidden" // we will map correctly below
                />
                <input
                  type="text"
                  placeholder="Type in-meeting message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
                />
                <button 
                  type="submit" 
                  disabled={!chatInput.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 disabled:cursor-not-allowed text-white rounded-xl transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          )}

          {/* PARTICIPANTS TAB WINDOW */}
          {activeTab === "participants" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              
              {/* Student Scholar Himself */}
              <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl flex items-center justify-between text-left text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-mono font-black flex items-center justify-center shrink-0">
                    {studentName.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-bold text-white flex items-center gap-1">
                      {studentName} 
                      <span className="text-[8px] bg-indigo-500 text-white font-mono px-1 rounded uppercase">You</span>
                    </h5>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[150px]">{studentEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400">
                  {cameraEnabled ? <Video className="w-3.5 h-3.5 text-emerald-500" /> : <VideoOff className="w-3.5 h-3.5 text-slate-600" />}
                  {micEnabled ? <Mic className="w-3.5 h-3.5 text-emerald-500" /> : <MicOff className="w-3.5 h-3.5 text-slate-600" />}
                </div>
              </div>

              {/* Host / Lecturer */}
              <div className="p-3 bg-slate-800/60 border border-slate-750 rounded-xl flex items-center justify-between text-left text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-indigo-500/40 text-white font-mono font-bold flex items-center justify-center shrink-0">
                    M
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-200 flex items-center gap-1.5">
                      Mike Vance 
                      <span className="text-[8px] bg-rose-500 text-white font-mono font-black px-1.5 rounded uppercase">Trainer</span>
                    </h5>
                    <p className="text-[10px] text-slate-450 mt-0.5 font-mono">mike@coimbatore.growth</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <Video className="w-3.5 h-3.5 text-emerald-500" />
                  {trainerSpeaking ? (
                    <div className="flex items-end gap-0.5 h-3">
                      <div className="w-0.5 h-2 bg-emerald-500 animate-bounce"></div>
                      <div className="w-0.5 h-3 bg-emerald-500 animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-0.5 h-1.5 bg-emerald-500 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  ) : (
                    <MicOff className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>
              </div>

              {/* Peer Cohort members */}
              <div className="pt-3 border-t border-slate-800">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  🎓 Attending Peer Cohort
                </span>
                
                <div className="space-y-2">
                  {participants.map((p, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900 border border-slate-850 rounded-xl flex items-center justify-between text-left text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <h6 className="font-bold text-slate-300">{p.name}</h6>
                          <p className="text-[9px] text-slate-500 truncate max-w-[150px]">{p.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-500">
                        {p.camera ? <Video className="w-3.5 h-3.5 text-emerald-600" /> : <VideoOff className="w-3.5 h-3.5 text-slate-700" />}
                        <MicOff className="w-3.5 h-3.5 text-slate-700" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TRAINER NOTES TAB WINDOW */}
          {activeTab === "notes" && isTrainer && (
            <div className="flex-1 flex flex-col p-4 space-y-3 h-full min-h-0">
              <h3 className="font-extrabold text-xs text-slate-100 flex items-center gap-2 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Teaching Reference (Your Eyes Only)
              </h3>
              <p className="text-[9px] text-slate-500 mb-2 font-mono leading-relaxed">
                Paste your syllabus or lecture notes here. Students cannot see this panel. It serves as your teleprompter while you stream.
              </p>
              <textarea
                value={teachingNotes}
                onChange={(e) => setTeachingNotes(e.target.value)}
                placeholder="Paste your teaching syllabus, script, or notes here..."
                className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500 resize-none min-h-0"
              />
            </div>
          )}

          {/* POLLS TAB WINDOW */}
          {activeTab === "polls" && (
            <div className="flex-1 flex flex-col p-4 space-y-4 h-full min-h-0 overflow-y-auto text-left">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-xs text-slate-100 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                  ⚡ In-Meeting Cohort Poll
                </h3>
                {activeQuestion && (
                  <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-black rounded uppercase tracking-wider font-mono animate-pulse">
                    Active Broadcast
                  </span>
                )}
              </div>

              {!activeQuestion ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
                  <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800">
                    <Activity className="w-6 h-6 text-slate-700" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-xs text-slate-350">No Live Poll Active</p>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      {isTrainer 
                        ? "Broadcast a live poll from the 'Meeting Link Dispatcher' under your trainer dashboard to capture real-time feedback." 
                        : "Waiting for the instructor to broadcast an instant classroom poll. Stay tuned!"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Active Question Box */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                    <span className="text-[8px] font-black text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                      Live Question
                    </span>
                    <h4 className="font-extrabold text-sm text-white leading-normal">
                      {activeQuestion.questionText}
                    </h4>
                  </div>

                  {/* Student Submission/View flow */}
                  {!isTrainer ? (
                    <>
                      {!activeQuestionResponse ? (
                        <div className="space-y-2.5">
                          <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">
                            👉 Select your answer:
                          </span>
                          <div className="space-y-2">
                            {activeQuestion.options.map((opt: string, oIdx: number) => (
                              <button
                                key={oIdx}
                                onClick={() => handleSubmitPollAnswer(oIdx)}
                                className="w-full text-left p-3 bg-slate-900 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-3 group"
                              >
                                <span className="w-6 h-6 bg-slate-950 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className="flex-1">{opt}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Answer submitted feedback card */}
                          <div className={`p-4 rounded-2xl border text-xs ${
                            activeQuestionResponse.isCorrect 
                              ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-300" 
                              : "bg-rose-950/30 border-rose-900/50 text-rose-300"
                          }`}>
                            <div className="flex items-center gap-2 font-black uppercase text-[10px] mb-1.5">
                              {activeQuestionResponse.isCorrect ? (
                                <>
                                  <Check className="w-4 h-4 text-emerald-400" />
                                  <span>Correct Answer!</span>
                                </>
                              ) : (
                                <>
                                  <X className="w-4 h-4 text-rose-400" />
                                  <span>Incorrect Answer</span>
                                </>
                              )}
                            </div>
                            <p className="font-medium">
                              {activeQuestionResponse.isCorrect 
                                ? "Great job! You selected the right option and submitted it successfully."
                                : `You selected option ${String.fromCharCode(65 + activeQuestionResponse.selectedOptionIndex)}. The correct answer is: ${String.fromCharCode(65 + activeQuestion.correctAnswer)} (${activeQuestion.options[activeQuestion.correctAnswer]})`}
                            </p>
                          </div>

                          {/* Live results statistics for student */}
                          <div className="space-y-3 pt-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                              📊 Peer Cohort Answers Breakdown
                            </span>
                            <div className="space-y-2">
                              {activeQuestion.options.map((opt: string, oIdx: number) => {
                                const votes = liveResponses.filter(r => r.selectedOptionIndex === oIdx);
                                const percent = liveResponses.length > 0 
                                  ? Math.round((votes.length / liveResponses.length) * 100) 
                                  : 0;
                                const isCorrect = oIdx === activeQuestion.correctAnswer;

                                return (
                                  <div key={oIdx} className="space-y-1 text-xs">
                                    <div className="flex justify-between items-center text-slate-400">
                                      <span className="font-semibold flex items-center gap-1.5 font-sans">
                                        <span className="text-slate-500 font-bold mr-1">{String.fromCharCode(65 + oIdx)}.</span>
                                        {opt}
                                      </span>
                                      <span className="font-mono font-bold text-slate-300">
                                        {percent}% ({votes.length})
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          isCorrect ? "bg-emerald-500" : "bg-indigo-500"
                                        }`}
                                        style={{ width: `${percent}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-[9px] text-slate-500 italic text-center">Total votes submitted: {liveResponses.length}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // Trainer Statistics and Live Responses list inside Meeting Room
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <span>📊 Responses breakdown</span>
                          <span className="text-rose-400 font-mono animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                            Live ({liveResponses.length})
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {activeQuestion.options.map((opt: string, oIdx: number) => {
                            const votes = liveResponses.filter(r => r.selectedOptionIndex === oIdx);
                            const percent = liveResponses.length > 0 
                              ? Math.round((votes.length / liveResponses.length) * 100) 
                              : 0;
                            const isCorrect = oIdx === activeQuestion.correctAnswer;

                            return (
                              <div key={oIdx} className="space-y-1 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-slate-300 flex items-center gap-1.5 font-sans">
                                    <span className="text-slate-500 font-black mr-1">{String.fromCharCode(65 + oIdx)}.</span>
                                    {opt}
                                    {isCorrect && (
                                      <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded uppercase font-mono ml-1">
                                        Correct
                                      </span>
                                    )}
                                  </span>
                                  <span className="font-mono font-bold text-slate-200">
                                    {percent}% ({votes.length})
                                  </span>
                                </div>
                                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isCorrect ? "bg-emerald-500" : "bg-indigo-500"
                                    }`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 space-y-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                          👤 Student Feed ({liveResponses.length})
                        </span>
                        {liveResponses.length === 0 ? (
                          <p className="text-[10px] text-slate-500 italic">Waiting for attendees to submit answers...</p>
                        ) : (
                          <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                            {liveResponses.map((res: any) => (
                              <div key={res.id} className="flex justify-between items-center text-[10px] py-1 border-b border-slate-950">
                                <div className="text-left">
                                  <span className="font-bold text-slate-300">{res.studentName}</span>
                                  <p className="text-[8px] text-slate-500 font-mono">{res.studentEmail}</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-400">
                                    Chose {String.fromCharCode(65 + res.selectedOptionIndex)}
                                  </span>
                                  {res.isCorrect ? (
                                    <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black px-1.5 rounded uppercase font-mono">
                                      Correct
                                    </span>
                                  ) : (
                                    <span className="bg-rose-500/10 text-rose-400 text-[8px] font-black px-1.5 rounded uppercase font-mono">
                                      Incorrect
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { 
  Video, 
  Send, 
  Users, 
  Layers, 
  Trash2, 
  Radio, 
  Plus, 
  Sparkles, 
  Check, 
  Monitor, 
  Tv,
  ExternalLink,
  Laptop,
  CheckCircle,
  Clock,
  HelpCircle
} from "lucide-react";
import { Student, CourseModule, LiveMeeting } from "../types";
import { db } from "../lib/firebase";
import { getJitsiUrl } from "../lib/jitsi";
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy 
} from "firebase/firestore";

interface LiveBroadcastStudioProps {
  courseModules: CourseModule[];
  students: Student[];
  onJoinMeeting?: (url: string, title: string) => void;
}

export default function LiveBroadcastStudio({ courseModules, students, onJoinMeeting }: LiveBroadcastStudioProps) {
  const [meetings, setMeetings] = useState<LiveMeeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);

  // Meeting Form states
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [targetType, setTargetType] = useState<"batch" | "student">("batch");
  const [targetStudent, setTargetStudent] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [dispatchedSuccess, setDispatchedSuccess] = useState(false);

  // Webinar Broadcast states
  const [isWebinarLive, setIsWebinarLive] = useState(false);
  const [webinarTopic, setWebinarTopic] = useState("Interactive Live Deep-Dive Class");
  const [webinarUrl, setWebinarUrl] = useState("");
  const [castedLessonId, setCastedLessonId] = useState("");
  const [screenSharingActive, setScreenSharingActive] = useState(false);
  const [broadcastingStatus, setBroadcastingStatus] = useState("");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Poll & Question states
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", "", "", ""]);
  const [pollCorrectAnswer, setPollCorrectAnswer] = useState<number>(0);
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [liveResponses, setLiveResponses] = useState<any[]>([]);

  const QUESTION_TEMPLATES = [
    {
      question: "Which KPI is most critical for measuring immediate search ad profitability?",
      options: ["Click-Through Rate (CTR)", "Return on Ad Spend (ROAS)", "Cost Per Impression (CPM)", "User Bounce Rate (%)"],
      correctAnswer: 1
    },
    {
      question: "What is the primary objective of a search engine meta-description tag?",
      options: ["Directly ranking keyword weights in spiders", "Increasing user Click-Through Rate (CTR) in search results", "Verifying DNS security certificates", "Controlling index crawler frequency rates"],
      correctAnswer: 1
    },
    {
      question: "What is the main role of the 'temperature' parameter in generative LLMs?",
      options: ["Governs model memory compression levels", "Enforces sequence padding alignments", "Controls token sampling randomness and creativity", "Restricts maximum context windows"],
      correctAnswer: 2
    }
  ];

  const handleLoadTemplate = (index: number) => {
    const temp = QUESTION_TEMPLATES[index];
    setPollQuestion(temp.question);
    setPollOptions([...temp.options]);
    setPollCorrectAnswer(temp.correctAnswer);
  };

  const handleUpdateOption = (index: number, value: string) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const handleInitiateQuestion = async () => {
    if (!pollQuestion.trim() || pollOptions.some(o => !o.trim())) return;

    // First delete any previous responses to avoid old results clashing
    try {
      const qSnap = await getDocs(collection(db, "live_class_responses"));
      for (const d of qSnap.docs) {
        await deleteDoc(doc(db, "live_class_responses", d.id));
      }
    } catch (e) {
      console.warn("Could not clear previous responses:", e);
    }

    try {
      const questionId = `q-${Date.now()}`;
      const qData = {
        id: questionId,
        questionText: pollQuestion.trim(),
        options: pollOptions.map(o => o.trim()),
        correctAnswer: pollCorrectAnswer,
        initiatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "config", "live_class"), {
        activeQuestion: qData
      }, { merge: true });

      setBroadcastingStatus("New instant question active! Students are prompted to vote now.");
    } catch (err) {
      console.error("Error initiating question: ", err);
    }
  };

  const handleClearQuestion = async () => {
    try {
      await setDoc(doc(db, "config", "live_class"), {
        activeQuestion: null
      }, { merge: true });
      setActiveQuestion(null);
      setBroadcastingStatus("Instant question ended. Classroom screens cleared.");
    } catch (err) {
      console.error("Error clearing question: ", err);
    }
  };

  // Fetch all dispatched meetings
  useEffect(() => {
    const q = query(collection(db, "meetings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: LiveMeeting[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as LiveMeeting);
      });
      setMeetings(list);
      setLoadingMeetings(false);
    });

    // Listen to current live class state
    const liveUnsubscribe = onSnapshot(doc(db, "config", "live_class"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsWebinarLive(data.active || false);
        setWebinarTopic(data.topic || "Interactive Live Deep-Dive Class");
        setWebinarUrl(data.meetingUrl || "");
        setCastedLessonId(data.castedLessonId || "");
        setScreenSharingActive(data.screenSharingActive || false);
        setActiveQuestion(data.activeQuestion || null);
      }
    });

    return () => {
      unsubscribe();
      liveUnsubscribe();
      stopScreenShare();
    };
  }, []);

  // Listen to student responses in real-time
  useEffect(() => {
    if (!isWebinarLive) {
      setLiveResponses([]);
      return;
    }
    const q = query(collection(db, "live_class_responses"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setLiveResponses(list);
    });
    return () => unsubscribe();
  }, [isWebinarLive]);

  // Generate realistic Jitsi Meet URL
  const handleGenerateMeetLink = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const segment1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const segment2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const segment3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setMeetingUrl(`https://meet.jit.si/${segment1}-${segment2}-${segment3}`);
  };

  const handleGenerateWebinarMeetLink = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const segment1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const segment2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const segment3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setWebinarUrl(`https://meet.jit.si/${segment1}-${segment2}-${segment3}`);
  };

  // Dispatch interactive meeting
  const handleDispatchMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim() || !meetingUrl.trim()) return;

    try {
      const newMeeting = {
        title: meetingTitle.trim(),
        url: meetingUrl.trim(),
        targetType,
        targetStudentEmail: targetType === "student" ? targetStudent : "",
        createdAt: new Date().toISOString(),
        active: true,
        date: meetingDate || null,
        time: meetingTime || null
      };

      await addDoc(collection(db, "meetings"), newMeeting);
      
      setMeetingTitle("");
      setMeetingUrl("");
      setMeetingDate("");
      setMeetingTime("");
      setDispatchedSuccess(true);
      setTimeout(() => setDispatchedSuccess(false), 4000);
    } catch (err) {
      console.error("Error creating meeting link: ", err);
    }
  };

  // Delete Dispatched Meeting
  const handleDeleteMeeting = async (id: string) => {
    try {
      await deleteDoc(doc(db, "meetings", id));
    } catch (err) {
      console.error("Error deleting meeting link: ", err);
    }
  };

  // Toggle Meeting active status
  const handleToggleMeetingActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "meetings", id), {
        active: !currentStatus
      });
    } catch (err) {
      console.error("Error toggling status: ", err);
    }
  };

  // Start Broadcast Webinar Session (Persisted to Firestore for real-time casting)
  const handleStartWebinar = async () => {
    if (!webinarTopic.trim()) return;

    try {
      const liveData = {
        active: true,
        topic: webinarTopic.trim(),
        meetingUrl: webinarUrl.trim() || `https://meet.jit.si/cohort-broadcast-room-${Date.now()}`,
        castedLessonId: castedLessonId || "none",
        screenSharingActive: screenSharingActive,
        startedAt: new Date().toISOString(),
        trainerName: "Instructor Mike"
      };

      await setDoc(doc(db, "config", "live_class"), liveData);
      setIsWebinarLive(true);
      setBroadcastingStatus("Webinar is now actively broadcasting to students in real-time.");
    } catch (err) {
      console.error("Error launching live session: ", err);
    }
  };

  // Stop Broadcast Webinar
  const handleStopWebinar = async () => {
    try {
      await setDoc(doc(db, "config", "live_class"), {
        active: false,
        topic: "",
        meetingUrl: "",
        castedLessonId: "",
        screenSharingActive: false,
        startedAt: ""
      });
      setIsWebinarLive(false);
      setBroadcastingStatus("Webinar terminated. Classroom sync reverted to standard self-study mode.");
      stopScreenShare();
    } catch (err) {
      console.error("Error stopping session: ", err);
    }
  };

  // Update Casted Lesson selection in real-time
  const handleUpdateCastedLesson = async (lessonId: string) => {
    setCastedLessonId(lessonId);
    if (isWebinarLive) {
      try {
        await updateDoc(doc(db, "config", "live_class"), {
          castedLessonId: lessonId
        });
        setBroadcastingStatus(`Casting Lesson "${lessonId}" active. Attending students' view has been synchronized.`);
      } catch (err) {
        console.error("Error casting lesson: ", err);
      }
    }
  };

  // Handle screen sharing stream natively
  const handleToggleScreenShare = async () => {
    if (screenSharingActive) {
      stopScreenShare();
      return;
    }

    try {
      // standard browser screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      screenStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setScreenSharingActive(true);
      
      if (isWebinarLive) {
        await updateDoc(doc(db, "config", "live_class"), {
          screenSharingActive: true
        });
      }

      // Handle stream end by browser stop button
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.warn("Screen share declined or restricted by browser: ", err);
    }
  };

  const handleToggleCameraShare = async () => {
    if (screenSharingActive) {
      stopScreenShare();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      screenStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setScreenSharingActive(true);
      
      if (isWebinarLive) {
        await updateDoc(doc(db, "config", "live_class"), {
          screenSharingActive: true
        });
      }

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.warn("Camera/Mic declined or restricted by browser: ", err);
      alert("Could not access camera/microphone. Please ensure you have granted permissions.");
    }
  };

  const stopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setScreenSharingActive(false);
    if (isWebinarLive) {
      try {
        await updateDoc(doc(db, "config", "live_class"), {
          screenSharingActive: false
        });
      } catch (e) {}
    }
  };

  const allLessons = courseModules.flatMap(m => m.lessons);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
      
      {/* LEFT COLUMN: DISPATCH & MANAGE MEETING LINKS */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div>
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-black rounded uppercase tracking-wider font-mono">
            📍 Meeting Creation Hub
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 mt-1">
            <Video className="w-5 h-5 text-indigo-600 animate-pulse" />
            Meeting Link Dispatcher
          </h3>
          <p className="text-xs text-slate-500 mt-1">Insert or generate dynamic meeting links (Google Meet, Zoom) and dispatch them to specific students or the entire cohort instantly.</p>
        </div>

        {/* PROMINENT INSTRUCTION ALERT BANNER FOR TRAINERS */}
        <div className="p-4 bg-indigo-950 text-white rounded-2xl text-xs space-y-2 border border-indigo-900 shadow">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-300 animate-bounce" />
            <span>How to Create Class Meetings:</span>
          </div>
          <p className="text-[11px] text-indigo-100 leading-relaxed">
            Fill in the topic, click <strong className="text-white">"Generate Google Meet URL"</strong> below to auto-build a room link, configure the target group, and click <strong className="text-white">"Dispatch"</strong>. It will go live instantly on the student classroom!
          </p>
        </div>

        {dispatchedSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Success! Meeting link dispatched. Students will find it in their Live Classroom.</span>
          </div>
        )}

        {/* Meeting Form */}
        <form onSubmit={handleDispatchMeeting} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase block">Meeting Topic / Class Title</label>
            <input 
              type="text" 
              placeholder="e.g. Q&A and Portfolio Consultation Slot"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-50 font-bold"
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-500 uppercase block">Meeting Join URL</label>
              <button 
                type="button"
                onClick={handleGenerateMeetLink}
                className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100"
              >
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Generate Google Meet URL
              </button>
            </div>
            <input 
              type="url" 
              placeholder="e.g. https://meet.jit.si/my-meeting-room"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-50 font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase block">Target Group</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 cursor-pointer"
              >
                <option value="batch">👥 Send to Entire Batch / Batch-wide</option>
                <option value="student">👤 Send to Specific Student</option>
              </select>
            </div>

            {targetType === "student" && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase block">Select Student</label>
                <select
                  value={targetStudent}
                  onChange={(e) => setTargetStudent(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 cursor-pointer"
                  required
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.email}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase block">Schedule Date (Optional)</label>
              <input 
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase block">Schedule Time (Optional)</label>
              <input 
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!meetingTitle.trim() || !meetingUrl.trim() || (targetType === "student" && !targetStudent)}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-150"
          >
            <Send className="w-4 h-4" />
            Dispatch Class Meeting Link
          </button>
        </form>

        {/* List of active dispatched meetings */}
        <div className="pt-5 border-t border-slate-100">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Live Despatched Records</h4>
          
          {loadingMeetings ? (
            <p className="text-xs text-slate-400 italic">Syncing active dispatch logs...</p>
          ) : meetings.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No scheduled meeting links sent yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
              {meetings.map((meet) => (
                <div key={meet.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex justify-between items-start gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                        meet.targetType === "batch" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-800"
                      }`}>
                        {meet.targetType === "batch" ? "Batch wide" : "Private Link"}
                      </span>
                      {meet.targetStudentEmail && (
                        <span className="text-[9px] text-slate-400 truncate max-w-[120px] font-mono" title={meet.targetStudentEmail}>
                          ({meet.targetStudentEmail})
                        </span>
                      )}
                    </div>
                    <h5 className="font-bold text-slate-800 mt-1 truncate">{meet.title}</h5>
                    <a 
                      href={meet.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 font-mono mt-0.5 truncate"
                    >
                      {meet.url} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  </div>

                  <div className="flex gap-2 items-center shrink-0">
                    {onJoinMeeting && meet.active && (
                      <button
                        onClick={() => onJoinMeeting(meet.url, meet.title)}
                        className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded text-[9px] font-bold cursor-pointer transition flex items-center gap-1"
                        title="Join inside Web App"
                      >
                        <Video className="w-3 h-3" />
                        Join In-App
                      </button>
                    )}
                    <button 
                      onClick={() => handleToggleMeetingActive(meet.id, meet.active)}
                      className={`px-2 py-1 rounded text-[9px] font-bold cursor-pointer transition ${
                        meet.active ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {meet.active ? "Active" : "Closed"}
                    </button>
                    <button 
                      onClick={() => handleDeleteMeeting(meet.id)}
                      className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Delete / Expire Meeting"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Classroom Poll & Instant Question Section */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-left">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-black rounded uppercase tracking-wider font-mono">
                ⚡ LIVE ENGAGEMENT
              </span>
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <HelpCircle className="w-4 h-4 text-rose-500" />
                Instant Lecture Poll & Live Question
              </h4>
            </div>
            {activeQuestion && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-black rounded uppercase tracking-wider font-mono animate-pulse">
                Active Question Live
              </span>
            )}
          </div>
          
          <p className="text-xs text-slate-500">
            Keep students engaged by pushing an instant question or poll to their active live class screens. Monitor their responses in real-time as they submit answers!
          </p>

          {/* Form to create/choose a question if no question is active */}
          {!activeQuestion ? (
            <div className="space-y-4">
              {/* Pre-configured Quick Templates */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase block">Quick Question Templates</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadTemplate(0)}
                    className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer text-slate-700"
                  >
                    📈 Marketing ROI KPI
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadTemplate(1)}
                    className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer text-slate-700"
                  >
                    🔍 SEO Meta Optimization
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadTemplate(2)}
                    className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer text-slate-700"
                  >
                    🧠 LLM Hyperparameters
                  </button>
                </div>
              </div>

              {/* Custom Input Fields */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase block">Question Text</label>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Type the question you want to ask..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pollOptions.map((opt, oIdx) => (
                    <div key={oIdx} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-500 uppercase block">Option {String.fromCharCode(65 + oIdx)}</label>
                        <label className="flex items-center gap-1 text-[10px] text-slate-500 font-bold cursor-pointer">
                          <input
                            type="radio"
                            name="correctAnswerIndex"
                            checked={pollCorrectAnswer === oIdx}
                            onChange={() => setPollCorrectAnswer(oIdx)}
                            className="w-3 h-3 text-indigo-600 cursor-pointer"
                          />
                          <span>Correct</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleUpdateOption(oIdx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-950 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={!pollQuestion.trim() || pollOptions.some(opt => !opt.trim())}
                  onClick={handleInitiateQuestion}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" />
                  Initiate & Broadcast Live Question
                </button>
                {!isWebinarLive && (
                  <p className="text-[10px] text-indigo-600 font-bold text-center font-mono">💡 Tip: You can launch instant polls anytime during dispatched meetings or webinars!</p>
                )}
              </div>
            </div>
          ) : (
            // Active Question Display & Live Results for Trainer
            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                    📢 BROADCASTING INSTANT QUESTION
                  </span>
                  <h5 className="font-extrabold text-sm text-slate-900 leading-snug">{activeQuestion.questionText}</h5>
                </div>
                <button
                  type="button"
                  onClick={handleClearQuestion}
                  className="px-3 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold rounded-lg text-xs transition shrink-0 cursor-pointer border border-slate-200"
                >
                  End & Clear
                </button>
              </div>

              {/* Live Statistics & Progress Bars */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>📊 Real-time Poll Breakdown</span>
                  <span className="text-rose-600 font-mono animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 bg-rose-600 rounded-full animate-ping"></span>
                    Live ({liveResponses.filter(r => r.questionId === activeQuestion.id).length} responses)
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activeQuestion.options.map((opt: string, oIdx: number) => {
                    const votes = liveResponses.filter(r => r.questionId === activeQuestion.id && r.selectedOptionIndex === oIdx);
                    const totalVotes = liveResponses.filter(r => r.questionId === activeQuestion.id).length;
                    const percent = totalVotes > 0 
                      ? Math.round((votes.length / totalVotes) * 100) 
                      : 0;
                    const isCorrect = oIdx === activeQuestion.correctAnswer;

                    return (
                      <div key={oIdx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <span className="font-black text-slate-400">{String.fromCharCode(65 + oIdx)}.</span>
                            {opt}
                            {isCorrect && (
                              <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded uppercase font-mono flex items-center gap-0.5">
                                <Check className="w-3 h-3 text-emerald-600" /> Answer
                              </span>
                            )}
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {percent}% ({votes.length})
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
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

              {/* List of active student submissions */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  👤 Submissions Feed
                </span>
                
                {liveResponses.filter(r => r.questionId === activeQuestion.id).length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Waiting for attending students to vote...</p>
                ) : (
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {liveResponses.filter(r => r.questionId === activeQuestion.id).map((res: any) => (
                      <div key={res.id} className="flex justify-between items-center text-[11px] py-1 border-b border-slate-50">
                        <span className="font-bold text-slate-800">
                          {res.studentName || "Anonymous Student"} 
                          <span className="text-[9px] text-slate-400 font-mono font-normal ml-1">({res.studentEmail})</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-500">
                            Chose {String.fromCharCode(65 + res.selectedOptionIndex)}
                          </span>
                          {res.isCorrect ? (
                            <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black px-1.5 rounded uppercase font-mono">
                              Correct
                            </span>
                          ) : (
                            <span className="bg-rose-50 text-rose-700 text-[8px] font-black px-1.5 rounded uppercase font-mono">
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
      </div>

      {/* RIGHT COLUMN: WEBINAR SCREEN SHARE & STUDY MATERIALS PRESENTER */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Tv className="w-5 h-5 text-rose-500" />
            Live Webinar & Screen Casting Studio
          </h3>
          <p className="text-xs text-slate-500 mt-1">Simulate or run full interactive webinars! Share your real screen/presentation slides, cast theoretical study notes, and synchronize all attending students' screens in real-time.</p>
        </div>

        {/* Broadcasting details banner */}
        {isWebinarLive ? (
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-900 rounded-2xl flex items-center gap-3">
              <Radio className="w-6 h-6 text-rose-500 animate-ping shrink-0" />
              <div>
                <span className="bg-rose-500 text-white font-mono font-black text-[9px] px-2 py-0.5 rounded">🔴 BROADCASTING LIVE</span>
                <h4 className="font-extrabold text-sm mt-1">Topic: {webinarTopic}</h4>
                <p className="text-[11px] text-rose-700 font-mono mt-0.5">Active Meeting URL: <a href={webinarUrl} target="_blank" rel="noreferrer" className="underline font-bold inline-flex items-center gap-0.5">{webinarUrl} <ExternalLink className="w-2.5 h-2.5" /></a></p>
              </div>
            </div>

            {/* MODERATION & ACCEPTING STUDENTS ASSISTANT CARD */}
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-950 space-y-3.5 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs">
                    🛡️
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs uppercase tracking-widest text-indigo-800">Moderator Control Center</h4>
                    <p className="text-[10px] text-indigo-600 font-medium">Initialize meeting room security & moderation permissions</p>
                  </div>
                </div>

                <a
                  href={webinarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow transition self-start sm:self-auto"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Launch Host Workspace (New Tab)
                </a>
              </div>
              
              <div className="text-[11px] text-slate-700 space-y-2.5 leading-relaxed">
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-1">
                  <span className="font-bold text-[10px] text-amber-800 block uppercase tracking-wider">⚠️ CRITICAL: Host Authentication Required</span>
                  <p className="text-slate-600 text-[10px] leading-normal">
                    Due to browser iframe security restrictions, you <strong>cannot sign in as host inside the iframe below</strong>. 
                    You must click the <strong>Launch Host Workspace (New Tab)</strong> button above, then click <strong>"Log-in"</strong> on the Jitsi page to authenticate (with Google, GitHub, or Facebook) and start the meeting.
                  </p>
                </div>

                <div className="p-3 bg-white border border-indigo-100 rounded-xl space-y-1">
                  <span className="font-bold text-[10px] text-indigo-700 block uppercase tracking-wider">👉 How to Approve / Accept Students:</span>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[10px]">
                    <li>In the new Jitsi tab, click the <strong>Security Shield</strong> icon on the bottom right.</li>
                    <li>Toggle on <strong>Enable Lobby Mode</strong>. Students will now have to "knock" to enter.</li>
                    <li>Whenever students try to join, a prompt will pop up in your workspace allowing you to <strong>Grant Entry</strong> or <strong>Reject</strong> them!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 text-slate-500 rounded-2xl flex items-center gap-3">
            <Tv className="w-6 h-6 text-slate-400 shrink-0" />
            <div>
              <span className="bg-slate-500 text-white font-mono font-black text-[9px] px-2 py-0.5 rounded">OFFLINE</span>
              <h4 className="font-bold text-sm mt-1">Broadcast Studio is currently Idle</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Students are currently study at their own sequential pace.</p>
            </div>
          </div>
        )}

        {broadcastingStatus && (
          <div className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl font-mono">
            ℹ️ Status: {broadcastingStatus}
          </div>
        )}

        {/* Cast Configuration Form */}
        <div className="space-y-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-200">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest block">Webinar Settings</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase block">Active Webinar Topic</label>
              <input 
                type="text" 
                placeholder="e.g. Masterclass: Conversion Metrics Breakdown"
                value={webinarTopic}
                onChange={(e) => setWebinarTopic(e.target.value)}
                disabled={isWebinarLive}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-950 focus:outline-none disabled:opacity-75 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-500 uppercase block">Webinar Class URL</label>
                {!isWebinarLive && (
                  <button 
                    type="button"
                    onClick={handleGenerateWebinarMeetLink}
                    className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    Generate Meet Link
                  </button>
                )}
              </div>
              <input 
                type="url" 
                placeholder="e.g. https://meet.jit.si/cohort-broadcast"
                value={webinarUrl}
                onChange={(e) => setWebinarUrl(e.target.value)}
                disabled={isWebinarLive}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-950 focus:outline-none disabled:opacity-75 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* STUDY MATERIAL CAST dropdown */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-black text-indigo-600 uppercase block flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                Cast Live Study Material (Real-time Sync)
              </label>
              <select
                value={castedLessonId}
                onChange={(e) => handleUpdateCastedLesson(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold cursor-pointer"
              >
                <option value="">❌ No Study Material Casted (Idle)</option>
                {courseModules.map((mod) => (
                  <optgroup key={mod.id} label={mod.title}>
                    {mod.lessons.map(les => (
                      <option key={les.id} value={les.id}>{les.title}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="text-[9px] text-slate-400 leading-tight mt-1">Casting a lesson instantly updates all attending students' Classroom dashboard to display this lesson's slides and guidelines side-by-side with your webcam.</p>
            </div>

            {/* SCREEN SHARER CONTROLLER */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block">Media Stream Feed</label>
                <p className="text-[9px] text-slate-400 leading-tight mt-0.5">Your camera, microphone, and screen sharing are handled natively within the broadcast monitor below. Ensure the webinar is live to begin presenting.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-slate-100 justify-end">
            {isWebinarLive ? (
              <button
                type="button"
                onClick={handleStopWebinar}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs sm:text-sm transition shadow-md shadow-rose-100 cursor-pointer"
              >
                Terminate Active Webinar Live Session
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartWebinar}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs sm:text-sm transition shadow-md shadow-rose-100 flex items-center gap-1.5 cursor-pointer"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                Launch Webinar & Broadcast
              </button>
            )}
          </div>
        </div>

        {/* Local Screen Share Preview Screen */}
        <div className="space-y-2 p-4 bg-slate-950 rounded-2xl text-left">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span>📺 BROADCAST MONITOR VIEW (LOCAL PREVIEW)</span>
            <div className="flex items-center gap-3">
              {isWebinarLive && webinarUrl && (
                <a
                  href={webinarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 underline font-black"
                >
                  Open in New Tab ↗
                </a>
              )}
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isWebinarLive ? "bg-emerald-500 animate-ping" : "bg-slate-600"}`}></span>
                {isWebinarLive ? "STREAM ACTIVE" : "PREVIEW OFFLINE"}
              </span>
            </div>
          </div>
          
          {(() => {
            const activeCastedLesson = isWebinarLive && castedLessonId 
              ? courseModules.flatMap(m => m.lessons).find(l => l.id === castedLessonId)
              : null;
              
            return (
              <div className={`grid gap-4 ${activeCastedLesson ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                <div className={`bg-black rounded-xl overflow-hidden relative flex items-center justify-center text-slate-500 text-xs border border-slate-800 ${activeCastedLesson ? 'aspect-[4/3]' : 'aspect-video'}`}>
                  {isWebinarLive && webinarUrl ? (
                    <iframe
                      allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                      src={getJitsiUrl(webinarUrl, "Instructor Mike")}
                      className="w-full h-full border-0"
                      title="Webinar Broadcast Studio"
                    />
                  ) : (
                    <div className="text-center space-y-2 p-6">
                      <Laptop className="w-10 h-10 mx-auto text-slate-700" />
                      <p className="font-bold">Webinar is currently offline.</p>
                      <p className="text-[10px] text-slate-600 max-w-xs mx-auto">Launch the webinar above to start streaming your camera and screen.</p>
                    </div>
                  )}
                </div>
                
                {activeCastedLesson && (
                  <div className="bg-slate-900 rounded-xl overflow-y-auto max-h-[500px] border border-slate-800 p-5 text-slate-300 relative shadow-inner flex flex-col min-h-[300px]">
                    <div className="sticky top-0 bg-slate-900 pb-3 border-b border-slate-800 mb-4 flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center z-10">
                      <h4 className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                        <Layers className="w-4 h-4" /> 
                        Teaching Reference
                      </h4>
                      <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded uppercase tracking-widest">
                        Casting to Students
                      </span>
                    </div>
                    
                    <h2 className="text-2xl font-black text-white mb-4">{activeCastedLesson.title}</h2>
                    
                    <div className="space-y-4 text-sm leading-relaxed text-slate-300 pb-6">
                      {activeCastedLesson.markdownContent.split("\n\n").map((block, idx) => {
                        if (block.startsWith("# ")) {
                          return <h3 key={idx} className="text-xl font-bold text-white mt-6 mb-2">{block.replace("# ", "")}</h3>;
                        } else if (block.startsWith("## ")) {
                          return <h4 key={idx} className="text-lg font-bold text-slate-100 mt-5 mb-2">{block.replace("## ", "")}</h4>;
                        } else if (block.startsWith("### ")) {
                          return <h5 key={idx} className="text-base font-bold text-slate-200 mt-4 mb-2">{block.replace("### ", "")}</h5>;
                        } else if (block.startsWith("- ")) {
                          return (
                            <ul key={idx} className="list-disc pl-5 space-y-1 mb-4 marker:text-indigo-500">
                              {block.split("\n").map((item, i) => (
                                <li key={i}>{item.replace("- ", "")}</li>
                              ))}
                            </ul>
                          );
                        } else if (block.startsWith("> ")) {
                          return (
                            <blockquote key={idx} className="border-l-4 border-indigo-500 pl-4 py-1 my-4 bg-indigo-950/30 italic text-slate-300 rounded-r-lg">
                              {block.replace("> ", "")}
                            </blockquote>
                          );
                        }
                        return <p key={idx} className="mb-4">{block}</p>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

    </div>
  );
}

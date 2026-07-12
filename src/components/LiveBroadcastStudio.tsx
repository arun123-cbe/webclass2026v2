import React, { useState, useEffect } from "react";
import { 
  Video, 
  Send, 
  Layers, 
  Trash2, 
  Sparkles, 
  Check, 
  ExternalLink,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { Student, CourseModule, LiveMeeting } from "../types";
import { db } from "../lib/firebase";
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

const DEFAULT_GOOGLE_MEET = "https://meet.google.com/eew-wapz-krt";
const DEFAULT_JITSI = "https://meet.jit.si/csdg-digital-growth-cohort";

// Smart URL formatting helper
const formatMeetingUrl = (url: string, provider: "google" | "jitsi"): string => {
  const cleanVal = url.trim();
  const meetIdRegex = /^[a-zA-Z]{3}-[a-zA-Z]{4}-[a-zA-Z]{3}$/;
  const meetIdNoHyphensRegex = /^[a-zA-Z]{10}$/;

  if (provider === "google") {
    if (meetIdRegex.test(cleanVal)) {
      return `https://meet.google.com/${cleanVal.toLowerCase()}`;
    } else if (meetIdNoHyphensRegex.test(cleanVal)) {
      const formatted = `${cleanVal.substring(0, 3)}-${cleanVal.substring(3, 7)}-${cleanVal.substring(7)}`;
      return `https://meet.google.com/${formatted.toLowerCase()}`;
    }
  } else {
    const pureRoomRegex = /^[a-zA-Z0-9_-]+$/;
    if (pureRoomRegex.test(cleanVal) && !cleanVal.includes(".") && !cleanVal.startsWith("http")) {
      return `https://meet.jit.si/${cleanVal}`;
    }
  }
  return cleanVal;
};

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
  const [meetingUrl, setMeetingUrl] = useState(DEFAULT_GOOGLE_MEET);
  const [meetingProvider, setMeetingProvider] = useState<"google" | "jitsi">("google");
  const [targetType, setTargetType] = useState<"batch" | "student">("batch");
  const [targetStudent, setTargetStudent] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [dispatchedSuccess, setDispatchedSuccess] = useState(false);

  // Casting & Poll states
  const [castedLessonId, setCastedLessonId] = useState("");
  const [broadcastingStatus, setBroadcastingStatus] = useState("");
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

  // Fetch all dispatched meetings and live class state
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
        setCastedLessonId(data.castedLessonId || "");
        setActiveQuestion(data.activeQuestion || null);
      }
    });

    return () => {
      unsubscribe();
      liveUnsubscribe();
    };
  }, []);

  // Listen to student responses in real-time
  useEffect(() => {
    const q = query(collection(db, "live_class_responses"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setLiveResponses(list);
    });
    return () => unsubscribe();
  }, []);

  // Generate realistic meet link
  const handleGenerateMeetLink = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    if (meetingProvider === "google") {
      const segment1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      const segment2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      const segment3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      setMeetingUrl(`https://meet.google.com/${segment1}-${segment2}-${segment3}`);
    } else {
      const segment = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      setMeetingUrl(`https://meet.jit.si/csdg-cohort-room-${segment}`);
    }
  };

  // Dispatch interactive meeting
  const handleDispatchMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim() || !meetingUrl.trim()) return;

    try {
      const formattedUrl = formatMeetingUrl(meetingUrl, meetingProvider);
      const newMeeting = {
        title: meetingTitle.trim(),
        url: formattedUrl,
        provider: meetingProvider,
        targetType,
        targetStudentEmail: targetType === "student" ? targetStudent : "",
        createdAt: new Date().toISOString(),
        active: true,
        date: meetingDate || null,
        time: meetingTime || null
      };

      await addDoc(collection(db, "meetings"), newMeeting);
      
      setMeetingTitle("");
      setMeetingUrl(meetingProvider === "google" ? DEFAULT_GOOGLE_MEET : DEFAULT_JITSI);
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

  // Update Casted Lesson selection in real-time
  const handleUpdateCastedLesson = async (lessonId: string) => {
    setCastedLessonId(lessonId);
    try {
      await setDoc(doc(db, "config", "live_class"), {
        castedLessonId: lessonId
      }, { merge: true });
      if (lessonId) {
        setBroadcastingStatus(`Casting Lesson "${lessonId}" active. Attending students' view has been synchronized.`);
      } else {
        setBroadcastingStatus("Casting cleared.");
      }
    } catch (err) {
      console.error("Error casting lesson: ", err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start text-left" id="live-studio-grid">
      
      {/* LEFT COLUMN: DISPATCH & MANAGE MEETING LINKS */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6" id="meeting-dispatcher-card">
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

        {/* CAST LIVE STUDY MATERIAL (REAL-TIME SYNC) */}
        <div className="p-4 bg-indigo-50/50 border border-indigo-100/80 rounded-2xl space-y-2.5 text-left">
          <label className="text-[10px] font-black text-indigo-700 uppercase block flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            Cast Live Study Material (Real-time Sync)
          </label>
          <select
            value={castedLessonId}
            onChange={(e) => handleUpdateCastedLesson(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold cursor-pointer focus:outline-none"
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
          <p className="text-[9px] text-slate-500 leading-tight">
            Casting a lesson instantly updates all attending students' Classroom dashboard to display this lesson's slides and guidelines in real-time.
          </p>
        </div>

        {broadcastingStatus && (
          <div className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl font-mono">
            ℹ️ Status: {broadcastingStatus}
          </div>
        )}

        {/* Meeting Form */}
        <form onSubmit={handleDispatchMeeting} className="space-y-4">
          {/* MEETING PROVIDER SELECTOR */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-500 uppercase block">Meeting Platform / Provider</label>
              <button
                type="button"
                onClick={() => {
                  setMeetingUrl(meetingProvider === "google" ? DEFAULT_GOOGLE_MEET : DEFAULT_JITSI);
                }}
                className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-100 px-2 py-0.5 rounded shadow-sm"
              >
                Reset to Default School Room
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMeetingProvider("google");
                  setMeetingUrl(DEFAULT_GOOGLE_MEET);
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  meetingProvider === "google"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm font-extrabold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${meetingProvider === "google" ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`}></span>
                Google Meet Portal
              </button>
              <button
                type="button"
                onClick={() => {
                  setMeetingProvider("jitsi");
                  setMeetingUrl(DEFAULT_JITSI);
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  meetingProvider === "jitsi"
                    ? "bg-indigo-50 border-indigo-300 text-indigo-800 shadow-sm font-extrabold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${meetingProvider === "jitsi" ? "bg-indigo-500 animate-pulse" : "bg-slate-400"}`}></span>
                Jitsi (Embedded Frame)
              </button>
            </div>
          </div>

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
                Generate Dynamic URL
              </button>
            </div>
            <input 
              type="text" 
              placeholder={meetingProvider === "google" ? "Enter Google Meet Link or 10-char ID (e.g. eew-wapz-krt)" : "Enter Jitsi Link or Room Name"}
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              onBlur={() => setMeetingUrl(formatMeetingUrl(meetingUrl, meetingProvider))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-50 font-mono"
              required
            />
            <p className="text-[9px] text-slate-400 mt-0.5 leading-normal">
              💡 Pre-filled with standard school permanent room. Click <strong>Generate Dynamic URL</strong> above for a unique, randomized link. You can also paste just the Google Meet ID (e.g., <code>eew-wapz-krt</code>) and it will resolve automatically!
            </p>
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
                      {/* PLATFORM BADGE */}
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                        meet.provider === "jitsi" || meet.url.includes("meet.ffmuc.net") || meet.url.includes("meet.jit.si") ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}>
                        {meet.provider === "jitsi" || meet.url.includes("meet.ffmuc.net") || meet.url.includes("meet.jit.si") ? "Jitsi" : "Google Meet"}
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
      </div>

      {/* RIGHT COLUMN: REAL-TIME ENGAGEMENT & POLLS */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6" id="live-engagement-card">
        <div>
          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[9px] font-black rounded uppercase tracking-wider font-mono">
            ⚡ Live Engagement Hub
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 mt-1">
            <HelpCircle className="w-5 h-5 text-rose-500" />
            Lecture Polls & Instant Questions
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Keep students engaged by pushing an instant question or poll to their active live class screens. Monitor their responses in real-time as they submit answers!
          </p>
        </div>

        {activeQuestion && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-xl text-xs font-bold flex items-center justify-between animate-pulse">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Active Question Live on Student Dashboards
            </span>
            <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase font-mono tracking-wider">
              Voting Open
            </span>
          </div>
        )}

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
              <p className="text-[10px] text-indigo-600 font-bold text-center font-mono">
                💡 Tip: You can launch instant polls anytime during dispatched meetings or classes!
              </p>
            </div>
          </div>
        ) : (
          // Active Question Display & Live Results for Trainer
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div className="border-b border-slate-200 pb-3 flex justify-between items-start gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                  📢 BROADCASTING INSTANT QUESTION
                </span>
                <h5 className="font-extrabold text-sm text-slate-900 leading-snug">{activeQuestion.questionText}</h5>
              </div>
              <button
                type="button"
                onClick={handleClearQuestion}
                className="px-3 py-1 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold rounded-lg text-xs transition shrink-0 cursor-pointer border border-slate-200"
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
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
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
            <div className="pt-3 border-t border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                👤 Submissions Feed
              </span>
              
              {liveResponses.filter(r => r.questionId === activeQuestion.id).length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">Waiting for attending students to vote...</p>
              ) : (
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {liveResponses.filter(r => r.questionId === activeQuestion.id).map((res: any) => (
                    <div key={res.id} className="flex justify-between items-center text-[11px] py-1 border-b border-slate-100">
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
  );
}

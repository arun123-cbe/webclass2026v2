import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, 
  CheckCircle, 
  Lock, 
  Award, 
  Download, 
  UserCheck, 
  LogOut, 
  Flame, 
  ChevronRight, 
  CheckSquare, 
  Clock, 
  Compass, 
  Layers, 
  ChevronDown,
  GraduationCap,
  ChevronUp,
  MessageSquare,
  Sparkles,
  PlayCircle,
  HelpCircle,
  Trophy,
  Activity,
  FileDown,
  Briefcase,
  Play,
  Pause,
  Video,
  Send,
  User,
  Star,
  RefreshCw,
  FolderClosed,
  Check,
  Users,
  Radio,
  LayoutDashboard,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { courseModules } from "./data";
import { Student, Lesson, Resource, CourseModule } from "./types";
import MarketingTools from "./components/MarketingTools";
import DiscussionForum from "./components/DiscussionForum";
import TrainerDashboard from "./components/TrainerDashboard";
import StudentDashboard from "./components/StudentDashboard";
import InAppMeetingRoom from "./components/InAppMeetingRoom";
import { getJitsiUrl } from "./lib/jitsi";
import { db, handleFirestoreError, OperationType } from "./lib/firebase";
import { doc, setDoc, getDoc, onSnapshot, collection, query, where, orderBy } from "firebase/firestore";

// Define the 8 mandatory stages of a lesson workflow
const LESSON_STAGES = [
  { id: "attend-live", label: "Attend Live Class", icon: Video, description: "Participate in the live campaign briefing webinar." },
  { id: "watch-recording", label: "Watch Class Recording", icon: PlayCircle, description: "Review class highlights and lecture slides." },
  { id: "study-notes", label: "Study Notes & Guides", icon: BookOpen, description: "Read lesson materials and download curated templates." },
  { id: "practice", label: "Practice Real-World Exercise", icon: Compass, description: "Use the live practice sandbox to simulate marketing operations." },
  { id: "submit-assignment", label: "Submit Assignment", icon: CheckSquare, description: "Draft and upload your lesson assignment." },
  { id: "complete-quiz", label: "Complete Quiz Checkpoint", icon: HelpCircle, description: "Score 80% or higher on the knowledge check." },
  { id: "instructor-review", label: "AI Feedback & Review", icon: Sparkles, description: "Submit your work for instant instructor/AI feedback." },
  { id: "portfolio-approve", label: "Receive Certification", icon: Award, description: "Get your work approved and saved into your professional portfolio." }
];

// Tailored homework prompts for each lesson
const ASSIGNMENT_PROMPTS: Record<string, { title: string; prompt: string; placeholder: string }> = {
  "lesson-1-1": {
    title: "AARRR Funnel Optimization & Financial Model",
    prompt: "Design a direct-response funnel campaign outline. Specify your target business offering, ad budget, target CPC, expected Landing Page Conversion Rate, and Average Order Value (AOV). Show your estimated ROI calculation, and outline one specific strategy to optimize the Acquisition stage (driving higher clicks) and the Activation stage (converting clicks into signups/leads).",
    placeholder: "Example: My product is a sustainable bamboo water bottle subscription. Ad Budget: $1,000, Target CPC: $0.80, expected CR: 3%, AOV: $45. I will optimize Acquisition by targeting eco-conscious groups on Meta, and Activation by offering a free 'Hydration Impact Checklist' guide on the landing page..."
  },
  "lesson-1-2": {
    title: "Organic SEO Campaign Outline & Meta Tag Drafting",
    prompt: "Choose a product or service. Write an optimized Meta Title (under 60 characters, starts with your main target keyword, benefit-focused) and a compelling Meta Description (under 160 characters, contains keyword and a clear CTA). Additionally, outline three H2 sections for a blog article designed to organically rank and attract high-transactional search intent.",
    placeholder: "Example: Product: Professional Bookkeeping Software. Meta Title: Bookkeeping Software for Startups | Automate Your Finances. Meta Description: Streamline your company accounts with our secure bookkeeping software. Try it free for 14 days and save 10 hours a week!..."
  },
  "lesson-2-1": {
    title: "Ideal Customer Profile & Buyer Persona Design",
    prompt: "Develop a detailed Buyer Persona for a business offering of your choice. Outline: 1) A demographic sketch (fictional name, age, job title, estimated income, location). 2) A psychographic sketch (their major professional/personal goal, interests, values). 3) Their primary pain point or frustration. 4) Their biggest objection to buying your product. 5) The best marketing channel to reach them and why.",
    placeholder: "Example: Persona: Freelancer Fiona. Age: 29. Job: Independent Graphic Designer. Income: $55k. Goal: Streamline client invoicing to save time. Pain point: Spending 5+ hours on weekends sending invoices manually. Major objection: Is it too complex to set up? Channel: LinkedIn (professional network)..."
  },
  "lesson-2-2": {
    title: "PAS & AIDA Ad Copy Variations",
    prompt: "Select a product and draft two high-converting digital advertising copy variations: 1) One social media ad (e.g., Meta/Instagram) utilizing the PAS (Problem - Agitate - Solve) copy framework. 2) One search engine ad (e.g., Google Ads) or email newsletter copy utilizing the AIDA (Attention - Interest - Desire - Action) copywriting framework.",
    placeholder: "Example: PAS Copy:\nProblem: Still struggling with manual bookkeeping?\nAgitate: Wasting precious weekends on receipts instead of growing your brand is draining your energy...\nSolve: Bookkeeply automates invoicing in 1 click...\n\nAIDA Copy:\nAttention: Save 10 Hours of Accounting Every Week!..."
  }
};

export default function App() {
  // Core App states
  const [modules, setModules] = useState<CourseModule[]>(courseModules);
  const [categories, setCategories] = useState<string[]>(["Digital Marketing", "Data Science"]);
  const [enrollCategory, setEnrollCategory] = useState<string>("Digital Marketing");
  const [isTrainerMode, setIsTrainerMode] = useState<boolean>(false);
  const [isTrainer, setIsTrainer] = useState<boolean>(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string>("lesson-1-1");
  const [castedNotice, setCastedNotice] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    "module-1": true,
    "module-2": true
  });

  // Filter modules based on student's selected category
  const studentModules = student
    ? modules.filter((m) => (m.category || "Digital Marketing") === (student.courseCategory || "Digital Marketing"))
    : modules;

  // Course structure flats with guaranteed resource sheets
  const allLessons = studentModules.flatMap((m) => m.lessons).map((lesson) => {
    let resources: Resource[] = lesson.resources || [];
    if (resources.length === 0) {
      resources = [
        {
          id: `res-${lesson.id}-default`,
          title: `${lesson.title.replace(/^\d+(\.\d+)?\s*/, "")} Companion Sheet`,
          type: "Worksheet",
          filename: `${lesson.id.replace(/-/g, "_")}_companion_worksheet.md`,
          content: `# ${lesson.title} - Learning Companion Sheet\n\n## Overview\nThis official worksheet supports the curriculum unit "${lesson.title}".\n\n## Core Key Insights\n1. Deconstruct concepts through daily self-auditing and testing.\n2. Keep loops small and feedback channels fast.\n3. Implement strategies in a sandboxed staging environment before pushing to live.\n\n## Action Steps\n- Step 1: Read the high-yield class recording summary notes.\n- Step 2: Complete the simulation sandbox exercise inside your trainer toolkit.\n- Step 3: Grade your quiz with a score >= 80%.\n- Step 4: Submit a detailed campaign strategy blueprint for personalized peer/AI evaluation.`
        }
      ];
    } else {
      resources = resources.map((res) => {
        if (!res.content || res.content.trim().length === 0) {
          return {
            ...res,
            content: `# ${res.title}\n\nThis companion worksheet supports the study unit: ${lesson.title}.\nFilename: ${res.filename}`
          };
        }
        return res;
      });
    }
    return {
      ...lesson,
      resources
    };
  });

  // Load custom curriculum from Firestore config
  useEffect(() => {
    const loadCurriculum = async () => {
      try {
        const docSnap = await getDoc(doc(db, "config", "curriculum"));
        let finalModules = courseModules;
        let finalCategories = categories;
        let needsUpdate = false;

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.modules) {
            // Check if we need to sync local courseModules to Firestore
            // e.g. if local has more modules than firestore, or some local modules are missing from firestore
            const firestoreModuleIds = new Set(data.modules.map((m: any) => m.id));
            const hasMissingLocalModules = courseModules.some(m => !firestoreModuleIds.has(m.id));
            
            if (hasMissingLocalModules || courseModules.length > data.modules.length) {
              // Merge: keep custom modules from Firestore, but use/add all local courseModules
              const localModuleIds = new Set(courseModules.map(m => m.id));
              const customFirestoreModules = data.modules.filter((m: any) => !localModuleIds.has(m.id));
              finalModules = [...courseModules, ...customFirestoreModules];
              needsUpdate = true;
            } else {
              finalModules = data.modules;
            }
          } else {
            needsUpdate = true;
          }

          if (data && data.categories) {
            finalCategories = data.categories;
          } else {
            needsUpdate = true;
          }
        } else {
          // If no doc exists, create it
          needsUpdate = true;
        }

        setModules(finalModules);
        
        // Expand all loaded modules in sidebar by default
        const newExpands: Record<string, boolean> = {};
        finalModules.forEach((mod: CourseModule) => {
          newExpands[mod.id] = true;
        });
        setExpandedModules(newExpands);

        if (needsUpdate) {
          console.log("Syncing updated curriculum with Firestore...");
          await setDoc(doc(db, "config", "curriculum"), {
            modules: finalModules,
            categories: finalCategories,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn("Could not sync curriculum from Firestore (offline or initial):", err);
      }
    };
    loadCurriculum();
  }, []);

  // Keep the active lesson matching the student's specialization
  useEffect(() => {
    if (student) {
      const studentCat = student.courseCategory || "Digital Marketing";
      const catModules = modules.filter((m) => (m.category || "Digital Marketing") === studentCat);
      const catLessons = catModules.flatMap((m) => m.lessons);
      if (catLessons.length > 0) {
        // If current activeLessonId is not in the student's lessons, reset it to the first lesson of their track
        if (!catLessons.some((l) => l.id === activeLessonId)) {
          setActiveLessonId(catLessons[0].id);
        }
      }
    }
  }, [student, modules, activeLessonId]);

  // Live Class Webinar broadcast state
  const [liveClass, setLiveClass] = useState<{
    active: boolean;
    topic: string;
    meetingUrl: string;
    castedLessonId: string;
    screenSharingActive: boolean;
    startedAt: string;
    trainerName: string;
    activeQuestion?: {
      id: string;
      questionText: string;
      options: string[];
      correctAnswer: number;
      initiatedAt: string;
    } | null;
  } | null>(null);

  // Active question response from current student
  const [activeQuestionResponse, setActiveQuestionResponse] = useState<any>(null);

  // Dispatched personal/batch meeting links
  const [studentMeetings, setStudentMeetings] = useState<any[]>([]);
  const [student1on1Meetings, setStudent1on1Meetings] = useState<any[]>([]);

  // In-App Meeting states
  const [activeInAppMeetingUrl, setActiveInAppMeetingUrl] = useState<string | null>(null);
  const [activeInAppMeetingTitle, setActiveInAppMeetingTitle] = useState<string | null>(null);

  // Listen to the active webinar broadcast
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "config", "live_class"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLiveClass({
          active: data.active || false,
          topic: data.topic || "",
          meetingUrl: data.meetingUrl || "",
          castedLessonId: data.castedLessonId || "",
          screenSharingActive: data.screenSharingActive || false,
          startedAt: data.startedAt || "",
          trainerName: data.trainerName || "",
          activeQuestion: data.activeQuestion || null
        });

        // Automatically switch student's active lesson if trainer is casting!
        if (data.active && data.castedLessonId && data.castedLessonId !== "none" && data.castedLessonId !== "") {
          setActiveLessonId(data.castedLessonId);
          setCastedNotice(data.castedLessonId);
          setTimeout(() => setCastedNotice(null), 5000);
        }
      } else {
        setLiveClass(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to student's response to the active question in real-time
  useEffect(() => {
    if (!student || !liveClass?.activeQuestion?.id) {
      setActiveQuestionResponse(null);
      return;
    }
    const responseId = `${liveClass.activeQuestion.id}_${student.email}`;
    const unsubscribe = onSnapshot(doc(db, "live_class_responses", responseId), (docSnap) => {
      if (docSnap.exists()) {
        setActiveQuestionResponse(docSnap.data());
      } else {
        setActiveQuestionResponse(null);
      }
    });
    return () => unsubscribe();
  }, [student, liveClass?.activeQuestion?.id]);

  // Listen to personal or batch-wide meeting links
  useEffect(() => {
    if (!student) {
      setStudentMeetings([]);
      setStudent1on1Meetings([]);
      return;
    }

    const q = query(collection(db, "meetings"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.active) {
          if (data.targetType === "batch" || data.targetStudentEmail === student.email) {
            list.push({ id: doc.id, ...data });
          }
        }
      });
      setStudentMeetings(list);
    });

    const q2 = query(collection(db, "1on1_meetings"), where("studentId", "==", student.id));
    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setStudent1on1Meetings(list);
    });

    return () => {
      unsubscribe();
      unsubscribe2();
    };
  }, [student]);

  // Reminder System - checks upcoming meetings
  useEffect(() => {
    if (!student) return;
    
    const checkReminders = () => {
      const now = new Date().getTime();
      let triggered = false;

      // Check 1-on-1s
      student1on1Meetings.forEach(meet => {
        if (meet.date && meet.time) {
          const meetTime = new Date(`${meet.date}T${meet.time}`).getTime();
          const diffMs = meetTime - now;
          const diffMins = diffMs / 1000 / 60;
          if (diffMins > 0 && diffMins <= 15) {
            setActiveReminder({ title: meet.title, type: "1-on-1 Consultation" });
            triggered = true;
          }
        }
      });

      // Check Live Batch Meetings
      studentMeetings.forEach(meet => {
        if (meet.date && meet.time) {
          const meetTime = new Date(`${meet.date}T${meet.time}`).getTime();
          const diffMs = meetTime - now;
          const diffMins = diffMs / 1000 / 60;
          if (diffMins > 0 && diffMins <= 15) {
            setActiveReminder({ title: meet.title, type: "Live Class" });
            triggered = true;
          }
        }
      });

      if (!triggered) {
        setActiveReminder(null);
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [student, student1on1Meetings, studentMeetings]);

  // Top navigation tabs: "dashboard" | "classroom" | "portfolio" | "capstone"
  const [activeTab, setActiveTab] = useState<"dashboard" | "classroom" | "portfolio" | "capstone">("dashboard");
  
  const [activeReminder, setActiveReminder] = useState<{ title: string; type: string } | null>(null);

  // Profile Form state (for enrollment)
  const [enrollName, setEnrollName] = useState("");
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollGoal, setEnrollGoal] = useState("Start a career in digital marketing");
  const [enrolling, setEnrolling] = useState(false);

  // Classroom Live Chat simulation states
  const [liveChatMessages, setLiveChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: "Instructor Mike", text: "Welcome to today's live strategy briefing! We're about to start.", time: "10:00 AM" },
    { sender: "Alex S.", text: "Excited to design my first ROI campaign plan!", time: "10:01 AM" }
  ]);
  const [liveChatInput, setLiveChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Classroom Video simulation states
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(25); // percentage

  // Assignment text states
  const [assignmentDraft, setAssignmentDraft] = useState("");

  // Quiz States
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({}); // questionId -> optionIndex
  const [quizGraded, setQuizGraded] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // AI evaluation states
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Capstone project state
  const [capstoneResponse, setCapstoneResponse] = useState("");
  const [submittingCapstone, setSubmittingCapstone] = useState(false);
  const [capstoneError, setCapstoneError] = useState<string | null>(null);

  // Check if student has downloaded a resource in the current session
  const [hasDownloadedInSession, setHasDownloadedInSession] = useState(false);

  // Load enrolled session from localStorage on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const qMeetingUrl = urlParams.get("meetingUrl");
    const qMeetingTitle = urlParams.get("meetingTitle");
    const qStudentName = urlParams.get("studentName");
    const qStudentEmail = urlParams.get("studentEmail");
    const qIsTrainer = urlParams.get("isTrainer");

    let isTrainerFromUrl = false;
    if (qMeetingUrl && qMeetingTitle) {
      setActiveInAppMeetingUrl(qMeetingUrl);
      setActiveInAppMeetingTitle(qMeetingTitle);
      
      if (qIsTrainer === "true") {
        setIsTrainer(true);
        isTrainerFromUrl = true;
      }
      
      if (qStudentName && qStudentEmail) {
        const urlStudent = {
          id: `student_${qStudentEmail.replace(/[^a-zA-Z0-9]/g, "_")}`,
          name: qStudentName,
          email: qStudentEmail,
          courseCategory: "Digital Marketing",
          goal: "Join meeting room via direct link",
          enrolledAt: new Date().toISOString(),
          progress: {}
        };
        setStudent(urlStudent);
      }
    }

    const savedSession = localStorage.getItem("marketing_student_session");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (!qStudentEmail) {
          setStudent(parsed);
          syncStudentFromFirestore(parsed.email, parsed);
        }
        
        if (!isTrainerFromUrl) {
          getDoc(doc(db, "trainers", parsed.email.toLowerCase())).then(snap => {
            setIsTrainer(snap.exists() || parsed.email.toLowerCase() === 'gouthamarun123@gmail.com' || parsed.email.toLowerCase().includes('admin') || parsed.email.toLowerCase().includes('mike'));
          }).catch(() => setIsTrainer(parsed.email.toLowerCase() === 'gouthamarun123@gmail.com' || parsed.email.toLowerCase().includes('admin') || parsed.email.toLowerCase().includes('mike')));
        }
      } catch (e) {
        console.error("Error reading saved session:", e);
      }
    }
  }, []);

  // Sync state changes to scrollable chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [liveChatMessages]);

  const syncStudentFromFirestore = async (email: string, localProfile: Student) => {
    if (!email) return;
    const path = `students/${email.toLowerCase()}`;
    try {
      const studentRef = doc(db, "students", email.toLowerCase());
      let docSnap;
      try {
        docSnap = await getDoc(studentRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
      if (docSnap.exists()) {
        const dbData = docSnap.data() as Student;
        const merged: Student = {
          ...localProfile,
          progress: { ...localProfile.progress, ...dbData.progress },
          quizScores: { ...localProfile.quizScores, ...dbData.quizScores },
          lessonStages: dbData.lessonStages || localProfile.lessonStages || {},
          assignments: dbData.assignments || localProfile.assignments || {},
          portfolio: dbData.portfolio || localProfile.portfolio || [],
          capstoneSubmitted: dbData.capstoneSubmitted || localProfile.capstoneSubmitted || false,
          capstoneResponse: dbData.capstoneResponse || localProfile.capstoneResponse || "",
          capstoneFeedback: dbData.capstoneFeedback || localProfile.capstoneFeedback || undefined
        };
        setStudent(merged);
        localStorage.setItem("marketing_student_session", JSON.stringify(merged));
      }
    } catch (err) {
      console.warn("Could not sync from Firestore (offline or initial load):", err);
    }
  };

  const handleEnroll = async (e?: React.FormEvent, directName?: string, directEmail?: string) => {
    if (e) e.preventDefault();
    const nameToUse = directName || enrollName;
    const emailToUse = directEmail || enrollEmail;
    
    if (!nameToUse.trim() || !emailToUse.trim()) return;
    setEnrolling(true);

    const emailKey = emailToUse.toLowerCase().trim();
    const newStudent: Student = {
      id: emailKey,
      name: nameToUse.trim(),
      email: emailKey,
      enrolledAt: new Date().toISOString(),
      progress: { "lesson-1-1": false }, // starts incomplete
      quizScores: {},
      lessonStages: { "lesson-1-1": [] },
      assignments: {},
      portfolio: [],
      courseCategory: enrollCategory
    };

    const path = `students/${emailKey}`;
    try {
      const studentRef = doc(db, "students", emailKey);
      let docSnap;
      try {
        docSnap = await getDoc(studentRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
      let studentToSave = newStudent;
      
      if (docSnap?.exists()) {
        const existingData = docSnap.data() as Student;
        studentToSave = {
          ...existingData,
          name: nameToUse.trim(),
          courseCategory: existingData.courseCategory || enrollCategory
        };
      } else {
        try {
          await setDoc(studentRef, newStudent);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }

      setStudent(studentToSave);
      localStorage.setItem("marketing_student_session", JSON.stringify(studentToSave));
      
      try {
        const trainerSnap = await getDoc(doc(db, "trainers", emailKey));
        setIsTrainer(trainerSnap.exists() || emailKey === 'gouthamarun123@gmail.com' || emailKey.includes('admin') || emailKey.includes('mike'));
      } catch {
        setIsTrainer(emailKey === 'gouthamarun123@gmail.com' || emailKey.includes('admin') || emailKey.includes('mike'));
      }
    } catch (err) {
      console.error("Error enrolling:", err);
      setStudent(newStudent);
      localStorage.setItem("marketing_student_session", JSON.stringify(newStudent));
    } finally {
      setEnrolling(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("marketing_student_session");
    setStudent(null);
    setQuizAnswers({});
    setQuizGraded(false);
    setQuizScore(null);
    setActiveTab("dashboard");
    setIsTrainerMode(false);
    setIsTrainer(false);
  };

  // Helper: check completed stage IDs for a lesson
  const getCompletedStagesForLesson = (lessonId: string): string[] => {
    return student?.lessonStages?.[lessonId] || [];
  };

  const isStageCompleted = (lessonId: string, stageId: string): boolean => {
    return getCompletedStagesForLesson(lessonId).includes(stageId);
  };

  const getActiveStageForLesson = (lessonId: string): string => {
    const completed = getCompletedStagesForLesson(lessonId);
    for (const stage of LESSON_STAGES) {
      if (!completed.includes(stage.id)) {
        return stage.id;
      }
    }
    return "portfolio-approve"; // Everything completed
  };

  const skipLesson = async (lessonId: string) => {
    if (!student) return;

    const updatedSkipRequests = {
      ...(student.skipRequests || {}),
      [lessonId]: true
    };

    const updatedStudent: Student = {
      ...student,
      skipRequests: updatedSkipRequests
    };

    setStudent(updatedStudent);
    localStorage.setItem("marketing_student_session", JSON.stringify(updatedStudent));

    try {
      await setDoc(doc(db, "students", student.email), {
        skipRequests: updatedSkipRequests
      }, { merge: true });
    } catch (err) {
      console.warn("Could not save skip request to firestore:", err);
    }
  };

  const handleSubmitLiveAnswer = async (optionIndex: number) => {
    if (!student || !liveClass?.activeQuestion) return;
    const isCorrect = optionIndex === liveClass.activeQuestion.correctAnswer;
    const responseId = `${liveClass.activeQuestion.id}_${student.email}`;
    try {
      await setDoc(doc(db, "live_class_responses", responseId), {
        questionId: liveClass.activeQuestion.id,
        studentEmail: student.email,
        studentName: student.name,
        selectedOptionIndex: optionIndex,
        isCorrect,
        submittedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };

  const completeStage = async (lessonId: string, stageId: string) => {
    if (!student) return;
    
    setStudent((prevStudent) => {
      if (!prevStudent) return prevStudent;
      
      const currentCompleted = prevStudent.lessonStages?.[lessonId] || [];
      if (currentCompleted.includes(stageId)) return prevStudent;

      const updatedStages = {
        ...(prevStudent.lessonStages || {}),
        [lessonId]: [...currentCompleted, stageId]
      };

      let updatedProgress = { ...(prevStudent.progress || {}) };
      let updatedPortfolio = [...(prevStudent.portfolio || [])];

      // Mark the entire lesson completed if approved
      if (stageId === "portfolio-approve") {
        updatedProgress[lessonId] = true;
        
        // Copy assignment metadata to student portfolio list
        const assignment = prevStudent.assignments?.[lessonId];
        if (assignment) {
          const alreadyInPortfolio = updatedPortfolio.some(p => p.lessonId === lessonId);
          if (!alreadyInPortfolio) {
            updatedPortfolio.push({
              lessonId,
              lessonTitle: allLessons.find(l => l.id === lessonId)?.title || "Advanced Lesson",
              studentResponse: assignment.studentResponse,
              score: assignment.score || 85,
              feedback: assignment.feedback || "Excellent professional campaign strategy.",
              suggestions: assignment.suggestions || "Focus on scaling organic retention.",
              completedAt: new Date().toISOString()
            });
          }
        }
      }

      const updatedStudent: Student = {
        ...prevStudent,
        lessonStages: updatedStages,
        progress: updatedProgress,
        portfolio: updatedPortfolio
      };

      localStorage.setItem("marketing_student_session", JSON.stringify(updatedStudent));

      setDoc(doc(db, "students", prevStudent.email), {
        lessonStages: updatedStages,
        progress: updatedProgress,
        portfolio: updatedPortfolio
      }, { merge: true }).catch((err) => {
        console.warn("Could not sync stage completion to Firestore:", err);
      });

      return updatedStudent;
    });
  };

  // Lesson status helper
  const isLessonCompleted = (lessonId: string) => {
    return student?.progress?.[lessonId] || false;
  };

  // Lock status check (organized into sequential lessons)
  const isLessonLocked = (lessonId: string) => {
    const idx = allLessons.findIndex((l) => l.id === lessonId);
    if (idx === 0) return false; // First lesson is always open
    const prevLesson = allLessons[idx - 1];
    return !isLessonCompleted(prevLesson.id); // Locked if previous lesson is not completed
  };

  // Toggle active lesson
  const handleSelectLesson = (lessonId: string) => {
    if (isLessonLocked(lessonId)) return;
    setActiveLessonId(lessonId);
    setQuizAnswers({});
    setQuizGraded(false);
    setQuizScore(null);
    setHasDownloadedInSession(false);
    
    // Set draft from previous submit if exists
    const prevSubmission = student?.assignments?.[lessonId]?.studentResponse;
    setAssignmentDraft(prevSubmission || "");
  };

  // Explicitly unlock and select the next lesson, bypassing async state checks
  const handleUnlockAndSelectNextLesson = (currentLessonId: string, nextLessonId: string) => {
    if (!student) return;

    setStudent((prevStudent) => {
      if (!prevStudent) return prevStudent;

      const currentCompleted = prevStudent.lessonStages?.[currentLessonId] || [];
      const updatedStages = {
        ...(prevStudent.lessonStages || {}),
        [currentLessonId]: [...currentCompleted, "portfolio-approve"].filter((v, i, a) => a.indexOf(v) === i)
      };

      let updatedProgress = { 
        ...(prevStudent.progress || {}),
        [currentLessonId]: true 
      };
      
      let updatedPortfolio = [...(prevStudent.portfolio || [])];
      
      // Copy assignment metadata to student portfolio list
      const assignment = prevStudent.assignments?.[currentLessonId];
      if (assignment) {
        const alreadyInPortfolio = updatedPortfolio.some(p => p.lessonId === currentLessonId);
        if (!alreadyInPortfolio) {
          updatedPortfolio.push({
            lessonId: currentLessonId,
            lessonTitle: allLessons.find(l => l.id === currentLessonId)?.title || "Advanced Lesson",
            studentResponse: assignment.studentResponse,
            score: assignment.score || 85,
            feedback: assignment.feedback || "Excellent professional campaign strategy.",
            suggestions: assignment.suggestions || "Focus on scaling organic retention.",
            completedAt: new Date().toISOString()
          });
        }
      }

      const updatedStudent: Student = {
        ...prevStudent,
        lessonStages: updatedStages,
        progress: updatedProgress,
        portfolio: updatedPortfolio
      };

      localStorage.setItem("marketing_student_session", JSON.stringify(updatedStudent));

      setDoc(doc(db, "students", prevStudent.email), {
        lessonStages: updatedStages,
        progress: updatedProgress,
        portfolio: updatedPortfolio
      }, { merge: true }).catch((err) => {
        console.warn("Could not sync stage completion to Firestore:", err);
      });

      return updatedStudent;
    });

    // Directly set active lesson to the next one
    setActiveLessonId(nextLessonId);
    setQuizAnswers({});
    setQuizGraded(false);
    setQuizScore(null);
    setHasDownloadedInSession(false);
    
    // Reset inputs
    setReviewError(null);
    setReviewing(false);

    // Get next lesson's draft if any
    const nextSubmission = student?.assignments?.[nextLessonId]?.studentResponse;
    setAssignmentDraft(nextSubmission || "");
  };

  const activeLesson = allLessons.find((l) => l.id === activeLessonId) || allLessons[0];
  const activeStage = getActiveStageForLesson(activeLesson.id);

  // Classroom Live Chat Simulator Actions
  const handleSendLiveMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveChatInput.trim() || !student) return;
    
    const newMsg = {
      sender: student.name,
      text: liveChatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setLiveChatMessages([...liveChatMessages, newMsg]);
    setLiveChatInput("");

    // Simulate response after a delay
    setTimeout(() => {
      const responseMessages = [
        "Instructor Mike: Excellent point there! Keep exploring.",
        "Sarah P.: That makes full alignment with our BOFU strategy.",
        "Alex S.: Nice comment, I agree.",
        "Jordan K.: Let's apply this in our real-world exercise."
      ];
      const randomResponse = responseMessages[Math.floor(Math.random() * responseMessages.length)];
      setLiveChatMessages(prev => [...prev, {
        sender: randomResponse.split(":")[0],
        text: randomResponse.split(":").slice(1).join(":").trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  // Grade Quiz
  const handleAnswerChange = (questionId: string, optionIdx: number) => {
    if (quizGraded) return;
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: optionIdx
    });
  };

  const handleGradeQuiz = () => {
    if (!activeLesson.quiz) return;
    const questions = activeLesson.quiz.questions;
    let correctCount = 0;
    
    questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / questions.length) * 100);
    setQuizScore(finalScore);
    setQuizGraded(true);

    if (student) {
      setStudent((prevStudent) => {
        if (!prevStudent) return prevStudent;

        const updatedScores = {
          ...(prevStudent.quizScores || {}),
          [activeLesson.id]: finalScore
        };

        let updatedStages = prevStudent.lessonStages || {};
        if (finalScore >= 80) {
          const currentCompleted = prevStudent.lessonStages?.[activeLesson.id] || [];
          const newStages = ["complete-quiz"].filter(s => !currentCompleted.includes(s));
          updatedStages = {
            ...updatedStages,
            [activeLesson.id]: [...currentCompleted, ...newStages]
          };
        }

        const updatedStudent = {
          ...prevStudent,
          quizScores: updatedScores,
          lessonStages: updatedStages
        };

        localStorage.setItem("marketing_student_session", JSON.stringify(updatedStudent));

        const path = `students/${prevStudent.email}`;
        setDoc(doc(db, "students", prevStudent.email), { 
          quizScores: updatedScores,
          lessonStages: updatedStages
        }, { merge: true })
          .catch(err => {
            console.warn("Could not save score and stages to firestore:", err);
            try {
              handleFirestoreError(err, OperationType.UPDATE, path);
            } catch (e) {
              // Silently handled
            }
          });

        return updatedStudent;
      });
    }
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
    setQuizGraded(false);
    setQuizScore(null);
  };

  // Assignment Submit Handler
  const handleSubmitAssignment = async () => {
    if (!student || !assignmentDraft.trim() || assignmentDraft.trim().length < 50) return;

    const draftText = assignmentDraft.trim();
    const submissionTime = new Date().toISOString();

    setStudent((prevStudent) => {
      if (!prevStudent) return prevStudent;

      const updatedAssignments = {
        ...(prevStudent.assignments || {}),
        [activeLesson.id]: {
          studentResponse: draftText,
          submittedAt: submissionTime,
          approved: false
        }
      };

      const currentCompleted = prevStudent.lessonStages?.[activeLesson.id] || [];
      const newStages = ["submit-assignment"].filter(s => !currentCompleted.includes(s));
      const updatedStages = {
        ...(prevStudent.lessonStages || {}),
        [activeLesson.id]: [...currentCompleted, ...newStages]
      };

      const updatedStudent: Student = {
        ...prevStudent,
        assignments: updatedAssignments,
        lessonStages: updatedStages
      };

      localStorage.setItem("marketing_student_session", JSON.stringify(updatedStudent));

      setDoc(doc(db, "students", prevStudent.email), {
        assignments: updatedAssignments,
        lessonStages: updatedStages
      }, { merge: true }).catch((err) => {
        console.warn("Could not save assignment draft and stages to firestore:", err);
      });

      return updatedStudent;
    });
  };

  // Call Gemini to review digital marketing homework
  const handleRequestAIReview = async () => {
    if (!student) return;
    const assignment = student.assignments?.[activeLesson.id];
    if (!assignment) return;

    setReviewing(true);
    setReviewError(null);

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "assignment-review",
          payload: {
            lessonTitle: activeLesson.title,
            assignmentResponse: assignment.studentResponse
          }
        })
      });

      if (!response.ok) throw new Error("Failed to secure AI critique evaluation.");
      const data = await response.json(); // { score, approved, feedback, suggestions }

      const scoreValue = data.score || 85;
      const feedbackValue = data.feedback || "Solid performance metrics setup.";
      const suggestionsValue = data.suggestions || "Recommend analyzing long-term retention triggers.";
      const isApproved = data.approved !== false;

      setStudent((prevStudent) => {
        if (!prevStudent) return prevStudent;

        const updatedAssignments = {
          ...(prevStudent.assignments || {}),
          [activeLesson.id]: {
            ...assignment,
            score: scoreValue,
            feedback: feedbackValue,
            suggestions: suggestionsValue,
            approved: isApproved
          }
        };

        const currentCompleted = prevStudent.lessonStages?.[activeLesson.id] || [];
        const stagesToAdd = ["instructor-review"];
        if (isApproved) {
          stagesToAdd.push("portfolio-approve");
        }
        
        const newCompletedStages = [
          ...currentCompleted,
          ...stagesToAdd.filter(s => !currentCompleted.includes(s))
        ];

        const updatedStages = {
          ...(prevStudent.lessonStages || {}),
          [activeLesson.id]: newCompletedStages
        };

        let updatedProgress = { ...(prevStudent.progress || {}) };
        let updatedPortfolio = [...(prevStudent.portfolio || [])];

        if (isApproved) {
          updatedProgress[activeLesson.id] = true;
          
          const alreadyInPortfolio = updatedPortfolio.some(p => p.lessonId === activeLesson.id);
          if (!alreadyInPortfolio) {
            updatedPortfolio.push({
              lessonId: activeLesson.id,
              lessonTitle: activeLesson.title || "Advanced Lesson",
              studentResponse: assignment.studentResponse,
              score: scoreValue,
              feedback: feedbackValue,
              suggestions: suggestionsValue,
              completedAt: new Date().toISOString()
            });
          }
        }

        const updatedStudent: Student = {
          ...prevStudent,
          assignments: updatedAssignments,
          lessonStages: updatedStages,
          progress: updatedProgress,
          portfolio: updatedPortfolio
        };

        localStorage.setItem("marketing_student_session", JSON.stringify(updatedStudent));

        setDoc(doc(db, "students", prevStudent.email), {
          assignments: updatedAssignments,
          lessonStages: updatedStages,
          progress: updatedProgress,
          portfolio: updatedPortfolio
        }, { merge: true }).catch(err => {
          console.warn("Could not sync review completion to Firestore:", err);
        });

        return updatedStudent;
      });

    } catch (err: any) {
      console.error(err);
      setReviewError(err.message || "An issue occurred during AI evaluation. Please try again.");
    } finally {
      setReviewing(false);
    }
  };

  // Submit Final Capstone Strategy
  const handleCapstoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !capstoneResponse.trim() || capstoneResponse.trim().length < 100) return;

    setSubmittingCapstone(true);
    setCapstoneError(null);

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "capstone-review",
          payload: {
            capstoneResponse
          }
        })
      });

      if (!response.ok) throw new Error("Failed to evaluate capstone plan.");
      const data = await response.json();

      const feedbackData = {
        score: data.score || 90,
        feedback: data.feedback || "Outstanding multi-channel launch playbook.",
        suggestions: data.suggestions || "Verify cohort customer acquisition parameters.",
        approved: data.approved !== false,
        completedAt: new Date().toISOString()
      };

      const updatedStudent: Student = {
        ...student,
        capstoneSubmitted: true,
        capstoneResponse: capstoneResponse,
        capstoneFeedback: feedbackData
      };

      setStudent(updatedStudent);
      localStorage.setItem("marketing_student_session", JSON.stringify(updatedStudent));

      const path = `students/${student.email}`;
      await setDoc(doc(db, "students", student.email), {
        capstoneSubmitted: true,
        capstoneResponse: capstoneResponse,
        capstoneFeedback: feedbackData
      }, { merge: true });

    } catch (err: any) {
      console.error(err);
      setCapstoneError(err.message || "Failed to compile AI graduation evaluation.");
    } finally {
      setSubmittingCapstone(false);
    }
  };

  // Resource downloader
  const handleDownloadResource = (resource: Resource) => {
    try {
      const blob = new Blob([resource.content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = resource.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setHasDownloadedInSession(true);
    } catch (e) {
      console.error("Resource download failed", e);
    }
  };

  // Final Practitioner Diploma File Builder
  const handleDownloadCertificate = () => {
    if (!student) return;
    const certText = `
================================================================================
                    COIMBATORE SCHOOL OF DIGITAL & GROWTH
================================================================================

                         CERTIFICATE OF GRADUATION
                         
This proudly certifies that:
                        ${student.name.toUpperCase()}

has successfully fulfilled all rigorous practical training milestones, sequential
curriculum modules, and peer-reviewed assignments to graduate from the

                   ADVANCED DIGITAL MARKETING PRACTITIONER
                                MASTERCLASS

Acquired Core Capstone Competencies:
- AARRR Pirate Funnel Analytics & ROI Campaign Planning
- Search Engine Optimization (SEO) & Transactional Organic Rank Strategies
- Psychological Copywriting Frameworks (AIDA & PAS Modeling)
- Ideal Customer Profile (ICP) & Buyer Persona Synthesis

GRADUATION PERFORMANCE SUMMARY:
Syllabus Modules Completed: 4 / 4
Capstone Project Grade: ${student.capstoneFeedback?.score || 92}%
Digital Credentials Portfolio Validation Hash: dma-${student.email.substring(0, 5).toLowerCase()}-${Date.now()}
Date of Certification Issuance: ${new Date().toLocaleDateString()}

Authorized Registrar Signature:
Professor Michael Vance, Department of Growth Analytics
================================================================================
`;
    const blob = new Blob([certText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${student.name.toLowerCase().replace(/\s+/g, "_")}_marketing_certification.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Calculate Progress percentage
  const completedCount = allLessons.filter((l) => isLessonCompleted(l.id)).length;
  const progressPercent = Math.round((completedCount / allLessons.length) * 100);
  const allLessonsCompleted = allLessons.every((l) => isLessonCompleted(l.id));

  // Toggle Module Drawer
  const toggleModuleExpanded = (modId: string) => {
    setExpandedModules({
      ...expandedModules,
      [modId]: !expandedModules[modId]
    });
  };

  const renderVideoPlayer = (url: string) => {
    if (!url) return null;
    
    let embedUrl = url;
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    const isEmbeddable = embedUrl.includes("embed") || embedUrl.includes("player.vimeo.com") || embedUrl.includes("youtube.com") || embedUrl.includes("youtu.be");

    if (isEmbeddable) {
      return (
        <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-sm relative bg-black">
          <iframe 
            src={embedUrl}
            title="Syllabus Lecture Recording"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="no-referrer"
            className="w-full h-full absolute inset-0"
          />
        </div>
      );
    }

    return (
      <div className="w-full bg-slate-950 rounded-xl relative overflow-hidden flex flex-col justify-center items-center aspect-video border border-slate-200 shadow-sm">
        <video 
          src={url} 
          controls 
          className="w-full h-full rounded-xl"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans flex flex-col pb-12">
      {/* 1. TOP HEADER NAVIGATION */}
      <div className="w-full max-w-7xl mx-auto px-4 pt-6 z-50">
        <header id="app-header" className="bg-white rounded-[28px] border border-slate-100 shadow-sm px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-150">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h1 className="font-black text-xl leading-none text-slate-900 tracking-tight">Coimbatore School of Digital and Growth</h1>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1.5 font-mono">Sequential Practitioner Academy</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3.5 relative z-10">
            {isTrainer && (
              <button
                id="btn-switch-trainer"
                onClick={() => setIsTrainerMode(!isTrainerMode)}
                className={`px-4.5 py-2.5 rounded-2xl text-xs font-black tracking-tight transition-all duration-300 flex items-center gap-1.5 cursor-pointer border transform hover:-translate-y-0.5 active:translate-y-0 ${
                  isTrainerMode 
                    ? "bg-slate-950 text-white border-slate-900 hover:bg-slate-900 shadow-md" 
                    : "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100/85"
                }`}
              >
                <Users className="w-4 h-4 text-indigo-500" />
                {isTrainerMode ? "Student Dashboard" : "Trainer Dashboard"}
              </button>
            )}

            {student && !isTrainerMode && (
              <div className="flex items-center gap-1.5 bg-amber-500 text-white px-3.5 py-2 rounded-2xl text-[10px] font-black border border-amber-400 shadow-sm shadow-amber-100">
                <Flame className="w-3.5 h-3.5 fill-white text-white" />
                <span className="uppercase tracking-widest font-mono">PRACTITIONER</span>
              </div>
            )}

            {student && (
              <div className="flex items-center gap-3 bg-slate-50/80 pl-3.5 pr-2 py-1.5 rounded-2xl border border-slate-100">
                <div className="text-right">
                  <span className="text-xs font-black text-slate-900 block leading-tight">{student.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono block truncate max-w-[120px] mt-1">{student.email}</span>
                </div>
                <button 
                  id="btn-header-logout"
                  onClick={handleLogout}
                  title="Sign Out / Switch User"
                  className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-800 rounded-xl transition cursor-pointer flex items-center gap-2"
                >
                  <span className="hidden sm:inline text-xs font-bold text-slate-500">Switch User</span>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </header>
      </div>

      <AnimatePresence>
        {castedNotice && !isTrainerMode && student && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-400"
          >
            <Layers className="w-5 h-5 animate-pulse text-indigo-200" />
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 block">Trainer Action</span>
              <span className="text-sm font-bold block">Live class synchronized! View updated to active lesson.</span>
            </div>
            <button onClick={() => setCastedNotice(null)} className="ml-2 p-1 hover:bg-indigo-700 rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!isTrainerMode && student && activeReminder && (
        <div className="bg-amber-500 border-y border-amber-600 text-white px-4 py-3 text-center flex items-center justify-center gap-3 shadow-lg relative z-20">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-xs sm:text-sm font-bold">
            Reminder: Your {activeReminder.type} "{activeReminder.title}" is starting in less than 15 minutes!
          </span>
          <button 
            onClick={() => setActiveTab("classroom")}
            className="ml-2 px-3 py-1 bg-white text-amber-700 hover:bg-amber-50 text-xs font-black rounded-lg transition"
          >
            Go to Classroom
          </button>
        </div>
      )}

      {!isTrainerMode && student && studentMeetings.length > 0 && activeTab !== "classroom" && (
        <div className="bg-rose-600 border-y border-rose-700 text-white px-4 py-3 text-center flex items-center justify-center gap-3 shadow-lg relative z-20">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <Video className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-bold">Your trainer has scheduled a live class! Go to the classroom to join.</span>
          <button 
            onClick={() => {
              setActiveInAppMeetingUrl(studentMeetings[0].url);
              setActiveInAppMeetingTitle(studentMeetings[0].title);
              setActiveTab("classroom");
            }}
            className="ml-2 px-3 py-1 bg-white text-rose-700 hover:bg-rose-50 text-xs font-black rounded-lg transition"
          >
            Join Now
          </button>
        </div>
      )}

      {isTrainerMode ? (
        <TrainerDashboard 
          courseModules={modules}
          categories={categories}
          onUpdateModules={(newMods) => setModules(newMods)}
          onUpdateCategories={(newCats) => setCategories(newCats)}
          onClose={() => setIsTrainerMode(false)}
        />
      ) : !student ? (
        <main className="flex-1 flex items-center justify-center py-16 px-4 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-white border border-slate-100 rounded-[32px] p-8 sm:p-12 shadow-xl shadow-slate-100/40 w-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/40 rounded-full -mr-24 -mt-24 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-50/60 rounded-full -ml-20 -mb-20 pointer-events-none"></div>
            
            <div className="md:col-span-7 space-y-8 text-left flex flex-col justify-center relative z-10">
              <div>
                <span className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold rounded-full uppercase tracking-widest font-mono">
                  ✨ Coimbatores Premier Growth Academy
                </span>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mt-5 leading-none">
                  Coimbatore School of <span className="text-indigo-600">Digital and Growth</span>
                </h2>
                <p className="text-slate-500 mt-4 text-sm sm:text-base leading-relaxed">
                  Unlock premium performance marketing blueprints, attend real-time casted masterclasses, experiment in interactive live sandboxes, and compile a verified professional portfolio reviewed by AI expert instructors.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 items-start text-sm text-slate-600 font-semibold bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/65">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
                    <Check className="w-3.5 h-3.5 font-bold" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-800">Sequential Learning Roadmap</h4>
                    <p className="text-[11px] text-slate-400 font-normal">Syllabus unlocks sequentially after completing each practical milestone.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start text-sm text-slate-600 font-semibold bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/65">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-800">AI-Powered Portfolio Builder</h4>
                    <p className="text-[11px] text-slate-400 font-normal">Turn interactive exercise assignments into a professional portfolio to share with employers.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start text-sm text-slate-600 font-semibold bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/65">
                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-200">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-800">Graduation Credentials</h4>
                    <p className="text-[11px] text-slate-400 font-normal">Earn a secure Digital Certificate after getting your final Capstone Project approved.</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-5 border-t border-slate-100/85">
                <div className="text-indigo-600 font-black font-mono text-3xl">8-Step</div>
                <div className="text-[10px] text-slate-400 uppercase font-extrabold tracking-widest leading-snug">
                  Professional Milestone Course<br />For High Retention & Actionable Growth
                </div>
              </div>
            </div>

            <div className="md:col-span-5 bg-slate-50/80 border border-slate-200/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-center text-left relative z-10 shadow-inner">
              <h3 className="font-black text-slate-900 text-xl leading-snug">Secure Enrollment</h3>
              <p className="text-xs text-slate-500 mt-1">Begin your high-growth practitioner path with Coimbatore's elite.</p>
              
              <form id="form-student-enroll" onSubmit={handleEnroll} className="space-y-5 mt-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-600 block uppercase tracking-widest">Your Full Name</label>
                  <input 
                    id="input-enroll-name"
                    type="text" 
                    placeholder="e.g. Anand Kumar"
                    value={enrollName}
                    onChange={(e) => setEnrollName(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/55 transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-600 block uppercase tracking-widest">Email Address</label>
                  <input 
                    id="input-enroll-email"
                    type="email" 
                    placeholder="e.g. anand@growth.in"
                    value={enrollEmail}
                    onChange={(e) => setEnrollEmail(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/55 transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-600 block uppercase tracking-widest">Select Target Specialization / Course</label>
                  <select 
                    id="select-enroll-category"
                    value={enrollCategory}
                    onChange={(e) => setEnrollCategory(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer focus:ring-4 focus:ring-indigo-50/55 transition-all font-semibold"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>🎓 {cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-600 block uppercase tracking-widest">Career & Study Focus</label>
                  <select 
                    id="select-enroll-goal"
                    value={enrollGoal}
                    onChange={(e) => setEnrollGoal(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer focus:ring-4 focus:ring-indigo-50/55 transition-all"
                  >
                    <option value="Start a career in digital marketing">🎯 Start Growth Career</option>
                    <option value="Scale my e-commerce business">🛍️ Scale E-Commerce Brand</option>
                    <option value="Offer consulting/freelance services">💼 Offer Professional Consulting</option>
                  </select>
                </div>

                <button 
                  id="btn-enroll-submit"
                  type="submit"
                  disabled={enrolling}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-150"
                >
                  <UserCheck className="w-4 h-4" />
                  {enrolling ? "Setting up syllabus..." : "Enroll & Unlock Modules"}
                </button>
              </form>

              <div className="mt-8 border-t border-slate-200/60 pt-6">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest text-center mb-4">Quick Login (Demo Mode)</h4>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => {
                      handleEnroll(undefined, "Mike Vance", "mike@coimbatore.growth");
                      setIsTrainerMode(true);
                    }}
                    className="p-3 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-left transition cursor-pointer flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-mono font-bold flex items-center justify-center shrink-0">M</div>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-2">Mike Vance <span className="bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded uppercase font-black">Trainer</span></div>
                      <div className="text-[10px] text-indigo-600/70 font-mono">mike@coimbatore.growth</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => {
                      handleEnroll(undefined, "Aravind Kumar", "aravind@gmail.com");
                    }}
                    className="p-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-left transition cursor-pointer flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-mono font-bold flex items-center justify-center shrink-0">A</div>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-2">Aravind Kumar <span className="bg-slate-200 text-slate-600 border border-slate-300 text-[8px] px-1.5 py-0.5 rounded uppercase font-black">Student</span></div>
                      <div className="text-[10px] text-slate-500 font-mono">aravind@gmail.com</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => {
                      handleEnroll(undefined, "Neha Sharma", "neha@gmail.com");
                    }}
                    className="p-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-left transition cursor-pointer flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-mono font-bold flex items-center justify-center shrink-0">N</div>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-2">Neha Sharma <span className="bg-slate-200 text-slate-600 border border-slate-300 text-[8px] px-1.5 py-0.5 rounded uppercase font-black">Student</span></div>
                      <div className="text-[10px] text-slate-500 font-mono">neha@gmail.com</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </main>
      ) : (
        /* 3. ENROLLED INTERFACE */
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* SIDEBAR NAVIGATION COLUMN */}
          <section id="course-sidebar-navigation" className="lg:col-span-4 space-y-6">
            
            {/* Overall Progress Widget - Executive Sleek Slate-Dark Bento Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-[28px] p-6 text-white flex flex-col justify-between shadow-xl shadow-slate-100/40 relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full -mr-12 -mt-12 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full -ml-8 -mb-8 pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <span className="px-2 py-0.5 bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-[8px] font-black rounded-full uppercase tracking-widest font-mono">
                    Academy Progress
                  </span>
                  <h3 className="text-4xl font-black mt-2 font-mono tracking-tight text-white">{progressPercent}%</h3>
                </div>
                <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
                  <Award className="w-5.5 h-5.5" />
                </div>
              </div>
              <div className="space-y-2 relative z-10">
                <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Completed Modules</span>
                  <span className="text-indigo-400">{completedCount} / {allLessons.length} Modules</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-750 p-0.5">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-700 shadow-sm shadow-indigo-400/50" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Certification eligibility inside sidebar */}
              {allLessonsCompleted && !student.capstoneSubmitted && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 text-white p-4 rounded-2xl text-xs space-y-2 mt-5 relative z-10 shadow-lg">
                  <div className="flex items-center gap-1.5 font-extrabold text-amber-300">
                    <Trophy className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                    <span>Lessons Fully Completed!</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-300 font-medium">Unlock your physical practitioner diploma by submitting your comprehensive Capstone strategy.</p>
                  <button 
                    onClick={() => setActiveTab("capstone")}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-[10px] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    Start Capstone Project
                  </button>
                </div>
              )}

              {student.capstoneFeedback?.approved && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-white p-4 rounded-2xl text-xs space-y-2 mt-5 relative z-10 shadow-lg">
                  <div className="flex items-center gap-1.5 font-extrabold text-emerald-400">
                    <Trophy className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>Graduated Scholar!</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-300 font-medium">You are officially a certified Digital & Performance Growth Practitioner!</p>
                  <button 
                    onClick={handleDownloadCertificate}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-[10px] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-500/25"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Practitioner Diploma
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar Navigation Roadmap - Bento Cell */}
            <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-xl shadow-slate-100/40 space-y-5 text-left">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block font-mono">Syllabus Ledger</span>
                  <h2 className="text-sm font-black text-slate-900 mt-0.5">Training Roadmap</h2>
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl text-slate-500">
                  Sequential Module
                </span>
              </div>

              {/* List of Modules */}
              <div className="space-y-4">
                {studentModules.map((mod) => {
                  const isExpanded = expandedModules[mod.id] !== false;
                  return (
                    <div key={mod.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/30">
                      <button 
                        id={`btn-toggle-mod-${mod.id}`}
                        onClick={() => toggleModuleExpanded(mod.id)}
                        className="w-full flex justify-between items-center p-3.5 bg-slate-50 hover:bg-slate-100/60 transition text-left cursor-pointer border-b border-slate-200/60"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Module</span>
                          <h4 className="font-bold text-slate-900 text-[11px] truncate leading-tight mt-0.5">{mod.title}</h4>
                        </div>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />}
                      </button>

                      {isExpanded && (
                        <div className="p-1.5 space-y-1 bg-white">
                          {mod.lessons.map((les) => {
                            const locked = isLessonLocked(les.id);
                            const completed = isLessonCompleted(les.id);
                            const active = les.id === activeLessonId;

                            return (
                              <button
                                key={les.id}
                                id={`btn-sidebar-lesson-${les.id}`}
                                disabled={locked}
                                onClick={() => handleSelectLesson(les.id)}
                                className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition ${active ? "bg-indigo-50 border-l-4 border-indigo-600" : "hover:bg-slate-50 border-l-4 border-transparent"} ${locked ? "opacity-45 cursor-not-allowed" : "cursor-pointer"}`}
                              >
                                <div className="shrink-0">
                                  {completed ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                                  ) : locked ? (
                                    <Lock className="w-4 h-4 text-slate-400" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h5 className={`font-bold text-xs leading-tight ${active ? "text-indigo-950" : "text-slate-700"}`}>{les.title}</h5>
                                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono mt-1">
                                    <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {les.duration}</span>
                                    {les.liveToolType && (
                                      <>
                                        <span>&bull;</span>
                                        <span className="text-indigo-600 font-bold uppercase tracking-wide text-[8px]">Practice</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* MAIN ACTIVE LEARNING CANVAS */}
          <section id="course-active-stage" className="lg:col-span-8 space-y-6">
            
            {/* TABS NAVIGATION BAR */}
            <div className="bg-white border border-slate-200 rounded-3xl p-1 shadow-sm flex flex-wrap gap-1">
              <button 
                id="tab-dashboard"
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm rounded-2xl transition cursor-pointer ${activeTab === "dashboard" ? "bg-indigo-600 text-white shadow-sm shadow-indigo-150" : "text-slate-500 hover:bg-slate-100"}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button 
                id="tab-classroom"
                onClick={() => setActiveTab("classroom")}
                className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm rounded-2xl transition cursor-pointer ${activeTab === "classroom" ? "bg-indigo-600 text-white shadow-sm shadow-indigo-150" : "text-slate-500 hover:bg-slate-100"}`}
              >
                <BookOpen className="w-4 h-4" />
                Syllabus Classroom
              </button>
              <button 
                id="tab-portfolio"
                onClick={() => {
                  if (!student) return;
                  setActiveTab("portfolio");
                  syncStudentFromFirestore(student.email, student);
                }}
                className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm rounded-2xl transition cursor-pointer relative ${activeTab === "portfolio" ? "bg-indigo-600 text-white shadow-sm shadow-indigo-150" : "text-slate-500 hover:bg-slate-100"}`}
              >
                <Briefcase className="w-4 h-4" />
                My Digital Portfolio
                {student?.portfolio && student.portfolio.length > 0 && (
                  <span className={`font-mono text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeTab === "portfolio" ? "bg-white text-indigo-600" : "bg-emerald-500 text-white"}`}>
                    {student.portfolio.length}
                  </span>
                )}
              </button>
              <button 
                id="tab-capstone"
                disabled={!allLessonsCompleted}
                onClick={() => {
                  if (!allLessonsCompleted) return;
                  setActiveTab("capstone");
                }}
                className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm rounded-2xl transition cursor-pointer ${activeTab === "capstone" ? "bg-indigo-600 text-white shadow-sm shadow-indigo-150" : "text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"}`}
              >
                <Trophy className="w-4 h-4" />
                Capstone & Graduation
                {student?.capstoneFeedback?.approved && (
                  <span className="bg-amber-400 text-indigo-950 font-black text-[9px] px-1.5 py-0.5 rounded-full">✓</span>
                )}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "dashboard" && student && (
                <motion.div 
                  key="dashboard-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  <StudentDashboard 
                    student={student} 
                    onNavigateToClassroom={() => setActiveTab("classroom")}
                    completedLessonsCount={Object.values(student.progress).filter(Boolean).length}
                    totalLessonsCount={courseModules.filter(m => (m.category || "Digital Marketing") === (student.courseCategory || "Digital Marketing")).flatMap(m => m.lessons).length}
                    studentMeetings={studentMeetings}
                    student1on1Meetings={student1on1Meetings}
                  />
                </motion.div>
              )}
              {activeTab === "classroom" && (
                <motion.div 
                  key="classroom-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  {!activeLesson ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm max-w-lg mx-auto mt-8 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-indigo-100 shadow-sm">
                        <GraduationCap className="w-8 h-8 text-indigo-600" />
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900">Syllabus Preparing...</h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        You are enrolled in the <span className="font-bold text-indigo-600">"{student?.courseCategory || "Digital Marketing"}"</span> track. There are currently no syllabus modules or learning nodes published for this specialization yet.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-4 leading-normal bg-slate-50 p-3 rounded-xl border border-slate-100 text-left">
                        🎓 Once the Coimbatore School of Digital & Growth publishes the lessons, they will instantly appear in your roadmap. Feel free to contact your coordinator or check back later!
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* LESSON METADATA CARD */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[9px] font-black rounded-full uppercase tracking-widest font-mono">
                          Current Study Segment
                        </span>
                        <h2 className="text-2xl font-extrabold text-slate-900 mt-2.5 leading-tight">{activeLesson.title}</h2>
                        <p className="text-xs text-slate-500 mt-1 font-medium">{activeLesson.description}</p>
                      </div>
                      <div className="flex gap-2 shrink-0 self-start sm:self-center">
                        <span className="text-[10px] bg-slate-100 font-bold px-2.5 py-1.5 rounded-xl text-slate-600 flex items-center gap-1.5 border border-slate-200/45">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {activeLesson.duration}
                        </span>
                        {!isLessonCompleted(activeLesson.id) && (
                          student?.skipRequests?.[activeLesson.id] ? (
                            <span className="text-[10px] bg-amber-100 font-bold px-3 py-1.5 rounded-xl text-amber-800 flex items-center gap-1.5 border border-amber-300">
                              ⏳ Skip Pending Approval
                            </span>
                          ) : (
                            <button
                              id="btn-skip-active-chapter"
                              onClick={() => {
                                skipLesson(activeLesson.id);
                              }}
                              className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-amber-200 transition cursor-pointer"
                            >
                              ⏩ Skip Chapter
                            </button>
                          )
                        )}
                        {isLessonCompleted(activeLesson.id) ? (
                          <span className="text-[10px] bg-emerald-50 font-bold px-2.5 py-1.5 rounded-xl text-emerald-700 flex items-center gap-1.5 border border-emerald-100">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50" /> Fully Approved
                          </span>
                        ) : (
                          <span className="text-[10px] bg-indigo-50 font-bold px-2.5 py-1.5 rounded-xl text-indigo-700 flex items-center gap-1.5 border border-indigo-150">
                            <Activity className="w-3.5 h-3.5 text-indigo-500 animate-pulse" /> Homework Underway
                          </span>
                        )}
                      </div>
                    </div>

                    {/* DYNAMIC PROGRESS TIMELINE TRACKER - VISUALLY DISPLAYED ON STUDENT DASHBOARD */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Mandatory Sequential Learning Timeline</h4>
                      
                      {/* Step Timeline Container */}
                      <div className="relative">
                        {/* Connecting Line */}
                        <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -z-10 hidden md:block"></div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-8 gap-3">
                          {LESSON_STAGES.map((stg, stIdx) => {
                            const completed = isStageCompleted(activeLesson.id, stg.id);
                            const active = activeStage === stg.id;
                            const isLocked = !completed && !active;
                            const Icon = stg.icon;

                            return (
                              <div key={stg.id} className="flex flex-col items-center text-center space-y-2">
                                <div 
                                  title={stg.description}
                                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                                    completed 
                                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-100" 
                                      : active 
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-150 ring-4 ring-indigo-50 animate-pulse" 
                                        : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-55"
                                  }`}
                                >
                                  {completed ? (
                                    <Check className="w-4 h-4 font-black" />
                                  ) : (
                                    <Icon className="w-4 h-4" />
                                  )}
                                </div>
                                <span className={`text-[9px] font-extrabold tracking-tight max-w-[80px] leading-tight ${active ? "text-indigo-600 font-black" : completed ? "text-slate-600" : "text-slate-400"}`}>
                                  {stg.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Globally Visible Live Broadcast Notice */}
                  {liveClass?.active ? (
                    <div className="p-5 bg-rose-50 border border-rose-150 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse text-left shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-md">
                          <Radio className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-rose-950">🔴 Live Broadcast In Progress!</h4>
                          <p className="text-xs text-rose-700 mt-0.5">Topic: <span className="font-bold">{liveClass.topic || activeLesson.title}</span> • Presented by Mike Vance, Growth Director</p>
                        </div>
                      </div>
                      {liveClass.meetingUrl && (
                        <button 
                          onClick={() => {
                            setActiveInAppMeetingUrl(liveClass.meetingUrl);
                            setActiveInAppMeetingTitle(liveClass.topic || activeLesson.title);
                          }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-rose-200 shrink-0"
                        >
                          <Video className="w-4 h-4" /> Join Live Room
                        </button>
                      )}
                    </div>
                  ) : null}

                  {/* Student meeting dispatch list - Globally visible in classroom */}
                  {studentMeetings.length > 0 && (
                    <div className="p-5 bg-indigo-50/55 border border-indigo-100 rounded-3xl space-y-3 text-left shadow-sm">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> Personal & Batch Meeting Invites
                        </h4>
                        <span className="bg-indigo-200 text-indigo-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Active Rooms</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {studentMeetings.map((meet) => (
                          <div key={meet.id} className="p-3.5 bg-white border border-indigo-100/60 rounded-xl flex justify-between items-center text-xs shadow-sm hover:shadow transition">
                            <div className="space-y-0.5">
                              <h5 className="font-bold text-slate-800">{meet.title}</h5>
                              <p className="text-[10px] text-slate-400">Target: {meet.targetType === "batch" ? "Whole Batch" : "You (Private)"}</p>
                            </div>
                            <button 
                              onClick={() => {
                                setActiveInAppMeetingUrl(meet.url);
                                setActiveInAppMeetingTitle(meet.title);
                              }}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-[10px] transition cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <Video className="w-3 h-3" /> Join Now
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ACTIVE STAGE CONTENT BOARD - Renders only the active stage of the timeline */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-left">
                    
                    {/* Stage Title and Instructions */}
                    <div className="flex items-center gap-3 pb-5 border-b border-slate-100 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-600 shrink-0 border border-slate-100">
                        {React.createElement(LESSON_STAGES.find(s => s.id === activeStage)?.icon || BookOpen, { className: "w-5 h-5" })}
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Mandatory Milestone Stage</span>
                        <h3 className="text-base font-extrabold text-slate-900">{LESSON_STAGES.find(s => s.id === activeStage)?.label}</h3>
                      </div>
                    </div>

                    {/* STAGE CONTAINER SWITCH */}
                    <div className="min-h-[160px]">
                      
                      {/* STAGE 1: ATTEND LIVE CLASS */}
                      {activeStage === "attend-live" && (
                        <div className="space-y-6">
                          {!liveClass?.active && (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 text-slate-500 text-left">
                              <Radio className="w-4 h-4 text-slate-400" />
                              <span className="text-xs">No active live broadcast stream is currently scheduled. Check the meeting invites above to join the batch room!</span>
                            </div>
                          )}

                          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed text-left">
                            Welcome to the live seminar arena. Join active webcasts or inspect study notes and lesson blueprints in sync with the live presenter:
                          </p>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                            {/* Live Presentation Screen / Simulator */}
                            <div className="lg:col-span-7 bg-indigo-950 border border-indigo-900 rounded-2xl overflow-hidden text-white text-left flex flex-col justify-between p-6 min-h-[300px] relative shadow-lg">
                              <div className="absolute top-4 right-4 flex gap-2 z-10">
                                {liveClass?.active && (
                                  <span className="px-2 py-1 bg-rose-500/90 text-white font-mono font-black rounded-lg text-[8px] uppercase tracking-wide animate-pulse">
                                    🔴 Broadcast Active
                                  </span>
                                )}
                                {liveClass?.screenSharingActive && (
                                  <span className="px-2 py-1 bg-emerald-500/95 text-white font-mono font-black rounded-lg text-[8px] uppercase tracking-wide">
                                    🖥️ Screen Share Active
                                  </span>
                                )}
                              </div>

                              <div className="space-y-4">
                                <span className="text-[10px] text-indigo-300 font-extrabold block tracking-wider uppercase font-mono">Live Lecture Feed</span>
                                <h4 className="text-xl font-extrabold text-white leading-snug">
                                  {liveClass?.active ? `Now Streaming: ${liveClass.topic}` : `Syllabus Arena: ${activeLesson.title}`}
                                </h4>
                                <p className="text-xs text-indigo-200 mt-1">Instructor: Mike Vance, Growth Director</p>
                              </div>

                              {/* Presenter Screen / Materials Viewer */}
                              <div className="bg-black/40 border border-white/10 rounded-xl my-4 flex-1 flex flex-col justify-center min-h-[400px] overflow-hidden">
                                {activeInAppMeetingUrl ? (
                                  <div className="text-center space-y-2 p-6">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-300 mx-auto border border-indigo-500/20 shadow-inner">
                                      <Video className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h5 className="text-xs font-bold text-indigo-200">Connected in Full-Screen Mode</h5>
                                    <p className="text-[10px] text-indigo-300 max-w-sm mx-auto leading-relaxed">You are currently attending the live conference in the secured overlay. Close the full-screen view to return here.</p>
                                  </div>
                                ) : liveClass?.active && liveClass.meetingUrl ? (
                                  <iframe
                                    allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                                    src={getJitsiUrl(liveClass.meetingUrl, student?.name)}
                                    className="w-full h-full border-0"
                                    title="Live Classroom Feed"
                                  />
                                ) : (
                                  <div className="text-center space-y-2 p-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-indigo-300 mx-auto">
                                      <Video className="w-5 h-5 text-indigo-300" />
                                    </div>
                                    <h5 className="text-xs font-bold text-indigo-200">Interactive Webcast Ready</h5>
                                    <p className="text-[10px] text-indigo-300 max-w-sm mx-auto">Trainer webcam or shared workspace slides will appear here when the broadcast goes active.</p>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2 pt-4 border-t border-white/10 text-xs text-indigo-200">
                                <p className="font-extrabold uppercase tracking-wider text-[9px] text-indigo-300">Live Briefing Directives:</p>
                                <p className="flex gap-1.5 items-start">✓ Complete matching interactive assignments and submit for grading.</p>
                                <p className="flex gap-1.5 items-start">✓ Optimize search parameters and bid settings in the classroom sandbox.</p>
                              </div>
                            </div>

                             {/* Castel / Synced Study Materials Sidebar Card */}
                             <div className="lg:col-span-5 flex flex-col gap-4 text-left">
                               
                               {/* INTERACTIVE LIVE POLL & QUESTION FOR STUDENTS */}
                               {liveClass?.activeQuestion && (
                                 <div className="bg-indigo-950 border border-indigo-900 rounded-2xl p-5 text-white shadow-lg space-y-4 text-left relative overflow-hidden">
                                   <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500/10 to-indigo-500/0 rounded-full blur-xl pointer-events-none"></div>
                                   <div className="flex justify-between items-center">
                                     <span className="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded uppercase tracking-widest font-mono animate-pulse">
                                       🔴 LIVE LECTURE POLL
                                     </span>
                                     <span className="text-[9px] text-indigo-300 font-mono">
                                       {activeQuestionResponse ? "Submitted" : "Action Required"}
                                     </span>
                                   </div>

                                   <div className="space-y-1">
                                     <h5 className="font-black text-[9px] text-indigo-300 uppercase tracking-wider font-mono">Question from Instructor:</h5>
                                     <p className="font-extrabold text-sm text-white leading-snug">
                                       {liveClass.activeQuestion.questionText}
                                     </p>
                                   </div>

                                   {!activeQuestionResponse ? (
                                     /* Student voting choices */
                                     <div className="space-y-2">
                                       {liveClass.activeQuestion.options.map((opt, oIdx) => (
                                         <button
                                           key={oIdx}
                                           type="button"
                                           onClick={() => handleSubmitLiveAnswer(oIdx)}
                                           className="w-full p-3 bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-800/40 hover:border-indigo-600 rounded-xl text-xs text-left font-semibold text-indigo-100 hover:text-white transition cursor-pointer flex items-center justify-between group"
                                         >
                                           <span>
                                             <span className="font-black text-rose-400 mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                                             {opt}
                                           </span>
                                           <span className="opacity-0 group-hover:opacity-100 transition text-[10px] font-bold text-rose-400 font-mono">Vote &rarr;</span>
                                         </button>
                                       ))}
                                     </div>
                                   ) : (
                                     /* Vote results/feedback for student */
                                     <div className="p-3.5 bg-indigo-900/30 border border-indigo-800/50 rounded-xl space-y-3">
                                       <div className="flex items-center gap-2">
                                         {activeQuestionResponse.isCorrect ? (
                                           <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                                             <Check className="w-3 h-3" />
                                           </div>
                                         ) : (
                                           <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0 font-black text-xs">
                                             ✕
                                           </div>
                                         )}
                                         <span className="text-xs font-extrabold text-white">
                                           {activeQuestionResponse.isCorrect 
                                             ? "Fantastic! You answered correctly!" 
                                             : `Oops! The correct answer was: ${String.fromCharCode(65 + liveClass.activeQuestion.correctAnswer)}`}
                                         </span>
                                       </div>
                                       <p className="text-[11px] text-indigo-200">
                                         Your Answer: <strong className="text-white">{String.fromCharCode(65 + activeQuestionResponse.selectedOptionIndex)}. {liveClass.activeQuestion.options[activeQuestionResponse.selectedOptionIndex]}</strong>
                                       </p>
                                       <div className="text-[10px] font-semibold text-indigo-300 font-mono pt-1.5 border-t border-indigo-900 flex justify-between items-center">
                                         <span>Thank you for voting!</span>
                                         <span className="text-emerald-400 font-bold">Response Synced</span>
                                       </div>
                                     </div>
                                   )}
                                 </div>
                               )}

                               <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm flex flex-col justify-between flex-1">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider font-mono">Casted Study Material</span>
                                    {liveClass?.active && (
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Synchronized with presenter" />
                                    )}
                                  </div>
                                  <h4 className="font-extrabold text-sm text-slate-900">{activeLesson.title}</h4>
                                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{activeLesson.description}</p>
                                  
                                  {/* Quick Syllabus Points */}
                                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-2 text-slate-600">
                                    <p className="font-bold text-slate-800">Syllabus Highlights:</p>
                                    <div className="flex gap-1.5 items-start"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> High-yield campaign formulas</div>
                                    <div className="flex gap-1.5 items-start"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> Real-world sandbox tasks</div>
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex gap-2">
                                  <button 
                                    onClick={() => {
                                      completeStage(activeLesson.id, "attend-live");
                                    }}
                                    className="flex-1 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-bold rounded-xl text-xs text-center transition cursor-pointer"
                                  >
                                    Mark Attended & Read Notes
                                  </button>
                                </div>
                              </div>

                              {/* Small Peer Live Chat Box */}
                              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm flex flex-col justify-between h-[200px]">
                                <div className="overflow-y-auto space-y-3 flex-1 pr-1 border-b border-slate-100 pb-3" style={{ maxHeight: "120px" }}>
                                  {liveChatMessages.map((msg, mIdx) => (
                                    <div key={mIdx} className="text-xs text-left">
                                      <span className="font-black text-slate-800 block">{msg.sender} <span className="text-[8px] text-slate-400 font-mono font-normal">{msg.time}</span></span>
                                      <p className="text-slate-600 font-medium mt-0.5">{msg.text}</p>
                                    </div>
                                  ))}
                                  <div ref={chatEndRef}></div>
                                </div>
                                
                                <form onSubmit={handleSendLiveMessage} className="flex gap-1.5 pt-2">
                                  <input 
                                    type="text" 
                                    placeholder="Type chat reply..."
                                    value={liveChatInput}
                                    onChange={(e) => setLiveChatInput(e.target.value)}
                                    className="flex-1 text-xs px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                                  />
                                  <button type="submit" className="p-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                </form>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button 
                              onClick={() => completeStage(activeLesson.id, "attend-live")}
                              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs sm:text-sm transition shadow-md cursor-pointer"
                            >
                              Acknowledge Attendance & Proceed
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STAGE 2: WATCH CLASS RECORDING */}
                      {activeStage === "watch-recording" && (
                        <div className="space-y-6">
                          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                            Watch the high-yield class recording or review the conceptual video briefing.
                          </p>

                          {activeLesson.videoUrl ? (
                            renderVideoPlayer(activeLesson.videoUrl)
                          ) : (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                              <div className="bg-slate-950 rounded-xl relative overflow-hidden flex flex-col justify-center items-center min-h-[220px]">
                                {/* Media Player Overlay */}
                                <div className="absolute top-3 left-3 bg-black/60 px-2 py-1 rounded text-[8px] text-indigo-400 font-mono uppercase tracking-wide">
                                  4K Media Playback
                                </div>
                                
                                <div className="text-center p-6 space-y-3 z-10">
                                  <div className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 hover:scale-105 transition flex items-center justify-center text-white cursor-pointer mx-auto border border-white/20" onClick={() => setIsVideoPlaying(!isVideoPlaying)}>
                                    {isVideoPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
                                  </div>
                                  <h5 className="font-bold text-white text-sm">{activeLesson.title}</h5>
                                  <p className="text-xs text-slate-400">Length: 12 minutes • Chapter Highlights</p>
                                </div>

                                {/* Progress bar */}
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/40 flex items-center justify-between gap-4 text-[10px] text-slate-300 font-mono">
                                  <span>02:14 / 12:00</span>
                                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden cursor-pointer" onClick={() => setVideoProgress(prev => (prev + 15) % 100)}>
                                    <div className="h-full bg-indigo-500" style={{ width: `${videoProgress}%` }}></div>
                                  </div>
                                  <span className="hover:text-white cursor-pointer">1.25x</span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button 
                              onClick={() => completeStage(activeLesson.id, "watch-recording")}
                              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs sm:text-sm transition shadow-md cursor-pointer"
                            >
                              Mark Video Review Completed
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STAGE 3: STUDY NOTES & GUIDES */}
                      {activeStage === "study-notes" && (
                        <div className="space-y-6">
                          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                            Deep dive into the curated lesson text and download the course worksheets. <strong className="text-indigo-600">Requirement:</strong> You must download at least one resource sheet to confirm studying.
                          </p>

                          {/* Lesson content preview */}
                          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl max-h-[220px] overflow-y-auto text-xs sm:text-sm text-slate-600 space-y-4">
                            {activeLesson.markdownContent.split("\n\n").map((block, bIdx) => {
                              if (block.startsWith("### ")) {
                                return <h4 key={bIdx} className="text-sm font-bold text-slate-900 pt-2 pb-0.5">{block.replace("### ", "")}</h4>;
                              }
                              if (block.startsWith("* ")) {
                                return (
                                  <ul key={bIdx} className="list-disc list-inside space-y-1 pl-2">
                                    {block.split("\n").map((li, lIdx) => (
                                      <li key={lIdx} className="text-slate-600">{li.replace("* ", "")}</li>
                                    ))}
                                  </ul>
                                );
                              }
                              return <p key={bIdx} className="whitespace-pre-line leading-relaxed">{block}</p>;
                            })}
                          </div>

                          {/* Downloads shelf */}
                          <div className="space-y-3">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Available Curriculum Material</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {activeLesson.resources.map((res) => (
                                <div key={res.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                                  <div className="min-w-0 pr-2">
                                    <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold font-mono">
                                      {res.type}
                                    </span>
                                    <h6 className="font-bold text-slate-800 text-xs truncate mt-1">{res.title}</h6>
                                  </div>
                                  <button 
                                    onClick={() => handleDownloadResource(res)}
                                    className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition"
                                  >
                                    <FileDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                            {!hasDownloadedInSession ? (
                              <span className="text-[10px] text-slate-450 font-bold block bg-amber-50 text-amber-700 px-3 py-1 rounded-lg border border-amber-100">
                                ⚠ Please download at least one reference worksheet.
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-700 font-bold block bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                                ✓ Resource unlocked. Ready to study!
                              </span>
                            )}
                            <button 
                              disabled={!hasDownloadedInSession}
                              onClick={() => completeStage(activeLesson.id, "study-notes")}
                              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs sm:text-sm transition shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              I have studied materials
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STAGE 4: PRACTICE REAL-WORLD EXERCISE */}
                      {activeStage === "practice" && (
                        <div className="space-y-6">
                          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                            Practice with the interactive sandbox module below to build high-performance marketing models. Generate/calculate at least one scenario to advance.
                          </p>

                          {/* Enclose active lesson tools directly */}
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                            {activeLesson.liveToolType && (
                              <MarketingTools toolType={activeLesson.liveToolType} />
                            )}
                          </div>

                          <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button 
                              onClick={() => completeStage(activeLesson.id, "practice")}
                              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs sm:text-sm transition shadow-md cursor-pointer"
                            >
                              Confirm Sandbox Practice Completed
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STAGE 5: SUBMIT ASSIGNMENT */}
                      {activeStage === "submit-assignment" && (() => {
                        const assignmentTitle = activeLesson.customAssignment?.title || ASSIGNMENT_PROMPTS[activeLesson.id]?.title || `${activeLesson.title} Strategic Case Study`;
                        const assignmentPrompt = activeLesson.customAssignment?.prompt || ASSIGNMENT_PROMPTS[activeLesson.id]?.prompt || `Based on what you've learned in "${activeLesson.title}", draft a detailed professional application outline. Identify a business case study, define your target KPIs, list specific tactics you will deploy, and describe how you will measure and optimize performance.`;
                        const assignmentPlaceholder = activeLesson.customAssignment?.placeholder || ASSIGNMENT_PROMPTS[activeLesson.id]?.placeholder || "Provide your strategic outline here (minimum 50 characters to proceed)...";
                        
                        return (
                          <div className="space-y-5">
                            <div className="p-5 bg-indigo-50/40 border border-indigo-100 rounded-2xl text-left">
                              <span className="text-[8px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider font-mono">
                                Homework Assignment Briefing
                              </span>
                              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base mt-2">
                                {assignmentTitle}
                              </h4>
                              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-white p-3 border border-slate-100 rounded-xl whitespace-pre-line">
                                {assignmentPrompt}
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">Your Written Response Submission</label>
                              <textarea 
                                rows={5}
                                placeholder={assignmentPlaceholder}
                                value={assignmentDraft}
                                onChange={(e) => setAssignmentDraft(e.target.value)}
                                className="w-full px-4 py-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 font-mono whitespace-pre-wrap leading-relaxed"
                              ></textarea>
                              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1">
                                <span>Min length: 50 characters</span>
                                <span className={assignmentDraft.trim().length >= 50 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                                  Character Count: {assignmentDraft.trim().length}
                                </span>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                              <button 
                                disabled={assignmentDraft.trim().length < 50}
                                onClick={handleSubmitAssignment}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs sm:text-sm transition shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Submit Assignment
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* STAGE 6: COMPLETE QUIZ CHECKPOINT */}
                      {activeStage === "complete-quiz" && (
                        <div className="space-y-6">
                          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                            Pass the comprehension knowledge checkpoint below. <strong className="text-indigo-600">Requirement:</strong> You must secure a passing grade of 80% or higher to progress.
                          </p>

                          {activeLesson.quiz && (
                            <div className="space-y-5 p-4 border border-slate-150 rounded-2xl bg-slate-50/50">
                              {activeLesson.quiz.questions.map((q, qIdx) => {
                                const selectedOpt = quizAnswers[q.id];
                                return (
                                  <div key={q.id} className="space-y-2.5 text-left bg-white p-4 border border-slate-150 rounded-xl">
                                    <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                      {qIdx + 1}. {q.question}
                                    </h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {q.options.map((opt, optIdx) => {
                                        const isSelected = selectedOpt === optIdx;
                                        const isCorrect = q.correctAnswer === optIdx;
                                        
                                        let optStyle = "bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/10";
                                        if (isSelected) optStyle = "bg-indigo-50 border-indigo-300 text-indigo-950 font-bold shadow-sm";
                                        
                                        if (quizGraded) {
                                          if (isCorrect) {
                                            optStyle = "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold";
                                          } else if (isSelected) {
                                            optStyle = "bg-rose-50 border-rose-300 text-rose-950";
                                          } else {
                                            optStyle = "bg-slate-50/50 border-slate-100 text-slate-400 pointer-events-none";
                                          }
                                        }

                                        return (
                                          <button
                                            key={optIdx}
                                            disabled={quizGraded}
                                            onClick={() => handleAnswerChange(q.id, optIdx)}
                                            className={`p-3 border rounded-lg text-xs text-left cursor-pointer transition-all duration-200 ${optStyle}`}
                                          >
                                            {opt}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    {quizGraded && (
                                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-500 leading-relaxed mt-2 font-medium">
                                        <strong className="text-slate-800">Explanation:</strong> {q.explanation}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                                {quizGraded ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Score Achieved:</span>
                                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${quizScore && quizScore >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                                      {quizScore}% {quizScore && quizScore >= 80 ? "• PASSED" : "• FAIL (Requires >= 80%)"}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400">Answer all questions above.</span>
                                )}

                                <div className="flex gap-2 w-full sm:w-auto justify-end">
                                  {quizGraded && quizScore && quizScore < 80 && (
                                    <button 
                                      onClick={handleResetQuiz}
                                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" /> Re-take Quiz
                                    </button>
                                  )}
                                  
                                  {!quizGraded && (
                                    <button 
                                      onClick={handleGradeQuiz}
                                      disabled={Object.keys(quizAnswers).length < (activeLesson.quiz?.questions.length || 0)}
                                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      Submit & Grade Checkpoint
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* STAGE 7: AI EVALUATION & REVIEW */}
                      {activeStage === "instructor-review" && (
                        <div className="space-y-6">
                          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                            Submit your completed lesson worksheet and homework response for personalized peer evaluation. Our AI Growth Mentor will rate compliance and strategy parameters.
                          </p>

                          {/* Student Response Display */}
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-left">
                            <span className="text-[9px] font-black font-mono text-slate-400 block uppercase tracking-wider">Submitted Homework Strategy</span>
                            <p className="text-xs font-mono text-slate-600 leading-relaxed whitespace-pre-wrap">
                              {student.assignments?.[activeLesson.id]?.studentResponse}
                            </p>
                          </div>

                          {reviewError && (
                            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs text-left">
                              {reviewError}
                            </div>
                          )}

                          <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button 
                              disabled={reviewing}
                              onClick={handleRequestAIReview}
                              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs sm:text-sm transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-40"
                            >
                              {reviewing ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  Analyzing campaign metrics...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 text-white" />
                                  Request AI Mentor Evaluation
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STAGE 8: GRADED & PORTFOLIO APPROVED */}
                      {activeStage === "portfolio-approve" && (
                        <div className="space-y-6">
                          {/* Victory Card */}
                          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4">
                            <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                              <Award className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-xl font-black text-emerald-900">Milestone Stage Accomplished!</h4>
                              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                                Congratulations, your submitted growth strategy has been formalised as a credential inside your professional digital portfolio ledger.
                              </p>
                            </div>

                            {/* Evaluation results */}
                            {student.assignments?.[activeLesson.id] && (
                              <div className="p-5 bg-white border border-emerald-100 rounded-2xl text-left space-y-3.5 max-w-xl mx-auto">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Evaluation Card</span>
                                  <span className="text-xs font-mono font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg">
                                    Grade: {student.assignments[activeLesson.id].score || 88}/100
                                  </span>
                                </div>
                                <div className="space-y-2 text-xs">
                                  <p className="text-slate-700">
                                    <strong className="text-slate-900 block font-bold mb-0.5">Instructor highlights:</strong> 
                                    {student.assignments[activeLesson.id].feedback}
                                  </p>
                                  <p className="text-slate-700">
                                    <strong className="text-slate-900 block font-bold mb-0.5">Strategic growth suggestions:</strong> 
                                    {student.assignments[activeLesson.id].suggestions}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="pt-4 border-t border-emerald-100 flex justify-center gap-3">
                              {allLessons.findIndex(l => l.id === activeLesson.id) < allLessons.length - 1 ? (
                                <button 
                                  onClick={() => {
                                    const nextIdx = allLessons.findIndex(l => l.id === activeLesson.id) + 1;
                                    handleUnlockAndSelectNextLesson(activeLesson.id, allLessons[nextIdx].id);
                                  }}
                                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-md flex items-center gap-1.5"
                                >
                                  Unlock Next Lesson <ChevronRight className="w-4 h-4" />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => setActiveTab("capstone")}
                                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-md flex items-center gap-1.5"
                                >
                                  Complete Capstone Project <Trophy className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* DISCUSSION BOARD */}
                  <DiscussionForum currentStudent={student} activeLessonId={activeLesson.id} />
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === "portfolio" && (
                <motion.div 
                  key="portfolio-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  {/* Portfolio Bio Banner */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-left flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4.5">
                      <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                        <User className="w-8 h-8" />
                      </div>
                      <div>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[8px] font-black rounded font-mono uppercase tracking-widest">
                          GROWTH PRACTITIONER LEDGER
                        </span>
                        <h3 className="text-xl font-extrabold text-slate-950 mt-1">{student.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">Enrolled on {new Date(student.enrolledAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-center shrink-0">
                      <div className="text-center">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Credentials</span>
                        <span className="text-lg font-black font-mono text-slate-900">{student.portfolio?.length || 0} Saved</span>
                      </div>
                      <div className="h-8 w-px bg-slate-200"></div>
                      <div className="text-center">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Average Grade</span>
                        <span className="text-lg font-black font-mono text-indigo-600">
                          {student.portfolio && student.portfolio.length > 0 
                            ? Math.round(student.portfolio.reduce((acc, curr) => acc + curr.score, 0) / student.portfolio.length)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PORTFOLIO ENTRIES LIST */}
                  <div className="space-y-6 text-left">
                    <h3 className="font-extrabold text-slate-900 text-lg">My Practical Strategy Portfolio</h3>
                    
                    {(!student.portfolio || student.portfolio.length === 0) ? (
                      <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
                          <FolderClosed className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">Portfolio is currently empty</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Complete active lessons in sequence, submit assignments, and get approved to publish your growth strategies on this live practitioner page.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {student.portfolio.map((entry) => (
                          <div key={entry.lessonId} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                            <div className="space-y-4">
                              <div className="flex justify-between items-start gap-3">
                                <div>
                                  <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest">PUBLISHED CREDENTIAL</span>
                                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base mt-1">{entry.lessonTitle}</h4>
                                </div>
                                <span className="text-xs font-mono font-black bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-1 rounded-xl shrink-0">
                                  Grade: {entry.score}%
                                </span>
                              </div>

                              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5">
                                <span className="text-[8px] font-black text-slate-400 font-mono block uppercase tracking-wider">Student Strategy Plan:</span>
                                <p className="text-xs text-slate-600 font-mono whitespace-pre-wrap leading-relaxed truncate max-h-[100px] overflow-hidden">
                                  {entry.studentResponse}
                                </p>
                              </div>

                              <div className="p-3.5 bg-indigo-50/20 border border-indigo-50 rounded-xl space-y-1 text-xs">
                                <span className="font-extrabold text-indigo-900 block font-bold">AI Growth Instructor Critique:</span>
                                <p className="text-slate-600 leading-relaxed italic">"{entry.feedback}"</p>
                                <p className="text-slate-500 font-medium leading-relaxed mt-1"><strong className="text-slate-800">Scaling Advice:</strong> {entry.suggestions}</p>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-mono mt-4">
                              <span>Verified: DMA Ledger</span>
                              <span>{new Date(entry.completedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "capstone" && (
                <motion.div 
                  key="capstone-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-left space-y-6">
                    <div>
                      <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wider font-mono">
                        FINAL GRADUATION MILESTONE
                      </span>
                      <h2 className="text-3xl font-extrabold text-slate-900 mt-4 leading-tight">Final Capstone Campaign Strategy</h2>
                      <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                        Combine all your growth, SEO optimization, psychographic buyer profiling, andPAS/AIDA direct-response copywriting skills into a comprehensive launch campaign deck.
                      </p>
                    </div>

                    {/* Check capstone state */}
                    {!student.capstoneSubmitted ? (
                      <form onSubmit={handleCapstoneSubmit} className="space-y-6">
                        <div className="p-5 bg-indigo-50/40 border border-indigo-150 rounded-2xl space-y-3">
                          <h4 className="font-extrabold text-indigo-950 text-sm">Graduation Prompt Strategy Task:</h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            Design an end-to-end launch plan for a new digital offering of your choice. Outline:
                            <br />
                            1. **Funnel Parameters**: hypothetical marketing spend, target CPA, projected CPC, and expected conversion benchmarks.
                            <br />
                            2. **Audience Demographics**: Buyer profile name, goals, primary psychographic objection.
                            <br />
                            3. **SEO On-Page Copy**: Draft optimized Meta Title (under 60 chars) and Meta Description (under 160 chars).
                            <br />
                            4. **High-converting Ad Copies**: Write one PAS social copy ad and one AIDA search ad.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">Your Campaign Launch Plan (Min 100 characters)</label>
                          <textarea 
                            rows={8}
                            value={capstoneResponse}
                            onChange={(e) => setCapstoneResponse(e.target.value)}
                            placeholder="Type or paste your comprehensive 4-stage launch campaign plan here..."
                            className="w-full px-4 py-3.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 font-mono whitespace-pre-wrap leading-relaxed"
                            required
                          ></textarea>
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                            <span>Min limit: 100 characters</span>
                            <span className={capstoneResponse.trim().length >= 100 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                              Characters: {capstoneResponse.trim().length}
                            </span>
                          </div>
                        </div>

                        {capstoneError && (
                          <div className="p-3.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs">
                            {capstoneError}
                          </div>
                        )}

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                          <button 
                            type="submit"
                            disabled={submittingCapstone || capstoneResponse.trim().length < 100}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs sm:text-sm transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-45"
                          >
                            {submittingCapstone ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Grading capstone deck...
                              </>
                            ) : (
                              <>
                                <Award className="w-4 h-4 text-white" />
                                Submit Capstone to AI Registrar
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Capstone graded / reviewed screen */
                      <div className="space-y-6">
                        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4">
                          <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                            <Trophy className="w-8 h-8 text-white fill-white/10" />
                          </div>
                          
                          <div className="space-y-1">
                            <h3 className="text-xl font-black text-emerald-950">Capstone Project Approved!</h3>
                            <p className="text-xs text-emerald-700 max-w-md mx-auto">
                              Congratulations, you have graduated the Growth Practitioner Masterclass with honors.
                            </p>
                          </div>

                          <div className="p-5 bg-white border border-emerald-100 rounded-2xl text-left space-y-4 max-w-xl mx-auto">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">OFFICIAL GRADUATION CARD</span>
                              <span className="text-xs font-mono font-black bg-amber-100 text-amber-800 px-3 py-1 rounded-lg">
                                Grade: {student.capstoneFeedback?.score || 92}%
                              </span>
                            </div>
                            
                            <div className="space-y-2.5 text-xs text-slate-700">
                              <p>
                                <strong className="text-slate-900 block font-bold">Registrar Evaluation:</strong> 
                                {student.capstoneFeedback?.feedback}
                              </p>
                              <p>
                                <strong className="text-slate-900 block font-bold">Scaling Advice:</strong> 
                                {student.capstoneFeedback?.suggestions}
                              </p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-emerald-150 flex justify-center gap-3">
                            <button 
                              onClick={handleDownloadCertificate}
                              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs sm:text-sm transition shadow-md flex items-center gap-2 cursor-pointer"
                            >
                              <Download className="w-4 h-4 text-white" />
                              Download Graduation Certificate
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </section>

        </main>
      )}

      {/* FOOTER */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>&copy; {new Date().getFullYear()} Coimbatore School of Digital and Growth. All sandboxes and peer feedback are real-time enabled.</p>
      </footer>

      {/* FULL-SCREEN IN-APP MEETING ROOM MODAL OVERLAY */}
      <AnimatePresence>
        {activeInAppMeetingUrl && activeInAppMeetingTitle && student && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[100] p-2 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-hidden flex items-center justify-center"
          >
            <div className="w-full max-w-7xl max-h-full">
              <InAppMeetingRoom
                meetingTitle={activeInAppMeetingTitle}
                meetingUrl={activeInAppMeetingUrl}
                studentName={student.name}
                studentEmail={student.email}
                onLeave={() => {
                  setActiveInAppMeetingUrl(null);
                  setActiveInAppMeetingTitle(null);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

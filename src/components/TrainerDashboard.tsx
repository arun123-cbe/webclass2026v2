import React, { useState, useEffect } from "react";
import { 
  Users, 
  BookOpen, 
  Award, 
  FileCheck, 
  CheckCircle, 
  Clock, 
  Plus, 
  Edit3, 
  ChevronRight, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Search, 
  ArrowLeft, 
  GraduationCap, 
  Layers, 
  Trash2, 
  Save, 
  CheckSquare, 
  FileText,
  UserCheck,
  Radio,
  Video,
  Monitor,
  Upload,
  Download,
  FileUp,
  UserPlus,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Student, CourseModule, Lesson, Resource, Quiz } from "../types";
import { db } from "../lib/firebase";
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import LiveBroadcastStudio from "./LiveBroadcastStudio";
import InAppMeetingRoom from "./InAppMeetingRoom";

interface TrainerDashboardProps {
  courseModules: CourseModule[];
  categories: string[];
  onUpdateModules: (newModules: CourseModule[]) => void;
  onUpdateCategories: (newCategories: string[]) => void;
  onClose: () => void;
}

export default function TrainerDashboard({ 
  courseModules, 
  categories,
  onUpdateModules,
  onUpdateCategories,
  onClose 
}: TrainerDashboardProps) {
  // Tabs: "overview" | "review" | "capstone" | "curriculum" | "live_studio"
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "review" | "capstone" | "curriculum" | "live_studio" | "onboarding" | "scheduler">("overview");

  // Roster / Students states
  const [students, setStudents] = useState<Student[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "graduated" | "pending">("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Assignment Grading states
  const [pendingAssignments, setPendingAssignments] = useState<Array<{
    student: Student;
    lessonId: string;
    lessonTitle: string;
    studentResponse: string;
    submittedAt?: string;
    isSkipRequest?: boolean;
  }>>([]);
  
  const [selectedReview, setSelectedReview] = useState<{
    student: Student;
    lessonId: string;
    lessonTitle: string;
    studentResponse: string;
    isSkipRequest?: boolean;
  } | null>(null);

  const [gradeScore, setGradeScore] = useState<number>(85);
  const [gradeApproved, setGradeApproved] = useState<boolean>(true);
  const [gradeFeedback, setGradeFeedback] = useState<string>("");
  const [gradeSuggestions, setGradeSuggestions] = useState<string>("");
  const [generatingFeedback, setGeneratingFeedback] = useState<boolean>(false);
  const [savingGrade, setSavingGrade] = useState<boolean>(false);

  // Capstone review states
  const [pendingCapstones, setPendingCapstones] = useState<Student[]>([]);
  const [selectedCapstone, setSelectedCapstone] = useState<Student | null>(null);
  const [capstoneScore, setCapstoneScore] = useState<number>(90);
  const [capstoneApproved, setCapstoneApproved] = useState<boolean>(true);
  const [capstoneFeedback, setCapstoneFeedback] = useState<string>("");
  const [capstoneSuggestions, setCapstoneSuggestions] = useState<string>("");
  const [generatingCapstoneFeedback, setGeneratingCapstoneFeedback] = useState<boolean>(false);
  const [savingCapstoneGrade, setSavingCapstoneGrade] = useState<boolean>(false);

  // Curriculum Builder states
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [newModuleDesc, setNewModuleDesc] = useState("");
  const [newModuleCategory, setNewModuleCategory] = useState("Digital Marketing");
  
  // Category & Course Filter/Creation states
  const [studentCategoryFilter, setStudentCategoryFilter] = useState<string>("all");
  const [curriculumCategoryFilter, setCurriculumCategoryFilter] = useState<string>("all");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [selectedModuleIdForNewLesson, setSelectedModuleIdForNewLesson] = useState<string>("");
  
  // Custom Quiz Questions Builder states
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>(["", "", "", ""]);
  const [newQuestionCorrect, setNewQuestionCorrect] = useState<number>(0);
  const [newQuestionExplanation, setNewQuestionExplanation] = useState("");
  const [isAiGeneratingQuiz, setIsAiGeneratingQuiz] = useState(false);
  const [quizGenerateError, setQuizGenerateError] = useState<string | null>(null);
  const [isQuizDragging, setIsQuizDragging] = useState(false);
  const [quizUploadError, setQuizUploadError] = useState<string | null>(null);
  const [quizUploadSuccess, setQuizUploadSuccess] = useState<string | null>(null);
  
  // Lesson form state
  const [lessonForm, setLessonForm] = useState<{
    id: string;
    title: string;
    description: string;
    duration: string;
    markdownContent: string;
    liveToolType: "roi-calc" | "seo-meta" | "ad-copy" | "persona" | "none";
    resources: Resource[];
    quiz: Quiz;
    videoUrl: string;
    customAssignment?: { title: string; prompt: string; placeholder: string };
  }>({
    id: "",
    title: "",
    description: "",
    duration: "20 mins",
    markdownContent: "",
    liveToolType: "none",
    resources: [],
    quiz: { questions: [] },
    videoUrl: ""
  });

  // Flat lessons list
  const allLessons = courseModules.flatMap(m => m.lessons);

  // Onboarding states
  const [onboardType, setOnboardType] = useState<"student" | "trainer">("student");
  const [onboardName, setOnboardName] = useState("");
  const [onboardEmail, setOnboardEmail] = useState("");
  const [onboardCategory, setOnboardCategory] = useState("Digital Marketing");
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardSuccess, setOnboardSuccess] = useState<string | null>(null);
  const [onboardError, setOnboardError] = useState<string | null>(null);

  // Scheduler states
  const [schedulerTitle, setSchedulerTitle] = useState("");
  const [schedulerDate, setSchedulerDate] = useState("");
  const [schedulerTime, setSchedulerTime] = useState("");
  const [schedulerStudentId, setSchedulerStudentId] = useState("");
  const [schedulerLoading, setSchedulerLoading] = useState(false);
  const [schedulerSuccess, setSchedulerSuccess] = useState<string | null>(null);
  const [schedulerError, setSchedulerError] = useState<string | null>(null);
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([]);

  // In-App Meeting Room states
  const [activeInAppMeetingUrl, setActiveInAppMeetingUrl] = useState<string | null>(null);
  const [activeInAppMeetingTitle, setActiveInAppMeetingTitle] = useState<string | null>(null);

  // Sync cohort from Firestore in real-time
  useEffect(() => {
    setLoadingStudents(true);
    const unsubscribeStudents = onSnapshot(collection(db, "students"), (snapshot) => {
      const studentList: Student[] = [];
      snapshot.forEach((doc) => {
        studentList.push({ id: doc.id, ...doc.data() } as Student);
      });
      setStudents(studentList);
      setLoadingStudents(false);
    }, (error) => {
      console.error("Error subscribing to students: ", error);
      setLoadingStudents(false);
    });

    const unsubscribeTrainers = onSnapshot(collection(db, "trainers"), (snapshot) => {
      const trainerList: any[] = [];
      snapshot.forEach((doc) => {
        trainerList.push({ id: doc.id, ...doc.data() });
      });
      setTrainers(trainerList);
    }, (error) => {
      console.error("Error subscribing to trainers: ", error);
    });

    const unsubscribeMeetings = onSnapshot(collection(db, "1on1_meetings"), (snapshot) => {
      const meetingList: any[] = [];
      snapshot.forEach((doc) => {
        meetingList.push({ id: doc.id, ...doc.data() });
      });
      meetingList.sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.time}`).getTime();
        const timeB = new Date(`${b.date}T${b.time}`).getTime();
        return timeA - timeB;
      });
      setUpcomingMeetings(meetingList);
    }, (error) => {
      console.error("Error subscribing to meetings: ", error);
    });

    return () => {
      unsubscribeStudents();
      unsubscribeTrainers();
      unsubscribeMeetings();
    };
  }, []);

  // Compute pending items whenever students change
  useEffect(() => {
    // 1. Gather all pending homework submissions and skip requests
    const pending: typeof pendingAssignments = [];
    students.forEach(student => {
      if (student.assignments) {
        Object.entries(student.assignments).forEach(([lessonId, rawAssign]) => {
          const assign = rawAssign as {
            studentResponse: string;
            score?: number;
            feedback?: string;
            suggestions?: string;
            approved?: boolean;
            submittedAt?: string;
          };
          // Homework is pending if it has a submission but hasn't been approved yet OR has no feedback score/approved field yet
          const hasScore = assign.score !== undefined && assign.score !== null;
          const isApproved = assign.approved === true;
          // Let's treat it as pending review if it was submitted but doesn't have complete review info or is pending
          // Or if lesson stages do not show portfolio-approve completed yet
          const completedStages = student.lessonStages?.[lessonId] || [];
          const waitingReview = !completedStages.includes("portfolio-approve") && assign.studentResponse;
          
          if (waitingReview) {
            const lessonObj = allLessons.find(l => l.id === lessonId);
            pending.push({
              student,
              lessonId,
              lessonTitle: lessonObj?.title || lessonId,
              studentResponse: assign.studentResponse,
              submittedAt: assign.submittedAt,
              isSkipRequest: false
            });
          }
        });
      }

      // Add skip requests
      if (student.skipRequests) {
        Object.entries(student.skipRequests).forEach(([lessonId, requested]) => {
          if (requested && !student.progress?.[lessonId]) {
            const lessonObj = allLessons.find(l => l.id === lessonId);
            // Check if it's already in pending (unlikely, but just in case)
            if (!pending.some(p => p.lessonId === lessonId && p.student.id === student.id)) {
              pending.push({
                student,
                lessonId,
                lessonTitle: lessonObj?.title || lessonId,
                studentResponse: "Student has requested to skip this chapter.",
                isSkipRequest: true
              });
            }
          }
        });
      }
    });
    setPendingAssignments(pending);

    // 2. Gather pending Capstones
    const pendingCaps = students.filter(s => s.capstoneSubmitted && !s.capstoneFeedback?.approved);
    setPendingCapstones(pendingCaps);
  }, [students, courseModules]);

  // Handle adding new users (students or trainers)
  const handleOnboardUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardName.trim() || !onboardEmail.trim()) {
      setOnboardError("Name and Email are required.");
      return;
    }
    
    setOnboardLoading(true);
    setOnboardError(null);
    setOnboardSuccess(null);
    
    try {
      const emailKey = onboardEmail.toLowerCase().trim();
      
      if (onboardType === "student") {
        const studentRef = doc(db, "students", emailKey);
        await setDoc(studentRef, {
          id: emailKey,
          name: onboardName,
          email: emailKey,
          courseCategory: onboardCategory,
          progress: {},
          enrolledAt: new Date().toISOString()
        }, { merge: true });
        
        setOnboardSuccess(`Student ${onboardName} onboarded successfully!`);
      } else {
        // Handle Trainer (currently we don't have a trainers collection, but let's assume we store them in a trainers collection or similar)
        // Since there is no auth restriction, we just write a trainer record.
        const trainerRef = doc(db, "trainers", emailKey);
        await setDoc(trainerRef, {
          id: emailKey,
          name: onboardName,
          email: emailKey,
          role: "trainer",
          onboardedAt: new Date().toISOString()
        }, { merge: true });
        
        setOnboardSuccess(`Trainer ${onboardName} onboarded successfully!`);
      }
      
      setOnboardName("");
      setOnboardEmail("");
    } catch (err) {
      console.error("Error onboarding user:", err);
      setOnboardError("Failed to onboard user. Check console for details.");
    } finally {
      setOnboardLoading(false);
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulerTitle || !schedulerDate || !schedulerTime || !schedulerStudentId) {
      setSchedulerError("Please fill out all fields.");
      return;
    }
    
    setSchedulerLoading(true);
    setSchedulerError(null);
    setSchedulerSuccess(null);

    try {
      const student = students.find(s => s.id === schedulerStudentId);
      if (!student) throw new Error("Student not found");

      const meetingId = `meet_${Date.now()}`;
      await setDoc(doc(db, "1on1_meetings", meetingId), {
        id: meetingId,
        title: schedulerTitle,
        date: schedulerDate,
        time: schedulerTime,
        studentId: student.id,
        studentName: student.name,
        trainerName: "Instructor Mike", // Hardcoded for now
        createdAt: new Date().toISOString()
      });

      setSchedulerSuccess("Meeting scheduled successfully!");
      setSchedulerTitle("");
      setSchedulerDate("");
      setSchedulerTime("");
      setSchedulerStudentId("");
    } catch (err) {
      console.error("Error scheduling meeting:", err);
      setSchedulerError("Failed to schedule meeting.");
    } finally {
      setSchedulerLoading(false);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this meeting?")) return;
    try {
      await deleteDoc(doc(db, "1on1_meetings", id));
    } catch (err) {
      console.error("Error deleting meeting:", err);
      alert("Failed to cancel meeting.");
    }
  };

  const handleDeleteUser = async (id: string, type: "student" | "trainer") => {
    const confirmMessage = `Are you sure you want to remove this ${type}? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      if (type === "student") {
        await deleteDoc(doc(db, "students", id));
      } else {
        await deleteDoc(doc(db, "trainers", id));
      }
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      alert(`Failed to delete ${type}. Please try again.`);
    }
  };

  // Handle AI assist for Assignment reviewer
  const handleAIAssistForAssignment = async () => {
    if (!selectedReview) return;
    setGeneratingFeedback(true);
    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "assignment-review",
          payload: {
            lessonTitle: selectedReview.lessonTitle,
            assignmentResponse: selectedReview.studentResponse
          }
        })
      });

      if (!res.ok) throw new Error("Gemini API failed");
      const data = await res.json(); // { score, approved, feedback, suggestions }
      setGradeScore(data.score || 85);
      setGradeApproved(data.approved !== false);
      setGradeFeedback(data.feedback || "Solid response structure with clear metrics outline.");
      setGradeSuggestions(data.suggestions || "Focus on building more long-term customer conversion loops.");
    } catch (err) {
      console.error(err);
      // Fallback
      setGradeScore(80);
      setGradeFeedback("Unable to reach Gemini AI Assist. Traditional grading applied. Good effort shown!");
      setGradeSuggestions("Focus on deepening acquisition channel metrics.");
    } finally {
      setGeneratingFeedback(false);
    }
  };

  // Handle AI assist for Capstone reviewer
  const handleAIAssistForCapstone = async () => {
    if (!selectedCapstone || !selectedCapstone.capstoneResponse) return;
    setGeneratingCapstoneFeedback(true);
    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "capstone-review",
          payload: {
            capstoneResponse: selectedCapstone.capstoneResponse
          }
        })
      });

      if (!res.ok) throw new Error("Gemini API failed");
      const data = await res.json();
      setCapstoneScore(data.score || 90);
      setCapstoneApproved(data.approved !== false);
      setCapstoneFeedback(data.feedback || "Excellent multi-channel campaign. Strategic elements align nicely.");
      setCapstoneSuggestions(data.suggestions || "Include technical tracking specifications (pixels, conversions).");
    } catch (err) {
      console.error(err);
      setCapstoneScore(85);
      setCapstoneFeedback("Unable to reach Gemini AI Assist. Excellent campaign plan structure.");
      setCapstoneSuggestions("Recommend further focus on SEO ranking projections.");
    } finally {
      setGeneratingCapstoneFeedback(false);
    }
  };

  // Submit Assignment Grade
  const submitAssignmentGrade = async () => {
    if (!selectedReview) return;
    setSavingGrade(true);
    const { student: s, lessonId } = selectedReview;
    try {
      const updatedAssignments = {
        ...(s.assignments || {}),
        [lessonId]: {
          studentResponse: selectedReview.studentResponse,
          score: gradeScore,
          approved: gradeApproved,
          feedback: gradeFeedback,
          suggestions: gradeSuggestions,
          submittedAt: new Date().toISOString()
        }
      };

      // Update student portfolio list if approved
      let updatedPortfolio = [...(s.portfolio || [])];
      if (gradeApproved) {
        // Remove existing if any, then insert updated
        updatedPortfolio = updatedPortfolio.filter(p => p.lessonId !== lessonId);
        updatedPortfolio.push({
          lessonId,
          lessonTitle: selectedReview.lessonTitle,
          studentResponse: selectedReview.studentResponse,
          score: gradeScore,
          feedback: gradeFeedback,
          suggestions: gradeSuggestions,
          completedAt: new Date().toISOString()
        });
      }

      // Update lesson stages
      const currentCompletedStages = s.lessonStages?.[lessonId] || [];
      const newCompletedStages = [...currentCompletedStages];
      if (!newCompletedStages.includes("instructor-review")) {
        newCompletedStages.push("instructor-review");
      }
      if (gradeApproved && !newCompletedStages.includes("portfolio-approve")) {
        newCompletedStages.push("portfolio-approve");
      }

      const updatedStages = {
        ...(s.lessonStages || {}),
        [lessonId]: newCompletedStages
      };

      // Progress check
      const updatedProgress = { ...(s.progress || {}) };
      if (gradeApproved) {
        updatedProgress[lessonId] = true;
        
        // Find next lesson to unlock automatically
        const currentIdx = allLessons.findIndex(l => l.id === lessonId);
        if (currentIdx !== -1 && currentIdx + 1 < allLessons.length) {
          const nextLessonId = allLessons[currentIdx + 1].id;
          if (updatedProgress[nextLessonId] === undefined) {
            updatedProgress[nextLessonId] = false; // unlock next lesson as incomplete
          }
        }
      }

      // Save to Firestore
      const studentDocRef = doc(db, "students", s.email);
      await setDoc(studentDocRef, {
        assignments: updatedAssignments,
        portfolio: updatedPortfolio,
        lessonStages: updatedStages,
        progress: updatedProgress
      }, { merge: true });

      // Clean state
      setSelectedReview(null);
      // Reset inputs
      setGradeFeedback("");
      setGradeSuggestions("");
    } catch (err) {
      console.error("Error saving assignment grade: ", err);
    } finally {
      setSavingGrade(false);
    }
  };

  // Submit Capstone Grade
  const submitCapstoneGrade = async () => {
    if (!selectedCapstone) return;
    setSavingCapstoneGrade(true);
    try {
      const feedbackData = {
        score: capstoneScore,
        feedback: capstoneFeedback,
        suggestions: capstoneSuggestions,
        approved: capstoneApproved,
        completedAt: new Date().toISOString()
      };

      // Save to Firestore
      const studentDocRef = doc(db, "students", selectedCapstone.email);
      await setDoc(studentDocRef, {
        capstoneSubmitted: true,
        capstoneFeedback: feedbackData
      }, { merge: true });

      setSelectedCapstone(null);
      setCapstoneFeedback("");
      setCapstoneSuggestions("");
    } catch (err) {
      console.error("Error saving capstone grade: ", err);
    } finally {
      setSavingCapstoneGrade(false);
    }
  };

  // Curriculum Helpers
  const handleAddModule = () => {
    if (!newModuleName.trim()) return;
    const newMod: CourseModule = {
      id: `module-${Date.now()}`,
      title: `${courseModules.length + 1}. ${newModuleName}`,
      description: newModuleDesc,
      lessons: [],
      category: newModuleCategory || "Digital Marketing"
    };
    const updated = [...courseModules, newMod];
    onUpdateModules(updated);
    
    // Save master curriculum to Firestore config collection so students see it too!
    saveCurriculumToFirestore(updated);

    setNewModuleName("");
    setNewModuleDesc("");
    setIsAddingModule(false);
  };

  const handleDeleteModule = (moduleId: string) => {
    
    const updated = courseModules.filter(m => m.id !== moduleId);
    onUpdateModules(updated);
    saveCurriculumToFirestore(updated);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const catName = newCategoryName.trim();
    if (categories.includes(catName)) {
      alert("This course category already exists!");
      return;
    }
    const updatedCats = [...categories, catName];
    onUpdateCategories(updatedCats);
    
    // Save to Firestore so it is persistent!
    saveCurriculumToFirestore(courseModules, updatedCats);
    
    setNewCategoryName("");
    setIsAddingCategory(false);
    setNewModuleCategory(catName); // Auto-select it for new module creation
  };

  const handleDeleteCategory = (catName: string) => {
    if (catName === "Digital Marketing") {
      alert("Cannot delete the default 'Digital Marketing' track.");
      return;
    }
    // Filter out modules that belong to this category
    const updatedModules = courseModules.filter(m => (m.category || "Digital Marketing") !== catName);
    const updatedCats = categories.filter(c => c !== catName);
    
    onUpdateModules(updatedModules);
    onUpdateCategories(updatedCats);
    
    // Save to Firestore!
    saveCurriculumToFirestore(updatedModules, updatedCats);
    
    // Reset filters
    if (curriculumCategoryFilter === catName) setCurriculumCategoryFilter("all");
    if (studentCategoryFilter === catName) setStudentCategoryFilter("all");
  };

  const handleAddQuizQuestion = () => {
    if (!newQuestionText.trim()) return;
    if (newQuestionOptions.some(opt => !opt.trim())) {
      alert("Please fill in all 4 multiple-choice options!");
      return;
    }
    
    const newQuestionObj = {
      id: `q-${Date.now()}`,
      question: newQuestionText.trim(),
      options: newQuestionOptions.map(o => o.trim()),
      correctAnswer: newQuestionCorrect,
      explanation: newQuestionExplanation.trim()
    };
    
    setLessonForm(prev => ({
      ...prev,
      quiz: {
        ...prev.quiz,
        questions: [...(prev.quiz?.questions || []), newQuestionObj]
      }
    }));
    
    // Reset question inputs
    setNewQuestionText("");
    setNewQuestionOptions(["", "", "", ""]);
    setNewQuestionCorrect(0);
    setNewQuestionExplanation("");
  };

  const handleRemoveQuizQuestion = (qId: string) => {
    setLessonForm(prev => {
      const updatedQs = (prev.quiz?.questions || []).filter(q => q.id !== qId);
      return {
        ...prev,
        quiz: {
          ...prev.quiz,
          questions: updatedQs
        }
      };
    });
  };

  const parseQuizFile = (text: string, fileName: string) => {
    try {
      setQuizUploadError(null);
      setQuizUploadSuccess(null);
      let newQuestions: any[] = [];

      if (fileName.endsWith(".json")) {
        const parsed = JSON.parse(text);
        const candidates = Array.isArray(parsed) ? parsed : [parsed];
        
        for (const item of candidates) {
          // Normalize keys to lowercase for robust case-insensitive lookup
          const normalized: any = {};
          for (const key of Object.keys(item)) {
            normalized[key.toLowerCase()] = item[key];
          }

          const questionText = normalized.question || normalized.prompt || normalized.text || "";
          const optionsList = normalized.options || normalized.choices || normalized.answers || [];
          
          if (!questionText || !Array.isArray(optionsList)) {
            throw new Error("Invalid JSON format. Each question must contain 'question' (string) and 'options' (array of strings).");
          }

          const rawCorrect = normalized.correctanswer !== undefined ? normalized.correctanswer : (normalized.correct || normalized.answer || normalized.key);
          let correctIdx = 0;
          if (typeof rawCorrect === "number") {
            correctIdx = rawCorrect;
          } else if (typeof rawCorrect === "string") {
            const cleaned = rawCorrect.trim().toUpperCase();
            if (cleaned === "A" || cleaned === "1" || cleaned === "0") correctIdx = 0;
            else if (cleaned === "B" || cleaned === "2") correctIdx = 1;
            else if (cleaned === "C" || cleaned === "3") correctIdx = 2;
            else if (cleaned === "D" || cleaned === "4") correctIdx = 3;
            else {
              const num = parseInt(cleaned, 10);
              correctIdx = isNaN(num) ? 0 : num;
            }
          }

          const explanationText = normalized.explanation || normalized.explain || normalized.rationale || normalized.feedback || normalized.reason || "";

          newQuestions.push({
            id: `q-uploaded-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            question: String(questionText).trim(),
            options: optionsList.map((o: any) => String(o).trim()),
            correctAnswer: correctIdx,
            explanation: String(explanationText).trim()
          });
        }
      } else if (fileName.endsWith(".csv")) {
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          throw new Error("CSV file is empty or missing data lines.");
        }
        
        const splitCSVLine = (line: string) => {
          const result = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; // Skip escaped quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase().replace(/^["']|["']$/g, "").trim());
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          const cols = splitCSVLine(line);
          if (cols.length < 2) continue;
          
          let question = "";
          let options: string[] = [];
          let correctAnswer = 0;
          let explanation = "";

          const qIdx = headers.findIndex(h => h.includes("question") || h.includes("prompt") || h.includes("text"));
          const correctColIdx = headers.findIndex(h => h.includes("correct") || h.includes("answer") || h.includes("key") || h === "ans");
          const expIdx = headers.findIndex(h => h.includes("explain") || h.includes("rational") || h.includes("feedback") || h.includes("reason") || h.includes("why"));
          
          if (qIdx !== -1 && cols[qIdx] !== undefined) {
            question = cols[qIdx];
          } else {
            question = cols[0];
          }

          const optIndices = headers.reduce((acc: number[], h, idx) => {
            if (h.includes("option") || h.includes("choice") || h === "a" || h === "b" || h === "c" || h === "d" || h.startsWith("opt")) {
              acc.push(idx);
            }
            return acc;
          }, []);

          if (optIndices.length >= 2) {
            options = optIndices.map(idx => cols[idx]);
          } else {
            options = cols.slice(1, 5);
          }

          options = options.filter(o => o !== undefined && o !== "").map(o => o.replace(/^["']|["']$/g, "").trim());
          if (options.length === 0) {
            options = ["Option A", "Option B", "Option C", "Option D"];
          }
          while (options.length < 4) {
            options.push(`Option ${String.fromCharCode(65 + options.length)}`);
          }

          if (correctColIdx !== -1 && cols[correctColIdx] !== undefined) {
            const rawCorrect = cols[correctColIdx].replace(/^["']|["']$/g, "").trim().toUpperCase();
            if (rawCorrect === "A" || rawCorrect === "1" || rawCorrect === "0") correctAnswer = 0;
            else if (rawCorrect === "B" || rawCorrect === "2") correctAnswer = 1;
            else if (rawCorrect === "C" || rawCorrect === "3") correctAnswer = 2;
            else if (rawCorrect === "D" || rawCorrect === "4") correctAnswer = 3;
            else {
              const num = parseInt(rawCorrect, 10);
              correctAnswer = isNaN(num) ? 0 : num;
            }
          } else {
            correctAnswer = 0;
          }

          if (expIdx !== -1 && cols[expIdx] !== undefined) {
            explanation = cols[expIdx].replace(/^["']|["']$/g, "").trim();
          } else {
            // Smart fallback: find any column after maximum index of question/options/correct column
            const maxUsedIdx = Math.max(qIdx, correctColIdx, ...optIndices);
            const potentialExpIdx = cols.length - 1;
            if (potentialExpIdx > maxUsedIdx && cols[potentialExpIdx] !== undefined) {
              explanation = cols[potentialExpIdx].replace(/^["']|["']$/g, "").trim();
            }
          }

          if (question) {
            newQuestions.push({
              id: `q-uploaded-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              question: question.replace(/^["']|["']$/g, "").trim(),
              options,
              correctAnswer,
              explanation
            });
          }
        }
      } else {
        throw new Error("Unsupported file format. Please upload a .json or .csv file.");
      }

      if (newQuestions.length === 0) {
        throw new Error("No valid questions found in the uploaded file.");
      }

      setLessonForm(prev => ({
        ...prev,
        quiz: {
          ...prev.quiz,
          questions: [...(prev.quiz?.questions || []), ...newQuestions]
        }
      }));

      setQuizUploadSuccess(`Successfully imported ${newQuestions.length} quiz question(s)!`);
      setTimeout(() => setQuizUploadSuccess(null), 4000);
    } catch (err: any) {
      console.error("Error parsing quiz file:", err);
      setQuizUploadError(err.message || "Failed to parse the file. Please check its formatting.");
    }
  };

  const handleQuizFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        parseQuizFile(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleQuizDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsQuizDragging(true);
  };

  const handleQuizDragLeave = () => {
    setIsQuizDragging(false);
  };

  const handleQuizDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsQuizDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleQuizFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleAiGenerateQuiz = async () => {
    if (!lessonForm.title.trim()) {
      alert("Please specify a Lesson Title first so that the AI can generate relevant questions!");
      return;
    }
    setIsAiGeneratingQuiz(true);
    setQuizGenerateError(null);
    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "generate-quiz",
          payload: {
            lessonTitle: lessonForm.title,
            lessonDescription: lessonForm.description,
            markdownContent: lessonForm.markdownContent
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      
      const data = await response.json();
      if (data.questions && Array.isArray(data.questions)) {
        const generatedQs = data.questions.map((q: any, idx: number) => ({
          id: `q-ai-${Date.now()}-${idx}`,
          question: q.question,
          options: q.options,
          correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
          explanation: q.explanation || ""
        }));
        
        setLessonForm(prev => ({
          ...prev,
          quiz: {
            ...prev.quiz,
            questions: [...(prev.quiz?.questions || []), ...generatedQs]
          }
        }));
      } else {
        throw new Error("Invalid response format from AI generator.");
      }
    } catch (err: any) {
      console.error("AI Quiz generation failed:", err);
      setQuizGenerateError(err.message || "Failed to generate questions. Please try again.");
    } finally {
      setIsAiGeneratingQuiz(false);
    }
  };

  const handleOpenAddLesson = (modId: string) => {
    setSelectedModuleIdForNewLesson(modId);
    setNewQuestionText("");
    setNewQuestionOptions(["", "", "", ""]);
    setNewQuestionCorrect(0);
    setNewQuestionExplanation("");
    setQuizGenerateError(null);
    setLessonForm({
      id: `lesson-${Date.now()}`,
      title: "",
      description: "",
      duration: "20 mins",
      markdownContent: "### Lesson Core Content\nType lesson theory here...",
      liveToolType: "none",
      resources: [],
      quiz: { questions: [] },
      videoUrl: ""
    });
    setIsAddingLesson(true);
  };

  const handleOpenEditLesson = (lesson: Lesson, modId: string) => {
    setSelectedModuleIdForNewLesson(modId);
    setEditingLesson(lesson);
    setNewQuestionText("");
    setNewQuestionOptions(["", "", "", ""]);
    setNewQuestionCorrect(0);
    setNewQuestionExplanation("");
    setQuizGenerateError(null);
    setLessonForm({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration,
      markdownContent: lesson.markdownContent || "",
      liveToolType: lesson.liveToolType || "none",
      resources: lesson.resources || [],
      quiz: lesson.quiz || { questions: [] },
      videoUrl: lesson.videoUrl || "",
      customAssignment: lesson.customAssignment || undefined
    });
    setIsAddingLesson(true);
  };

  const handleSaveLesson = () => {
    if (!lessonForm.title.trim()) return;

    const newLessonObj: Lesson = {
      id: lessonForm.id,
      title: lessonForm.title,
      description: lessonForm.description,
      duration: lessonForm.duration,
      markdownContent: lessonForm.markdownContent,
      liveToolType: lessonForm.liveToolType !== "none" ? lessonForm.liveToolType : undefined,
      resources: lessonForm.resources,
      quiz: lessonForm.quiz,
      videoUrl: lessonForm.videoUrl,
      customAssignment: lessonForm.customAssignment
    };

    const updated = courseModules.map(mod => {
      if (mod.id !== selectedModuleIdForNewLesson) return mod;

      let lessonsList = [...mod.lessons];
      const existingIdx = lessonsList.findIndex(l => l.id === lessonForm.id);

      if (existingIdx !== -1) {
        // Edit existing
        lessonsList[existingIdx] = newLessonObj;
      } else {
        // Add new
        lessonsList.push(newLessonObj);
      }

      return {
        ...mod,
        lessons: lessonsList
      };
    });

    onUpdateModules(updated);
    saveCurriculumToFirestore(updated);

    setIsAddingLesson(false);
    setEditingLesson(null);
  };

  const handleDeleteLesson = (modId: string, lessonId: string) => {
    
    const updated = courseModules.map(mod => {
      if (mod.id !== modId) return mod;
      return {
        ...mod,
        lessons: mod.lessons.filter(l => l.id !== lessonId)
      };
    });
    onUpdateModules(updated);
    saveCurriculumToFirestore(updated);
  };

  const saveCurriculumToFirestore = async (curriculumData: CourseModule[], categoriesList: string[] = categories) => {
    try {
      await setDoc(doc(db, "config", "curriculum"), {
        modules: curriculumData,
        categories: categoriesList,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Failed to persist curriculum to firestore config: ", e);
    }
  };

  const handleRejectSkipRequest = async (studentId: string, lessonId: string) => {
    const studentToUpdate = students.find(s => s.id === studentId);
    if (!studentToUpdate) return;

    const currentSkipRequests = { ...(studentToUpdate.skipRequests || {}) };
    delete currentSkipRequests[lessonId];

    try {
      const studentRef = doc(db, "students", studentToUpdate.email);
      await setDoc(studentRef, {
        skipRequests: currentSkipRequests
      }, { merge: true });

      setSelectedStudent(prev => {
        if (!prev || prev.id !== studentId) return prev;
        return {
          ...prev,
          skipRequests: currentSkipRequests
        };
      });
      
      if (selectedReview?.lessonId === lessonId && selectedReview?.student.id === studentId) {
        setSelectedReview(null);
      }
    } catch (err) {
      console.error("Error rejecting skip request:", err);
      alert("Error: " + err);
    }
  };

  const handleSkipLessonForStudent = async (studentId: string, lessonId: string) => {
    const studentToUpdate = students.find(s => s.id === studentId);
    if (!studentToUpdate) return;

    const allStageIds = [
      "attend-live",
      "watch-recording",
      "study-notes",
      "practice",
      "submit-assignment",
      "complete-quiz",
      "instructor-review",
      "portfolio-approve"
    ];

    const currentStages = { ...(studentToUpdate.lessonStages || {}) };
    currentStages[lessonId] = allStageIds;

    const currentProgress = { ...(studentToUpdate.progress || {}) };
    currentProgress[lessonId] = true;

    const currentAssignments = { ...(studentToUpdate.assignments || {}) };
    if (!currentAssignments[lessonId]) {
      currentAssignments[lessonId] = {
        studentResponse: "Skipped / Fast-tracked by Trainer recommendation.",
        score: 100,
        feedback: "Bypassed by Instructor.",
        suggestions: "No suggestions.",
        approved: true,
        submittedAt: new Date().toISOString()
      };
    } else {
      currentAssignments[lessonId] = {
        ...currentAssignments[lessonId],
        approved: true,
        score: currentAssignments[lessonId].score || 100,
        feedback: currentAssignments[lessonId].feedback || "Bypassed by Instructor."
      };
    }

    const currentSkipRequests = { ...(studentToUpdate.skipRequests || {}) };
    delete currentSkipRequests[lessonId];

    try {
      const studentRef = doc(db, "students", studentToUpdate.email);
      await setDoc(studentRef, {
        lessonStages: currentStages,
        progress: currentProgress,
        assignments: currentAssignments,
        skipRequests: currentSkipRequests
      }, { merge: true });

      setSelectedStudent(prev => {
        if (!prev || prev.id !== studentId) return prev;
        return {
          ...prev,
          lessonStages: currentStages,
          progress: currentProgress,
          assignments: currentAssignments,
          skipRequests: currentSkipRequests
        };
      });
      
      // Also clear it if we have selected it for grading
      if (selectedReview?.lessonId === lessonId && selectedReview?.student.id === studentId) {
        setSelectedReview(null);
      }
    } catch (err) {
      console.error("Error skipping lesson for student:", err);
      alert("Error fast-tracking: " + err);
    }
  };

  // Helper score math
  const getAverageQuizScore = (s: Student) => {
    if (!s.quizScores || Object.keys(s.quizScores).length === 0) return "-";
    const scores = Object.values(s.quizScores);
    const avg = scores.reduce((sum, current) => sum + current, 0) / scores.length;
    return `${Math.round(avg)}%`;
  };

  const getLessonsCompletedCount = (s: Student) => {
    return Object.values(s.progress || {}).filter(Boolean).length;
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const name = s.name || "";
    const email = s.email || "";
    const matchesSearch = name.toLowerCase().includes((searchQuery || "").toLowerCase()) || 
                          email.toLowerCase().includes((searchQuery || "").toLowerCase());
    
    // Check category filter
    const matchesCategory = studentCategoryFilter === "all" || (s.courseCategory || "Digital Marketing") === studentCategoryFilter;
    if (!matchesCategory) return false;
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "graduated") return matchesSearch && s.capstoneFeedback?.approved;
    if (statusFilter === "active") return matchesSearch && !s.capstoneFeedback?.approved;
    if (statusFilter === "pending") {
      // Check if they have ANY assignment that's submitted but not portfolio-approved
      const hasPending = Object.entries(s.assignments || {}).some(([lessonId, rawAssign]) => {
        const assign = rawAssign as { studentResponse?: string };
        const completedStages = s.lessonStages?.[lessonId] || [];
        return !completedStages.includes("portfolio-approve") && assign.studentResponse;
      }) || (s.capstoneSubmitted && !s.capstoneFeedback?.approved);
      return matchesSearch && hasPending;
    }
    return matchesSearch;
  });

  const filteredCurriculumModules = courseModules.filter(m => curriculumCategoryFilter === "all" || (m.category || "Digital Marketing") === curriculumCategoryFilter);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 animate-fade-in" id="trainer-admin-portal">
      <AnimatePresence>
        {activeInAppMeetingUrl && activeInAppMeetingTitle && (
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
                studentName="Instructor Mike"
                studentEmail="mike@coimbatore.growth"
                isTrainer={true}
                onLeave={() => {
                  setActiveInAppMeetingUrl(null);
                  setActiveInAppMeetingTitle(null);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Meeting Help Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3.5 text-left shadow-sm">
        <div className="p-2 bg-amber-500 rounded-xl text-white shrink-0 shadow-sm">
          <Video className="w-5 h-5 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h4 className="font-extrabold text-sm text-amber-900 flex items-center gap-2">
            💡 Quick Guide: Where to create class meeting links?
          </h4>
          <p className="text-xs text-amber-700 leading-relaxed">
            As requested, you can create and manage virtual classroom meetings inside this Command Center by clicking on the <strong className="font-black text-amber-950">🔴 Live Broadcast</strong> bento tab below. Use it to generate Google Meet links or dispatch private consultation rooms to your cohort.
          </p>
        </div>
      </div>

      {/* Header Grid */}
      <div className="bg-slate-950 text-white rounded-[32px] p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-slate-800 shadow-2xl relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full -mr-24 -mt-24 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full -ml-20 -mb-20 pointer-events-none"></div>
        
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-[9px] font-black rounded-full uppercase tracking-widest font-mono">
              Academy Administrator
            </span>
            <span className="px-3 py-1 bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[9px] font-black rounded-full uppercase tracking-widest font-mono">
              ⚡ Real-time Sync Active
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-1 text-white">Trainer Command Center</h2>
          <p className="text-sm text-slate-400 font-medium">Evaluate student portfolios, run live lectures, manage curriculum modules, and graduate the cohort.</p>
        </div>
        <button 
          id="btn-close-trainer"
          onClick={onClose}
          className="px-5 py-3 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-2xl text-xs font-black tracking-tight border border-slate-800 transition-all flex items-center gap-2 cursor-pointer shrink-0 z-10 shadow-lg"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          Back to Classroom
        </button>
      </div>

      {/* Sub tabs Bento Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 mb-8">
        {[
          { id: "overview", label: "Cohort Overview", icon: Users, desc: "Roster & Performance" },
          { id: "review", label: "Grading Hub", icon: FileCheck, desc: `${pendingAssignments.length} Assignments Waiting`, alert: pendingAssignments.length > 0 },
          { id: "capstone", label: "Capstone Projects", icon: GraduationCap, desc: `${pendingCapstones.length} Capstones Submitted`, alert: pendingCapstones.length > 0 },
          { id: "curriculum", label: "Syllabus Manager", icon: Layers, desc: `${courseModules.length} Active Modules` },
          { id: "live_studio", label: "🔴 Live Broadcast", icon: Radio, desc: "Broadcast & Link Dispatcher" },
          { id: "scheduler", label: "Meeting Scheduler", icon: Calendar, desc: "Book 1-on-1s" },
          { id: "onboarding", label: "User Management", icon: UserPlus, desc: "Add & Remove Users" }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              id={`tab-trainer-${tab.id}`}
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
                setSelectedStudent(null);
                setSelectedReview(null);
                setSelectedCapstone(null);
              }}
              className={`rounded-2xl p-4 border text-left transition-all duration-300 cursor-pointer relative overflow-hidden transform hover:-translate-y-0.5 ${
                isActive 
                  ? "bg-white border-indigo-200 shadow-md ring-2 ring-indigo-500/20" 
                  : "bg-white/70 hover:bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div className="flex justify-between items-center mb-2.5">
                <div className={`p-2 rounded-xl transition ${isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-150" : "bg-slate-100 text-slate-500"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {tab.alert && (
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full ring-4 ring-rose-50 animate-pulse"></span>
                )}
              </div>
              <h3 className={`font-bold text-sm ${isActive ? "text-slate-900" : "text-slate-700"}`}>{tab.label}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{tab.desc}</p>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB CONTENTS */}
      <div className="space-y-6">
        
        {/* TAB 1: COHORT OVERVIEW */}
        {activeSubTab === "overview" && (
          <div className="space-y-6">
            {/* Roster Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Enrolled</span>
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Users className="w-4 h-4" /></div>
                </div>
                <h4 className="text-2xl font-black font-mono text-slate-900">{students.length}</h4>
                <p className="text-[10px] text-slate-400 mt-1">Verified growth trainees</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cohort Progress</span>
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><BookOpen className="w-4 h-4" /></div>
                </div>
                <h4 className="text-2xl font-black font-mono text-slate-900">
                  {students.length > 0 
                    ? `${Math.round(students.reduce((acc, s) => acc + getLessonsCompletedCount(s), 0) / (students.length * allLessons.length) * 100)}%`
                    : "0%"
                  }
                </h4>
                <p className="text-[10px] text-slate-400 mt-1">Syllabus milestone completion</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Grades</span>
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><FileCheck className="w-4 h-4" /></div>
                </div>
                <h4 className="text-2xl font-black font-mono text-slate-900">{pendingAssignments.length}</h4>
                <p className="text-[10px] text-slate-400 mt-1">Awaiting instructor evaluation</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Graduates</span>
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><Award className="w-4 h-4" /></div>
                </div>
                <h4 className="text-2xl font-black font-mono text-slate-900">
                  {students.filter(s => s.capstoneFeedback?.approved).length}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1">Certified Growth Practitioners</p>
              </div>
            </div>

            {/* Main Student List Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Verified Cohort Directory</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time status of student portfolios and lessons.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search trainee..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 w-full sm:w-48"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
                  >
                    <option value="all">📁 All Roster</option>
                    <option value="active">⚡ Active Students</option>
                    <option value="graduated">🎓 Graduates Only</option>
                    <option value="pending">🔔 Needs Grading</option>
                  </select>

                  <select
                    value={studentCategoryFilter}
                    onChange={(e) => setStudentCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none font-medium"
                  >
                    <option value="all">🎓 All Courses</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>🎓 {cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Trainee Profile</th>
                      <th className="py-3 px-4">Enrolled At</th>
                      <th className="py-3 px-4 text-center">Lessons Passed</th>
                      <th className="py-3 px-4 text-center">Quiz Average</th>
                      <th className="py-3 px-4">Capstone Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-sm">
                    {loadingStudents ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-mono text-xs">
                          Synchronizing with Firestore Database...
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-medium text-xs">
                          No matching student accounts found.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => {
                        const passedCount = getLessonsCompletedCount(s);
                        const isGraduated = s.capstoneFeedback?.approved;
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div>
                                <span className="font-bold text-slate-900 block leading-tight">{s.name}</span>
                                <span className="text-xs text-slate-400 block font-mono leading-none mt-1">{s.email}</span>
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  <span className="inline-flex items-center text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100/60 px-2 py-0.5 rounded-md font-mono uppercase tracking-wider">
                                    🎓 {s.courseCategory || "Digital Marketing"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                              {s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString() : "-"}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-flex items-center justify-center font-bold text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100 font-mono">
                                {passedCount} / {allLessons.length}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                              {getAverageQuizScore(s)}
                            </td>
                            <td className="py-3.5 px-4">
                              {isGraduated ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                                  ✓ Certified
                                </span>
                              ) : s.capstoneSubmitted ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100 animate-pulse">
                                  🔔 Review Ready
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-100">
                                  In Progress
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setSelectedStudent(s)}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                              >
                                View Milestones
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trainee Milestone Details Slideover/Modal */}
            <AnimatePresence>
              {selectedStudent && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto text-left"
                  >
                    <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-5">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-black text-slate-900">{selectedStudent.name}</h4>
                          {selectedStudent.capstoneFeedback?.approved && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-extrabold uppercase font-mono">
                              GRADUATED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">{selectedStudent.email}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedStudent(null)}
                        className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        ✕ Close
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Specialization Track & Goal */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50/80 border border-slate-200/60 rounded-2xl">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1.5">Specialization Track</span>
                          <select
                            value={selectedStudent.courseCategory || "Digital Marketing"}
                            onChange={async (e) => {
                              const newCat = e.target.value;
                              const updatedStudent = {
                                ...selectedStudent,
                                courseCategory: newCat
                              };
                              // Update in local state students array
                              setStudents(prev => prev.map(s => s.id === selectedStudent.id ? updatedStudent : s));
                              setSelectedStudent(updatedStudent);
                              // Save to firestore!
                              try {
                                await updateDoc(doc(db, "students", selectedStudent.id), {
                                  courseCategory: newCat
                                });
                              } catch (err) {
                                console.error("Error reassigning course:", err);
                              }
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none cursor-pointer"
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>🎓 {cat}</option>
                            ))}
                          </select>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Career Focus Goal</span>
                          <p className="text-xs font-semibold text-slate-800 mt-1.5">🎯 {selectedStudent.email.includes("arun") ? "Offer consulting/freelance services" : "Scale my e-commerce business"}</p>
                        </div>
                      </div>

                      {/* Course Progress breakdown */}
                      <div>
                        <h5 className="font-extrabold text-slate-900 text-sm mb-3 uppercase tracking-wider text-slate-500">Lesson Stages Journey</h5>
                        <div className="space-y-4">
                          {allLessons.map((lesson) => {
                            const completedStages = selectedStudent.lessonStages?.[lesson.id] || [];
                            const isCompleted = selectedStudent.progress?.[lesson.id] === true;
                            return (
                              <div key={lesson.id} className="border border-slate-100 p-4 rounded-2xl bg-slate-50/40">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-bold text-slate-800">{lesson.title}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isCompleted ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"
                                  }`}>
                                    {isCompleted ? "Completed" : "Active / Unlocked"}
                                  </span>
                                </div>

                                {/* Custom stage indicators */}
                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mt-2.5">
                                  {[
                                    { id: "attend-live", label: "Live" },
                                    { id: "watch-recording", label: "Rec" },
                                    { id: "study-notes", label: "Study" },
                                    { id: "practice", label: "Prac" },
                                    { id: "submit-assignment", label: "Sub" },
                                    { id: "complete-quiz", label: "Quiz" },
                                    { id: "instructor-review", label: "Grad" },
                                    { id: "portfolio-approve", label: "Port" }
                                  ].map((stage) => {
                                    const passed = completedStages.includes(stage.id);
                                    return (
                                      <div 
                                        key={stage.id} 
                                        title={stage.label}
                                        className={`py-1 text-center text-[10px] font-bold rounded-lg border transition ${
                                          passed 
                                            ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" 
                                            : "bg-slate-100 border-slate-200 text-slate-400"
                                        }`}
                                      >
                                        {stage.label}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Show Quiz Score & Submitted work summary if any */}
                                <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-150 text-xs text-slate-500 font-mono">
                                  <div className="flex gap-4">
                                    <div>
                                      Quiz Score: <span className="font-bold text-slate-700">{selectedStudent.quizScores?.[lesson.id] ? `${selectedStudent.quizScores[lesson.id]}%` : "Not taken"}</span>
                                    </div>
                                    <div>
                                      Homework: <span className="font-bold text-slate-700">{selectedStudent.assignments?.[lesson.id] ? "Submitted" : "No submission"}</span>
                                    </div>
                                  </div>
                                  {!isCompleted && (
                                    <button
                                      id={`btn-skip-lesson-${lesson.id}`}
                                      onClick={() => {
                                        handleSkipLessonForStudent(selectedStudent.id, lesson.id);
                                      }}
                                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-lg cursor-pointer transition flex items-center gap-1 font-sans"
                                    >
                                      ⏩ Skip & Unlock
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Portfolio Showcases */}
                      <div>
                        <h5 className="font-extrabold text-slate-900 text-sm mb-3 uppercase tracking-wider text-slate-500">Student Portfolio Items ({selectedStudent.portfolio?.length || 0})</h5>
                        {selectedStudent.portfolio && selectedStudent.portfolio.length > 0 ? (
                          <div className="space-y-3">
                            {selectedStudent.portfolio.map((item) => (
                              <div key={item.lessonId} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-bold text-xs text-slate-800">{item.lessonTitle}</span>
                                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-mono">
                                    Grade: {item.score}%
                                  </span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 line-clamp-3 overflow-hidden font-mono mt-2">
                                  {item.studentResponse}
                                </div>
                                {item.feedback && (
                                  <p className="text-[11px] text-indigo-600 italic mt-2.5">
                                    <span className="font-bold">Feedback:</span> {item.feedback}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No approved portfolio projects compiled yet.</p>
                        )}
                      </div>

                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* TAB 2: GRADING & REVIEWS HUB */}
        {activeSubTab === "review" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
            {/* List of Pending Submissions */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Homework Portfolio Review</h3>
              <p className="text-xs text-slate-500 mb-5">Grade submitted assignments to publish them into students' digital portfolios.</p>

              {pendingAssignments.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Inbox Completely Clean!</p>
                  <p className="text-[10px] text-slate-400 mt-1">All submitted assignments have been fully reviewed and certified.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {pendingAssignments.map((assign, index) => {
                    const isSelected = selectedReview?.student.id === assign.student.id && selectedReview?.lessonId === assign.lessonId;
                    return (
                      <button
                        id={`btn-select-review-${index}`}
                        key={`${assign.student.id}-${assign.lessonId}`}
                        onClick={() => {
                          setSelectedReview(assign);
                          const existingScore = assign.student.assignments?.[assign.lessonId]?.score || 85;
                          const existingFeedback = assign.student.assignments?.[assign.lessonId]?.feedback || "";
                          const existingSuggestions = assign.student.assignments?.[assign.lessonId]?.suggestions || "";
                          setGradeScore(existingScore);
                          setGradeApproved(true);
                          setGradeFeedback(existingFeedback);
                          setGradeSuggestions(existingSuggestions);
                        }}
                        className={`w-full text-left p-4 rounded-2xl border transition relative overflow-hidden ${
                          isSelected 
                            ? "bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-100" 
                            : "bg-slate-50/50 hover:bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-extrabold text-slate-900 text-xs block truncate max-w-[150px]">{assign.student.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {assign.submittedAt ? new Date(assign.submittedAt).toLocaleDateString() : "Just now"}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-700 line-clamp-1">{assign.lessonTitle}</h4>
                        {assign.isSkipRequest ? (
                          <div className="mt-2 text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-1 rounded-md border border-amber-200 w-fit">
                            Skip Request
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 font-mono bg-white p-2 rounded-lg border border-slate-100">{assign.studentResponse}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Review / Grading Pane */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              {selectedReview ? (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-extrabold font-mono uppercase tracking-wide">
                        Active Review Case
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 leading-tight">{selectedReview.lessonTitle}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1.5">
                      <span>Student: <strong className="text-slate-700">{selectedReview.student.name}</strong></span>
                      <span className="font-mono">{selectedReview.student.email}</span>
                    </div>
                  </div>

                  {selectedReview.isSkipRequest ? (
                    <div className="flex flex-col gap-4 mt-6">
                      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                        <p className="text-amber-800 text-sm font-bold">This student has requested to skip this lesson.</p>
                        <p className="text-amber-600 text-xs mt-1">If approved, all stages of this lesson will be bypassed and the lesson will be marked as fully completed.</p>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={() => setSelectedReview(null)}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl text-xs transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRejectSkipRequest(selectedReview.student.id, selectedReview.lessonId)}
                          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
                        >
                          Reject Skip Request
                        </button>
                        <button
                          onClick={() => handleSkipLessonForStudent(selectedReview.student.id, selectedReview.lessonId)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
                        >
                          Approve Skip Request
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Student Response Display */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Student Submission Response</label>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 text-slate-800 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                          {selectedReview.studentResponse}
                        </div>
                      </div>

                      {/* AI assist button */}
                      <div className="flex justify-end pt-1">
                        <button
                          id="btn-ai-assist-grade"
                          onClick={handleAIAssistForAssignment}
                          disabled={generatingFeedback}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-md"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                          {generatingFeedback ? "AI Synthesizing Feedback..." : "Draft with AI Instructor Assistance"}
                        </button>
                      </div>

                      {/* Review / Grading Input Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div className="space-y-4">
                          {/* Score Input */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Grade Score</label>
                              <span className="text-xs font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{gradeScore} / 100</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={gradeScore}
                              onChange={(e) => setGradeScore(Number(e.target.value))}
                              className="w-full accent-indigo-600 cursor-pointer"
                            />
                          </div>

                          {/* Approval Status */}
                          <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                            <input 
                              type="checkbox" 
                              id="checkbox-grade-approved"
                              checked={gradeApproved}
                              onChange={(e) => setGradeApproved(e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                            <label htmlFor="checkbox-grade-approved" className="text-xs text-left cursor-pointer">
                              <strong className="text-slate-800 block">Approve & Publish to Portfolio</strong>
                              <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">Approved submissions appear directly in the student's digital portfolio showcase.</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-4 text-left">
                          {/* Feedback Comment */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Trainer Comments & Critique</label>
                            <textarea
                              placeholder="e.g. Excellent application of the PAS framework. Your problem statement is incredibly clear..."
                              value={gradeFeedback}
                              onChange={(e) => setGradeFeedback(e.target.value)}
                              className="w-full h-20 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 leading-relaxed text-slate-800 resize-none"
                              required
                            />
                          </div>

                          {/* Suggestions Comment */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Strategic Improvements / Recommendations</label>
                            <textarea
                              placeholder="e.g. Consider adding clear social proof immediately below your call to action..."
                              value={gradeSuggestions}
                              onChange={(e) => setGradeSuggestions(e.target.value)}
                              className="w-full h-20 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 leading-relaxed text-slate-800 resize-none"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Submission Row */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => setSelectedReview(null)}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl text-xs transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          id="btn-save-grade"
                          onClick={submitAssignmentGrade}
                          disabled={savingGrade || !gradeFeedback.trim()}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-100 disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {savingGrade ? "Persisting Evaluation..." : "Publish Evaluation Portfolio Item"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200 mb-4">
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-700">No Submission Selected</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">Select an active student's assignment from the left column to begin grading and AI synthesis.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CAPSTONE REVIEW HUB */}
        {activeSubTab === "capstone" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
            {/* List of Submitted Capstones */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Graduation Capstones</h3>
              <p className="text-xs text-slate-500 mb-5">Grade final masterclass campaigns to issue official academy credentials.</p>

              {pendingCapstones.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                  <Award className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No Capstones Pending</p>
                  <p className="text-[10px] text-slate-400 mt-1">All trainee graduation models have been assessed and credentialed.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingCapstones.map((st, index) => {
                    const isSelected = selectedCapstone?.id === st.id;
                    return (
                      <button
                        id={`btn-select-capstone-${index}`}
                        key={st.id}
                        onClick={() => {
                          setSelectedCapstone(st);
                          const existingScore = st.capstoneFeedback?.score || 90;
                          const existingFeedback = st.capstoneFeedback?.feedback || "";
                          const existingSuggestions = st.capstoneFeedback?.suggestions || "";
                          setCapstoneScore(existingScore);
                          setCapstoneApproved(true);
                          setCapstoneFeedback(existingFeedback);
                          setCapstoneSuggestions(existingSuggestions);
                        }}
                        className={`w-full text-left p-4 rounded-2xl border transition relative overflow-hidden ${
                          isSelected 
                            ? "bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-100" 
                            : "bg-slate-50/50 hover:bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-extrabold text-slate-900 text-xs block">{st.name}</span>
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded font-mono">
                            Ready
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate font-mono mt-1">{st.capstoneResponse}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Capstone Grading Form */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              {selectedCapstone ? (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-4">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-extrabold font-mono uppercase tracking-wide block w-max mb-1.5">
                      Graduation Board Review
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 leading-tight">Master Campaign Graduation Plan</h3>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                      <span>Trainee: <strong className="text-slate-700">{selectedCapstone.name}</strong></span>
                      <span className="font-mono">{selectedCapstone.email}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Capstone Multi-Channel Campaign Proposal</label>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 text-slate-800 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                      {selectedCapstone.capstoneResponse}
                    </div>
                  </div>

                  {/* AI assist button */}
                  <div className="flex justify-end pt-1">
                    <button
                      id="btn-capstone-ai-assist"
                      onClick={handleAIAssistForCapstone}
                      disabled={generatingCapstoneFeedback}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                      {generatingCapstoneFeedback ? "Evaluating Campaign with AI..." : "Evaluate via AI Graduation Assistant"}
                    </button>
                  </div>

                  {/* Grade parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="space-y-4">
                      {/* Score slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Graduation Grade</label>
                          <span className="text-xs font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{capstoneScore}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={capstoneScore}
                          onChange={(e) => setCapstoneScore(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      {/* Certify Check */}
                      <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                        <input 
                          type="checkbox" 
                          id="checkbox-capstone-approved"
                          checked={capstoneApproved}
                          onChange={(e) => setCapstoneApproved(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <label htmlFor="checkbox-capstone-approved" className="text-xs text-left cursor-pointer">
                          <strong className="text-slate-800 block">Approve Graduation & Credentials</strong>
                          <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">This issues an official downloadable growth practitioner certificate and completes their roadmap.</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4 text-left">
                      {/* Comments */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Registrar General Comments</label>
                        <textarea
                          placeholder="e.g. Outstanding marketing mix strategy. Creative tactics pair extremely well with search intent parameters..."
                          value={capstoneFeedback}
                          onChange={(e) => setCapstoneFeedback(e.target.value)}
                          className="w-full h-20 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 leading-relaxed text-slate-800 resize-none"
                          required
                        />
                      </div>

                      {/* Suggestions */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Strategic Recommendations to Scale Campaign</label>
                        <textarea
                          placeholder="e.g. Consider A/B testing copy angles targeting emotional relief vs economic optimization..."
                          value={capstoneSuggestions}
                          onChange={(e) => setCapstoneSuggestions(e.target.value)}
                          className="w-full h-20 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 leading-relaxed text-slate-800 resize-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submission Row */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedCapstone(null)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-save-capstone"
                      onClick={submitCapstoneGrade}
                      disabled={savingCapstoneGrade || !capstoneFeedback.trim()}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-100 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingCapstoneGrade ? "Filing Credentials..." : "Commit Graduation Assessment"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200 mb-4">
                    <GraduationCap className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-700">No Capstone Proposal Selected</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">Select an active student's final Capstone campaign plan from the left column to evaluate and grade.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SYLLABUS / CURRICULUM MANAGER */}
        {activeSubTab === "curriculum" && (
          <div className="space-y-6 w-full text-left">
            {/* COURSE & CATEGORIES MANAGER BAR */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Course Tracks & Specializations
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Define student tracks (e.g., Digital Marketing, Data Science) and assign syllabi.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="btn-toggle-add-cat"
                    onClick={() => setIsAddingCategory(!isAddingCategory)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create New Course Category
                  </button>
                </div>
              </div>

              {isAddingCategory && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-indigo-50/30 border border-indigo-100 p-4 rounded-2xl mb-5 max-w-md"
                >
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2.5">Add Dynamic Course Track</h4>
                  <div className="flex gap-2">
                    <input
                      id="input-new-cat-name"
                      type="text"
                      placeholder="e.g. Data Science, Web Development"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      id="btn-confirm-add-cat"
                      onClick={handleAddCategory}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition cursor-pointer"
                    >
                      Add Course
                    </button>
                    <button
                      onClick={() => setIsAddingCategory(false)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Roster of active tracks */}
              <div className="flex flex-wrap gap-2.5 items-center">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mr-1">Active Course Badges:</span>
                {categories.map((cat) => {
                  const modCount = courseModules.filter(m => (m.category || "Digital Marketing") === cat).length;
                  return (
                    <div
                      key={cat}
                      className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 shadow-sm"
                    >
                      <span>🎓 {cat} ({modCount} modules)</span>
                      {cat !== "Digital Marketing" && (
                        <button
                          id={`btn-del-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-0.5 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded transition cursor-pointer ml-1"
                          title="Delete Entire Course Track"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Filter active Modules list by category */}
              <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Filter Syllabus Builder:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      id="btn-curriculum-filter-all"
                      onClick={() => setCurriculumCategoryFilter("all")}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
                        curriculumCategoryFilter === "all"
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      All Modules ({courseModules.length})
                    </button>
                    {categories.map((cat) => {
                      const modCount = courseModules.filter(m => (m.category || "Digital Marketing") === cat).length;
                      return (
                        <button
                          key={cat}
                          id={`btn-curriculum-filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                          onClick={() => setCurriculumCategoryFilter(cat)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
                            curriculumCategoryFilter === cat
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {cat} ({modCount})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Active Syllabus Modules list */}
              <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">Course Syllabus Modules</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Edit modules, build sequential learning nodes.</p>
                  </div>
                  <button
                    id="btn-add-module"
                    onClick={() => {
                      setIsAddingModule(true);
                      setIsAddingLesson(false);
                      setEditingLesson(null);
                    }}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-50 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Module
                  </button>
                </div>

                {isAddingModule && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-indigo-200 bg-indigo-50/20 p-4 rounded-2xl mb-5 space-y-3.5 text-left"
                  >
                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Create New Course Module</h4>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Module Name / Theme</label>
                      <input 
                        id="input-new-mod-title"
                        type="text" 
                        placeholder="e.g. Email Marketing Automation"
                        value={newModuleName}
                        onChange={(e) => setNewModuleName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-950 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Short Description</label>
                      <input 
                        id="input-new-mod-desc"
                        type="text" 
                        placeholder="e.g. Build segmented subscriber pathways and optimize automated drip sequences..."
                        value={newModuleDesc}
                        onChange={(e) => setNewModuleDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-950 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Course Specialization / Category</label>
                      <select 
                        id="select-new-mod-category"
                        value={newModuleCategory}
                        onChange={(e) => setNewModuleCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-950 focus:outline-none cursor-pointer font-semibold"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>🎓 {cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end gap-2.5">
                      <button 
                        onClick={() => setIsAddingModule(false)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-500 font-bold rounded-lg text-[10px]"
                      >
                        Cancel
                      </button>
                      <button 
                        id="btn-submit-new-mod"
                        onClick={handleAddModule}
                        className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg text-[10px]"
                      >
                        Confirm Create
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-4">
                  {filteredCurriculumModules.map((mod) => (
                    <div key={mod.id} className="border border-slate-150 p-4 rounded-2xl bg-slate-50/40 relative">
                      <div className="flex justify-between items-start mb-2.5">
                        <div className="max-w-[70%]">
                          <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{mod.title}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{mod.description}</p>
                          <span className="inline-flex items-center text-[8px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded mt-1 font-mono uppercase tracking-wider">
                            {mod.category || "Digital Marketing"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            title="Add Lesson to Module"
                            onClick={() => handleOpenAddLesson(mod.id)}
                            className="p-1 hover:bg-slate-100 text-indigo-600 hover:text-indigo-800 rounded transition cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            title="Delete Module"
                            onClick={() => handleDeleteModule(mod.id)}
                            className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Lessons flat roster in this module */}
                      <div className="space-y-2 mt-3 pl-3 border-l-2 border-indigo-100">
                        {mod.lessons.length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic">No lessons inside this module yet.</p>
                        ) : (
                          mod.lessons.map((lesson) => (
                            <div key={lesson.id} className="flex justify-between items-center text-xs bg-white border border-slate-200/60 p-2.5 rounded-xl">
                              <div className="max-w-[75%]">
                                <span className="font-bold text-slate-800 block truncate">{lesson.title}</span>
                                <span className="text-[9px] text-slate-400 block font-mono mt-0.5">Duration: {lesson.duration} • Tool: {lesson.liveToolType || "none"}</span>
                              </div>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleOpenEditLesson(lesson, mod.id)}
                                  className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded cursor-pointer"
                                  title="Edit Lesson Content"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLesson(mod.id, lesson.id)}
                                  className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded cursor-pointer"
                                  title="Delete Lesson"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lesson / Resource / Quiz Editor Panel */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              {isAddingLesson ? (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <div>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-extrabold font-mono uppercase">
                        Syllabus Builder
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-1">
                        {editingLesson ? `Edit Lesson: ${editingLesson.title}` : "Build & Append New Course Lesson"}
                      </h4>
                    </div>
                    <button 
                      onClick={() => setIsAddingLesson(false)}
                      className="text-xs text-slate-400 hover:text-slate-800 cursor-pointer"
                    >
                      ✕ Close Form
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Lesson ID (Static URL / Key)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. lesson-1-3"
                          value={lessonForm.id}
                          disabled={!!editingLesson}
                          onChange={(e) => setLessonForm({ ...lessonForm, id: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-950 focus:outline-none disabled:opacity-60"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Estimated Duration</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 20 mins"
                          value={lessonForm.duration}
                          onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-950 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Lesson Title / Milestone Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 1.3 High-Converting Landing Page Frameworks"
                        value={lessonForm.title}
                        onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-950 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Description / Overview Summary</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Discover conversion-centered page models, write clickworthy headlines, and design trust signals."
                        value={lessonForm.description}
                        onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-950 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Interactive Practice Sandbox Tool Type</label>
                      <select
                        value={lessonForm.liveToolType}
                        onChange={(e) => setLessonForm({ ...lessonForm, liveToolType: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 cursor-pointer"
                      >
                        <option value="none">❌ No sandbox required (Theory only)</option>
                        <option value="roi-calc">📊 Interactive ROI & Funnel Calculator</option>
                        <option value="seo-meta">🔍 Search Meta Tag Optimizer</option>
                        <option value="ad-copy">✏️ Dynamic Ad Copy generator</option>
                        <option value="persona">👤 Target Persona & Demographic Sketchpad</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Custom Video / Recording URL (YouTube Embed or direct link)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. https://www.youtube.com/embed/dQw4w9WgXcQ"
                        value={lessonForm.videoUrl || ""}
                        onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-950 focus:outline-none font-mono"
                      />
                    </div>

                    {/* Markdown Study Content */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Theoretical Content (Markdown Format)</label>
                      <textarea
                        value={lessonForm.markdownContent}
                        onChange={(e) => setLessonForm({ ...lessonForm, markdownContent: e.target.value })}
                        className="w-full h-36 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono resize-y leading-relaxed text-slate-800"
                        placeholder="### Section Heading..."
                      />
                    </div>

                    {/* Custom Assignment Builder */}
                    <div className="border border-indigo-100 rounded-2xl bg-indigo-50/20 p-4 space-y-4 text-left">
                      <div className="pb-3 border-b border-indigo-100/50 flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckSquare className="w-4 h-4 text-indigo-500" />
                            Custom Assignment Prompt
                          </h5>
                          <p className="text-[10px] text-slate-500 mt-0.5">Override default prompts by configuring a custom homework assignment.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-700">Enable Custom Assignment</label>
                          <input 
                            type="checkbox"
                            checked={!!lessonForm.customAssignment}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setLessonForm({ ...lessonForm, customAssignment: { title: "", prompt: "", placeholder: "" } });
                              } else {
                                setLessonForm({ ...lessonForm, customAssignment: undefined });
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                        </div>
                      </div>

                      {lessonForm.customAssignment && (
                        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-150 shadow-sm">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Assignment Title</label>
                            <input 
                              type="text"
                              value={lessonForm.customAssignment.title}
                              onChange={(e) => setLessonForm({ ...lessonForm, customAssignment: { ...lessonForm.customAssignment!, title: e.target.value } })}
                              placeholder="e.g. Write a 500-word essay"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-950 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Assignment Prompt (Instructions)</label>
                            <textarea 
                              value={lessonForm.customAssignment.prompt}
                              onChange={(e) => setLessonForm({ ...lessonForm, customAssignment: { ...lessonForm.customAssignment!, prompt: e.target.value } })}
                              placeholder="Describe the task instructions here..."
                              className="w-full h-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-950 focus:outline-none resize-y"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Student Placeholder</label>
                            <input 
                              type="text"
                              value={lessonForm.customAssignment.placeholder}
                              onChange={(e) => setLessonForm({ ...lessonForm, customAssignment: { ...lessonForm.customAssignment!, placeholder: e.target.value } })}
                              placeholder="Placeholder text for the text box"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-950 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* INTERACTIVE QUIZ & TEST QUESTIONS BUILDER */}
                    <div className="border border-indigo-100 rounded-2xl bg-indigo-50/20 p-4 space-y-4 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-indigo-100/50">
                        <div>
                          <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                            Interactive Lesson Quiz
                          </h5>
                          <p className="text-[10px] text-slate-500">Add multiple-choice assessment questions for students to complete this milestone.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAiGenerateQuiz}
                          disabled={isAiGeneratingQuiz}
                          className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold rounded-xl text-[10px] transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3" />
                          {isAiGeneratingQuiz ? "Generating with AI..." : "AI Generate Questions"}
                        </button>
                      </div>

                      {quizGenerateError && (
                        <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-[11px] text-rose-700 font-medium">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                          <span>{quizGenerateError}</span>
                        </div>
                      )}

                      {/* BULK UPLOAD WIDGET FOR QUIZ QUESTIONS */}
                      <div 
                        onDragOver={handleQuizDragOver}
                        onDragLeave={handleQuizDragLeave}
                        onDrop={handleQuizDrop}
                        className={`border-2 border-dashed rounded-2xl p-4 text-center transition ${
                          isQuizDragging 
                            ? "border-indigo-500 bg-indigo-50/60" 
                            : "border-slate-200 bg-white hover:border-indigo-300"
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="p-2.5 bg-indigo-50 rounded-full text-indigo-600">
                            <Upload className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800">Bulk Upload Test Questions</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Drag & drop your <strong className="text-indigo-600">.json</strong> or <strong className="text-indigo-600">.csv</strong> file here, or click to browse</p>
                          </div>
                          <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-[10px] transition cursor-pointer shadow-sm">
                            Choose File
                            <input 
                              type="file" 
                              accept=".json,.csv" 
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  handleQuizFileUpload(e.target.files[0]);
                                }
                              }} 
                              className="hidden" 
                            />
                          </label>
                        </div>

                        {/* Format guide dropdown */}
                        <div className="mt-3 border-t border-slate-100 pt-2.5 text-left">
                          <details className="group">
                            <summary className="text-[9px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer list-none flex items-center justify-between select-none">
                              <span>📋 View Upload Formatting Guide</span>
                              <span className="group-open:rotate-180 transition-transform duration-200">▼</span>
                            </summary>
                            <div className="mt-2 text-[10px] space-y-2 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-150 leading-relaxed font-medium">
                              <div>
                                <span className="font-bold text-indigo-600">JSON Format Array:</span>
                                <pre className="text-[8px] bg-white border border-slate-200 p-1.5 rounded-lg mt-1 font-mono overflow-x-auto text-slate-800">
{`[
  {
    "question": "Sample multiple choice question prompt?",
    "options": ["First option", "Second option", "Third option", "Fourth option"],
    "correctAnswer": 0,
    "explanation": "Optional feedback explaining the correct answer choice."
  }
]`}
                                </pre>
                              </div>
                              <div>
                                <span className="font-bold text-indigo-600">CSV Columns:</span>
                                <p className="mt-0.5">The first line must contain column headers. Use columns like:</p>
                                <code className="text-[9px] bg-white border border-slate-200 px-1 py-0.5 rounded font-mono block mt-1 text-slate-800 truncate">
                                  question, option1, option2, option3, option4, correctAnswer, explanation
                                </code>
                                <p className="mt-1 text-[9px] text-slate-400">Note: correctAnswer values can be indexes 0, 1, 2, 3 or letters A, B, C, D.</p>
                              </div>
                            </div>
                          </details>
                        </div>
                      </div>

                      {quizUploadError && (
                        <div className="p-2.5 bg-rose-50 border border-rose-150 rounded-xl flex items-center gap-2 text-[11px] text-rose-700 font-medium">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                          <span>{quizUploadError}</span>
                        </div>
                      )}

                      {quizUploadSuccess && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-150 rounded-xl flex items-center gap-2 text-[11px] text-emerald-800 font-medium">
                          <Check className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                          <span>{quizUploadSuccess}</span>
                        </div>
                      )}

                      {/* Existing questions in current quiz */}
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">
                          Current Quiz Questions ({lessonForm.quiz?.questions?.length || 0})
                        </span>
                        {(!lessonForm.quiz?.questions || lessonForm.quiz.questions.length === 0) ? (
                          <div className="text-center py-4 bg-white/50 border border-dashed border-slate-200 rounded-xl">
                            <p className="text-xs text-slate-400 font-medium">No quiz questions added yet.</p>
                            <p className="text-[10px] text-slate-400">Add a manual question below or use AI to draft three questions instantly!</p>
                          </div>
                        ) : (
                          lessonForm.quiz.questions.map((q, qIdx) => (
                            <div key={q.id || qIdx} className="bg-white border border-slate-150 p-3 rounded-xl relative shadow-sm">
                              <button
                                type="button"
                                onClick={() => handleRemoveQuizQuestion(q.id)}
                                className="absolute top-2.5 right-2.5 p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition cursor-pointer"
                                title="Delete Question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <div className="pr-6">
                                <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[8px] font-bold font-mono rounded uppercase mb-1">
                                  Q{qIdx + 1}
                                </span>
                                <h6 className="text-xs font-bold text-slate-900 leading-tight mb-2">
                                  {q.question}
                                </h6>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                                  {q.options.map((opt, oIdx) => (
                                    <div
                                      key={oIdx}
                                      className={`px-2 py-1.5 rounded-lg border text-[11px] font-medium leading-tight flex items-center gap-1 ${
                                        q.correctAnswer === oIdx
                                          ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold"
                                          : "bg-slate-50 border-slate-100 text-slate-600"
                                      }`}
                                    >
                                      <span className="font-bold opacity-60">
                                        {String.fromCharCode(65 + oIdx)}.
                                      </span>
                                      <span className="truncate">{opt}</span>
                                      {q.correctAnswer === oIdx && (
                                        <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto flex-shrink-0" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {q.explanation && (
                                  <p className="text-[10px] bg-indigo-50/40 border border-indigo-50 text-indigo-800 p-2 rounded-lg font-medium leading-normal">
                                    <span className="font-bold uppercase tracking-wider text-[8px] text-indigo-600 block mb-0.5">Explanation</span>
                                    {q.explanation}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Draft new question form */}
                      <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl space-y-3 shadow-sm">
                        <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-1.5">
                          ✍️ Draft New Multiple-Choice Question
                        </span>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Question Prompt / Statement</label>
                          <input
                            type="text"
                            placeholder="e.g. What is the main objective of the 'Acquisition' stage in the AARRR funnel?"
                            value={newQuestionText}
                            onChange={(e) => setNewQuestionText(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {newQuestionOptions.map((opt, oIdx) => (
                            <div key={oIdx} className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Option {String.fromCharCode(65 + oIdx)}</label>
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  placeholder={`Answer choice ${String.fromCharCode(65 + oIdx)}`}
                                  value={opt}
                                  onChange={(e) => {
                                    const updated = [...newQuestionOptions];
                                    updated[oIdx] = e.target.value;
                                    setNewQuestionOptions(updated);
                                  }}
                                  className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => setNewQuestionCorrect(oIdx)}
                                  className={`px-2.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                    newQuestionCorrect === oIdx
                                      ? "bg-emerald-600 border-emerald-600 text-white"
                                      : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
                                  }`}
                                  title="Mark as correct choice"
                                >
                                  {newQuestionCorrect === oIdx ? "✓" : "Correct"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Answer Explanation / Solution logic (Optional)</label>
                          <textarea
                            rows={2}
                            placeholder="Explain why the selected answer is correct to help students learn."
                            value={newQuestionExplanation}
                            onChange={(e) => setNewQuestionExplanation(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 resize-none leading-normal"
                          />
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={handleAddQuizQuestion}
                            disabled={!newQuestionText.trim()}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Question
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Simple Homework assignment reference */}
                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs">
                      <p className="font-bold text-amber-900 leading-none mb-1">💡 Portfolios & Homework Handlers</p>
                      <p className="text-[10px] text-amber-700 leading-tight">Students are automatically prompted to draft a growth campaign outline as their lesson homework. Submissions will land directly in your "Grading Hub" for portfolio review.</p>
                    </div>

                    {/* Save actions */}
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                      <button 
                        onClick={() => {
                          setIsAddingLesson(false);
                          setEditingLesson(null);
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        id="btn-save-lesson-to-syllabus"
                        onClick={handleSaveLesson}
                        disabled={!lessonForm.title.trim() || !lessonForm.id.trim()}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-100 disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {editingLesson ? "Save Changes" : "Create Lesson"}
                      </button>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200 mb-4">
                    <Layers className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-700">Course Syllabus & Builder</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">Select a module on the left side to add/edit lessons, adjust theoretical material, or configure practice sandboxes.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

        {/* TAB 5: LIVE BROADCAST & MEETING DISPATCH STUDIO */}
        {activeSubTab === "live_studio" && (
          <LiveBroadcastStudio 
            courseModules={courseModules}
            students={students}
            onJoinMeeting={(url, title) => {
              setActiveInAppMeetingUrl(url);
              setActiveInAppMeetingTitle(title);
            }}
          />
        )}

        {/* TAB 7: MEETING SCHEDULER */}
        {activeSubTab === "scheduler" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Schedule Meeting</h2>
                  <p className="text-sm text-slate-500 font-medium">Book a 1-on-1 session with a student.</p>
                </div>
              </div>

              <form onSubmit={handleScheduleMeeting} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Meeting Topic</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Portfolio Review"
                    value={schedulerTitle}
                    onChange={(e) => setSchedulerTitle(e.target.value)}
                    className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Date</label>
                    <input 
                      type="date" 
                      value={schedulerDate}
                      onChange={(e) => setSchedulerDate(e.target.value)}
                      className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Time</label>
                    <input 
                      type="time" 
                      value={schedulerTime}
                      onChange={(e) => setSchedulerTime(e.target.value)}
                      className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Student</label>
                  <select
                    value={schedulerStudentId}
                    onChange={(e) => setSchedulerStudentId(e.target.value)}
                    className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                    required
                  >
                    <option value="" disabled>Select a student</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>

                {schedulerError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl text-center">
                    {schedulerError}
                  </div>
                )}

                {schedulerSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl text-center">
                    {schedulerSuccess}
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={schedulerLoading}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-sm transition shadow-lg shadow-indigo-200 disabled:opacity-50"
                  >
                    {schedulerLoading ? "Scheduling..." : "Schedule Session"}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" /> Upcoming Meetings
              </h3>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {upcomingMeetings.map(meeting => (
                  <div key={meeting.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-3 transition hover:border-indigo-100 hover:bg-indigo-50/30">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{meeting.title}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">with {meeting.studentName}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Cancel Meeting"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <div className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(meeting.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {meeting.time}
                      </div>
                    </div>
                  </div>
                ))}
                
                {upcomingMeetings.length === 0 && (
                  <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-700">No upcoming meetings</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">Schedule your next 1-on-1 session using the form.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: USER MANAGEMENT */}
        {activeSubTab === "onboarding" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
                  <UserPlus className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Onboard Users</h2>
                  <p className="text-sm text-slate-500 font-medium">Add new students or trainers.</p>
                </div>
              </div>

              <form onSubmit={handleOnboardUser} className="space-y-6">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setOnboardType("student")}
                    className={`flex-1 py-3 px-4 rounded-2xl border font-bold text-sm transition ${
                      onboardType === "student"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Onboard Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnboardType("trainer")}
                    className={`flex-1 py-3 px-4 rounded-2xl border font-bold text-sm transition ${
                      onboardType === "trainer"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Onboard Trainer
                  </button>
                </div>

                <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Jane Doe"
                      value={onboardName}
                      onChange={(e) => setOnboardName(e.target.value)}
                      className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="e.g. jane@example.com"
                      value={onboardEmail}
                      onChange={(e) => setOnboardEmail(e.target.value)}
                      className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                      required
                    />
                  </div>

                  {onboardType === "student" && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Course Track</label>
                      <select
                        value={onboardCategory}
                        onChange={(e) => setOnboardCategory(e.target.value)}
                        className="w-full bg-white px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                      >
                        {categories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {onboardError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl text-center">
                    {onboardError}
                  </div>
                )}

                {onboardSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl text-center">
                    {onboardSuccess}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={onboardLoading}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-sm transition shadow-lg shadow-indigo-200 disabled:opacity-50"
                  >
                    {onboardLoading ? "Onboarding..." : `Add ${onboardType === "student" ? "Student" : "Trainer"}`}
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-4">Manage Trainers</h3>
                <div className="space-y-3">
                  {trainers.map(trainer => (
                    <div key={trainer.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
                      <div>
                        <div className="font-bold text-sm text-slate-800">{trainer.name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{trainer.email}</div>
                      </div>
                      <button 
                        onClick={() => handleDeleteUser(trainer.id, "trainer")}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Remove Trainer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {trainers.length === 0 && (
                    <div className="text-center py-6 text-sm text-slate-400 font-medium border border-dashed border-slate-200 rounded-2xl">
                      No additional trainers found.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-4">Manage Students</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {students.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
                      <div>
                        <div className="font-bold text-sm text-slate-800">{student.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{student.email}</div>
                        <div className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">
                          {student.courseCategory || "Digital Marketing"}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteUser(student.id, "student")}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Remove Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {students.length === 0 && (
                    <div className="text-center py-6 text-sm text-slate-400 font-medium border border-dashed border-slate-200 rounded-2xl">
                      No students enrolled yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export interface Resource {
  id: string;
  title: string;
  type: "PDF" | "Template" | "Excel" | "Worksheet";
  filename: string;
  content: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index in options
  explanation: string;
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  markdownContent: string;
  resources: Resource[];
  quiz?: Quiz;
  liveToolType?: "roi-calc" | "seo-meta" | "ad-copy" | "persona";
  videoUrl?: string; // Custom video/recording link for the study module
  customAssignment?: {
    title: string;
    prompt: string;
    placeholder: string;
  };
}

export interface LiveMeeting {
  id: string;
  title: string;
  url: string;
  targetType: "batch" | "student";
  targetStudentEmail?: string;
  createdAt: string;
  active: boolean;
  date?: string;
  time?: string;
  castedLessonId?: string; // If set, instructor is broadcasting this active lesson
  screenSharingActive?: boolean; // Toggled if screensharing
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  category?: string; // e.g. "Digital Marketing", "Data Science"
}

export interface Student {
  id: string;
  name: string;
  email: string;
  enrolledAt: string;
  progress: Record<string, boolean>; // lessonId -> completed
  quizScores?: Record<string, number>; // lessonId -> score %
  courseCategory?: string; // Selected enrollment category, e.g. "Digital Marketing", "Data Science"
  
  // Sequential Learning Journey states
  lessonStages?: Record<string, string[]>; // lessonId -> completed stage IDs
  skipRequests?: Record<string, boolean>; // lessonId -> true if requested
  assignments?: Record<string, {
    studentResponse: string;
    score?: number;
    feedback?: string;
    suggestions?: string;
    approved?: boolean;
    submittedAt?: string;
  }>;
  portfolio?: Array<{
    lessonId: string;
    lessonTitle: string;
    studentResponse: string;
    score: number;
    feedback: string;
    suggestions: string;
    completedAt: string;
  }>;
  capstoneSubmitted?: boolean;
  capstoneResponse?: string;
  capstoneFeedback?: {
    score: number;
    feedback: string;
    suggestions: string;
    approved: boolean;
    completedAt: string;
  };
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  lessonId: string; // "general" or specific lessonId
  upvotes: number;
  upvotedBy: string[]; // List of emails who upvoted
  replyCount?: number;
}

export interface ForumReply {
  id: string;
  postId: string;
  content: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
}

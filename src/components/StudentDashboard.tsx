import React from "react";
import { Student } from "../types";
import { 
  Trophy, 
  Flame, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Video,
  ChevronRight,
  PlayCircle,
  Calendar,
  User
} from "lucide-react";

interface StudentDashboardProps {
  student: Student;
  onNavigateToClassroom: () => void;
  completedLessonsCount: number;
  totalLessonsCount: number;
  studentMeetings: any[];
  student1on1Meetings: any[];
}

export default function StudentDashboard({ student, onNavigateToClassroom, completedLessonsCount, totalLessonsCount, studentMeetings, student1on1Meetings }: StudentDashboardProps) {
  const progressPercentage = totalLessonsCount === 0 ? 0 : Math.round((completedLessonsCount / totalLessonsCount) * 100);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
              Welcome back, {student.name.split(" ")[0]}!
            </h2>
            <p className="text-indigo-200">
              You are enrolled in the <span className="font-bold text-white">{student.courseCategory || "Digital Marketing"}</span> track. Let's continue your journey.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-indigo-950/50 p-4 rounded-2xl border border-indigo-800/50">
            <div className="text-center">
              <div className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
                <Flame className="w-5 h-5" />
                <span>3</span>
              </div>
              <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mt-1">Day Streak</div>
            </div>
            <div className="w-px h-10 bg-indigo-800"></div>
            <div className="text-center">
              <div className="text-2xl font-black text-white flex items-center justify-center gap-1">
                <Trophy className="w-5 h-5 text-indigo-400" />
                <span>{completedLessonsCount}</span>
              </div>
              <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mt-1">Lessons Done</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Course Progress
              </h3>
              <span className="text-sm font-bold text-indigo-600">{progressPercentage}% Completed</span>
            </div>
            
            <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
              <div 
                className="bg-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>

            <button 
              onClick={onNavigateToClassroom}
              className="w-full py-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-2xl text-slate-700 hover:text-indigo-700 font-bold transition flex items-center justify-between px-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100">
                  <PlayCircle className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-slate-500 font-medium">Next up</div>
                  <div className="text-sm">Continue Learning</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
             <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Recent Achievements
              </h3>
              {completedLessonsCount > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-900">Module Completed</div>
                      <div className="text-[10px] text-emerald-700">You finished your recent module. Keep it up!</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">Complete your first lesson to earn achievements!</p>
              )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-rose-500" />
              Upcoming Live Classes
            </h3>
            <div className="space-y-3">
              {studentMeetings.length > 0 ? (
                studentMeetings.map(meet => (
                  <div key={meet.id} className="p-4 border border-rose-200 rounded-2xl bg-rose-50 flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-rose-200 rounded-bl-full opacity-50 transition group-hover:scale-110"></div>
                    <div className="flex justify-between items-start z-10">
                      <div>
                        <h4 className="font-bold text-rose-900 text-sm">{meet.title}</h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-200/50 px-2 py-0.5 rounded mt-1 inline-block">Live Now</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4 text-rose-600 animate-pulse" />
                      </div>
                    </div>
                    <button onClick={onNavigateToClassroom} className="mt-2 w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 z-10 shadow-md shadow-rose-200">
                      Join Live Room <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50 text-center">
                  <p className="text-xs text-slate-500">No active live broadcast stream is currently scheduled.</p>
                  <button onClick={onNavigateToClassroom} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700">Go to Classroom</button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              1-on-1 Consultations
            </h3>
            <div className="space-y-3">
              {student1on1Meetings.length > 0 ? (
                student1on1Meetings.map(meet => (
                  <div key={meet.id} className="p-4 border border-indigo-100 rounded-2xl bg-indigo-50/50 flex flex-col gap-3 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{meet.title}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-600">with {meet.trainerName || "Trainer"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs font-bold z-10">
                      <div className="bg-white text-indigo-700 px-2 py-1 rounded flex items-center gap-1 border border-indigo-100 shadow-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(meet.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="bg-slate-800 text-white px-2 py-1 rounded flex items-center gap-1 shadow-sm">
                        <Clock className="w-3 h-3" />
                        {meet.time}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50 text-center">
                  <p className="text-xs text-slate-500">No upcoming 1-on-1 consultations scheduled.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

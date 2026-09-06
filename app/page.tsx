'use client';

import { useState } from 'react';
import { RefreshCw, BookOpen, Target, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';

// --- MOCK DATA ---
const mockSubjects = [
  { id: 1, name: 'Data Structures & Algorithms', code: 'CS301', attended: 32, total: 40 },
  { id: 2, name: 'Computer Architecture', code: 'CS302', attended: 18, total: 30 },
  { id: 3, name: 'Operating Systems', code: 'CS303', attended: 35, total: 38 },
  { id: 4, name: 'Discrete Mathematics', code: 'MA301', attended: 12, total: 25 },
  { id: 5, name: 'Python Programming', code: 'CS304', attended: 20, total: 22 },
];

// --- SUB-COMPONENTS ---

const CircularProgress = ({ percentage }: { percentage: number }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 75 ? 'text-emerald-500' : 'text-rose-500';

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48" cy="48" r={radius}
          className="stroke-zinc-100" strokeWidth="8" fill="none"
        />
        <circle
          cx="48" cy="48" r={radius}
          className={`${color} transition-all duration-1000 ease-in-out`}
          strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" fill="none"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-zinc-900">{percentage.toFixed(1)}%</span>
      </div>
    </div>
  );
};

const SubjectCard = ({ subject, target }: { subject: any, target: number }) => {
  const percentage = (subject.attended / subject.total) * 100;
  const isSafe = percentage >= target;
  
  // Bunk logic
  const t = target / 100;
  let statusText = '';
  
  if (isSafe) {
    const canSkip = Math.floor((subject.attended - (t * subject.total)) / t);
    statusText = canSkip > 0 ? `Can skip ${canSkip} classes` : 'On track';
  } else {
    const needsToAttend = Math.ceil(((t * subject.total) - subject.attended) / (1 - t));
    statusText = `Attend next ${needsToAttend} classes`;
  }

  return (
    <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm flex items-center justify-between mb-3 active:scale-[0.98] transition-transform">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-zinc-900 text-sm leading-tight line-clamp-1">{subject.name}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">{subject.attended}/{subject.total}</span>
          <span className="text-zinc-300">•</span>
          <span className={isSafe ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
            {statusText}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end ml-4">
        <span className={`text-lg font-bold ${isSafe ? 'text-emerald-500' : 'text-rose-500'}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---

export default function Home() {
  const [target, setTarget] = useState(75);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalAttended = mockSubjects.reduce((acc, curr) => acc + curr.attended, 0);
  const totalClasses = mockSubjects.reduce((acc, curr) => acc + curr.total, 0);
  const overallPercentage = (totalAttended / totalClasses) * 100;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-20">
      {/* Mobile Container */}
      <div className="max-w-md mx-auto bg-zinc-50 min-h-screen relative shadow-sm border-x border-zinc-100">
        
        {/* Header */}
        <header className="sticky top-0 z-10 bg-zinc-50/80 backdrop-blur-md px-5 pt-8 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">BTech • Semester 4</p>
          </div>
          <button 
            onClick={handleRefresh}
            className="p-2.5 bg-white border border-zinc-200 rounded-full shadow-sm active:scale-95 transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <div className="px-5 space-y-6 mt-2">
          
          {/* Overall Stats Card */}
          <section className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Overall Attendance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-zinc-900">{totalAttended}</span>
                <span className="text-sm font-medium text-zinc-400">/ {totalClasses}</span>
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">Safe Zone</span>
              </div>
            </div>
            <CircularProgress percentage={overallPercentage} />
          </section>

          {/* Target Selector */}
          <section>
            <div className="flex justify-between items-end mb-3 px-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Target Selector</h2>
              <span className="text-xs font-medium text-zinc-400">Calculates safe skips</span>
            </div>
            <div className="bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-sm flex">
              {[70, 75, 80, 85].map((val) => (
                <button
                  key={val}
                  onClick={() => setTarget(val)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                    target === val 
                      ? 'bg-zinc-900 text-white shadow-md' 
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </section>

          {/* Subject Breakdown */}
          <section>
            <div className="flex justify-between items-end mb-3 px-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Subject Breakdown</h2>
            </div>
            <div>
              {mockSubjects.map((subject) => (
                <SubjectCard key={subject.id} subject={subject} target={target} />
              ))}
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
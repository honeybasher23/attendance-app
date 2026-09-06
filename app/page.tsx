'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, BookOpen, Target, ChevronRight, AlertCircle, CheckCircle2, DownloadCloud } from 'lucide-react';
import { InAppBrowser } from '@capacitor/inappbrowser';
import { Preferences } from '@capacitor/preferences';

// --- SUB-COMPONENTS (Unchanged) ---
const CircularProgress = ({ percentage }: { percentage: number }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 75 ? 'text-emerald-500' : 'text-rose-500';

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle cx="48" cy="48" r={radius} className="stroke-zinc-100" strokeWidth="8" fill="none" />
        <circle
          cx="48" cy="48" r={radius}
          className={`${color} transition-all duration-1000 ease-in-out`}
          strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" fill="none"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-zinc-900">{percentage ? percentage.toFixed(1) : 0}%</span>
      </div>
    </div>
  );
};

const SubjectCard = ({ subject, target }: { subject: any, target: number }) => {
  const percentage = (subject.attended / subject.total) * 100;
  const isSafe = percentage >= target;
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
          <span className={isSafe ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>{statusText}</span>
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Load saved data when the app opens
  useEffect(() => {
    const loadData = async () => {
      const { value } = await Preferences.get({ key: 'attendance_data' });
      if (value) {
        setSubjects(JSON.parse(value));
      }
    };
    loadData();
  }, []);

  const totalAttended = subjects.reduce((acc, curr) => acc + curr.attended, 0);
  const totalClasses = subjects.reduce((acc, curr) => acc + curr.total, 0);
  const overallPercentage = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;

  const handleEkdantaSync = async () => {
    setIsSyncing(true);
    
    try {
      // 1. Open the ABES ERP Login Page
      await InAppBrowser.openInWebView({
        url: 'https://erp.abes.ac.in/', 
        options: { clearSessionCache: false, clearData: false }
      });

      // 2. Listen for navigation
      InAppBrowser.addListener('browserPageNavigationCompleted', async (event) => {
        const url = event.url.toLowerCase();

        // SCENARIO A: We reached the Attendance page -> Wait 3 seconds, Scrape, and Close
        if (url.includes('attendance/default.aspx')) {
          
          setTimeout(async () => {
            const scrapeScript = `
              (function() {
                try {
                  // Safety check: Does the table exist yet?
                  let table = document.querySelector('table#sample_1');
                  if (!table) return JSON.stringify({ error: 'Table not rendered' });

                  let rows = document.querySelectorAll('table#sample_1 tbody tr'); 
                  let data = [];
                  
                  rows.forEach((row, i) => {
                    let cols = row.querySelectorAll('td');
                    if (cols.length >= 6) {
                      data.push({
                        id: i,
                        code: cols[0].innerText.trim(),
                        name: cols[1].innerText.trim(),
                        total: parseInt(cols[2].innerText.trim() || 0),
                        attended: parseInt(cols[3].innerText.trim() || 0)
                      });
                    }
                  });
                  return JSON.stringify(data);
                } catch (e) {
                  return JSON.stringify({ error: e.toString() });
                }
              })();
            `;

            const result = await InAppBrowser.executeScript({ code: scrapeScript });
            
            if (result && result.value) {
              const parsed = JSON.parse(result.value);
              
              if (!parsed.error && parsed.length > 0) {
                // Success: Save data and close window
                setSubjects(parsed);
                await Preferences.set({ key: 'attendance_data', value: result.value });
                await InAppBrowser.close();
              } else {
                // Debugging: If it fails, tell you exactly why
                await InAppBrowser.executeScript({
                  code: `alert("Scrape failed. Reason: ${parsed.error || '0 rows found'}. The table might take longer to load.");`
                });
              }
            }
          }, 3000); 
        } 
        
        // SCENARIO B: Logged in and on the dashboard -> Auto-navigate to Attendance
        else if (url.includes('dashboard') && !url.includes('attendance')) {
          await InAppBrowser.executeScript({
            code: `window.location.href = '/ERP/Dashboard/Student/Attendance/Default.aspx';`
          });
        }
      });
    } catch (error) {
      console.error("Failed to sync:", error);
    }
    
    setIsSyncing(false);
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-20">
      <div className="max-w-md mx-auto bg-zinc-50 min-h-screen relative shadow-sm border-x border-zinc-100">
        
        <header className="sticky top-0 z-10 bg-zinc-50/80 backdrop-blur-md px-5 pt-8 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">Ekdanta Sync</p>
          </div>
          <button 
            onClick={handleEkdantaSync}
            disabled={isSyncing}
            className="p-2.5 bg-zinc-900 text-white rounded-full shadow-sm active:scale-95 transition-all flex items-center gap-2 px-4"
          >
            <DownloadCloud className={`w-4 h-4 ${isSyncing ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-semibold">{isSyncing ? 'Syncing...' : 'Sync Portal'}</span>
          </button>
        </header>

        <div className="px-5 space-y-6 mt-2">
          {subjects.length === 0 ? (
            <div className="bg-white border border-dashed border-zinc-300 rounded-3xl p-8 text-center flex flex-col items-center">
              <BookOpen className="w-8 h-8 text-zinc-400 mb-3" />
              <p className="text-zinc-600 font-medium text-sm">No data found</p>
              <p className="text-zinc-400 text-xs mt-1">Tap "Sync Portal" to login and load your attendance.</p>
            </div>
          ) : (
            <>
              {/* Overall Stats Card */}
              <section className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500 mb-1">Overall Attendance</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-zinc-900">{totalAttended}</span>
                    <span className="text-sm font-medium text-zinc-400">/ {totalClasses}</span>
                  </div>
                </div>
                <CircularProgress percentage={overallPercentage} />
              </section>

              {/* Target Selector */}
              <section>
                <div className="flex justify-between items-end mb-3 px-1">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Target Selector</h2>
                </div>
                <div className="bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-sm flex">
                  {[70, 75, 80, 85].map((val) => (
                    <button
                      key={val}
                      onClick={() => setTarget(val)}
                      className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                        target === val ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-700'
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
                  {subjects.map((subject) => (
                    <SubjectCard key={subject.id} subject={subject} target={target} />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
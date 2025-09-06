import React, { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import ProfileSection from './student/ProfileSection';
import CertificatesSection from './student/CertificatesSection';
import RecommendationsSection from './student/RecommendationsSection';
import UploadCertificateSection from './student/UploadCertificateSection';
import NotificationsDropdown from './student/NotificationsDropdown';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Certificate {
  id: string;
  title: string;
  description: string;
  category: 'academic' | 'co_curricular';
  status: 'pending' | 'approved' | 'rejected';
  file_url: string;
  file_name: string;
  uploaded_at: string;
  rejection_reason?: string;
  remark?: string;
}

const StudentDashboard = () => {
  const { profile } = useProfile();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchCertificates();
    }
  }, [profile]);

  const fetchCertificates = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('student_id', profile.id)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching certificates:', error);
      } else {
        setCertificates(data || []);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = async () => {
    await fetchCertificates();
    setShowUploadPanel(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Derived stats for visuals
  const total = certificates.length;
  const approved = certificates.filter(c=>c.status==='approved').length;
  const pending = certificates.filter(c=>c.status==='pending').length;
  const rejected = total - approved - pending;

  const last7: { day: string; count: number }[] = (() => {
    const map = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString(undefined, { weekday: 'short' });
      map.set(key, 0);
    }
    for (const c of certificates) {
      const d = new Date(c.uploaded_at);
      const key = d.toLocaleDateString(undefined, { weekday: 'short' });
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries()).map(([day, count]) => ({ day, count }));
  })();

  const weekTotal = last7.reduce((s, x) => s + x.count, 0) || 1;
  const pct = (n: number) => Math.round((n / (total || 1)) * 100);
  const weekPct = (n: number) => Math.round((n / weekTotal) * 100);

  const CountUp: React.FC<{ to: number; duration?: number }> = ({ to, duration = 800 }) => {
    const [val, setVal] = React.useState(0);
    React.useEffect(() => {
      let raf = 0;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        setVal(Math.round(to * p));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [to, duration]);
    return <span>{val}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {profile?.full_name}!</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => setShowUploadPanel((v) => !v)} className="bg-[#6D28D9] hover:bg-[#5b21b6] text-white">
            <Upload className="h-4 w-4 mr-2" />
            {showUploadPanel ? 'Close Upload' : 'Upload Certificate'}
          </Button>
          <NotificationsDropdown />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,_1fr)_360px] gap-6">
        {/* Left rail */}
        <div className="space-y-6">
          {/* Activity card with vertical bars */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Activity</h3>
              <span className="text-xs px-3 py-1 rounded-full border bg-gray-50 text-gray-700">Last 7 days</span>
            </div>
            <div className="mt-5 h-40 flex items-end gap-3">
              {last7.map((d) => {
                const max = Math.max(...last7.map(x=>x.count)) || 1;
                const h = (d.count / max) * 100;
                const isMax = d.count === max && max > 0;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`w-6 rounded-t transition-all duration-700 hover:shadow-md ${isMax ? 'bg-[#7C3AED]' : 'bg-[#E9D5FF] hover:bg-[#C4B5FD]'}`} style={{ height: `${h}%` }} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <div className="font-medium">{d.day}</div>
                          <div className="text-gray-600">{d.count} activities</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    <span className="mt-2 text-xs text-gray-500">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By platform card (usage list) */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">By platform</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="inline-block h-2 w-2 rounded-full bg-[#7C3AED]" />
                <span className="text-gray-700">Academic</span>
                <span className="ml-auto text-gray-500">{certificates.filter(c=>c.category==='academic').length} h</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-block h-2 w-2 rounded-full bg-[#10B981]" />
                <span className="text-gray-700">Co-Curricular</span>
                <span className="ml-auto text-gray-500">{certificates.filter(c=>c.category==='co_curricular').length} h</span>
              </div>
            </div>
          </div>

          <ProfileSection certificates={certificates} />
          {showUploadPanel && (
            <UploadCertificateSection onUploadComplete={handleUploadComplete} />
          )}
        </div>

        {/* Center column */}
        <div className="space-y-6">
          {/* Progress statistics */}
          <div className="grid grid-cols-1 gap-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <div className="text-4xl font-bold text-gray-900 leading-tight"><CountUp to={pct(approved + pending)} />%</div>
                  <div className="text-sm text-gray-500 mt-1">Total activity</div>
                </div>
                <div>
                  <div className="flex w-full h-2 rounded-full overflow-hidden bg-gray-200">
                    <div className="h-full bg-[#6D28D9]" style={{ width: `${pct(approved)}%`, transition: 'width 800ms ease' }} />
                    <div className="h-full bg-[#10B981]" style={{ width: `${pct(pending)}%`, transition: 'width 800ms ease 120ms' }} />
                    <div className="h-full bg-[#F59E0B]" style={{ width: `${pct(rejected)}%`, transition: 'width 800ms ease 240ms' }} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#6D28D9]" />
                      <span className="text-gray-500">Completed</span>
                      <span className="ml-auto font-semibold"><CountUp to={approved} /></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                      <span className="text-gray-500">In progress</span>
                      <span className="ml-auto font-semibold"><CountUp to={pending} /></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                      <span className="text-gray-500">Upcoming</span>
                      <span className="ml-auto font-semibold"><CountUp to={rejected} /></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <CertificatesSection certificates={certificates} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <RecommendationsSection certificates={certificates} />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

import React, { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import ProfileSection from './student/ProfileSection';
import CertificatesSection from './student/CertificatesSection';
import RecommendationsSection from './student/RecommendationsSection';
import UploadCertificateSection from './student/UploadCertificateSection';
import NotificationsDropdown from './student/NotificationsDropdown';

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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.full_name}!</p>
        </div>
        <NotificationsDropdown />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Profile & Upload */}
        <div className="space-y-6">
          <ProfileSection certificates={certificates} />
          <UploadCertificateSection onUploadComplete={fetchCertificates} />
        </div>

        {/* Right Columns - Certificates & Recommendations */}
        <div className="xl:col-span-2 space-y-6">
          <CertificatesSection certificates={certificates} />
          <RecommendationsSection certificates={certificates} />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

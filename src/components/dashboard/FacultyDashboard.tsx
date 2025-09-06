import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, Users, FileText, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

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
  student: {
    id: string;
    full_name: string;
    email: string;
    student_id?: string;
  };
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  student_id?: string;
}

const FacultyDashboard = () => {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingCert, setProcessingCert] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [useMock, setUseMock] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      if (useMock) {
        mockFetchCertificates();
        mockFetchStudents();
      } else {
        fetchCertificates();
        fetchStudents();
      }
    }
  }, [profile, useMock]);

  const mockDelay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const mockFetchCertificates = async () => {
    setLoading(true);
    await mockDelay(500);
    const data: Certificate[] = [
      {
        id: 'mock-1',
        title: 'National Science Fair',
        description: 'Participation certificate',
        category: 'co_curricular',
        status: 'pending',
        file_url: 'https://example.com/cert1.pdf',
        file_name: 'cert1.pdf',
        uploaded_at: new Date(Date.now() - 86400000).toISOString(),
        student: { id: 'stu-1', full_name: 'Alice Johnson', email: 'alice@example.edu', student_id: '2021-CSE-034' },
      },
      {
        id: 'mock-2',
        title: 'B.Tech Degree',
        description: 'Verified by registrar',
        category: 'academic',
        status: 'approved',
        file_url: 'https://example.com/cert2.pdf',
        file_name: 'cert2.pdf',
        uploaded_at: new Date(Date.now() - 172800000).toISOString(),
        remark: 'Excellent achievement',
        student: { id: 'stu-2', full_name: 'Bob Smith', email: 'bob@example.edu', student_id: '2020-EEE-112' },
      },
      {
        id: 'mock-3',
        title: 'Hackathon Winner',
        description: 'First place',
        category: 'co_curricular',
        status: 'rejected',
        file_url: 'https://example.com/cert3.pdf',
        file_name: 'cert3.pdf',
        uploaded_at: new Date(Date.now() - 259200000).toISOString(),
        rejection_reason: 'Illegible scan',
        remark: 'Please re-upload a clearer copy',
        student: { id: 'stu-3', full_name: 'Carol Danvers', email: 'carol@example.edu', student_id: '2019-MECH-076' },
      },
    ];
    setCertificates(data);
    setLoading(false);
  };

  const fetchCertificates = async () => {
    if (!profile) return;

    if (useMock) {
      await mockFetchCertificates();
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('certificates')
        .select(`
          *,
          student:student_id (
            id,
            full_name,
            email,
            student_id
          )
        `)
        .order('uploaded_at', { ascending: false });

      // If faculty is not senior/admin, only show assigned students' certificates
      if (profile.faculty_level !== 'senior' && profile.faculty_level !== 'admin') {
        const { data: assignedStudents } = await supabase
          .from('profiles')
          .select('id')
          .eq('assigned_faculty_id', profile.id);
        
        if (assignedStudents && assignedStudents.length > 0) {
          const studentIds = assignedStudents.map(s => s.id);
          query = query.in('student_id', studentIds);
        } else {
          // No assigned students, return empty array
          setCertificates([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching certificates:', error);
        toast({
          title: 'Error',
          description: (error as any)?.message || 'Failed to fetch certificates',
          variant: 'destructive',
        });
      } else {
        setCertificates(data?.map((item: any) => ({
          ...item,
          student: item.student || { id: '', full_name: 'Unknown', email: 'Unknown' }
        })) || []);
      }
    } catch (err) {
      console.error('Error fetching certificates:', err);
      toast({
        title: 'Error',
        description: (err as any)?.message || 'Failed to fetch certificates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const mockFetchStudents = async () => {
    await mockDelay(300);
    setStudents([
      { id: 'stu-1', full_name: 'Alice Johnson', email: 'alice@example.edu', student_id: '2021-CSE-034' },
      { id: 'stu-2', full_name: 'Bob Smith', email: 'bob@example.edu', student_id: '2020-EEE-112' },
      { id: 'stu-3', full_name: 'Carol Danvers', email: 'carol@example.edu', student_id: '2019-MECH-076' },
    ]);
  };

  const fetchStudents = async () => {
    if (!profile) return;

    if (useMock) {
      await mockFetchStudents();
      return;
    }

    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          student_id
        `)
        .eq('role', 'student');

      // If faculty is not senior/admin, only show assigned students
      if (profile.faculty_level !== 'senior' && profile.faculty_level !== 'admin') {
        query = query.eq('assigned_faculty_id', profile.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching students:', error);
        toast({
          title: 'Error fetching students',
          description: (error as any)?.message || JSON.stringify(error),
          variant: 'destructive',
        });
      } else {
        setStudents((data as Student[]) || []);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      toast({
        title: 'Error fetching students',
        description: (err as any)?.message || JSON.stringify(err),
        variant: 'destructive',
      });
    }
  };

  const handleCertificateAction = async (certificateId: string, action: 'approve' | 'reject', reason: string) => {
    if (!reason || !reason.trim()) {
      toast({
        title: 'Remark required',
        description: 'Please provide a remark before proceeding.',
        variant: 'destructive',
      });
      return;
    }

    if (useMock) {
      setProcessingCert(certificateId);
      try {
        await mockDelay(700);
        setCertificates((prev) => prev.map((c) =>
          c.id === certificateId
            ? {
                ...c,
                status: action === 'approve' ? 'approved' : 'rejected',
                remark: reason,
                rejection_reason: action === 'reject' ? reason : c.rejection_reason,
              }
            : c
        ));
        toast({ title: 'Success', description: `Certificate ${action}ed successfully!` });
        setRemarks((prev) => ({ ...prev, [certificateId]: '' }));
      } catch (e: any) {
        toast({ title: 'Error', description: e?.message || 'Mock request failed', variant: 'destructive' });
      } finally {
        setProcessingCert(null);
      }
      return;
    }

    setProcessingCert(certificateId);
    try {
      const updates: any = {
        status: action === 'approve' ? 'approved' : 'rejected',
        verified_by: profile?.id,
        verified_at: new Date().toISOString(),
        remark: reason,
      };

      if (action === 'reject' && reason) {
        updates.rejection_reason = reason;
      }

      const { error } = await supabase
        .from('certificates')
        .update(updates)
        .eq('id', certificateId);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: `Certificate ${action}ed successfully!`,
      });

      // Refresh certificates
      fetchCertificates();
      setRemarks((prev) => ({ ...prev, [certificateId]: '' }));
    } catch (error: any) {
      console.error('Error updating certificate:', error);
      toast({
        title: 'Error',
        description: error.message || `Failed to ${action} certificate`,
        variant: 'destructive',
      });
    } finally {
      setProcessingCert(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const pendingCertificates = certificates.filter(cert => cert.status === 'pending');
  const processedCertificates = certificates.filter(cert => cert.status !== 'pending');

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Faculty Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.full_name}!</p>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="mock-mode">Mock mode</Label>
          <Switch id="mock-mode" checked={useMock} onCheckedChange={setUseMock} />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingCertificates.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificates.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {certificates.filter(cert => cert.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending Reviews ({pendingCertificates.length})</TabsTrigger>
          <TabsTrigger value="processed">Processed</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Certificate Reviews</CardTitle>
              <CardDescription>
                Review and verify student certificates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading certificates...</div>
              ) : pendingCertificates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending certificates to review
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingCertificates.map((cert) => (
                    <div key={cert.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(cert.status)}
                            <h3 className="font-semibold">{cert.title}</h3>
                            {getStatusBadge(cert.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Student: {cert.student.full_name} ({cert.student.email})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Category: {cert.category.replace('_', ' ')} • Uploaded: {new Date(cert.uploaded_at).toLocaleDateString()}
                          </p>
                          {cert.description && (
                            <p className="text-sm text-muted-foreground mt-2">{cert.description}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(cert.file_url, '_blank')}
                        >
                          View Certificate
                        </Button>
                      </div>
                      
                      <div className="flex space-x-2">
                        <div className="flex-1 flex space-x-2">
                          <Textarea
                            placeholder="Remark (required)"
                            value={remarks[cert.id] || ''}
                            onChange={(e) => setRemarks((prev) => ({ ...prev, [cert.id]: e.target.value }))}
                            className="flex-1"
                            rows={1}
                          />
                          <Button
                            onClick={() => handleCertificateAction(cert.id, 'approve', remarks[cert.id] || '')}
                            disabled={processingCert === cert.id || !(remarks[cert.id] || '').trim()}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleCertificateAction(cert.id, 'reject', remarks[cert.id] || '')}
                            disabled={processingCert === cert.id || !(remarks[cert.id] || '').trim()}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="processed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processed Certificates</CardTitle>
              <CardDescription>
                Previously reviewed certificates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processedCertificates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No processed certificates yet
                </div>
              ) : (
                <div className="space-y-4">
                  {processedCertificates.map((cert) => (
                    <div key={cert.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(cert.status)}
                            <h3 className="font-semibold">{cert.title}</h3>
                            {getStatusBadge(cert.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Student: {cert.student.full_name} ({cert.student.email})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Category: {cert.category.replace('_', ' ')} • Processed: {new Date(cert.uploaded_at).toLocaleDateString()}
                          </p>
                          {cert.rejection_reason && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                              <p className="text-sm text-red-800">
                                <strong>Rejection Reason:</strong> {cert.rejection_reason}
                              </p>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(cert.file_url, '_blank')}
                        >
                          View Certificate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Students Overview</CardTitle>
              <CardDescription>
                {profile?.faculty_level === 'senior' || profile?.faculty_level === 'admin' 
                  ? 'All students in the system'
                  : 'Students assigned to you'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students found
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map((student) => {
                    const studentCerts = certificates.filter(cert => cert.student.id === student.id);
                    const approvedCerts = studentCerts.filter(cert => cert.status === 'approved').length;
                    const progress = studentCerts.length > 0 ? (approvedCerts / studentCerts.length) * 100 : 0;

                    return (
                      <Card key={student.id} className="cursor-pointer hover:shadow-md" onClick={() => navigate(`/faculty/students/${student.id}${useMock ? '?mock=1' : ''}`)}>
                        <CardContent className="p-4">
                          <h3 className="font-semibold">{student.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                          {student.student_id && (
                            <p className="text-sm text-muted-foreground">ID: {student.student_id}</p>
                          )}
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Certificates:</span>
                              <span>{studentCerts.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Approved:</span>
                              <span className="text-green-600">{approvedCerts}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Progress:</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FacultyDashboard;

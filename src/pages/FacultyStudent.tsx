import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Cell } from 'recharts';
import { ArrowLeft } from 'lucide-react';

interface StudentProfile { id: string; full_name: string; email: string; student_id?: string | null }
interface Cert { id: string; title: string; description: string | null; category: 'academic' | 'co_curricular'; status: 'pending' | 'approved' | 'rejected'; uploaded_at: string; file_url: string; file_name: string; remark?: string | null; rejection_reason?: string | null }

const mockDelay = (ms:number)=> new Promise(r=>setTimeout(r,ms));

export default function FacultyStudentPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const useMock = params.get('mock') === '1';
  const { toast } = useToast();

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    if (useMock) {
      (async () => {
        setLoading(true);
        await mockDelay(300);
        setStudent({ id, full_name: 'Alice Johnson', email: 'alice@example.edu', student_id: '2021-CSE-034' });
        await mockDelay(300);
        const now = Date.now();
        setCerts([
          { id: 'm1', title: 'Hackathon Winner', description: 'First place', category: 'co_curricular', status: 'approved', uploaded_at: new Date(now - 86400000*40).toISOString(), file_url: '#', file_name: 'hack.pdf', remark: 'Great work' },
          { id: 'm2', title: 'Science Fair', description: 'Participation', category: 'co_curricular', status: 'rejected', uploaded_at: new Date(now - 86400000*32).toISOString(), file_url: '#', file_name: 'sci.pdf', remark: 'Illegible scan', rejection_reason: 'Illegible scan' },
          { id: 'm3', title: 'B.Tech Degree', description: 'Degree', category: 'academic', status: 'approved', uploaded_at: new Date(now - 86400000*5).toISOString(), file_url: '#', file_name: 'deg.pdf', remark: 'Verified by registrar' },
          { id: 'm4', title: 'Workshop', description: 'ML workshop', category: 'academic', status: 'pending', uploaded_at: new Date(now - 86400000*1).toISOString(), file_url: '#', file_name: 'ws.pdf' },
        ]);
        setLoading(false);
      })();
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const { data: studentData, error: studentErr } = await supabase
          .from('profiles')
          .select('id, full_name, email, student_id')
          .eq('id', id)
          .single();
        if (studentErr) throw studentErr;
        setStudent(studentData as StudentProfile);

        const { data: certData, error: certErr } = await supabase
          .from('certificates')
          .select('*')
          .eq('student_id', id)
          .order('uploaded_at', { ascending: true });
        if (certErr) throw certErr;
        setCerts((certData as Cert[]) || []);
      } catch (e:any) {
        console.error(e);
        toast({ title: 'Error', description: e?.message || 'Failed to load student data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, useMock]);

  const summary = useMemo(() => {
    const total = certs.length;
    const approved = certs.filter(c=>c.status==='approved').length;
    const pending = certs.filter(c=>c.status==='pending').length;
    const rejected = certs.filter(c=>c.status==='rejected').length;
    const progress = total ? Math.round((approved/total)*100) : 0;
    return { total, approved, pending, rejected, progress };
  }, [certs]);

  const timeline = useMemo(() => {
    const map = new Map<string, { month: string; uploads: number; approved: number }>();
    certs.forEach(c => {
      const d = new Date(c.uploaded_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!map.has(key)) map.set(key, { month: key, uploads: 0, approved: 0 });
      const rec = map.get(key)!;
      rec.uploads += 1;
      if (c.status==='approved') rec.approved += 1;
    });
    return Array.from(map.values()).sort((a,b)=>a.month.localeCompare(b.month));
  }, [certs]);

  const statusCounts = useMemo(() => (
    ['approved','pending','rejected'].map(name => ({ name, value: certs.filter(c=>c.status===name).length }))
  ), [certs]);

  const categoryCounts = useMemo(() => (
    ['academic','co_curricular'].map(name => ({ name, value: certs.filter(c=>c.category===name).length }))
  ), [certs]);

  const categoryTimeline = useMemo(() => {
    const map = new Map<string, { month: string; academic: number; co_curricular: number }>();
    certs.forEach(c => {
      const d = new Date(c.uploaded_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!map.has(key)) map.set(key, { month: key, academic: 0, co_curricular: 0 });
      const rec = map.get(key)!;
      if (c.category === 'academic') rec.academic += 1; else rec.co_curricular += 1;
    });
    return Array.from(map.values()).sort((a,b)=>a.month.localeCompare(b.month));
  }, [certs]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Student Progress</h1>
            {student && (
              <p className="text-muted-foreground">{student.full_name} • {student.email} {student.student_id ? `• ${student.student_id}` : ''}</p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (window.history.length > 1) navigate(-1);
              else navigate('/');
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : !student ? (
          <div className="text-center py-12 text-muted-foreground">Student not found</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Total Certificates</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{summary.total}</div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Approved</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-green-600">{summary.approved}</div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Pending</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-yellow-600">{summary.pending}</div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Rejected</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-red-600">{summary.rejected}</div></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Progress</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{summary.progress}%</div></CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Status Distribution</CardTitle>
                  <CardDescription>Approved vs Pending vs Rejected</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ approved:{label:'Approved', color:'#16a34a'}, pending:{label:'Pending', color:'#eab308'}, rejected:{label:'Rejected', color:'#dc2626'} }}>
                    <BarChart data={statusCounts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value">
                        {statusCounts.map((entry, idx) => (
                          <Cell key={idx} fill={(entry.name==='approved' && '#16a34a') || (entry.name==='pending' && '#eab308') || '#dc2626'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Over Time</CardTitle>
                  <CardDescription>Uploads and approvals by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ uploads:{label:'Uploads', color:'#3b82f6'}, approvedLine:{label:'Approved', color:'#16a34a'} }}>
                    <LineChart data={timeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line type="monotone" dataKey="uploads" stroke="#3b82f6" name="Uploads" />
                      <Line type="monotone" dataKey="approved" stroke="#16a34a" name="Approved" />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                  <CardDescription>Academic vs Co-Curricular totals</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ academic:{label:'Academic', color:'#2563eb'}, co_curricular:{label:'Co-Curricular', color:'#06b6d4'} }}>
                    <BarChart data={categoryCounts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tickFormatter={(v)=>String(v).replace('_',' ')} />
                      <YAxis allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value">
                        {categoryCounts.map((entry, idx) => (
                          <Cell key={idx} fill={(entry.name==='academic' && '#2563eb') || '#06b6d4'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Trend</CardTitle>
                  <CardDescription>Uploads by month, per category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ academic:{label:'Academic', color:'#2563eb'}, co_curricular:{label:'Co-Curricular', color:'#06b6d4'} }}>
                    <LineChart data={categoryTimeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line type="monotone" dataKey="academic" stroke="#2563eb" name="Academic" />
                      <Line type="monotone" dataKey="co_curricular" stroke="#06b6d4" name="Co-Curricular" />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Certificates</CardTitle>
                <CardDescription>Latest submissions and status</CardDescription>
              </CardHeader>
              <CardContent>
                {certs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No certificates yet</div>
                ) : (
                  <div className="space-y-3">
                    {certs.slice().reverse().slice(0,8).map(c => (
                      <div key={c.id} className="flex items-start justify-between border rounded p-3">
                        <div className="space-y-1">
                          <div className="font-medium">{c.title}</div>
                          <div className="text-sm text-muted-foreground">{new Date(c.uploaded_at).toLocaleDateString()} • {c.category.replace('_',' ')}</div>
                          {(c.remark || c.rejection_reason) && (
                            <div className={`text-xs ${c.status==='rejected' ? 'text-red-700' : 'text-green-700'}`}>Remark: {c.remark || c.rejection_reason}</div>
                          )}
                        </div>
                        <Badge variant={c.status==='approved' ? 'default' : c.status==='pending' ? 'secondary' : 'destructive'} className={c.status==='pending' ? 'bg-yellow-100 text-yellow-800' : ''}>
                          {c.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Download, AlertTriangle, BarChart3, PieChart, LineChart } from 'lucide-react';
import {
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart as RLineChart,
  Line,
  PieChart as RPieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';

const PLATFORM_OPTIONS = [
  { key: 'leetcode', label: 'LeetCode' },
  { key: 'codeforces', label: 'Codeforces' },
  { key: 'coursera', label: 'Coursera' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'udemy', label: 'Udemy' },
  { key: 'edx', label: 'edX' }
];

interface Row {
  platform: string;
  studentId: string;
}

const MonitoringSection: React.FC = () => {
  const [selected, setSelected] = useState<string[]>(['leetcode']);
  const [rows, setRows] = useState<Row[]>([{ platform: 'leetcode', studentId: '' }]);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStudent, setFilterStudent] = useState<string>('all');
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');

  const handleTogglePlatform = (key: string, checked: boolean) => {
    setSelected((prev) => (checked ? [...new Set([...prev, key])] : prev.filter((p) => p !== key)));
    setRows((prev) => prev.map((r) => (r.platform === key ? r : r)));
  };

  const addRow = () => setRows((r) => [...r, { platform: selected[0] || 'leetcode', studentId: '' }]);

  const submitIds = () => {
    const payload = rows.filter((r) => r.studentId.trim()).filter((r) => selected.includes(r.platform));
    // Placeholder submit — replace with API call later
    console.log('Submitted IDs', { platforms: selected, range, rows: payload });
    alert('Submitted IDs for processing. Check console for payload.');
  };

  const studentsList = useMemo(() => Array.from(new Set(rows.map((r) => r.studentId).filter(Boolean))), [rows]);

  // Mock metrics derived from inputs so UI is interactive
  const metrics = useMemo(() => {
    const platforms = filterPlatform === 'all' ? selected : [filterPlatform];
    const items = platforms.flatMap((p, i) =>
      (filterStudent === 'all' ? studentsList : studentsList.filter((s) => s === filterStudent)).map((s, j) => ({
        platform: p,
        student: s || `student-${i + j + 1}`,
        solved: (i + 1) * 5 + j * 3,
        hours: (i + 1) * 2 + j,
        courses: (i + j) % 3,
      }))
    );
    return items.length ? items : [{ platform: 'leetcode', student: 'demo', solved: 12, hours: 6, courses: 1 }];
  }, [selected, filterPlatform, filterStudent, studentsList]);

  const totals = useMemo(() => ({
    students: new Set(metrics.map((m) => m.student)).size,
    activity: metrics.reduce((s, m) => s + m.hours + m.solved + m.courses, 0),
    top: metrics.slice().sort((a, b) => b.solved - a.solved)[0],
  }), [metrics]);

  const barData = useMemo(() => metrics.map((m) => ({ name: m.student, solved: m.solved })), [metrics]);
  const lineData = useMemo(() => metrics.map((m, idx) => ({ day: idx + 1, hours: m.hours })), [metrics]);
  const pieData = useMemo(() => {
    const byPlatform: Record<string, number> = {};
    metrics.forEach((m) => { byPlatform[m.platform] = (byPlatform[m.platform] || 0) + m.solved; });
    return Object.entries(byPlatform).map(([name, value]) => ({ name, value }));
  }, [metrics]);

  const COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#60A5FA', '#F472B6'];

  const exportCSV = () => {
    const headers = ['platform', 'student', 'solved', 'hours', 'courses'];
    const rowsCsv = metrics.map((m) => [m.platform, m.student, m.solved, m.hours, m.courses].join(','));
    const csv = [headers.join(','), ...rowsCsv].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<pre>${JSON.stringify(metrics, null, 2)}</pre>`);
    w.document.close();
    w.focus();
    w.print();
  };

  const inactive = metrics.every((m) => m.hours + m.solved + m.courses === 0);

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {inactive && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Low activity</AlertTitle>
          <AlertDescription>No activity detected for the selected filters.</AlertDescription>
        </Alert>
      )}

      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Platform Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PLATFORM_OPTIONS.map((opt) => (
              <label key={opt.key} className="flex items-center gap-2 rounded-lg border p-3 hover:bg-gray-50">
                <Checkbox checked={selected.includes(opt.key)} onCheckedChange={(v) => handleTogglePlatform(opt.key, Boolean(v))} />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student IDs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Student IDs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Select value={filterPlatform} onValueChange={(v: string) => setFilterPlatform(v)}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Platform" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {selected.map((p) => (
                  <SelectItem key={p} value={p}>{PLATFORM_OPTIONS.find(o=>o.key===p)?.label || p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStudent} onValueChange={(v: string) => setFilterStudent(v)}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Student" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {studentsList.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={(v: '7d' | '30d' | '90d') => setRange(v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Range" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-2" />CSV</Button>
              <Button variant="outline" size="sm" onClick={exportPDF}><Download className="h-4 w-4 mr-2" />PDF</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {rows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select value={row.platform} onValueChange={(v) => setRows((r) => r.map((x, i) => i === idx ? { ...x, platform: v } : x))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {selected.map((p) => (
                      <SelectItem key={p} value={p}>{PLATFORM_OPTIONS.find(o=>o.key===p)?.label || p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Student ID / Handle" value={row.studentId} onChange={(e) => setRows((r) => r.map((x, i) => i === idx ? { ...x, studentId: e.target.value } : x))} />
                <div className="flex gap-2">
                  <Button variant="outline" className="w-full" onClick={() => setRows((r) => r.filter((_, i) => i !== idx))}>Remove</Button>
                  {idx === rows.length - 1 && (
                    <Button className="w-full" onClick={addRow}>Add Row</Button>
                  )}
                </div>
              </div>
            ))}
            {rows.length === 0 && (
              <Button variant="outline" onClick={addRow}>Add Row</Button>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={submitIds}>Submit</Button>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Problems Solved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RBarChart data={barData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip />
                  <Bar dataKey="solved" fill="#7C3AED" radius={[6,6,0,0]} />
                </RBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LineChart className="h-4 w-4" /> Time Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RLineChart data={lineData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip />
                  <Line type="monotone" dataKey="hours" stroke="#10B981" strokeWidth={2} dot={false} />
                </RLineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PieChart className="h-4 w-4" /> Platform Share</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Total Students</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totals.students}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Activity</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totals.activity}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Performer</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totals.top ? `${totals.top.student}` : '—'}</div></CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MonitoringSection;

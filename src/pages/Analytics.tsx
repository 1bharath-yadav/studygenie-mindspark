import React, { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useStudent } from '@/hooks/useApi';
import { Card } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';

const MetricsCard: React.FC<{ title: string; value: React.ReactNode }> = ({ title, value }) => (
  <div className="p-4 bg-card border rounded">
    <div className="text-xs text-muted-foreground">{title}</div>
    <div className="text-2xl font-semibold mt-1">{value}</div>
  </div>
);

const SmallBar: React.FC<{ label: string; value: number; max: number }> = ({ label, value, max }) => {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>{label}</span><span>{value}</span></div>
      <div className="w-full bg-border rounded h-3">
        <div className="bg-primary h-3 rounded" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const Analytics: React.FC = () => {
  const { data: student } = useStudent();
  const studentId = student?.student_id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'summary', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('No student id');
      const resp = await apiClient.get<any>(`/api/v1/analytics/${studentId}/summary`);
      return resp?.data ?? resp;
    },
    enabled: !!studentId,
  });

  const { data: weeklyData } = useQuery({
    queryKey: ['analytics', 'weekly', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const resp = await apiClient.get<any>(`/api/v1/analytics/${studentId}/weekly-trends`);
      return resp?.data ?? resp ?? [];
    },
    enabled: !!studentId,
  });

  const { data: weaknessesData } = useQuery({
    queryKey: ['analytics', 'weaknesses', studentId],
    queryFn: async () => {
      if (!studentId) return { subjects: [], concepts: [] };
      const resp = await apiClient.get<any>(`/api/v1/analytics/${studentId}/weaknesses`);
      return resp?.data ?? resp ?? { subjects: [], concepts: [] };
    },
    enabled: !!studentId,
  });

  const summary: any = data ?? null;
  const weekly: any[] = weeklyData ?? [];
  const weaknesses: any = weaknessesData ?? { subjects: [], concepts: [] };

  // Derive simple maxima for chart scaling
  const maxForBars = Math.max(1, (summary?.total_activities ?? 0), (summary?.total_time_spent ?? 0), Math.round((summary?.avg_score ?? 0) * 10));

  const [selectedWeakness, setSelectedWeakness] = useState<any | null>(null);

  const conceptsToShow = useMemo(() => {
    // prefer concepts if a subject is selected
    if (!selectedWeakness) return weaknesses.concepts ?? [];
    if (selectedWeakness.type === 'subject') {
      // filter concepts belonging to the subject
      return (weaknesses.concepts ?? []).filter((c: any) => c.subject_id === selectedWeakness.subject_id);
    }
    return weaknesses.concepts ?? [];
  }, [selectedWeakness, weaknesses]);

  // Color palette for bars
  const COLORS = ['#60A5FA', '#34D399', '#F59E0B', '#F97316', '#EF4444', '#A78BFA'];

  return (
    <AppLayout>
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Overview of recent learning activity and recommendations.</p>
      </header>

      {isLoading ? (
        <div className="min-h-[160px] flex items-center justify-center">Loading analytics…</div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 text-destructive rounded">Failed to load analytics: {(error as any)?.message ?? 'Unknown'}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <MetricsCard title="Total activities" value={summary?.total_activities ?? 0} />
          <MetricsCard title="Activity types" value={summary?.distinct_activity_types ?? 0} />
          <MetricsCard title="Avg. score" value={summary?.avg_score ? Number(summary.avg_score).toFixed(2) : '—'} />
        </div>
      )}

      {summary && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-2">Weekly activity trend</h3>
              {weekly.length === 0 ? (
                <div className="text-sm text-muted-foreground">No weekly data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={weekly} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="activities" name="Activities" fill="#60A5FA" />
                    <Bar dataKey="time_spent" name="Time (s)" fill="#34D399" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-medium mb-2">Weakness by subject</h3>
              {(!weaknesses || (weaknesses.subjects ?? []).length === 0) ? (
                <div className="text-sm text-muted-foreground">No weakness data available</div>
              ) : (
                <div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={weaknesses.subjects} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="weakness_score"
                        name="Weakness"
                        onClick={(evt: any) => {
                          // evt.payload is the clicked datum
                          setSelectedWeakness({ ...evt.payload, type: 'subject' });
                        }}
                      >
                        {weaknesses.subjects.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-3 text-xs text-muted-foreground">Click a bar to drill into concepts for that subject.</div>
                </div>
              )}
            </Card>
          </div>

          {/* Drilldown / details area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-4 lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Concepts</h4>
                {selectedWeakness ? (
                  <button className="text-xs text-primary" onClick={() => setSelectedWeakness(null)}>Clear filter</button>
                ) : null}
              </div>

              {conceptsToShow.length === 0 ? (
                <div className="text-sm text-muted-foreground">No concept-level data available</div>
              ) : (
                <div className="space-y-3">
                  {conceptsToShow.map((c: any, i: number) => (
                    <div key={c.id ?? i} className="p-3 border rounded">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium">{c.name ?? c.concept_name ?? 'Unnamed'}</div>
                          <div className="text-xs text-muted-foreground">Avg score: {c.avg_score ?? '—'} • Attempts: {c.attempts ?? c.count ?? 0}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">Weakness: {c.weakness_score ? Number(c.weakness_score).toFixed(2) : '—'}</div>
                      </div>
                      {c.recommendations && c.recommendations.length > 0 && (
                        <div className="mt-2 text-xs">
                          <div className="font-medium">Recommendations:</div>
                          <ul className="list-disc list-inside mt-1 text-muted-foreground">
                            {c.recommendations.map((r: string, idx: number) => (
                              <li key={idx}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4">
              <h4 className="text-sm font-medium mb-2">Quick metrics</h4>
              <SmallBar label="Total time" value={summary.total_time_spent ?? 0} max={maxForBars} />
              <div className="mt-3">
                <SmallBar label="Activities" value={summary.total_activities ?? 0} max={maxForBars} />
              </div>
            </Card>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            The charts above use a lightweight charting library and allow basic drilldowns. If you want richer interactive visuals (zoom, brush, stacked timelines) we can add configuration or a different chart library.
          </div>
        </section>
      )}
    </div>
    </AppLayout>
  );
};

export default Analytics;

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadialBarChart,
  RadialBar,
} from 'recharts';

interface ProgressChartProps {
  detailed?: boolean;
  progressData?: Array<{
    subject: string;
    progress: number;
    color: string;
  }>;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  detailed = false,
  progressData = []
}) => {
  // Use provided data or fallback to sample data
  const weeklyProgressData = [
    { day: 'Mon', mathematics: 0, physics: 0, chemistry: 0, biology: 0 },
    { day: 'Tue', mathematics: 0, physics: 0, chemistry: 0, biology: 0 },
    { day: 'Wed', mathematics: 0, physics: 0, chemistry: 0, biology: 0 },
    { day: 'Thu', mathematics: 0, physics: 0, chemistry: 0, biology: 0 },
    { day: 'Fri', mathematics: 0, physics: 0, chemistry: 0, biology: 0 },
    { day: 'Sat', mathematics: 0, physics: 0, chemistry: 0, biology: 0 },
    { day: 'Sun', mathematics: 0, physics: 0, chemistry: 0, biology: 0 },
  ];

  const subjectDistribution = progressData.length > 0
    ? progressData.map(item => ({
      name: item.subject,
      value: item.progress,
      color: item.color
    }))
    : [
      { name: 'No Data', value: 100, color: 'hsl(var(--muted))' }
    ];

  const studySessionData = [
    { time: '9:00', focus: 85, efficiency: 78, retention: 92 },
    { time: '10:00', focus: 88, efficiency: 82, retention: 89 },
    { time: '11:00', focus: 92, efficiency: 85, retention: 94 },
    { time: '12:00', focus: 87, efficiency: 80, retention: 88 },
    { time: '13:00', focus: 75, efficiency: 70, retention: 82 },
    { time: '14:00', focus: 80, efficiency: 75, retention: 85 },
    { time: '15:00', focus: 90, efficiency: 88, retention: 91 },
    { time: '16:00', focus: 95, efficiency: 92, retention: 96 },
  ];

  const masteryLevels = [
    { subject: 'Math', mastery: 85, target: 90 },
    { subject: 'Physics', mastery: 72, target: 85 },
    { subject: 'Chemistry', mastery: 68, target: 80 },
    { subject: 'Biology', mastery: 91, target: 95 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-border/50">
          <p className="font-medium text-card-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.dataKey}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (detailed) {
    return (
      <div className="space-y-8">
        {/* Weekly Progress Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Weekly Progress Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyProgressData}>
                  <defs>
                    <linearGradient id="colorMath" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorPhysics" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="mathematics"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorMath)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="physics"
                    stroke="hsl(var(--secondary))"
                    fillOpacity={1}
                    fill="url(#colorPhysics)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-secondary">Subject Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {subjectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Study Session Analytics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-accent">Daily Study Session Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={studySessionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="focus"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="retention"
                  stroke="hsl(var(--accent))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mastery vs Target */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-success">Mastery Levels vs Targets</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={masteryLevels} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="mastery" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  // For simple chart, show a pie chart if we have data, otherwise show empty state
  if (progressData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-center">
        <div>
          <div className="text-muted-foreground mb-2">📊</div>
          <p className="text-sm text-muted-foreground">No progress data yet</p>
          <p className="text-xs text-muted-foreground">Upload study materials to see your analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={subjectDistribution}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}%`}
            labelLine={false}
          >
            {subjectDistribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
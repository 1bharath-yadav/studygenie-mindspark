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
    Legend,
} from 'recharts';

interface WeeklyTrendsChartProps {
    data?: Array<{
        day: string;
        study_time: number;
        concepts_learned: number;
        quiz_accuracy: number;
    }>;
}

export const WeeklyTrendsChart: React.FC<WeeklyTrendsChartProps> = ({
    data = []
}) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-80 text-muted-foreground">
                <p>No weekly trends data available</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-border/50">
                    <p className="font-medium text-card-foreground mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {entry.dataKey === 'study_time' && `Study Time: ${entry.value}h`}
                            {entry.dataKey === 'concepts_learned' && `Concepts: ${entry.value}`}
                            {entry.dataKey === 'quiz_accuracy' && `Accuracy: ${entry.value}%`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorStudyTime" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorConcepts" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                        type="monotone"
                        dataKey="study_time"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorStudyTime)"
                        strokeWidth={2}
                        name="Study Time (hours)"
                    />
                    <Line
                        type="monotone"
                        dataKey="concepts_learned"
                        stroke="hsl(var(--secondary))"
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 4 }}
                        name="Concepts Learned"
                    />
                    <Line
                        type="monotone"
                        dataKey="quiz_accuracy"
                        stroke="hsl(var(--accent))"
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                        name="Quiz Accuracy (%)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';

interface ProgressChartProps {
    progressData?: Array<{
        subject: string;
        progress: number;
        color?: string;
    }>;
    height?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const ProgressChart: React.FC<ProgressChartProps> = ({
    progressData = [],
    height = 300
}) => {
    if (!progressData || progressData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No progress data available</p>
            </div>
        );
    }

    // Ensure data has colors
    const chartData = progressData.map((item, index) => ({
        ...item,
        color: item.color || COLORS[index % COLORS.length]
    }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border">
                    <p className="font-medium">{label}</p>
                    <p style={{ color: payload[0].color }}>
                        Progress: {payload[0].value}%
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full space-y-6">
            {/* Bar Chart */}
            <div className="h-64">
                <h4 className="text-md font-semibold mb-2">Subject Progress</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="subject"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            domain={[0, 100]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="progress"
                            fill="#8884d8"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="h-64">
                <h4 className="text-md font-semibold mb-2">Progress Distribution</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ subject, progress }) => `${subject}: ${progress}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="progress"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

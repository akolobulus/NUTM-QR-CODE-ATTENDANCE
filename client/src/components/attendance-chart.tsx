import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CourseStatistics } from '@/lib/attendance';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AttendanceChartProps {
  data: CourseStatistics[];
}

export default function AttendanceChart({ data }: AttendanceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // Format data for use with recharts
  const chartData = data.map(item => ({
    session: item.session,
    attendanceCount: item.attendanceCount,
    totalStudents: item.totalStudents,
    attendancePercentage: item.attendancePercentage
  }));
  
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-2 text-sm shadow-lg border-0">
          <CardContent className="p-2">
            <p className="font-bold mb-1">{label}</p>
            <p>Present: {payload[0].value} students</p>
            <p>Total: {payload[1].value} students</p>
            <p>Percentage: {payload[2].value}%</p>
          </CardContent>
        </Card>
      );
    }
    return null;
  };
  
  return (
    <div ref={chartContainerRef} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 70
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="session" 
            angle={-45}
            textAnchor="end"
            height={70}
          />
          <YAxis yAxisId="left" orientation="left" label={{ value: 'Number of Students', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} label={{ value: 'Percentage', angle: 90, position: 'insideRight' }} />
          <Tooltip content={customTooltip} />
          <Legend />
          <Bar yAxisId="left" dataKey="attendanceCount" name="Present" fill="#4CAF50" />
          <Bar yAxisId="left" dataKey="totalStudents" name="Total" fill="#C8E6C9" />
          <Bar yAxisId="right" dataKey="attendancePercentage" name="Percentage" fill="#388E3C" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

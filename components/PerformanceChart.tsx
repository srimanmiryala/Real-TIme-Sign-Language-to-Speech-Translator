import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ChartDataPoint } from '../types';

interface PerformanceChartProps {
  data: ChartDataPoint[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  return (
    <div className="w-full h-48 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-400 mb-4">Inference Confidence</h3>
      <div className="w-full h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#94a3b8', fontSize: 10 }} 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: '#94a3b8', fontSize: 10 }} 
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
              itemStyle={{ color: '#10b981' }}
            />
            <Area
              type="monotone"
              dataKey="confidence"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorConfidence)"
              strokeWidth={2}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;

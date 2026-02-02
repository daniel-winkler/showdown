import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Vote } from '@shared/types';

interface VotingResultsProps {
  votes: Vote[];
}

interface VoteDistribution {
  name: string;
  value: number | string;
  count: number;
  percentage: number;
}

// Color palette for the pie chart
const COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // green-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#F97316', // orange-500
];

export default function VotingResults({ votes }: VotingResultsProps) {
  // Calculate vote distribution
  const distribution = calculateDistribution(votes);
  
  // Calculate statistics
  const stats = calculateStatistics(votes);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800 text-center">
        Voting Results
      </h2>

      {/* Pie Chart */}
      <div className="bg-gray-50 rounded-lg p-6">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={distribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {distribution.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Average</p>
          <p className="text-2xl font-bold text-blue-600">{stats.average}</p>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Min</p>
          <p className="text-2xl font-bold text-amber-600">{stats.min}</p>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Max</p>
          <p className="text-2xl font-bold text-red-600">{stats.max}</p>
        </div>
      </div>

      {/* Most Common Vote - only show if there's an actual most common (more than 1 vote) */}
      {stats.mostCommon !== null && stats.mostCommonCount > 1 && (
        <div className="bg-indigo-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Most Common Vote</p>
          <p className="text-3xl font-bold text-indigo-600">{stats.mostCommon}</p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.mostCommonCount} vote(s)
          </p>
        </div>
      )}

      {/* Consensus Indicator */}
      {stats.consensus && (
        <div className="bg-green-100 border border-green-300 rounded-lg p-4 text-center">
          <span className="text-2xl">🎉</span>
          <p className="text-green-800 font-semibold mt-2">
            Perfect Consensus! Everyone voted {stats.mostCommon}
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to calculate vote distribution
function calculateDistribution(votes: Vote[]): VoteDistribution[] {
  const voteMap = new Map<number | string, number>();
  
  // Count votes for each value
  votes.forEach(vote => {
    voteMap.set(vote.value, (voteMap.get(vote.value) || 0) + 1);
  });

  // Convert to array and calculate percentages
  const total = votes.length;
  const distribution: VoteDistribution[] = [];

  voteMap.forEach((count, value) => {
    distribution.push({
      name: typeof value === 'number' ? `${value} points` : String(value),
      value,
      count,
      percentage: Math.round((count / total) * 100 * 10) / 10, // Round to 1 decimal
    });
  });

  // Sort by vote value (numbers first, then strings)
  return distribution.sort((a, b) => {
    const aIsNum = typeof a.value === 'number';
    const bIsNum = typeof b.value === 'number';
    
    if (aIsNum && bIsNum) return (a.value as number) - (b.value as number);
    if (aIsNum) return -1;
    if (bIsNum) return 1;
    return String(a.value).localeCompare(String(b.value));
  });
}

// Helper function to calculate statistics
function calculateStatistics(votes: Vote[]) {
  if (votes.length === 0) {
    return {
      average: 0,
      min: 0,
      max: 0,
      mostCommon: null,
      mostCommonCount: 0,
      consensus: false,
    };
  }

  // Filter only numeric votes for statistical calculations
  const numericVotes = votes.filter(v => typeof v.value === 'number');
  const values = numericVotes.map(v => v.value as number).sort((a, b) => a - b);
  
  // Average
  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = values.length > 0 ? Math.round((sum / values.length) * 10) / 10 : 0;

  // Min and Max
  const min = values.length > 0 ? values[0] : 0;
  const max = values.length > 0 ? values[values.length - 1] : 0;

  // Most common vote (all votes, not just numeric)
  const allValues = votes.map(v => v.value);
  const frequency = new Map<number | string, number>();
  allValues.forEach(val => {
    frequency.set(val, (frequency.get(val) || 0) + 1);
  });
  
  let mostCommon: number | string | null = null;
  let maxFrequency = 0;
  frequency.forEach((count, value) => {
    if (count > maxFrequency) {
      maxFrequency = count;
      mostCommon = value;
    }
  });

  // Consensus check (all votes are the same)
  const consensus = new Set(allValues).size === 1;

  return {
    average,
    min,
    max,
    mostCommon,
    mostCommonCount: maxFrequency,
    consensus,
  };
}

// Custom label renderer for pie chart
function renderCustomLabel(entry: VoteDistribution) {
  return `${entry.percentage}%`;
}

// Custom tooltip for pie chart
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as VoteDistribution;
    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-800">{data.name}</p>
        <p className="text-sm text-gray-600">
          {data.count} vote{data.count !== 1 ? 's' : ''} ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
}

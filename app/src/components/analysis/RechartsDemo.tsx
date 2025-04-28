import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 500 },
  { name: 'Apr', value: 200 },
];

export default function RechartsDemo() {
  return (
    <div className="p-6 bg-white shadow-md rounded-lg mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Sample Bar Chart (Recharts)</h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#2DD4BF" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

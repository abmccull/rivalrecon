export type HeaderSectionProps = { analysis: any };
export default function HeaderSection({ analysis }: HeaderSectionProps) {
  return (
    <div className="p-6 bg-white shadow-md rounded-lg mb-6">
      <h1 className="text-2xl font-bold text-teal-500">Analysis: Nuun Electrolyte Tablets - Hydration Supplements</h1>
      <p className="text-gray-500 text-sm">Analysis Date: April 17, 2025</p>
      <div className="mt-4 space-x-4">
        <button className="border border-teal-500 text-teal-500 px-4 py-2 rounded hover:bg-teal-50">View Product</button>
        <a href="#" className="text-teal-500 hover:underline">Back to Dashboard</a>
      </div>
    </div>
  );
} 
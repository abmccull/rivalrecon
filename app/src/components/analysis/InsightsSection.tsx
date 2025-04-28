export type InsightsSectionProps = { analysis: any };
export default function InsightsSection({ analysis }: InsightsSectionProps) {
  return (
    <div className="p-6 bg-gradient-to-r from-teal-50 to-white border border-teal-500 rounded-lg mb-6 grid md:grid-cols-2 gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Key Insights</h2>
        <ul className="space-y-2">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✔</span>
            <span>70% of reviews praise hydration effectiveness.</span>
          </li>
          <li className="flex items-center">
            <span className="text-red-500 mr-2">✘</span>
            <span>20% mention poor taste consistency.</span>
          </li>
        </ul>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Improvement Opportunities</h2>
        <ol className="space-y-2 list-decimal list-inside">
          <li className="flex items-center">
            <span className="text-teal-500 mr-2">➔</span>
            <span>Enhance flavor profiles based on feedback.</span>
          </li>
          <li className="flex items-center">
            <span className="text-teal-500 mr-2">➔</span>
            <span>Market hydration benefits more aggressively.</span>
          </li>
        </ol>
      </div>
    </div>
  );
} 
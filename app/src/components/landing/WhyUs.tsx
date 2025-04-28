"use client";

export default function WhyUs() {
  return (
    <section className="py-16 px-4 bg-white" id="why-us">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="flex-1 max-w-xl flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="text-blue-500 font-bold">WHY CHOOSE US</span>
            <h2 className="text-3xl font-bold">What Makes RivalRecon Different?</h2>
            <p className="text-lg text-gray-600">We transform raw customer feedback into actionable business intelligence that helps you outperform the competition.</p>
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <span className="p-3 bg-blue-100 text-blue-600 rounded-full">→</span>
              <div>
                <h3 className="font-semibold">Advanced AI Analysis</h3>
                <p className="text-gray-600">Our DeepSeek-powered analysis extracts deeper insights than traditional NLP tools.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="p-3 bg-blue-100 text-blue-600 rounded-full">→</span>
              <div>
                <h3 className="font-semibold">Visual Insights</h3>
                <p className="text-gray-600">Interactive dashboards make complex data patterns immediately apparent.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="p-3 bg-blue-100 text-blue-600 rounded-full">→</span>
              <div>
                <h3 className="font-semibold">Industry Expertise</h3>
                <p className="text-gray-600">Built by CPG veterans who understand the challenges of the industry.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="p-3 bg-blue-100 text-blue-600 rounded-full">→</span>
              <div>
                <h3 className="font-semibold">Time-Saving</h3>
                <p className="text-gray-600">Get in-depth analysis in minutes instead of weeks of manual review.</p>
              </div>
            </div>
          </div>
          <button className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition w-max">Start Your Free Trial</button>
        </div>
        <div className="flex-1 flex items-center justify-center max-w-xl">
          <img
            src="/dashboard-preview.png"
            alt="RivalRecon Dashboard Preview"
            className="rounded-lg shadow-xl w-full max-w-md object-cover"
          />
        </div>
      </div>
    </section>
  );
} 
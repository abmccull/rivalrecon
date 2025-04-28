export default function Problem() {
  return (
    <section className="py-16 px-4 bg-gray-50" id="problem">
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">The Problem with Product Reviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center transition-transform hover:-translate-y-1 hover:shadow-lg">
            <div className="p-3 rounded-full bg-blue-50 text-blue-600 mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Too Many Reviews</h3>
            <p className="text-center text-gray-600">With thousands of reviews across multiple platforms, it's impossible to manually read and analyze them all.</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center transition-transform hover:-translate-y-1 hover:shadow-lg">
            <div className="p-3 rounded-full bg-teal-50 text-teal-600 mb-4">
              <span className="text-3xl">📈</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Hidden Patterns</h3>
            <p className="text-center text-gray-600">Critical patterns and trends in customer feedback often go unnoticed without proper analytical tools.</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center transition-transform hover:-translate-y-1 hover:shadow-lg">
            <div className="p-3 rounded-full bg-purple-50 text-purple-600 mb-4">
              <span className="text-3xl">⏳</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Time-Consuming</h3>
            <p className="text-center text-gray-600">Manual analysis is slow and biased, causing you to miss competitive opportunities and market shifts.</p>
          </div>
        </div>
        <div className="mt-8 w-full flex justify-center">
          <div className="bg-blue-50 rounded-md p-4 flex items-center gap-4 max-w-xl w-full">
            <span className="text-blue-600 text-2xl">ℹ️</span>
            <div>
              <div className="font-bold mb-1">Did you know?</div>
              <div className="text-gray-700 text-sm">Companies that leverage AI-powered product review analysis are 2.3x more likely to introduce successful product improvements.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 
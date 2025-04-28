export default function Solution() {
  return (
    <section className="py-16 px-4 bg-gray-50" id="solution">
      <div className="max-w-6xl mx-auto flex flex-col gap-12 items-center">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-blue-500 font-bold">OUR SOLUTION</span>
          <h2 className="text-3xl font-bold mt-2 mb-4">Transform Customer Reviews Into Strategic Insights</h2>
          <p className="text-lg text-gray-600">RivalRecon combines advanced AI with intuitive design to help you make data-driven decisions faster and with greater confidence.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          <div className="bg-white rounded-lg shadow-md p-8 flex flex-col items-start transition-transform hover:-translate-y-1 hover:shadow-lg h-full">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Competitive Analysis</h3>
            <p className="text-gray-600 mb-4">Compare your products against competitors to identify gaps and opportunities in the market.</p>
            <a href="#" className="text-blue-500 font-bold hover:underline flex items-center gap-1">Learn more <span>→</span></a>
          </div>
          <div className="bg-white rounded-lg shadow-md p-8 flex flex-col items-start transition-transform hover:-translate-y-1 hover:shadow-lg h-full">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-green-100 text-green-600 mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Sentiment Analysis</h3>
            <p className="text-gray-600 mb-4">Understand customer feelings toward specific product features and compare them against competitors.</p>
            <a href="#" className="text-blue-500 font-bold hover:underline flex items-center gap-1">Learn more <span>→</span></a>
          </div>
          <div className="bg-white rounded-lg shadow-md p-8 flex flex-col items-start transition-transform hover:-translate-y-1 hover:shadow-lg h-full">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Actionable Recommendations</h3>
            <p className="text-gray-600 mb-4">Get AI-powered suggestions for product improvements and marketing strategies based on customer feedback.</p>
            <a href="#" className="text-blue-500 font-bold hover:underline flex items-center gap-1">Learn more <span>→</span></a>
          </div>
        </div>
      </div>
    </section>
  );
} 
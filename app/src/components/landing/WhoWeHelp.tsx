export default function WhoWeHelp() {
  return (
    <section className="py-16 px-4 bg-gray-50" id="who-we-help">
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-2">Who We Help</h2>
          <p className="text-lg text-gray-600">RivalRecon is designed for teams that need to understand customer feedback at scale</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-8 flex flex-col items-start transition-transform hover:-translate-y-1 hover:shadow-lg h-full">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-100 text-red-500 mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Product Teams</h3>
            <p className="text-gray-600 mb-4">Identify feature gaps, prioritize product roadmaps, and understand what customers love and hate about your products.</p>
            <button className="text-red-500 font-bold hover:underline flex items-center gap-1">Learn more <span>→</span></button>
          </div>
          <div className="bg-white rounded-lg shadow-md p-8 flex flex-col items-start transition-transform hover:-translate-y-1 hover:shadow-lg h-full">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-green-100 text-green-500 mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Marketing Teams</h3>
            <p className="text-gray-600 mb-4">Discover your product's strongest selling points and competitive advantages to enhance your marketing strategy.</p>
            <button className="text-green-500 font-bold hover:underline flex items-center gap-1">Learn more <span>→</span></button>
          </div>
          <div className="bg-white rounded-lg shadow-md p-8 flex flex-col items-start transition-transform hover:-translate-y-1 hover:shadow-lg h-full">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-100 text-blue-500 mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Executive Leadership</h3>
            <p className="text-gray-600 mb-4">Get high-level insights into customer sentiment and competitive positioning to guide strategic decisions.</p>
            <button className="text-blue-500 font-bold hover:underline flex items-center gap-1">Learn more <span>→</span></button>
          </div>
        </div>
      </div>
    </section>
  );
} 
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-3xl w-full text-center">
        <div className="mb-8 relative">
          <div className="text-[200px] font-bold text-[#2DD4BF]/20 leading-none select-none">404</div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full">
            <span className="text-8xl mb-4 inline-block" role="img" aria-label="Compass">🧭</span>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1F2937] mt-4">Page Not Found</h1>
          </div>
        </div>
        <p className="text-xl text-gray-600 mb-8 max-w-xl mx-auto">
          Oops! It looks like you've ventured into uncharted territory. The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-[#1F2937] mb-4">Here's what you can do next:</h2>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-[#2DD4BF]/10 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-[#2DD4BF] text-2xl" role="img" aria-label="Home">🏠</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#1F2937] mb-1">Return Home</h3>
                  <p className="text-gray-600 text-sm">Go back to our homepage and start fresh.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-10 h-10 bg-[#2DD4BF]/10 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-[#2DD4BF] text-2xl" role="img" aria-label="Search">🔍</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#1F2937] mb-1">Search</h3>
                  <p className="text-gray-600 text-sm">Try searching for what you're looking for.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-10 h-10 bg-[#2DD4BF]/10 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-[#2DD4BF] text-2xl" role="img" aria-label="Contact">✉️</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#1F2937] mb-1">Contact Support</h3>
                  <p className="text-gray-600 text-sm">Reach out if you need help finding something.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-10 h-10 bg-[#2DD4BF]/10 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-[#2DD4BF] text-2xl" role="img" aria-label="Resources">💡</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#1F2937] mb-1">Browse Resources</h3>
                  <p className="text-gray-600 text-sm">Check out our help center or blog articles.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/" className="bg-[#2DD4BF] text-white px-8 py-4 rounded-md font-medium text-center hover:bg-opacity-90 transform hover:scale-105 transition-all">
              Back to Homepage
            </Link>
            <Link href="/contact" className="border-2 border-[#1E3A8A] text-[#1E3A8A] px-8 py-4 rounded-md font-medium text-center hover:bg-[#1E3A8A] hover:text-white transition-all">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

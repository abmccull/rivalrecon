export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-[#1E3A8A] via-[#1E3A8A] to-[#164e63] text-white py-16 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute right-[-10%] top-[-10%] w-[30%] h-[30%] rounded-full bg-gradient-to-br from-teal-400/10 to-teal-400/5" />
      <div className="absolute left-[-8%] bottom-[-15%] w-[20%] h-[50%] rounded-full bg-gradient-to-br from-teal-400/5 to-teal-400/10" />
      <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10 px-4">
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent leading-tight">
            Turn Customer Reviews Into Competitive Insights
          </h1>
          <p className="text-xl opacity-90">
            Analyze your competitor's product reviews to discover what customers love and hate, and how you can improve your products.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button className="bg-teal-500 hover:bg-teal-600 text-white font-semibold px-8 py-3 rounded-lg transition shadow-lg">Get Started</button>
            <button className="border border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-[#1E3A8A] transition">See Demo</button>
          </div>
          <div className="flex gap-4 mt-2 text-sm opacity-80">
            <span className="flex items-center gap-1"><span className="text-teal-300">✓</span>Free 3-day trial</span>
            <span className="flex items-center gap-1"><span className="text-teal-300">✓</span>Cancel anytime</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            alt="RivalRecon dashboard preview"
            className="rounded-xl shadow-2xl w-full max-w-md object-cover"
          />
        </div>
      </div>
    </section>
  );
} 
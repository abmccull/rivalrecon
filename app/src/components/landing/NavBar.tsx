export default function NavBar() {
  return (
    <nav className="sticky top-0 bg-[#1E3A8A] text-white p-4 flex justify-between items-center shadow-md z-50">
      <div className="text-xl font-bold">RivalRecon</div>
      <div className="space-x-4 flex items-center">
        <a href="#features" className="hover:underline">Features</a>
        <a href="#pricing" className="hover:underline">Pricing</a>
        <a href="/sign-in" className="hover:underline">Login</a>
        <a href="/sign-up" className="hover:underline">Sign Up</a>
        <div className="inline-block w-8 h-8 bg-gray-300 rounded-full" />
      </div>
    </nav>
  );
} 
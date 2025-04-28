"use client";

export default function BulkUpload() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 relative">
      <div className="absolute -top-2 right-4 bg-[#2DD4BF] text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
        Coming Soon
      </div>
      <h2 className="text-xl font-bold text-[#1F2937] mb-4">Bulk Upload</h2>
      <p className="text-sm text-gray-600 mb-4">Analyze multiple competitor products at once by uploading a CSV file.</p>
      
      <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center bg-gray-50">
        <span className="text-4xl text-gray-400 mb-2 block">☁️</span>
        <p className="text-sm text-gray-600 mb-2">Drag and drop your CSV file here, or</p>
        <button className="text-gray-400 font-medium cursor-not-allowed">browse files</button>
      </div>
      
      <button className="w-full mt-4 border border-gray-300 text-gray-400 py-2 px-4 rounded-md font-medium cursor-not-allowed">
        Upload CSV
      </button>
      
      <span className="block text-center text-sm text-gray-400 mt-2 cursor-not-allowed">Download template</span>
      <p className="text-xs text-center text-gray-500 mt-3">Bulk upload functionality will be available in the next update</p>
    </div>
  );
}

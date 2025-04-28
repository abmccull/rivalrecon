import React from "react";
// Ensure AlertTriangle is imported from lucide-react for error icon
import { AlertTriangle } from "lucide-react";

// Define the props interface explicitly
export interface AnalysisErrorProps {
  message: string;
}

/**
 * Component to display an error message within the analysis dashboard context.
 * It is also suitable for use within error boundaries.
 */
export function AnalysisError({ message }: AnalysisErrorProps): React.ReactElement {
  // Log the error message for debugging
  console.error("[AnalysisError] Rendered with message:", message);
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-background p-8 text-center">
      <div className="max-w-md rounded-lg border border-destructive bg-card p-6 shadow-lg">
        <h2 className="mb-3 text-xl font-semibold text-destructive">Analysis Error</h2>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <p className="text-muted-foreground">{message}</p>
        </div>
        {/* Optional: Add a button to retry or go back */}
        {/* <button className="mt-4 ...">Retry</button> */}
      </div>
    </div>
  );
}

// Export as default as well for flexibility
export default AnalysisError;

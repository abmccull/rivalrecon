import { PlotData as OriginalPlotData } from 'plotly.js';

// Augment the PlotData interface to support additional types
declare module 'plotly.js' {
  interface PlotData extends OriginalPlotData {
    type: string; // Allow any string for type instead of restricted string literals
    mode?: string;
    gauge?: {
      axis?: {
        range?: number[];
        tickwidth?: number;
        tickcolor?: string;
      };
      bar?: {
        color?: string;
      };
      bgcolor?: string;
      borderwidth?: number;
      bordercolor?: string;
      steps?: Array<{
        range: number[];
        color: string;
      }>;
      threshold?: {
        line?: {
          color?: string;
          width?: number;
        };
        thickness?: number;
        value?: number;
      };
    };
  }
} 
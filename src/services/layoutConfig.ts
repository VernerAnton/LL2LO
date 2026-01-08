// Layout configuration for 4-up candidate slides
// All measurements in INCHES (PptxGenJS standard)

export interface LayoutSlot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayoutConfig {
  slots: LayoutSlot[];
  colors: {
    name: string;
    role: string;
    experience: string;
    education: string;
  };
  fonts: {
    name: number;
    role: number;
    experience: number;
    education: number;
  };
}

// Coordinates measured from 4-up template
// Layout: 2x2 grid (Top-Left, Top-Right, Bottom-Left, Bottom-Right)
export const layoutConfig: LayoutConfig = {
  slots: [
    { x: 0.748, y: 0.689, w: 3.945, h: 1.299 }, // Top-Left
    { x: 4.811, y: 0.689, w: 5.177, h: 1.299 }, // Top-Right
    { x: 0.748, y: 1.988, w: 3.945, h: 1.299 }, // Bottom-Left
    { x: 4.811, y: 1.988, w: 5.177, h: 1.299 }  // Bottom-Right
  ],
  colors: {
    name: '1F2937',      // Dark Gray - Candidate name
    role: '4B5563',      // Medium Gray - Current role
    experience: '6B7280',// Light Gray - Work history
    education: '9CA3AF'  // Lighter Gray - Education
  },
  fonts: {
    name: 12,
    role: 10,
    experience: 9,
    education: 8
  }
};

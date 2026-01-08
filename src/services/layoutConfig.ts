// Layout configuration for 4-up candidate slides
// All measurements in INCHES (PptxGenJS standard)
// Layout: 2 columns (Education left, Name/Work right) × 4 rows (candidates)

export interface LayoutBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CandidateSlot {
  education: LayoutBox;  // Left column
  experience: LayoutBox; // Right column (Name + Role + Work History)
}

export interface LayoutConfig {
  slots: CandidateSlot[];
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

// Coordinates converted from cm to inches (1 cm = 0.3937007874 in)
// Education column: x=0.7480, w=3.9449
// Experience column: x=4.8110, w=5.1772
// 4 rows with uniform height: h=1.2992
export const layoutConfig: LayoutConfig = {
  slots: [
    // Candidate 1 (Row 1)
    {
      education: { x: 0.7480, y: 0.6890, w: 3.9449, h: 1.2992 },
      experience: { x: 4.8110, y: 0.6890, w: 5.1772, h: 1.2992 }
    },
    // Candidate 2 (Row 2)
    {
      education: { x: 0.7480, y: 1.9882, w: 3.9449, h: 1.2992 },
      experience: { x: 4.8110, y: 1.9882, w: 5.1772, h: 1.2992 }
    },
    // Candidate 3 (Row 3)
    {
      education: { x: 0.7480, y: 3.2874, w: 3.9449, h: 1.2992 },
      experience: { x: 4.8110, y: 3.2874, w: 5.1772, h: 1.2992 }
    },
    // Candidate 4 (Row 4)
    {
      education: { x: 0.7480, y: 4.5866, w: 3.9449, h: 1.2992 },
      experience: { x: 4.8110, y: 4.5866, w: 5.1772, h: 1.2992 }
    }
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

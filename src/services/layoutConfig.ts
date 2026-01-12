// Layout configuration for 4-up candidate slides
// All measurements in INCHES (PptxGenJS standard)
// Converted from User CM: X1=1.63, X2=12.22, Y=[1.98, 6.12, 10.4, 14.97]

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

export const layoutConfig: LayoutConfig = {
  slots: [
    // Candidate 1 (Row 1) - Y: 1.98cm
    {
      education: { x: 0.64, y: 0.78, w: 3.94, h: 1.55 },
      experience: { x: 4.81, y: 0.78, w: 5.18, h: 1.55 }
    },
    // Candidate 2 (Row 2) - Y: 6.12cm
    {
      education: { x: 0.64, y: 2.41, w: 3.94, h: 1.55 },
      experience: { x: 4.81, y: 2.41, w: 5.18, h: 1.55 }
    },
    // Candidate 3 (Row 3) - Y: 10.4cm
    {
      education: { x: 0.64, y: 4.09, w: 3.94, h: 1.55 },
      experience: { x: 4.81, y: 4.09, w: 5.18, h: 1.55 }
    },
    // Candidate 4 (Row 4) - Y: 14.97cm
    {
      education: { x: 0.64, y: 5.89, w: 3.94, h: 1.55 },
      experience: { x: 4.81, y: 5.89, w: 5.18, h: 1.55 }
    }
  ],
  colors: {
    name: '000000',      // Black - Candidate name
    role: '000000',      // Black - Current role
    experience: '000000',// Black - Work history
    education: '000000'  // Black - Education
  },
  fonts: {
    name: 13,          // Name (bold, caps)
    role: 10,          // Not actively used
    experience: 10,    // Bullets
    education: 10      // Education text
  }
};

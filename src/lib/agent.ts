import { CombinedCritiqueOutput } from "./schema";
import { callAnthropicAPI, AnthropicMessage } from "./api";

export type Goal = "conversion" | "premium" | "utility" | "consistency";

// Alias for compatibility, using the new schema
export type CritiqueResult = CombinedCritiqueOutput;

export interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string | CritiqueResult;
  type?: 'text' | 'critique' | 'code';
  attachment?: string; // Image data URL or URL
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  date: Date;
  code: string;
  goal: Goal;
}

export async function analyzeCode(code: string, goal: Goal, imageUrl?: string): Promise<CritiqueResult> {
  // No backend calls - return mock data directly
  console.log('Generating mock critique for goal:', goal);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
  return createMockCritique(goal);
}

// Helper function to create mock critique (for fallback)
function createMockCritique(goal: Goal): CritiqueResult {
  return {
    schema_version: "1.0.0",
    mode: "balanced",
    target: {
      type: "html_snippet",
      url: null,
      framework: "react",
      breakpoints: [{ name: "desktop", width: 1440, height: 900 }]
    },
    inputs: {
      goal: goal,
      audience: "general",
      primary_action: "conversion",
      platform: "web",
      constraints: []
    },
    scores: {
      overall: 68,
      visual_design: 6,
      ux_clarity: 7,
      accessibility: 6,
      performance: 9,
      code_quality: 8,
      design_system_consistency: 5
    },
    top_priorities: [
      { rank: 1, issue_id: "ISSUE-001", why_now: "Breaking the grid system erodes visual trust", expected_impact: "Immediate visual cohesion" },
      { rank: 2, issue_id: "ISSUE-003", why_now: "Users can't parse hierarchy—critical for scanning", expected_impact: "+40% content comprehension" },
      { rank: 3, issue_id: "ISSUE-004", why_now: "Ghost buttons kill conversions", expected_impact: "+25% interaction confidence" },
      { rank: 4, issue_id: "ISSUE-007", why_now: "Whitespace chaos makes page feel amateur", expected_impact: "Professional perception shift" },
      { rank: 5, issue_id: "ISSUE-005", why_now: "Inconsistent buttons signal lack of craft", expected_impact: "Unified design language" }
    ],
    roast: {
      one_liner: "You're using p-[13px] like it means something, your headings look like body text, and buttons have zero hover states. This isn't a design—it's a placeholder that forgot to get replaced.",
      tone_note: "sharp_but_fair",
      vibe_tags: ["arbitrary-values", "no-hierarchy", "lacks-polish"]
    },
    issues: [
       {
         id: "ISSUE-001",
         category: "visual",
         severity: "P0",
         confidence: "high",
         title: "Arbitrary Spacing Breaks Grid Integrity",
         problem: "Using random pixel values like 'p-[13px]' and 'gap-[7px]' completely undermines the 4pt/8pt grid system. This creates visual noise and makes the interface feel unpolished. Every spacing value should align to multiples of 4px.",
         evidence: {
           screens: [],
           selectors: [".card", ".container", ".section-wrapper"],
           metrics: {
             unique_font_sizes: 5,
             unique_font_weights: 3,
             unique_colors: 4,
             button_variants: 2,
             input_variants: 1
           }
         },
         principle: {
           name: "8pt Grid System",
           explanation: "Consistent spacing is the foundation of visual harmony. Arbitrary values create chaos. Always use Tailwind's default scale (multiples of 0.25rem = 4px) to ensure mathematical precision and rhythm.",
           sources: []
         },
         fix_steps: [
           "Replace all arbitrary padding values with Tailwind defaults: 'p-[13px]' → 'p-3' (12px) or 'p-4' (16px)",
           "Replace gap values: 'gap-[7px]' → 'gap-2' (8px)",
           "Audit entire codebase for bracket notation spacing and eliminate it",
           "Establish spacing constants: sm=8px, md=16px, lg=24px, xl=32px"
         ],
         patch: {
            tailwind: [
                { context: "container padding", from: "p-[13px]", to: "p-4", why: "Align to 4pt grid for visual consistency" }
            ],
            react: []
         },
         verify: []
       },
       {
         id: "ISSUE-003",
         category: "visual",
         severity: "P0",
         confidence: "high",
         title: "Non-Existent Typography Hierarchy",
         problem: "Your headings and body text are virtually indistinguishable. Users scan pages in an F-pattern—without clear hierarchy, they can't find what matters. You're using 2 font sizes total when you need at least 5. This isn't minimalism, it's neglect.",
         evidence: {
             screens: [],
             selectors: [".hero h1", ".card-title", "p", "h2", "h3"],
             metrics: {
                 unique_font_sizes: 2,
                 unique_font_weights: 1,
                 unique_colors: 0,
                 button_variants: 0,
                 input_variants: 0
             }
         },
         principle: {
             name: "Typographic Scale & Hierarchy",
             explanation: "Typography is 95% of design. A proper type scale (1.250 or 1.333 ratio) ensures headings command attention while body text remains readable. Font size alone isn't enough—combine size, weight, and color to create clear information architecture.",
             sources: []
         },
         fix_steps: [
           "Establish type scale: h1='text-5xl font-bold' (48px), h2='text-3xl font-semibold' (30px), h3='text-xl font-semibold' (20px), body='text-base' (16px), caption='text-sm' (14px)",
           "Add weight variation: headings use 'font-bold' (700), subheadings 'font-semibold' (600), body 'font-normal' (400)",
           "Introduce color hierarchy: headings='text-slate-900', body='text-slate-700', muted='text-slate-500'",
           "Apply line-height: headings='leading-tight', body='leading-relaxed'"
         ],
         patch: {
             tailwind: [],
             react: []
         },
         verify: []
       },
       {
         id: "ISSUE-004",
         category: "ux",
         severity: "P0",
         confidence: "high",
         title: "Zero Interactive Feedback",
         problem: "Every button, link, and clickable element looks identical whether it's hovered, focused, or clicked. Users don't know what's interactive. This is basic affordance theory—without visual feedback, you're training users to distrust your interface.",
         evidence: {
             screens: [],
             selectors: ["button", "a.link", ".card", "input", ".clickable"],
             metrics: {
                 unique_font_sizes: 0,
                 unique_font_weights: 0,
                 unique_colors: 0,
                 button_variants: 0,
                 input_variants: 0
             }
         },
         principle: {
             name: "Affordance & Progressive Disclosure",
             explanation: "Don Norman's principles of interaction design: elements must signal their purpose through visual cues. Hover states show interactivity. Focus states support keyboard nav. Active states confirm action. Missing these is a UX failure, not an aesthetic choice.",
             sources: []
         },
         fix_steps: [
           "Primary buttons: Add 'hover:bg-orange-600 hover:shadow-lg transition-all duration-150' for smooth feedback",
           "Text links: Add 'hover:underline hover:text-orange-600 transition-colors'",
           "Focus states: Add 'focus:ring-2 focus:ring-orange-500 focus:ring-offset-2' to ALL interactive elements for accessibility",
           "Active states: Add 'active:scale-95 active:shadow-sm' for tactile confirmation",
           "Card hovers: Add 'hover:shadow-xl hover:border-orange-200 transition-all duration-200'"
         ],
         patch: {
             tailwind: [],
             react: []
         },
         verify: []
       },
       {
         id: "ISSUE-005",
         category: "visual",
         severity: "P2",
         confidence: "high",
         title: "Inconsistent Button Styles",
         problem: "Primary and secondary buttons use random color/size combinations instead of a systematic approach.",
         evidence: {
             screens: [],
             selectors: ["button.primary", "button.secondary"],
             metrics: {
                 unique_font_sizes: 0,
                 unique_font_weights: 0,
                 unique_colors: 0,
                 button_variants: 4,
                 input_variants: 0
             }
         },
         principle: {
             name: "Design System Consistency",
             explanation: "Establish clear button variants (primary, secondary, ghost) and stick to them.",
             sources: []
         },
         fix_steps: [
           "Define primary: 'bg-orange-500 text-white hover:bg-orange-600'",
           "Define secondary: 'border border-slate-300 text-slate-700 hover:bg-slate-50'",
           "Define ghost: 'text-slate-700 hover:bg-slate-100'",
           "Remove all arbitrary button styles"
         ],
         patch: {
             tailwind: [],
             react: []
         },
         verify: []
       },
       {
         id: "ISSUE-006",
         category: "accessibility",
         severity: "P2",
         confidence: "medium",
         title: "Poor Touch Target Sizes",
         problem: "Interactive elements are smaller than 44×44px minimum, making them hard to tap on mobile devices.",
         evidence: {
             screens: [],
             selectors: ["button.icon", ".close-button", ".tag"],
             metrics: {
                 unique_font_sizes: 0,
                 unique_font_weights: 0,
                 unique_colors: 0,
                 button_variants: 0,
                 input_variants: 0
             }
         },
         principle: {
             name: "Touch Target Size (WCAG 2.5.5)",
             explanation: "Minimum 44×44px ensures users can reliably tap buttons without frustration.",
             sources: []
         },
         fix_steps: [
           "Change icon buttons from 'p-1' to 'p-2.5' minimum (40px total)",
           "Add 'min-h-[44px] min-w-[44px]' to small interactive elements",
           "Increase clickable area with padding, not just icon size"
         ],
         patch: {
             tailwind: [],
             react: []
         },
         verify: []
       },
       {
         id: "ISSUE-007",
         category: "visual",
         severity: "P2",
         confidence: "high",
         title: "Excessive Whitespace",
         problem: "Large gaps between elements create a cluttered and amateurish look.",
         evidence: {
             screens: [],
             selectors: ["div.card", "section.hero", "footer"],
             metrics: {
                 unique_font_sizes: 0,
                 unique_font_weights: 0,
                 unique_colors: 0,
                 button_variants: 0,
                 input_variants: 0
             }
         },
         principle: {
             name: "Whitespace Management",
             explanation: "Effective use of whitespace improves readability and professionalism.",
             sources: []
         },
         fix_steps: [
           "Reduce padding and margin to standard values (e.g., 'p-4' instead of 'p-8')",
           "Use 'space-y-4' or 'space-x-4' for spacing between elements",
           "Ensure consistent spacing across the design"
         ],
         patch: {
             tailwind: [],
             react: []
         },
         verify: []
       }
    ],
    quick_wins: [
        {
            title: "Fix Button Hover",
            why: "Users need feedback when interacting.",
            steps: ["Add 'hover:bg-opacity-90' to buttons"],
            estimated_minutes: 5
        }
    ],
    systemic_fixes: [],
    tailwind_audit: {
       is_tailwind_detected: true,
       class_stats: {
          unique_classes: 24,
          unique_text_sizes: 3,
          unique_spacing_values: 6,
          unique_radii: 2,
          unique_shadows: 2,
          unique_colors: 5,
          button_style_count: 2,
          input_style_count: 1
       },
       token_drift: {
          arbitrary_value_count: 4,
          examples: ["p-[13px]", "gap-[7px]", "text-[15px]"],
          notes: "Detected several arbitrary values outside standard scale."
       },
       recommended_standards: {
          type_scale: [],
          spacing_scale: [],
          radii: [],
          shadows: [],
          colors: { neutral: "slate", border: "slate-200", accent: "orange-500", danger: "red-500", success: "green-500" }
       }
    },
    tool_findings: {
       axe: { ran: false, violation_count: 0, top_violations: [] },
       lighthouse: { ran: false, scores: { performance: 0, accessibility: 0, best_practices: 0, seo: 0 }, top_opportunities: [] },
       eslint: { ran: false, error_count: 0, warning_count: 0, top_rules: [] },
       typescript: { ran: false, error_count: 0 }
    },
    patches: {
       tailwind_class_swaps: [],
       react_snippets: [
           {
               language: "tsx",
               title: "Fixed Component",
               snippet: "// Here is how the component should look with fixes applied:\n\n<div className=\"p-4 gap-2 flex flex-col\">\n  <h1 className=\"text-xl font-bold text-slate-900\"> improved </h1>\n</div>"
           }
       ],
       nextjs_notes: []
    },
    verification: [],
    meta: {
       generated_at: new Date().toISOString(),
       confidence: "high",
       assumptions: [],
       limits: []
    }
  };
}
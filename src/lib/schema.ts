export interface CombinedCritiqueOutput {
  schema_version: "1.0.0";
  mode: "balanced" | "visual_first" | "code_first" | "roast_light" | "roast_hard";
  target: {
    type: "url" | "html_snippet" | "repo" | "mixed";
    url: string | null;
    framework: "nextjs" | "react" | "html" | "mixed" | "unknown";
    breakpoints: Array<{
      name: "mobile" | "tablet" | "desktop" | "xl";
      width: number;
      height: number;
    }>;
  };
  inputs: {
    goal: string;
    audience: string;
    primary_action: string;
    platform: "web" | "mobile_web" | "desktop_web" | "unknown";
    constraints: string[];
  };
  scores: {
    overall: number;
    visual_design: number;
    ux_clarity: number;
    accessibility: number;
    performance: number;
    code_quality: number;
    design_system_consistency: number;
  };
  top_priorities: Array<{
    rank: 1 | 2 | 3;
    issue_id: string;
    why_now: string;
    expected_impact: string;
  }>;
  roast: {
    one_liner: string;
    tone_note: "supportive" | "blunt" | "sharp_but_fair";
    vibe_tags: string[];
  };
  issues: Array<{
    id: string;
    category: "visual" | "ux" | "accessibility" | "performance" | "maintainability" | "react_next" | "tailwind";
    severity: "P0" | "P1" | "P2";
    confidence: "high" | "medium" | "low";
    title: string;
    problem: string;
    evidence: {
      screens: Array<{
        id: string;
        breakpoint: "mobile" | "tablet" | "desktop" | "xl";
        path?: string | null;
      }>;
      selectors: string[];
      metrics: {
        unique_font_sizes: number;
        unique_font_weights: number;
        unique_colors: number;
        button_variants: number;
        input_variants: number;
        lcp_ms?: number | null;
        cls?: number | null;
        axe_violations?: number | null;
      };
      notes?: string;
    };
    principle: {
      name: string;
      explanation: string;
      sources: Array<{
        type: "design_system" | "heuristic" | "a11y" | "internal_rule";
        label: string;
        locator?: string | null;
      }>;
    };
    fix_steps: string[];
    patch: {
      tailwind: Array<{
        context: string;
        from: string;
        to: string;
        why: string;
      }>;
      react: Array<{
        language: "tsx" | "ts" | "jsx" | "js" | "css" | "html";
        title: string;
        snippet: string;
      }>;
    };
    verify: Array<{
      step: string;
      expected: string;
    }>;
  }>;
  quick_wins: Array<{
    title: string;
    why: string;
    steps: string[];
    estimated_minutes: number;
  }>;
  systemic_fixes: Array<{
    title: string;
    problem: string;
    recommendation: string;
    policy: string[];
  }>;
  tailwind_audit: {
    is_tailwind_detected: boolean;
    class_stats: {
      unique_classes: number;
      unique_text_sizes: number;
      unique_spacing_values: number;
      unique_radii: number;
      unique_shadows: number;
      unique_colors: number;
      button_style_count: number;
      input_style_count: number;
    };
    token_drift: {
      arbitrary_value_count: number;
      examples: string[];
      notes: string;
    };
    recommended_standards: {
      type_scale: Array<{
        name: "h1" | "h2" | "h3" | "body" | "caption" | "overline";
        tailwind: string;
        line_height: string;
      }>;
      spacing_scale: string[];
      radii: string[];
      shadows: string[];
      colors: {
        neutral: string;
        border: string;
        accent: string;
        danger: string;
        success: string;
      };
    };
  };
  tool_findings: {
    axe: {
      ran: boolean;
      violation_count: number;
      top_violations: Array<{
        id: string;
        impact: "minor" | "moderate" | "serious" | "critical";
        count: number;
        example_selectors: string[];
      }>;
    };
    lighthouse: {
      ran: boolean;
      scores: {
        performance: number;
        accessibility: number;
        best_practices: number;
        seo: number;
      };
      top_opportunities: Array<{
        id: string;
        title: string;
        savings_ms?: number | null;
      }>;
    };
    eslint: {
      ran: boolean;
      error_count: number;
      warning_count: number;
      top_rules: Array<{
        rule: string;
        count: number;
      }>;
    };
    typescript: {
      ran: boolean;
      error_count: number;
    };
  };
  patches: {
    tailwind_class_swaps: Array<{
      context: string;
      from: string;
      to: string;
      why: string;
    }>;
    react_snippets: Array<{
      language: "tsx" | "ts" | "jsx" | "js" | "css" | "html";
      title: string;
      snippet: string;
    }>;
    nextjs_notes: string[];
  };
  verification: Array<{
    step: string;
    expected: string;
  }>;
  meta: {
    generated_at: string;
    confidence: "high" | "medium" | "low";
    assumptions: string[];
    limits: string[];
  };
}

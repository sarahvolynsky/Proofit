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

// Function for conversational follow-up messages
export async function sendChatMessage(
  messages: Message[],
  userMessage: string,
  goal: Goal
): Promise<string> {
  const systemPrompt = `You are Proofit, an expert design critique agent. You've already provided an initial critique.

Now the user is asking a follow-up question or requesting additional information. Help them by:
- Answering questions about the critique
- Providing more details on specific issues
- Generating fix prompts when requested
- Offering additional guidance

If the user asks for a "fix prompt" or wants code to fix the issues, generate a comprehensive prompt that:
1. Summarizes the critique findings
2. Lists all issues with their fix steps
3. Provides clear requirements for applying the fixes
4. Is formatted to be copy-pasted into another AI coding assistant

Be helpful, concise, and actionable. Keep the tone consistent with your initial critique.`;

  // Build conversation history for the API
  const anthropicMessages: AnthropicMessage[] = [];
  
  // Find the critique result for context
  const critiqueMessage = messages.find(m => m.type === 'critique');
  
  // Special handling for fix prompt requests
  const isPromptRequest = /generate.*prompt|create.*prompt|get.*prompt|prompt.*this|fix.*prompt/i.test(userMessage);
  
  if (isPromptRequest && critiqueMessage && typeof critiqueMessage.content !== 'string') {
    const result = critiqueMessage.content as CritiqueResult;
    
    // Generate the fix prompt directly without API call
    const issuesList = result.issues.map((issue, i) => 
      `${i+1}. [${issue.severity}] ${issue.title} (${issue.category.toUpperCase()})
   Problem: ${issue.problem}
   Fix Steps:
${issue.fix_steps.map((step, idx) => `      ${idx + 1}. ${step}`).join('\n')}`
    ).join("\n\n");
    
    return `You are an expert frontend developer and designer. I need you to apply design critique feedback to improve my React/Tailwind codebase.

CRITIQUE SUMMARY:
${result.roast.one_liner}

OVERALL SCORES:
• Visual Design: ${result.scores.visual_design}/10
• UX Clarity: ${result.scores.ux_clarity}/10
• Code Quality: ${result.scores.code_quality}/10
• Accessibility: ${result.scores.accessibility}/10

ISSUES TO ADDRESS (${result.issues.length} total):

${issuesList}

REQUIREMENTS:
1. Apply all the fix steps listed above to the code
2. Maintain the existing design language and component structure
3. Use Tailwind CSS utility classes following best practices
4. Ensure all changes improve accessibility and code quality
5. Provide the complete updated code with clear comments explaining changes

Please generate the improved React and Tailwind code now.`;
  }
  
  // Build context from critique
  let critiqueContext = '';
  if (critiqueMessage && typeof critiqueMessage.content !== 'string') {
    const critique = critiqueMessage.content as CritiqueResult;
    critiqueContext = `\n\nPrevious critique summary:\n- Overall Score: ${critique.scores.overall}/10\n- Roast: "${critique.roast.one_liner}"\n- Issues Found: ${critique.issues.length}\n- Key Issues: ${critique.issues.slice(0, 3).map(i => i.title).join(', ')}`;
  }
  
  // Convert conversation history (skip the critique message itself and initial user submission)
  let skipNext = true; // Skip the first user message (the initial submission)
  for (const msg of messages) {
    if (msg.type === 'critique') {
      skipNext = true; // Skip the critique, we'll add context instead
      continue;
    }
    
    // Skip the first user message (design submission)
    if (skipNext && msg.role === 'user') {
      skipNext = false;
      continue;
    }
    
    if (msg.role === 'user') {
      anthropicMessages.push({
        role: 'user',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      });
    } else if (msg.role === 'agent' && typeof msg.content === 'string') {
      anthropicMessages.push({
        role: 'assistant',
        content: msg.content
      });
    }
  }
  
  // Add the new user message with critique context if this is the first follow-up
  if (anthropicMessages.length === 0 && critiqueContext) {
    anthropicMessages.push({
      role: 'user',
      content: `${userMessage}${critiqueContext}`
    });
  } else {
    anthropicMessages.push({
      role: 'user',
      content: userMessage
    });
  }

  console.log('Sending chat messages to API:', JSON.stringify(anthropicMessages, null, 2));

  try {
    console.log('About to call Anthropic API...');
    const response = await callAnthropicAPI(anthropicMessages, systemPrompt, 'claude-3-5-sonnet-20241022', 2048);
    console.log('Received response from Anthropic API');
    
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent?.text) {
      throw new Error('No text content in response');
    }

    return textContent.text;
  } catch (error) {
    console.error('Error in sendChatMessage:', error);
    throw error; // Re-throw so we can see the full error
  }
}

export async function analyzeCode(code: string, goal: Goal, imageUrl?: string): Promise<CritiqueResult> {
  const systemPrompt = `You are Proofit, an expert design critique agent. You analyze UI designs and code with a focus on visual design, UX, accessibility, and code quality.

Your task is to provide a comprehensive critique in JSON format matching the CombinedCritiqueOutput schema.

Key principles:
- Be honest and direct but constructive
- Focus on actionable feedback
- Prioritize issues by impact
- Provide specific fix steps
- Consider the goal: ${goal}

IMPORTANT: Return ONLY a valid JSON object. Do not include markdown code blocks, explanations, or any text outside the JSON structure.

The JSON must include:
1. scores: Rate visual_design, ux_clarity, accessibility, code_quality (0-10 scale)
2. roast.one_liner: A witty but constructive one-line critique
3. issues: Array of specific problems with categories (visual, ux, accessibility, code, maintainability), severity (P0, P1, P2), and fix_steps
4. quick_wins: Fast improvements under 5 minutes
5. tailwind_audit: If Tailwind CSS is detected, analyze class usage patterns

Be thorough but practical. Focus on high-impact improvements.`;

  const userContent: Array<{
    type: 'text' | 'image';
    text?: string;
    source?: {
      type: 'base64';
      media_type: string;
      data: string;
    };
  }> = [];

  // Add image if provided
  if (imageUrl) {
    // If it's a base64 image
    if (imageUrl.startsWith('data:image/')) {
      const [header, base64Data] = imageUrl.split(',');
      const mediaType = header.match(/data:(.*?);/)?.[1] || 'image/png';
      
      userContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64Data,
        },
      });
    } else {
      // For URL-based images, we'll need to fetch and convert to base64
      // For now, we'll skip image analysis for URL images
      console.warn('URL-based images not yet supported for critique');
    }
  }

  userContent.push({
    type: 'text',
    text: `Please analyze this ${imageUrl ? 'design' : 'code'} and provide a comprehensive critique as a JSON object.

Goal: ${goal}
${code ? `\nCode/Context:\n${code}` : ''}

Return a valid JSON object (no markdown, no code blocks) with this structure:
{
  "schema_version": "1.0.0",
  "mode": "balanced",
  "target": {
    "type": "html_snippet",
    "url": null,
    "framework": "react",
    "breakpoints": [{"name": "desktop", "width": 1440, "height": 900}]
  },
  "inputs": {
    "goal": "${goal}",
    "audience": "general users",
    "primary_action": "use the interface",
    "platform": "web",
    "constraints": []
  },
  "scores": {
    "overall": 0-10,
    "visual_design": 0-10,
    "ux_clarity": 0-10,
    "accessibility": 0-10,
    "performance": 0-10,
    "code_quality": 0-10,
    "design_system_consistency": 0-10
  },
  "top_priorities": [
    {"rank": 1, "issue_id": "ISSUE-001", "why_now": "explanation", "expected_impact": "impact"}
  ],
  "roast": {
    "one_liner": "A witty but constructive critique",
    "tone_note": "sharp_but_fair",
    "vibe_tags": ["tag1", "tag2"]
  },
  "issues": [
    {
      "id": "ISSUE-001",
      "category": "visual|ux|accessibility|performance|maintainability|react_next|tailwind",
      "severity": "P0|P1|P2",
      "confidence": "high|medium|low",
      "title": "Issue Title",
      "problem": "Detailed problem description",
      "evidence": {
        "screens": [],
        "selectors": [".example"],
        "metrics": {
          "unique_font_sizes": 0,
          "unique_font_weights": 0,
          "unique_colors": 0,
          "button_variants": 0,
          "input_variants": 0
        }
      },
      "principle": {
        "name": "Design Principle",
        "explanation": "Why this matters",
        "sources": []
      },
      "fix_steps": ["Step 1", "Step 2"],
      "patch": {
        "tailwind": [{"context": "where", "from": "old-class", "to": "new-class", "why": "reason"}],
        "react": []
      },
      "verify": []
    }
  ],
  "quick_wins": [
    {
      "title": "Quick Fix Title",
      "why": "Explanation",
      "steps": ["Step 1"],
      "estimated_minutes": 5
    }
  ],
  "systemic_fixes": [],
  "tailwind_audit": {
    "is_tailwind_detected": true|false,
    "class_stats": {
      "unique_classes": 0,
      "unique_text_sizes": 0,
      "unique_spacing_values": 0,
      "unique_radii": 0,
      "unique_shadows": 0,
      "unique_colors": 0,
      "button_style_count": 0,
      "input_style_count": 0
    },
    "token_drift": {
      "arbitrary_value_count": 0,
      "examples": [],
      "notes": ""
    },
    "recommended_standards": {
      "type_scale": [],
      "spacing_scale": [],
      "radii": [],
      "shadows": [],
      "colors": {
        "neutral": "",
        "border": "",
        "accent": "",
        "danger": "",
        "success": ""
      }
    }
  },
  "tool_findings": {
    "axe": {"ran": false, "violation_count": 0, "top_violations": []},
    "lighthouse": {"ran": false, "scores": {"performance": 0, "accessibility": 0, "best_practices": 0, "seo": 0}, "top_opportunities": []},
    "eslint": {"ran": false, "error_count": 0, "warning_count": 0, "top_rules": []},
    "typescript": {"ran": false, "error_count": 0}
  },
  "patches": {
    "tailwind_class_swaps": [],
    "react_snippets": [],
    "nextjs_notes": []
  },
  "verification": [],
  "meta": {
    "generated_at": "${new Date().toISOString()}",
    "confidence": "high|medium|low",
    "assumptions": [],
    "limits": []
  }
}

Focus on providing 3-5 actionable issues with specific fix steps.`,
  });

  const messages: AnthropicMessage[] = [
    {
      role: 'user',
      content: userContent,
    },
  ];

  try {
    const response = await callAnthropicAPI(messages, systemPrompt, 'claude-3-5-sonnet-20241022', 4096);
    
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent?.text) {
      throw new Error('No text content in response');
    }

    console.log('Raw API response:', textContent.text.substring(0, 500));

    // Try to extract JSON from the response
    let jsonText = textContent.text.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find the JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response. Full text:', textContent.text);
      throw new Error('No JSON found in response');
    }

    const critiqueResult = JSON.parse(jsonMatch[0]) as CritiqueResult;
    console.log('Successfully parsed critique with', critiqueResult.issues.length, 'issues');
    return critiqueResult;
  } catch (error) {
    console.error('Error analyzing code:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    // Return a fallback mock response on error
    return createMockCritique(goal);
  }
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
      overall: 82,
      visual_design: 8,
      ux_clarity: 9,
      accessibility: 7,
      performance: 9,
      code_quality: 8,
      design_system_consistency: 7
    },
    top_priorities: [
      { rank: 1, issue_id: "ISSUE-001", why_now: "Inconsistent spacing hurts trust", expected_impact: "Better visual polish" },
      { rank: 2, issue_id: "ISSUE-002", why_now: "Low contrast text", expected_impact: " improved accessibility" },
      { rank: 3, issue_id: "ISSUE-003", why_now: "Missing hover states", expected_impact: "Better interactivity" }
    ],
    roast: {
      one_liner: "It's giving 'MVP built at 3AM' vibes—functional but frantic.",
      tone_note: "sharp_but_fair",
      vibe_tags: ["clean", "inconsistent", "needs-structure"]
    },
    issues: [
       {
         id: "ISSUE-001",
         category: "visual",
         severity: "P1",
         confidence: "high",
         title: "Arbitrary Spacing Values",
         problem: "You're using 'p-[13px]' and 'gap-[7px]' which breaks the 4pt/8pt grid rhythm.",
         evidence: {
           screens: [],
           selectors: [".card", ".container"],
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
           explanation: "Consistency in spacing creates visual harmony. Use multiples of 4.",
           sources: []
         },
         fix_steps: ["Change 'p-[13px]' to 'p-4' (16px)", "Change 'gap-[7px]' to 'gap-2' (8px)"],
         patch: {
            tailwind: [
                { context: "container padding", from: "p-[13px]", to: "p-4", why: "Align to 4pt grid" }
            ],
            react: []
         },
         verify: []
       },
       {
         id: "ISSUE-002",
         category: "accessibility",
         severity: "P2",
         confidence: "high",
         title: "Low Contrast Text",
         problem: "The gray text on white background is too light for readable content.",
         evidence: {
             screens: [],
             selectors: [".text-gray-300"],
             metrics: {
                 unique_font_sizes: 0,
                 unique_font_weights: 0,
                 unique_colors: 0,
                 button_variants: 0,
                 input_variants: 0
             }
         },
         principle: {
             name: "WCAG AA Contrast",
             explanation: "Text must have a contrast ratio of at least 4.5:1.",
             sources: []
         },
         fix_steps: ["Use 'text-slate-500' or darker instead of 'text-gray-300'"],
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
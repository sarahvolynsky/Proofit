export interface DesignPattern {
  id: string;
  title: string;
  category: "Layout" | "Navigation" | "Forms" | "Content" | "Feedback" | "SEO";
  description: string;
  principle: string;
  example: string;
  tags: string[];
}

export const designPatterns: DesignPattern[] = [
  {
    id: "1",
    title: "Visual Hierarchy",
    category: "Layout",
    description: "Use size, weight, and color to guide user attention to the most important elements first.",
    principle: "The eye naturally follows contrast and size differences to understand information priority.",
    example: "Headlines should be larger and bolder than body text. Primary CTAs should stand out with color and size.",
    tags: ["typography", "spacing", "contrast", "visual design"]
  },
  {
    id: "2",
    title: "Consistent Spacing",
    category: "Layout",
    description: "Stick to a 4pt or 8pt grid system for all spacing, padding, and margins.",
    principle: "Consistency creates visual harmony and makes designs feel intentional and professional.",
    example: "Use Tailwind's default spacing scale: p-2 (8px), p-4 (16px), p-6 (24px), p-8 (32px)",
    tags: ["spacing", "grid", "rhythm", "visual design"]
  },
  {
    id: "3",
    title: "Progressive Disclosure",
    category: "Navigation",
    description: "Show only essential information initially, reveal complexity as needed.",
    principle: "Reduces cognitive load and prevents overwhelming users with too many options.",
    example: "Use accordions, tabs, or expandable sections to hide secondary information until requested.",
    tags: ["ux", "simplicity", "navigation", "ux clarity"]
  },
  {
    id: "4",
    title: "Accessible Contrast",
    category: "Content",
    description: "Ensure text has at least 4.5:1 contrast ratio against backgrounds (WCAG AA).",
    principle: "Good contrast ensures readability for users with visual impairments and in varying lighting.",
    example: "Use text-slate-700 or darker for body text on white backgrounds, not text-gray-300.",
    tags: ["accessibility", "contrast", "wcag", "color"]
  },
  {
    id: "5",
    title: "Clear Call-to-Action",
    category: "Forms",
    description: "Make primary actions visually distinct and easy to locate.",
    principle: "Users should never have to search for how to proceed to the next step.",
    example: "Use high-contrast buttons with clear labels. Primary buttons should be filled, secondary outlined.",
    tags: ["conversion", "buttons", "hierarchy", "ux clarity"]
  },
  {
    id: "6",
    title: "Immediate Feedback",
    category: "Feedback",
    description: "Provide instant visual response to user interactions.",
    principle: "Feedback confirms that the system received the user's action and is processing it.",
    example: "Hover states on buttons, loading spinners on form submit, success/error messages after actions.",
    tags: ["interaction", "states", "ux", "ux clarity"]
  },
  {
    id: "7",
    title: "F-Pattern Reading",
    category: "Content",
    description: "Place important content along the top and left side where users naturally scan.",
    principle: "Eye-tracking studies show users scan in an F-shaped pattern on content-heavy pages.",
    example: "Put navigation and key info at the top, descriptive content on the left, CTAs in the path.",
    tags: ["layout", "scanning", "ux", "content"]
  },
  {
    id: "8",
    title: "Form Field Validation",
    category: "Forms",
    description: "Validate input as users type, not just on submit. Show helpful error messages.",
    principle: "Real-time feedback reduces frustration and helps users correct mistakes immediately.",
    example: "Show green checkmark for valid email, inline error for invalid password while typing.",
    tags: ["forms", "validation", "feedback", "ux clarity"]
  },
  {
    id: "9",
    title: "Semantic HTML Structure",
    category: "SEO",
    description: "Use proper HTML5 semantic tags to help search engines understand content hierarchy.",
    principle: "Search engines use semantic HTML to better index and rank your content.",
    example: "Use <header>, <nav>, <main>, <article>, <section>, <footer> instead of just <div>.",
    tags: ["seo", "html", "structure", "code quality"]
  },
  {
    id: "10",
    title: "Descriptive Meta Tags",
    category: "SEO",
    description: "Write compelling title tags (50-60 chars) and meta descriptions (150-160 chars).",
    principle: "Meta tags appear in search results and directly impact click-through rates.",
    example: "<title>Buy Running Shoes | Free Shipping | Nike</title> with unique descriptions per page.",
    tags: ["seo", "meta", "conversion"]
  },
  {
    id: "11",
    title: "Image Alt Text",
    category: "SEO",
    description: "Add descriptive alt text to all images for accessibility and SEO.",
    principle: "Alt text helps search engines index images and improves accessibility for screen readers.",
    example: "alt='Woman running in Nike Air Max sneakers on beach at sunrise' not alt='image1'.",
    tags: ["seo", "accessibility", "images"]
  },
  {
    id: "12",
    title: "Page Load Speed",
    category: "SEO",
    description: "Optimize images, minimize JavaScript, and use lazy loading to improve performance.",
    principle: "Google ranks faster sites higher. Users abandon pages that take >3 seconds to load.",
    example: "Use WebP images, code splitting, and CDN. Aim for <2s load time on 3G.",
    tags: ["seo", "performance", "speed", "code quality"]
  },
  {
    id: "13",
    title: "Mobile-First Responsive",
    category: "SEO",
    description: "Design for mobile first, then enhance for larger screens (mobile-first indexing).",
    principle: "Google primarily uses mobile version of content for indexing and ranking.",
    example: "Use responsive breakpoints: sm:, md:, lg: in Tailwind. Test on real devices.",
    tags: ["seo", "mobile", "responsive", "code quality"]
  },
  {
    id: "14",
    title: "Clean URL Structure",
    category: "SEO",
    description: "Use readable, keyword-rich URLs with proper hierarchy and hyphens.",
    principle: "Descriptive URLs help users and search engines understand page content before clicking.",
    example: "/products/running-shoes/nike-air-max not /product?id=12345&cat=7",
    tags: ["seo", "urls", "structure"]
  },
  {
    id: "15",
    title: "Heading Hierarchy",
    category: "SEO",
    description: "Use one H1 per page, then H2, H3 in logical order without skipping levels.",
    principle: "Proper heading structure helps search engines understand content organization.",
    example: "H1: 'Running Shoes Guide' → H2: 'Best for Marathon' → H3: 'Nike Air Zoom'",
    tags: ["seo", "headings", "structure", "accessibility"]
  },
  {
    id: "16",
    title: "Internal Linking",
    category: "SEO",
    description: "Link to related pages within your site to improve navigation and SEO.",
    principle: "Internal links help search engines discover pages and distribute page authority.",
    example: "In blog posts, link to related articles, product pages, or category pages with descriptive anchor text.",
    tags: ["seo", "links", "navigation"]
  }
];

// Helper function to suggest patterns based on issue categories and tags
export function getRelevantPatterns(issueTags: string[], limit = 3): DesignPattern[] {
  const normalizedTags = issueTags.map(tag => tag.toLowerCase());
  
  const scoredPatterns = designPatterns.map(pattern => {
    let score = 0;
    
    // Check if pattern tags match issue tags
    pattern.tags.forEach(tag => {
      if (normalizedTags.some(issueTag => 
        tag.includes(issueTag) || issueTag.includes(tag)
      )) {
        score += 2;
      }
    });
    
    // Check category matches
    if (normalizedTags.includes(pattern.category.toLowerCase())) {
      score += 1;
    }
    
    return { pattern, score };
  });
  
  // Sort by score and return top matches
  return scoredPatterns
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.pattern);
}

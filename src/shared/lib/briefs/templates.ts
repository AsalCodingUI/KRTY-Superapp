import type { BriefSection, BriefSet } from "./types"

/**
 * The base questions (from the studio's Notion brief and brand
 * questionnaire), in English: the client site speaks English, with
 * Google Translate for the rest. A new brief copies the sets it asks.
 */

const COMMON_START: BriefSection[] = [
  {
    id: "client",
    set: "common",
    title: "Client information & background",
    description:
      "We filled in what we already know. Please correct anything that's off.",
    team: true,
    questions: [
      { id: "client_name", type: "text", label: "Contact person" },
      {
        id: "client_contact",
        type: "text",
        label: "Email address / phone number",
      },
      { id: "client_location", type: "text", label: "Company location" },
      { id: "company_name", type: "text", label: "Company name" },
      {
        id: "existing_product",
        type: "text",
        label: "Existing website / product",
        example: "https://example.com",
        optional: true,
      },
      {
        id: "company_size",
        type: "single",
        label: "Company size",
        options: ["Startup", "Large company", "Government", "Freelancer"],
        other: true,
      },
    ],
  },
  {
    id: "goals",
    set: "common",
    title: "Objectives, goals & key competitors",
    questions: [
      {
        id: "needed",
        type: "multi",
        label: "What is needed",
        options: [
          "Redesign",
          "Create a new product",
          "Adding more pages / functions",
          "Building / managing a design system",
        ],
        other: true,
      },
      {
        id: "objective",
        type: "textarea",
        label: "Objective of the project",
        help: "Why is this needed now?",
        example:
          "To improve the user experience and update the visual appearance to be more modern.",
      },
      {
        id: "competitors",
        type: "textarea",
        label: "Competitors or references",
        help: "Links, and what they do well or poorly (where you can do better).",
        example:
          "[Website A]: fast and easy to use. [Website B]: modern, but the checkout is confusing.",
        optional: true,
      },
    ],
  },
]

const DESIGN: BriefSection[] = [
  {
    id: "design_scope",
    set: "design",
    title: "UI design: scope & style",
    questions: [
      {
        id: "design_scope",
        type: "multi",
        label: "Project scope",
        options: [
          "Website app dashboard",
          "Desktop app dashboard",
          "Mobile app design",
          "Website / landing page design",
          "POS design",
          "Social media design",
          "Pitch deck",
        ],
        other: true,
      },
      {
        id: "design_style",
        type: "textarea",
        label: "Desired design style",
        help: "References or examples of the style you want (links or images are welcome).",
        example:
          "Modern and professional design with friendly visual elements and pastel colors.",
      },
      {
        id: "design_features",
        type: "textarea",
        label: "Key features and short-term goals",
        example:
          "Online payment, quick ordering and order tracking, live within 3 months.",
      },
      {
        id: "design_pages",
        type: "textarea",
        label: "Pages or screens you need",
        example: "Homepage, product pages, checkout, account settings.",
        optional: true,
      },
      {
        id: "design_deliverables",
        type: "multi",
        label: "Expected final deliverables",
        options: ["UI design", "Mockup", "Prototype", "Figma file"],
        other: true,
      },
    ],
  },
]

const BRANDING: BriefSection[] = [
  {
    id: "brand_now",
    set: "branding",
    title: "Brand identity",
    questions: [
      {
        id: "brand_existing",
        type: "single",
        label: "Is there an existing branding / visual identity (logo, etc.)?",
        options: ["Yes", "No"],
      },
      {
        id: "brand_existing_files",
        type: "files",
        label: "Your current logo or brand guideline",
        help: "So we can see where you're starting from.",
        optional: true,
        showIf: { question: "brand_existing", is: ["Yes"] },
      },
      {
        id: "brand_change",
        type: "single",
        label: "What should happen to it?",
        options: [
          "Refresh it (keep its spirit)",
          "Full rebrand (start over)",
          "Not sure yet",
        ],
        showIf: { question: "brand_existing", is: ["Yes"] },
      },
      {
        id: "logo_reason",
        type: "textarea",
        label: "Why change it now?",
        example:
          "We're expanding internationally and need a logo that feels more premium but still approachable.",
        showIf: { question: "brand_existing", is: ["Yes"] },
      },
      {
        id: "brand_about",
        type: "textarea",
        label: "How would you describe your company in 1 or 2 sentences?",
        help: "What do you do, and what should people remember you for?",
        example:
          "We're a boutique coffee shop that focuses on community, quality brews, and cozy experiences.",
      },
      {
        id: "brand_keywords",
        type: "text",
        label: "What keywords describe your brand best?",
        help: "3–5 words for its vibe, personality or values.",
        example: "Friendly, premium, sustainable, fresh, approachable.",
      },
      {
        id: "brand_different",
        type: "textarea",
        label: "What sets your company apart from others?",
        example:
          "We handcraft each product locally and prioritize eco-friendly materials that last longer.",
      },
      {
        id: "brand_audience",
        type: "textarea",
        label: "Who are you trying to reach?",
        help: "Your ideal customer: age, lifestyle, anything relevant.",
        example:
          "Young professionals aged 25–35 who care about quality design, sustainability and modern aesthetics.",
      },
    ],
  },
  {
    id: "brand_logo",
    set: "branding",
    title: "Logo & visual style",
    questions: [
      {
        id: "logo_types",
        type: "multi",
        label: "Which logo types do you like?",
        options: [
          "Monogram (lettermark)",
          "Wordmark (logotype)",
          "Image logo (symbol)",
          "Combination logo",
        ],
      },
      {
        id: "logo_likes",
        type: "textarea",
        label: "Logos you like or dislike",
        help: "Links, images or examples, or what to avoid.",
        example:
          "We love simple and bold logos like Airbnb or Dropbox. We don't like overly detailed or vintage logos.",
        optional: true,
      },
      {
        id: "logo_usage",
        type: "textarea",
        label: "Where will the logo be used?",
        example: "Mostly for the website, app, packaging and Instagram.",
      },
      {
        id: "brand_tone",
        type: "text",
        label: "Tone of voice",
        example: "Casual yet professional, communicative, inspiring.",
        optional: true,
      },
      {
        id: "brand_colors",
        type: "textarea",
        label: "Color preferences",
        help: "Color references or examples you like.",
        example:
          "Soft neutrals and pastels like sage green, beige or blush pink.",
        optional: true,
      },
      {
        id: "brand_tagline",
        type: "text",
        label: "Does your brand have a tagline or motto?",
        example: "Brewing better moments, every day.",
        optional: true,
      },
      {
        id: "brand_extra",
        type: "textarea",
        label: "Anything else we should know about the company or product?",
        example:
          "We're also planning to launch a merch line next year, so flexibility in the design would be great.",
        optional: true,
      },
    ],
  },
]

const DEVELOPMENT: BriefSection[] = [
  {
    id: "dev",
    set: "development",
    title: "Development (Webflow / Framer)",
    questions: [
      {
        id: "dev_platform",
        type: "single",
        label: "Which platform?",
        options: ["Webflow", "Framer", "Not sure yet"],
      },
      {
        id: "dev_design",
        type: "single",
        label: "Is the design ready?",
        options: [
          "Yes, Kretya designs it",
          "Yes, we have our own design",
          "No, not yet",
        ],
      },
      {
        id: "dev_pages",
        type: "text",
        label: "How many pages, roughly?",
        example: "5 pages: Home, About, Services, Blog, Contact.",
        // With Kretya designing it, the pages come from the design brief.
        showIf: {
          question: "dev_design",
          is: ["Yes, we have our own design", "No, not yet"],
        },
      },
      {
        id: "dev_cms",
        type: "multi",
        label: "Content you want to manage yourselves (CMS)",
        options: [
          "Blog / articles",
          "Portfolio / case studies",
          "Products",
          "Team",
          "Careers",
        ],
        other: true,
        optional: true,
      },
      {
        id: "dev_integrations",
        type: "multi",
        label: "Integrations",
        options: [
          "Contact forms",
          "Newsletter",
          "Analytics",
          "Booking / calendar",
          "Payments",
          "Live chat",
        ],
        other: true,
        optional: true,
      },
      {
        id: "dev_languages",
        type: "text",
        label: "Languages on the site",
        example: "English and Indonesian.",
        optional: true,
      },
      {
        id: "dev_domain",
        type: "single",
        label: "Domain",
        options: ["We already have one", "We need to buy one", "Not sure"],
      },
      {
        id: "dev_after",
        type: "single",
        label: "After launch, who keeps it up to date?",
        options: ["Our team", "Kretya (maintenance)", "Not decided yet"],
      },
    ],
  },
]

const COMMON_END: BriefSection[] = [
  {
    id: "timeline",
    set: "common",
    title: "Timeline",
    questions: [
      {
        id: "deadline",
        type: "textarea",
        label: "Project deadline & timeline",
        help: "Desired deadlines for each phase.",
        example:
          "Initial design completed in 4 weeks, development completed in 8 weeks.",
      },
      {
        id: "deadline_flex",
        type: "text",
        label: "Flexibility for a deadline extension",
        example: "A 2-week extension if necessary.",
        optional: true,
      },
      {
        id: "resources",
        type: "multi",
        label: "Resources you'll provide",
        options: [
          "Content (texts)",
          "Images / illustrations",
          "Demo access to the product",
        ],
        other: true,
        optional: true,
      },
      {
        id: "update_frequency",
        type: "single",
        label: "Project update frequency",
        options: ["Daily", "Weekly", "Monthly"],
      },
    ],
  },
  {
    id: "files",
    set: "common",
    title: "Additional files",
    questions: [
      {
        id: "files",
        type: "files",
        label: "Files to share with us",
        help: "Brief documents, logo, branding files, page breakdown… Single files or a ZIP, up to 200 MB each. They're kept exactly as you send them.",
        optional: true,
      },
    ],
  },
]

export const SET_SECTIONS: Record<BriefSet, BriefSection[]> = {
  design: DESIGN,
  branding: BRANDING,
  development: DEVELOPMENT,
}

/** English names for the client site. */
export const SET_TITLES: Record<BriefSet, string> = {
  design: "UI design",
  branding: "Branding",
  development: "Development (Webflow / Framer)",
}

/** The pitch on an offer card ("Need branding too?"). */
export const SET_OFFERS: Record<BriefSet, { title: string; body: string }> = {
  design: {
    title: "Need UI design too?",
    body: "We can design the screens and flows, ready for development.",
  },
  branding: {
    title: "Need branding too?",
    body: "A logo and brand guideline that fit the product. Answer a few more questions and we'll include it.",
  },
  development: {
    title: "Need it built too?",
    body: "We can build it in Webflow or Framer, so you can edit the content yourselves.",
  },
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/**
 * A new brief's questions: the common start, every set it asks or offers
 * (an offer's questions only show once the client takes it), the common
 * end.
 */
export function baseSections(sets: BriefSet[]) {
  return clone([
    ...COMMON_START,
    ...sets.flatMap((set) => SET_SECTIONS[set]),
    ...COMMON_END,
  ])
}

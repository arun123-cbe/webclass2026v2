import { CourseModule } from "./types";

export const courseModules: CourseModule[] = [
  {
    id: "module-1",
    category: "Digital Marketing",
    title: "01. Digital Marketing Fundamentals",
    description: "Understand the digital ecosystem, customer journey, marketing funnel, and career paths.",
    lessons: [
      {
        id: "lesson-1-1",
        title: "1.1 Marketing Funnels & Campaign Performance (AARRR)",
        description: "Deconstruct the Pirate Funnel (AARRR), calculate customer acquisition costs, and understand ROI metrics.",
        duration: "25 mins",
        liveToolType: "roi-calc",
        markdownContent: `### What is a Marketing Funnel?
A marketing funnel is a visualization of the path a potential customer takes from discovering your brand to purchasing and advocating.
The most popular performance framework is the **AARRR Funnel** (also known as the Pirate Funnel):

1. **Acquisition (Awareness & Clicks)**: How do users find you? (SEO, PPC, Social Media)
2. **Activation (First positive experience)**: Do they sign up, read a blog, or configure a profile?
3. **Retention (Repeat behavior)**: Do they come back, check your emails, or re-engage?
4. **Referral (Word-of-mouth)**: Do they invite others or share reviews?
5. **Revenue (Monetization)**: Do they buy, subscribe, or upgrade?

### Visualizing Funnel Stages:
* **TOFU (Top of Funnel - Awareness)**: Reaching a broad audience (low-intent, cheap traffic).
* **MOFU (Middle of Funnel - Consideration)**: Nurturing prospects with guides, webinars, or comparison sheets.
* **BOFU (Bottom of Funnel - Decision)**: Retargeting warm leads with pricing pages, demos, and discounts (high-intent).

### Key Performance Indicators (KPIs):
* **CPC (Cost Per Click)**: Total Ad Spend / Total Clicks.
* **CTR (Click-Through Rate)**: (Total Clicks / Total Impressions) * 100.
* **Conversion Rate (CR)**: (Conversions / Clicks) * 100.
* **CPA (Cost Per Acquisition)**: Total Ad Spend / Total Customers Acquired.
* **ROI (Return on Investment)**: ((Revenue - Spend) / Spend) * 100.`,
        resources: [
          {
            id: "res-1-1-1",
            title: "Digital Marketing Strategy Roadmap",
            type: "Worksheet",
            filename: "digital_marketing_roadmap_worksheet.md",
            content: `# Digital Marketing Campaign Blueprint Worksheet\n\n**Goal:** Plan your next campaign.`
          }
        ],
        quiz: {
          questions: [
            {
              id: "q-1-1-1",
              question: "Which stage of the funnel is concernced with users signing up for an e-newsletter?",
              options: ["Acquisition", "Activation", "Referral", "Revenue"],
              correctAnswer: 1,
              explanation: "Activation is when the user takes their first key action showing real interest."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-2",
    category: "Digital Marketing",
    title: "02. Marketing Strategy & Business Fundamentals",
    description: "Learn business models, SWOT, buyer personas, market research, and digital strategy.",
    lessons: [
      {
        id: "lesson-2-1",
        title: "2.1 Buyer Persona Development & Market Positioning",
        description: "Analyze customer demographics, psychographics, pain points, and design tailored messaging.",
        duration: "20 mins",
        liveToolType: "persona",
        markdownContent: `### What is a Buyer Persona?
A buyer persona is a semi-fictional representation of your ideal customer based on real data and market research.

### Demographics vs. Psychographics:
* **Demographics (The Who)**: Age, income, occupation, location, education, family status.
* **Psychographics (The Why)**: Values, hobbies, lifestyle, goals, fears, objections.

### Core Persona Design Questions:
1. What is their **primary professional or personal goal**?
2. What **roadblocks or pain points** prevent them from achieving that goal?
3. What is their **biggest objection** to buying our product?`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-2-1-1",
              question: "Which of the following is considered a 'psychographic' attribute?",
              options: ["Annual Income", "Core values and personal fears", "City of residence", "Job title"],
              correctAnswer: 1,
              explanation: "Psychographics focus on psychological factors like values, interests, fears, and behaviors."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-3",
    category: "Digital Marketing",
    title: "03. Branding & Personal Branding",
    description: "Create brand identity, positioning, messaging, and professional online presence.",
    lessons: [
      {
        id: "lesson-3-1",
        title: "3.1 Brand Identity, Positioning & Styling",
        description: "Build a memorable brand with strategic positioning, style guides, and uniform branding.",
        duration: "20 mins",
        markdownContent: `### Brand Identity & Positioning
Brand identity is the collection of all elements that a company creates to portray the right image to its consumer.
- **Brand Positioning Statement**: Who is your product for, what unique value does it provide, and why are you better than alternatives?
- **Visual Identity**: Logos, typography pairings, color palettes, and imagery styles.
- **Brand Voice**: Is your brand authoritative, playful, clinical, or conversational?`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-3-1-1",
              question: "What is the primary goal of a brand positioning statement?",
              options: ["To list all raw materials used", "To define the unique value your brand offers to a specific audience compared to competitors", "To create a legal trademark protection", "To establish employee internal rules"],
              correctAnswer: 1,
              explanation: "Positioning defines your brand's unique space in the mind of the target consumer."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-4",
    category: "Digital Marketing",
    title: "04. Website Planning & Information Architecture",
    description: "Plan websites, sitemaps, user flows, and conversion-focused structures.",
    lessons: [
      {
        id: "lesson-4-1",
        title: "4.1 Information Architecture & User Flow Design",
        description: "Design intuitive digital sitemaps, clean navigation pathways, and highly structural user flows.",
        duration: "20 mins",
        markdownContent: `### Website Planning Blueprint
Before writing code or styling a page, you must design its structure:
- **Sitemap**: A visual hierarchy of all the key pages on your website.
- **User Flow**: The precise sequential steps a visitor takes to complete a goal (e.g. landing page -> blog post -> signup -> check-out).
- **Information Architecture (IA)**: Organizing and structuring content so visitors can find information effortlessly.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-4-1-1",
              question: "What does Information Architecture (IA) refer to in website planning?",
              options: ["The hardware server configuration", "The structural organization and classification of web content for ease of navigation", "The database backup process", "The CSS styling code"],
              correctAnswer: 1,
              explanation: "Information Architecture is about organizing and structuring content logically for optimal usability."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-5",
    category: "Digital Marketing",
    title: "05. WordPress Website Development",
    description: "Build responsive websites using WordPress and Elementor.",
    lessons: [
      {
        id: "lesson-5-1",
        title: "5.1 Visual Site Building with Elementor",
        description: "Learn how to establish themes, configure responsive layouts, and design sections without writing code.",
        duration: "25 mins",
        markdownContent: `### Establishing WordPress & Elementor
WordPress powers over 40% of all websites globally. Elementor is the leading drag-and-drop live page builder.
- **Themes vs. Plugins**: Themes control the overall aesthetic structure; plugins extend the functional features of your site.
- **Elementor Widget Containers**: Use flexbox layouts to ensure pages render beautifully on tablets, mobile screens, and ultra-wide desktops.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-5-1-1",
              question: "What is the primary difference between a WordPress Theme and a WordPress Plugin?",
              options: ["Themes are paid; plugins are always free", "Themes control visual design and layout, while plugins extend the site's functionality", "Plugins are only used for security, while themes handle databases", "There is no difference between them"],
              correctAnswer: 1,
              explanation: "Themes determine the visual design and look-and-feel. Plugins provide custom features and custom business logic."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-6",
    category: "Digital Marketing",
    title: "06. Landing Pages & Conversion Optimization",
    description: "Create high-converting landing pages and optimize user journeys.",
    lessons: [
      {
        id: "lesson-6-1",
        title: "6.1 Landing Page Architecture & Lead Magnets",
        description: "Assemble high-converting landing pages with strong headers, social proof, and seamless forms.",
        duration: "20 mins",
        markdownContent: `### Landing Page Best Practices
Unlike a standard home page, a Landing Page is built for a single targeted action:
- **Above the Fold**: The visual space visible without scrolling. Must contain your primary headline, subhead, benefit summary, and CTA.
- **Lead Magnet**: A high-value free resource (e.g., checklist, ebook, coupon) traded for a visitor's contact information.
- **Social Proof**: Reviews, customer testimonials, trust badges, and case studies to counter natural consumer skepticism.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-6-1-1",
              question: "What is the primary purpose of a landing page compared to a home page?",
              options: ["To show all news articles", "To drive visitors toward a single specific action or conversion", "To list the contact details of all staff", "To showcase corporate legal records"],
              correctAnswer: 1,
              explanation: "Landing pages are highly focused, distraction-free pages designed to drive a single conversion."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-7",
    category: "Digital Marketing",
    title: "07. UI/UX Fundamentals for Marketers",
    description: "Apply UX principles, wireframing, and design thinking.",
    lessons: [
      {
        id: "lesson-7-1",
        title: "7.1 Visual Hierarchy & Wireframing",
        description: "Apply design guidelines, establish readability, and draft simple web layouts.",
        duration: "20 mins",
        markdownContent: `### UI/UX for Digital Marketers
Understanding user behavior directly increases campaign ROI:
- **F-Shaped Pattern**: Visitors scan digital content in an 'F' pattern. Place your key statements and CTAs along these natural reading vectors.
- **Contrast & Scale**: Guide attention to your CTA button using prominent size, strong color contrast, and ample white space.
- **Wireframe**: A low-fidelity layout structure used to map content positions before design assets are built.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-7-1-1",
              question: "What is the primary purpose of a wireframe in UI/UX planning?",
              options: ["To write the final JavaScript code", "To draft the layout structure and content hierarchy without styling distractions", "To publish marketing ads on Instagram", "To compress website images"],
              correctAnswer: 1,
              explanation: "Wireframes map the layout structure and hierarchy so teams can organize content before designing the aesthetics."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-8",
    category: "Digital Marketing",
    title: "08. Canva & Creative Design",
    description: "Design social media creatives, presentations, and marketing assets.",
    lessons: [
      {
        id: "lesson-8-1",
        title: "8.1 Visual Content Design with Canva",
        description: "Create engaging social ads, establish consistent brand kits, and utilize grid layouts.",
        duration: "20 mins",
        markdownContent: `### Creative Content Production
High-quality visuals directly increase Click-Through Rates (CTR):
- **Canva Brand Kits**: Store your exact Hex colors, custom fonts, and official logos for uniform asset generation.
- **The Rule of Thirds**: Divide your creative grid into a 3x3 pattern. Place key visual elements at intersection points to design balanced compositions.
- **Visual Contrast**: Ensure text elements have sharp readability against background graphics or solid overlays.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-8-1-1",
              question: "How does maintaining a consistent brand kit in Canva benefit marketing campaigns?",
              options: ["It automatically reduces ad spend cost", "It ensures visual uniformity and immediate brand recognition across all social media assets", "It removes the need to write ad copy", "It increases your search engine ranking directly"],
              correctAnswer: 1,
              explanation: "Brand kits enforce consistency in fonts, colors, and logos, cementing professional brand recall."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-9",
    category: "Digital Marketing",
    title: "09. Content Marketing & Content Strategy",
    description: "Build content calendars, blogs, and content funnels.",
    lessons: [
      {
        id: "lesson-9-1",
        title: "9.1 Editorial Planning & Content Distribution",
        description: "Construct practical content calendars and map assets across different user journey stages.",
        duration: "20 mins",
        markdownContent: `### Content Marketing Framework
Content marketing is the strategic creation and distribution of valuable, relevant content to attract and retain a defined audience.
- **Content Pillar**: A comprehensive piece of content (like an ultimate guide) that can be broken down into many micro-assets (Reels, blog posts, tweets).
- **Editorial Calendar**: Planning what to publish, on which channel, and when.
- **Repurposing**: Turn one long webinar video into 5 short social media reels and 1 summary blog post.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-9-1-1",
              question: "What is content repurposing?",
              options: ["Deleting old files from your website", "Taking a single core asset and adapting it into multiple formats across different platforms", "Buying backlinks from other websites", "Changing the name of your company"],
              correctAnswer: 1,
              explanation: "Repurposing maximizes content ROI by adapting one core piece of work into several diverse micro-formats."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-10",
    category: "Digital Marketing",
    title: "10. Copywriting & Storytelling",
    description: "Write compelling headlines, ads, emails, and sales copy.",
    lessons: [
      {
        id: "lesson-10-1",
        title: "10.1 Persuasive Copywriting & Ad copy Frameworks",
        description: "Deploy established copywriting formulas like AIDA and PAS to convert readers into leads.",
        duration: "30 mins",
        liveToolType: "ad-copy",
        markdownContent: `### Copywriting Formulas
Persuasive copy is built using psychological guidelines:

#### 1. The AIDA Model:
- **Attention**: Hook the reader with a bold question, surprising statistic, or relatable problem.
- **Interest**: Build interest by explaining the benefits of your offer and why it matters.
- **Desire**: Evoke desire by describing the positive outcome.
- **Action**: Direct them toward a clear, immediate action.

#### 2. The PAS Framework:
- **Problem**: Call out the specific pain point directly.
- **Agitate**: Make the problem visceral. Connect it to lost time or stress.
- **Solve**: Present your product/service as the ultimate relief.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-10-1-1",
              question: "What does PAS stand for in copywriting?",
              options: ["Product, Authority, Sales", "Problem, Agitate, Solve", "Pricing, Action, Satisfaction", "Promotion, Audience, Segment"],
              correctAnswer: 1,
              explanation: "PAS stands for Problem, Agitation, Solution. It is highly effective for direct response copy."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-11",
    category: "Digital Marketing",
    title: "11. Search Engine Optimization (SEO)",
    description: "Perform keyword research, on-page, technical, local, and off-page SEO.",
    lessons: [
      {
        id: "lesson-11-1",
        title: "11.1 Keyword Research, On-Page & Technical SEO",
        description: "Optimize meta titles, descriptions, crawl budgets, page indexing, and site speeds.",
        duration: "30 mins",
        liveToolType: "seo-meta",
        markdownContent: `### The SEO Architecture
Search Engine Optimization is the practice of increasing organic traffic from search engines like Google:

- **Meta Title**: The primary blue link shown on Google results pages (should be under 60 characters).
- **Meta Description**: The summary paragraph below the title (should be under 160 characters).
- **Technical Auditing**: Assuring fast load times, SSL security, XML sitemaps, and mobile indexing.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-11-1-1",
              question: "What is the recommended length of a Meta Description?",
              options: ["Under 60 characters", "Under 160 characters", "Under 300 characters", "No maximum length"],
              correctAnswer: 1,
              explanation: "Google truncates descriptions at approximately 155-160 characters, so keep them within this limit."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-12",
    category: "Digital Marketing",
    title: "12. Google Business Profile & Local SEO",
    description: "Optimize local search visibility and reputation.",
    lessons: [
      {
        id: "lesson-12-1",
        title: "12.1 Local SEO Optimization & Review Strategies",
        description: "Configure Google Business profiles, build local citations, and capture high-ranking local spots.",
        duration: "20 mins",
        markdownContent: `### Dominating Local Search
For businesses serving specific cities or physical locations, Local SEO is crucial:
- **Google Business Profile (GBP)**: Your free listing that shows up on Google Maps and Local 3-Pack search results.
- **NAP Consistency**: Ensuring your Business Name, Address, and Phone number are identical across all directories.
- **Local Citations**: Mentions of your business on platforms like Yelp, YellowPages, or local business registries.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-12-1-1",
              question: "What does NAP stand for in Local SEO?",
              options: ["Net Annual Profit", "Name, Address, Phone number", "Network Access Protocol", "Navigation and Page layout"],
              correctAnswer: 1,
              explanation: "Consistency in Name, Address, and Phone number across directory platforms builds local ranking trust."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-13",
    category: "Digital Marketing",
    title: "13. Google Analytics 4 (GA4)",
    description: "Measure website performance, events, and conversions.",
    lessons: [
      {
        id: "lesson-13-1",
        title: "13.1 GA4 Event Tracking & Funnel Analysis",
        description: "Setup event-based tracking, construct custom conversion parameters, and read user pathways.",
        duration: "25 mins",
        markdownContent: `### Introduction to Google Analytics 4 (GA4)
GA4 uses an event-based data model, meaning every user interaction (pageview, click, purchase) is treated as an Event.
- **Events**: User interactions tracked on your site.
- **Conversions**: Key events that match business objectives (e.g., lead form submission, purchases).
- **Acquisition Reports**: Tell you exactly where your website traffic is coming from (Organic Search, Paid Search, Referral).`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-13-1-1",
              question: "How does GA4 differ from Universal Analytics?",
              options: ["GA4 is strictly paid, UA was free", "GA4 uses an event-based tracking model instead of session-based hits", "GA4 cannot track pageviews", "GA4 does not support custom metrics"],
              correctAnswer: 1,
              explanation: "GA4 measures every interaction as an event, offering superior flexibility compared to the old hit-based model of UA."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-14",
    category: "Digital Marketing",
    title: "14. Google Tag Manager (GTM)",
    description: "Configure tracking tags, triggers, and variables.",
    lessons: [
      {
        id: "lesson-14-1",
        title: "14.1 Tags, Triggers & Variable Configuration",
        description: "Deploy marketing scripts, fire pixels based on user behavior, and manage tags without code.",
        duration: "25 mins",
        markdownContent: `### Tag Management Essentials
Google Tag Manager simplifies the process of installing marketing pixels and tracking scripts:
- **Tags**: Snippets of code (like Google Ads conversion tags, Meta Pixel) deployed on a site.
- **Triggers**: The conditions under which a tag fires (e.g. 'Only on the /thank-you page' or 'When user scrolls 50%').
- **Variables**: Dynamic placeholders representing values (e.g. Page URL, Click ID, Transaction Total).`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-14-1-1",
              question: "What is a GTM Trigger?",
              options: ["The code snippet sent to Google", "A condition that determines when a specific Tag should execute", "The spreadsheet storing conversion values", "A payment processor endpoint"],
              correctAnswer: 1,
              explanation: "A trigger listens for specific website events and dictates exactly when tags should execute."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-15",
    category: "Digital Marketing",
    title: "15. Looker Studio & Marketing Dashboards",
    description: "Build dashboards and client-ready reports.",
    lessons: [
      {
        id: "lesson-15-1",
        title: "15.1 Looker Studio Custom Reporting",
        description: "Integrate multiple data sources to build dynamic, interactive dashboards.",
        duration: "20 mins",
        markdownContent: `### looker Studio Reporting
Looker Studio turns raw data (GA4, Google Sheets, Google Ads) into beautiful, interactive marketing reports:
- **Data Connectors**: Seamless connections that stream live performance numbers into your templates.
- **Dimensions vs. Metrics**: Dimensions are categories/labels (e.g. Country, Device type); metrics are numerical values (e.g. Impressions, Conversions).
- **Client Sharing**: Automate scheduling PDF reports sent to client inboxes every Monday morning.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-15-1-1",
              question: "In Looker Studio, what is the difference between a Dimension and a Metric?",
              options: ["Metrics are qualitative text values; Dimensions are quantitative numbers", "Dimensions are qualitative categories/labels; Metrics are quantitative numerical counts", "Dimensions are only used for Google Ads, while Metrics are for GA4", "There is no difference between them"],
              correctAnswer: 1,
              explanation: "Dimensions are the categorical attributes (e.g., Campaign Name), and Metrics are the measurable numbers (e.g., Clicks)."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-16",
    category: "Digital Marketing",
    title: "16. Google Ads – Search",
    description: "Create and optimize Search campaigns.",
    lessons: [
      {
        id: "lesson-16-1",
        title: "16.1 Keyword Match Types & Quality Score",
        description: "Configure exact, phrase, and broad matches, plus optimize ad relevance and quality scores.",
        duration: "25 mins",
        markdownContent: `### Dominating Google Search Ads
Google Ads allows you to capture high-intent search queries:
- **Match Types**:
  - *Broad Match*: High volume, lower relevance.
  - *Phrase Match ("keyword")*: Match queries containing phrase meaning.
  - *Exact Match ([keyword])*: Match exact queries.
- **Quality Score**: A 1-10 scoring system determining ad ranking. Based on Expected CTR, Ad Relevance, and Landing Page Experience. Higher scores lower CPC.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-16-1-1",
              question: "Which match type is indicated by brackets like [marketing course]?",
              options: ["Broad Match", "Phrase Match", "Exact Match", "Negative Match"],
              correctAnswer: 2,
              explanation: "Square brackets indicate Exact Match in Google Ads, showing ads only when search terms match exactly."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-17",
    category: "Digital Marketing",
    title: "17. Google Ads – Display, YouTube & Performance Max",
    description: "Expand campaigns across Google's advertising network.",
    lessons: [
      {
        id: "lesson-17-1",
        title: "17.1 Asset-Driven Campaigns & YouTube Video Ads",
        description: "Deploy Performance Max campaign strategies to automate ad delivery across the entire Google network.",
        duration: "25 mins",
        markdownContent: `### Performance Max & Visual Channels
Google's automated campaign type, **Performance Max (PMax)**, dynamically serves assets across Gmail, Search, YouTube, Maps, and Discover:
- **Asset Groups**: A collection of images, logos, videos, headlines, and descriptions compiled by Google's AI.
- **YouTube Skivable In-Stream**: Video ads that viewers can skip after 5 seconds. Highly effective for building top-of-funnel brand lift.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-17-1-1",
              question: "What is Google's Performance Max (PMax) campaign?",
              options: ["An ad campaign that only displays on Google Maps", "An AI-driven campaign type that displays assets across all of Google's networks automatically", "A tool to write blog articles", "A manual bid strategy for search ads"],
              correctAnswer: 1,
              explanation: "PMax utilizes machine learning to distribute assets dynamically across Search, Display, YouTube, Gmail, Maps, and Discover."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-18",
    category: "Digital Marketing",
    title: "18. Meta Ads (Facebook & Instagram)",
    description: "Launch and optimize Meta campaigns with audience targeting.",
    lessons: [
      {
        id: "lesson-18-1",
        title: "18.1 Targeting, Pixel Optimization & Scaling Meta Ads",
        description: "Configure Meta Conversion API, establish pixel rules, build lookalikes, and scale budgets.",
        duration: "30 mins",
        markdownContent: `### Mastering Meta Campaigns
Meta Ads interrupts users scrolling their social feeds based on refined interest and behavioral data:
- **Meta Pixel & Conversions API**: Crucial tracking systems that send activity from your website back to Meta.
- **Custom Audiences**: Target past visitors or customer lists.
- **Lookalike Audiences (LAL)**: Meta's algorithm finds new profiles whose characteristics closely match your existing buyers.
- **CBO vs. ABO**: Campaign Budget Optimization distributes spend dynamically across adsets, while Ad Set Budget Optimization sets explicit budgets.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-18-1-1",
              question: "What is a Lookalike Audience on Meta Ads?",
              options: ["Users who look physically similar to your sales team", "An audience generated by Meta representing new users who behave similarly to your existing customers", "A database of random competitor email addresses", "An audience of former employees"],
              correctAnswer: 1,
              explanation: "Lookalikes leverage Meta's data model to find new, highly responsive prospects that share behaviors with your best customers."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-19",
    category: "Digital Marketing",
    title: "19. LinkedIn Marketing",
    description: "Develop personal branding, B2B marketing, and LinkedIn Ads.",
    lessons: [
      {
        id: "lesson-19-1",
        title: "19.1 B2B Prospecting & LinkedIn Message Ads",
        description: "Write authority-building organic content, map B2B ICPs, and launch high-ticket lead ads.",
        duration: "20 mins",
        markdownContent: `### LinkedIn B2B Strategies
LinkedIn is the ultimate platform for B2B (Business-to-Business) client acquisition and high-value personal branding:
- **Thought Leadership**: Publishing detailed case studies, insights, and industry breakdowns to position yourself as an authority.
- **LinkedIn Lead Gen Forms**: In-app ad forms that pre-fill contact details from a user's professional profile, maximizing conversion rates.
- **ABM (Account-Based Marketing)**: Targeting specific target accounts/companies with tailored ad campaigns.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-19-1-1",
              question: "Why are LinkedIn Lead Gen Forms highly effective for B2B advertising?",
              options: ["They are cheaper than Google Ads", "They pre-fill contact details directly from the user's professional profile, reducing friction", "They automatically translate your ad copy", "They guarantee immediate purchases"],
              correctAnswer: 1,
              explanation: "By auto-populating fields (Name, Job Title, Company), they reduce form-filling friction, raising conversion rates."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-20",
    category: "Digital Marketing",
    title: "20. Instagram Growth & Reels Marketing",
    description: "Grow audiences with organic content and short-form video.",
    lessons: [
      {
        id: "lesson-20-1",
        title: "20.1 Hook-Story-Offer Framework for Short Videos",
        description: "Deconstruct viral algorithms, outline content pillars, and convert viewers into followers.",
        duration: "20 mins",
        markdownContent: `### Instagram Reels Optimization
Short-form video is currently the most powerful engine for organic reach:
- **The Hook (First 3 seconds)**: Bold text overlay, dynamic action, or provocative statements to stop users from scrolling past.
- **The Story**: Delivering on the promise of the hook with educational, entertaining, or relatable value.
- **The Offer (Call to Action)**: Directing viewers on what to do next (e.g. 'Comment \"GROWTH\" below to receive our free checklist'). This leverages engagement loops.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-20-1-1",
              question: "What is the primary role of the 'Hook' in an Instagram Reel?",
              options: ["To show the company legal details", "To capture interest within the first 3 seconds and prevent users from scrolling away", "To process payment details", "To play background music"],
              correctAnswer: 1,
              explanation: "The hook is critical to halt rapid vertical scrolling, securing the viewer's attention long enough to deliver the core message."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-21",
    category: "Digital Marketing",
    title: "21. YouTube Marketing & SEO",
    description: "Optimize channels, videos, Shorts, and monetization strategies.",
    lessons: [
      {
        id: "lesson-21-1",
        title: "21.1 Click-Through Rate & Watch Time Optimization",
        description: "Structure search-friendly video titles, craft clickable thumbnails, and analyze audience retention curves.",
        duration: "20 mins",
        markdownContent: `### Dominating YouTube
YouTube is the world's second-largest search engine. Success depends on two metrics:
1. **CTR (Click-Through Rate)**: How many searchers click your thumbnail. Perfect your thumbnails by using high-contrast text and emotive faces.
2. **AVD (Average View Duration)**: How long people stay. Keep retention high by using quick cuts, visual hooks, and removing boring intros.
- **YouTube SEO**: Placing primary keywords naturally in titles, video tags, and transcripts.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-21-1-1",
              question: "Which two metrics are most important for YouTube's recommendation algorithm?",
              options: ["Video resolution and thumbnail file size", "Click-Through Rate (CTR) and Average View Duration (AVD)", "Number of video tags and total channel subscriber count", "Comments length and video uploads per week"],
              correctAnswer: 1,
              explanation: "YouTube rewards videos that successfully attract clicks (CTR) and keep users watching on the platform (AVD)."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-22",
    category: "Digital Marketing",
    title: "22. Social Media Management",
    description: "Plan, schedule, manage, and report on multi-platform campaigns.",
    lessons: [
      {
        id: "lesson-22-1",
        title: "22.1 Social Media Calendars & Workflow Automation",
        description: "Assemble structured content workflows, write platform-custom captions, and automate posts.",
        duration: "20 mins",
        markdownContent: `### Scaling Social Operations
Managing multiple brand profiles requires organization and tool-assisted automation:
- **Scheduling Platforms (Buffer, Hootsuite, Later)**: Queue posts across Meta, LinkedIn, and TikTok in advance.
- **Platform-Tailored Copy**: Customizing captions for each network (e.g. hash-tag heavy on Instagram, long-form and intellectual on LinkedIn).
- **Sentiment Monitoring**: Responding to customer queries and comments quickly to boost algorithm performance.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-22-1-1",
              question: "What is a major advantage of using third-party social media schedulers?",
              options: ["They guarantee viral content results", "They allow you to coordinate and schedule posts across multiple platforms from a single interface", "They write all ad copy automatically without input", "They increase ad budgets automatically"],
              correctAnswer: 1,
              explanation: "Schedulers streamline campaign management by allowing marketing teams to prep and publish posts globally from one dashboard."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-23",
    category: "Digital Marketing",
    title: "23. Email Marketing",
    description: "Build newsletters, campaigns, and automated email sequences.",
    lessons: [
      {
        id: "lesson-23-1",
        title: "23.1 Email Deliverability & Drip Campaigns",
        description: "Configure DNS records (SPF, DKIM, DMARC), construct high-open subject lines, and build automation triggers.",
        duration: "25 mins",
        markdownContent: `### High-Performance Email Marketing
Email provides direct access to your audience without algorithm interference:
- **Deliverability**: Avoiding the spam folder. Maintain authorization DNS protocols like SPF, DKIM, and DMARC. Clean list hygiene is critical.
- **Welcome Drip Sequence**: A structured series of automated emails triggered when a subscriber signs up, introducing values and products.
- **Segmentation**: Grouping subscribers based on action (e.g., separating active buyers from non-purchasers to send targeted offers).`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-23-1-1",
              question: "What are SPF, DKIM, and DMARC used for in email marketing?",
              options: ["To format HTML newsletter designs", "To establish sender authentication and improve inbox deliverability, avoiding spam filters", "To automatically translate subject lines", "To host sign-up landing pages"],
              correctAnswer: 1,
              explanation: "These DNS records authenticate your email domain, proving to inbox providers (Gmail, Outlook) that you are not a spammer."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-24",
    category: "Digital Marketing",
    title: "24. CRM & Marketing Automation",
    description: "Manage leads and automate customer journeys using CRM tools.",
    lessons: [
      {
        id: "lesson-24-1",
        title: "24.1 Lead Scoring & Pipeline Automation",
        description: "Configure customer pipelines, score leads, and trigger target sales sequences automatically.",
        duration: "20 mins",
        markdownContent: `### CRM Systems & Automation Hubs
A CRM (Customer Relationship Management) tool (HubSpot, Salesforce) serves as your marketing brain:
- **Lead Scoring**: Assigning point values to prospects based on behavior (e.g., +10 for downloading ebook, +50 for visiting pricing page).
- **Pipeline Stages**: Visualizing client progression from Cold Prospect -> Contacted -> Scheduled Demo -> Won.
- **Workflow Triggers**: Triggering automated salesperson tasks or follow-ups when lead score thresholds are met.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-24-1-1",
              question: "What is Lead Scoring in a CRM system?",
              options: ["The total revenue earned divided by clients", "A methodology that assigns numerical points to leads based on actions to identify high-value buyers", "A grading curve for digital marketing exams", "The ranking of competitor domain authorities"],
              correctAnswer: 1,
              explanation: "Lead scoring helps prioritize sales outreach by quantifying engagement levels, matching high scores with purchase intent."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-25",
    category: "Digital Marketing",
    title: "25. WhatsApp Business & Conversational Marketing",
    description: "Create WhatsApp campaigns, templates, and automated workflows.",
    lessons: [
      {
        id: "lesson-25-1",
        title: "25.1 WhatsApp Broadcasts & Chatbot Logic",
        description: "Configure Official WhatsApp Cloud API, design template structures, and build responsive automated chatbot trees.",
        duration: "20 mins",
        markdownContent: `### WhatsApp Marketing Strategies
With over 95% open rates, conversational channels convert faster than traditional email:
- **WhatsApp Cloud API**: Allows businesses to send bulk template messages to opt-in databases.
- **Template Approvals**: WhatsApp requires pre-approval for promotional messages to protect user experience.
- **Chatbot Decision Trees**: Providing interactive menu options (e.g. 'Press 1 to schedule, Press 2 for catalog') to qualify customers automatically.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-25-1-1",
              question: "Why is WhatsApp highly favored in conversational marketing campaigns?",
              options: ["It bypasses all local business regulations", "It boasts open rates exceeding 90-95%, which far outperforms traditional email and SMS benchmarks", "It does not require template approvals", "It operates without internet connection"],
              correctAnswer: 1,
              explanation: "WhatsApp's near-universal user attention delivers unrivaled open and reply rates when executed ethically."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-26",
    category: "Digital Marketing",
    title: "26. AI for Digital Marketing",
    description: "Use AI tools for content, ads, analytics, research, and productivity.",
    lessons: [
      {
        id: "lesson-26-1",
        title: "26.1 Prompt Engineering for Marketing Assets",
        description: "Leverage generative AI to write ad copy, analyze customer feedback, and design visual mood boards.",
        duration: "20 mins",
        markdownContent: `### Scaling Growth with Generative AI
AI-powered tools enhance marketing workflow speeds by up to 10x:
- **Role-Based Prompting**: Telling AI to adopt an expert persona (e.g., 'Act as an elite conversion copywriting specialist...').
- **Context-Heavy Prompts**: Supplying raw business details, client transcripts, or product matrices to ensure highly tailored, non-generic outputs.
- **AI Ethics**: Double-checking factual claims, editing voice consistency, and maintaining copyright awareness.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-26-1-1",
              question: "What is an effective practice when using generative AI for copywriting?",
              options: ["Copying the output directly without checking for facts or tone", "Providing detailed context, a target audience, and specific guidelines in your prompt to get non-generic results", "Keeping prompts extremely short, such as 'write an ad'", "Using it to build illegal competitor database exports"],
              correctAnswer: 1,
              explanation: "Supplying comprehensive background details and strict stylistic directions forces the AI to output relevant, tailored copy."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-27",
    category: "Digital Marketing",
    title: "27. Ecommerce Marketing",
    description: "Market online stores using Shopify, WooCommerce, and shopping ads.",
    lessons: [
      {
        id: "lesson-27-1",
        title: "27.1 Product Feeds & Catalog Sales Campaigns",
        description: "Establish product feeds, optimize Shopify conversion flows, and run dynamic catalog retargeting ads.",
        duration: "20 mins",
        markdownContent: `### Ecommerce Growth Tactics
Online stores rely on frictionless digital pathways and dynamic product retargeting:
- **Merchant Center**: The hub where your Shopify or WooCommerce product feed is sent to sync live inventories with Google and Meta Shopping networks.
- **Dynamic Product Ads (DPA)**: Showing ad viewers the exact products they viewed on your website but did not purchase.
- **Checkout Friction Reduction**: Removing multi-page forms, enabling 1-click checkouts (Shop Pay), and displaying prominent security seals.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-27-1-1",
              question: "What are Dynamic Product Ads (DPAs)?",
              options: ["Ads that change color based on weather", "Ads that automatically display specific items matching what a website visitor previously added to their shopping cart", "Print billboard ads that rotate images", "Sponsored blog posts about sports"],
              correctAnswer: 1,
              explanation: "DPAs track shopper behavior on-site and serve retargeting ads displaying those exact items, recovering lost cart revenue."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-28",
    category: "Digital Marketing",
    title: "28. Conversion Rate Optimization (CRO)",
    description: "Improve conversions using A/B testing and behavioral analysis.",
    lessons: [
      {
        id: "lesson-28-1",
        title: "28.1 A/B Testing & Behavioral Heatmaps",
        description: "Analyze user records, configure scientific split testing frameworks, and decipher visitor heatmaps.",
        duration: "20 mins",
        markdownContent: `### Driving CRO Success
Conversion Rate Optimization focuses on turning existing traffic into paying buyers:
- **A/B Testing (Split Testing)**: Showing 50% of visitors Version A (e.g., Red CTA Button) and 50% Version B (Green CTA Button) to measure which produces higher sales.
- **Heatmaps (Hotjar, Microsoft Clarity)**: Visual maps showing where users scroll, click, hover, and get stuck.
- **Micro-conversions**: Small actions (e.g., video plays, category selections) that pave the way for primary purchases.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-28-1-1",
              question: "How does A/B testing benefit landing page optimization?",
              options: ["It removes the necessity of running ads", "It provides scientific data comparing layout performance, helping you scale based on conversion metrics", "It automatically lowers hosting fees", "It optimizes image resolutions in background"],
              correctAnswer: 1,
              explanation: "Split testing isolated changes allows marketers to confidently deploy layout variations proven to generate superior sales."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-29",
    category: "Digital Marketing",
    title: "29. Influencer & Affiliate Marketing",
    description: "Plan influencer collaborations and affiliate programs.",
    lessons: [
      {
        id: "lesson-29-1",
        title: "29.1 Creator Collaboration & Commission Management",
        description: "Perform outreach, negotiate pricing matrices, setup affiliate tracking codes, and evaluate ROI.",
        duration: "20 mins",
        markdownContent: `### Leverage Creator Audiences
Tapping into pre-established, trusted consumer networks delivers rapid trust and conversions:
- **Influencer Tiers**:
  - *Nano-Influencers (1k-10k followers)*: High engagement, very budget-friendly.
  - *Macro-Influencers (100k+ followers)*: Massive reach, premium pricing.
- **Affiliate tracking**: Providing unique coupon codes or custom tracking URLs (UTMs) to creators to pay commissions based on actual sales.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-29-1-1",
              question: "How are affiliate links primarily tracked?",
              options: ["Using customer survey phone calls", "Via unique URL parameters and browser cookies that trace transactions back to the referrer", "Through paper invoices submitted manually", "Using manual social media hashtags only"],
              correctAnswer: 1,
              explanation: "Tracking URLs assign browser cookies to visitors, ensuring sales are accredited to the correct affiliate creator."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-30",
    category: "Digital Marketing",
    title: "30. Video Marketing & Short-Form Content",
    description: "Produce engaging marketing videos for multiple platforms.",
    lessons: [
      {
        id: "lesson-30-1",
        title: "30.1 Short-Form Video Scripting & Production",
        description: "Draft rapid pacing scripts, film crisp educational tutorials, and optimize visual graphics.",
        duration: "20 mins",
        markdownContent: `### Producing Conversion Videos
High-hook short videos are now the default consumer media choice:
- **Pacing**: Cut every pause, breath, and dead space to maintain extreme engagement velocity.
- **Caption Overlays**: Over 70% of social media users watch video with the sound off. Burn captions directly into your frames.
- **Visual Pattern Interrupts**: Zooming, text slides, and B-roll inserts every 3 seconds to keep eyes glued to the screen.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-30-1-1",
              question: "Why are burned-in captions essential for social media video marketing?",
              options: ["They decrease file export size", "They guarantee proper audio syncing on older devices", "A huge percentage of users watch social feeds silently; captions retain their comprehension and interest", "They are legally mandated for all websites"],
              correctAnswer: 2,
              explanation: "Captions accommodate silent-scrolling habits, ensuring your marketing hook is comprehended without audio."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-31",
    category: "Digital Marketing",
    title: "31. Marketing Analytics & Reporting",
    description: "Analyze KPIs, attribution, ROI, and campaign performance.",
    lessons: [
      {
        id: "lesson-31-1",
        title: "31.1 Attribution Modeling & Core KPI Auditing",
        description: "Compare first-touch, last-touch, and data-driven multi-channel attribution networks.",
        duration: "25 mins",
        markdownContent: `### Attribution Modeling
Understanding which channels deserve credit for a purchase is a core analytical challenge:
- **First-Touch Attribution**: Gives 100% credit to the first ad click (great for top-of-funnel tracking).
- **Last-Touch Attribution**: Gives 100% credit to the final ad clicked before buying.
- **Data-Driven (GA4 Default)**: Uses machine learning to distribute credit across all user touchpoints based on conversion probability.
- **UTM Tracking**: Custom URL codes (source, medium, campaign) appended to ad links to trace traffic origins.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-31-1-1",
              question: "What is the primary function of GA4's default 'Data-Driven Attribution'?",
              options: ["It attributes 100% of sales to Google Organic Search", "It uses historical machine learning to distribute credit across all marketing touchpoints fairly based on conversion impact", "It deletes duplicate customer contact entries", "It calculates your tax liability based on spend"],
              correctAnswer: 1,
              explanation: "Data-driven attribution analyzes multiple customer paths to mathematically assign value to each touchpoint."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-32",
    category: "Digital Marketing",
    title: "32. Freelancing & Client Acquisition",
    description: "Win clients, write proposals, price services, and manage projects.",
    lessons: [
      {
        id: "lesson-32-1",
        title: "32.1 High-Ticket Proposals & Client Prospecting",
        description: "Draft win-ready retainer proposals, negotiate pricing tiers, and master warm outbound outreach.",
        duration: "20 mins",
        markdownContent: `### Launching a Freelance Career
To win high-paying marketing retainers, shift from selling services to selling outcomes:
- **Value-Based Pricing**: Pricing your work based on expected business impact (e.g., charging $2k/mo because you expect to drive $10k in sales) rather than hourly tracking.
- **Outcome-Focused Proposals**: Detailing your 90-day plan and growth projections, not just listing daily tasks.
- **Inbound Positioning**: Building search optimization and case studies that attract clients to you organically.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-32-1-1",
              question: "What is 'Value-Based Pricing' in freelancing?",
              options: ["Charging the cheapest rate in your local city", "Pricing your services based on the financial outcomes and value delivered to the client's business, rather than hourly metrics", "Letting the client pick any pricing they prefer", "Charging a flat 10 dollars for all projects"],
              correctAnswer: 1,
              explanation: "Value-based pricing aligns your fees with the economic growth you generate, securing premium compensation."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-33",
    category: "Digital Marketing",
    title: "33. Digital Marketing Agency Management",
    description: "Build and scale an agency, hire teams, create SOPs, and manage operations.",
    lessons: [
      {
        id: "lesson-33-1",
        title: "33.1 Scaling Agency Operations & SOPs",
        description: "Formulate standard operating procedures (SOPs), delegate ad setups, and scale client delivery.",
        duration: "20 mins",
        markdownContent: `### Transitioning to an Agency
An agency owner focuses on building systems so that client work continues to scale without their daily input:
- **SOPs (Standard Operating Procedures)**: Step-by-step documentation detailing exactly how to perform recurring tasks (e.g., 'Pixel Setup SOP').
- **Account Management**: Utilizing team hubs (Slack, ClickUp) to delegate task delivery without missing client deadlines.
- **Contractor/Team Hiring**: Bringing in specialized media buyers and content designers, allowing you to focus purely on high-level growth.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-33-1-1",
              question: "What is the primary role of a Standard Operating Procedure (SOP) in an agency?",
              options: ["To process client credit cards", "To document exact step-by-step workflows so tasks can be delegated uniformly to team members", "To design ad graphics in bulk", "To host company holiday schedules"],
              correctAnswer: 1,
              explanation: "SOPs capture internal execution guidelines, assuring high-quality client results even when tasks are delegated."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-34",
    category: "Digital Marketing",
    title: "34. Career Development & Interview Preparation",
    description: "Build resumes, portfolios, LinkedIn profiles, and prepare for interviews.",
    lessons: [
      {
        id: "lesson-34-1",
        title: "34.1 Building a Conversion-Ready Marketing Portfolio",
        description: "Format metrics-first marketing resumes, design case studies, and excel at technical strategy interviews.",
        duration: "20 mins",
        markdownContent: `### Securing Elite Marketing Roles
Hiring managers evaluate candidates based on their track record and proof of growth:
- **Case Study Portfolio**: Instead of stating 'I managed ads', use: 'Scaled a direct-response campaign from $1k to $5k spend while dropping CPA by 25%'. Include metrics, screenshots, and strategies.
- **LinkedIn Profile Optimization**: Appending keyword-rich headlines (e.g. 'Paid Media Specialist | E-commerce Growth') to capture recruiter outreach.
- **Technical Mock Preparation**: Preparing to walk interviewers through live funnels, conversion pixels, and campaign audits.`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-34-1-1",
              question: "How should a digital marketer frame accomplishments on their resume?",
              options: ["By listing generic job duties such as 'managed social media profiles'", "By focusing on metrics-first outcomes (e.g., spending, conversion rate improvements, CPA reductions)", "By keeping the resume entirely blank to build suspense", "By listing high school test scores only"],
              correctAnswer: 1,
              explanation: "Hiring managers seek results. Quantifying your impact with exact numbers validates your marketing competence."
            }
          ]
        }
      }
    ]
  },
  {
    id: "module-35",
    category: "Digital Marketing",
    title: "35. Capstone Project & Industry Certification",
    description: "Execute a complete digital marketing strategy for a real or simulated business and present the results.",
    lessons: [
      {
        id: "lesson-35-1",
        title: "35.1 Capstone Submission & Pitch Deck Guidelines",
        description: "Compile funnel strategies, budget breakdowns, ad variants, and present your campaign roadmap.",
        duration: "30 mins",
        markdownContent: `### The Masterclass Capstone Brief
This final milestone requires you to assemble a comprehensive, client-ready Marketing Pitch:

1. **Brand Brief & Persona**: Specify your target business, market positioning, and a complete buyer persona profile.
2. **Organic Engine**: Map your primary keyword clusters, Meta Tags, and a 30-day organic content distribution calendar.
3. **Paid Performance**: Specify ad budgets, channel splits (Search vs. Social), and draft 2 ad copy variations (using AIDA and PAS).
4. **Interactive Sandbox Model**: Display calculated CTR, CPC, CPA, Conversion Rates, and projected ROI figures.
5. **Presentation**: Submit your final written proposal. Once approved, you will graduate and secure your Masterclass Certificate of Excellence!`,
        resources: [],
        quiz: {
          questions: [
            {
              id: "q-35-1-1",
              question: "What is the ultimate objective of the Capstone Project?",
              options: ["To write a personal blog post", "To synthesize all course elements (funnels, SEO, Paid Ads, Copy, Analytics) into a cohesive professional proposal", "To take a multiple-choice exam", "To build a custom databases framework"],
              correctAnswer: 1,
              explanation: "The capstone project acts as a real-world simulation, demonstrating your end-to-end expertise to prospective clients or employers."
            }
          ]
        }
      }
    ]
  }
];

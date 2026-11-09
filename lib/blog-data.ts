export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  content: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'how-to-identify-fake-job-vacancies-in-nigeria',
    title: 'How to Identify Fake Job Vacancies in Lagos & Abuja: The 2026 Anti-Scam Guide',
    excerpt: 'From vague SMS interview invites in Maryland to upfront aptitude test fees, here are the non-negotiable red flags every Nigerian graduate must know.',
    category: 'Job Search Safety',
    date: 'November 4, 2026',
    readTime: '6 min read',
    content: `
      Employment scams in Nigeria have grown increasingly sophisticated. Every month, thousands of graduates waste scarce transport money traveling to fraudulent "interviews" in Ikeja, Maryland, Garki, or Port Harcourt.
      
      Here are the 5 universal red flags:
      1. **Unsolicited SMS Invitations:** If you received an SMS invitation to an interview for a role you never applied for, mentioning generic phrases like "Operations Officer" or "Customer Consultant" at an obscure plaza, it is almost certainly a marketing syndicate.
      2. **Demands for Any Upfront Fee:** Real employers and accredited headhunters will NEVER ask an applicant to pay for aptitude test registration, medical examinations, or training materials.
      3. **Free Webmail Contact Addresses:** Legitimate corporate organizations recruit using corporate email domains (e.g., careers@accessbankplc.com), not generic Yahoo or Gmail accounts.
      4. **Vague Job Descriptions:** Real postings outline specific KPIs, department structures, and educational requirements.
      5. **High Pressure Tactics:** Scammers push for immediate deposits or "orientation booking fees" before the day ends.
      
      At JobNexa, our verification desk screens corporate registrations and HR contacts before any opportunity is unlocked for our members.
    `
  },
  {
    slug: 'the-ultimate-nysc-ppa-playbook',
    title: 'The Ultimate NYSC PPA Playbook: How to Secure a High-Stipend Placement',
    excerpt: 'Serving your country shouldn’t mean financial hardship. Step-by-step strategies to land top corporate PPAs paying above the statutory federal allowee.',
    category: 'NYSC & Youth Growth',
    date: 'October 28, 2026',
    readTime: '8 min read',
    content: `
      Every year, over 300,000 corps members are deployed across Nigeria. While many accept automatic placements at underfunded community secondary schools, proactive corps members secure high-impact corporate Place of Primary Assignment (PPA) roles.
      
      Key Steps to Secure a Prime PPA:
      1. **Apply Before Orientation Camp Closes:** Corporate firms in Lagos, Abuja, and Port Harcourt plan their corps member quotas months ahead. Reach out to HR desks early during your 3-week camp.
      2. **Highlight Immediate Value:** Highlight proficiency in Excel, graphic design, social media operations, or programming on your 1-page CV.
      3. **Target Structured PPAs:** Commercial banks, insurance companies, fintech hubs, and private secondary schools frequently provide stipends between ₦80,000 and ₦150,000 alongside statutory federal allowance.
      
      Explore our dedicated NYSC PPA section on JobNexa to find verified vacancies actively welcoming corps members.
    `
  },
  {
    slug: 'landing-remote-usd-jobs-from-nigeria',
    title: 'Landing Remote USD Jobs from Nigeria: Invoicing & Getting Paid',
    excerpt: 'A comprehensive guide for Nigerian software engineers, content creators, and virtual assistants seeking international contracts and remote compensation.',
    category: 'Remote Work',
    date: 'October 15, 2026',
    readTime: '10 min read',
    content: `
      Earning in strong foreign currencies like USD, GBP, or EUR has become the primary financial hedge for Nigerian professionals navigating local currency devaluation.
      
      How to Position for Global Contracts:
      - **Asynchronous Communication:** International remote teams value written clarity above all else. Structure your cover letters and communications with bullet points and clear deadlines.
      - **Portfolio Over Certificates:** International recruiters rarely prioritize local degree classifications; they evaluate live GitHub repositories, published design files, or verifiable case studies.
      - **Banking & Invoicing Rails:** Ensure you have compliant domiciliary accounts (GTBank, Zenith, Access) or fintech accounts (Geegpay, Grey, Payoneer) ready to receive direct wire transfers.
    `
  }
];

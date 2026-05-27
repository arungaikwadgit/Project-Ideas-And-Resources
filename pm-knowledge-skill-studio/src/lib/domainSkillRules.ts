import type { SuggestedSkill } from '../types'
import { v4 as uuid } from 'uuid'

// ---------------------------------------------------------------------------
// Input shape
// ---------------------------------------------------------------------------

interface SkillSuggestionInput {
  domainKey: string
  domainName: string
  selectedRoleIds: string[]
  workflows: string[]
  risks: string[]
  complianceItems: string[]
  integrations: string[]
  selectedDomains: string[]
}

// ---------------------------------------------------------------------------
// Role-to-skill mapping
// ---------------------------------------------------------------------------

interface RoleSkillTemplate {
  name: string
  category: string
  description: string
}

const ROLE_SKILL_MAP: Record<string, RoleSkillTemplate[]> = {
  // Product Manager
  pm: [
    {
      name: 'Requirements Elicitation',
      category: 'Discovery',
      description: 'Gathering, analyzing, and documenting stakeholder requirements through interviews, workshops, and observation.',
    },
    {
      name: 'Roadmap Planning',
      category: 'Strategy',
      description: 'Creating and maintaining a product roadmap that balances business goals, user needs, and technical constraints.',
    },
    {
      name: 'Stakeholder Management',
      category: 'Communication',
      description: 'Identifying, engaging, and managing expectations of all stakeholders across the product lifecycle.',
    },
    {
      name: 'User Story Writing',
      category: 'Agile',
      description: 'Writing clear, concise, and testable user stories with appropriate acceptance criteria.',
    },
    {
      name: 'Prioritization Frameworks',
      category: 'Strategy',
      description: 'Applying frameworks like RICE, MoSCoW, or ICE to prioritize features and backlog items objectively.',
    },
    {
      name: 'Market & Competitive Analysis',
      category: 'Research',
      description: 'Researching market trends, competitive landscape, and positioning to inform product strategy.',
    },
    {
      name: 'Go-to-Market Planning',
      category: 'Launch',
      description: 'Coordinating cross-functional GTM activities including marketing, sales enablement, and release communication.',
    },
    {
      name: 'Metrics & OKR Definition',
      category: 'Analytics',
      description: 'Defining success metrics, KPIs, and OKRs aligned to business outcomes.',
    },
  ],

  // Product Owner
  po: [
    {
      name: 'Backlog Refinement',
      category: 'Agile',
      description: 'Continuously grooming the product backlog to ensure items are ready for sprint planning.',
    },
    {
      name: 'Sprint Planning',
      category: 'Agile',
      description: 'Collaborating with the team to plan sprints, define sprint goals, and commit to deliverables.',
    },
    {
      name: 'Acceptance Criteria Definition',
      category: 'Quality',
      description: 'Writing precise acceptance criteria that define when a user story is complete and testable.',
    },
    {
      name: 'Story Mapping',
      category: 'Discovery',
      description: 'Creating user story maps to visualize the full user journey and identify MVP scope.',
    },
    {
      name: 'Stakeholder Communication',
      category: 'Communication',
      description: 'Communicating sprint progress, blockers, and decisions to stakeholders in a clear and timely manner.',
    },
    {
      name: 'Definition of Done Governance',
      category: 'Quality',
      description: 'Maintaining and enforcing the team\'s Definition of Done to ensure consistent quality.',
    },
    {
      name: 'Dependency Management',
      category: 'Agile',
      description: 'Identifying, tracking, and resolving dependencies between teams and systems.',
    },
    {
      name: 'Release Planning',
      category: 'Launch',
      description: 'Planning and coordinating software releases, including feature flags and rollout strategies.',
    },
  ],

  // Business Analyst
  ba: [
    {
      name: 'Business Process Modeling',
      category: 'Analysis',
      description: 'Documenting and analyzing business processes using tools like BPMN, swimlane diagrams, or flowcharts.',
    },
    {
      name: 'Use Case Development',
      category: 'Analysis',
      description: 'Writing detailed use cases that capture system interactions and business logic.',
    },
    {
      name: 'Data Analysis & Interpretation',
      category: 'Analytics',
      description: 'Analyzing structured and unstructured data to derive insights that inform requirements.',
    },
    {
      name: 'Gap Analysis',
      category: 'Analysis',
      description: 'Identifying gaps between current and desired states to define the scope of change.',
    },
    {
      name: 'Feasibility Assessment',
      category: 'Strategy',
      description: 'Evaluating the technical, financial, and operational feasibility of proposed solutions.',
    },
    {
      name: 'Requirements Traceability',
      category: 'Quality',
      description: 'Maintaining traceability between business requirements, design decisions, and test cases.',
    },
    {
      name: 'SQL & Data Querying',
      category: 'Technical',
      description: 'Writing SQL queries to extract, validate, and analyze data in support of business analysis.',
    },
    {
      name: 'Workshop Facilitation',
      category: 'Communication',
      description: 'Facilitating discovery workshops, design sprints, and requirements-gathering sessions.',
    },
  ],

  // UX Designer / Researcher
  ux: [
    {
      name: 'User Research',
      category: 'Research',
      description: 'Conducting qualitative and quantitative user research to understand needs, behaviors, and pain points.',
    },
    {
      name: 'Persona Development',
      category: 'Research',
      description: 'Creating data-backed user personas to guide product and design decisions.',
    },
    {
      name: 'Wireframing & Prototyping',
      category: 'Design',
      description: 'Creating low and high-fidelity wireframes and interactive prototypes for usability testing.',
    },
    {
      name: 'Usability Testing',
      category: 'Research',
      description: 'Planning and conducting usability studies to validate designs and identify usability issues.',
    },
    {
      name: 'Information Architecture',
      category: 'Design',
      description: 'Structuring and organizing content and navigation to optimize user findability.',
    },
    {
      name: 'Design System Management',
      category: 'Design',
      description: 'Contributing to and maintaining a shared design system for consistency across the product.',
    },
    {
      name: 'Accessibility (WCAG)',
      category: 'Quality',
      description: 'Ensuring designs and implementations meet WCAG accessibility guidelines.',
    },
    {
      name: 'Journey Mapping',
      category: 'Research',
      description: 'Creating end-to-end customer journey maps to identify opportunities and pain points.',
    },
  ],

  // Scrum Master / Agile Coach
  sm: [
    {
      name: 'Scrum Facilitation',
      category: 'Agile',
      description: 'Facilitating Scrum ceremonies: stand-ups, sprint planning, reviews, and retrospectives.',
    },
    {
      name: 'Impediment Removal',
      category: 'Agile',
      description: 'Proactively identifying and removing blockers that prevent the team from delivering value.',
    },
    {
      name: 'Team Coaching',
      category: 'Leadership',
      description: 'Coaching team members and leaders in agile mindset, values, and practices.',
    },
    {
      name: 'Velocity & Capacity Planning',
      category: 'Analytics',
      description: 'Tracking team velocity and using capacity data to support realistic sprint commitments.',
    },
    {
      name: 'Retrospective Techniques',
      category: 'Agile',
      description: 'Applying diverse retrospective formats to drive continuous improvement.',
    },
    {
      name: 'Conflict Resolution',
      category: 'Leadership',
      description: 'Mediating team conflicts and fostering a psychologically safe working environment.',
    },
    {
      name: 'Scaled Agile (SAFe / LeSS)',
      category: 'Agile',
      description: 'Coordinating agile practices across multiple teams in scaled frameworks.',
    },
    {
      name: 'Metrics & Reporting',
      category: 'Analytics',
      description: 'Tracking and communicating agile metrics (burndown, cycle time, lead time) to stakeholders.',
    },
  ],

  // Engineering / Technical Lead
  tech: [
    {
      name: 'Technical Architecture Review',
      category: 'Technical',
      description: 'Reviewing and contributing to system architecture decisions and trade-off analysis.',
    },
    {
      name: 'API Design',
      category: 'Technical',
      description: 'Designing RESTful or GraphQL APIs with clear contracts, versioning, and documentation.',
    },
    {
      name: 'Technical Debt Management',
      category: 'Technical',
      description: 'Identifying, documenting, and planning remediation of technical debt.',
    },
    {
      name: 'Code Review',
      category: 'Quality',
      description: 'Conducting thorough code reviews that improve quality and knowledge sharing.',
    },
    {
      name: 'CI/CD Pipeline Management',
      category: 'DevOps',
      description: 'Designing and maintaining continuous integration and deployment pipelines.',
    },
    {
      name: 'Security Review',
      category: 'Security',
      description: 'Performing security reviews of designs and code to identify vulnerabilities.',
    },
    {
      name: 'Performance Optimization',
      category: 'Technical',
      description: 'Identifying and resolving performance bottlenecks in applications and infrastructure.',
    },
    {
      name: 'Documentation',
      category: 'Communication',
      description: 'Writing and maintaining technical documentation, ADRs, and runbooks.',
    },
  ],

  // Data / Analytics
  data: [
    {
      name: 'KPI Framework Design',
      category: 'Analytics',
      description: 'Designing a coherent framework of KPIs and metrics aligned to business objectives.',
    },
    {
      name: 'Dashboard Design',
      category: 'Analytics',
      description: 'Designing informative and actionable dashboards for business stakeholders.',
    },
    {
      name: 'A/B Testing & Experimentation',
      category: 'Analytics',
      description: 'Designing, running, and interpreting A/B tests and product experiments.',
    },
    {
      name: 'Data Modeling',
      category: 'Technical',
      description: 'Designing data models that support analytical and reporting requirements.',
    },
    {
      name: 'Statistical Analysis',
      category: 'Analytics',
      description: 'Applying statistical methods to draw valid conclusions from product and business data.',
    },
    {
      name: 'Funnel & Cohort Analysis',
      category: 'Analytics',
      description: 'Analyzing user funnels and cohorts to identify drop-off points and retention trends.',
    },
    {
      name: 'Data Governance',
      category: 'Governance',
      description: 'Defining data ownership, quality standards, and governance policies.',
    },
    {
      name: 'ETL / Data Pipeline Awareness',
      category: 'Technical',
      description: 'Understanding ETL processes and data pipeline architecture to collaborate effectively with data engineering.',
    },
  ],
}

// ---------------------------------------------------------------------------
// Domain-specific skill overrides
// ---------------------------------------------------------------------------

const DOMAIN_SKILL_MAP: Record<string, RoleSkillTemplate[]> = {
  healthcare: [
    {
      name: 'HIPAA Compliance',
      category: 'Compliance',
      description: 'Understanding and applying HIPAA privacy and security rules to healthcare products.',
    },
    {
      name: 'Clinical Workflow Understanding',
      category: 'Domain',
      description: 'Knowledge of clinical workflows and how technology integrates with patient care.',
    },
    {
      name: 'HL7 / FHIR Standards',
      category: 'Technical',
      description: 'Understanding healthcare interoperability standards for data exchange.',
    },
  ],
  finance: [
    {
      name: 'Financial Regulatory Compliance',
      category: 'Compliance',
      description: 'Understanding regulations such as SOX, PCI-DSS, and GDPR as they apply to financial products.',
    },
    {
      name: 'Risk & Control Framework',
      category: 'Governance',
      description: 'Applying risk management frameworks like COSO or ISO 31000 in product development.',
    },
  ],
  ecommerce: [
    {
      name: 'Conversion Rate Optimization',
      category: 'Analytics',
      description: 'Applying CRO techniques to improve user conversion across the funnel.',
    },
    {
      name: 'Catalog & Inventory Management',
      category: 'Domain',
      description: 'Understanding product catalog structures, inventory systems, and fulfillment workflows.',
    },
  ],
  saas: [
    {
      name: 'Subscription & Billing Models',
      category: 'Domain',
      description: 'Understanding SaaS subscription models, pricing tiers, and billing integrations.',
    },
    {
      name: 'Customer Success Metrics',
      category: 'Analytics',
      description: 'Tracking and acting on NPS, churn, expansion revenue, and health scores.',
    },
  ],
  logistics: [
    {
      name: 'Supply Chain Awareness',
      category: 'Domain',
      description: 'Understanding supply chain concepts: procurement, inventory, warehousing, and last-mile delivery.',
    },
    {
      name: 'Real-time Tracking & IOT',
      category: 'Technical',
      description: 'Familiarity with real-time tracking systems and IoT sensors in logistics contexts.',
    },
  ],
}

// ---------------------------------------------------------------------------
// Cross-domain skills
// ---------------------------------------------------------------------------

const CROSS_DOMAIN_SKILLS: RoleSkillTemplate[] = [
  {
    name: 'Cross-Domain Requirements Analysis',
    category: 'Analysis',
    description: 'Identifying and resolving conflicting requirements across multiple product domains.',
  },
  {
    name: 'Integration Architecture Understanding',
    category: 'Technical',
    description: 'Understanding how multiple domain systems integrate via APIs, events, or shared data models.',
  },
  {
    name: 'Multi-Stakeholder Alignment',
    category: 'Communication',
    description: 'Aligning stakeholders from different business domains on shared product decisions.',
  },
  {
    name: 'Cross-Domain Data Governance',
    category: 'Governance',
    description: 'Establishing data ownership and quality standards across multiple business domains.',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function templateToSuggested(
  template: RoleSkillTemplate,
  roleId: string,
  domainKey: string,
  domainId: string,
  whySuggested: string,
  isCrossDomain: boolean,
): SuggestedSkill {
  return {
    id: uuid(),
    name: template.name,
    roleId,
    category: template.category,
    description: template.description,
    maturityLevel: 'Developing',
    whySuggested,
    linkedDomainId: domainId,
    linkedArtifacts: [],
    isCrossDomainSkill: isCrossDomain,
  }
}

function deduplicateByName(skills: SuggestedSkill[]): SuggestedSkill[] {
  const seen = new Set<string>()
  return skills.filter((skill) => {
    const key = skill.name.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Deterministically suggests skills based on domain and role context.
 * Does not require AI — uses hardcoded mappings.
 */
export function suggestSkillsForDomain(input: SkillSuggestionInput): SuggestedSkill[] {
  const {
    domainKey,
    domainName,
    selectedRoleIds,
    selectedDomains,
  } = input

  const domainId = domainKey || domainName.toLowerCase().replace(/\s+/g, '-')
  const skills: SuggestedSkill[] = []

  // 1. Role-specific skills
  for (const roleId of selectedRoleIds) {
    const normalizedRoleId = roleId.toLowerCase().replace(/[^a-z]/g, '')

    // Try exact match first, then partial match
    const roleKey = Object.keys(ROLE_SKILL_MAP).find(
      (key) => normalizedRoleId === key || normalizedRoleId.includes(key) || key.includes(normalizedRoleId),
    )

    if (roleKey) {
      const templates = ROLE_SKILL_MAP[roleKey]
      for (const template of templates) {
        skills.push(
          templateToSuggested(
            template,
            roleId,
            domainKey,
            domainId,
            `Recommended for the ${roleId} role when working in the ${domainName} domain.`,
            false,
          ),
        )
      }
    }
  }

  // 2. Domain-specific skills
  const domainKeyLower = domainKey.toLowerCase()
  const matchedDomainKey = Object.keys(DOMAIN_SKILL_MAP).find(
    (key) => domainKeyLower.includes(key) || key.includes(domainKeyLower),
  )

  if (matchedDomainKey) {
    const domainTemplates = DOMAIN_SKILL_MAP[matchedDomainKey]
    const primaryRoleId = selectedRoleIds[0] || 'general'
    for (const template of domainTemplates) {
      skills.push(
        templateToSuggested(
          template,
          primaryRoleId,
          domainKey,
          domainId,
          `Required for working in the ${domainName} domain (${matchedDomainKey}-specific skill).`,
          false,
        ),
      )
    }
  }

  // 3. Cross-domain skills (only when multiple domains are selected)
  if (selectedDomains.length > 1) {
    const primaryRoleId = selectedRoleIds[0] || 'general'
    for (const template of CROSS_DOMAIN_SKILLS) {
      skills.push(
        templateToSuggested(
          template,
          primaryRoleId,
          domainKey,
          domainId,
          `Relevant when working across multiple domains: ${selectedDomains.join(', ')}.`,
          true,
        ),
      )
    }
  }

  return deduplicateByName(skills)
}

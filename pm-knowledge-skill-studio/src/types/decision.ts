export interface Decision {
  id: string
  title: string
  context: string
  optionsConsidered: string[]
  decisionMade: string
  rationale: string
  status: string
  linkedProjectId?: string
  linkedDomainIds: string[]
  decisionBy: string
  decisionDate: string
  reviewDate?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

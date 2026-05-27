export type SkillMaturityLevel = 'Beginner' | 'Developing' | 'Proficient' | 'Advanced' | 'Expert'

export interface Skill {
  id: string
  name: string
  roleId: string
  category: string
  description: string
  maturityLevel: SkillMaturityLevel
  evidenceNotes: string
  practiceNotes: string
  reflectionNotes: string
  linkedDomainIds: string[]
  linkedArtifacts: string[]
  isCrossDomainSkill: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface SuggestedSkill {
  id: string
  name: string
  roleId: string
  category: string
  description: string
  maturityLevel: SkillMaturityLevel
  whySuggested: string
  linkedDomainId: string
  linkedArtifacts: string[]
  isCrossDomainSkill: boolean
}

export interface SkillCatalogItem {
  id: string
  name: string
  category: string
  description: string
  maturityLevels: string[]
  relatedRoleIds: string[]
  relatedDomains: string[]
}

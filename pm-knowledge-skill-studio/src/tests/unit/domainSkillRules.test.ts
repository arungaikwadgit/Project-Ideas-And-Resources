import { describe, it, expect } from 'vitest'
import { suggestSkillsForDomain } from '../../lib/domainSkillRules'

const baseInput = {
  domainKey: 'ecommerce',
  domainName: 'E-commerce / Marketplace',
  selectedRoleIds: ['pm'],
  workflows: ['Product listing', 'Order management'],
  risks: ['Payment fraud'],
  complianceItems: ['PCI-DSS'],
  integrations: ['Stripe', 'Shopify'],
  selectedDomains: ['ecommerce'],
}

describe('suggestSkillsForDomain', () => {
  it('returns skills for Product Manager role', () => {
    const skills = suggestSkillsForDomain(baseInput)
    expect(skills.length).toBeGreaterThan(0)
    expect(skills.some(s => s.roleId === 'pm')).toBe(true)
  })

  it('returns cross-domain skills for multiple domains', () => {
    const skills = suggestSkillsForDomain({ ...baseInput, selectedDomains: ['ecommerce', 'fintech'] })
    expect(skills.some(s => s.isCrossDomainSkill)).toBe(true)
  })

  it('returns no duplicate skill names per role', () => {
    const skills = suggestSkillsForDomain(baseInput)
    const pmSkills = skills.filter(s => s.roleId === 'pm').map(s => s.name)
    expect(pmSkills.length).toBe(new Set(pmSkills).size)
  })

  it('handles empty role selection', () => {
    const skills = suggestSkillsForDomain({ ...baseInput, selectedRoleIds: [] })
    expect(Array.isArray(skills)).toBe(true)
  })

  it('handles multiple roles', () => {
    const skills = suggestSkillsForDomain({ ...baseInput, selectedRoleIds: ['pm', 'ba'] })
    expect(skills.some(s => s.roleId === 'pm')).toBe(true)
    expect(skills.some(s => s.roleId === 'ba')).toBe(true)
  })

  it('each skill has required fields', () => {
    const skills = suggestSkillsForDomain(baseInput)
    skills.forEach(skill => {
      expect(skill.id).toBeTruthy()
      expect(skill.name).toBeTruthy()
      expect(skill.roleId).toBeTruthy()
      expect(skill.category).toBeTruthy()
      expect(['Beginner', 'Developing', 'Proficient', 'Advanced', 'Expert']).toContain(skill.maturityLevel)
    })
  })
})

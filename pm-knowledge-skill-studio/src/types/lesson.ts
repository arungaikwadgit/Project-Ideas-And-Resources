export interface LessonLearned {
  id: string
  title: string
  situation: string
  whatWorked: string
  whatDidNotWork: string
  rootCause: string
  futureAction: string
  category: string
  linkedProjectId?: string
  linkedDomainIds: string[]
  linkedSkillIds: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

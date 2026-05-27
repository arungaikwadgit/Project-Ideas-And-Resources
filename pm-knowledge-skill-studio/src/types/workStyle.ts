export interface WorkStyleSection {
  id: string
  title: string
  contentMarkdown: string
  placeholder: string
  updatedAt: string
}

export interface WorkStyle {
  id: string
  title: string
  sections: WorkStyleSection[]
  createdAt: string
  updatedAt: string
}

const BASE_PATH = '/pm-knowledge-skill-studio'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Loads and parses a JSON configuration file from the public config directory.
 *
 * @param configPath  Relative path within /pm-knowledge-skill-studio/config/
 *                    e.g. 'roles.json' or 'sdlc/phases.json'
 * @returns           Parsed JSON as the requested type T
 * @throws            Descriptive error if the file cannot be fetched or parsed
 */
export async function loadConfig<T>(configPath: string): Promise<T> {
  const url = `${BASE_PATH}/config/${configPath}`

  let response: Response
  try {
    response = await fetch(url)
  } catch (err) {
    throw new Error(
      `Failed to fetch config "${configPath}": network error. ` +
        `(URL: ${url}) ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  if (!response.ok) {
    throw new Error(
      `Failed to load config "${configPath}": HTTP ${response.status} ${response.statusText}. (URL: ${url})`,
    )
  }

  let json: T
  try {
    json = (await response.json()) as T
  } catch (err) {
    throw new Error(
      `Failed to parse config "${configPath}" as JSON. ` +
        `(URL: ${url}) ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  return json
}

/**
 * Loads a markdown template file from the public templates directory.
 *
 * @param templateName  Relative path within /pm-knowledge-skill-studio/templates/
 *                      e.g. 'domain-knowledge.md' or 'prompts/prd-template.md'
 * @returns             Template content as a string
 * @throws              Descriptive error if the file cannot be fetched
 */
export async function loadTemplate(templateName: string): Promise<string> {
  const url = `${BASE_PATH}/templates/${templateName}`

  let response: Response
  try {
    response = await fetch(url)
  } catch (err) {
    throw new Error(
      `Failed to fetch template "${templateName}": network error. ` +
        `(URL: ${url}) ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  if (!response.ok) {
    throw new Error(
      `Failed to load template "${templateName}": HTTP ${response.status} ${response.statusText}. (URL: ${url})`,
    )
  }

  let text: string
  try {
    text = await response.text()
  } catch (err) {
    throw new Error(
      `Failed to read template "${templateName}" as text. ` +
        `(URL: ${url}) ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  return text
}

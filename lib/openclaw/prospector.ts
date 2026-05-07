// OpenClaw Prospector — finds North Jersey businesses and verifies emails.
//
// External APIs needed (add keys to .env):
//   GOOGLE_MAPS_API_KEY  — Google Places API (Text Search)
//   HUNTER_API_KEY       — Hunter.io domain search + email verification
//
// Until keys are set, findProspects() returns an empty array and
// verifyEmail() returns { valid: false, reason: 'not_configured' }.

export interface ProspectResult {
  business_name: string
  business_type: string
  address: string
  city: string
  state: string
  postal_code: string
  phone: string | null
  website: string | null
  google_place_id: string | null
}

export interface EmailVerifyResult {
  email: string
  valid: boolean
  reason: 'verified' | 'risky' | 'invalid' | 'not_found' | 'not_configured' | 'error'
  score?: number
}

// Target business types for North Jersey B2B prospecting
const PROSPECT_QUERIES = [
  'real estate office',
  'dental office',
  'medical office',
  'law firm',
  'auto dealership',
  'accounting firm',
  'insurance agency',
  'coworking space',
]

// North Jersey ZIP codes to cycle through
const NJ_SEARCH_LOCATIONS = [
  '07601', // Hackensack
  '07450', // Ridgewood
  '07470', // Wayne
  '07030', // Hoboken
  '07042', // Montclair
  '07652', // Paramus
  '07060', // Plainfield
  '07083', // Union
]

export async function findProspects(count = 5): Promise<ProspectResult[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.log('[OpenClaw/Prospector] GOOGLE_MAPS_API_KEY not set — returning empty list.')
    return []
  }

  const results: ProspectResult[] = []
  const maxAttemptsPerSlot = 3

  // Pick a random query + location combo, retry until we have `count` results
  for (let i = 0; i < count * maxAttemptsPerSlot && results.length < count; i++) {
    const query = PROSPECT_QUERIES[Math.floor(Math.random() * PROSPECT_QUERIES.length)]
    const zip = NJ_SEARCH_LOCATIONS[Math.floor(Math.random() * NJ_SEARCH_LOCATIONS.length)]

    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    url.searchParams.set('query', `${query} near ${zip} New Jersey`)
    url.searchParams.set('type', 'establishment')
    url.searchParams.set('key', apiKey)

    try {
      const res = await fetch(url.toString())
      const json = await res.json() as { results?: GooglePlace[]; status: string }

      if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
        console.error('[OpenClaw/Prospector] Google Places error:', json.status)
        break
      }

      for (const place of json.results ?? []) {
        if (results.length >= count) break
        const parsed = parseGooglePlace(place, query)
        if (parsed && !results.some((r) => r.google_place_id === parsed.google_place_id)) {
          results.push(parsed)
        }
      }
    } catch (err) {
      console.error('[OpenClaw/Prospector] Fetch error:', err)
    }
  }

  return results
}

export async function verifyEmail(domain: string, firstName: string, lastName: string): Promise<EmailVerifyResult> {
  const apiKey = process.env.HUNTER_API_KEY
  if (!apiKey) {
    console.log('[OpenClaw/Prospector] HUNTER_API_KEY not set — skipping email verify.')
    return { email: `${firstName.toLowerCase()}@${domain}`, valid: false, reason: 'not_configured' }
  }

  // Step 1: domain search to find email pattern + best contact
  try {
    const searchUrl = new URL('https://api.hunter.io/v2/domain-search')
    searchUrl.searchParams.set('domain', domain)
    searchUrl.searchParams.set('api_key', apiKey)
    searchUrl.searchParams.set('limit', '5')

    const searchRes = await fetch(searchUrl.toString())
    const searchData = await searchRes.json() as HunterDomainResponse

    // Find an email matching the contact name, or use the first available
    const emails = searchData.data?.emails ?? []
    const match = emails.find(
      (e) =>
        e.first_name?.toLowerCase() === firstName.toLowerCase() &&
        e.last_name?.toLowerCase() === lastName.toLowerCase()
    ) ?? emails[0]

    if (!match) {
      // Fall back to pattern guess
      const pattern = searchData.data?.pattern ?? '{first}.{last}'
      const guessedEmail = buildEmailFromPattern(pattern, domain, firstName, lastName)
      return { email: guessedEmail, valid: false, reason: 'not_found' }
    }

    // Step 2: verify the email
    const verifyUrl = new URL('https://api.hunter.io/v2/email-verifier')
    verifyUrl.searchParams.set('email', match.value)
    verifyUrl.searchParams.set('api_key', apiKey)

    const verifyRes = await fetch(verifyUrl.toString())
    const verifyData = await verifyRes.json() as HunterVerifyResponse
    const result = verifyData.data?.result ?? 'unknown'

    return {
      email: match.value,
      valid: result === 'deliverable',
      reason: result === 'deliverable' ? 'verified' : result === 'risky' ? 'risky' : 'invalid',
      score: verifyData.data?.score,
    }
  } catch (err) {
    console.error('[OpenClaw/Prospector] Hunter.io error:', err)
    return { email: `${firstName.toLowerCase()}@${domain}`, valid: false, reason: 'error' }
  }
}

// ---- helpers ----

function parseGooglePlace(place: GooglePlace, businessType: string): ProspectResult | null {
  const components = place.formatted_address?.split(',') ?? []
  const city = components[1]?.trim() ?? ''
  const stateZip = components[2]?.trim() ?? ''
  const [state, postal_code] = stateZip.split(' ').filter(Boolean)

  if (!postal_code || !city) return null

  return {
    business_name: place.name,
    business_type: businessType,
    address: components[0]?.trim() ?? '',
    city,
    state: state ?? 'NJ',
    postal_code,
    phone: place.formatted_phone_number ?? null,
    website: place.website ?? null,
    google_place_id: place.place_id ?? null,
  }
}

function buildEmailFromPattern(pattern: string, domain: string, firstName: string, lastName: string): string {
  const local = pattern
    .replace('{first}', firstName.toLowerCase())
    .replace('{last}', lastName.toLowerCase())
    .replace('{f}', firstName[0]?.toLowerCase() ?? '')
    .replace('{l}', lastName[0]?.toLowerCase() ?? '')
  return `${local}@${domain}`
}

// ---- Google Places API types (minimal) ----
interface GooglePlace {
  place_id: string
  name: string
  formatted_address: string
  formatted_phone_number?: string
  website?: string
}

// ---- Hunter.io API types (minimal) ----
interface HunterDomainResponse {
  data?: {
    pattern?: string
    emails: { value: string; first_name: string | null; last_name: string | null }[]
  }
}

interface HunterVerifyResponse {
  data?: {
    result: 'deliverable' | 'risky' | 'undeliverable' | 'unknown'
    score: number
  }
}

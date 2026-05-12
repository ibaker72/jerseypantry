import { createHmac } from 'node:crypto'

// DoorDash Drive uses an HS256 JWT signed with the base64url-encoded
// signing secret from the developer portal. dd-ver / dd-vid / dd-kid
// are placed in the header (in addition to alg/typ) per their spec.

interface DoorDashJwtConfig {
  developerId: string
  keyId: string
  signingSecret: string
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export function signDoorDashJwt(config: DoorDashJwtConfig, ttlSeconds = 300): string {
  const { developerId, keyId, signingSecret } = config

  const header = {
    alg: 'HS256',
    typ: 'JWT',
    'dd-ver': 'DD-JWT-V1',
    'dd-vid': developerId,
    'dd-kid': keyId,
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    aud: 'doordash',
    iss: developerId,
    kid: keyId,
    exp: now + ttlSeconds,
    iat: now,
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signingInput = `${encodedHeader}.${encodedPayload}`

  // signing_secret is base64url-encoded — decode to raw bytes before HMAC
  const keyBuf = Buffer.from(
    signingSecret.replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  )

  const signature = createHmac('sha256', keyBuf).update(signingInput).digest()
  return `${signingInput}.${base64UrlEncode(signature)}`
}

export function getDoorDashCredentials(): DoorDashJwtConfig {
  const developerId = process.env.DOORDASH_DEVELOPER_ID
  const keyId = process.env.DOORDASH_KEY_ID
  const signingSecret = process.env.DOORDASH_SIGNING_SECRET

  if (!developerId || !keyId || !signingSecret) {
    throw new Error('Missing DoorDash Drive credentials')
  }

  return { developerId, keyId, signingSecret }
}

// Edge Runtime compatible JWT utilities using Web Crypto API

/**
 * Base64 URL encoding
 */
function base64UrlEncode(data: string): string {
  return btoa(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Base64 URL decoding
 */
function base64UrlDecode(data: string): string {
  // Add padding if needed
  const padded = data + '==='.slice((data.length + 3) % 4)
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')
  return atob(base64)
}

/**
 * Generate JWT token using Web Crypto API
 */
export async function generateJWTToken(payload: any, secret: string, expiresIn: string = '24h'): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  let exp = now

  // Simple expiration parsing
  if (expiresIn === '24h') {
    exp = now + (24 * 60 * 60) // 24 hours
  }

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const tokenPayload = {
    ...payload,
    iat: now,
    exp: exp
  }

  const headerEncoded = base64UrlEncode(JSON.stringify(header))
  const payloadEncoded = base64UrlEncode(JSON.stringify(tokenPayload))

  const message = `${headerEncoded}.${payloadEncoded}`

  // Create signature using Web Crypto API
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  )

  const signatureArray = new Uint8Array(signature)
  const signatureBase64 = base64UrlEncode(String.fromCharCode(...signatureArray))

  return `${message}.${signatureBase64}`
}

/**
 * Verify JWT token using Web Crypto API
 */
export async function verifyJWTToken(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts

    // Verify signature
    const message = `${headerEncoded}.${payloadEncoded}`
    const encoder = new TextEncoder()

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    // Decode the signature
    const signatureBase64 = signatureEncoded
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    const padding = '==='.slice((signatureBase64.length + 3) % 4)
    const signatureBinary = atob(signatureBase64 + padding)
    const signatureArray = new Uint8Array(signatureBinary.length)
    for (let i = 0; i < signatureBinary.length; i++) {
      signatureArray[i] = signatureBinary.charCodeAt(i)
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureArray,
      encoder.encode(message)
    )

    if (!isValid) {
      return null
    }

    // Decode and validate payload
    const payload = JSON.parse(base64UrlDecode(payloadEncoded))

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      return null
    }

    return payload
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}

/**
 * Edge Runtime compatible session token generation
 */
export async function generateSessionToken(adminId: string): Promise<string> {
  const secret = process.env.JWT_SECRET || 'owners-recruit-admin-secret'
  return generateJWTToken({
    adminId,
    type: 'admin_session'
  }, secret, '24h')
}

/**
 * Edge Runtime compatible session token verification
 */
export async function verifySessionToken(token: string): Promise<{ adminId: string } | null> {
  try {
    const secret = process.env.JWT_SECRET || 'owners-recruit-admin-secret'
    const decoded = await verifyJWTToken(token, secret)

    if (!decoded || decoded.type !== 'admin_session') {
      return null
    }

    return { adminId: decoded.adminId }
  } catch (error) {
    console.error('Session token verification error:', error)
    return null
  }
}
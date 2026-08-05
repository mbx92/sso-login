import { createHash, randomBytes } from 'node:crypto'

function base64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

export function createPkcePair() {
  const codeVerifier = base64Url(randomBytes(32))
  const codeChallenge = base64Url(createHash('sha256').update(codeVerifier).digest())
  const state = base64Url(randomBytes(16))
  return { codeVerifier, codeChallenge, state }
}

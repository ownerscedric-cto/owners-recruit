import CryptoJS from 'crypto-js'

const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-secret-key-change-this'

export function encryptData(data: string): string {
  if (!data) return ''

  try {
    const encrypted = CryptoJS.AES.encrypt(data, SECRET_KEY).toString()
    return encrypted
  } catch (error) {
    console.error('Encryption error:', error)
    return data
  }
}

export function decryptData(encryptedData: string): string {
  if (!encryptedData) return ''

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    return decrypted || encryptedData
  } catch (error) {
    console.error('Decryption error:', error)
    return encryptedData
  }
}

export function encryptResidentNumber(residentNumber: string): string {
  return encryptData(residentNumber)
}

export function decryptResidentNumber(encryptedResidentNumber: string): string {
  return decryptData(encryptedResidentNumber)
}
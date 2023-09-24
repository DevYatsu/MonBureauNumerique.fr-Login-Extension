export function updateTabURL(tabId: number, newUrl: string) {
  chrome.tabs.update(tabId, { url: newUrl }, function (updatedTab) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError)
    } else {
      console.log('Tab URL updated successfully.')
    }
  })
}

type PupilsPagesQueries = {
  grades: string
  absences: string
  textbook: string
  moodle: string
  messages: string
}

export async function changeTabUrlParams(tabId: number, newPlace: keyof PupilsPagesQueries) {
  const query = {
    pupil: {
      grades: 'sg.do?PROC=CONSULTER_RELEVE&ACTION=AFFICHER_RELEVE_NOTES_ELEVE',
      absences: 'sg.do?PROC=GESTION_ABSENCES_TUTEUR_ELEVE&ACTION=AFFICHER_RECAPITULATIF_ABSENCES',
      textbook: 'sg.do?PROC=CLASSEUR_PEDA&ACTION=AFFICHER_ELEVES_ACCUEIL',
      moodle: 'sg.do?PROC=MOODLE',
      messages: 'sg.do?PROC=MESSAGERIE',
    },
    teacher: {}, // maybe add features to support teachers connexion as well
  }

  if (!query.pupil[newPlace]) {
    return
  }
  const url = (await chrome.tabs.get(tabId)).url
  if (url) {
    const baseURL = new URL(url)
    if (baseURL.hostname.indexOf('.monbureaunumerique.fr') != -1) {
      updateTabURL(tabId, `${baseURL.protocol}//${baseURL.host}/${query.pupil[newPlace]}`)
    }
  }
}

export async function createNewTab(): Promise<void> {
  const urlToOpen =
    'https://cas.monbureaunumerique.fr/login?service=https%3A%2F%2Fwww.monbureaunumerique.fr%2Fsg.do%3FPROC%3DIDENTIFICATION_FRONT'

  await chrome.tabs.create({ url: urlToOpen })
}

export async function checkCredentials(): Promise<void> {
  const { password, username, credentialsError } = (await chrome.storage.local.get()) as {
    password: string | undefined
    username: string | undefined
    credentialsError: true | undefined
  }

  if (credentialsError) {
    return Promise.reject(new Error('Invalid password or username'))
  }

  if (!username || !password) {
    return Promise.reject(new Error('No username or password set to connect'))
  }
}

export async function getCredentials(): Promise<{ username: string; password: string }> {
  const { username, password } = await chrome.storage.local.get()

  if (!username || !password) {
    throw new Error('Invalid getCredentials function call as credentials should be defined')
  }

  const newPassword = await decryptHashedWord(password)
  const newUsername = await decryptHashedWord(username)

  return { username: newUsername, password: newPassword }
}

export async function setIsScriptRunner() {
  await chrome.storage.session.set({ isScriptRunner: true })
}
export async function IsScriptRunner(): Promise<boolean> {
  const { isScriptRunner } = await chrome.storage.session.get()

  return !!isScriptRunner
}
export async function clearScriptRunner() {
  await chrome.storage.session.remove('isScriptRunner')
}

export async function setCrendentialsError() {
  await chrome.storage.local.set({ credentialsError: true })

  // after setting a credentials error the error can
  // only be removed when credentials are changed in options page
}

async function getCryptoKey() {
  const algorithm = { name: 'AES-GCM', length: 256 }
  const key = await crypto.subtle.generateKey(algorithm, true, ['encrypt', 'decrypt'])

  return key
}

export async function encryptWord(word: string, iv: Uint8Array) {
  const plaintext = new TextEncoder().encode(word)

  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await getCryptoKey(),
    plaintext,
  )

  return encryptedData
}

export async function decryptWord(encryptedData: ArrayBuffer, iv: Uint8Array) {
  try {
    console.log(encryptedData)

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      await getCryptoKey(),
      encryptedData,
    )
    console.log(decryptedData)

    const decryptedText = new TextDecoder().decode(decryptedData)

    return decryptedText
  } catch (error) {
    console.error('Error decrypting data:', error)
    throw error // Rethrow the error to handle it in the calling code.
  }
}

export async function generateHashedWord(word: string) {
  const { hash } = await chrome.storage.local.get()

  const iv = new Uint8Array(JSON.parse(hash))

  const encryptedResult = await encryptWord(word, iv)

  // Return an object containing the IV and encrypted data
  return encryptedResult
}

export async function decryptHashedWord(data: ArrayBuffer) {
  const { hash } = await chrome.storage.local.get()

  const iv = new Uint8Array(JSON.parse(hash))

  return await decryptWord(data, iv)
}

export function stringifyArrayBuffer(b: ArrayBuffer) {
  const arrayBufferView = new Uint8Array(b)
  const str = JSON.stringify(Array.from(arrayBufferView))
  return str
}

export function parseArrayBuffer(str: string): ArrayBuffer {
  const array = JSON.parse(str)
  const uint8Array = new Uint8Array(array)
  return uint8Array.buffer
}

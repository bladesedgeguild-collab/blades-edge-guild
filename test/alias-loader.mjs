import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const base = path.join(root, specifier.slice(2))
    const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]
    const file = candidates.find((candidate) => existsSync(candidate))
    if (!file) throw new Error(`Cannot resolve ${specifier}`)
    return nextResolve(pathToFileURL(file).href, context)
  }
  return nextResolve(specifier, context)
}

// API/src/Modules/Docker/Utils/Args.ts
import { DockerEnvironment } from 'API/Modules/Docker/Environment'

export function generateENVArgs(env: DockerEnvironment[]): string[] {
  return env.map(({ key, value }) => `${key}=${value}`)
}
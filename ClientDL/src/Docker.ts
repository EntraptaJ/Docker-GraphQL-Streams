// ClientDL/src/Container.ts
import { initApollo } from './initApollo'
import gql from 'graphql-tag'

interface Container {
  id: string
}

export const client = initApollo({ token: '', URL: 'http://localhost/graphql' })

interface DockerEnvironment {
  key: string
  value: string
}

export async function startContainer(Id: string): Promise<boolean> {
  const result = await client.mutate<{ startContainer: boolean }>({ mutation: gql`mutation { startContainer(Id: "${Id}") }` })
  return result.data.startContainer
}

export async function createContainer(image: string, env: DockerEnvironment[]): Promise<Container> {
  const result = await client.mutate<{ createContainer: Container }, { env: DockerEnvironment[] }>({ mutation: gql`mutation createContainer($env: [DockerEnvironment!]!){ createContainer(image: "${image}", env: $env) { id } }`, variables: { env } })
  return result.data.createContainer
}

export async function removeContainer(Id: string): Promise<boolean> {
  const result = await client.mutate<{ removeContainer: boolean }>({ mutation: gql`mutation { removeContainer(Id: "${Id}") }` })
  return result.data.removeContainer
}

export async function pullImage(image: string): Promise<boolean> {
  const result = await client.mutate<{ pullImage: boolean }>({ mutation: gql`mutation { pullImage(image: "${image}") }` })
  return result.data.pullImage
}
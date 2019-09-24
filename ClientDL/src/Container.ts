// ClientDL/src/Container.ts
import { initApollo } from './initApollo'
import gql from 'graphql-tag'

interface Container {
  id: string
}

export const client = initApollo({ token: '', URL: 'http://localhost/graphql' })



export async function startContainer(Id: string): Promise<boolean> {
  const result = await client.mutate<{ startContainer: boolean }>({ mutation: gql`mutation { startContainer(Id: "${Id}") }` })
  return result.data.startContainer
}

export async function createContainer(image: string): Promise<Container> {
  const result = await client.mutate<{ runContainer: Container }>({ mutation: gql`mutation { runContainer(image: "${image}") { id } }` })
  return result.data.runContainer
}

export async function removeContainer(Id: string): Promise<boolean> {
  const result = await client.mutate<{ removeContainer: boolean }>({ mutation: gql`mutation { removeContainer(Id: "${Id}") }` })
  return result.data.removeContainer
}
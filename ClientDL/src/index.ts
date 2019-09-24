import { initApollo } from './initApollo';
import gql from 'graphql-tag';
import { createContainer, startContainer, client } from './Container';
import { extract } from 'tar-fs'
import intoStream from 'into-stream'
import { decompress } from 'iltorb'


const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function startClientDL(): Promise<void> {
  const container = await createContainer('postgres:11-alpine')

  await startContainer(container.id);
  
  let i = 0;
  console.log(container)

  await timeout(10000)

  const stuff = await client.mutate({ mutation: gql`mutation { createTar(          containerId: "${container.id}"
  path: "/Stuff") }` })
  const stream = intoStream(await decompress(Buffer.from(stuff.data.createTar, 'base64')))
  const tarStream = extract('tmp')
  stream.pipe(tarStream)
}

startClientDL();

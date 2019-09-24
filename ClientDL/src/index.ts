import gql from 'graphql-tag';
import { decompressStream } from 'iltorb';
import intoStream from 'into-stream';
import pEvent from 'p-event';
import { extract } from 'tar-fs';
import {
  client,
  createContainer,
  removeContainer,
  startContainer
} from './Container';

const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function startClientDL(): Promise<void> {
  const container = await createContainer('postgres:11-alpine');

  await startContainer(container.id);

  await timeout(10000);

  const {
    data: { createTar }
  } = await client.mutate<{ createTar: string }>({
    mutation: gql`mutation { createTar(          containerId: "${container.id}"
  path: "/var/lib/postgresql/data") }`
  });
  const brotliStream = decompressStream();
  const bufferStream = intoStream(Buffer.from(createTar, 'base64'));
  const extractStream = extract('tmp');
  brotliStream.pipe(extractStream);
  bufferStream.pipe(brotliStream);

  await pEvent(extractStream, 'finish');
  console.log('Finished');
  await removeContainer(container.id);
}

startClientDL();

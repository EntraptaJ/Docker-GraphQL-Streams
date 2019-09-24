import gql from 'graphql-tag';
import { decompress } from 'iltorb';
import intoStream from 'into-stream';
import pEvent from 'p-event';
import { extract } from 'tar-fs-fixed';
import {
  client,
  createContainer,
  removeContainer,
  startContainer,
  pullImage
} from './Docker';

const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const controllerGit = 'https://github.com/Auto-Systems/vCenter-Controller.git';
const folder = controllerGit.replace(/.*\/(\w.*).git/, '$1');

async function startClientDL(): Promise<void> {
  // const successfulPull = await pullImage('docker.pkg.github.com/kristianfjones/auto-deploy/moduledl')
  // console.log('Pull Successful: ', successfulPull)
  const container = await createContainer(
    'docker.pkg.github.com/kristianfjones/auto-deploy/moduledl',
    [{ key: 'TYPE', value: folder }, { key: 'GIT_URL', value: controllerGit }]
  );

  await startContainer(container.id);

  await timeout(25000);

  const stuff: Buffer[] = [];

  client
    .subscribe<{ containerFiles: string }>({
      query: gql`subscription { containerFiles(containerId: "${container.id}", path: "/${folder}") }`
    })
    .subscribe({
      async next({ data: { containerFiles } }) {
        try {
          const buffer = await decompress(Buffer.from(containerFiles, 'hex'));
          stuff.push(buffer);
        } catch {}
      },
      complete() {
        const buffer = intoStream(Buffer.concat(stuff));
        const tarStream = extract('tmp');
        buffer.pipe(tarStream);
      }
    });
}

startClientDL();

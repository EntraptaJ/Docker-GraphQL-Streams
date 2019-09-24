// ClientTest/src/index.ts
import Dockerode from 'dockerode'
import pEvent from 'p-event'
import { writeFile } from 'fs-extra';
import { extract } from 'tar-fs'

const docker = new Dockerode({ version: 'v1.40', socketPath: '/var/run/docker.sock', })

const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function startTest(): Promise<void> {
  const container = await docker.createContainer({ Image: 'postgres:11-alpine' });
  await container.start()
  await timeout(1500)
/* 
  const exec = await container.exec({  Cmd: [ '/bin/sh', '-c', 'echo "Hello" >> /root/test && mkdir /root/shit && echo "Motherfucker" >> /root/shit/test' ],
  AttachStdout: true,
  AttachStderr: true })
  const test  = await exec.start()
 */
  await  timeout(1000)

  const tar = extract()

  const stream = await container.getArchive({ path: '/var/lib/postgresql/data' })


  stream.pipe(extract('./test'))
  
/* 
  const files: AsyncIterableIterator<Buffer> = pEvent.iterator(
    stream,
    'data',
    {
      resolutionEvents: ['end']
    }
  );

  let i = 0

  for await (const file  of files) {
    if (i === 1) console.log(file.toString())
    i++
  } */

/*   let i: number = 0;
  for await (const file of files) {
    await writeFile(`test${i++}.tar`, file)
  } */
  await container.stop()

  await container.remove()
}

startTest()
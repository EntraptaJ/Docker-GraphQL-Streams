// API/src/Modules/Docker/PubSub/index.ts
import { EventEmitter } from 'events';
import pEvent from 'p-event';
import { DockerContainer } from '../DockerModel';
import { docker } from '../DockerResolver';

interface Cont {
  id: string;
  stream: NodeJS.WritableStream;
}

export const Containers: Cont[] = [];

export class DockerPubSub {
  public ee = new EventEmitter();

  public async publish(triggerName: string, payload: string) {
    console.log(triggerName, payload);
    // this.ee.emit(triggerName, response);
  }

  public async subscribe(args: {
    containerId: string;
  }): Promise<AsyncIterator<any>> {
    const dbContainer = await DockerContainer.findOneOrFail(args.containerId);

    const container = docker.getContainer(dbContainer.containerId);

    const existingStream = Containers.find(({ id }) => id === args.containerId);

    let stream: NodeJS.WritableStream;

    if (existingStream) stream = existingStream.stream;
    else {
      stream = await container.attach({
        stream: true,
        stdin: true,
        stdout: true
      });
      Containers.push({ id: args.containerId, stream });
      await container.start()
    }

    const files = pEvent.iterator(
      stream,
      'data',
      {
        resolutionEvents: ['end']
      }
    );

    return files;
  }
  public async unsubscribe(subId: number) {}
}

export const logsPubSub = new DockerPubSub();

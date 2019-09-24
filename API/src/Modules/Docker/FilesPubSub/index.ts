// API/src/Modules/Docker/FilesPubSub/index.ts
import { EventEmitter } from 'events';
import pEvent from 'p-event';
import { DockerContainer } from '../DockerModel';
import { docker } from '../DockerResolver';
import { compressStream } from 'iltorb';

interface Cont {
  id: string;
  stream: NodeJS.WritableStream;
}

export const Containers: Cont[] = [];

export class FilesPubSub {
  public ee = new EventEmitter();

  public async publish(triggerName: string, payload: string) {
    console.log(triggerName, payload);
    // this.ee.emit(triggerName, response);
  }

  public async subscribe(args: {
    containerId: string;
    path: string
  }): Promise<AsyncIterator<any>> {
    const dbContainer = await DockerContainer.findOneOrFail(args.containerId);

    const container = docker.getContainer(dbContainer.containerId);

    const archiveStream = await container.getArchive({ path: args.path });
    const iterator = pEvent.iterator(archiveStream, 'data', { resolutionEvents: ['end'] })
    return iterator;
  }
  public async unsubscribe(subId: number) {}
}

export const filesPubSub = new FilesPubSub();

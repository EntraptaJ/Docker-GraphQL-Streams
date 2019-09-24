// API/src/Modules/Docker/DockerResolver.ts
import Docker from 'dockerode';
import { compressStream } from 'iltorb';
import pEvent from 'p-event';
import {
  Arg,
  Mutation,
  Query,
  Resolver,
  Root,
  Subscription
} from 'type-graphql';
import { DockerContainer } from './DockerModel';
import { Containers, logsPubSub } from './LogsPubSub';

export const docker = new Docker();

@Resolver()
export class DockerResolver {
  @Query(() => String)
  hello(): string {
    return 'HelloWorld';
  }
  @Mutation(() => DockerContainer)
  async runContainer(@Arg('image') image: string): Promise<DockerContainer> {
    const container = await docker.createContainer({
      Image: image
    });

    const newContainer = await DockerContainer.create({
      containerId: container.id
    }).save();

    return newContainer;
  }

  @Mutation(() => Boolean)
  async execCommand(
    @Arg('containerId') containerId: string,
    @Arg('command') command: string
  ): Promise<boolean> {
    const { stream } = Containers.find(({ id }) => id === containerId);
    stream.write(command);
    return true;
  }

  @Mutation(() => Boolean)
  async startContainer(@Arg('Id') Id: string): Promise<boolean> {
    const { containerId } = await DockerContainer.findOneOrFail(Id);
    const container = docker.getContainer(containerId);
    await container.start();
    return true;
  }

  @Mutation(() => String)
  async createTar(
    @Arg('containerId') containerId: string,
    @Arg('path') path: string
  ): Promise<string> {
    const dbContainer = await DockerContainer.findOneOrFail(containerId);
    const container = await docker.getContainer(dbContainer.containerId);

    let data: Buffer[] = [];

    const archiveStream = await container.getArchive({ path: path });

    const brotliStream = compressStream();
    brotliStream.on('data', chunk => data.push(chunk));

    archiveStream.pipe(brotliStream);

    await pEvent(brotliStream, 'end');

    return Buffer.concat(data).toString('base64');
  }

  @Mutation(() => Boolean)
  async removeContainer(@Arg('Id') Id: string): Promise<boolean> {
    const { containerId } = await DockerContainer.findOneOrFail(Id);
    const container = docker.getContainer(containerId);

    await container.stop();
    await container.remove();
    return true;
  }

  @Subscription({
    // @ts-ignore
    subscribe: async (stuff, args) => {
      const test = await logsPubSub.subscribe(args);
      return test;
    }
  })
  public ContainerLogs(
    @Arg('containerId') containerId: string,
    @Root() stuff: Buffer
  ): String {
    return stuff.toString();
  }
}

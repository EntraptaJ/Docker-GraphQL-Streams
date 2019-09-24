// API/src/Modules/Docker/DockerResolver.ts
import Docker from 'dockerode';
import { compressStream, compress } from 'iltorb';
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
import { generateENVArgs } from './Utils/Args';
import { DockerEnvironment } from './Environment';
import { filesPubSub } from './FilesPubSub';

export const docker = new Docker();

@Resolver()
export class DockerResolver {
  @Query(() => String)
  hello(): string {
    return 'HelloWorld';
  }
  @Mutation(() => DockerContainer)
  async createContainer(
    @Arg('image') image: string,
    @Arg('env', () => [DockerEnvironment]) env: DockerEnvironment[]
  ): Promise<DockerContainer> {
    const container = await docker.createContainer({
      Image: image,
      Env: generateENVArgs(env)
    });

    const newContainer = await DockerContainer.create({
      containerId: container.id
    }).save();

    return newContainer;
  }

  @Mutation(() => Boolean)
  async pullImage(@Arg('image') image: string): Promise<boolean> {
    await docker.pull(image, {});
    return true;
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
    await container.remove({ force: true });
    return true;
  }

  @Subscription({
    // @ts-ignore
    subscribe: async (stuff, args) => {
      const test = await logsPubSub.subscribe(args);
      return test;
    }
  })
  public containerLogs(
    @Arg('containerId') containerId: string,
    @Root() stuff: Buffer
  ): String {
    return stuff.toString();
  }

  @Subscription(() => String, {
    // @ts-ignore
    subscribe: async (a, args) => filesPubSub.subscribe(args)
  })
  async containerFiles(
    @Arg('containerId') containerId: string,
    @Arg('path') path: string,
    @Root() root: Buffer
  ): Promise<string> {
    return (await compress(root)).toString('hex');
  }
}

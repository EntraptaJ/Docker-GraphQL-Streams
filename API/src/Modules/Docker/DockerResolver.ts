// API/src/Modules/Docker/DockerResolver.ts
import { tar } from 'compressing';
import Docker from 'dockerode';
import { readFile, remove } from 'fs-extra';
import { compress } from 'iltorb';
import pEvent from 'p-event';
import tarStream from 'tar-fs';
import { Arg, Mutation, Query, Resolver, Root, Subscription } from 'type-graphql';
import { DockerContainer } from './DockerModel';
import { Containers, logsPubSub } from './LogsPubSub';


export const docker = new Docker()

@Resolver()
export class DockerResolver {
  @Query(() => String)
  hello(): string {
    return 'HelloWorld'
  }
  @Mutation(() => DockerContainer)
  async runContainer(@Arg('image') image: string): Promise<DockerContainer> {
    const container = await docker.createContainer({ Image: 'docker.pkg.github.com/kristianfjones/auto-deploy/moduledl:latest', Env: ['TYPE=Controllers', 'GIT_URL=https://github.com/Auto-Systems/vCenter-Controller.git'] })
    const newContainer = await DockerContainer.create({ containerId: container.id }).save()
    return newContainer;
  }

  @Mutation(() => Boolean)
  async execCommand(@Arg('containerId') containerId: string, @Arg('command') command: string): Promise<boolean> {
    const { stream } = Containers.find(({ id }) => id === containerId)
    stream.write(command)
    return true
  }

  @Mutation(() => Boolean)
  async startContainer(@Arg('Id') Id: string): Promise<boolean> {
    const { containerId } = await DockerContainer.findOneOrFail(Id)
    const container = docker.getContainer(containerId)
    await container.start()
    return true
  }

  @Mutation(() => String)
  async createTar(@Arg('containerId') containerId: string, @Arg('path') path: string): Promise<string> {
    const dbContainer = await DockerContainer.findOneOrFail(containerId);
    const container = await docker.getContainer(dbContainer.containerId);

    const readStream = await container.getArchive({ path: path })
    const decompressStream = tarStream.extract(dbContainer.id)

    readStream.pipe(decompressStream, { end: true })
    await pEvent(decompressStream, 'finish')

    await tar.compressDir(dbContainer.id, `${dbContainer.id}.tar`)
    const fileStream = await readFile(`${dbContainer.id}.tar`)

    Promise.all([remove(`${dbContainer.id}.tar`), remove(dbContainer.id)])

    return (await compress(fileStream)).toString('base64')
  }


  @Mutation(() => Boolean)
  async removeContainer(@Arg('Id') Id: string): Promise<boolean> {
    const { containerId } = await DockerContainer.findOneOrFail(Id)
    const container = docker.getContainer(containerId)

    await container.stop()
    await container.remove()
    return true
  }

  @Subscription({
    // @ts-ignore
    subscribe: async (stuff, args) => {
      const test = await logsPubSub.subscribe(args)
      return test
    }
  })
  public ContainerLogs(@Arg('containerId') containerId: string, @Root() stuff: Buffer): String {
    return stuff.toString();
  }
}
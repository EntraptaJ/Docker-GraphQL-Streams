// API/src/Modules/Docker/Environment.ts
import { InputType, Field } from 'type-graphql';

@InputType('DockerEnvironment')
export class DockerEnvironment {
  @Field()
  key: string;

  @Field()
  value: string;
}

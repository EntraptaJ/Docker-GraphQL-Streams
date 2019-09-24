// API/src/Modules/Docker/RunContainerInput.ts
import { InputType, Field } from 'type-graphql'

@InputType()
export class RunContainerInput {
  @Field()
  image: string
}
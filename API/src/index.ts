// API/src/index.ts
import './Setup';
import Koa from 'koa';
import KoaRouter from '@koa/router';
import { ApolloServer } from 'apollo-server-koa';
import { generateGQLSchema } from './Library/generateGQLSchema';
import { ensureDbConnection } from './Library/getDbConnection';

async function startAPI(): Promise<void> {
  const db = ensureDbConnection();
  const server = new Koa();
  const serverRouter = new KoaRouter();

  const apiServer = new ApolloServer({
    schema: await generateGQLSchema(),
    playground: true,
    introspection: true
  });

  apiServer.applyMiddleware({ app: server });

  server.use(serverRouter.routes()).use(serverRouter.allowedMethods());
  const httpServer = await server.listen(80);
  console.log('API Server listening on port');
  await db;

  apiServer.installSubscriptionHandlers(httpServer);
}

startAPI();

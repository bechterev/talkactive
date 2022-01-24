import express, { Application } from 'express';
import mongoose from 'mongoose';
import { createServer, Server } from 'http';
import * as socketIo from 'socket.io';
import * as swaggerUI from 'swagger-ui-express';
import swaggerSpec from './controllers/swagger_spec';
import cronos from './services/cronos';
// import task from './services/task.update.queue';

class App {
  public app: Application;

  public port: number;

  public conStr: string;

  private server: Server;

  constructor(appInit: {
    port: number;
    middleWares: any;
    controllers: any;
    dbString: any;
  }) {
    this.app = express();
    this.port = appInit.port;
    this.conStr = appInit.dbString;
    this.addDocs();
    this.middlewares(appInit.middleWares);
    this.routes(appInit.controllers);
    this.assets();
    this.server = createServer(this.app);
    cronos();
    // task();
  }

  private initSocket(): void {
    const io = new socketIo.Server(this.server);
    this.app.set('io', io);
  }

  private dbConnect() {
    return mongoose.connect(this.conStr, {});
  }

  private middlewares(middleWares: {
    forEach: (arg0: (middleWare: any) => void) => void;
  }) {
    middleWares.forEach((middleWare) => {
      this.app.use(middleWare);
    });
  }

  private routes(controllers: {
    forEach: (arg0: (controller: any) => void) => void;
  }) {
    controllers.forEach((controller) => {
      this.app.use(process.env.BASE_PREFIX, controller.router);
    });
  }

  private assets() {
    this.app.use(express.static('public'));
    this.app.use(express.static('views'));
  }

  private addDocs() {
    this.app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));
  }

  // private template() {}

  public listen() {
    if (this.conStr) {
      this.dbConnect()
        .then(() => {
          this.server.listen(this.port, () => {
            console.log(`App listening on the http://localhost:${this.port}`);
          });
        })
        .catch((err) => {
          console.log('connect error', err);
          process.exit(1);
        });
    }
  }
}

export default App;

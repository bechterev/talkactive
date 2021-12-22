import express, { Application } from 'express';
import mongoose from 'mongoose';
import { createServer, Server } from 'http';
import * as socketIo from 'socket.io';
import ChatEvent from './interfaces/chat_event';
import { ChatMessage } from './interfaces/chat_message';

class App {
  public app: Application;

  public port: number;

  public conStr: string;

  private server: Server;

  private io: socketIo.Server;

  constructor(appInit: {
    port: number;
    middleWares: any;
    controllers: any;
    dbString: any;
  }) {
    this.app = express();
    this.port = appInit.port;
    this.conStr = appInit.dbString;
    this.middlewares(appInit.middleWares);
    this.routes(appInit.controllers);
    this.assets();
    // this.template();
    this.server = createServer(this.app);
    this.initSocket();
  }

  private initSocket(): void {
    this.io = new socketIo.Server(this.server);
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
      this.app.use('/', controller.router);
    });
  }

  private assets() {
    this.app.use(express.static('public'));
    this.app.use(express.static('views'));
  }

  // private template() {}

  public listen() {
    if (this.conStr) {
      this.dbConnect()
        .then(() => {
          this.server.listen(this.port, () => {
            console.log(`App listening on the http://localhost:${this.port}`);
          });
          this.io.on(ChatEvent.CONNECT, (socket: any) => {
            console.log('Connected client on port %s.', this.port, socket.it);
            socket.on('switch room', () => {});
            socket.on(ChatEvent.MESSAGE, (m: ChatMessage) => {
              console.log('[server](message): %s', JSON.stringify(m));
              this.io.emit('message', m);
            });

            socket.on(ChatEvent.DISCONNECT, () => {
              console.log('Client disconnected');
            });
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

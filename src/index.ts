import express, { Application } from 'express';
import mongoose from 'mongoose';
import { createServer, Server } from 'http';
import * as socketIo from 'socket.io';
import * as swaggerUI from 'swagger-ui-express';
import ChatEvent from './interfaces/chat_event';
import { ChatMessage } from './interfaces/chat_message';
import swaggerSpec from './controllers/swagger_spec';
import Room from './data/room/schema';
import User from './data/user/schema';
import CallState from './interfaces/state_call';
import rtc from './rtc/agora';

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
    this.initSocket();
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
          const io = this.app.get('io');
          io.on(ChatEvent.CONNECT, (socket: any) => {
            console.log('Connected client on port %s.', this.port);
            socket.on(ChatEvent.JOINROOM, ({ titleRoom, email }) => {
              console.log(socket);
              Room.findOne({ title: titleRoom })
                .sort({ createTime: -1 })
                .then((roombd) => {
                  if (roombd.members.length < 3) {
                    if (!roombd.members.includes(email)) {
                      roombd.members.push(email);
                      socket.join(titleRoom);
                      io.to(titleRoom).emit('message', {
                        room: titleRoom,
                        message: 'hello friend',
                      });
                      if (roombd.members.length === 3) {
                        Room.updateOne(
                          { _id: roombd.id },
                          {
                            stateCall: CallState.Work,
                            members: roombd.members,
                          },
                        ).then(() => {
                          User.find()
                            .where({ email: { $in: roombd.members } })
                            .then((users) => {
                              const usersImportantData = users.map((el) => ({
                                email: el.email,
                                mask: el.mask,
                                rating: el.rating,
                              }));
                              rtc({
                                isPublisher: true,
                                channel: process.env.CHANNEL_ID,
                              }).then(({ uid, token }) => {
                                io.to(titleRoom).emit('message', {
                                  uid,
                                  token,
                                  usersImportantData,
                                });
                              });
                            });
                        });
                      } else {
                        roombd.save();
                      }
                    }
                  } else {
                    console.log('wait free room or create new');
                  }
                })
                .catch((err) => {
                  console.log(err, 'error');
                });
            });
            socket.on(ChatEvent.MESSAGE, (m) => {
              console.log('[server](message): %s', JSON.stringify(m));
              socket.to(m.room).emit(m.message);
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

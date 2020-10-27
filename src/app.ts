import express from 'express';
import { connect as connectToMongoDB } from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config as dotEnvConfig } from 'dotenv';
import { createServer } from 'http';
import socketIo from 'socket.io';
import helmet from 'helmet';
import morgan from 'morgan';

import { NODE_ENV, API_PORT, COOKIE_SECRET, MONGODB_URI } from '@/config';

import mainRouter from './routes';
import { getEnvVar, decideMongoDBURI } from './utils';
import { IRequestIO } from './typings';

getEnvVar('NODE_ENV') !== 'production' ? dotEnvConfig() : '';

const app = express();
const server = createServer(app);
const port = API_PORT || 3000;
const io = socketIo(server, { serveClient: false });

app.set('trust proxy', true);

app.use(morgan('common'));
app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin: [
      'http://127.0.0.1:8000',
      'http://localhost:8000',
      'https://127.0.0.1:8000',
      'https://localhost:8000',
      'https://todo.sundayx.tech',
    ],
  }),
);
app.use(cookieParser(COOKIE_SECRET));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
  (req as IRequestIO).io = io;
  next();
});

app.use(mainRouter);

if (require.main === module) {
  (async function () {
    await connectToMongoDB(MONGODB_URI || decideMongoDBURI(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    server.listen(port, () => {
      console.log(
        `Sunday's Fancy Todo API is running.\nPORT\t=>\t${port}\nENV\t=>\t${getEnvVar(
          'NODE_ENV',
        ).toUpperCase()}`,
      );
    });
  })();
}

export default server;

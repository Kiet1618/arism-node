import * as dotenv from 'dotenv';
dotenv.config();

export default () => ({
  nodeId: process.env.NODE_ID,
  host: process.env.HOST,
  port: process.env.PORT,
  url: `http://${process.env.HOST}:${process.env.PORT}`,
  database: {
    mongoUri: process.env.MONGO_URI,
  },
  privateKey: process.env.PRIVATE_KEY,
});

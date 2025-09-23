const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const { WebSocketServer } = WebSocket;
const Redis = require('ioredis');

const PORT = Number(process.env.PORT) || 3000;
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379/0';
const CHAT_CHANNEL = 'chat.events';
const GIFT_CHANNEL = 'gift.events';

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const subscribers = new Set();

function registerClient(ws) {
  subscribers.add(ws);
  ws.on('close', () => subscribers.delete(ws));
  ws.on('error', () => subscribers.delete(ws));
}

function broadcast(payload) {
  const raw = JSON.stringify(payload);
  for (const client of subscribers) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(raw);
    }
  }
}

function formatMessage(channel, data) {
  return {
    channel,
    data,
    ts: new Date().toISOString(),
  };
}

const pubClient = new Redis(REDIS_URL, { lazyConnect: true });
const subClient = new Redis(REDIS_URL, { lazyConnect: true });

async function setupRedis() {
  await Promise.all([pubClient.connect(), subClient.connect()]);

  subClient.on('message', (channel, message) => {
    let data = message;
    try {
      data = JSON.parse(message);
    } catch (_err) {
      // keep string payloads as-is
    }
    broadcast(formatMessage(channel, data));
  });

  await subClient.subscribe(CHAT_CHANNEL, GIFT_CHANNEL);
  console.log(`Subscribed to Redis channels: ${CHAT_CHANNEL}, ${GIFT_CHANNEL}`);
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/broadcast', async (req, res) => {
  const { channel = CHAT_CHANNEL, message } = req.body || {};

  if (!message) {
    res.status(400).json({ error: 'Missing `message` in request body' });
    return;
  }

  const payload = formatMessage(channel, message);
  broadcast(payload);

  try {
    await pubClient.publish(channel, JSON.stringify(message));
  } catch (err) {
    console.error('Failed to publish to Redis', err);
  }

  res.status(202).json({ status: 'broadcasted' });
});

wss.on('connection', (ws) => {
  registerClient(ws);
  ws.send(JSON.stringify(formatMessage('system', { message: 'Connected to gateway' })));
});

async function start() {
  try {
    await setupRedis();
    server.listen(PORT, () => {
      console.log(`Gateway listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start gateway', err);
    process.exitCode = 1;
  }
}

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  server.close();
  await Promise.allSettled([
    pubClient.quit(),
    subClient.quit(),
  ]);
  process.exit(0);
});

start();
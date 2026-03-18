import amqp from 'amqplib';
import { env } from './env.js';

let connection = null;
let channel = null;
const EXCHANGE = 'intern-management.topic';
let connecting = false;

export const connectRabbitMQ = async () => {
  if (connecting) return;
  connecting = true;

  try {
    // Close existing connection if any
    if (connection) await connection.close();

    // connection = await amqp.connect(env.rabbitmqUrl);

   connection = await amqp.connect(env.rabbitmqUrl, {
  servername: env.rabbitmqHost
});

    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err.message);
      // Attempt reconnection after delay
      setTimeout(() => {
        connecting = false;
        connectRabbitMQ();
      }, 5000);
    });
    connection.on('close', () => {
      console.log('RabbitMQ connection closed, reconnecting...');
      setTimeout(() => {
        connecting = false;
        connectRabbitMQ();
      }, 5000);
    });

    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    console.log('RabbitMQ connected');
  } catch (err) {
    console.error('Failed to connect to RabbitMQ:', err.message);
    // Retry after delay
    setTimeout(() => {
      connecting = false;
      connectRabbitMQ();
    }, 5000);
  } finally {
    connecting = false;
  }
};

export const publishEvent = async (routingKey, message) => {
  if (!channel) {
    console.warn('[RabbitMQ] channel not available, skipping event');
    return;
  }
  try {
    channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(message)));
  } catch (err) {
    console.error('Failed to publish event:', err.message);
    // Optionally trigger reconnection

  }
};
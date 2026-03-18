import amqp from 'amqplib';
import { env } from './env.js';

let channel;
const EXCHANGE = 'intern-management.topic';

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(env.rabbitmqUrl);
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err.message);
      setTimeout(connectRabbitMQ, 5000);
    });
    connection.on('close', () => {
      console.log('RabbitMQ connection closed, reconnecting...');
      setTimeout(connectRabbitMQ, 5000);
    });
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    console.log('RabbitMQ connected');
  } catch (err) {
    console.error('RabbitMQ connection failed:', err.message);
    setTimeout(connectRabbitMQ, 5000);
  }
};

export const publishEvent = async (routingKey, message) => {
  if (!channel) return;
  try {
    channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(message)));
  } catch (err) {
    console.error('Failed to publish event:', err.message);
  }
};
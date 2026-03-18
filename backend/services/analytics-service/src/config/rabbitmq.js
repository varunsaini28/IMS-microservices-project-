import amqp from 'amqplib';
import { env } from './env.js';
import { handleEvent } from '../consumers/eventHandler.js';

let connection;
let channel;
const EXCHANGE = 'intern-management.topic';

export const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(env.rabbitmqUrl);

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

    const { queue } = await channel.assertQueue('analytics-queue', { durable: true });

    // ✅ Bind events correctly
    await channel.bindQueue(queue, EXCHANGE, 'tasks.task.completed');
    await channel.bindQueue(queue, EXCHANGE, 'tasks.task.assigned');
    await channel.bindQueue(queue, EXCHANGE, 'tasks.attendance.checkin');
    await channel.bindQueue(queue, EXCHANGE, 'tasks.attendance.checkout');
    await channel.bindQueue(queue, EXCHANGE, 'tasks.worklog.created');
    await channel.bindQueue(queue, EXCHANGE, 'tasks.leave.updated');
    await channel.bindQueue(queue, EXCHANGE, 'projects.project.created');

    channel.consume(queue, async (msg) => {
      if (msg) {
        const routingKey = msg.fields.routingKey;
        const content = JSON.parse(msg.content.toString());

        console.log(`Analytics received event: ${routingKey}`);

        await handleEvent(routingKey, content);

        channel.ack(msg);
      }
    });

    console.log('RabbitMQ connected and consuming');
  } catch (err) {
    console.error('RabbitMQ connection failed:', err.message);
    setTimeout(connectRabbitMQ, 5000);
  }
};

export const publishEvent = async (routingKey, message) => {
  if (!channel) return;

  try {
    channel.publish(
      EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(message))
    );
  } catch (err) {
    console.error('Failed to publish event:', err.message);
  }
};
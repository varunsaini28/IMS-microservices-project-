import amqp from 'amqplib';
import { env } from './env.js';
import { AuditLog } from '../models/AuditLog.js';

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

    // Create a queue for audit service
    const { queue } = await channel.assertQueue('audit-queue', { exclusive: false });
    
    // Bind to ALL routing keys
    await channel.bindQueue(queue, EXCHANGE, '#');

    // Consume messages
    channel.consume(queue, async (msg) => {
      if (msg) {
        const routingKey = msg.fields.routingKey;
        const content = JSON.parse(msg.content.toString());
        console.log(`Audit received: ${routingKey}`);

        // Store in MongoDB
        try {
          const log = new AuditLog({
            routingKey,
            event: content,
            timestamp: new Date()
          });
          await log.save();
        } catch (err) {
          console.error('Failed to save audit log:', err);
        }

        channel.ack(msg);
      }
    });

    console.log('RabbitMQ connected and consuming all events for audit');
  } catch (err) {
    console.error('RabbitMQ connection failed:', err.message);
    setTimeout(connectRabbitMQ, 5000);
  }
};
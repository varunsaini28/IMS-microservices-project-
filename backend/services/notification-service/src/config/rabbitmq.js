import amqp from 'amqplib';
import { env } from './env.js';
import  {handleEvent}  from '../consumers/eventHandler.js';

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

    // Create a queue for this service
    const { queue } = await channel.assertQueue('notification-queue', { exclusive: false });
    
    // Bind to relevant routing keys (all events)
    await channel.bindQueue(queue, EXCHANGE, '#');

    // Consume messages
    channel.consume(queue, (msg) => {
      if (msg) {
        const routingKey = msg.fields.routingKey;
        const content = JSON.parse(msg.content.toString());
        console.log(`Received event: ${routingKey}`, content);
        handleEvent(routingKey, content);
        channel.ack(msg);
      }
    });

    console.log('RabbitMQ connected and consuming');
  } catch (err) {
    console.error('RabbitMQ connection failed:', err.message);
    setTimeout(connectRabbitMQ, 5000);
  }
};



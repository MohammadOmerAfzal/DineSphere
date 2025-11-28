const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'food-delivery-app',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'order-metrics-group' });

// Connect producer on startup
const connectKafka = async () => {
  try {
    await producer.connect();
    console.log('✅ Kafka producer connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect Kafka producer:', error);
  }
};

module.exports = {
  kafka,
  producer,
  consumer,
  connectKafka
};
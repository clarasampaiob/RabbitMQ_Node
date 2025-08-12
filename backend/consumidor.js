const amqp = require('amqplib');
require('dotenv').config();
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const INPUT_QUEUE = 'fila.notificacao.entrada.CLARA';
const STATUS_QUEUE = 'fila.notificacao.status.CLARA';

async function startConsumer() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertQueue(INPUT_QUEUE, { durable: true });
        await channel.assertQueue(STATUS_QUEUE, { durable: true });

        console.log(`Esperando mensagens na fila: ${INPUT_QUEUE}`);

        channel.consume(INPUT_QUEUE, async (message) => {
            if (message === null) {
                return;
            }

            const content = JSON.parse(message.content.toString());
            const { mensagemId, conteudoMensagem } = content;

            console.log(`Mensagem recebida. ID: ${mensagemId} e conteúdo: "${conteudoMensagem}"`);

            const processTime = 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, processTime));

            const randomNumber = Math.floor(Math.random() * 10) + 1; 
            const status = randomNumber <= 2 ? 'FALHA_PROCESSAMENTO' : 'PROCESSADO_SUCESSO';

            console.log(`Processado. ID: ${mensagemId} e status: ${status}`);

            const statusMessage = JSON.stringify({ mensagemId, status });

            channel.sendToQueue(STATUS_QUEUE, Buffer.from(statusMessage), { persistent: true });

            channel.ack(message);

        }, {
            noAck: false
        });

    } catch (error) {
        console.error('Erro consumidor Rabbit:', error);
    }
}


startConsumer();
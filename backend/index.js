const express = require('express');
const amqp = require('amqplib');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = 3000;
const statusMap = new Map();

app.use(bodyParser.json());
app.use(cors());

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE_NAME = 'fila.notificacao.entrada.CLARA';
const STATUS_QUEUE = 'fila.notificacao.status.CLARA';
let channel;


async function connectRabbitMQ() { 
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: true });
        await channel.assertQueue(STATUS_QUEUE, { durable: true });

        
        channel.consume(STATUS_QUEUE, (message) => {
            if (message !== null) {
                const { mensagemId, status } = JSON.parse(message.content.toString());
                statusMap.set(mensagemId, status);
                console.log(`Status da mensagem ID: ${mensagemId} atualizado para: ${status}`);
                channel.ack(message);
            }
        });

        console.log('Conectado ao Rabbit');
    } catch (error) {
        console.error('Erro ao conectar Rabbit:', error);
        setTimeout(connectRabbitMQ, 5000);
    }
}



connectRabbitMQ();


const handleNotification = (req, res) => {
    const { mensagemId, conteudoMensagem } = req.body;

    if (!mensagemId || !conteudoMensagem) {
        return res.status(400).json({
            error: 'O Id e conteudo da Mensagem são obrigatórios'
        });
    }

   
    if (channel) {
        try {
            const message = JSON.stringify({ mensagemId, conteudoMensagem });
            channel.sendToQueue(QUEUE_NAME, Buffer.from(message), { persistent: true });
            console.log(`Mensagem publicada na fila: ${QUEUE_NAME} com ID: ${mensagemId}`);

            
            return res.status(202).json({
                message: 'Requisição recebida, processamento iniciado',
                mensagemId: mensagemId
            });
        } catch (error) {
            console.error('Erro ao publicar mensagem no Rabbit:', error);
            return res.status(500).json({
                error: 'Falha ao publicar mensagem'
            });
        }
    } else {
        return res.status(503).json({
            error: 'Servidor Rabbit não conectado'
        });
    }
};

app.post('/api/notificar', handleNotification);


app.get('/api/status/:id', (req, res) => {
    const { id } = req.params;
    const status = statusMap.get(id);

    if (status) {
        return res.json({ mensagemId: id, status });
    } else {
        return res.status(404).json({ error: 'Status da mensagem não encontrado' });
    }
});

const server = app.listen(PORT, () => {
    console.log(`Servidor Express rodando em http://localhost:${PORT}`);
});

module.exports = { app, handleNotification };

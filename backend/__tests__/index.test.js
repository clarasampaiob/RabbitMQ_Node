const { app, handleNotification } = require('../index'); // Importe o `app`
const amqp = require('amqplib');
const request = require('supertest'); // Instale o supertest para testar a rota HTTP

// Mock mais robusto para a biblioteca amqplib
jest.mock('amqplib', () => ({
  connect: jest.fn(() =>
    Promise.resolve({
      createChannel: jest.fn(() =>
        Promise.resolve({
          assertQueue: jest.fn(),
          sendToQueue: jest.fn(),
          consume: jest.fn(),
          // Adicionar um mock para o .on('error') para evitar mais erros
          on: jest.fn(), 
        })
      ),
      close: jest.fn(),
    })
  ),
}));

// Use uma variável para o servidor para poder fechá-lo
let server;

describe('Função de Publicação de Mensagem', () => {
  const mockChannel = {
    assertQueue: jest.fn(),
    sendToQueue: jest.fn(),
    consume: jest.fn(),
  };

  const mockRes = {
    status: jest.fn(() => mockRes),
    json: jest.fn(),
  };

  // Inicializa o servidor antes de todos os testes
  beforeAll(async () => {
    // Configura o mock do canal antes de iniciar o servidor
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    global.channel = channel;
    
    // Inicia o servidor e o armazena na variável
    server = app.listen(3001); // Use uma porta diferente para o teste
  });

  // Fecha o servidor depois que todos os testes terminam
  afterAll(done => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve publicar a mensagem na fila do Rabbit e retornar 202', async () => {
    const req = {
      body: {
        mensagemId: '123e4567-e89b-12d3-a456-426614174000',
        conteudoMensagem: 'Teste de mensagem',
      },
    };

    // Use o supertest para simular a requisição HTTP
    // Isso garante que o middleware do express e a rota sejam testados
    await request(server)
      .post('/api/notificar')
      .send(req.body)
      .expect(202);

    expect(global.channel.sendToQueue).toHaveBeenCalledWith(
      'fila.notificacao.entrada.CLARA',
      expect.any(Buffer),
      { persistent: true }
    );
  });

  it('deve retornar 400 se a mensagemId ou conteudoMensagem estiverem ausentes', async () => {
    const req = {
      body: {
        conteudoMensagem: 'Teste sem ID',
      },
    };

    await request(server)
      .post('/api/notificar')
      .send(req.body)
      .expect(400);

    expect(global.channel.sendToQueue).not.toHaveBeenCalled();
  });
});
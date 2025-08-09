const { app, handleNotification } = require('../index'); 
const amqp = require('amqplib');
const request = require('supertest'); 


jest.mock('amqplib', () => ({
  connect: jest.fn(() =>
    Promise.resolve({
      createChannel: jest.fn(() =>
        Promise.resolve({
          assertQueue: jest.fn(),
          sendToQueue: jest.fn(),
          consume: jest.fn(),
          
          on: jest.fn(), 
        })
      ),
      close: jest.fn(),
    })
  ),
}));


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

  
  beforeAll(async () => {
    
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    global.channel = channel;
    

    server = app.listen(3001); 
  });

 
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
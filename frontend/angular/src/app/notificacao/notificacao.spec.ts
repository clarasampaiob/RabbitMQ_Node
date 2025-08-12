import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { NotificacaoComponent } from './notificacao';
import { of } from 'rxjs';

describe('NotificacaoComponent', () => {
  let component: NotificacaoComponent;
  let fixture: ComponentFixture<NotificacaoComponent>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotificacaoComponent,
        HttpClientTestingModule,
        FormsModule,
      ],
      providers: []
    }).compileComponents();

    fixture = TestBed.createComponent(NotificacaoComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('deve criar o component', () => {
    expect(component).toBeTruthy();
  });

  it('deve adicionar "AGUARDANDO PROCESSAMENTO" status', () => {
    component.conteudoMensagem = 'Mensagem de teste';
    
    component.enviarNotificacao();
    
    expect(component.notificacoes.length).toBe(1);
    expect(component.notificacoes[0].status).toBe('AGUARDANDO PROCESSAMENTO');
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(component.notificacoes[0].mensagemId).toMatch(uuidRegex);

    const req = httpTestingController.expectOne('http://localhost:3000/api/notificar');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Requisição recebida', mensagemId: component.notificacoes[0].mensagemId });
  });

  it('deve enviar POST request corretamente', () => {
    const testMessage = 'Nova notificação';
    component.conteudoMensagem = testMessage;

    spyOn(component, 'gerarUUID').and.returnValue('mock-uuid-123');

    component.enviarNotificacao();

    const req = httpTestingController.expectOne('http://localhost:3000/api/notificar');
    expect(req.request.method).toBe('POST');
    
    expect(req.request.body).toEqual({
      mensagemId: 'mock-uuid-123',
      conteudoMensagem: testMessage,
    });

    req.flush({ message: 'Requisição recebida', mensagemId: 'mock-uuid-123' });
    
    expect(component.conteudoMensagem).toBe('');
  });

  it('deve atualizar status para "FALHA NO ENVIO" na API quandotem erro', () => {
    component.conteudoMensagem = 'Mensagem com falha';

    component.enviarNotificacao();

    const req = httpTestingController.expectOne('http://localhost:3000/api/notificar');
    expect(req.request.method).toBe('POST');

    req.error(new ErrorEvent('Network error'));

    expect(component.notificacoes.length).toBe(1);
    expect(component.notificacoes[0].status).toBe('FALHA NO ENVIO');
  });

});
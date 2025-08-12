import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Notificacao {
  mensagemId: string;
  conteudoMensagem: string;
  status: string;
}

@Component({
  selector: 'app-notificacao',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notificacao.html',
  styleUrls: ['./notificacao.scss']
})
export class NotificacaoComponent {
  conteudoMensagem: string = '';
  notificacoes: Notificacao[] = [];
  private backendUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  enviarNotificacao(): void {
    if (!this.conteudoMensagem) {
      alert('Por favor, insira o conteúdo da mensagem.');
      return;
    }

    const mensagemId = this.gerarUUID();
    const payload = {
      mensagemId: mensagemId,
      conteudoMensagem: this.conteudoMensagem
    };

    
    this.notificacoes.unshift({
      mensagemId: mensagemId,
      conteudoMensagem: this.conteudoMensagem,
      status: 'AGUARDANDO PROCESSAMENTO'
    });

    this.http.post(`${this.backendUrl}/notificar`, payload)
      .subscribe({
        next: (response: any) => {
          console.log('Requisição enviada com sucesso.', response);
          this.conteudoMensagem = ''; 
        },
        error: (error) => {
          console.error('Erro ao enviar notificação:', error);
          const notificacao = this.notificacoes.find(n => n.mensagemId === mensagemId);
          if (notificacao) {
            notificacao.status = 'FALHA NO ENVIO';
          }
        }
      });
  }

  // gerar um UUID 
  gerarUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
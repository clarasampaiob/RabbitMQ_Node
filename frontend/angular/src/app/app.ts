import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificacaoComponent } from './notificacao/notificacao';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificacaoComponent, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
}
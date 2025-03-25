import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { baseUrl } from '../config/api';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private http: HttpClient) { }

  totalAssistidosCadastrados(): Observable<any>{
    return this.http.get<any>(`${baseUrl}/assistido/total`);
  }
  retiradasPorMes(ano: string): Observable<any>{
    return this.http.get<any>(`${baseUrl}/retirada/meses/${ano}`)
  }
  totalRetiradasMesAtual(dataInicio: string, dataFim: string): Observable<any>{
    return this.http.get<any>(`${baseUrl}/retirada/periodo/${dataInicio}/${dataFim}`)
  }

}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { baseUrl } from '../config/api';
import { Retirada } from '../models/retirada.interface';

@Injectable({
  providedIn: 'root',
})
export class RetiradasService {
  constructor(private http: HttpClient) {}

  listarRetiradas(page: number, pageSize: number): Observable<any> {
    return this.http.get<any>(`${baseUrl}/retirada/paginas/${page}/${pageSize}`);
  }
  atualizarRetirada(id: number, input: Partial<Retirada>): Observable<any> {
    
    const body = {
      assistido_id: input.assistido_id,
      data_retirada: input.data_retirada
    };
    
    return this.http.put<any>(`${baseUrl}/retirada/${id}`, body);
  }
  registrarRetirada(
    assistido_id: number,
    data_retirada: string
  ): Observable<any> {
    const body = {
      assistido_id,
      data_retirada,
    };
    return this.http.post<any>(`${baseUrl}/retirada`, body);
  }
  selectByAssistidoId(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${baseUrl}/retirada/assistido/${id}`);
  }
  selectByDataIntervalo(
    dataInicial: string,
    dataFinal: string
  ): Observable<any[]> {
    return this.http.get<any[]>(
      `${baseUrl}/retirada/periodo/${dataInicial}/${dataFinal}`
    );
  }
  obterQuantidadeRetiradas(): Observable<number>{
    return this.http.get<number>(`${baseUrl}/retirada/total`);
  }
}

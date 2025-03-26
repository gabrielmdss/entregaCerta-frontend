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

  listarRetiradas(): Observable<any> {
    return this.http.get<any>(`${baseUrl}/retirada`);
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
  selectByData(data: string): Observable<any[]> {
    return this.http.get<any[]>(`${baseUrl}/retirada/data/${data}`);
  }
  selectByDataIntervalo(
    dataInicial: string,
    dataFinal: string
  ): Observable<any[]> {
    return this.http.get<any[]>(
      `${baseUrl}/retirada/periodo/${dataInicial}/${dataFinal}`
    );
  }
}

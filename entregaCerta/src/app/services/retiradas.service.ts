import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { baseUrl } from '../config/api';

@Injectable({
  providedIn: 'root'
})
export class RetiradasService {

  constructor(private http: HttpClient) {
   }

   listarRetiradas(): Observable<any>{
    return this.http.get<any>(`${baseUrl}/retirada`)
   }

   registrarRetirada(assistido_id: number, data_retirada: string): Observable<any>{
    const body = {
      assistido_id,
      data_retirada
    }
    return this.http.post<any>(`${baseUrl}/retirada`, body)
   }

   selectByAssistidoId(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${baseUrl}/retirada/assistido/${id}`);
  }

  countanysByAssistido(id: number): Observable<number> {
    return this.http.get<number>(`${baseUrl}/retirada/total/${id}`);
  }

  selectByData(data: string): Observable<any[]> {
    return this.http.get<any[]>(`${baseUrl}/retirada/data/${data}`);
  }

  selectByDataIntervalo(dataInicial: string, dataFinal: string): Observable<any[]> {
    return this.http.get<any[]>(`${baseUrl}/retirada/periodo/${dataInicial}/${dataFinal}`);
  }
   
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { baseUrl } from '../config/api';
import { Assistido } from '../models/assistido.interface';

@Injectable({
  providedIn: 'root',
})
export class AssistidosService {
  constructor(private http: HttpClient) {}

  listarAssistidos(): Observable<any> {
    return this.http.get<any>(`${baseUrl}/assistido`);
  }
  obterAssistidoById(id: number): Observable<any>{
    return this.http.get<any>(`${baseUrl}/assistido/${id}`);
  }
  cadastrarAssistido(input: Assistido): Observable<any> {
    const body = input
    return this.http.post<any>(`${baseUrl}/assistido`, body);
  }
  editarAssistido(id:number | null, input: Partial<Assistido>): Observable<any> {
    const body = input
    return this.http.put<any>(`${baseUrl}/assistido/${id}`, body);
  }
  excluirAssistido(id: number): Observable<any> {
    return this.http.delete<any>(`${baseUrl}/assistido/${id}`, {
    });
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { baseUrl } from '../config/api';

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
  cadastrarAssistido(nome: string, documento: string): Observable<any> {
    const body = {
      nome,
      documento,
    };
    return this.http.post<any>(`${baseUrl}/assistido`, body);
  }
  editarAssistido(id:number | null, nome: string, documento: string): Observable<any> {
    const body = {
      nome,
      documento,
    };
    return this.http.put<any>(`${baseUrl}/assistido/${id}`, body);
  }
  excluirAssistido(id: number): Observable<any> {
    return this.http.delete<any>(`${baseUrl}/assistido/${id}`, {
    });
  }
}

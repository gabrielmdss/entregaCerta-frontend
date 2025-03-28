import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Estoque } from '../models/estoque.interface';
import { baseUrl } from '../config/api';
import { Retirada } from '../models/retirada.interface';

@Injectable({
  providedIn: 'root',
})
export class EstoqueService {
  constructor(private http: HttpClient) {}

  selectAll(): Observable<any> {
    return this.http.get<any>(`${baseUrl}/estoque`);
  }
  insert(descricao: string, quantidade: number): Observable<any> {
    const body = {
      descricao,
      quantidade
    };
    return this.http.post<any>(`${baseUrl}/estoque`, body);
  }
  adjustStock(id: number, quantidade: number): Observable<any> {
    const body = {
      quantidade,
    };
    return this.http.post<any>(`${baseUrl}/estoque/ajuste/${id}`, body);
  }
  getById(id: number): Observable<any>{
    return this.http.get<any>(`${baseUrl}/estoque/${id}`)
  }
  update(id: number, input: Partial<Retirada>): Observable<any>{
    const body = input
    return this.http.put<any>(`${baseUrl}/estoque/${id}`, body);
  }
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${baseUrl}/estoque/${id}`)
  }
}

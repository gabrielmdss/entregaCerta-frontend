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
   
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { baseUrl } from '../config/api';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadService {

  constructor(private http: HttpClient) {}

  getUploadParams(): Observable<any>{
    return this.http.get<any>(`${baseUrl}/imagem/upload`)
  }

  async uploadImage(file: File): Promise<string> {
    const uploadParams = await firstValueFrom(this.getUploadParams());

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', uploadParams.apiKey);
    formData.append('timestamp', uploadParams.timestamp.toString());
    formData.append('signature', uploadParams.signature);
    formData.append('folder', uploadParams.folder);

    const response = await firstValueFrom(
      this.http.post<any>(`https://api.cloudinary.com/v1_1/${uploadParams.cloudName}/image/upload`, formData)
    );

    console.log(response);
    
    return response.secure_url;
  }
}

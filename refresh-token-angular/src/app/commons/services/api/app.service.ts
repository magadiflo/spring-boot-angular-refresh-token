import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, delay, tap } from 'rxjs';

import { IResponseLogin, IResponseProduct, IResponseRefreshToken } from '../app.model.interface';
import { URL_AUTH_LOGIN, URL_AUTH_REFRESH, URL_PRODUCTS } from './urls-api';


@Injectable({
  providedIn: 'root'
})
export class AppService {

  private _httpClient = inject(HttpClient);

  login(username: string, password: string): Observable<IResponseLogin> {
    return this._httpClient.post<IResponseLogin>(URL_AUTH_LOGIN, { username, password });
  }

  // El delay es para simular que hay una demora en la respuesta del backend
  refreshToken(refreshToken: string): Observable<IResponseRefreshToken> {
    console.log('[POST] /refresh-token');
    return this._httpClient.post<IResponseRefreshToken>(URL_AUTH_REFRESH, { refreshToken })
      .pipe(
        tap(() => console.log('inicio-retardo')),
        delay(5000),
        tap(() => console.log('fin-retardo')),
      );
  }

  products(): Observable<IResponseProduct[]> {
    return this._httpClient.get<IResponseProduct[]>(URL_PRODUCTS);
  }

}

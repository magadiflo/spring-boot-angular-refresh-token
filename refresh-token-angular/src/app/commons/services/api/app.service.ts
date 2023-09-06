import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { IResponseLogin, IResponseProduct } from '../app.model.interface';
import { URL_AUTH_LOGIN, URL_PRODUCTS } from './urls-api';


@Injectable({
  providedIn: 'root'
})
export class AppService {

  private _httpClient = inject(HttpClient);

  login(username: string, password: string): Observable<IResponseLogin> {
    return this._httpClient.post<IResponseLogin>(URL_AUTH_LOGIN, { username, password });
  }

  products(): Observable<IResponseProduct[]> {
    return this._httpClient.get<IResponseProduct[]>(URL_PRODUCTS);
  }

}

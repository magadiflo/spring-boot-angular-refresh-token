import { Injectable, inject } from '@angular/core';
import { HttpRequest } from '@angular/common/http';

import { LocalStorageService } from './storage/local-storage.service';
import { IDataUser } from '../models/user.interface';

import { KEY_STORAGE } from '../models/storage.enum';
import { URL_AUTH_REFRESH } from './api/urls-api';

@Injectable({
  providedIn: 'root'
})
export class RefreshTokenManagerService {

  private _isRefreshing = false;
  private _unauthorizedCount = 0;
  private _localStorageService = inject(LocalStorageService);


  public get isRefreshing(): boolean {
    return this._isRefreshing;
  }

  public set isRefreshing(value: boolean) {
    this._isRefreshing = value;
  }

  public get unauthorizedCount(): number {
    return this._unauthorizedCount;
  }

  public set unauthorizedCount(value: number) {
    this._unauthorizedCount = value;
  }

  addTokenHeader(req: HttpRequest<unknown>): HttpRequest<unknown> {
    const user = this.getDataUser();
    // Este código del URL_AUTH_REFRESH, es del código del tutorial, aquí hace esa comprobación porque el backend que usa
    // espera recibir el refreshToken en el Header, mientras que en mi caso, lo mando por el body, así que lo dejo
    // anotado solo para tenerlo en cuenta.
    const token = req.url === URL_AUTH_REFRESH ? user.refreshToken : user.accessToken;
    console.log(`Token asignado en el header: ${token}`);

    return req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  updateTokens(token: string, refreshToken: string): void {
    const user = this.getDataUser();
    user.accessToken = token;
    user.refreshToken = refreshToken;
    this._localStorageService.setItem(KEY_STORAGE.DATA_USER, user);
  }

  getDataUser(): IDataUser {
    return this._localStorageService.getItem<IDataUser>(KEY_STORAGE.DATA_USER)!;
  }

}

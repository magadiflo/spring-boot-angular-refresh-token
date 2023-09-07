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
  private _localStorageService = inject(LocalStorageService);


  public get isRefreshing(): boolean {
    return this._isRefreshing;
  }


  public set isRefreshing(value: boolean) {
    this._isRefreshing = value;
  }

  addTokenHeader(req: HttpRequest<unknown>): HttpRequest<unknown> {
    const user = this.getDataUser();
    const token = req.url === URL_AUTH_REFRESH ? user.refreshToken : user.accessToken;

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

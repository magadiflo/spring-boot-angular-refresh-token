import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { EMPTY } from 'rxjs';

import { URL_AUTH_LOGIN, URL_AUTH_REFRESH } from '../services/api/urls-api';
import { RefreshTokenManagerService } from '../services/refresh-token-manager.service';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('>> apiInterceptor');

  if (req.url === URL_AUTH_LOGIN) {
    return next(req);
  }

  const refreshTokenManagerService = inject(RefreshTokenManagerService);

  if (req.url === URL_AUTH_REFRESH) {
    const requestClone = refreshTokenManagerService.addTokenHeader(req);
    return next(requestClone);
  }

  if (refreshTokenManagerService.isRefreshing) {
    console.log('RefreshToken en proceso, ¡cancela la petición! completando el observable con EMPTY');
    return EMPTY; // Un Observable simple que solo emite la notificación completa, hace defrente un complete().
  }

  const dataUser = refreshTokenManagerService.getDataUser();
  if (!dataUser || !dataUser.accessToken) {
    inject(Router).navigate(['/']);
    return EMPTY;
  }

  const requestClone = refreshTokenManagerService.addTokenHeader(req);
  return next(requestClone);
};

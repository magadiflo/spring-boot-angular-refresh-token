import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { EMPTY, tap } from 'rxjs';

import { RefreshTokenManagerService } from '../services/refresh-token-manager.service';
import { URL_AUTH_LOGIN, URL_AUTH_REFRESH } from '../services/api/urls-api';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('[apiInterceptor] Request');

  if (req.url === URL_AUTH_LOGIN || req.url === URL_AUTH_REFRESH) {
    return next(req)
      .pipe(
        tap(apiInterceptorHandlers)
      );
  }

  const refreshTokenManagerService = inject(RefreshTokenManagerService);

  if (refreshTokenManagerService.isRefreshing) {
    console.log('¡¡¡¡...Refresh en proceso, se cancela tu petición...!!!');
    return EMPTY;
  }

  const dataUser = refreshTokenManagerService.getDataUser();

  if (!dataUser || !dataUser.accessToken) {
    console.log('No hay datos del usuario en el localStorage');
    inject(Router).navigate(['/']);
    return EMPTY;
  }

  const cloneRequest = refreshTokenManagerService.addTokenHeader(req);
  return next(cloneRequest)
    .pipe(
      tap(apiInterceptorHandlers)
    );
};

const apiInterceptorHandlers = {
  next: (event: any) => (event instanceof HttpResponse ? console.log('[apiInterceptor] Response OK') : '-'),
  error: (error: any) => console.log('[apiInterceptor] Response Falló')
}

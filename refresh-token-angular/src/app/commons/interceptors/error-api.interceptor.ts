import { HttpErrorResponse, HttpInterceptorFn, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, catchError, concatMap, finalize, throwError, tap } from 'rxjs';

import { AppService } from '../services/api/app.service';
import { RefreshTokenManagerService } from '../services/refresh-token-manager.service';

/**
 * Los errores que se lanzan en una solicitud HTTP en Angular vienen en el objeto HttpErrorResponse
 */
export const errorApiInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('[errorApiInterceptor] Request');

  const refreshTokenManagerService = inject(RefreshTokenManagerService);
  const appService = inject(AppService);
  const router = inject(Router);

  return next(req)
    .pipe(
      tap(errorApiInterceptorHandlers),
      catchError((error: HttpErrorResponse) => {

        if (error.status === HttpStatusCode.Unauthorized) {
          refreshTokenManagerService.isRefreshing = true;
          refreshTokenManagerService.unauthorizedCount++;

          if (refreshTokenManagerService.unauthorizedCount == 2) {
            console.log('unauthorizedCount == 2');
            return throwError(() => error);
          }

          return appService.refreshToken(refreshTokenManagerService.getDataUser().refreshToken)
            .pipe(
              finalize(() => {
                refreshTokenManagerService.unauthorizedCount = 0;
                refreshTokenManagerService.isRefreshing = false;
              }),
              concatMap(response => {
                refreshTokenManagerService.updateTokens(response.accessToken, response.refreshToken);
                console.log('accessToken actualizado, ejecutando request donde falló...');
                const requestClone = refreshTokenManagerService.addTokenHeader(req);
                return next(requestClone)
                  .pipe(
                    tap(errorApiInterceptorHandlers)
                  )
              }),
              catchError(err => {
                console.log('Error en el refreshToken');
                router.navigate(['/']);
                return EMPTY;
              }),
            );
        }

        return throwError(() => error);
      }),
    );
};


const errorApiInterceptorHandlers = {
  next: (event: any) => (event instanceof HttpResponse ? console.log('[errorApiInterceptor] Response OK') : '-'),
  error: (error: any) => console.log('[errorApiInterceptor] Response Falló')
}

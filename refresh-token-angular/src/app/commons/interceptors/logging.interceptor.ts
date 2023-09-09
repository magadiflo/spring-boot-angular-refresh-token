import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';

/**
 *
 * Agregué este interceptor solo para ver el órden en el que se ejecutan
 * los tres interceptores
 */

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('[loggingInterceptor] Request');

  return next(req)
    .pipe(
      tap({
        next: event => (event instanceof HttpResponse ? console.log('[loggingInterceptor] Response OK') : '-'),
        error: error => console.log('[loggingInterceptor] Response Falló')
      })
    );
};

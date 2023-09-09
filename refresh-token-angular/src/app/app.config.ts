import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { APP_ROUTES } from './app.routes';

import { apiInterceptor } from './commons/interceptors/api.interceptor';
import { errorApiInterceptor } from './commons/interceptors/error-api.interceptor';
import { loggingInterceptor } from './commons/interceptors/logging.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES),
    // El orden definido de los interceptores en el array ¡SÍ IMPORTA!, será el orden en el que serán ejecutados en el request.
    provideHttpClient(withInterceptors([apiInterceptor, errorApiInterceptor, loggingInterceptor]))
  ]
};

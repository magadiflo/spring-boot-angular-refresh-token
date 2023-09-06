import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { APP_ROUTES } from './app.routes';

import { apiInterceptor } from './commons/interceptors/api.interceptor';
import { errorApiInterceptor } from './commons/interceptors/error-api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES),
    provideHttpClient(withInterceptors([apiInterceptor, errorApiInterceptor]))
  ]
};

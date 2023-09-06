# [Refresh Token con Angular 16](https://www.youtube.com/watch?v=aolGFrOPkVk)

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.1.7.

Tutorial tomado del canal de youtube `LogiDev`

---

## [¿Cómo trabajar con HttpClient en Aplicación Standalone?](https://blog.ninja-squad.com/2022/11/09/angular-http-in-standalone-applications/)

Durante mucho tiempo, `HttpClient` fue proporcionado por el `HttpClientModule` que importábamos en el módulo de la aplicación.

````typescript
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
````

Cuando se introdujeron las `standalone APIs` en Angular v14, se abrió la puerta a escribir aplicaciones sin módulos.

El equipo de Angular introdujo una función `importProvidersFrom()`, que se podía usar en la función `bootstrapApplication()` para importar proveedores desde un módulo existente, ya que la mayor parte del ecosistema estaba estructurado en torno a módulos.

Entonces, **para proporcionar HttpClient en una aplicación standalone**, podrías hacer:

````typescript
import { bootstrapApplication, importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [importProvidersFrom(HttpClientModule)]
});
````

### Uso de provideHttpClient()

Pero desde `Angular v15`, esto puede ser reemplazado por `provideHttpClient()`, una nueva función que hace lo mismo que `importProvidersFrom(HttpClientModule)`:

````typescript
import { bootstrapApplication } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient()]
});
````
De esa manera, `HttpClient estará entonces disponible para inyección en su aplicación`.

`provideHttpClient()` es más **"tree-shakable"** que importar HttpClientModule, ya que puede habilitar las funciones que desee dándole algunos parámetros.

## [Functional Interceptors](https://blog.ninja-squad.com/2022/11/09/angular-http-in-standalone-applications/)

En Angular, los interceptores son clases que implementan la interfaz `HttpInterceptor`. Se utilizan para interceptar solicitudes y respuestas HTTP y se pueden usar para agregar encabezados, registrar solicitudes, etc.

````typescript
@Injectable({providedIn: 'root'})
export class LoggerInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log(`Request is on its way to ${req.url}`);
    return next.handle(req);
  }
}
````

Desde `Angular v15`, también puedes usar `interceptores funcionales`. Son funciones que toman como parámetros una Http Request y un Http Handler:

````typescript
export const loggerInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const logger = inject(Logger);
  logger.log(`Request is on its way to ${req.url}`);
  return next(req);
}
````

## Creando Interceptor Functional

Como estamos trabajando con Angular 16 crearemos los interceptores usando funciones y ya no con clases como lo hacíamos anteriormente. Para eso solo necesitamos agregar la bandera `--functional` y el CLI creará el interceptor de manera funcional:

````bash
ng g interceptor commons/interceptors/api --functional --skip-tests
````

Como resultado tendremos:

````typescript
import { HttpInterceptorFn } from '@angular/common/http';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
````

Si vemos el `HttpInterceptorFn` veremos que es un `type` cuya firma corresponde con la función de nuestro interceptor:

````typescript
export declare type HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => Observable<HttpEvent<unknown>>;
````

## Registrando Interceptores basado en Funciones

Los interceptores funcionales **deben registrarse** mediante `withInterceptors()`:

````typescript
import { bootstrapApplication } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(withInterceptors([loggerInterceptor]))]
});
````

Siguiendo con lo desarrollado en este proyecto, nosotros registraremos nuestros interceptores en la clase de configuración `app.config.ts`, es lo mismo que en el ejemplo anterior solo que en nuestro caso lo tenemos separado para mayor orden:

````typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES),
    provideHttpClient(withInterceptors([apiInterceptor, errorApiInterceptor]))
  ]
};
````

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

Siguiendo con lo desarrollado en este proyecto, para tener un mejor orden, al momento de crear la aplicación el Angular CLI crea el archivo `app.config.ts` donde definiremos los providers y otras configuraciones que se requieran para el arranque de la aplicación y luego este archivo se usa en el archivo `main.ts`:

````typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES),
    //El orden definido de los interceptores en el array ¡SÍ IMPORTA!, será el orden en el que serán ejecutados.
    provideHttpClient(withInterceptors([apiInterceptor, errorApiInterceptor, loggingInterceptor]))
  ]
};
````

**IMPORTANTE**

> El orden definido en el array de los interceptores `Sí importa`, será el orden en el que serán ejecutados. En nuestro caso tenemos: `provideHttpClient(withInterceptors([apiInterceptor, errorApiInterceptor, loggingInterceptor]))`, lo que significa que primero se ejecutará el interceptor `apiInterceptor`, luego `errorApiInterceptor` y finalmente `loggingInterceptor` cuando se hagan `request`, mientras que la respuesta del servidor `response` llega al último interceptor que envió al servidor y luego recorre hacia atrás, es decir, el `response` del servidor llegará primero al `loggingInterceptor` luego al `errorApiInterceptor` y finalmente al `apiInterceptor`

**NOTA**

> El tutorial solo trabaja con dos interceptores: `apiInterceptor` y el `errorApiInterceptor`, por mi parte agregué un tercer interceptor en este proyecto `loggingInterceptor` con la finalidad de ver la secuencia de ejecución de los mismos, tanto en el `request` como en el `response`.

Algo a tener en cuenta es que en todos los interceptores he creado el objeto `apiInterceptorHandlers` para usarlo dentro de un `pipe`, luego de todos los `next(req)` que realice:

````typescript
const apiInterceptorHandlers = {
  // Tiene éxito cuando hay una respuesta; Omitir otros eventos
  next: (event: any) => (event instanceof HttpResponse ? console.log('[apiInterceptor] Response OK') : '-'),
  // Operación fallida; el error es una respuesta HttpErrorResponse
  error: (error: any) => console.log('[apiInterceptor] Response Falló')
}

//Uso
return next(req)
      .pipe(
        tap(apiInterceptorHandlers)
      );
````

El código anterior es muy importante, debido a que los interceptores pueden procesar le `request` y `response` juntos, entones de alguna manera necesitaba ver la respuesta que viene del servidor, para eso usé el operador `tap()` de `RxJs`. Este operador captura si la solicitud se hizo correctamente o falló.

## [Orden de interceptación](https://angular.io/guide/http-intercept-requests-and-responses#interceptor-order)

**Angular aplica interceptores en el orden en que los proporciona.** Por ejemplo, considere una situación en la que desea gestionar la autenticación de sus solicitudes HTTP y registrarlas antes de enviarlas a un servidor. Para realizar esta tarea, puede proporcionar un servicio `AuthInterceptor` y luego un servicio `LoggingInterceptor`. **Los request** salientes `fluirían desde AuthInterceptor hacia LoggingInterceptor`. **Los responses** de estas solicitudes fluirían en la otra dirección, `desde LoggingInterceptor de regreso a AuthInterceptor`. La siguiente es una representación visual del proceso:

![interceptor order](./src/assets/interceptor-order.png)

**DATOS**

> El último interceptor del proceso es siempre el `HttpBackend` que maneja la comunicación con el servidor.
> 
> El `HttpBackend` es un `HttpHandler` final que enviará la solicitud a través de las API HTTP del navegador a un servidor.
>
> Los **interceptores** se encuentran entre la interfaz `HttpClient` y `HttpBackend`.
>
> Cuando se inyecta, `HttpBackend` envía solicitudes directamente al backend, sin pasar por la cadena del interceptor.


## Orden de los interceptores de nuestro proyecto

> En este diagrama no está el último interceptor que agregamos `loggingInterceptor`, ya que el diagrama corresponde al tutorial, pero la idea del flujo sería el mismo, eso significa que, según definimos el interceptor `loggingInterceptor` estaría a continuación del interceptor `errorApiInterceptor`

![http interceptor](./src/assets/interceptor.png)

## Flujo a implementar del Refresh Token

![refresh token](./src/assets/flujo_refresh_token.png)

---

# Flujos identificados

---

## Login (exitoso)

Este es el flujo feliz, no ocurre ningún error. Vemos que se ejecutan los tres interceptores, según como lo definimos en el archivo `app.config.ts`, esto es para el `request`, mientras que para el `response` vemos que ocurre en el sentido contrario, es decir, la **respuesta del servidor** llega al último interceptor que emitió el `request`, en nuestro caso, al `loggingInterceptor` y así sucesivamente va hacia atrás.

![login exitoso](./src/assets/01.Login-exitoso.png)

## Obteniendo productos (exitoso)

El flujo para obtener los productos es similar al flujo realizado en el login con una diferencia, en este flujo, en el interceptor `apiInterceptor` clonamos el `request` y le asignamos a la cabecera el `accessToken`:

````typescript
// api.interceptor.ts
const cloneRequest = refreshTokenManagerService.addTokenHeader(req);
  return next(cloneRequest)
    .pipe(
      tap(apiInterceptorHandlers)
    );
````

Aquí observamos cómo es que estamos clonando el request asignándole a la cabecera el `accessToken` que requiere la solicitud para obtener los productos.

````typescript
// refresh-token-management.service.ts

 addTokenHeader(req: HttpRequest<unknown>): HttpRequest<unknown> {
    const user = this.getDataUser();
    const token = req.url === URL_AUTH_REFRESH ? user.refreshToken : user.accessToken; //Ver comentario más extenso en el código fuente
    console.log(`Token asignado en el header: ${token}`);

    return req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }
````

![02.obteniendo-productos-exitoso](./src/assets/02.obteniendo-productos-exitoso.png)

## Obteniendo productos (accessToken expirado + refreshToken válido)


![03.obteniendo-productos-accesstoken-expirado](./src/assets/03.obteniendo-productos-accesstoken-expirado.png)

En este flujo estamos observando que el `accessToken` ha expirado y usamos el `refreshToken` para obtener un nuevo `accessToken` y continuar con la solicitud a la que íbamos antes de que ocurra el error.

Recordemos cuál es la secuencia de ejecución de los interceptores que tenemos configurado:

> `Request`: "Origen del request" --> apiInterceptor --> errorApiInterceptor --> loggingInterceptor --> "Servidor"
>
> `Response`: "Origen del request" <-- apiInterceptor <-- errorApiInterceptor <-- loggingInterceptor <-- "Servidor"

### Request

Cuando se hace la **solicitud de obtener productos (accessToken expirado)**, esta solicitud llega al interceptor `apiInterceptor`. En este interceptor el código que se ejecuta es el que se muestra en la parte inferior. Observamos que estamos clonando el `request`, en esa clonación agregamos a la cabecera de la petición el `accessToken` (¡ojo! en este momento ese accessToken agregado a la cabecera ya expiró) y utilizamos el parámetro `next()` para pasar la solicitud al siguiente interceptor de la cadena o si no quedan más interceptores, hacer la solictud al backend. En nuestro caso pasamos la solicitud al interceptor `errorApiInterceptor`:

````typescript
const cloneRequest = refreshTokenManagerService.addTokenHeader(req);
  return next(cloneRequest)
    .pipe(
      tap(apiInterceptorHandlers)
    );
````

Estando en el interceptor `errorApiInterceptor` no hay nada más qué hacer solo pasar la solicitud al siguiente interceptor `loggingInterceptor`. Aquí ocurre lo mismo, no hay nada qué hacer, así que pasamos la solicitud al `backend` (ya que no hay más interceptores).

### Response

Como el `accessToken` enviado ya expiró, el backend responderá con un error `Unauthorized 401`. Ahora, como estamos en el `response` la respuesta del backend irá directamente al último interceptor `loggingInterceptor`, quien no tiene nada, solo estamos imprimiendo un mensaje en función de la respuesta del backend `[loggingInterceptor] Response Falló`, luego el `response` se dirige al interceptor `errorApiInterceptor` donde también estamos imprimiendo un mensaje `[errorApiInterceptor] Response Falló`, pero además estamos utilizando el operador `catchError()` para dar tratamiento al error producido.

Dentro del operador `catchError()` verificamos si el error producido es por que el `accessToken` ha expirado gracias al código de error que nos devuelve el backend `error 401 Unauthorized`. Como eso es correcto, entonces necesitamos de alguna forma `obtener un nuevo token a partir del refreshToken`, es por eso que realizamos una petición `return appService.refreshToken(refreshTokenManagerService.getDataUser().refreshToken)...` para poder refrescar el token.

Como realizamos una petición `[POST] /refresh-token`, se genera un nuevo `request`, eso significa que volvemos a iniciar con los interceptores `apiInterceptor`, `errorApiInterceptor` y `loggingInterceptor` quien finalmente lanza la request al backend.

Ahora, como el `refreshToken` es válido, el backend responde con información actualizada llegando al `loggingInterceptor`, `errorApiInterceptor` y al `apiInterceptor`. En este punto, antes de que el `apiInterceptor` retorne el `response` con los datos del backend, apliqué un `delay(5000)` de 5 segundo en el endpoint que usamos para refrescar el token `[POST] /refresh-token`. Con este delay simulamos la demora del backend. Una vez que ha transcurrido el delay, el `apiInterceptor` envía el response al origen de la solicitud, es decir al `return appService.refreshToken(refreshTokenManagerService.getDataUser().refreshToken)...`. En este punto de origen utilizamos el operador `concatMap()` para poder continuar con la solicitud que inicialmente ocurría antes de que suceda el fallo. Obviamente tenemos que actualizar los tokens, volver a clonar la request original (la que produjo el fallo) para poder asignarle el nuevo `accessToken`. Listo, ahora utilizamos el parámetro `next()` para lanzar la solicitud. Como estamos usando el parámetro `next()` desde el interceptor `errorApiInterceptor`, la solicitud pasará al interceptor `loggingInterceptor`. Finalmente la solicitud llega al backend.

Como ahora el `accessToken` ha sido renovado, el backend nos responderá con los datos esperados, pasando la respuesta por los interceptores `loggingInterceptor`, `errorApiInterceptor` y `apiInterceptor`, finalmente desde el `apiInterceptor` se lanzará la respuesta al "Origen del request".

## Obteniendo productos (accessToken expirado + refreshToken expirado)

Cuando el `accessToken` ha expirado usamos el `refreshToken` para obtener un nuevo `accessToken` válido. Pero en este caso, el `refreshToken` también ha expirado, cuando eso ocurre necesitamos **forzosamente** que el usuario vuelva a iniciar sesión:

![04.obteniendo-productos-accesstoken-y-refreshtoken-expirado](./src/assets/04.obteniendo-productos-accesstoken-y-refreshtoken-expirado.png)

Si observamos la imagen anterior, lo que está encerrado en cuadro amarillo es parte del mismo proceso que describí en el caso anterior **(accessToken expirado + refreshToken válido)** con la diferencia de que en el caso anterior la respuesta obtenida del servidor es `exitosa` mientras que aquí la actualización del `refreshToken` falla.

**La primera vez que falla** es cuando se envía un request con un `accessToken` expirado. Para contabilizar el número de veces que falla utilizamos un contador `refreshTokenManagerService.unauthorizedCount++`, esto es porque nuestro backend retorna un `401 Unauthorized` cuando el accessToken o refreshToken expira. **La segunda vez que falla** es cuando mandamos a refrescar los tokens enviándole un `refreshToken` expirado, eso lo hacemos desde `return appService.refreshToken(refreshTokenManagerService.getDataUser().refreshToken)...`. Entonces, en ese punto, el servidor retorna por segunda vez el **error 401**, primero al interceptor `loggingInterceptor` luego al `errorApiInterceptor` y aquí lo atrapamos usando el operador `catchError`. 

Luego de atrapar el error, ingresamos dentro del `if (error.status === HttpStatusCode.Unauthorized)...`, a continuación nuestro contador aumenta en 2 y luego nos encontramos con la validación que se muestra en el código inferior. Entramos dentro de ese if y lo que hacemos es retornar un `throwError(() => error)` es decir, lanzamos el error al siguiente interceptor, que en este caso sería al `apiInterceptor`. 

````typescript
if (refreshTokenManagerService.unauthorizedCount == 2) {
  console.log('unauthorizedCount == 2');
  return throwError(() => error);
}
````

El `apiInterceptor` continúa con el `response` hacia atrás, al **origen del request** que en este caso sería al `return appService.refreshToken(refreshTokenManagerService.getDataUser().refreshToken).pipe(...)` y como estamos usando un 
`pipe(..)`, dentro de él atrapamos el error que viene en el response con el `catchError(...)` donde lo único que hacemos es `redireccionar al /login` y retornar un `EMPTY` **(EMPTY: Simplemente emite "complete" y nada más)**.

**IMPORTANTE**

> Es importante la validación que hacemos del número de veces que ocurre el error `401 Unauthorized` y lanzamos el error con el `return throwError(() => error)`. **¿Qué pasa si omitimos esa validación?**, pues lo que sucederá es que continuará con el flujo y lo que vien a continuación es realizar una `request` hacia el endpoint del `/refresh-token` donde se envia el `refreshToken`, pero sabemos que el `refreshToken` ha caducado, entonces cuando se haga la solicitud el servidor volverá a fallar retornando un error hasta el interceptor `errorApiInterceptor` quien atrapará el error y volverá a realizar la request del `/refresh-token` convirtiéndose en un bucle infinito.

## Realizando request cuando se está haciendo refresh de los tokens

Cuando el `accessToken` ha expirado realizamos una solitud al `/refresh-token` para poder actualizarlo. En ese sentido, veamos el siguiente escenario: qué pasa si el servidor experimenta un retardo y se está demorando en actualizar el token y en ese tiempo de demora el cliente hace una nueva solicitud o varias solicitudes, obviamente, como aún no se ha actualizado el `accessToken` las solicitudes se enviarán con el `accessToken` expirado. Entonces, de alguna manera debemos evitar que se envíen esos request, ya que no tendría sentido enviar un request con un `accessToken` expirado.

![05.request-cuando-esta-haciendo-refresh](./src/assets/05.request-cuando-esta-haciendo-refresh.png)

Recordemos que en el endpoint del `/refresh-token` estoy usando un `delay(5000)` de 5 segundos para simular el retardo en la actualización del `accessToken`. 

Si observamos el código del interceptor `errorApiInterceptor` veremos que luego de verificar que el error es un `401 Unauthorized` utilizamos la variable del servicio establecido en true `refreshTokenManagerService.isRefreshing = true`,
de tal forma que cuando se haga una nueva `request` mientras se está experimentando la demora, el `request` realizado irá al interceptor `apiInterceptor` donde establecemos la siguiente validación:

````typescript
if (refreshTokenManagerService.isRefreshing) {
  console.log('¡¡¡¡...Refresh en proceso, se cancela tu petición...!!!');
  return EMPTY;
}
````

Como vemos, mientras se esté actualizando el `accessToken` cualquier otra solicitud se cancelará, eso lo podemos observar también en la imagen superior donde se hizo  `3 request` siendo estos cancelados.

Una vez finalizado la actualización del `accessToken` en el interceptor `errorApiInterceptor` se ejecutará el operador `finalize()` quien reestablecerá los valores del `unauthorizedCount = 0` y del `isRefreshing = false`.

**NOTA**
> Se llama al operador `finalize()` de `RxJs` cuando la respuesta del observable devuelve `un error` o `se completa`. 
>
> Se llama cuando **la fuente finaliza por completo o por error.** La función especificada también se llamará cuando el suscriptor se dé de baja explícitamente.

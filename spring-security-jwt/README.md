# Backend para el Refresh Token con Angular 16

---

Este proyecto lo tomé de mi repositorio
[spring-security-jwt-template-project](https://github.com/magadiflo/spring-security-jwt-template-project.git) para
usarlo como **backend** en la aplicación de Angular que estoy llevando del tutorial de **LogiDev**
[Refresh Token Angular 16](https://www.youtube.com/watch?v=aolGFrOPkVk),
ya que requiero que el backend me envíe un `access token` y un `refresh token`.

El nombre original del proyecto fue `spring-security-jwt-template-project`, lo renombré a uno más
corto `spring-security-jwt`.

En el tutorial de **LogiDev** usa su backend en `NestJs`, pero en mi caso usaré el que yo mismo hice con `Spring Boot`.

---

## Configuraciones

Para realizar las pruebas del accessToken y refreshToken definiremos el siguiente tiempo de expiración para los mismos:

````
EXPIRATION_ACCESS_TOKEN = 5 * 1000;     //Test 5s
EXPIRATION_REFRESH_TOKEN = 20 * 1000;   //Test 20s
````

### EndPoint Login

````bash
curl -v -H "Content-Type: application/json" -d "{\"username\": \"martin\", \"password\": \"12345\"}" http://localhost:8080/api/v1/auth/login | jq

>
< HTTP/1.1 200
<
{
  "username": "martin",
  "accessToken": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJTeXN0ZW0iLCJhdWQiOlsiVXNlciIsIk1hbmFnYW1lbnQiLCJQb3J0YWwiXSwiaWF0IjoxNjk0MTIwNTMxLCJzdWIiOiJtYXJ0aW4iLCJhdXRob3JpdGllcyI6WyJST0xFX1NVUEVSX0FETUlOIl0sImV4cCI6MTY5NDEyMDUzNn0.d59CXuv60MfVlis5GG2i2X4RiYbZzUYrV58NdFKPZ4Hz6tAha0d2Sl1nU-XYfuIo8FUiANGF5rAGKST7g5MuvA",
  "refreshToken": "a52af4ae-b813-4f8d-8a15-2871cbb979a6"
}
````

### EndPoint refreshToken

````bash
curl -v -X POST -H "Content-Type: application/json" -d "{\"refreshToken\": \"1766f1c5-b253-4be6-8186-ef64d63662d3\"}" http://localhost:8080/api/v1/auth/refresh-token | jq

< HTTP/1.1 200
{
  "username": "martin",
  "accessToken": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJTeXN0ZW0iLCJhdWQiOlsiVXNlciIsIk1hbmFnYW1lbnQiLCJQb3J0YWwiXSwiaWF0IjoxNjk0MTIwNzA0LCJzdWIiOiJtYXJ0aW4iLCJhdXRob3JpdGllcyI6WyJST0xFX1NVUEVSX0FETUlOIl0sImV4cCI6MTY5NDEyMDcwOX0.oJKyOKQSHukgBWIQxTVwtXkUXRkkXp7r2G6pBWnwv4cRrv2CjSdVklvRXKdUOQ-qBZmjakaV5Reg61NP3k9TnA",
  "refreshToken": "1766f1c5-b253-4be6-8186-ef64d63662d3"
}
````

### EndPoint products

````bash
curl -v -H "Authorization: Bearer <Aquí_accessToken>" http://localhost:8080/api/v1/products | jq

< HTTP/1.1 200
[
  {"id":1,"name":"Pc gamer","price":3500.0},
  {"id":2,"name":"Teclado inalámbrico","price":150.8},
  {"id":3,"name":"Mouse inalámbrico","price":99.9},
  {"id":4,"name":"Celular Samsung A7","price":5900.0}
]
````

### EndPoint products - accessToken expirado

````bash
curl -v -H "Authorization: Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJTeXN0ZW0iLCJhdWQiOlsiVXNlciIsIk1hbmFnYW1lbnQiLCJQb3J0YWwiXSwiaWF0IjoxNjk0MTIxNTY1LCJzdWIiOiJtYXJ0aW4iLCJhdXRob3JpdGllcyI6WyJST0xFX1NVUEVSX0FETUlOIl0sImV4cCI6MTY5NDEyMTU3MH0.iOC0BpG4q_V1muvKTx8i_D0DdLIdbrfGw99z_0IzI-DlS6gZ9GOq4iS4uw3navgAMccYd-A6ZUw9NLZYBDBWOg" http://localhost:8080/api/v1/products | jq

< HTTP/1.1 401
<
{
  "path": "/api/v1/products",
  "error": "Unauthorized",
  "message": "Full authentication is required to access this resource",
  "status": 401,
  "ejemplo": "Caracteres con Perú Ñandú"
}
````

### RefreshToken expirado

````bash
curl -v -X POST -H "Content-Type: application/json" -d "{\"refreshToken\": \"04f73a70-d669-45cc-b972-5b7091ef09b4\"}" http://localhost:8080/api/v1/auth/refresh-token | jq

< HTTP/1.1 401
{
  "statusCode":401,
  "httpStatus":"UNAUTHORIZED",
  "reasonPhrase":"Unauthorized",
  "message":"El refresh token ha expirado. Por favor vuelva a iniciar sesión.",
  "timestamp":"2023-07-06T12:31:57.2926118"
}
````

### RefreshToken inválido

````bash
curl -v -X POST -H "Content-Type: application/json" -d "{\"refreshToken\": \"350b9d96-1258-4896-b35c-c833cfa12f41\"}" http://localhost:8080/api/v1/auth/refresh-token | jq

< HTTP/1.1 401
{
  "statusCode":401,
  "httpStatus":"UNAUTHORIZED",
  "reasonPhrase":"Unauthorized",
  "message":"RefreshToken no encontrado. Inicie sesión.",
  "timestamp":"2023-07-06T12:24:54.5496169"
}
````

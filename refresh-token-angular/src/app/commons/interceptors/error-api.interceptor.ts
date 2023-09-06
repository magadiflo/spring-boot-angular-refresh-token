import { HttpInterceptorFn } from '@angular/common/http';

export const errorApiInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('>> errorApiInterceptor');
  return next(req);
};

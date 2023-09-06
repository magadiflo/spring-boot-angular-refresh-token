import { HttpInterceptorFn } from '@angular/common/http';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('>> apiInterceptor');
  return next(req);
};

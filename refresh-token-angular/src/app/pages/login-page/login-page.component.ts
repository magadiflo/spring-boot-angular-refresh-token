import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { LocalStorageService } from '../../commons/services/storage/local-storage.service';
import { AppService } from '../../commons/services/api/app.service';
import { KEY_STORAGE } from '../../commons/models/storage.enum';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent {

  private readonly _fb = inject(FormBuilder);
  private readonly _router = inject(Router);
  private readonly _appService = inject(AppService);
  private readonly _localStorageService = inject(LocalStorageService);

  public form: FormGroup = this._fb.nonNullable.group({
    username: ['martin', [Validators.required]],
    password: ['12345', [Validators.required]],
  });

  login(): void {
    if (this.form.invalid) return;

    const { username, password } = this.form.value;
    this._appService.login(username, password)
      .subscribe(response => {
        console.log({response});
        this._localStorageService.setItem(KEY_STORAGE.DATA_USER, response);
        this._router.navigate(['/dashboard']);
      });
  }

}

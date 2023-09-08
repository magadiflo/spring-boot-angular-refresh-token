import { Component, inject } from '@angular/core';
import { NgFor } from '@angular/common';

import { IResponseProduct } from '../../commons/services/app.model.interface';
import { AppService } from '../../commons/services/api/app.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [NgFor],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent {

  public products: IResponseProduct[] = [];
  private _appService = inject(AppService);

  updateTable(): void {
    this._appService.products()
      .subscribe(products => this.products = products);
  }

}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { routes } from '../../../../../app.routes';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'x-component',
  imports: [RouterOutlet],
  templateUrl: './component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class OrderComponent { }

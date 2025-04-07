import { Component } from '@angular/core';
import { FooterComponent } from "../components/footer/footer.component";
import { BodyComponent } from "../components/body/body.component";
import { HeaderComponent } from "../components/header/header.component";

@Component({
  selector: 'app-main-layout',
  imports: [FooterComponent, BodyComponent, HeaderComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {

}

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { KeyBinder } from '@thegraid/easeljs-lib';
import { StageComponent } from './stage/stage.component';

@NgModule({
  declarations: [
    AppComponent,
    StageComponent
  ],
  imports: [
    BrowserModule,
  ],
  providers: [
    KeyBinder,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

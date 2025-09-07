import { AppModule } from './app/app.module';
import { bootstrapApplication, BrowserModule, platformBrowser } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

bootstrapApplication(AppComponent, 
  {
  providers: [
  BrowserModule,
  provideZonelessChangeDetection(),
  provideHttpClient(withInterceptorsFromDi()),
]
});
platformBrowser().bootstrapModule(AppModule);
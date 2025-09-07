import { AppModule } from './app/app.module';
import { bootstrapApplication, BrowserModule, platformBrowser } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

export const entries = Object.entries as <T>(
  obj: T
) => [keyof T, T[keyof T]][]
export const keys = Object.keys as <T>(obj: T) => T[keyof T][]
export const values = Object.values as <T>(obj: T) => T[keyof T][]

bootstrapApplication(AppComponent, 
  {
  providers: [
  BrowserModule,
  provideZonelessChangeDetection(),
  provideHttpClient(withInterceptorsFromDi()),
]
});
platformBrowser().bootstrapModule(AppModule);
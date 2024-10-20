/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { Esp32UiComponent } from './esp32-ui.component';

describe('Esp32UiComponent', () => {
  let component: Esp32UiComponent;
  let fixture: ComponentFixture<Esp32UiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Esp32UiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Esp32UiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

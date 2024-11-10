/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { OrUiComponent } from './or-ui.component';

describe('OrUiComponent', () => {
  let component: OrUiComponent;
  let fixture: ComponentFixture<OrUiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrUiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

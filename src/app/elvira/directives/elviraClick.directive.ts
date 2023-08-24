import { Directive, Output, EventEmitter, HostListener } from '@angular/core';

@Directive({ selector: '[elviraclick]' })
export class ElviraClickDirective {
  @Output('elviraclick') elviraclick = new EventEmitter();
  pressed_down = false;

  constructor() { }

  // For enter
  @HostListener('keydown', ['$event'])
  handleEnter(event) {
    if (event.key === 'Enter') {
      this.elviraclick.emit(event);
    }
  }

  // Imitate click -> pressed down
  @HostListener('mousedown', ['$event'])
  pressedDown(event) {
    this.pressed_down = true;
  }

  // up -> released
  @HostListener('mouseup', ['$event'])
  released(event) {
    if (this.pressed_down) { // if was pressed down, only than
      this.pressed_down = false;
      event.preventDefault();
      this.elviraclick.emit(event);
    }
  }
}
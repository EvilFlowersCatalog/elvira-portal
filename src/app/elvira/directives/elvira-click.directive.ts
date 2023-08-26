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

  // Imitate click
  // pressed down
  @HostListener('mousedown', ['$event'])
  onPressedDown(event: MouseEvent) {
    event.preventDefault();
    if (event.button !== 2) { // not for right click
      this.pressed_down = true;
    }
  }

  // up -> released
  @HostListener('mouseup', ['$event'])
  onReleased(event) {
    event.preventDefault();
    if (this.pressed_down) { // if was pressed down, only than
      this.pressed_down = false;
      this.elviraclick.emit(event);
    }
  }

  @HostListener('mouseleave', ['$event'])
  onMouseLeave() {
    this.pressed_down = false; // Reset the flag if the mouse leaves the button
  }
}
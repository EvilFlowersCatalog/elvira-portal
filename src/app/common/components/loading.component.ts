import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-loading',
  template: `
  <div class="circular-loader-container">
    <img
      src="../../../assets/logos/title_logo.png"
      class="loading-logo"
    />
    <div 
    fxLayout="row" 
    style="width: 100%; margin-top: 120px"
    >
      <div class="loading-dot-tmp" [ngClass]="{'loading-active-dot-one': activeIndex === 1}"></div>
      <div class="loading-dot" [ngClass]="{'loading-active-dot-one': activeIndex === 2}"></div>
      <div class="loading-dot" [ngClass]="{'loading-active-dot-one': activeIndex === 3}"></div>
      <div class="loading-dot" [ngClass]="{'loading-active-dot-one': activeIndex === 4}"></div>
      <div class="loading-dot" [ngClass]="{'loading-active-dot-one': activeIndex === 5}"></div>
    </div>
  </div>`,
  styles: [`
  .circular-loader-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100%;
  }

  .loading-logo {
    position: absolute;
    height: 50px;
  }

  .loading-dot-tmp {
    height: 20px;
    width: 20px;
    background-color: white;
    box-shadow: 0 0 10px white;
    border-radius: 50%;
    transition: transform 1s ease;
  }

  .loading-dot {
    height: 20px;
    width: 20px;
    background-color: white;
    box-shadow: 0 0 10px white;
    border-radius: 50%;
    margin-left: 30px;
    transition: transform 1s ease;
  }
  
  .loading-active-dot-one {
    transform: scale(3);
  }

  @media screen and (max-width: 599px) {
    .loading-logo {
      height: 35px;
    }
  }
  `],
})
export class LoadingComponent implements OnInit{
  activeIndex = 1;
  
  ngOnInit(): void {
    setInterval(() => {
      if(this.activeIndex === 5) {
        this.activeIndex = 1;
      }
      else {
        this.activeIndex++;
      }
    }, 300);
  }
}

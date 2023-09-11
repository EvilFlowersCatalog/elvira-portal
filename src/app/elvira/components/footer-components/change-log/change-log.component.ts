import { Component, OnInit } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';

@Component({
  selector: 'app-change-log',
  template: `
    <div fxLayout="column" class="change-log-container">
      <!-- Change log content -->
      <markdown [data]="changeLog"></markdown>
    </div>
  `,
  styles: [
    `
      .change-log-container {
        background-color: transparent !important;
        padding: 16px;
        flex: 1;
      }
    `,
  ],
})
export class ChangeLogComponent implements OnInit {
  public changeLog: string;

  constructor(private readonly markdownService: MarkdownService) {}

  ngOnInit(): void {
    this.markdownService
      .getSource('assets/CHANGELOG.md')
      .subscribe((content: string) => {
        this.changeLog = content;
        window.scrollTo(0, 0);
      });
  }
}

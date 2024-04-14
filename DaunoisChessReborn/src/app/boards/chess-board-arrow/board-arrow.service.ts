// inspired from https://github.com/mcba1n/chessboard-arrows/blob/master/ChessboardArrows.ts

import { Injectable } from '@angular/core';

const NUM_SQUARES = 8;
type userKeyboardKey = 'ctrl' | 'alt' | 'none';

@Injectable({
  providedIn: 'root',
})
export class ChessboardArrowService {
  private colorsMapping: { [k in userKeyboardKey]: string } = {
    ctrl: 'rgb(234, 0, 0)',
    alt: 'rgb(0, 113, 234)',
    none: 'rgb(0, 234, 43)',
  };
  private drawCanvas: any;
  private drawContext: any;
  private primaryCanvas: any;
  private primaryContext: any;

  private initialPoint: any;
  private finalPoint: any;
  private arrowWidth: number;
  private mouseDown: boolean;

  private lastKeyPressed: string = 'none';

  constructor() {
    this.initialPoint = { x: null, y: null };
    this.finalPoint = { x: null, y: null };
    this.arrowWidth = 15;
    this.mouseDown = false;
  }

  initializeCanvas(): void {
    // drawing canvas
    this.drawCanvas = document.getElementById('drawingCanvas');
    this.drawContext = this.setDPI(this.drawCanvas);

    // primary canvas
    this.primaryCanvas = document.getElementById('primaryCanvas');
    this.primaryContext = this.setDPI(this.primaryCanvas);
    this.setCanvasStyles();
  }

  manageKeyPressed(keyEvent: KeyboardEvent): void {
    if (keyEvent.ctrlKey) this.lastKeyPressed = 'ctrl';
    else if (keyEvent.altKey) this.lastKeyPressed = 'alt';
    else this.lastKeyPressed = 'none';
    this.setCanvasStyles();
  }

  // source: https://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag
  private drawArrow(
    context: any,
    fromx: number,
    fromy: number,
    tox: number,
    toy: number,
    r: number
  ): void {
    const x_center = tox;
    const y_center = toy;
    let angle: number, x: number, y: number;

    context.beginPath();

    angle = Math.atan2(toy - fromy, tox - fromx);
    x = r * Math.cos(angle) + x_center;
    y = r * Math.sin(angle) + y_center;

    context.moveTo(x, y);

    angle += (1 / 3) * (2 * Math.PI);
    x = r * Math.cos(angle) + x_center;
    y = r * Math.sin(angle) + y_center;

    context.lineTo(x, y);

    angle += (1 / 3) * (2 * Math.PI);
    x = r * Math.cos(angle) + x_center;
    y = r * Math.sin(angle) + y_center;

    context.lineTo(x, y);
    context.closePath();
    context.fill();
  }

  private getMouseCoordinates(
    canvas: any,
    evt: MouseEvent
  ): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: this.Q(evt.clientX - rect.left),
      y: this.Q(evt.clientY - rect.top),
    };
  }

  private setContextStyle(context: any): void {
    context.strokeStyle = context.fillStyle =
      this.colorsMapping[this.lastKeyPressed as userKeyboardKey];
    context.lineJoin = 'butt';
  }

  private setCanvasStyles() {
    this.setContextStyle(this.drawContext);
    this.setContextStyle(this.primaryContext);
  }

  public drawBoardLightCircle(event: MouseEvent): void {
    if (event.button === 2) {
      // right click
      this.mouseDown = true;
      this.initialPoint = this.finalPoint = this.getMouseCoordinates(
        this.drawCanvas,
        event
      );
      this.drawCircle(
        this.drawContext,
        this.initialPoint.x,
        this.initialPoint.y,
        this.primaryCanvas.width / (NUM_SQUARES * 2)
      );
    }
  }

  public drawBoardFullCircle(event: MouseEvent): void {
    if (event.button === 2) {
      // right click
      this.mouseDown = false;
      // if starting position == ending position, draw a circle to primary canvas
      if (
        this.initialPoint.x == this.finalPoint.x &&
        this.initialPoint.y == this.finalPoint.y
      ) {
        this.drawCircle(
          this.primaryContext,
          this.initialPoint.x,
          this.initialPoint.y,
          this.primaryCanvas.width / (NUM_SQUARES * 2)
        ); // reduce radius of square by 1px
      }
      // otherwise draw an arrow
      else {
        this.drawArrowToCanvas(this.primaryContext);
      }
      this.drawContext.clearRect(
        0,
        0,
        this.drawCanvas.width,
        this.drawCanvas.height
      );
    } else if (event.button === 0) {
      // left click
      this.clearCanvas();
    }
  }

  public clearCanvas(): void {
    // clear canvases
    this.drawContext.clearRect(
      0,
      0,
      this.drawCanvas.width,
      this.drawCanvas.height
    );
    this.primaryContext.clearRect(
      0,
      0,
      this.primaryCanvas.width,
      this.primaryCanvas.height
    );
  }

  public drawingArrow(event: MouseEvent): void {
    if (!this.mouseDown) return;
    this.finalPoint = this.getMouseCoordinates(this.drawCanvas, event);

    if (
      this.initialPoint.x == this.finalPoint.x &&
      this.initialPoint.y == this.finalPoint.y
    )
      return;

    this.drawContext.clearRect(
      0,
      0,
      this.drawCanvas.width,
      this.drawCanvas.height
    );
    this.drawArrowToCanvas(this.drawContext);
  }

  private drawArrowToCanvas(context: any): void {
    // offset finalPoint so the arrow head hits the center of the square
    let xFactor, yFactor, offsetSize;
    if (this.finalPoint.x == this.initialPoint.x) {
      yFactor =
        Math.sign(this.finalPoint.y - this.initialPoint.y) * this.arrowWidth;
      xFactor = 0;
    } else if (this.finalPoint.y == this.initialPoint.y) {
      xFactor =
        Math.sign(this.finalPoint.x - this.initialPoint.x) * this.arrowWidth;
      yFactor = 0;
    } else {
      // find delta x and delta y to achieve hypotenuse of arrowWidth
      const slope_mag = Math.abs(
        (this.finalPoint.y - this.initialPoint.y) /
          (this.finalPoint.x - this.initialPoint.x)
      );
      xFactor =
        (Math.sign(this.finalPoint.x - this.initialPoint.x) * this.arrowWidth) /
        Math.sqrt(1 + Math.pow(slope_mag, 2));
      yFactor =
        Math.sign(this.finalPoint.y - this.initialPoint.y) *
        Math.abs(xFactor) *
        slope_mag;
    }

    // draw line
    context.beginPath();
    context.lineCap = 'round';
    context.lineWidth = 8;
    context.moveTo(this.initialPoint.x, this.initialPoint.y);
    context.lineTo(this.finalPoint.x - xFactor, this.finalPoint.y - yFactor);
    context.stroke();

    // draw arrow head
    this.drawArrow(
      context,
      this.initialPoint.x,
      this.initialPoint.y,
      this.finalPoint.x - xFactor,
      this.finalPoint.y - yFactor,
      this.arrowWidth
    );
  }

  private Q(x: number): number {
    const d = this.primaryCanvas.width / NUM_SQUARES;
    return d * (Math.floor(x / d) + 0.5);
  }

  private drawCircle(context: any, x: any, y: any, r: number): void {
    context.beginPath();
    context.lineWidth = 3;
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.stroke();
  }

  // source: https://stackoverflow.com/questions/14488849/higher-dpi-graphics-with-html5-canvas
  private setDPI(canvas: any): any {
    // Set up CSS size.
    canvas.style.width = canvas.style.width || canvas.width + 'px';
    canvas.style.height = canvas.style.height || canvas.height + 'px';

    // Get size information.
    var scaleFactor = 1;
    // var scaleFactor = dpi / 96;
    var width = parseFloat(canvas.style.width);
    var height = parseFloat(canvas.style.height);

    // Backup the canvas contents.
    var oldScale = canvas.width / width;
    var backupScale = scaleFactor / oldScale;
    var backup = canvas.cloneNode(false);
    backup.getContext('2d').drawImage(canvas, 0, 0);

    // Resize the canvas.
    var ctx = canvas.getContext('2d');
    canvas.width = Math.ceil(width * scaleFactor);
    canvas.height = Math.ceil(height * scaleFactor);

    // Redraw the canvas image and scale future draws.
    ctx.setTransform(backupScale, 0, 0, backupScale, 0, 0);
    ctx.drawImage(backup, 0, 0);
    ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);
    return ctx;
  }
}

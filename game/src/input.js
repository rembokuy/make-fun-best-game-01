// Keyboard + mouse state, in canvas coordinates. The game reads this
// object each frame; edge-triggered presses are consumed by the caller
// so a single tap never fires twice.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: 640, y: 300, down: false, clicked: false, clickX: 0, clickY: 0 };
    this.canvas = canvas;

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (!e.repeat) this.pressed.add(k);
      this.keys.add(k);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouse.down = false;
    });

    const toCanvas = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 1280,
        y: ((e.clientY - rect.top) / rect.height) * 720,
      };
    };
    canvas.addEventListener('mousemove', (e) => {
      const p = toCanvas(e);
      this.mouse.x = p.x;
      this.mouse.y = p.y;
    });
    canvas.addEventListener('mousedown', (e) => {
      const p = toCanvas(e);
      this.mouse.x = p.x;
      this.mouse.y = p.y;
      this.mouse.down = true;
      if (e.button === 0) {
        this.mouse.clicked = true;
        this.mouse.clickX = p.x;
        this.mouse.clickY = p.y;
      }
      if (e.button === 2) this.pressed.add('flare');
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.down = false;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  down(key) {
    return this.keys.has(key);
  }

  // True once per physical press; clears after the frame reads it.
  wasPressed(key) {
    return this.pressed.has(key);
  }

  // True once per left click; clears after the frame reads it.
  wasClicked() {
    return this.mouse.clicked;
  }

  clickPoint() {
    return { x: this.mouse.clickX, y: this.mouse.clickY };
  }

  get firing() {
    return this.mouse.down || this.keys.has(' ');
  }

  endFrame() {
    this.pressed.clear();
    this.mouse.clicked = false;
  }
}

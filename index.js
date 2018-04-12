const step = 1;
const fieldX = 1;
const fieldY = 1;
const fieldWidth = 10;
const fieldHeight = 20;
const tileWidth = 20;
const tileHeight = 20;

const I = [4, 5, 6, 7];
const O = [0, 1, 2, 3];
const L = [3, 4, 5, 6];
const J = [3, 4, 5, 8];
const T = [3, 4, 5, 7];
const S = [4, 5, 6, 7];
const Z = [3, 4, 7, 8];

const colorLight = 'rgba(223, 223, 223, 1)';
const colorMedium = 'rgba(127, 127, 127, 1)';
const colorDark = 'rgba(31, 31, 31, 1)';
const colorRed = 'rgba(239, 79, 119, 1)';
const colorGreen = 'rgba(95, 175, 127, 1)';
const colorBlue = 'rgba(0, 87, 158, 1)';
const colorCyan = 'rgba(63,  175, 175, 1)';
const colorPurple = 'rgba(87, 63, 159, 1)';
const colorYellow = 'rgba(239, 175, 127, 1)';
const colorOrange = 'rgba(239, 123, 107, 1)';

const font = '20px Avenir, Lato, sans-serif';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

class Matrix {
  constructor(data, x, y, s) {
    this.data = data;
    this.x = x;
    this.y = y;
    this.s = s;
  }
  getX(index) {
    return index % this.s;
  }
  getY(index) {
    return Math.floor(index / this.s);
  }
  getPosition(index) {
    return {x: this.getX(index), y: this.getY(index)};
  }
  getIndex(x, y) {
    return this.s * y + x;
  }
  getRow(index) {
    return this.data.slice(index * this.s, index * this.s + this.s);
  }
  rotateIndex(index, reverse) {
    const {x, y} = this.getPosition(index);
    const s = this.s;
    if (reverse) {
      return s * (s - 1) - (x * s) + y;
    } else {
      return (s - 1) + (x * s) - y;
    }
  }
  rotate(reverse) { // 90 degrees
    this.data = this.data.map((index) => {
      return this.rotateIndex(index, reverse);
    });
  }
}

class Shape extends Matrix {
  constructor(data, x, y, s) {
    super(data, x, y, s);
    this.color = colorDark;
  }
  absX(x = 0) {
    return this.x + x;
  }
  absY(y = 0) {
    return this.y + y; 
  }
  absPosition(index = 0) {
   const {x, y} = this.getPosition(index);
   return {x: this.absX(x), y: this.absY(y)}; 
  }
  render(offsetX = 0, offsetY = 0) {
    this.data.forEach((index) => {
      let {x, y} = this.absPosition(index);
      x = (x + fieldX) * tileWidth + offsetX;
      y = (y + fieldY) * tileHeight + offsetY;
      ctx.fillStyle = this.color;
      ctx.fillRect(x + 1, y + 1, tileWidth - 2, tileHeight - 2);
    });
  }
}

class Field extends Matrix {
  constructor(tetrominos) {
    super(Array(fieldWidth * fieldHeight).fill(0), fieldX, fieldY, fieldWidth);
    this.tetrominos = tetrominos;
    this.w = fieldWidth;
    this.h = fieldHeight;
    this.remove();
  }
  check(tetromino) {
    let symdiff = true;
    tetromino.data.forEach((value, index) => {
      if (symdiff) {
        const {x, y} = tetromino.absPosition(value);
        const cell = this.getIndex(x, y);
        if (x < 0 || x > this.w - 1 || y > this.h - 1 || this.data[cell] > 0) {
          symdiff = false;
        }
      }
    });
    return symdiff;
  }
  add(tetromino) {
    tetromino.data.forEach((value, index) => {
      const {x, y} = tetromino.absPosition(value);
      const cell = this.getIndex(x, y - 1);
      const name = tetromino.constructor.name;
      this.data[cell] = this.tetrominos.findIndex(t => t.constructor.name === name) + 1;
    });
  }
  remove() {
    let rows = [];
    for(let i = 0; i < this.h; i++) {
      if (this.getRow(i).every((v) => { return v > 0 })) {
        rows.push(i);
      }
    }
    rows.forEach((v) => { this.clear(v)});
    return rows.length;
  }
  clear(line) {
    const clone = this.data.slice(0);
    clone.forEach((value, index) => {
      if (this.getY(index) <= line) {
        this.data[index] = clone[index - this.w] || 0;
      }
    });
  }
  render() {
    ctx.fillStyle = colorLight;
    ctx.fillRect(this.x * tileWidth, this.y * tileHeight, this.w * tileWidth, this.h * tileHeight);
    this.data.forEach((value, index) => {
      let x = (this.x + this.getX(index));
      let y = (this.y + this.getY(index));
      if (value > 0) {
        var color = this.tetrominos[value - 1].color;
      } else {
        var color = colorLight;
      }
      ctx.fillStyle = color;
      ctx.fillRect(x * tileWidth + 1, y * tileHeight + 1, tileWidth - 2, tileHeight - 2);
    });
  }
}

class Game {
  constructor(field) {
    this.field = field;
    this.tetromino = this.random();
    this.next = this.random();
    this.step = step;
    this.level = 0;
    this.score = 0;
    this.lines = 0;
    this.count = 0;
    this.running = false;
    this.gameover = false;
  }
  start() {
    this.running = true;
    this.controls();
    this.loop();
  }
  stop() {
    this.running = false;
  }
  clone(instance) {
    return Object.assign(
      Object.create(
        Object.getPrototypeOf(instance)
      ), instance
    );
  }
  random() {
    const min = 0, max = this.field.tetrominos.length;
    const index = Math.floor(Math.random() * max) + min;
    return this.clone(this.field.tetrominos[index]);
  }
  loop() {
    if (this.running) {
      this.update();
      setTimeout(this.loop.bind(this), this.step * 1000);
    }
  }
  update() {
    this.check((t) => {
      t.y += 1;
      if (!this.field.check(t)) {
        this.tetromino = this.next;
        this.next = this.random();
        this.field.add(t);
        this.count++;
        let lines = this.field.remove();
        if (lines > 0) {
          this.lines += lines;
          this.score += (this.level + 1) * Math.pow(2, lines) * 50;
        }
        this.level = Math.floor(this.lines / 10);
        this.step = Math.pow(0.75, this.level);
        if (this.field.getRow(0).some((v) => { return v > 0 })) {
          this.gameover = true;
          this.running = false;
          ctx.fillStyle = colorLight;
          ctx.fillText('Game Over!', tileWidth, canvas.height - tileHeight);
        }
      }
    });
  }
  check(update) {
    let next = this.clone(this.tetromino);
    update(next);
    if (this.field.check(next)) {
      this.tetromino = next;
      this.render();
    }
  }
  render() {
    const offsetX = (fieldX + fieldWidth + 1) * tileWidth;
    const offsetY = tileHeight * 2;
    ctx.fillStyle = colorDark;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colorLight;
    ctx.font = font;
    ctx.fillText('Level: ' + this.level, offsetX, offsetY);
    ctx.fillText('Lines: ' + this.lines, offsetX, offsetY + 2 * tileHeight);
    ctx.fillText('Score: ' + this.score, offsetX, offsetY + 4 * tileHeight);
    ctx.fillText('Tetrominos: ' + this.count, offsetX, offsetY + 6 * tileHeight);
    this.field.render();
    this.tetromino.render();
    this.next.render(offsetX - (this.next.x + 1) * tileWidth, offsetY + 7 * tileHeight);
    ctx.fillStyle = colorDark;
    ctx.fillRect(0, 0, canvas.width, tileHeight);
  }
  controls() {
    document.addEventListener('keydown', (event) => {
      if (this.running) {
        this.check((t) => {
          switch(event.keyCode) {
            case 37:
            case 65:
              t.x -= 1;
              break;
            case 39:
            case 68:
              t.x += 1;
              break;
            case 40:
            case 83:
              t.y += 1;
              break;
            case 38:
            case 87:
              t.rotate();
              break;
          }  
        });
      }
    });  
  }
}

class TetrominoI extends Shape {
  constructor() {
    super(I, 3, -2, 4);
    this.color = colorCyan;
  }
}

class TetrominoO extends Shape {
  constructor() {
    super(O, 4, -1, 2);
    this.color = colorYellow;
  }
}

class TetrominoL extends Shape {
  constructor() {
    super(L, 4, -2, 3);
    this.color = colorOrange;
  }
}

class TetrominoJ extends Shape {
  constructor() {
    super(J, 4, -2, 3);
    this.color = colorBlue;
  }
}

class TetrominoT extends Shape {
  constructor() {
    super(T, 4, -2, 3);
    this.color = colorPurple;
  }
}

class TetrominoS extends Shape {
  constructor() {
    super(S, 4, -2, 3);
    this.color = colorGreen;
  }
}

class TetrominoZ extends Shape {
  constructor() {
    super(Z, 4, -2, 3);
    this.color = colorRed;
  }
}

const main = () => {
  const tetrominos = [
    new TetrominoI(),
    new TetrominoO(),
    new TetrominoL(),
    new TetrominoJ(),
    new TetrominoT(),
    new TetrominoS(),
    new TetrominoZ(),
  ];

  const field = new Field(tetrominos);
  const game = new Game(field);

  game.start();
}

main();

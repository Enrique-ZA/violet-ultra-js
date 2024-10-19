const vioType = {};
vioType.Image = HTMLImageElement;
vioType.ImageData = ImageData;
function vioIsNumber(value) {
  return typeof value === "number" && isFinite(value);
}
vioType.SetBit = function(value) {
  return value ? 1 : 0;
};
vioType.NormalizeBits = function(value) {
  if (Array.isArray(value)) {
    return value.map(vioType.NormalizeBits);
  } else {
    return vioType.SetBit(value);
  }
};
vioType.SetUint8 = function(value) {
  return Math.max(0, Math.min(255, Math.floor(value)));
};
vioType.NormalizeUint8s = function(value) {
  if (Array.isArray(value)) {
    return value.map(vioType.NormalizeUint8s);
  } else {
    return vioType.SetUint8(value);
  }
};
vioType.SetUint16 = function(value) {
  return Math.max(0, Math.min(65535, Math.floor(value)));
};
vioType.NormalizeUint16s = function(value) {
  if (Array.isArray(value)) {
    return value.map(vioType.NormalizeUint16s);
  } else {
    return vioType.SetUint16(value);
  }
};
const vioInfinity = Number.MAX_VALUE;
const vioInfinityMax = Number.MAX_VALUE;
const vioInfinityMin = Number.MIN_VALUE;
let vioWidth;
let vioHeight;
let vioCurrentFillColor = null;
let vioCurrentStrokeColor = null;
let vioCurrentStrokeWeight = 1;
let vioDeltaTime = 0;
let vioPrevTimestamp = 0;
let vioFrameCount = 0;
let vioLastFpsUpdate = 0;
let vioCurrentFps = 0;
let vioKey = "";
let vioCanvasCtx;
let vioCanvasCtxRender;
function vioCreateScreen(w, h) {
  const canvas = document.createElement("canvas");
  canvas.id = "vioCanvas";
  if (canvas === null) {
    throw new Error("Violet: Error creating 2D canvas.");
  }
  vioCanvasCtx = canvas.getContext("2d");
  if (vioCanvasCtx === null) {
    throw new Error("Violet: Error creating 2D canvas");
  }
  if (w < 0 || w > 7680) {
    throw new Error(
      "Violet: Screen width needs to be between 0 and 7680 (inclusive)",
    );
  }
  if (h < 0 || h > 4320) {
    throw new Error(
      "Violet: height needs to be between 0 and 4320 (inclusive)",
    );
  }
  canvas.width = w;
  canvas.height = h;
  const mainCanvas = document.createElement("canvas");
  const ctx = mainCanvas.getContext("2d");
  if (ctx === null) {
    throw new Error("Violet: Error creating main canvas context");
  }
  mainCanvas.width = w;
  mainCanvas.height = h;
  vioCanvasCtxRender = ctx;
  document.body.appendChild(mainCanvas);
  vioWidth = vioCanvasCtx.canvas.width;
  vioHeight = vioCanvasCtx.canvas.height;
}
function vioInitializeEngine() {
  if (typeof window.vioPreLoad === "function") {
    Promise.resolve(window.vioPreLoad())
      .then(() => {
        vioStartEngine();
      })
      .catch((error) => {
        console.error("Error in vioPreLoad:", error);
      });
  } else {
    vioStartEngine();
  }
}
function vioHandleKeyDown(e) {
  vioKey = e.key;
  if (typeof window.vioKeyDown === "function") {
    window.vioKeyDown();
  }
}
function vioHandleKeyUp(e) {
  const releasedKey = e.key;
  if (typeof window.vioKeyUp === "function") {
    vioKey = releasedKey;
    window.vioKeyUp();
  }
  if (vioKey === releasedKey) {
    vioKey = "";
  }
}
function vioStartEngine() {
  if (typeof window.vioStart !== "function") {
    console.error(
      "No vioStart function defined. Define function vioStart() in your script.",
    );
    return;
  }
  if (typeof window.vioUpdate !== "function") {
    console.error(
      "No vioUpdate function defined. Define function vioUpdate() in your script.",
    );
    return;
  }
  if (typeof window.vioDraw !== "function") {
    console.error(
      "No vioDraw function defined. Define function vioDraw() in your script.",
    );
    return;
  }
  window.vioStart();
  window.requestAnimationFrame(vioMainLoop);
  window.addEventListener("keydown", vioHandleKeyDown);
  window.addEventListener("keyup", vioHandleKeyUp);
}
function vioMainLoop(timestamp) {
  vioDeltaTime = (timestamp - vioPrevTimestamp) / 1000;
  vioPrevTimestamp = timestamp;
  vioFrameCount++;
  if (timestamp - vioLastFpsUpdate >= 1000) {
    vioCurrentFps = vioFrameCount;
    vioFrameCount = 0;
    vioLastFpsUpdate = timestamp;
  }
  window.vioUpdate();
  window.vioDraw();
  if (vioCanvasCtx === null) {
    throw new Error("Violet: Error creating 2D canvas.");
  }
  if (vioCanvasCtxRender === null) {
    throw new Error("Violet: Error creating 2D canvas.");
  }
  vioCanvasCtxRender.clearRect(
    0,
    0,
    vioCanvasCtxRender.canvas.width,
    vioCanvasCtxRender.canvas.height,
  );
  vioCanvasCtxRender.drawImage(vioCanvasCtx.canvas, 0, 0);
  const targetFrameTime = 1000 / 300;
  const actualFrameTime = performance.now() - timestamp;
  const delay = Math.max(0, targetFrameTime - actualFrameTime);
  setTimeout(() => window.requestAnimationFrame(vioMainLoop), delay);
}
function vioFrameRate() {
  return vioCurrentFps;
}
function vioLoadImageAndData(url) {
  const image = new Image();
  image.src = url;
  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (ctx === null) {
        throw new Error(
          "Violet: The browser does not support this game engine.",
        );
      }
      ctx.drawImage(image, 0, 0);
      const imgData = ctx.getImageData(0, 0, image.width, image.height);
      resolve({ image: image, data: imgData });
    };
    image.onerror = reject;
  });
}
function vioGetWidth() {
  if (vioCanvasCtx instanceof CanvasRenderingContext2D) {
    return vioCanvasCtx.canvas.width;
  } else {
    throw new Error(
      "Violet: The screen was not created properly in vioStart().",
    );
  }
}
function vioGetHeight() {
  if (vioCanvasCtx instanceof CanvasRenderingContext2D) {
    return vioCanvasCtx.canvas.height;
  } else {
    throw new Error(
      "Violet: The screen was not created properly in vioStart().",
    );
  }
}
function vioTranslate(x, y, ctx = vioCanvasCtx) {
  if (ctx === null || ctx === undefined) {
    throw new Error(
      "Violet: The screen was not created properly in vioStart().",
    );
  }
  ctx.translate(x, y);
}
function vioScale(x, y, ctx = vioCanvasCtx) {
  if (ctx === null || ctx === undefined) {
    throw new Error(
      "Violet: The screen was not created properly in vioStart().",
    );
  }
  ctx.scale(x, y);
}
class vioColor {
  constructor(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
}
class vioRectangle {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  contains(element) {
    return (
      element.x >= this.x - this.w &&
      element.x <= this.x + this.w &&
      element.y >= this.y - this.h &&
      element.y <= this.y + this.h
    );
  }
  intersectsCenter(range) {
    return !(
      range.x - range.w > this.x + this.w ||
      range.x + range.w < this.x - this.w ||
      range.y - range.h > this.y + this.h ||
      range.y + range.h < this.y - this.h
    );
  }
}
class vioQuadTree {
  constructor(boundary, n) {
    this.boundary = boundary;
    this.capacity = n;
    this.elements = [];
    this.hasDivided = false;
  }
  insert(element) {
    if (!this.boundary.contains(element)) {
      return false;
    }
    if (this.elements.length < this.capacity) {
      this.elements.push(element);
      return true;
    } else {
      if (!this.hasDivided) {
        this.subdivide();
      }
      if (this.ne?.insert(element)) return true;
      else if (this.nw?.insert(element)) return true;
      else if (this.se?.insert(element)) return true;
      else if (this.sw?.insert(element)) return true;
    }
  }
  subdivide() {
    let ne = new vioRectangle(
      this.boundary.x + this.boundary.w / 2,
      this.boundary.y - this.boundary.h / 2,
      this.boundary.w / 2,
      this.boundary.h / 2,
    );
    this.ne = new vioQuadTree(ne, this.capacity);
    let nw = new vioRectangle(
      this.boundary.x - this.boundary.w / 2,
      this.boundary.y - this.boundary.h / 2,
      this.boundary.w / 2,
      this.boundary.h / 2,
    );
    this.nw = new vioQuadTree(nw, this.capacity);
    let se = new vioRectangle(
      this.boundary.x + this.boundary.w / 2,
      this.boundary.y + this.boundary.h / 2,
      this.boundary.w / 2,
      this.boundary.h / 2,
    );
    this.se = new vioQuadTree(se, this.capacity);
    let sw = new vioRectangle(
      this.boundary.x - this.boundary.w / 2,
      this.boundary.y + this.boundary.h / 2,
      this.boundary.w / 2,
      this.boundary.h / 2,
    );
    this.sw = new vioQuadTree(sw, this.capacity);
    this.hasDivided = true;
  }
  queryRectangle(rect) {
    let found = [];
    if (!this.boundary.intersectsCenter(rect)) {
      return found;
    } else {
      for (let i = 0; i < this.elements.length; i++) {
        if (rect.contains(this.elements[i])) {
          found.push(this.elements[i]);
        }
      }
    }
    if (this.hasDivided) {
      if (this.ne) {
        found = found.concat(this.ne.queryRectangle(rect));
      }
      if (this.nw) {
        found = found.concat(this.nw.queryRectangle(rect));
      }
      if (this.se) {
        found = found.concat(this.se.queryRectangle(rect));
      }
      if (this.sw) {
        found = found.concat(this.sw.queryRectangle(rect));
      }
    }
    return found;
  }
  draw() {
    if (vioCanvasCtx === null) {
      throw new Error(
        "Violet: The screen was not created properly in vioStart().",
      );
    }
    vioStroke(vioCanvasCtx, 255, 0, 0);
    vioStrokeWeight(vioCanvasCtx, 4);
    for (let i = 0; i < this.elements.length; i++) {
      vioCircle(vioCanvasCtx, this.elements[i].x, this.elements[i].y, 0.1);
    }
    vioStroke(vioCanvasCtx, 255, 255, 255);
    vioStrokeWeight(vioCanvasCtx, 1);
    vioRectStrokeCenterHalf(
      this.boundary.x,
      this.boundary.y,
      this.boundary.w,
      this.boundary.h,
    );
    if (this.hasDivided) {
      this.ne?.draw();
      this.nw?.draw();
      this.se?.draw();
      this.sw?.draw();
    }
  }
}
class vioVector2D {
  constructor(x, y, data) {
    this.x = x;
    this.y = y;
    if (data) {
      this.data = data;
    }
  }
  static zero() {
    return new vioVector2D(0, 0);
  }
  static fromAngle(angle) {
    return new vioVector2D(Math.cos(angle), Math.sin(angle));
  }
  static fromValue(val) {
    return new vioVector2D(val, val);
  }
  static fromScalar(val, scalar) {
    return new vioVector2D(val * scalar, val * scalar);
  }
  array() {
    return [this.x, this.y];
  }
  div(other) {
    return new vioVector2D(this.x / other.x, this.y / other.y);
  }
  mult(other) {
    return new vioVector2D(this.x * other.x, this.y * other.y);
  }
  sub(other) {
    return new vioVector2D(this.x - other.x, this.y - other.y);
  }
  add(other) {
    return new vioVector2D(this.x + other.x, this.y + other.y);
  }
  lengthSqrt() {
    return this.x * this.x + this.y * this.y;
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  rotate90() {
    return new vioVector2D(-this.y, this.x);
  }
  distanceToSqrt(other) {
    return other.sub(this).lengthSqrt();
  }
  distanceTo(other) {
    return other.sub(this).length();
  }
  scale(value) {
    return new vioVector2D(this.x * value, this.y * value);
  }
  normalize() {
    const len = this.length();
    if (len === 0) {
      return new vioVector2D(0, 0);
    }
    return new vioVector2D(this.x / len, this.y / len);
  }
  lerp(other, t) {
    return other.sub(this).scale(t).add(this);
  }
  dot(other) {
    return this.x * other.x + this.y * other.y;
  }
  mapFunc(f) {
    return new vioVector2D(f(this.x), f(this.y));
  }
}
function xoshiro128ss(a, b, c, d) {
  return function() {
    let t = b << 9,
      r = b * 5;
    r = ((r << 7) | (r >>> 25)) * 9;
    c ^= a;
    d ^= b;
    b ^= c;
    a ^= d;
    c ^= t;
    d = (d << 11) | (d >>> 21);
    return (r >>> 0) / 4294967296;
  };
}
function vioRandom() {
  if (arguments.length === 0) {
    return Math.random();
  }
  if (arguments.length === 1) {
    if (!vioIsNumber(arguments[0])) {
      console.warn("Violet: Expects a number");
      return Math.random();
    }
    const min = 0;
    const max = arguments[0];
    return Math.random() * (max - min) + min;
  } else if (arguments.length === 2) {
    if (!vioIsNumber(arguments[0]) && !vioIsNumber(arguments[1])) {
      console.warn("Violet: Expects a number");
      return Math.random();
    }
    const min = arguments[0];
    const max = arguments[1];
    return Math.random() * (max - min) + min;
  } else {
    throw new Error("Violet: vioRandom takes 0 to 2 arguments.");
  }
}
function vioDist2D() {
  if (arguments.length === 4) {
    let x1 = arguments[0];
    let y1 = arguments[1];
    let x2 = arguments[2];
    let y2 = arguments[3];
    let dx = x2 - x1;
    let dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  } else {
    throw new Error("Violet: vioDist2D() requires either 4 parameters (2D)");
  }
}
function vioDist3D() {
  if (arguments.length === 6) {
    let x1 = arguments[0];
    let y1 = arguments[1];
    let z1 = arguments[2];
    let x2 = arguments[3];
    let y2 = arguments[4];
    let z2 = arguments[5];
    let dx = x2 - x1;
    let dy = y2 - y1;
    let dz = z2 - z1;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  } else {
    throw new Error("Violet: vioDist3D() requires either 6 parameters (3D)");
  }
}
function vioPush(ctx = vioCanvasCtx) {
  if (ctx === null || ctx === undefined) {
    throw new Error(
      "Violet: The screen was not created properly in vioStart().",
    );
  }
  ctx.save();
}
function vioPop(ctx = vioCanvasCtx) {
  if (ctx === null || ctx === undefined) {
    throw new Error(
      "Violet: The screen was not created properly in vioStart().",
    );
  }
  ctx.restore();
}
function vioClampRGB(r, g, b) {
  r = vioType.NormalizeUint8s(r);
  g = vioType.NormalizeUint8s(g);
  b = vioType.NormalizeUint8s(b);
  return { r: r, g: g, b: b };
}
function vioClampConvertRgbHexString(r, g, b) {
  const color = vioClampRGB(r, g, b);
  const toHex = (c) => c.toString(16).padStart(2, "0");
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}
function vioNormalizeAlpha(val) {
  return Math.max(0, Math.min(1, val / 255));
}
function vioFill(r, g, b, a = 1, ctx = vioCanvasCtx) {
  vioCurrentFillColor = `rgba(${r}, ${g}, ${b}, ${a})`;
  if (ctx === null || ctx === undefined) {
    throw new Error(
      "Violet: The screen was not created properly in vioStart().",
    );
  }
  ctx.fillStyle = vioCurrentFillColor;
}
function vioNoFill() {
  vioCurrentFillColor = null;
}
function vioStroke(r, g, b, a = 1, ctx = vioCanvasCtx) {
  vioCurrentStrokeColor = `rgba(${r}, ${g}, ${b}, ${a})`;
  ctx.strokeStyle = vioCurrentStrokeColor;
}
function vioNoStroke() {
  vioCurrentStrokeColor = null;
}
function vioStrokeWeight(weight, ctx = vioCanvasCtx) {
  const actualWeight = Math.max(0, weight);
  vioCurrentStrokeWeight = actualWeight;
  ctx.lineWidth = actualWeight;
}
function vioBackground(r, g, b, ctx = vioCanvasCtx) {
  if (ctx === null || ctx === undefined) {
    throw new Error(
      "Violet: The screen was not created properly in vioStart().",
    );
  }
  if (ctx instanceof CanvasRenderingContext2D && ctx !== null) {
    ctx.fillStyle = vioClampConvertRgbHexString(r, g, b);
    vioRectFill(0, 0, vioGetWidth(), vioGetHeight());
  }
}
function vioLine(x1, y1, x2, y2, ctx = vioCanvasCtx) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  if (vioCurrentStrokeColor) {
    ctx.stroke();
  } else {
    throw new Error("Violet: A stroke color is needed to draw a line.");
  }
}
function vioPoint(vioCanvasCtx, x, y, radius = 3) {
  vioCanvasCtx.beginPath();
  const actualRadius = Math.max(0.0000000009, radius);
  vioCanvasCtx.arc(x, y, actualRadius, 0, 2 * Math.PI);
  if (vioCurrentFillColor) {
    vioCanvasCtx.fill();
  }
  if (vioCurrentStrokeColor) {
    vioCanvasCtx.stroke();
  }
}
function vioCircle(x, y, radius, ctx = vioCanvasCtx) {
  ctx.beginPath();
  const actualRadius = Math.max(0, radius);
  ctx.arc(x, y, actualRadius, 0, 2 * Math.PI);
  if (vioCurrentFillColor) {
    ctx.fill();
  }
  if (vioCurrentStrokeColor) {
    ctx.stroke();
  }
}
function vioRectFill(x, y, w, h, ctx = vioCanvasCtx) {
  if (ctx === null || ctx === undefined) {
    throw new Error(
      "Violet: The screen was not created properly in vioStart().",
    );
  }
  ctx.fillRect(x, y, w, h);
}
function vioRectFillCenter(x, y, w, h, canvasCtx = vioCanvasCtx) {
  if (canvasCtx === null) {
    throw new Error("Violet: Error the canvas is null");
  } else if (canvasCtx instanceof CanvasRenderingContext2D) {
    canvasCtx.save();
    canvasCtx.translate(x, y);
    canvasCtx.fillRect(-x, -y, w, h);
    canvasCtx.restore();
  }
}
function vioRectStroke(vioCanvasCtx, x, y, w, h) {
  vioCanvasCtx.strokeRect(x, y, w, h);
}
function vioRectStrokeCenter(x, y, w, h, canvasCtx = vioCanvasCtx) {
  if (canvasCtx === null) {
    throw new Error("Violet: Error the canvas is null");
  } else if (canvasCtx instanceof CanvasRenderingContext2D) {
    canvasCtx.save();
    canvasCtx.translate(x, y);
    canvasCtx.strokeRect(-w, -h, w, h);
    canvasCtx.restore();
  }
}
function vioRectStrokeCenterHalf(x, y, w, h, canvasCtx = vioCanvasCtx) {
  if (canvasCtx === null) {
    throw new Error("Violet: Error the canvas is null");
  } else if (canvasCtx instanceof CanvasRenderingContext2D) {
    canvasCtx.save();
    canvasCtx.translate(x, y);
    canvasCtx.strokeRect(-w, -h, w * 2, h * 2);
    canvasCtx.restore();
  }
}
window.addEventListener("load", function() {
  vioInitializeEngine();
});

const uyvType = {};
uyvType.Image = HTMLImageElement;
uyvType.ImageData = ImageData;
function uyvIsNumber(value) {
  return typeof value === "number" && isFinite(value);
}
uyvType.SetBit = function(value) {
  return value ? 1 : 0;
};
uyvType.NormalizeBits = function(value) {
  if (Array.isArray(value)) {
    return value.map(uyvType.NormalizeBits);
  } else {
    return uyvType.SetBit(value);
  }
};
uyvType.SetUint8 = function(value) {
  return Math.max(0, Math.min(255, Math.floor(value)));
};
uyvType.NormalizeUint8s = function(value) {
  if (Array.isArray(value)) {
    return value.map(uyvType.NormalizeUint8s);
  } else {
    return uyvType.SetUint8(value);
  }
};
uyvType.SetUint16 = function(value) {
  return Math.max(0, Math.min(65535, Math.floor(value)));
};
uyvType.NormalizeUint16s = function(value) {
  if (Array.isArray(value)) {
    return value.map(uyvType.NormalizeUint16s);
  } else {
    return uyvType.SetUint16(value);
  }
};
const uyvInfinity = Number.MAX_VALUE;
const uyvInfinityMax = Number.MAX_VALUE;
const uyvInfinityMin = Number.MIN_VALUE;
let uyvWidth;
let uyvHeight;
let uyvCurrentFillColor = null;
let uyvCurrentStrokeColor = null;
let uyvCurrentStrokeWeight = 1;
let uyvDeltaTime = 0;
let uyvPrevTimestamp = 0;
let uyvFrameCount = 0;
let uyvLastFpsUpdate = 0;
let uyvCurrentFps = 0;
let uyvKey = "";
let uyvCanvasCtx;
function uyvCreateScreen(w, h) {
  const canvas = document.createElement("canvas");
  canvas.id = "uyvCanvas";
  if (canvas === null) {
    throw new Error("No canvas with id uyvCanvas is found");
  } else if (canvas.getContext("2d") instanceof CanvasRenderingContext2D) {
    uyvCanvasCtx = canvas.getContext("2d");
  }
  if (uyvCanvasCtx === null) {
    throw new Error("Violet Engine Error: Error creating 2D canvas");
  }
  if (w < 0 || w > 7680) {
    throw new Error("Screen width needs to be between 0 and 7680 (inclusive)");
  }
  if (h < 0 || h > 4320) {
    throw new Error("Screen height needs to be between 0 and 4320 (inclusive)");
  }
  canvas.width = w;
  canvas.height = h;
  document.body.appendChild(canvas);
  const uyvScreen = canvas;
  uyvWidth = uyvCanvasCtx.canvas.width;
  uyvHeight = uyvCanvasCtx.canvas.height;
  return { canvas: uyvCanvasCtx, screen: uyvScreen };
}
function uyvInitializeEngine() {
  if (typeof window.uyvPreLoad === "function") {
    Promise.resolve(window.uyvPreLoad())
      .then(() => {
        uyvStartEngine();
      })
      .catch((error) => {
        console.error("Error in uyvPreLoad:", error);
      });
  } else {
    uyvStartEngine();
  }
}
function uyvHandleKeyDown(e) {
  uyvKey = e.key;
  if (typeof window.uyvKeyDown === "function") {
    window.uyvKeyDown();
  }
}
function uyvHandleKeyUp(e) {
  const releasedKey = e.key;
  if (typeof window.uyvKeyUp === "function") {
    uyvKey = releasedKey;
    window.uyvKeyUp();
  }
  if (uyvKey === releasedKey) {
    uyvKey = "";
  }
}
function uyvStartEngine() {
  if (typeof window.uyvStart !== "function") {
    console.error(
      "No uyvStart function defined. Define function uyvStart() in your script.",
    );
    return;
  }
  if (typeof window.uyvUpdate !== "function") {
    console.error(
      "No uyvUpdate function defined. Define function uyvUpdate() in your script.",
    );
    return;
  }
  if (typeof window.uyvDraw !== "function") {
    console.error(
      "No uyvDraw function defined. Define function uyvDraw() in your script.",
    );
    return;
  }
  window.uyvStart();
  window.requestAnimationFrame(uyvMainLoop);
  window.addEventListener("keydown", uyvHandleKeyDown);
  window.addEventListener("keyup", uyvHandleKeyUp);
}
function uyvMainLoop(timestamp) {
  uyvDeltaTime = (timestamp - uyvPrevTimestamp) / 1000;
  uyvPrevTimestamp = timestamp;
  uyvFrameCount++;
  if (timestamp - uyvLastFpsUpdate >= 1000) {
    uyvCurrentFps = uyvFrameCount;
    uyvFrameCount = 0;
    uyvLastFpsUpdate = timestamp;
  }
  window.uyvUpdate();
  window.uyvDraw();
  const targetFrameTime = 1000 / 300;
  const actualFrameTime = performance.now() - timestamp;
  const delay = Math.max(0, targetFrameTime - actualFrameTime);
  setTimeout(() => window.requestAnimationFrame(uyvMainLoop), delay);
}
function uyvFrameRate() {
  return uyvCurrentFps;
}
function uyvLoadImageAndData(url) {
  const image = new Image();
  image.src = url;
  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (ctx === null) {
        throw new Error("The browser does not support this game engine.");
      }
      ctx.drawImage(image, 0, 0);
      const imgData = ctx.getImageData(0, 0, image.width, image.height);
      resolve({ image: image, data: imgData });
    };
    image.onerror = reject;
  });
}
function uyvGetWidth(uyvCanvasCtx) {
  return uyvCanvasCtx.canvas.width;
}
function uyvGetHeight(uyvCanvasCtx) {
  return uyvCanvasCtx.canvas.height;
}
function uyvTranslate(uyvCanvasCtx, x, y) {
  uyvCanvasCtx.translate(x, y);
}
function uyvScale(uyvCanvasCtx, x, y) {
  uyvCanvasCtx.scale(x, y);
}
class uyvColor {
  constructor(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
}
class uyvRectangle {
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
class uyvQuadTree {
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
    let ne = new uyvRectangle(
      this.boundary.x + this.boundary.w / 2,
      this.boundary.y - this.boundary.h / 2,
      this.boundary.w / 2,
      this.boundary.h / 2,
    );
    this.ne = new uyvQuadTree(ne, this.capacity);
    let nw = new uyvRectangle(
      this.boundary.x - this.boundary.w / 2,
      this.boundary.y - this.boundary.h / 2,
      this.boundary.w / 2,
      this.boundary.h / 2,
    );
    this.nw = new uyvQuadTree(nw, this.capacity);
    let se = new uyvRectangle(
      this.boundary.x + this.boundary.w / 2,
      this.boundary.y + this.boundary.h / 2,
      this.boundary.w / 2,
      this.boundary.h / 2,
    );
    this.se = new uyvQuadTree(se, this.capacity);
    let sw = new uyvRectangle(
      this.boundary.x - this.boundary.w / 2,
      this.boundary.y + this.boundary.h / 2,
      this.boundary.w / 2,
      this.boundary.h / 2,
    );
    this.sw = new uyvQuadTree(sw, this.capacity);
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
    if (uyvCanvasCtx === null) {
      throw Error(
        "Violet Ultra Error: The screen was not created properly in uyvStart().",
      );
    }
    uyvStroke(uyvCanvasCtx, 255, 0, 0);
    uyvStrokeWeight(uyvCanvasCtx, 4);
    for (let i = 0; i < this.elements.length; i++) {
      uyvCircle(uyvCanvasCtx, this.elements[i].x, this.elements[i].y, 0.1);
    }
    uyvStroke(uyvCanvasCtx, 255, 255, 255);
    uyvStrokeWeight(uyvCanvasCtx, 1);
    uyvRectStrokeCenterHalf(
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
class uyvVector2D {
  constructor(x, y, data) {
    this.x = x;
    this.y = y;
    if (data) {
      this.data = data;
    }
  }
  static zero() {
    return new uyvVector2D(0, 0);
  }
  static fromAngle(angle) {
    return new uyvVector2D(Math.cos(angle), Math.sin(angle));
  }
  static fromValue(val) {
    return new uyvVector2D(val, val);
  }
  static fromScalar(val, scalar) {
    return new uyvVector2D(val * scalar, val * scalar);
  }
  array() {
    return [this.x, this.y];
  }
  div(other) {
    return new uyvVector2D(this.x / other.x, this.y / other.y);
  }
  mult(other) {
    return new uyvVector2D(this.x * other.x, this.y * other.y);
  }
  sub(other) {
    return new uyvVector2D(this.x - other.x, this.y - other.y);
  }
  add(other) {
    return new uyvVector2D(this.x + other.x, this.y + other.y);
  }
  lengthSqrt() {
    return this.x * this.x + this.y * this.y;
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  rotate90() {
    return new uyvVector2D(-this.y, this.x);
  }
  distanceToSqrt(other) {
    return other.sub(this).lengthSqrt();
  }
  distanceTo(other) {
    return other.sub(this).length();
  }
  scale(value) {
    return new uyvVector2D(this.x * value, this.y * value);
  }
  normalize() {
    const len = this.length();
    if (len === 0) {
      return new uyvVector2D(0, 0);
    }
    return new uyvVector2D(this.x / len, this.y / len);
  }
  lerp(other, t) {
    return other.sub(this).scale(t).add(this);
  }
  dot(other) {
    return this.x * other.x + this.y * other.y;
  }
  mapFunc(f) {
    return new uyvVector2D(f(this.x), f(this.y));
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
function uyvRandom() {
  if (arguments.length === 0) {
    return Math.random();
  }
  if (arguments.length === 1) {
    if (!uyvIsNumber(arguments[0])) {
      console.warn("Violet Ultra Error: Expects a number");
      return Math.random();
    }
    const min = 0;
    const max = arguments[0];
    return Math.random() * (max - min) + min;
  } else if (arguments.length === 2) {
    if (!uyvIsNumber(arguments[0]) && !uyvIsNumber(arguments[1])) {
      console.warn("Violet Ultra Error: Expects a number");
      return Math.random();
    }
    const min = arguments[0];
    const max = arguments[1];
    return Math.random() * (max - min) + min;
  } else {
    throw new Error("Violet Ultra Error: uyvRandom takes 0 to 2 arguments.");
  }
}
function uyvDist2D() {
  if (arguments.length === 4) {
    let x1 = arguments[0];
    let y1 = arguments[1];
    let x2 = arguments[2];
    let y2 = arguments[3];
    let dx = x2 - x1;
    let dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  } else {
    throw new Error("uyvDist2D() requires either 4 parameters (2D)");
  }
}
function uyvDist3D() {
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
    throw new Error("uyvDist3D() requires either 6 parameters (3D)");
  }
}
function uyvPush(uyvCanvasCtx) {
  uyvCanvasCtx.save();
}
function uyvPop(uyvCanvasCtx) {
  uyvCanvasCtx.restore();
}
function uyvClampRGB(r, g, b) {
  r = uyvType.NormalizeUint8s(r);
  g = uyvType.NormalizeUint8s(g);
  b = uyvType.NormalizeUint8s(b);
  return { r: r, g: g, b: b };
}
function uyvClampConvertRgbHexString(r, g, b) {
  const color = uyvClampRGB(r, g, b);
  const toHex = (c) => c.toString(16).padStart(2, "0");
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}
function uyvNormalizeAlpha(val) {
  return Math.max(0, Math.min(1, val / 255));
}
function uyvFill(uyvCanvasCtx, r, g, b, a = 1) {
  uyvCurrentFillColor = `rgba(${r}, ${g}, ${b}, ${a})`;
  uyvCanvasCtx.fillStyle = uyvCurrentFillColor;
}
function uyvNoFill() {
  uyvCurrentFillColor = null;
}
function uyvStroke(uyvCanvasCtx, r, g, b, a = 1) {
  uyvCurrentStrokeColor = `rgba(${r}, ${g}, ${b}, ${a})`;
  uyvCanvasCtx.strokeStyle = uyvCurrentStrokeColor;
}
function uyvNoStroke() {
  uyvCurrentStrokeColor = null;
}
function uyvStrokeWeight(uyvCanvasCtx, weight) {
  const actualWeight = Math.max(0, weight);
  uyvCurrentStrokeWeight = actualWeight;
  uyvCanvasCtx.lineWidth = actualWeight;
}
function uyvBackground(r, g, b, canvasCtx = uyvCanvasCtx) {
  if (canvasCtx instanceof CanvasRenderingContext2D && canvasCtx !== null) {
    canvasCtx.fillStyle = uyvClampConvertRgbHexString(r, g, b);
    uyvRectFill(
      canvasCtx,
      0,
      0,
      uyvGetWidth(canvasCtx),
      uyvGetHeight(canvasCtx),
    );
  }
}
function uyvLine(uyvCanvasCtx, x1, y1, x2, y2) {
  uyvCanvasCtx.beginPath();
  uyvCanvasCtx.moveTo(x1, y1);
  uyvCanvasCtx.lineTo(x2, y2);
  if (uyvCurrentStrokeColor) {
    uyvCanvasCtx.stroke();
  } else {
    throw new Error("A stroke color is needed to draw a line.");
  }
}
function uyvPoint(uyvCanvasCtx, x, y, radius = 3) {
  uyvCanvasCtx.beginPath();
  const actualRadius = Math.max(0.0000000009, radius);
  uyvCanvasCtx.arc(x, y, actualRadius, 0, 2 * Math.PI);
  if (uyvCurrentFillColor) {
    uyvCanvasCtx.fill();
  }
  if (uyvCurrentStrokeColor) {
    uyvCanvasCtx.stroke();
  }
}
function uyvCircle(uyvCanvasCtx, x, y, radius) {
  uyvCanvasCtx.beginPath();
  const actualRadius = Math.max(0, radius);
  uyvCanvasCtx.arc(x, y, actualRadius, 0, 2 * Math.PI);
  if (uyvCurrentFillColor) {
    uyvCanvasCtx.fill();
  }
  if (uyvCurrentStrokeColor) {
    uyvCanvasCtx.stroke();
  }
}
function uyvRectFill(uyvCanvasCtx, x, y, w, h) {
  uyvCanvasCtx.fillRect(x, y, w, h);
}
function uyvRectFillCenter(x, y, w, h, canvasCtx = uyvCanvasCtx) {
  if (canvasCtx === null) {
    throw new Error("Violet Ultra Error: Error the canvas is null");
  } else if (canvasCtx instanceof CanvasRenderingContext2D) {
    canvasCtx.save();
    canvasCtx.translate(x, y);
    canvasCtx.fillRect(-x, -y, w, h);
    canvasCtx.restore();
  }
}
function uyvRectStroke(uyvCanvasCtx, x, y, w, h) {
  uyvCanvasCtx.strokeRect(x, y, w, h);
}
function uyvRectStrokeCenter(x, y, w, h, canvasCtx = uyvCanvasCtx) {
  if (canvasCtx === null) {
    throw new Error("Violet Ultra Error: Error the canvas is null");
  } else if (canvasCtx instanceof CanvasRenderingContext2D) {
    canvasCtx.save();
    canvasCtx.translate(x, y);
    canvasCtx.strokeRect(-w, -h, w, h);
    canvasCtx.restore();
  }
}
function uyvRectStrokeCenterHalf(x, y, w, h, canvasCtx = uyvCanvasCtx) {
  if (canvasCtx === null) {
    throw new Error("Violet Ultra Error: Error the canvas is null");
  } else if (canvasCtx instanceof CanvasRenderingContext2D) {
    canvasCtx.save();
    canvasCtx.translate(x, y);
    canvasCtx.strokeRect(-w, -h, w * 2, h * 2);
    canvasCtx.restore();
  }
}
window.addEventListener("load", function() {
  uyvInitializeEngine();
});

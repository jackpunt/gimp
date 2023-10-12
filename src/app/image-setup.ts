import { Params } from "@angular/router";
import { WH, stime } from "@thegraid/common-lib";
import { Container, DisplayObject, Stage } from "@thegraid/easeljs-module";
import { TileLoader } from "./tile-loader";
import { RectShape } from "./shapes";

type PARMS = {gap?: number, bw?: number, bh?: number, cw?: number, ch?: number, rc?: number }
export class ImageSetup {
  stage: Stage;
  imageArgs = { root: '', fnames: [], ext: 'png' };

  constructor (public canvasId: string, public qParams: Params) {
    stime.fmt = "MM-DD kk:mm:ss.SSS"
    this.stage = makeStage(canvasId, false)
    this.stage.x = 100; this.stage.y = 30;
    this.stage.scaleX = this.stage.scaleY = 100/Card.dpi;
    new TileLoader().loadImages(this.imageArgs, (imap) => this.startup(qParams, imap));
  }
  startup(qParams: Params, imap: Map<string, HTMLImageElement>) {
    this.twoCards();
  }

  twoCards() {
    const card1 = new Card();
    const bounds = card1.getBounds();
    card1.x += bounds.width/2; card1.y += bounds.height/2;
    this.stage.addChild(card1);
    const card2 = new Card([1,2]);
    card2.x += bounds.width/2; card2.y += bounds.height/2;
    card2.rotation = 180;
    card2.x += 3 * Card.dpi;
    this.stage.addChild(card2);
    this.stage.update();
  }

  makeAllCards() {
    const rv = this.makeCards(2);
    return this.makeCards(3, rv);
  }

  makeCards(n = 2, rv: Card[] = []) {
    const len = Card.colors.length;
    const bc = new Array<number>(n);
    for (let i = 0; i<len; i++) {
      bc[0] = i;
      for (let j = 0; j< len; j++) {
        if (bc.includes(j)) continue;
        bc[1] = j;
        if (n === 3) {
          for (let k = 0; k < len; k++) {
            if (bc.includes(k)) continue;
            rv.push(new Card(bc, 0));
            rv.push(new Card(bc, n - 1));
          }
        } else {
          rv.push(new Card(bc, 0));
          rv.push(new Card(bc, n - 1));
        }
      }
    }
    return rv;
  }
}

class Card extends Container {
  static colors = ['red', 'blue', 'green', 'orange'];
  static dpi = 300;
  static parm0 = {
    gap: .13 * Card.dpi, bw: .3 * Card.dpi,
    cw: 2.5 * Card.dpi, bh: 2.1 * Card.dpi,
    ch: 3.5 * Card.dpi, rc: .25 * Card.dpi,
  };
  static mini = .1;

  constructor(bc = [0, 1, 2], cc = bc[0], parms = Card.parm0) {
    super();
    this.addChild(this.makeCard(bc, Card.colors[cc], parms, ));
  }


  makeCard(bc: number[], bgc: string, parm?: PARMS, ) {
    const { gap, bw, bh, cw, ch, rc } = { ...Card.parm0, ...(parm ?? Card.parm0 )};
    const parms = { gap, bw, bh, cw, ch, rc };
    const mini = Card.mini;

    const big = this.makeCard0(bc, bgc, parms, );
    const bounds = big.getBounds();
    console.log(stime(this, `.makeCard:`), bounds);
    const ps = { gap: gap * mini * 1.5, bw: bw * mini * 1.5, bh: bh * mini * 1.3, cw: cw * mini, ch: ch * mini, rc: 0 }

    const sx = bounds.x + bounds.width * mini * 1.018;
    const sy = bounds.y + bounds.height * mini * .8;
    const smal1 = this.makeCard0(bc, 'white', ps);
    smal1.x = sx;
    smal1.y = sy;
    big.addChild(smal1);

    const smal2 = this.makeCard0(bc, 'white', ps);
    smal2.x = -sx;
    smal2.y = -sy;
    big.addChild(smal2);

    return big;
  }

  makeCard0(bc = [0, 1, 2], bgc = Card.colors[bc[0]], parm: PARMS, ) {
    const colors = Card.colors;
    const card = new Container();
    const { gap, bw, bh, cw, ch, rc } = { ...Card.parm0, ...parm }
    const nb = bc.length;
    const cx = cw/2, cy = ch/2;
    const rect = new RectShape({ x: -cx, y: -cy, w: cw, h: ch, r: rc }, bgc, '');
    card.addChild(rect);
    rect.setBounds(-cx, -cy, cw, ch);
    const dx = (bw + gap), tbw = (nb - 1) * dx + bw, edge = cw / 6, edgeh = cw/5;
    const x0 = (cw - tbw) / 2 - cx, y0 = (ch - bh) / 2 - cy;
    const back = new RectShape({ x: edge - cx, y: edgeh - cy, w: cw - 2 * edge, h: ch - 2 * edgeh, r: rc/2 }, 'white', '')
    card.addChild(back);

    const dhi = bh * .03;
    bc.forEach((n, i) => {
      const dh = dhi * i;
      const bar = new RectShape({ x: x0 + i * dx, y: y0 + dh, w: bw, h: bh - 2 * dh }, colors[n], '');
      card.addChild(bar);
    });
    return card;
  }
}

function makeStage(canvasId: string | HTMLCanvasElement, tick = true) {
  let stage = new Stage(canvasId)
  stage.tickOnUpdate = stage.tickChildren = tick
  if (!stage.canvas) {
    stage.enableMouseOver(0)
    stage.enableDOMEvents(false)
    stage.tickEnabled = stage.tickChildren = false
  }
  return stage
}

export type GridSpec = {
  width: number,  // canvas size
  height: number, // canvas size
  nrow: number,
  ncol: number,
  y0?: number,
  x0?: number,    // even numbered line indent
  x1?: number,    // odd numbered line indent (x1 ?? x0)
  delx?: number,
  dely?: number,
  cardw?: number,
  cardh?: number,
  bleed?: number,
  dpi?: number,   // multiply [x0, y0, delx, dely] to get pixels; default: 1 (already in pixels)
  double?:boolean,
}

export type PageSpec = {
  gridSpec: GridSpec,
  frontObjs: DisplayObject[],
  backObjs?: (DisplayObject  | undefined)[] | undefined,
  canvas?: HTMLCanvasElement,
}

export class ImageGrid {
  // printer paper
  static circle_1_inch: GridSpec = {
    width: 8.433, height: 10.967, // not quite 8.5 X 11.0
    nrow: 10, ncol: 8,
    // width: 2530, height: 3290,
    x0: .9, y0: 1.0,
    delx: (1 + 1 / 8), dely: (1 + 1 / 8),
    dpi: 300,
  }

  /** 5 rows of 7 columns */
  static hexSingle_1_19: GridSpec = {
    width: 3300, height: 2550, nrow: 5, ncol: 7,
    x0: 576, y0: 450,
    delx: 357, dely: 413,
    dpi: 1,
  }

  /** 5 rows of 7 columns */
  static hexDouble_1_19: GridSpec = {
    width: 3300, height: 5100, nrow: 5, ncol: 7,
    x0: 576, y0: 451,        // 245 + 412/2 = 451  (5099 - 245 = 4854) !~== 4854
    delx: 357, dely: 413.1,  // 1.19*300=357; 357/H.sqrt_3_2 = 412.2 === (2308 - 247)/5 == 2061 = 412.2
    dpi: 1,
  }

  /** 8 rows of 8 columns */
  static circDouble_0_79: GridSpec = {
    width: 3300, height: 5100, nrow: 8, ncol: 8,
    x0: 242, y0: 335, x1: 430,
    delx: 375, dely: 375,  // ; 2625/7 = 375 ; 1876/5 = 375.2
    dpi: 1,
  }
    // (define PPG-POKER-18-SPEC '((file "PPGPoker18-0.png") (cardw 1108) (cardh 808)
    // (xmin 120) (ymin 85) (xinc 1125) (yinc 825)
    // (ncol 3) (nrow 6) (bleed 25)))
  static cardSingle_3_5: GridSpec = {
    width: 3600, height: 5400, nrow: 6, ncol: 3, cardw: 1110, cardh: 810, // (w*300 + 2*bleed)
    x0: 120 + 3.5 * 150 + 30, y0: 85 + 3.5 * 150 + 30, delx: 1125, dely: 825, bleed: 30, double: false,
  };

  static cardSingle_1_75: GridSpec = {
    width: 3600, height: 5400, nrow: 9, ncol: 4, cardw: 800, cardh: 575,
    x0: 150 + 1.75 * 150 + 30, y0: 100 + 1.75 * 150 + 30, delx: 833, dely: 578.25, bleed: 30,
  };

  stage!: Stage;
  canvas!: HTMLCanvasElement;

  constructor() {
  }

  setStage(wh: WH, canvasId: string | HTMLCanvasElement = 'gridCanvas') {
    if (typeof canvasId === 'string') {
      this.canvas = (document.getElementById(canvasId) ?? document.createElement('canvas')) as HTMLCanvasElement;
      this.canvas.id = canvasId;
    } else {
      this.canvas = canvasId as HTMLCanvasElement;
    }
    this.stage = makeStage(this.canvas);
    this.stage.removeAllChildren();
    this.setCanvasSize(wh);
  }

  setCanvasSize(wh: WH) {
    this.canvas.width = wh.width;
    this.canvas.height = wh.height;
  }

  makePage(pageSpec: PageSpec, canvas?: HTMLCanvasElement | string ) {
    const gridSpec = pageSpec.gridSpec;
    this.setStage(gridSpec, canvas);
    const nc = this.addObjects(gridSpec, pageSpec.frontObjs, pageSpec.backObjs)
    this.stage.update();
    pageSpec.canvas = this.canvas;

    const { id, width, height } = this.canvas;
    const info = { id, width, height, nc }; // not essential...
    console.log(stime(this, `.makePage: info =`), info);
    return;
  }

  addObjects(gridSpec: GridSpec, frontObjs: DisplayObject[], backObjs: (DisplayObject | undefined)[] | undefined) {
    const cont = new Container();
    const def = { x0: 0, y0: 0, delx: 300, dely: 300, dpi: 1 }
    const { width, height, x0, y0, x1, delx, dely, dpi, nrow, ncol } = { ...def, ...gridSpec };

    this.stage.addChild(cont);
    const XX = [x0, x1 ?? x0];
    frontObjs.forEach((dObj, n) => {
      const row = Math.floor(n / ncol);
      const col = n % ncol;
      const frontObj = dObj;
      if (row > nrow) return;
      const X0 = XX[row % 2]; // = ((row % 2) === 0) ? x0 : x1 ?? x0;
      const x = (X0 + col * delx) * dpi;
      const y = (y0 + row * dely) * dpi;
      frontObj.x += x;
      frontObj.y += y;
      cont.addChild(frontObj);
      const backObj = backObjs?.[n];
      if (backObj) {
        backObj.x += x;
        backObj.y += (height * dpi - y); // + 2; // template is asymetric!
        cont.addChild(backObj);
      }
    });
    return cont.numChildren;
  }

  downloadImage(canvas: HTMLCanvasElement, filename = 'image.png', downloadId = 'download') {
    const anchor = document.getElementById(downloadId) as HTMLAnchorElement;
    const imageURL = canvas.toDataURL("image/png");
    const octetURL = imageURL.replace("image/png", "image/octet-stream");
    anchor.download = filename;
    anchor.href = octetURL;
    console.log(stime(this, `.downloadImage: ${canvas.id} -> ${filename} ${octetURL.length}`))
  }
}

import { Params } from "@angular/router";
import { selectN, stime } from "@thegraid/common-lib";
import { makeStage } from "@thegraid/easeljs-lib";
import { Container, DisplayObject, Graphics, Stage } from "@thegraid/easeljs-module";
import { ImageGrid, PageSpec } from "./image-grid";
import { CircleShape, RectShape } from "./shapes";
import { TileLoader } from "./tile-loader";
// end imports

type Concrete<Type> = { [Property in keyof Type]-?: Type[Property]; };
type PARMQ = { gap?: number, bw?: number, bh?: number, cw?: number, ch?: number, rc?: number, bleed?: number };
type PARMS = Concrete<PARMQ>;

export class CardExporter {
  stage: Stage;
  imageArgs = { root: '', fnames: [], ext: 'png' };

  constructor (public canvasId: string, public qParams: Params) {
    stime.fmt = "MM-DD kk:mm:ss.SSS"
    this.stage = makeStage(canvasId, false)
    this.stage.x = 130; this.stage.y = 40;
    this.stage.scaleX = this.stage.scaleY = 100 / Card.dpi;
    new TileLoader().loadImages(this.imageArgs, (imap) => this.startup(qParams, imap));
  }

  imageGrid = new ImageGrid(() => { return this.makeImagePages(); });

  startup(qParams: Params, imap: Map<string, HTMLImageElement>) {
    this.twoCards();
  }

  twoCards() {
    const bleed0 = { ...Card.parm0, bleed: 0 };
    const card1 = new Card(undefined, undefined, bleed0);
    const bounds = card1.getBounds();
    card1.x += 2.5 * Card.dpi;
    card1.x += bounds.width/2; card1.y += bounds.height/2;
    this.stage.addChild(card1);
    const card2 = this.makeBack();
    card2.x += 5.3 * Card.dpi;
    card2.x += bounds.width/2; card2.y += bounds.height/2;
    card2.rotation = 180;
    this.stage.addChild(card2);
    this.stage.update();
  }

  makeImagePages() {
    const pageSpecs: PageSpec[] = [];
    const cards = this.makeAllCards();
    const backs = this.makeBacks();
    this.cardsToTemplate(backs, 'backs', ImageGrid.cardSingle_3_5, pageSpecs);
    this.cardsToTemplate(cards, 'stripe', ImageGrid.cardSingle_3_5, pageSpecs);
    // this.cardsToTemplate(cards, 'stripe', ImageGrid.cardSingle_1_75, pageSpecs);
    return pageSpecs;
  }

  makeAllCards() {
    const rv = this.makeCards(2);
    return this.makeCards(3, rv);
  }

  makeBacks(n = 24) {
    const rv: Card[] = []
    for (let i = 0; i < n; i++) {
      rv.push(this.makeBack());
    }
    return rv;
  }

  retainedBack: Card | undefined;

  makeRetainedBack() {
    const bleed0 = { ...Card.parm0, bleed: 0 };
    Card.backColor = 'black';
    const back = new Card([], -1), bleed = Card.parm0.bleed;
    const base = back.baseShape as RectShape, main = base.parent;
    const brect = back.bleedShape as RectShape;
    const circs = new Container();
    main.addChild(circs);
    const { x, y, width, height } = base.getBounds();
    for (let i = 0; i < 32; i++) {
      const color = selectN(Card.colors, 1, false)[0];
      const rad = Math.random() * width / 2;
      const g0 = new Graphics().ss(width/30);
      const ring = new CircleShape('', rad, color, g0);
      ring.x = x + Math.random() * width;
      ring.y = y + Math.random() * height;
      circs.addChild(ring);
    }
    circs.cache(x + bleed, y + bleed, width - 2 * bleed, height - 2 * bleed);
    back.cache(x, y, width, height);
    if (brect) {
      const { x, y, width, height } = brect.getBounds();
      back.cache(x, y, width, height);
    }
    back.updateCache();
    this.retainedBack = back;
    return back;
  }

  copyRetainedBack() {
    const back = this.retainedBack as Card;
    const { x, y, width, height } = back.getBounds();
    const card = new Card([], -1);
    card.cache(x, y, width, height);
    card.bitmapCache = back.bitmapCache;
    return card;
  }

  makeBack() {
    return (this.retainedBack) ? this.copyRetainedBack() : this.makeRetainedBack();
  }

  makeCards(n = 2, rv: Card[] = []) {
    const len = Card.colors.length;
    const bc = new Array<number>(n);
    for (let i = 0; i < len; i++) {
      bc[0] = i;
      for (let j = 0; j < len; j++) {
        if (bc.includes(j)) continue;
        bc[1] = j;
        if (n === 3) {
          for (let k = 0; k < len; k++) {
            if (bc.includes(k)) continue;
            bc[2] = k;
            rv.push(new Card(bc, bc[0]));
            rv.push(new Card(bc, bc[n - 1]));
          }
          bc[2] = -1;
        } else {
          rv.push(new Card(bc, bc[0]));
          rv.push(new Card(bc, bc[n - 1]));
        }
      }
    }
    return rv;
  }

  cardsToTemplate(cards: DisplayObject[], basename = 'image', gridSpec = ImageGrid.cardSingle_3_5, pageSpecs: PageSpec[] = []) {
    const frontAry = [] as DisplayObject[][];
    const page = pageSpecs.length;
    const { nrow, ncol } = gridSpec, perPage = nrow * ncol;
    let nextCardNum = page * perPage;
    cards.forEach(card => {
      const pagen = Math.floor(nextCardNum++ / perPage);
      card.rotation = -90;
      if (!frontAry[pagen]) frontAry[pagen] = [];
      frontAry[pagen].push(card);
    })
    frontAry.forEach((frontObjs, pagen) => {
      const backObjs = undefined;
      const canvasId = `canvas_P${pagen}`;
      const pageSpec = { gridSpec, frontObjs, backObjs, basename } as PageSpec;
      pageSpecs[pagen] = pageSpec;
      console.log(stime(this, `.makePage: canvasId=${canvasId}, pageSpec=`), pageSpec);
      this.imageGrid.makePage(pageSpec, canvasId);  // make canvas with images, but do not download [yet]
    });
    return pageSpecs;
  }
}

export class Card extends Container {
  static colors = ['red', 'blue', 'green', 'orange'];
  static dpi = 300;
  static parm3_5: PARMS = {
    gap: .13 * Card.dpi, bw: .3 * Card.dpi,
    cw: 2.5 * Card.dpi, bh: 2.1 * Card.dpi,
    ch: 3.5 * Card.dpi, rc: .14 * Card.dpi,
    bleed: (28 / 300) * Card.dpi,
  };

  static parm1_75: PARMS = {
    gap: .1 * Card.dpi, bw: .2 * Card.dpi,
    cw: 1.75 * Card.dpi, bh: 1.4 * Card.dpi,
    ch: 2.5 * Card.dpi, rc: .14 * Card.dpi,
    bleed: (25 / 300) * Card.dpi,
  };

  static parm0 = Card.parm3_5;

  static mini = .1;

  static backColor = 'black';

  constructor(bc = [0, 1, 2], cc = bc[0], parms = Card.parm0) {
    super();
    const children = this.makeCard3(bc, Card.colors[cc] ?? Card.backColor, parms, );
    this.addChild(...children);
  }
  baseShape: RectShape | undefined;
  bleedShape: RectShape | undefined;

  makeCard3(bc: number[], bgc: string, parm?: PARMQ, ) {
    const { gap, bw, bh, cw, ch, rc, bleed } = { ...Card.parm0, ...(parm ?? Card.parm0 )};
    const parms = { gap, bw, bh, cw, ch, rc, bleed };
    const mini = Card.mini;

    const big = this.makeCard(bc, bgc, parms, );
    const bounds = big.getBounds();
    console.log(stime(this, `.makeCard:`), bc, bgc);
    const ps = { gap: gap * mini * 1.5, bw: bw * mini * 1.5, bh: bh * mini * 1.3, cw: cw * mini, ch: ch * mini, rc: 0, bleed: 0 }
    const rv = [big];
    if (bc.length > 0) {
      const minibgc = 'white';
      const sx = bounds.x + bounds.width * mini * 1.018;
      const sy = bounds.y + bounds.height * mini * .8;
      const smal1 = this.makeCard(bc, minibgc, ps);
      smal1.x = sx;
      smal1.y = sy;
      rv.push(smal1);

      const smal2 = this.makeCard(bc, minibgc, ps);
      smal2.x = -sx;
      smal2.y = -sy;
      rv.push(smal2);
    }
    return rv;
  }

  makeCard(bc = [0, 1, 2], bgc = Card.colors[bc[0]], parm: PARMQ, ) {
    const colors = Card.colors;
    const card = new Container();
    const { gap, bw, bh, cw, ch, rc, bleed } = { ...Card.parm0, ...parm }
    const nb = bc.length;
    const cx = cw / 2, cy = ch / 2;
    const base = new RectShape({ x: -cx, y: -cy, w: cw, h: ch, r: rc }, bgc, '');
    this.baseShape = base;
    if (bleed > 0) {
      const xb = cx + bleed, yb = cy + bleed, wb = cw + 2 * bleed, hb = ch + 2 * bleed, rb = rc + bleed;
      const brect = new RectShape({ x: -xb, y: -yb, w: wb, h: hb, r: rb }, bgc, '');
      card.addChild(brect);
      this.bleedShape = brect;
    }
    card.addChild(base);
    base.setBounds(-cx, -cy, cw, ch);
    const dx = (bw + gap), tbw = (nb - 1) * dx + bw, edge = cw / 6, edgeh = cw/5;
    const x0 = (cw - tbw) / 2 - cx, y0 = (ch - bh) / 2 - cy;
    const back = new RectShape({ x: edge - cx, y: edgeh - cy, w: cw - 2 * edge, h: ch - 2 * edgeh, r: rc/2 }, 'white', '')
    if (nb > 0) card.addChild(back);

    const dhi = bh * .03;
    bc.forEach((n, i) => {
      const dh = dhi * i;
      const bar = new RectShape({ x: x0 + i * dx, y: y0 + dh, w: bw, h: bh - 2 * dh }, colors[n], '');
      card.addChild(bar);
    });
    return card;
  }
}


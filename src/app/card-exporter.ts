import { Params } from "@angular/router";
import { Constructor, stime } from "@thegraid/common-lib";
import { makeStage } from "@thegraid/easeljs-lib";
import { Container, DisplayObject, Stage } from "@thegraid/easeljs-module";
import { ImageGrid, PageSpec } from "./image-grid";
import { RectShape } from "./shapes";
import { TileLoader } from "./tile-loader";
// end imports

interface Claz extends Constructor<DisplayObject> {
  rotateBack: number | undefined;
}

export type CountClaz = [count: number, claz: Claz, ...args: any];

type PARMS = {gap?: number, bw?: number, bh?: number, cw?: number, ch?: number, rc?: number }
export class CardExporter {
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

  imageGrid = new ImageGrid(() => { return this.makeImagePages(); });

  makeImagePages() {
    const pageSpecs: PageSpec[] = [];
    this.cardsToTemplate([],)
    return pageSpecs;
  }

  cardsToTemplate(cards: DisplayObject[], gridSpec = ImageGrid.cardSingle_3_5, pageSpecs: PageSpec[] = []) {

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

export class Card extends Container {
  static rotateBack = undefined;
  static colors = ['red', 'blue', 'green', 'orange'];
  static dpi = 300;
  static parm0 = {
    gap: .13 * Card.dpi, bw: .3 * Card.dpi,
    cw: 2.5 * Card.dpi, bh: 2.1 * Card.dpi,
    ch: 3.5 * Card.dpi, rc: .25 * Card.dpi,
  };
  static mini = .1;
  static get countClaz() { return [1, Card, [1,2]] as CountClaz; }

  constructor(bc = [0, 1, 2], cc = bc[0], parms = Card.parm0) {
    super();
    this.addChild(this.makeCard(bc, Card.colors[cc], parms, ));
  }
  baseShape: DisplayObject = this;
  radius = Card.parm0.cw;
  setPlayerAndPaint(p: any) {}

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


import { Params } from "@angular/router";
import { C, stime } from "@thegraid/common-lib";
import { makeStage } from "@thegraid/easeljs-lib";
import { Bitmap, Container, Shape } from "@thegraid/easeljs-module";
import { HexShape } from "./shapes";
import { TP } from "./table-params";
import { TileLoader } from "./tile-loader";

export class ImageSetup {
  circle_1_inch = { x0: .9, y0: 1.0, rad: 1.0, delx: (1 + 1 / 8), dely: (1 + 1 / 8), bleed: .05, maxx: 2200, dpi: 300 };
  singleHex_1_19 = { x0: 575, y0: 450, rad: 415, delx: 357, dely: 413, maxx: 2500, maxy: 2900, bleed: 0 }; // 27

  stage: createjs.Stage;
  imageCont = new ImageContainer();
  loader: TileLoader = new TileLoader(); // Citymap tiles: Resi, Busi, Lake, Univ, etc.

  constructor(public canvasId: string, public params: Params) {
    stime.fmt = "MM-DD kk:mm:ss.SSS";
    this.stage = makeStage(canvasId, false);
    TP.useEwTopo = false;
    this.setupDownload();
    this.loader.loadImages(undefined, (imap) => this.startup(params, imap))
  }

  counts = { Bank: 5, Busi: 5, Resi: 5, Lake: 5, Pstation: 5, Recycle: 0 };
  colors = ['red', 'blue'].map(cs => C.nameToRgbaString(cs, '.9'))
  startup(params: Params, imap: Map<string, HTMLImageElement>) {
    const ic = this.imageCont;
    ic.setGrid(this.singleHex_1_19);
    this.stage.addChild(ic);
    let row = 0, col = 0;
    imap.forEach((img, key) => {
      this.colors.forEach(color => {
        let count = ((this.counts as any)[key] ?? 2);
        while (count-- > 0) {
          ic.addImage(img, row, col, color, .7);
          this.stage.update();
          if ((ic.x0 + ++col * ic.delx) > ic.maxx) {
            col = 0;
            row += 1;
          }
        }
      })
    })
    const button = document.getElementById('download') as HTMLButtonElement;
    button.click();
  }
  setupDownload() {
    const button = document.getElementById('download') as HTMLButtonElement;
    button.onclick = (ev) => this.download();
  }

  download() {
    const canvas = document.getElementById(this.canvasId) as HTMLCanvasElement;
    const download = document.getElementById("download") as HTMLButtonElement;
    const image = canvas.toDataURL("image/png");
    const octets = image.replace("image/png", "image/octet-stream");
    download.setAttribute("href", octets);
  }

}
class ImageContainer extends Container {
  pxi(inch: number) { return this.dpi * inch; }

  rad = this.pxi(1.0);
  x0 = this.pxi(.9);
  y0 = this.pxi(1.0) ;
  delx = this.pxi(1 + 1 / 8);
  dely = this.delx;
  bleed = this.pxi(.1);
  maxx = 2200;

  constructor(public dpi = 300) {
    super();
  }
  setGrid(layin: { x0?: number; y0?: number; rad?: number; delx?: number; dely?: number, maxx?: number; bleed?: number, dpi?: number }) {
    const layout = { x0: 1, y0: 1, rad: 30, delx: 1.1, dely: 1.1, bleed: .1, dpi: 1, maxx: 2200, ...layin }
    this.dpi = layout.dpi
    this.rad = this.pxi(layout.rad);
    this.x0 = this.pxi(layout.x0);
    this.y0 = this.pxi(layout.y0);
    this.delx = this.pxi(layout.delx);
    this.dely = this.pxi(layout.dely);
    this.bleed = this.pxi(layout.bleed);
    this.maxx = this.pxi(layout.maxx);
  }

  paintDisk(color: string, x = 0, y = 0, rad = this.rad) {
    const disk = new Shape();
    disk.graphics.f(color).dc(0, 0, rad + this.bleed);
    disk.x = x; disk.y = y;
    const hex = new HexShape(rad);
    hex.paint('grey', true);
    return disk;
  }

  addImage(img: HTMLImageElement, row: number, col: number, color = 'grey', os = 1) {
    const bm = new Bitmap(img);
    bm.regX = img.width / 2;
    bm.regY = img.height / 2;
    const scale = os * this.rad / Math.max(img.height, img.width);
    bm.scaleX = bm.scaleY = scale;
    const sw = img.width * scale, sh = img.height * scale;
    const cx = this.x0 + col * this.delx;
    const cy = this.y0 + row * this.dely;
    bm.x = cx;// - sw / 2;
    bm.y = cy;// - sh / 2;
    bm.rotation = 30;
    this.addChild(this.paintDisk(color, cx, cy, this.rad / 2)); // background: HexShape
    this.addChild(bm); // image
  }
}

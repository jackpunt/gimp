import { C, stime } from "@thegraid/common-lib";
import { makeStage } from "@thegraid/easeljs-lib";
import { Bitmap, Container, Shape } from "@thegraid/easeljs-module";
import { TileLoader } from "./tile-loader";
import { TP } from "./table-params";

export class ImageSetup {
  stage: createjs.Stage;
  imageCont = new ImageContainer();
  constructor(public canvasId: string, public ext: string[]) {
    stime.fmt = "MM-DD kk:mm:ss.SSS";
    this.stage = makeStage(canvasId, false);
    this.imageCont.loader.loadImages(() => this.startup(ext))
  }
  counts = { Bank: 6, Busi: 14, Resi: 14, Lake: 6, Pstation: 6, Recycle: 0 };
  colors = ['red', 'blue'].map(cs => C.nameToRgbaString(cs, '.9'))
  startup(ext = this.ext) {
    const ic = this.imageCont;
    this.stage.addChild(ic);
    let row = 0, col = 0;
    ic.loader.imageMap.forEach((img, key) => {
      this.colors.forEach(color => {
        let count = ((this.counts as any)[key] ?? 2) / 2;
        while (count-- > 0) {
          ic.addImage(img, row, col, color, .9);
          this.stage.update();
          if (++col * ic.delx > ic.maxx) {
            col = 0;
            row += 1;
          }
        }
      })
    })
  }
}
class ImageContainer extends Container {
  dpi = 300;
  inh(inch: number) { return this.dpi * inch; }
  x0 = this.inh(.9); y0 = this.inh(1.0) ; rad = this.inh(1.0);
  delx = this.inh(1 + 1 / 8); dely = this.delx;
  maxx = 2200;

  loader: TileLoader = new TileLoader();
  disk = new Shape();
  constructor() {
    super();
  }

  paintDisk(color: string, x = 0, y = 0, rad = this.rad) {
    const disk = new Shape();
    disk.graphics.c().f(color).dc(0, 0, rad + this.dpi / 20);
    disk.x = x; disk.y = y;
    return disk;
  }

  addImage(img: HTMLImageElement, row: number, col: number, color = 'grey', os = 1) {
    const bm = new Bitmap(img);
    const scale = os * this.rad / Math.max(img.height, img.width);
    bm.scaleX = bm.scaleY = scale;
    const sw = img.width * scale, sh = img.height * scale;
    const cx = this.x0 + col * this.delx;
    const cy = this.y0 + row * this.dely;
    bm.x = cx - sw / 2;
    bm.y = cy - sh / 2;
    this.addChild(this.paintDisk(color, cx, cy, this.rad / 2));
    this.addChild(bm);
  }
}

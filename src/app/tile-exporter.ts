import { C, Constructor, stime } from "@thegraid/common-lib";
import { Container, DisplayObject } from "@thegraid/easeljs-module";
import { H } from "./hex-intfs";
import { ImageGrid, PageSpec } from "./image-setup";
import { CircleShape, HexShape, PaintableShape, TileShape } from "./shapes";

class Player {
  static allPlayers: Player[] = []
}
interface Tile extends DisplayObject {
  baseShape: DisplayObject;
  radius: number;
  setPlayerAndPaint(player: Player | undefined): void;
}
export type CountClaz = [count: number, claz: Constructor<Tile>, ...args: any];
export class TileExporter {
  constructor(buttonId = 'makePage', label = 'MakePages') {
    this.setAnchorClick(buttonId, label, () => this.makeImagePages());
  }
  imageGrid = new ImageGrid();

  setAnchorClick(id: string, text: string, onclick?: ((ev: MouseEvent) => void) | 'stop') {
    const anchor = document.getElementById(id) as HTMLAnchorElement;
    anchor.innerHTML = `<button type="button">${text}</button>`;
    if (onclick === 'stop') { anchor.href = 'javascript:void(0);'; anchor.onclick = null; }
    else if (onclick) anchor.onclick = onclick;
  }

  makeImagePages() {
    const u = undefined, p0 = Player.allPlayers[0], p1 = Player.allPlayers[1];
    const hexDouble = [

    ] as CountClaz[];
    const circDouble = [ ] as CountClaz[];

    const pageSpecs: PageSpec[] = [];
    this.tilesToTemplate(circDouble, ImageGrid.circDouble_0_79, pageSpecs);
    this.tilesToTemplate(hexDouble, ImageGrid.hexDouble_1_19, pageSpecs);
    this.downloadPageSpecs(pageSpecs);
  }

  /** compose bleed, background and Tile (Tile may be transparent, so white background over bleed) */
  composeTile(claz: Constructor<Tile>, args: any[], player: Player | undefined, edge: 'L' | 'R' | 'C', addBleed = 28) {
    const cont = new Container();
    if (claz) {
      const tile = new claz(...args), base = tile.baseShape as PaintableShape;
      tile.setPlayerAndPaint(player);
      const backRad = (base instanceof TileShape) ? tile.radius * H.sqrt3_2 * (55 / 60) : 0;
      const back = new CircleShape(C.WHITE, backRad);
      const bleed = new HexShape(tile.radius + addBleed); // .09 inch + 1px
      {
        bleed.paint(base.colorn ?? C.grey, true);
        // bleed.paint(C.lightpink, true);
        // trim to fit template, allow extra on first/last column of row:
        const dx0 = (edge === 'L') ? 30 : 0, dw = (edge === 'R') ? 30 : 0;
        const { x, y, width, height } = base.getBounds(), d = -3;
        bleed.setBounds(x, y, width, height);
        bleed.cache(x - dx0, y - d, width + dx0 + dw, height + 2 * d);
      }
      cont.addChild(bleed, back, tile);
    }
    return cont;
  }

  /** each PageSpec will identify the canvas that contains the Tile-Images */
  tilesToTemplate(countClaz: CountClaz[], gridSpec = ImageGrid.hexDouble_1_19, pageSpecs: PageSpec[] = []) {
    const both = true, double = gridSpec.double ?? true;
    const frontAry = [] as DisplayObject[][];
    const backAry = [] as (DisplayObject[] | undefined)[];
    const page = pageSpecs.length;
    const { nrow, ncol } = gridSpec, perPage = nrow * ncol;
    let nt = page * perPage;
    countClaz.forEach(([count, claz, ...args]) => {
      const frontPlayer = both ? Player.allPlayers[0] : undefined;
      const backPlayer = both ? Player.allPlayers[1] : undefined;
      const nreps = Math.abs(count);
      for (let i = 0; i < nreps; i++) {
        const n = nt % perPage, pagen = Math.floor(nt++ / perPage);
        const addBleed = (true || n > 3 && n < 32) ? undefined : -10; // for DEBUG: no bleed to see template positioning
        if (!frontAry[pagen]) frontAry[pagen] = [];
        const col = n % ncol, edge = (col === 0) ? 'L' : (col === ncol - 1) ? 'R' : 'C';
        const frontTile = this.composeTile(claz, args, frontPlayer, edge, addBleed);
        frontAry[pagen].push(frontTile);
        if (double) {
          const backAryPagen = backAry[pagen] ?? (backAry[pagen] = []) as (DisplayObject | undefined)[];
          const backTile = (claz.name === 'BonusTile') ? undefined : this.composeTile(claz, args, backPlayer, edge, addBleed);
          const tile = backTile?.getChildAt(2);
          backAryPagen.push(backTile);
        }
      }
    });
    frontAry.forEach((ary, pagen) => {
      const frontObjs = frontAry[pagen], backObjs = double ? backAry[pagen] : undefined;
      const canvasId = `canvas_P${pagen}`;
      const pageSpec = { gridSpec, frontObjs, backObjs };
      pageSpecs[pagen] = pageSpec;
      console.log(stime(this, `.makePage: canvasId=${canvasId}, pageSpec=`), pageSpec);
      this.imageGrid.makePage(pageSpec, canvasId);  // make canvas with images, but do not download [yet]
    })
    return pageSpecs;
  }

  downloadPageSpecs(pageSpecs: PageSpec[], baseName = `image_${stime.fs("MM-DD_kk_mm_ssL")}`) {
    let nclick = 0;
    this.setAnchorClick('download', `Download-P${nclick}`, (ev) => {
      if (nclick >= pageSpecs.length) {
        this.setAnchorClick('download', 'Download-done', 'stop');
        return;
      }
      const n = nclick++;
      const pageSpec = pageSpecs[n];
      const canvas = pageSpec.canvas as HTMLCanvasElement;
      const filename = `${baseName}_P${n}.png`;
      // console.log(stime(this, `.downloadClick: ${canvasId} -> ${filename}`))
      this.imageGrid.downloadImage(canvas, filename);
      const next = `${(nclick < pageSpecs.length) ? `P${nclick}`: 'done'}`
      this.setAnchorClick('download', `Download-${next}`);
    });

    const bagTiles = {
    };
    // BonusTile.allTiles;
    // EventTile.allTiles;   // EvalTile
    // PolicyTile.allTiles;  // EvalTile


    return;
  }
}

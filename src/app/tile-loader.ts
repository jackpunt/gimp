import { ImageLoader } from "@thegraid/common-lib";
import { TP } from "./table-params";

export class TileLoader {
  Uname = ['Univ0'];
  Monu = new Array(TP.inMarket['Monument']).fill(1).map((v, k) => `Monument${k}`);
  imageMap = new Map<string, HTMLImageElement>();
  aliases = { Monument1: 'arc_de_triomphe3', Monument2: 'Statue-of-liberty' } as any;

  fromAlias(names: string[]) {
    return names.map(name => this.aliases[name] ?? name);
  }
  imageArgs = {
    root: 'assets/images/',
    fnames: this.fromAlias(['Resi', 'Busi', 'Pstation', 'Bank', 'Lake', 'Recycle',
      'TownStart', 'Courthouse', 'TownHall', 'Temple',
      ...this.Monu, ...this.Uname]),
    ext: 'png',
  };

  /** use ImageLoader to load images, THEN invoke callback. */
  loadImages(imageArgs = this.imageArgs , cb: (imap: Map<string, HTMLImageElement>) => void) {
    new ImageLoader(imageArgs, this.imageMap, (imap) => cb(imap))
  }
  getImage(name: string) {
    return this.imageMap.get(this.aliases[name] ?? name);
  }
}

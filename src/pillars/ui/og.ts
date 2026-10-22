import { deflateSync, crc32 } from "node:zlib";
import { hexToRgb } from "../../util.js";

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const name = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])) >>> 0);
  return Buffer.concat([length, name, data, crc]);
}

/** Solid brand card. Latin titles also live in og:title; the bitmap is a color field, not a typesetter. */
export function renderOgPng(primary: string, accent: string): Buffer {
  const width = 1200;
  const height = 630;
  const [r, g, b] = hexToRgb(primary);
  const [ar, ag, ab] = hexToRgb(accent);
  const row = Buffer.alloc(1 + width * 3);
  const raw: Buffer[] = [];
  for (let y = 0; y < height; y++) {
    row[0] = 0;
    const stripe = y > height - 36;
    for (let x = 0; x < width; x++) {
      const i = 1 + x * 3;
      row[i] = stripe ? ar : r;
      row[i + 1] = stripe ? ag : g;
      row[i + 2] = stripe ? ab : b;
    }
    raw.push(Buffer.from(row));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(raw))),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

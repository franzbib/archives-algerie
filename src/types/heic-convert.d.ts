declare module "heic-convert" {
  interface HeicConvertOptions {
    buffer: Buffer | Uint8Array | ArrayBuffer;
    format: "JPEG" | "PNG";
    quality?: number;
  }

  export default function convert(options: HeicConvertOptions): Promise<ArrayBuffer>;
}

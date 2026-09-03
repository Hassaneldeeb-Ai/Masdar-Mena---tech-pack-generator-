declare module "pdfmake/build/pdfmake" {
  import * as pdfMake from "pdfmake";
  const pdfmake: typeof pdfMake;
  export default pdfmake;
}

declare module "pdfmake/build/vfs_fonts" {
  const vfs: Record<string, string>;
  export default vfs;
}

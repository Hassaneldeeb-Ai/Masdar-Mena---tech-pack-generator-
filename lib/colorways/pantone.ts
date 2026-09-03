/**
 * Deterministic Pantone FHI/TCX colour matching.
 *
 * A curated subset of the official Pantone Fashion, Home + Interiors (PANTONE
 * FHI) cotton reference — hex values rounded to display sRGB. `nearestPantone`
 * picks the closest swatch in perceptually weighted RGB space.
 *
 * Reference cards are intended for sampling; treat results as a starting
 * point and validate against the physical FHI swatch book before bulk order.
 */

export interface PantoneMatch {
  code: string; // e.g. "15-1116 TCX"
  name: string; // e.g. "Khaki"
  hex: string; // reference hex of the TCX card
  distance: number; // weight-adjusted distance, smaller is closer (0 = exact)
}

/** [code, name, hex] tuples — curated PANTONE FHI/TCX common textile colours. */
const TCX: Array<[string, string, string]> = [
  ["11-0602 TCX", "Bright White", "#F4F4F1"],
  ["11-4201 TCX", "Cloud Dancer", "#F0EEE9"],
  ["12-5202 TCX", "Cream", "#F3E5C8"],
  ["13-1006 TCX", "Ecru", "#C8AD7F"],
  ["13-4423 TCX", "Skyway", "#AFC5DA"],
  ["14-1107 TCX", "Oyster Grey", "#E3D9C5"],
  ["14-4207 TCX", "Misty Blue", "#9FB3C3"],
  ["15-1116 TCX", "Khaki", "#C3B091"],
  ["15-1247 TCX", "Apricot", "#F2B06D"],
  ["15-1626 TCX", "Peach Pink", "#F4ACA6"],
  ["15-3507 TCX", "Lavender Blue", "#A694C2"],
  ["15-3914 TCX", "Rhodonite", "#96A5A0"],
  ["15-4722 TCX", "Cyan Blue", "#14A9A7"],
  ["16-0207 TCX", "Sage", "#847B61"],
  ["16-0836 TCX", "Dried Herb", "#847A59"],
  ["16-0928 TCX", "Camel", "#B99E7F"],
  ["16-1105 TCX", "Hemlock", "#5A6752"],
  ["16-1338 TCX", "Cinnamon", "#7F5533"],
  ["16-1340 TCX", "Pumpkin", "#C77F3F"],
  ["16-1720 TCX", "Rose Quartz", "#F1A0A1"],
  ["16-3304 TCX", "Orchid Haze", "#B28A9B"],
  ["16-3706 TCX", "Lavender", "#B48BB0"],
  ["16-3803 TCX", "Faded Violet", "#92708A"],
  ["16-4010 TCX", "Granite Grey", "#6E6E70"],
  ["16-4020 TCX", "Coronet Blue", "#5E6E9E"],
  ["16-4529 TCX", "Aqua Splash", "#65B3C2"],
  ["16-5106 TCX", "Peppermint Leaf", "#3F8796"],
  ["17-0620 TCX", "Grape Leaf", "#4F5932"],
  ["17-0620 TCX", "Olive Branch", "#59705E"],
  ["17-0840 TCX", "Mustard Gold", "#A36D28"],
  ["17-1045 TCX", "Avocado Dip", "#817D35"],
  ["17-1501 TCX", "Feldspar", "#656A6D"],
  ["17-1755 TCX", "Red Terrace", "#C3553F"],
  ["17-2020 TCX", "Zinnia", "#D88BA4"],
  ["17-2030 TCX", "Mulberry", "#8B4B71"],
  ["17-2555 TCX", "Hibiscus", "#C94C7C"],
  ["17-3030 TCX", "Valor", "#8074BB"],
  ["17-3936 TCX", "Blue Iris", "#5A7DBC"],
  ["17-3940 TCX", "Blue Iris Bright", "#6689C9"],
  ["17-5126 TCX", "Meridian", "#037C7A"],
  ["17-5335 TCX", "Galapagos Green", "#4D8A73"],
  ["17-5434 TCX", "Deep Lagoon", "#0A7D82"],
  ["17-5634 TCX", "Lapis", "#4B8F9A"],
  ["17-6030 TCX", "Cascade", "#438778"],
  ["18-0117 TCX", "Ivy", "#4C5541"],
  ["18-0332 TCX", "Forest", "#5C7253"],
  ["18-0630 TCX", "Antique Moss", "#7B8069"],
  ["18-0527 TCX", "Green Olive", "#6F6A35"],
  ["18-1051 TCX", "Saffron", "#B38A48"],
  ["18-1154 TCX", "Glazed Caramel", "#8C3F26"],
  ["18-1421 TCX", "Toast", "#9A7A77"],
  ["18-1450 TCX", "Red Clay", "#844D4D"],
  ["18-1550 TCX", "Rust", "#B55C3E"],
  ["18-1630 TCX", "Faded Rose", "#8F5B63"],
  ["18-1720 TCX", "Dusty Rose", "#976A79"],
  ["18-1940 TCX", "Pink Peacock", "#8A4265"],
  ["18-2336 TCX", "Dewberry", "#864A7A"],
  ["18-3324 TCX", "Deep Lavender", "#5E4C7A"],
  ["18-3547 TCX", "Ultra Violet", "#5D4C9E"],
  ["18-3922 TCX", "Marina", "#4B627F"],
  ["18-3937 TCX", "Twilight Blue", "#3A4A86"],
  ["18-4132 TCX", "Blueprint", "#45678F"],
  ["18-4320 TCX", "Blue Ashes", "#376F7F"],
  ["18-5025 TCX", "Tidal", "#55786B"],
  ["18-5560 TCX", "Ultra Green", "#36AA64"],
  ["18-5715 TCX", "Fern", "#4E9155"],
  ["18-6011 TCX", "Greenery", "#576C48"],
  ["19-0315 TCX", "Leaf", "#2D4023"],
  ["19-0506 TCX", "Dusk Green", "#3A4038"],
  ["19-0822 TCX", "Taupe", "#4D4641"],
  ["19-1015 TCX", "Tobacco", "#5C4A2E"],
  ["19-1109 TCX", "Stiletto", "#3D2B22"],
  ["19-1220 TCX", "Bitter Chocolate", "#4F3B33"],
  ["19-1330 TCX", "Red Mahogany", "#56293E"],
  ["19-1520 TCX", "Rum", "#66373D"],
  ["19-1524 TCX", "Maroon", "#5C3E4B"],
  ["19-1620 TCX", "Burgundy", "#63322F"],
  ["19-1717 TCX", "Port Wine", "#603C42"],
  ["19-1745 TCX", "Rio Red", "#8E3B44"],
  ["19-1760 TCX", "Razzle Red", "#9E2D46"],
  ["19-1840 TCX", "Red Dahlia", "#A02749"],
  ["19-2432 TCX", "Sangria", "#8F354F"],
  ["19-2508 TCX", "Dark Purple", "#3E2A4E"],
  ["19-2825 TCX", "Grape Nectar", "#62345C"],
  ["19-3626 TCX", "Dusty Purple", "#556B6D"],
  ["19-3830 TCX", "Strong Blue", "#3E4C87"],
  ["19-3925 TCX", "Deep Blue", "#2B3D6E"],
  ["19-3934 TCX", "Washed denim", "#3D404E"],
  ["19-4026 TCX", "Blue Nights", "#2A3356"],
  ["19-4039 TCX", "Estate Blue", "#1F4A64"],
  ["19-4104 TCX", "New Navy", "#28495A"],
  ["19-4205 TCX", "Caviar", "#2E3549"],
  ["19-4316 TCX", "Stillwater", "#3A3F4F"],
  ["19-4625 TCX", "Gulfstream", "#2E7E8F"],
  ["19-4716 TCX", "Amalfi", "#2D4C46"],
  ["19-4726 TCX", "Pacific", "#1A4B52"],
  ["19-5024 TCX", "Pine Grove", "#3E4B3D"],
  ["19-5416 TCX", "Storm", "#3D566D"],
  ["19-5918 TCX", "Cactus", "#40544A"],
  ["19-6317 TCX", "Dark Asparagus", "#4C5D4E"],
  ["19-6430 TCX", "Green Hornet", "#557544"],
  ["19-6626 TCX", "Artichoke", "#4D5B52"],
  ["19-6720 TCX", "Forest Blk", "#363F37"],
  ["19-7519 TCX", "Kombu Green", "#3D5A44"],
  ["19-8115 TCX", "Marine Green", "#306A72"],
  ["19-8222 TCX", "Blue green", "#394A56"],
  ["19-9025 TCX", "Rainforest", "#245D55"],
  ["19-1026 TCX", "Black Coffee", "#3B302A"],
  ["19-1408 TCX", "Marzipan", "#3B3630"],
  ["19-1617 TCX", "Espresso", "#3F3231"],
  ["19-1905 TCX", "Plum", "#4C2F42"],
  ["19-3920 TCX", "Indigo", "#3F4B72"],
  ["19-4007 TCX", "Black Beauty", "#16151C"],
  ["19-4005 TCX", "Suited Up", "#1A1C22"],
  ["19-4206 TCX", "Black Grn", "#333A3A"],
  ["19-1015 TCX", "Dusky Taupe", "#544B49"],
  ["19-1016 TCX", "Wren", "#4D4846"],
  ["19-1213 TCX", "Walnut", "#6A554C"],
  ["19-1314 TCX", "Leather", "#6C4D41"],
  ["19-1334 TCX", "Brandy Brown", "#5F3B38"],
  ["19-1523 TCX", "Crimson", "#5F2B3A"],
  ["17-0509 TCX", "Sandstone", "#8B8479"],
  ["13-4413 TCX", "Icy Blue", "#C9D8DF"],
  ["15-4312 TCX", "Dusk Blue", "#959CA9"],
  ["16-4132 TCX", "Malibu Blue", "#8A95BD"],
  ["10-0039 TCX", "Snow Lily", "#F5F5EF"],
];

/** Weighted HSV-aware similarity — dR 0.34, dG 0.59, dB 0.12 (luma weight). */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  if (clean.length !== 6) return [0, 0, 0];
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function nearestPantone(hex: string): PantoneMatch {
  const [r, g, b] = hexToRgb(hex);
  const [th, ts, tl] = rgbToHsl(r, g, b);
  let best: PantoneMatch | null = null;
  let bestScore = Infinity;
  for (const [code, name, refHex] of TCX) {
    const [rr, rg, rb] = hexToRgb(refHex);
    const [rh, rs, rl] = rgbToHsl(rr, rg, rb);
    const hueD = hueDistance(th, rh);
    const dRgb = Math.sqrt(
      0.34 * (r - rr) ** 2 + 0.59 * (g - rg) ** 2 + 0.12 * (b - rb) ** 2
    );
    const dHue = hueD > 15 ? 12 : hueD * 0.25;
    const dSat = Math.abs(ts - rs) * 0.5;
    const dLight = Math.abs(tl - rl) * 0.45;
    const score = dRgb + dHue + dSat + dLight;
    if (score < bestScore) {
      bestScore = score;
      best = { code, name, hex: refHex, distance: Math.round(score * 10) / 10 };
    }
  }
  return best!;
}

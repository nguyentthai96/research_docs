// Vietnamese Text Normalizer
// Converts numbers, dates, currencies, percentages to Vietnamese words

/**
 * Convert a dotted section number to Vietnamese words using "chấm".
 * e.g. "1.1" → "một chấm một"
 * e.g. "2.3.1" → "hai chấm ba chấm một"
 * e.g. "4.10" → "bốn chấm mười"
 */
function sectionNumberToVietnamese(numStr: string): string {
  return numStr
    .split('.')
    .filter(Boolean)
    .map((n) => numberToVietnamese(parseInt(n, 10)))
    .join(' chấm ');
}

/**
 * Convert a decimal number string to Vietnamese words using "phẩy".
 * e.g. "99.9" → "chín mươi chín phẩy chín"
 * e.g. "4.5" → "bốn phẩy năm"
 */
function decimalToVietnamese(numStr: string): string {
  const parts = numStr.split('.');
  const whole = numberToVietnamese(parseInt(parts[0], 10));
  if (parts.length > 1 && parts[1]) {
    const dec = parts[1].split('').map((d) => numberToVietnamese(parseInt(d, 10))).join(' ');
    return `${whole} phẩy ${dec}`;
  }
  return whole;
}

/**
 * Regex matching icons, emojis, pictographs, dingbats, and decorative symbols.
 * Strips icons so TTS voice does not pronounce icon names aloud.
 */
const ICON_EMOJI_REGEX = /[\p{Extended_Pictographic}\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B00}-\u{2BFF}\u{25A0}-\u{25FF}\u{FE00}-\u{FE0F}\u{200D}]+/gu;

/**
 * Normalize non-standard words (NSW) in Vietnamese text.
 * Handles: icon stripping, section numbering (Mục x.x), numbers, dates, currencies, percentages, ordinals, units.
 */
export function normalizeVietnamese(text: string): string {
  let result = text;

  // Strip icons, emojis, pictographs so TTS voice doesn't read them
  result = result.replace(ICON_EMOJI_REGEX, '').replace(/\s+/g, ' ');

  // Percentages: 99.99% → chín mươi chín phẩy chín chín phần trăm
  result = result.replace(
    /(\d+(?:\.\d+)?)\s*%/g,
    (_, num) => `${decimalToVietnamese(num)} phần trăm`
  );

  // Currency: $100 → một trăm đô la
  result = result.replace(
    /\$(\d+(?:,\d{3})*(?:\.\d+)?)/g,
    (_, num) => `${decimalToVietnamese(num.replace(/,/g, ''))} đô la`
  );

  // Currency: 100đ / 100 VNĐ (protect against words like "để", "đến")
  result = result.replace(
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:đ(?![a-zA-Zà-ỹÀ-Ỹ])|VNĐ\b|VND\b)/g,
    (_, num) => `${decimalToVietnamese(num.replace(/,/g, ''))} đồng`
  );

  // Date: 2026-10-09 → ngày chín tháng mười năm hai nghìn không trăm hai mươi sáu
  result = result.replace(
    /(\d{4})-(\d{1,2})-(\d{1,2})/g,
    (_, y, m, d) =>
      `ngày ${numberToVietnamese(parseInt(d, 10))} tháng ${numberToVietnamese(parseInt(m, 10))} năm ${numberToVietnamese(parseInt(y, 10))}`
  );

  // Time: 15:30 → mười lăm giờ ba mươi phút
  result = result.replace(
    /(\d{1,2}):(\d{2})(?::(\d{2}))?/g,
    (_, h, m, s) => {
      let timeStr = `${numberToVietnamese(parseInt(h, 10))} giờ ${numberToVietnamese(parseInt(m, 10))} phút`;
      if (s) timeStr += ` ${numberToVietnamese(parseInt(s, 10))} giây`;
      return timeStr;
    }
  );

  // Large numbers with commas: 1,000,000 → một triệu
  result = result.replace(
    /\b(\d{1,3}(?:,\d{3})+)\b/g,
    (_, num) => numberToVietnamese(parseInt(num.replace(/,/g, ''), 10))
  );

  // Version numbers: v3.0 → phiên bản ba chấm không
  result = result.replace(
    /\bv(\d+(?:\.\d+)*)\b/gi,
    (_, ver) => `phiên bản ${ver.split('.').map((n: string) => numberToVietnamese(parseInt(n, 10))).join(' chấm ')}`
  );

  // === Section Numbers (Mục x.x) ===
  // 1. Explicit [Mm]ục / [Pp]hần / [Cc]hương / [Đđ]iều / [Tt]iết followed by x.x
  // e.g. "Mục 1.1: Throughput" → "Mục một chấm một: Throughput"
  // e.g. "trong mục 1.1 ta thấy" → "trong mục một chấm một ta thấy"
  result = result.replace(
    /\b([Mm]ục|[Pp]hần|[Cc]hương|[Đđ]iều|[Tt]iết)\s+([1-9]\d*(?:\.[1-9]\d*)+)(\.?)(?=\s|$|:)/g,
    (_, prefix, num, dot) => `${prefix} ${sectionNumberToVietnamese(num)}${dot ? '.' : ''}`
  );

  // 2. Explicit [Mm]ục / [Pp]hần / etc. followed by single integer:
  // e.g. "Mục 1. Các Chỉ Số" → "Mục một. Các Chỉ Số"
  result = result.replace(
    /\b([Mm]ục|[Pp]hần|[Cc]hương|[Đđ]iều|[Tt]iết)\s+([1-9]\d*)\.?\s+/g,
    (_, prefix, num) => `${prefix} ${numberToVietnamese(parseInt(num, 10))}. `
  );

  // 3. Section number at the beginning of text, heading, or sentence:
  // e.g. "^1.1 Throughput Metrics" → "Mục một chấm một. Throughput Metrics"
  // e.g. "^1.1. So sánh..." → "Mục một chấm một. So sánh..."
  result = result.replace(
    /(^|(?<=[!?\n])\s*|(?<=\.\s+))([1-9]\d*(?:\.[1-9]\d*)+)\.?\s*/g,
    (_, prefix, num) => `${prefix}Mục ${sectionNumberToVietnamese(num)}. `
  );

  // 4. Preposition references: "ở 1.1", "xem 2.3", "theo 3.1.2", "tại 4.5"
  result = result.replace(
    /\b(ở|tại|trong|theo|xem|đến|từ|vào|sang)\s+([1-9]\d*(?:\.[1-9]\d*)+)\.?/gi,
    (_, prep, num) => `${prep} mục ${sectionNumberToVietnamese(num)}`
  );

  // 5. Parentheses references: "(1.1)", "(xem 2.3)"
  result = result.replace(
    /\((xem\s+)?([1-9]\d*(?:\.[1-9]\d*)+)\)/gi,
    (_, prefix, num) => `(${prefix || ''}mục ${sectionNumberToVietnamese(num)})`
  );

  // 6. Multi-level dotted numbers (1.2.3, 4.6.1) anywhere not preceded by [Mm]ục
  result = result.replace(
    /(?<![.\w\d])(?<![Mm]ục\s)([1-9]\d*(?:\.[1-9]\d*){2,})\.?(?![.\w\d])/g,
    (_, num) => `mục ${sectionNumberToVietnamese(num)}`
  );

  // 7. Standalone x.x not followed by units (e.g. "So sánh 1.1 và 2.3")
  const units = /^(?:ms|s|giây|phút|giờ|ns|us|µs|%|phần trăm|gb|mb|kb|tb|gbps|mbps|kbps|ghz|mhz|khz|hz|x|tps|qps|rps|iops|usd|eur|vnd|đ|\$|triệu|tỷ|nghìn|k|m|b|users)\b/i;
  result = result.replace(
    /(?<![.\w\d])(?<![Mm]ục\s)([1-9]\d*\.[1-9]\d*)(?![.\w\d])/g,
    (match, num, offset, str) => {
      const rest = str.slice(offset + match.length).trim();
      if (units.test(rest)) return match;
      return `mục ${sectionNumberToVietnamese(num)}`;
    }
  );

  // Decimal numbers: 4.5 → bốn phẩy năm (skip already normalized terms)
  result = result.replace(
    /\b(\d+)\.(\d+)\b/g,
    (match, whole, decimal) => {
      if (/phiên bản|phần trăm|đô la|đồng|chấm|mục/.test(result.slice(Math.max(0, result.indexOf(match) - 30), result.indexOf(match)))) {
        return match;
      }
      return `${numberToVietnamese(parseInt(whole, 10))} phẩy ${decimal.split('').map((d: string) => numberToVietnamese(parseInt(d, 10))).join(' ')}`;
    }
  );

  // Standalone numbers: 100 → một trăm (only for numbers > 9)
  result = result.replace(
    /\b(\d{2,})\b/g,
    (match) => {
      const num = parseInt(match, 10);
      if (isNaN(num)) return match;
      return numberToVietnamese(num);
    }
  );

  return result;
}

/**
 * Convert a number to Vietnamese words.
 * Handles 0 through billions.
 */
function numberToVietnamese(num: number): string {
  num = Math.floor(num);
  if (num === 0) return 'không';
  if (num < 0) return `âm ${numberToVietnamese(-num)}`;
  if (!Number.isFinite(num)) return String(num);

  const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const teens = ['mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín'];

  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];

  if (num < 100) {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    let result = ones[ten] + ' mươi';
    if (one === 1) result += ' mốt';
    else if (one === 5) result += ' lăm';
    else if (one > 0) result += ' ' + ones[one];
    return result;
  }

  if (num < 1000) {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    let result = ones[hundred] + ' trăm';
    if (remainder > 0) {
      if (remainder < 10) result += ' lẻ ' + ones[remainder];
      else result += ' ' + numberToVietnamese(remainder);
    }
    return result;
  }

  if (num < 1_000_000) {
    const thousand = Math.floor(num / 1000);
    const remainder = num % 1000;
    let result = numberToVietnamese(thousand) + ' nghìn';
    if (remainder > 0) {
      if (remainder < 100) result += ' không trăm ' + numberToVietnamese(remainder);
      else result += ' ' + numberToVietnamese(remainder);
    }
    return result;
  }

  if (num < 1_000_000_000) {
    const million = Math.floor(num / 1_000_000);
    const remainder = num % 1_000_000;
    let result = numberToVietnamese(million) + ' triệu';
    if (remainder > 0) result += ' ' + numberToVietnamese(remainder);
    return result;
  }

  const billion = Math.floor(num / 1_000_000_000);
  const remainder = num % 1_000_000_000;
  let result = numberToVietnamese(billion) + ' tỷ';
  if (remainder > 0) result += ' ' + numberToVietnamese(remainder);
  return result;
}

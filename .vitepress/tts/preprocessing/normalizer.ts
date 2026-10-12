// Vietnamese Text Normalizer
// Converts numbers, dates, currencies, percentages to Vietnamese words

/**
 * Normalize non-standard words (NSW) in Vietnamese text.
 * Handles: numbers, dates, currencies, percentages, ordinals, units.
 */
export function normalizeVietnamese(text: string): string {
  let result = text;

  // Percentages: 99.99% → chín mươi chín phẩy chín chín phần trăm
  result = result.replace(
    /(\d+(?:\.\d+)?)\s*%/g,
    (_, num) => `${numberToVietnamese(parseFloat(num))} phần trăm`
  );

  // Currency: $100 → một trăm đô la
  result = result.replace(
    /\$(\d+(?:,\d{3})*(?:\.\d+)?)/g,
    (_, num) => `${numberToVietnamese(parseFloat(num.replace(/,/g, '')))} đô la`
  );

  // Currency: 100đ / 100 VNĐ
  result = result.replace(
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:đ|VNĐ|VND)/g,
    (_, num) => `${numberToVietnamese(parseFloat(num.replace(/,/g, '')))} đồng`
  );

  // Date: 2026-10-09 → ngày chín tháng mười năm hai nghìn không trăm hai mươi sáu
  result = result.replace(
    /(\d{4})-(\d{1,2})-(\d{1,2})/g,
    (_, y, m, d) =>
      `ngày ${numberToVietnamese(parseInt(d))} tháng ${numberToVietnamese(parseInt(m))} năm ${numberToVietnamese(parseInt(y))}`
  );

  // Time: 15:30 → mười lăm giờ ba mươi phút
  result = result.replace(
    /(\d{1,2}):(\d{2})(?::(\d{2}))?/g,
    (_, h, m, s) => {
      let timeStr = `${numberToVietnamese(parseInt(h))} giờ ${numberToVietnamese(parseInt(m))} phút`;
      if (s) timeStr += ` ${numberToVietnamese(parseInt(s))} giây`;
      return timeStr;
    }
  );

  // Large numbers with commas: 1,000,000 → một triệu
  result = result.replace(
    /\b(\d{1,3}(?:,\d{3})+)\b/g,
    (_, num) => numberToVietnamese(parseInt(num.replace(/,/g, '')))
  );

  // Version numbers: v3.0 → phiên bản ba chấm không
  result = result.replace(
    /\bv(\d+(?:\.\d+)*)\b/gi,
    (_, ver) => `phiên bản ${ver.split('.').map((n: string) => numberToVietnamese(parseInt(n))).join(' chấm ')}`
  );

  // Decimal numbers: 4.5 → bốn phẩy năm
  result = result.replace(
    /\b(\d+)\.(\d+)\b/g,
    (match, whole, decimal) => {
      // Skip if already processed (versions, percentages, etc.)
      if (/phiên bản|phần trăm|đô la|đồng/.test(result.slice(Math.max(0, result.indexOf(match) - 30), result.indexOf(match)))) {
        return match;
      }
      return `${numberToVietnamese(parseInt(whole))} phẩy ${decimal.split('').map((d: string) => numberToVietnamese(parseInt(d))).join(' ')}`;
    }
  );

  // Standalone numbers: 100 → một trăm (only for numbers > 9)
  result = result.replace(
    /\b(\d{2,})\b/g,
    (match) => {
      const num = parseInt(match);
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

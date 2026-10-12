// Technical Abbreviation Dictionary for Vietnamese TTS
// Maps technical terms → Vietnamese-readable pronunciations

export const TECH_DICTIONARY: Record<string, string> = {
  // === Architecture Patterns ===
  'SRP': 'Single Responsibility Principle',
  'OCP': 'Open Closed Principle',
  'LSP': 'Liskov Substitution Principle',
  'ISP': 'Interface Segregation Principle',
  'DIP': 'Dependency Inversion Principle',
  'SOLID': 'sô-lít',
  'DDD': 'Domain Driven Design',
  'CQRS': 'see-queue-arr-ét',
  'TDD': 'Test Driven Development',
  'BDD': 'Behavior Driven Development',
  'MVC': 'Model View Controller',
  'MVVM': 'Model View ViewModel',
  'EDA': 'Event Driven Architecture',

  // === Kubernetes & DevOps ===
  'K8s': 'Kubernetes',
  'k8s': 'Kubernetes',
  'CI/CD': 'CI CD',
  'DevOps': 'đê-vốp',
  'Docker': 'đốc-cơ',
  'Helm': 'hem',
  'IaC': 'Infrastructure as Code',
  'GitOps': 'gít-ốp',

  // === Performance Metrics ===
  'TPS': 'giao dịch mỗi giây',
  'QPS': 'truy vấn mỗi giây',
  'RPS': 'request mỗi giây',
  'RTF': 'real-time factor',
  'TTFB': 'time to first byte',
  'TTFA': 'time to first audio',
  'RTT': 'round trip time',
  'P50': 'phần trăm thứ năm mươi',
  'P95': 'phần trăm thứ chín mươi lăm',
  'P99': 'phần trăm thứ chín mươi chín',
  'SLA': 'ét-eo-ây',
  'SLO': 'ét-eo-ô',
  'SLI': 'ét-eo-ai',

  // === Complexity ===
  'O(1)': 'ô-lớn-một',
  'O(n)': 'ô-lớn-n',
  'O(log n)': 'ô-lớn-lốc-n',
  'O(n log n)': 'ô-lớn-n-lốc-n',
  'O(n²)': 'ô-lớn-n-bình-phương',
  'O(n^2)': 'ô-lớn-n-bình-phương',
  'O(2^n)': 'ô-lớn-hai-mũ-n',

  // === Protocols & APIs ===
  'HTTP/2': 'ách-tê-tê-pê phiên bản hai',
  'HTTP/3': 'ách-tê-tê-pê phiên bản ba',
  'gRPC': 'gê-arr-pê-xê',
  'REST': 'rét',
  'RESTful': 'rét-phồ',
  'GraphQL': 'gờ-ráp-queue-eo',
  'WebSocket': 'web socket',
  'TCP/IP': 'tê-xê-pê ai-pê',
  'UDP': 'u-đê-pê',
  'MQTT': 'em-queue-tê-tê',

  // === Data & Storage ===
  'CRDT': 'see-arr-dee-tee',
  'SQL': 'ét-queue-eo',
  'NoSQL': 'nô-ét-queue-eo',
  'ORM': 'ô-arr-em',
  'ACID': 'á-xít',
  'BASE': 'bây-s',
  'CAP': 'xê-ây-pê',
  'ETL': 'e-tê-eo',
  'OLTP': 'ô-eo-tê-pê',
  'OLAP': 'ô-eo-ây-pê',

  // === Units ===
  'ms': 'mi-li-giây',
  'µs': 'mai-cờ-rô giây',
  'ns': 'na-nô giây',
  'KB': 'ki-lô-bai',
  'MB': 'mê-ga-bai',
  'GB': 'gi-ga-bai',
  'TB': 'te-ra-bai',
  'kHz': 'ki-lô-héc',
  'MHz': 'mê-ga-héc',
  'GHz': 'gi-ga-héc',

  // === Common Tech Terms ===
  'API': 'ây-pê-ai',
  'SDK': 'ét-đê-kây',
  'CLI': 'xê-eo-ai',
  'GUI': 'giu-ai',
  'IDE': 'ai-đê-e',
  'URL': 'u-arr-eo',
  'URI': 'u-arr-ai',
  'DNS': 'đê-en-ét',
  'CDN': 'xê-đê-en',
  'SSR': 'ét-ét-arr',
  'SSG': 'ét-ét-gê',
  'CSR': 'xê-ét-arr',
  'ISR': 'ai-ét-arr',
  'SPA': 'ét-pê-ây',
  'PWA': 'pê-đắp-biu-ây',
  'JWT': 'jê-đắp-biu-tê',
  'OAuth': 'ô-ốt',
  'CORS': 'co',
  'WASM': 'wát-xơm',
  'WebGPU': 'web gê-pê-u',
  'ONNX': 'on-nít',
  'TTS': 'tê-tê-ét',
  'STT': 'ét-tê-tê',
  'NLP': 'en-eo-pê',
  'LLM': 'eo-eo-em',
  'RAG': 'rag',
  'SSML': 'ét-ét-em-eo',
  'G2P': 'gê-hai-pê',
  'MOS': 'em-ô-ét',
  'VRAM': 'vi-ram',
  'GPU': 'gê-pê-u',
  'CPU': 'xê-pê-u',
  'RAM': 'ram',
  'SSD': 'ét-ét-đê',
  'IOPS': 'ai-ô-pê-ét',
  'CI': 'xê-ai',
  'CD': 'xê-đê',
  'PR': 'pê-arr',
  'MR': 'em-arr',
  'CR': 'xê-arr',
  'DX': 'đê-ét',
  'UX': 'u-ét',
  'UI': 'u-ai',
};

/**
 * Expand technical abbreviations in text to Vietnamese-readable form.
 * Sorts patterns by length (longest first) to avoid partial matches.
 */
export function expandAbbreviations(text: string): string {
  let result = text;

  // Sort by length descending to match longer patterns first
  const sorted = Object.entries(TECH_DICTIONARY).sort(
    ([a], [b]) => b.length - a.length
  );

  for (const [abbr, expansion] of sorted) {
    const escaped = abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<=\\s|^|[("\\[])${escaped}(?=\\s|$|[)".\\],;:!?])`, 'g');
    result = result.replace(regex, expansion);
  }

  return result;
}

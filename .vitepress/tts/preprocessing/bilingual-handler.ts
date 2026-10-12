// Bilingual Handler — Optimize TTS reading for mixed Vietnamese/English content
// Ensures English technical terms are read naturally by Vietnamese TTS voice

/**
 * Pronunciation guide for common English tech terms.
 * Format: English → Vietnamese phonetic approximation that sounds natural
 * when read by vi-VN-HoaiMyNeural.
 * 
 * Strategy:
 *  - Short terms (1 word): Provide Vietnamese phonetic spelling
 *  - Compound terms: "English , phiên âm" for clarity 
 *  - Well-known terms: Keep English (Edge-TTS handles these OK)
 */
const ENGLISH_PRONUNCIATION: Record<string, string> = {
  // === Performance & Scaling (most common in these docs) ===
  'Throughput':       'thru-pút',
  'throughput':       'thru-pút',
  'Latency':          'lây-tần-xi',
  'latency':          'lây-tần-xi',
  'Benchmark':        'ben-ch-mark',
  'benchmark':        'ben-ch-mark',
  'Benchmarks':       'ben-ch-mark',
  'benchmarks':       'ben-ch-mark',
  'Scalability':      'sờ-kây-lờ-bi-li-ti',
  'scalability':      'sờ-kây-lờ-bi-li-ti',
  'Scaling':          'sờ-kây-linh',
  'scaling':          'sờ-kây-linh',
  'Scale':            'sờ-kây-ồ',
  'scale':            'sờ-kây-ồ',
  'Performance':      'pơ-pho-mần',
  'performance':      'pơ-pho-mần',
  'Availability':     'ờ-vây-lờ-bi-li-ti',
  'availability':     'ờ-vây-lờ-bi-li-ti',
  'Reliability':      'ri-lai-ờ-bi-li-ti',
  'reliability':      'ri-lai-ờ-bi-li-ti',
  'Percentile':       'pơ-xen-tai',
  'percentile':       'pơ-xen-tai',
  'Percentiles':      'pơ-xen-tai',
  'percentiles':      'pơ-xen-tai',
  'Dashboard':        'đa-bọt',
  'dashboard':        'đa-bọt',
  'Dashboards':       'đa-bọt',
  'dashboards':       'đa-bọt',
  'Monitoring':       'mo-ni-to-rinh',
  'monitoring':       'mo-ni-to-rinh',
  'Metrics':          'me-tríc',
  'metrics':          'me-tríc',
  'Metric':           'me-tríc',
  'metric':           'me-tríc',
  'Optimization':     'op-ti-mai-zây-sần',
  'optimization':     'op-ti-mai-zây-sần',
  'Strategies':       'xờ-tra-tờ-gi',
  'strategies':       'xờ-tra-tờ-gi',
  'Stack':            'xờ-tác',
  'stack':            'xờ-tác',
  'Failure':          'phây-liơ',
  'failure':          'phây-liơ',
  'Cascading':        'ca-xờ-kây-đinh',
  'cascading':        'ca-xờ-kây-đinh',
  'Resource':         'ri-xo',
  'resource':         'ri-xo',
  'Resources':        'ri-xo',
  'Utilization':      'iu-ti-lai-zây-sần',
  'utilization':      'iu-ti-lai-zây-sần',
  'Impact':           'im-pắc',
  'impact':           'im-pắc',
  'Assessment':       'ờ-xét-mần',
  'assessment':       'ờ-xét-mần',
  'Decision':         'đi-xi-sần',
  'decision':         'đi-xi-sần',
  'Matrix':           'may-tríc',
  'matrix':           'may-tríc',
  'Formula':          'pho-miu-la',
  'formula':          'pho-miu-la',
  'Planning':         'plan-ninh',
  'planning':         'plan-ninh',
  'Users':            'iu-zơ',
  'users':            'iu-zơ',
  'User':             'iu-zơ',
  'user':             'iu-zơ',
  'Request':          'ri-quest',
  'request':          'ri-quest',
  'Requests':         'ri-quest',
  'requests':         'ri-quest',
  'Response':         'ri-spon',
  'response':         'ri-spon',
  'Signals':          'sig-nồ',
  'signals':          'sig-nồ',
  'Processing':       'prô-xét-xinh',
  'processing':       'prô-xét-xinh',
  'Subscribers':      'sắp-cờ-rai-bơ',
  'subscribers':      'sắp-cờ-rai-bơ',
  'Testing':          'tes-ting',
  'testing':          'tes-ting',
  'Tools':            'tu',
  'tools':            'tu',
  'Method':           'me-thốt',
  'method':           'me-thốt',
  'Service':          'xơ-vít',
  'service':          'xơ-vít',
  'Services':         'xơ-vít',
  'services':         'xơ-vít',
  'Server':           'xơ-vơ',
  'server':           'xơ-vơ',
  'Servers':          'xơ-vơ',
  'Client':           'clai-ần',
  'client':           'clai-ần',
  'Production':       'prô-đắc-sần',
  'production':       'prô-đắc-sần',
  'Roadmap':          'rốt-map',
  'roadmap':          'rốt-map',
  'Quick':            'quích',
  'Peak':             'pích',
  'peak':             'pích',
  // === Database & Storage ===
  'Database':         'đa-ta-bây-s',
  'database':         'đa-ta-bây-s',
  'Cache':            'ca-s',
  'cache':            'ca-s',
  'Caching':          'ca-s-inh',
  'caching':          'ca-s-inh',
  'Query':            'que-ri',
  'query':            'que-ri',
  'Queries':          'que-ri',
  'queries':          'que-ri',
  'Index':            'in-đéc',
  'index':            'in-đéc',
  'Indexing':         'in-đéc-xing',
  'Sharding':         'sa-đinh',
  'sharding':         'sa-đinh',
  'Replication':      'rep-li-kây-sần',
  'replication':      'rep-li-kây-sần',
  'Partitioning':     'pa-tí-sần-ninh',
  'partitioning':     'pa-tí-sần-ninh',
  'Connection Pool':  'cơ-néc-sần pồ',
  'connection pool':  'cơ-néc-sần pồ',

  // === Architecture Patterns ===
  'Microservices':    'mai-cờ-rô-xơ-vít',
  'microservices':    'mai-cờ-rô-xơ-vít',
  'Middleware':       'mi-đồ-we',
  'middleware':       'mi-đồ-we',
  'Pipeline':         'pai-p-lai',
  'pipeline':         'pai-p-lai',
  'Payload':          'pây-lốt',
  'payload':          'pây-lốt',
  'Endpoint':         'en-poin',
  'endpoint':         'en-poin',
  'Endpoints':        'en-poin',
  'Gateway':          'gây-t-way',
  'gateway':          'gây-t-way',
  'Proxy':            'pờ-rốc-xi',
  'proxy':            'pờ-rốc-xi',
  'Container':        'con-tây-nơ',
  'container':        'con-tây-nơ',
  'Containers':       'con-tây-nơ',
  'Cluster':          'cờ-lắc-tơ',
  'cluster':          'cờ-lắc-tơ',
  'Singleton':        'xinh-gồ-tơn',
  'singleton':        'xinh-gồ-tơn',
  'Factory':          'phéc-tơ-ri',
  'factory':          'phéc-tơ-ri',
  'Observer':         'ốp-zơ-vơ',
  'observer':         'ốp-zơ-vơ',
  'Strategy':         'xờ-tra-tờ-gi',
  'strategy':         'xờ-tra-tờ-gi',
  'Pattern':          'pát-tơn',
  'pattern':          'pát-tơn',
  'Patterns':         'pát-tơn',
  'patterns':         'pát-tơn',

  // === Networking ===
  'Load Balancing':   'lốt ba-lần-xinh',
  'load balancing':   'lốt ba-lần-xinh',
  'Load Balancer':    'lốt ba-lần-xơ',
  'load balancer':    'lốt ba-lần-xơ',
  'Rate Limiting':    'rây li-mít-ting',
  'rate limiting':    'rây li-mít-ting',
  'Circuit Breaker':  'xơ-kịt brây-kơ',
  'circuit breaker':  'xơ-kịt brây-kơ',
  'Timeout':          'tai-m-ao',
  'timeout':          'tai-m-ao',
  'Retry':            'ri-trai',
  'retry':            'ri-trai',
  'Failover':         'phây-ồ-vơ',
  'failover':         'phây-ồ-vơ',
  'Fallback':         'pho-bác',
  'fallback':         'pho-bác',
  'Heartbeat':        'hát-bít',
  'heartbeat':        'hát-bít',
  'Handshake':        'hen-sây-kờ',
  'handshake':        'hen-sây-kờ',
  'Webhook':          'web-húc',
  'webhook':          'web-húc',

  // === DevOps & Tools ===
  'Deployment':       'đi-ploi-mần',
  'deployment':       'đi-ploi-mần',
  'Container':        'con-tây-nơ',
  'Kubernetes':       'cu-bơ-nét-tít',
  'Prometheus':       'prô-mi-thi-ớt',
  'Grafana':          'gra-pha-na',
  'OpenTelemetry':    'ô-pần tê-le-me-tri',
  'Terraform':        'te-ra-phom',
  'Jenkins':          'jen-kin',

  // === Message Queue & Async ===
  'Message Queue':    'me-xịt queue',
  'message queue':    'me-xịt queue',
  'Event-Driven':     'i-ven đri-vần',
  'event-driven':     'i-ven đri-vần',
  'Publisher':        'pắp-lít-sơ',
  'Subscriber':       'sắp-cờ-rai-bơ',
  'Consumer':         'cơn-xiu-mơ',
  'consumer':         'cơn-xiu-mơ',
  'Producer':         'prô-điu-xơ',
  'producer':         'prô-điu-xơ',
  'Broker':           'brô-cơ',
  'broker':           'brô-cơ',
  'Backpressure':     'bác-pre-sơ',
  'backpressure':     'bác-pre-sơ',

  // === Testing ===
  'Load Testing':     'lốt tes-ting',
  'Stress Testing':   'xờ-tres tes-ting',
  'Unit Test':        'iu-nít tes',
  'Integration':      'in-tờ-grây-sần',
  'integration':      'in-tờ-grây-sần',

  // === General Tech ===
  'Framework':        'phờ-rây-m-work',
  'framework':        'phờ-rây-m-work',
  'Library':          'lai-brờ-ri',
  'library':          'lai-brờ-ri',
  'Component':        'com-pô-nần',
  'component':        'com-pô-nần',
  'Components':       'com-pô-nần',
  'Module':           'mo-điu',
  'module':           'mo-điu',
  'Plugin':           'plắc-gin',
  'plugin':           'plắc-gin',
  'Workflow':         'work-phờ-lô',
  'workflow':         'work-phờ-lô',
  'Thread':           'thrét',
  'thread':           'thrét',
  'Threads':          'thrét',
  'Concurrency':      'con-cơ-rần-xi',
  'concurrency':      'con-cơ-rần-xi',
  'Concurrent':       'con-cơ-rần',
  'concurrent':       'con-cơ-rần',
  'Asynchronous':     'ây-xinh-cờ-rồ-nát',
  'asynchronous':     'ây-xinh-cờ-rồ-nát',
  'Synchronous':      'xinh-cờ-rồ-nát',
  'synchronous':      'xinh-cờ-rồ-nát',
  'Bottleneck':       'bo-tồ-néc',
  'bottleneck':       'bo-tồ-néc',
  'Overhead':         'ô-vơ-hét',
  'overhead':         'ô-vơ-hét',
  'Capacity':         'ca-pa-xi-ti',
  'capacity':         'ca-pa-xi-ti',
  'Bandwidth':        'ben-with',
  'bandwidth':        'ben-with',

  // === Case Study Companies & Products ===
  'Netflix':          'nét-phờ-lích',
  'Discord':          'đít-co',
  'Shopify':          'sa-pi-phai',
  'WhatsApp':         'oát-xáp',
  'Google':           'gu-gồ',
  'Amazon':           'a-ma-zơn',
  'Facebook':         'phây-búc',
  'Instagram':        'in-xờ-ta-gram',
  'Twitter':          'twi-tơ',
  'Redis':            're-đít',
  'Kafka':            'káp-ka',
  'Nginx':            'en-gin-ét',
  'MySQL':            'mai-ét-queue-eo',
  'PostgreSQL':       'pót-gờ-rết-queue-eo',
  'MongoDB':          'mông-gô đê-bê',
  'Elasticsearch':    'ê-lát-tíc xơ-ch',
  'RabbitMQ':         'rab-bít em-queue',

  // === Common descriptors & adjectives ===
  'Golden':           'gô-đần',
  'golden':           'gô-đần',
  'Average':          'a-vờ-rịt',
  'average':          'a-vờ-rịt',
  'Error':            'e-rơ',
  'error':            'e-rơ',
  'Errors':           'e-rơ',
  'Generic':          'giê-ne-ríc',
  'generic':          'giê-ne-ríc',
  'Disk':             'đít',
  'disk':             'đít',
  'Pool':             'pồ',
  'pool':             'pồ',
  'Flow':             'phờ-lô',
  'flow':             'phờ-lô',
  'Setup':            'xét-ắp',
  'setup':            'xét-ắp',
  'Summary':          'xăm-mờ-ri',
  'summary':          'xăm-mờ-ri',
  'Overview':         'ô-vơ-viu',
  'overview':         'ô-vơ-viu',
  'Design':           'đi-zai',
  'design':           'đi-zai',
  'System':           'xít-tầm',
  'system':           'xít-tầm',
  'Feature':          'phi-chơ',
  'feature':          'phi-chơ',
  'Features':         'phi-chơ',
  'Config':           'con-phích',
  'config':           'con-phích',
  'Configuration':    'con-phi-giu-rây-sần',
  'configuration':    'con-phi-giu-rây-sần',
  'Default':          'đi-phol',
  'default':          'đi-phol',
  'Runtime':          'rần-tai-m',
  'runtime':          'rần-tai-m',
  'Upstream':         'ắp-xờ-trim',
  'upstream':         'ắp-xờ-trim',
  'Downstream':       'đao-xờ-trim',
  'downstream':       'đao-xờ-trim',
  // === Specific patterns from this doc ===
  'Write-Through':    'rai thru',
  'write-through':    'rai thru',
  'Write-Behind':     'rai bi-hai',
  'write-behind':     'rai bi-hai',
  'Write-Back':       'rai bác',
  'Cache-Aside':      'ca-s ờ-xai',
  'cache-aside':      'ca-s ờ-xai',
  'Read Replica':     'rết rep-li-ca',
  'read replica':     'rết rep-li-ca',
  'Stampede':         'sờ-tem-pịt',
  'stampede':         'sờ-tem-pịt',
  'Token Bucket':     'tô-cần bắc-kịt',
  'token bucket':     'tô-cần bắc-kịt',
  'Leaky Bucket':     'li-ki bắc-kịt',
  'leaky bucket':     'li-ki bắc-kịt',
  'Round Robin':      'rao-rô-bin',
  'round robin':      'rao-rô-bin',
  'Consistent Hashing': 'con-xít-tần hát-sinh',
  'Checklist':        'chéc-lít',
  'checklist':        'chéc-lít',
  'Subscribers':      'sắp-cờ-rai-bơ',
  'subscribers':      'sắp-cờ-rai-bơ',
  'Engineering':      'en-gi-nia-ring',
  'engineering':      'en-gi-nia-ring',
  'Engineer':         'en-gi-nia',
  'engineer':         'en-gi-nia',
  'Reference':        're-phờ-rần',
  'reference':        're-phờ-rần',

  // === Additional common terms ===
  'Guide':            'gai',
  'guide':            'gai',
  'Search':           'xơ-ch',
  'search':           'xơ-ch',
  'Banking':          'ben-kinh',
  'banking':          'ben-kinh',
  'Realtime':         'ri-ồ-tai-m',
  'realtime':         'ri-ồ-tai-m',
  'Real-time':        'ri-ồ-tai-m',
  'real-time':        'ri-ồ-tai-m',
  'Commerce':         'com-mơ',
  'commerce':         'com-mơ',
  'E-Commerce':       'i-com-mơ',
  'e-commerce':       'i-com-mơ',
  'Four':             'pho',
  'four':             'pho',
  'Type':             'tai-p',
  'type':             'tai-p',
  'Read':             'rết',
  'read':             'rết',
  'Write':            'rai',
  'write':            'rai',
  'Key':              'ki',
  'key':              'ki',
  'Case':             'kây-s',
  'case':             'kây-s',
  'Cases':            'kây-s',
  'Studies':          'xờ-tăn-đi',
  'studies':          'xờ-tăn-đi',
  'Study':            'xờ-tăn-đi',
  'study':            'xờ-tăn-đi',
  'Applications':     'áp-li-kây-sần',
  'applications':     'áp-li-kây-sần',
  'Application':      'áp-li-kây-sần',
  'application':      'áp-li-kây-sần',
  'Transactions':     'tran-zéc-sần',
  'transactions':     'tran-zéc-sần',
  'Transaction':      'tran-zéc-sần',
  'transaction':      'tran-zéc-sần',
  'Operations':       'o-pờ-rây-sần',
  'operations':       'o-pờ-rây-sần',
  'Operation':        'o-pờ-rây-sần',
  'operation':        'o-pờ-rây-sần',
  'Messages':         'me-xịt',
  'messages':         'me-xịt',
  'Message':          'me-xịt',
  'message':          'me-xịt',
  'Algorithm':        'an-gô-rít-thầm',
  'algorithm':        'an-gô-rít-thầm',
  'Algorithms':       'an-gô-rít-thầm',
  'Data':             'đây-ta',
  'data':             'đây-ta',
  'Instance':         'in-xờ-tần',
  'instance':         'in-xờ-tần',
  'Instances':        'in-xờ-tần',
  'Node':             'nốt',
  'node':             'nốt',
  'Nodes':            'nốt',
  'Table':            'tây-bồ',
  'table':            'tây-bồ',
  'Tables':           'tây-bồ',
  'Layer':            'lây-ơ',
  'layer':            'lây-ơ',
  'Layers':           'lây-ơ',
  'Network':          'nét-work',
  'network':          'nét-work',
  'Proxy':            'pờ-rốc-xi',
  'proxy':            'pờ-rốc-xi',
  'Backup':           'bác-ắp',
  'backup':           'bác-ắp',
  'Recovery':         'ri-cắp-vờ-ri',
  'recovery':         'ri-cắp-vờ-ri',
  'Logging':          'lo-ginh',
  'logging':          'lo-ginh',
  'Debug':            'đi-bắc',
  'debug':            'đi-bắc',
};

/**
 * Process mixed Vietnamese/English text for optimal TTS reading.
 * 
 * Pipeline:
 * 1. Replace known English terms with Vietnamese phonetic guides
 * 2. Add commas around remaining English phrases for natural pauses
 * 3. Clean up edge cases (double spaces, trailing commas)
 */
export function handleBilingualText(text: string): string {
  let result = text;

  // Step 1: Replace known multi-word English phrases first (longest first)
  const multiWordEntries = Object.entries(ENGLISH_PRONUNCIATION)
    .filter(([key]) => key.includes(' ') || key.includes('-'))
    .sort(([a], [b]) => b.length - a.length);

  for (const [eng, vn] of multiWordEntries) {
    const escaped = eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<=\\s|^|[("\\[,;:])${escaped}(?=\\s|$|[)".,\\];:!?])`, 'g');
    result = result.replace(regex, vn);
  }

  // Step 2: Replace known single-word English terms
  const singleWordEntries = Object.entries(ENGLISH_PRONUNCIATION)
    .filter(([key]) => !key.includes(' ') && !key.includes('-'))
    .sort(([a], [b]) => b.length - a.length);

  for (const [eng, vn] of singleWordEntries) {
    const escaped = eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match whole word only, case-sensitive
    const regex = new RegExp(`(?<=\\s|^|[("\\[,;:])${escaped}(?=\\s|$|[)".,\\];:!?])`, 'g');
    result = result.replace(regex, vn);
  }

  // Step 3: Detect remaining English phrases (2+ consecutive English words)
  // and add slight pauses around them for cleaner bilingual transition
  result = result.replace(
    /(?<=[\s,.]|^)([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*){1,5})(?=[\s,.]|$)/g,
    (match) => {
      // Skip if it's a Vietnamese word that starts with uppercase
      if (isVietnameseWord(match)) return match;
      // Add commas for pause before/after English phrase
      return `, ${match},`;
    }
  );

  // Step 4: Clean up double commas and extra spaces
  result = result
    .replace(/,\s*,/g, ',')
    .replace(/\.\s*,/g, '.')
    .replace(/,\s*\./g, '.')
    .replace(/^\s*,\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

  return result;
}

/**
 * Check if a word is likely Vietnamese (has diacritics or is a common Vietnamese word).
 */
function isVietnameseWord(word: string): boolean {
  // Vietnamese diacritics
  const viDiacritics = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i;
  if (viDiacritics.test(word)) return true;

  // Common Vietnamese words that start with uppercase (in titles)
  const commonVi = /^(Các|Của|Cho|Với|Trong|Theo|Từ|Đến|Và|Hoặc|Nhưng|Không|Có|Là|Một|Hai|Ba|Bốn|Năm|Sáu|Bảy|Tám|Chín|Mười|Tại|Về|Trên|Dưới|Ngoài|Giữa|Sau|Trước|Bên|Đã|Đang|Sẽ|Được|Bị|Nên|Cần|Phải|Mỗi|Mọi|Nào|Nếu|Khi|Vì|Do|Tổng|Quan|Các|Mốc|Số|Lượng|Bảng|Chiến|Lược|Công|Cụ|Đo|Đánh|Giá|Tối|Ưu|Hệ|Thống|Phụ|Lục|Tài|Liệu|Nghiên|Cứu|Toàn|Diện|Hiệu|Năng|Chỉ)$/;
  return commonVi.test(word.split(/\s+/)[0]);
}

/**
 * Get pronunciation guide stats for debugging.
 */
export function getBilingualStats(): { totalTerms: number; categories: string[] } {
  return {
    totalTerms: Object.keys(ENGLISH_PRONUNCIATION).length,
    categories: [
      'Performance & Scaling',
      'Database & Storage', 
      'Architecture Patterns',
      'Networking',
      'DevOps & Tools',
      'Message Queue & Async',
      'Testing',
      'General Tech',
      'Case Study Companies',
      'Specific Patterns',
    ],
  };
}

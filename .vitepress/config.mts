import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    base: '/research_docs/',
    title: 'Research Docs',
    description: 'Tài liệu nghiên cứu kỹ thuật chuyên sâu về kiến trúc hệ thống, design patterns, nguyên lý phần mềm và công nghệ tiên tiến',
    lastUpdated: true,
    cleanUrls: true,
    ignoreDeadLinks: true,

    rewrites: {
      'guides/README.md': 'guides/index.md',
      'papers/README.md': 'papers/index.md',
      'design-patterns/README.md': 'design-patterns/index.md',
      'oop-principles/README.md': 'oop-principles/index.md',
      'solid-principles/README.md': 'solid-principles/index.md',
      'solar-energy/README.md': 'solar-energy/index.md'
    },

    head: [
      ['link', { rel: 'icon', type: 'image/svg+xml', href: '/research_docs/logo.svg' }],
      // CSS reset for mermaid text measurement — prevents .vp-doc styles from
      // cascading into mermaid's foreignObject elements and breaking getBoundingClientRect()
      ['style', {}, `
        .vp-doc .mermaid { font-size: 16px !important; letter-spacing: normal !important; line-height: normal !important; }
        .vp-doc .mermaid svg { max-width: 100% !important; height: auto !important; }
        .vp-doc .mermaid p, .vp-doc .mermaid span, .vp-doc .mermaid div,
        .vp-doc .mermaid foreignObject p, .vp-doc .mermaid foreignObject span,
        .vp-doc .mermaid foreignObject div,
        [id^="d"] p, [id^="d"] span, [id^="d"] div {
          margin: 0 !important; padding: 0 !important;
          line-height: normal !important; letter-spacing: normal !important;
        }
      `]
    ],

    vite: {
      build: {
        commonjsOptions: {
          include: [/node_modules/]
        }
      },
      ssr: {
        noExternal: ['mermaid']
      }
    },

    mermaid: {
      // Mermaid configuration
    },

    markdown: {
      math: true
    },

    themeConfig: {
      siteTitle: '⚡ Research Docs',
      logo: {
        light: '/logo.svg',
        dark: '/logo.svg'
      },

      nav: [
        { text: 'Trang Chủ', link: '/' },
        { text: '🗺️ Bản Đồ Tri Thức', link: '/#ban-do-tri-thuc' },
        {
          text: 'Guides & Scaling',
          items: [
            { text: '🧭 Tất Cả Guides (Hub)', link: '/guides/' },
            { text: '🚀 System Scaling & Performance', link: '/guides/system-scaling-performance-guide' },
            { text: '🦀 Rust Zero to Hero Guide', link: '/guides/rust_zero_to_hero_guide' },
            { text: '⚡ Realtime & WebRTC Deep Dive', link: '/guides/realtime/webrtc_deep_dive' },
            { text: '🤖 AI Agent Frameworks', link: '/guides/ai-research/ai_agent_frameworks_deep_dive' },
            { text: '📚 RAG Database Guide', link: '/guides/rag_database_guide' }
          ]
        },
        {
          text: 'Patterns & OOP',
          items: [
            { text: '🧩 23 Design Patterns', link: '/design-patterns/' },
            { text: '📐 SOLID Principles', link: '/solid-principles/' },
            { text: '🧱 OOP Principles', link: '/oop-principles/' }
          ]
        },
        {
          text: 'Distributed Systems & Papers',
          items: [
            { text: '🏛️ Tất Cả Papers (Hub)', link: '/papers/' },
            { text: '🌐 Microservices 1M TPS Multi-Domain', link: '/papers/ARCHITECTURE_microservice_1M_TPS_multi_domain' },
            { text: '☁️ Spring Cloud, K8s, Istio & Temporal', link: '/papers/ANALYSIS_spring_cloud_k8s_istio_temporal_ecosystem' },
            { text: '🦁 ZooKeeper Ecosystem 1B TPS', link: '/papers/ANALYSIS_zookeeper_spring_ecosystem_1B_TPS' },
            { text: '📬 Apache Kafka Zero to Advanced', link: '/papers/RESEARCH_kafka_zero_to_advanced' },
            { text: '📊 Fake Account Detection SOTA', link: '/papers/SYNTHESIS_fake_account_detection_sota' }
          ]
        },
        { text: '☀️ Năng Lượng Mặt Trời', link: '/solar-energy/' },
        { text: '🎯 Research Skills', link: '/research_skills_sota' }
      ],

      outline: {
        level: [2, 3],
        label: 'Mục lục trên trang'
      },

      sidebar: [
        {
          text: '🗺️ Tổng Quan & Bản Đồ Tri Thức',
          collapsed: false,
          items: [
            { text: '🏠 Trang Chủ', link: '/' },
            { text: '🧭 Engineering Guides Hub', link: '/guides/' },
            { text: '🏛️ Distributed Systems & Papers Hub', link: '/papers/' }
          ]
        },
        {
          text: '🚀 System Engineering & Scaling',
          collapsed: false,
          items: [
            { text: '🚀 System Scaling & Performance', link: '/guides/system-scaling-performance-guide' },
            { text: '🦀 Rust Zero to Hero Guide', link: '/guides/rust_zero_to_hero_guide' }
          ]
        },
        {
          text: '🏛️ Kiến Trúc Phân Tán & High TPS',
          collapsed: true,
          items: [
            { text: '🏛️ Microservices 1M TPS Multi-Domain', link: '/papers/ARCHITECTURE_microservice_1M_TPS_multi_domain' },
            { text: '☁️ Spring Cloud K8s Istio & Temporal', link: '/papers/ANALYSIS_spring_cloud_k8s_istio_temporal_ecosystem' },
            { text: '🦁 ZooKeeper Ecosystem 1B TPS', link: '/papers/ANALYSIS_zookeeper_spring_ecosystem_1B_TPS' },
            { text: '📬 Apache Kafka Zero to Advanced', link: '/papers/RESEARCH_kafka_zero_to_advanced' },
            { text: '🔬 Nghiên Cứu Apache ZooKeeper', link: '/papers/RESEARCH_apache_zookeeper' },
            { text: '📘 Hướng Dẫn ZooKeeper + Spring Boot', link: '/papers/GUIDE_zookeeper_spring_boot' },
            { text: '🌐 Alibaba Nacos Deep Dive', link: '/papers/RESEARCH_nacos_deep_dive' },
            { text: '⏳ Temporal Saga vs Spring Ecosystem', link: '/papers/RESEARCH_temporal_saga_vs_spring_ecosystem' }
          ]
        },
        {
          text: '⚡ Realtime Architecture & WebRTC',
          collapsed: true,
          items: [
            { text: '⚡ WebRTC Deep Dive', link: '/guides/realtime/webrtc_deep_dive' },
            { text: '🌐 SDP, ICE, STUN & TURN', link: '/guides/realtime/sdp_ice_stun_turn_architectures' },
            { text: '🔄 OT vs CRDT Deep Dive', link: '/guides/realtime/ot_crdt_deep_dive' },
            { text: '📊 Realtime RAG Database Guide', link: '/guides/realtime/rag_database_guide' }
          ]
        },
        {
          text: '🤖 AI Research, RAG & Vector Systems',
          collapsed: true,
          items: [
            { text: '🤖 AI Agent Frameworks Deep Dive', link: '/guides/ai-research/ai_agent_frameworks_deep_dive' },
            { text: '📚 RAG Database Guide', link: '/guides/rag_database_guide' },
            { text: '🛠️ RAG DB Implementation Guide', link: '/guides/rag_database_implementation_guide' },
            { text: '📈 RAG & KAG Evaluation Guide', link: '/guides/rag_kag_evaluation_guide' },
            { text: '🕸️ Social Graph Neo4j GDS Deep Dive', link: '/guides/ai-research/social_graph_neo4j_gds_deep_dive' },
            { text: '👤 Face Analysis Deep Dive', link: '/guides/ai-research/face_analysis_deep_dive' },
            { text: '🔗 Ecosystem Integration Analysis', link: '/guides/ai-research/ecosystem_integration_profile_analysis' },
            { text: '👥 Facebook Friends Analysis Workflow', link: '/guides/facebook_friends_analysis_workflow' },
            { text: '🕵️ Fake Account Detection Literature', link: '/guides/sota_literature_review_fake_account_detection' }
          ]
        },
        {
          text: '📜 Nghiên Cứu Học Thuật & Bot Detection',
          collapsed: true,
          items: [
            { text: '📊 Fake Account Detection SOTA Synthesis', link: '/papers/SYNTHESIS_fake_account_detection_sota' },
            { text: '🤖 Twibot-22 Benchmark', link: '/papers/02_twibot22_benchmark' },
            { text: '🛡️ SybilGAT (2024)', link: '/papers/03_sybilgat_2024' },
            { text: '🔍 Graph Clustering Survey', link: '/papers/04_graph_clustering_survey' },
            { text: '📸 Instagram Fake Detection', link: '/papers/05_instagram_fake_detection' },
            { text: '🎯 Cluster-Aware Anomaly Detection', link: '/papers/06_cluster_aware_anomaly' },
            { text: '📈 GNN Comprehensive Survey', link: '/papers/07_gnn_comprehensive_survey' },
            { text: '💬 LLM Social Bot (2025)', link: '/papers/08_llm_social_bot_2025' }
          ]
        },
        {
          text: '🧩 23 Design Patterns (GoF)',
          collapsed: true,
          items: [
            { text: '📖 Giới Thiệu Chung', link: '/design-patterns/' },
            { text: '1. Creational Patterns (Khởi Tạo)', link: '/design-patterns/01-creational-patterns' },
            { text: '2. Structural Patterns (Cấu Trúc)', link: '/design-patterns/02-structural-patterns' },
            { text: '3a. Behavioral Patterns Part 1 (Hành Vi)', link: '/design-patterns/03a-behavioral-patterns-part1' },
            { text: '3b. Behavioral Patterns Part 2 (Hành Vi)', link: '/design-patterns/03b-behavioral-patterns-part2' },
            { text: '4. So Sánh Các Pattern', link: '/design-patterns/04-pattern-comparison' },
            { text: '5. Phối Hợp Các Pattern (Combinations)', link: '/design-patterns/05-pattern-combinations' }
          ]
        },
        {
          text: '📐 SOLID Principles',
          collapsed: true,
          items: [
            { text: '📖 Giới Thiệu SOLID', link: '/solid-principles/' },
            { text: '1. Single Responsibility (SRP)', link: '/solid-principles/01-single-responsibility' },
            { text: '2. Open/Closed Principle (OCP)', link: '/solid-principles/02-open-closed' },
            { text: '3. Liskov Substitution (LSP)', link: '/solid-principles/03-liskov-substitution' },
            { text: '4. Interface Segregation (ISP)', link: '/solid-principles/04-interface-segregation' },
            { text: '5. Dependency Inversion (DIP)', link: '/solid-principles/05-dependency-inversion' },
            { text: '6. Tổng Hợp & Thực Hành', link: '/solid-principles/06-synthesis-and-practice' }
          ]
        },
        {
          text: '🧱 OOP Principles',
          collapsed: true,
          items: [
            { text: '📖 Giới Thiệu OOP', link: '/oop-principles/' },
            { text: '1. Bốn Trụ Cột OOP', link: '/oop-principles/01-four-pillars-of-oop' },
            { text: '2. Quan Hệ Giữa Các Đối Tượng', link: '/oop-principles/02-object-relationships' },
            { text: '3. Nguyên Lý Thiết Kế OOP', link: '/oop-principles/03-design-principles' },
            { text: '4. Áp Dụng Trong Thực Tế', link: '/oop-principles/04-oop-in-practice' }
          ]
        },
        {
          text: '☀️ Hệ Thống Năng Lượng Mặt Trời',
          collapsed: true,
          items: [
            { text: '☀️ Giới Thiệu Dự Án', link: '/solar-energy/' },
            { text: '📊 Toàn Cảnh Nghiên Cứu', link: '/solar-energy/solar-energy-system-research' },
            { text: '1. Phân Tích Nhu Cầu Phụ Tải', link: '/solar-energy/01-phan-tich-nhu-cau' },
            { text: '2. Thiết Kế Cấu Hình Hệ Thống', link: '/solar-energy/02-thiet-ke-he-thong' },
            { text: '3. So Sánh Thiết Bị & Công Nghệ', link: '/solar-energy/03-so-sanh-thiet-bi' },
            { text: '4. Phân Tích Tài Chính & Hoàn Vốn', link: '/solar-energy/04-tinh-toan-hoan-von' },
            { text: '5. Quy Định Pháp Lý & Tiêu Chuẩn', link: '/solar-energy/05-quy-dinh-phap-ly' },
            { text: '6. Kế Hoạch Vận Hành & Bảo Trì', link: '/solar-energy/06-lo-trinh-van-hanh' },
            { text: '7. Tổng Kết & Khuyến Nghị', link: '/solar-energy/07-tong-ket' },
            { text: '8. Phân Tích Anker SOLIX X1', link: '/solar-energy/08-anker-solix' }
          ]
        },
        {
          text: '🎯 SOTA Skills & Tools',
          collapsed: true,
          items: [
            { text: '🎯 Research Skills SOTA', link: '/research_skills_sota' }
          ]
        }
      ],

      search: {
        provider: 'local',
        options: {
          locales: {
            root: {
              translations: {
                button: {
                  buttonText: 'Tìm kiếm',
                  buttonAriaLabel: 'Tìm kiếm tài liệu'
                },
                modal: {
                  noResultsText: 'Không tìm thấy kết quả cho',
                  resetButtonTitle: 'Xóa tìm kiếm',
                  footer: {
                    selectText: 'chọn',
                    navigateText: 'di chuyển',
                    closeText: 'đóng'
                  }
                }
              }
            }
          }
        }
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/nguyentthai96/research_docs' }
      ],

      footer: {
        message: 'Released under the MIT License.',
        copyright: 'Copyright © 2026 Nguyen Thanh Thai'
      },

      docFooter: {
        prev: 'Trang trước',
        next: 'Trang tiếp theo'
      },

      lastUpdated: {
        text: 'Cập nhật lần cuối'
      }
    }
  })
)

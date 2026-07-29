# 🔗 AI Ecosystem Integration & Social Profile Analysis Architecture

> **Phân tích chi tiết: Cách phối hợp hệ sinh thái + Antigravity positioning + Kiến trúc hệ thống phân tích profile**
> Cập nhật: Tháng 7/2026

---

## Mục Lục

1. [Cách Phối Hợp Các Hệ Sinh Thái — Chi Tiết](#1-cách-phối-hợp-các-hệ-sinh-thái--chi-tiết)
2. [Antigravity Thuộc Hệ Sinh Thái Nào?](#2-antigravity-thuộc-hệ-sinh-thái-nào)
3. [Kiến Trúc Hệ Thống Profile Analysis](#3-kiến-trúc-hệ-thống-profile-analysis)
4. [Tối Ưu Hệ Sinh Thái Cho Use Case](#4-tối-ưu-hệ-sinh-thái-cho-use-case)
5. [Implementation Roadmap](#5-implementation-roadmap)

---

## 1. Cách Phối Hợp Các Hệ Sinh Thái — Chi Tiết

### 1.1 Mô Hình 3 Tầng (Three-Layer Architecture)

Trong production 2026, các framework KHÔNG hoạt động riêng lẻ. Chúng ghép nối thành **3 tầng chức năng rõ ràng** + 1 tầng protocol:

```
┌──────────────────────────────────────────────────────────────────┐
│                     PRODUCTION STACK 2026                        │
│                                                                  │
│  TẦNG 4: PROTOCOL LAYER ─────────────────────────────────────── │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    MCP (Model Context Protocol)           │  │
│  │  "USB-C của AI tools" — chuẩn kết nối universal          │  │
│  │  Agent ↔ Database, Agent ↔ Browser, Agent ↔ API          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↕                                   │
│  TẦNG 3: EXECUTION LAYER ──────────────────────────────────────  │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │     CrewAI        │  │   Custom Agents  │                     │
│  │  Role-based teams │  │   (specialized)  │                     │
│  └────────┬─────────┘  └────────┬─────────┘                     │
│           └─────────┬───────────┘                                │
│                     ↕                                            │
│  TẦNG 2: CONTROL PLANE (ORCHESTRATION) ────────────────────────  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    LangGraph                               │  │
│  │  State management, routing, HITL, loops, checkpointing    │  │
│  │  "Bộ não" — quyết định AI làm gì, khi nào, thế nào      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↕                                   │
│  TẦNG 1: DATA PLANE (RETRIEVAL) ───────────────────────────────  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    LlamaIndex                              │  │
│  │  Ingestion, indexing, retrieval, parsing (LlamaParse)     │  │
│  │  "Bộ nhớ" — quản lý toàn bộ dữ liệu & knowledge         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↕                                   │
│  NỀN TẢNG: TOOLKIT LAYER ─────────────────────────────────────  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    LangChain                               │  │
│  │  LLM wrappers, prompt templates, output parsers, tools    │  │
│  │  "SDK" — building blocks cho tất cả tầng trên             │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Chi Tiết 6 Mô Hình Phối Hợp

#### 🔗 Pattern 1: LlamaIndex-as-Tool trong LangGraph

**Mô tả:** LlamaIndex query engine được wrap thành tool cho LangGraph agent. Agent quyết định KHI NÀO cần search.

```python
# ===================================================
# PATTERN 1: LlamaIndex retriever → LangGraph tool
# ===================================================
from langchain_core.tools import tool
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

# --- LLAMAINDEX: Build index ---
documents = SimpleDirectoryReader("knowledge_base").load_data()
index = VectorStoreIndex.from_documents(documents)
query_engine = index.as_query_engine(similarity_top_k=5)

# --- WRAP thành LangGraph tool ---
@tool
def search_knowledge_base(query: str) -> str:
    """Tìm kiếm trong cơ sở tri thức nội bộ"""
    response = query_engine.query(query)
    return str(response)

# --- LANGGRAPH: Agent sử dụng tool ---
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI

agent = create_react_agent(
    ChatOpenAI(model="gpt-4o"),
    tools=[search_knowledge_base],  # LlamaIndex-powered tool
)

# Agent tự quyết định: nên search hay trả lời trực tiếp?
result = agent.invoke({"messages": [("user", "Phân tích xu hướng AI 2026")]})
```

**Khi nào dùng:** Khi agent cần *quyết định* có nên search hay không, không phải lúc nào cũng cần retrieval.

---

#### 🔗 Pattern 2: LangGraph Pipeline + LlamaIndex Stages

**Mô tả:** Mỗi node trong graph đảm nhận 1 giai đoạn RAG, dùng LlamaIndex cho retrieval node.

```python
# ===================================================
# PATTERN 2: LangGraph orchestration + LlamaIndex nodes
# ===================================================
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated
import operator

class RAGState(TypedDict):
    query: str
    context: Annotated[list, operator.add]
    evaluation: str
    response: str
    retry_count: int

# Node 1: LlamaIndex retrieval
def retrieve_node(state: RAGState):
    results = llamaindex_retriever.retrieve(state["query"])
    return {"context": [r.text for r in results]}

# Node 2: Evaluate quality (LLM judge)
def evaluate_node(state: RAGState):
    llm = ChatOpenAI(model="gpt-4o-mini")  # Model rẻ cho evaluation
    eval_result = llm.invoke(
        f"Context có đủ để trả lời '{state['query']}' không? YES/NO"
    )
    return {"evaluation": eval_result.content}

# Node 3: Generate response
def generate_node(state: RAGState):
    llm = ChatOpenAI(model="gpt-4o")
    response = llm.invoke(
        f"Dựa trên context: {state['context']}\n\nTrả lời: {state['query']}"
    )
    return {"response": response.content}

# Conditional: retry nếu context không đủ
def should_retry(state: RAGState):
    if "NO" in state["evaluation"] and state["retry_count"] < 3:
        return "retrieve"  # Loop lại
    return "generate"      # Đủ rồi → generate

# Build graph
graph = StateGraph(RAGState)
graph.add_node("retrieve", retrieve_node)
graph.add_node("evaluate", evaluate_node)
graph.add_node("generate", generate_node)

graph.add_edge(START, "retrieve")
graph.add_edge("retrieve", "evaluate")
graph.add_conditional_edges("evaluate", should_retry)
graph.add_edge("generate", END)

app = graph.compile()
```

**Khi nào dùng:** RAG phức tạp cần retry/evaluate, mỗi bước có logic điều kiện riêng.

---

#### 🔗 Pattern 3: CrewAI Crew trong LangGraph Node

**Mô tả:** LangGraph quản lý flow tổng thể, CrewAI xử lý các task cần multi-agent collaboration.

```python
# ===================================================
# PATTERN 3: CrewAI Crew as LangGraph node
# ===================================================

def crewai_analysis_node(state):
    """LangGraph node gọi CrewAI Crew"""
    from crewai import Agent, Task, Crew, Process

    # CrewAI cho analysis task (cần nhiều agent)
    researcher = Agent(role="Researcher", goal="Phân tích data", backstory="...")
    critic = Agent(role="Critic", goal="Review phân tích", backstory="...")

    task1 = Task(description=f"Analyze: {state['data']}", agent=researcher,
                 expected_output="Analysis report")
    task2 = Task(description="Review analysis quality", agent=critic,
                 expected_output="Review report", context=[task1])

    crew = Crew(agents=[researcher, critic], tasks=[task1, task2],
                process=Process.sequential)

    result = crew.kickoff()
    return {"analysis": str(result)}

# Trong LangGraph:
workflow = StateGraph(AppState)
workflow.add_node("collect_data", data_collection_node)      # LlamaIndex
workflow.add_node("analyze", crewai_analysis_node)           # CrewAI
workflow.add_node("approve", human_approval_node)            # HITL
workflow.add_node("publish", publish_node)

workflow.add_edge(START, "collect_data")
workflow.add_edge("collect_data", "analyze")
workflow.add_edge("analyze", "approve")
# ... conditional edges for approve/reject
```

**Khi nào dùng:** Task phức tạp cần "team discussion" (research → critique → revise), trong khi overall flow cần state management chặt.

---

#### 🔗 Pattern 4: MCP Protocol — Universal Tool Layer

**Mô tả:** MCP làm cầu nối tiêu chuẩn giữa agent và tools/data sources. Thay vì viết wrapper riêng cho từng integration.

```python
# ===================================================
# PATTERN 4: MCP tools trong LangGraph
# ===================================================
from langchain_mcp_adapters import load_mcp_tools

# Load tools từ MCP servers (database, browser, file system...)
mcp_tools = load_mcp_tools([
    "postgresql://localhost:5432",     # Database MCP server
    "http://localhost:3000/playwright", # Browser automation
    "http://localhost:3001/filesystem", # File system access
])

# Dùng như native tools trong LangGraph agent
agent = create_react_agent(
    ChatOpenAI(model="gpt-4o"),
    tools=mcp_tools  # MCP-powered tools
)
```

**Khi nào dùng:** Khi cần kết nối agent với nhiều external systems mà không muốn viết glue code cho từng cái.

---

#### 🔗 Pattern 5: LlamaIndex Workflows + LangGraph (Parallel)

**Mô tả:** Dùng LlamaIndex Workflows cho data-heavy tasks, LangGraph cho agent logic. Chạy song song, merge results.

```
Request → LangGraph Router
              ├── [Data Query] → LlamaIndex Workflow (retrieval + rerank)
              ├── [Tool Call]  → LangGraph Tool Node (search, calc)
              └── [Analysis]   → CrewAI Crew (multi-agent analysis)
              ↓
         LangGraph Merge Node → Final Response
```

---

#### 🔗 Pattern 6: Full Hybrid — Tất Cả Cùng Phối Hợp

```
┌──────────────────────────────────────────────────────────────┐
│                   FULL HYBRID PATTERN                        │
│                                                              │
│  User Request                                                │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────── LangGraph ──────────────────┐             │
│  │                                             │             │
│  │  ┌─────────┐                                │             │
│  │  │ Router  │─── "Cần search data?" ──────┐  │             │
│  │  │ Node    │                              │  │             │
│  │  └─────────┘                              │  │             │
│  │       │                                   ▼  │             │
│  │       │                        ┌──────────────────┐       │
│  │       │                        │   LlamaIndex     │       │
│  │       │                        │   Retrieval      │       │
│  │       │                        │   - Vector search│       │
│  │       │                        │   - Graph query  │       │
│  │       │                        │   - LlamaParse   │       │
│  │       │                        └────────┬─────────┘       │
│  │       │                                 │                 │
│  │       │── "Cần team analysis?" ────┐    │                 │
│  │       │                            ▼    │                 │
│  │       │                   ┌──────────────────┐            │
│  │       │                   │    CrewAI Crew   │            │
│  │       │                   │   Researcher +   │            │
│  │       │                   │   Analyst +      │            │
│  │       │                   │   Writer         │            │
│  │       │                   └────────┬─────────┘            │
│  │       │                            │                      │
│  │       │── "Cần tool call?" ──┐     │                      │
│  │       │                      ▼     │                      │
│  │       │              ┌─────────────────┐                  │
│  │       │              │   MCP Tools     │                  │
│  │       │              │   Database,     │                  │
│  │       │              │   Browser,      │                  │
│  │       │              │   APIs          │                  │
│  │       │              └────────┬────────┘                  │
│  │       │                       │                           │
│  │  ┌────▼───────────────────────▼─────────────────┐        │
│  │  │              Merge + Synthesize              │        │
│  │  │         (LangChain LLM + Output Parser)      │        │
│  │  └──────────────────────┬───────────────────────┘        │
│  │                         │                                │
│  │  ┌──────────────────────▼───────────────────────┐        │
│  │  │           Human Review (HITL)                │        │
│  │  │           interrupt() → approve/reject       │        │
│  │  └──────────────────────┬───────────────────────┘        │
│  │                         │                                │
│  │                    ┌────▼────┐                            │
│  │                    │  END    │                            │
│  │                    └─────────┘                            │
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  LangSmith — Unified Observability                   │    │
│  │  Trace ALL layers: retrieval → agent → crew → tools  │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### 1.3 Tổng Hợp: Framework Nào Gọi Framework Nào?

```
┌─────────────────────────────────────────────────────────────────┐
│                   DEPENDENCY & INTEGRATION MAP                  │
│                                                                 │
│  ┌──────────┐         ┌───────────┐         ┌───────────────┐  │
│  │LangChain │◀────────│ LangGraph │         │   CrewAI      │  │
│  │(SDK)     │ built-on│(Runtime)  │◀─node── │(Execution)    │  │
│  └────┬─────┘         └─────┬─────┘         └───────────────┘  │
│       │                     │                                   │
│       │                     │ wraps-as-tool                     │
│       │                     ▼                                   │
│       │              ┌───────────────┐                          │
│       └──────────────│  LlamaIndex   │  ← Independent          │
│          uses        │  (Data)       │     can run standalone   │
│          embeddings  └───────┬───────┘                          │
│                              │                                  │
│                              │ queries via                      │
│                              ▼                                  │
│                       ┌─────────────┐                           │
│                       │  MCP Tools  │  ← Protocol layer         │
│                       │  (Any tool) │     universal connector   │
│                       └─────────────┘                           │
│                                                                 │
│  GỌI NHAU:                                                     │
│  • LangGraph gọi LlamaIndex (as retrieval tool)                │
│  • LangGraph gọi CrewAI (as execution node)                    │
│  • LangGraph gọi MCP tools (as standard tools)                 │
│  • CrewAI có thể gọi LlamaIndex (as CrewAI tool)               │
│  • LlamaIndex Workflows có thể gọi LangChain components        │
│  • Tất cả dùng LangChain models/prompts/parsers                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Antigravity Thuộc Hệ Sinh Thái Nào?

### 2.1 Antigravity — Vị Trí Trong Ecosystem

**Antigravity KHÔNG thuộc bất kỳ framework nào trong 4 cái trên.** Nó là một **layer khác hoàn toàn** — nằm ở tầng **Development & Orchestration Platform**.

```
┌──────────────────────────────────────────────────────────────────────┐
│                     TOÀN BỘ ECOSYSTEM                               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  TẦNG 5: DEVELOPMENT PLATFORM                               │    │
│  │  ┌────────────────────────────────────────────────────────┐  │    │
│  │  │              ★ ANTIGRAVITY IDE ★                       │  │    │
│  │  │  • Agent-first development environment                │  │    │
│  │  │  • Orchestrate multiple coding agents                 │  │    │
│  │  │  • MCP server integration (browser, DB, git...)       │  │    │
│  │  │  • Artifacts, planning, task tracking                 │  │    │
│  │  │  • Code generation, review, debugging                 │  │    │
│  │  └────────────────────────────────────────────────────────┘  │    │
│  │         │ BẠN (developer) DÙNG ANTIGRAVITY ĐỂ BUILD:       │    │
│  │         ▼                                                    │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  TẦNG 4: PROTOCOL (MCP)                                     │    │
│  │  ← Antigravity SỬ DỤNG MCP để kết nối tools               │    │
│  └──────────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  TẦNG 3: EXECUTION (CrewAI)                                 │    │
│  │  ← Bạn BUILD hệ thống CrewAI TRONG Antigravity             │    │
│  └──────────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  TẦNG 2: ORCHESTRATION (LangGraph)                          │    │
│  │  ← Bạn BUILD hệ thống LangGraph TRONG Antigravity          │    │
│  └──────────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  TẦNG 1: DATA (LlamaIndex) + TOOLKIT (LangChain)           │    │
│  │  ← Bạn BUILD hệ thống LlamaIndex TRONG Antigravity         │    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 Antigravity & MCP — Mối Quan Hệ

Antigravity **SỬ DỤNG MCP** như protocol layer để kết nối với tools bên ngoài. Các MCP servers bạn thấy trong Antigravity:

| MCP Server trong Antigravity | Thuộc hệ sinh thái | Mô tả |
|:---------------------------- |:------------------- |:------|
| **`playwright`**             | MCP Protocol        | Browser automation — navigate, click, screenshot |
| **`sqlcl`**                  | MCP Protocol        | Database operations — query, schema inspection |
| **`atlassian`**              | MCP Protocol        | Confluence/Jira integration |
| **`gitnexus`**               | MCP Protocol        | Code analysis, dependency graphs |
| **`socraticode`**            | MCP Protocol        | Codebase indexing, semantic search |
| **`hermes-loop`**            | MCP Protocol        | Workflow queue management |

### 2.3 Antigravity vs. LangGraph/CrewAI — Phân Biệt Rõ

```
┌──────────────────────────────────────────────────────────────┐
│              AI ECOSYSTEM — 2 CẤP ĐỘ KHÁC NHAU             │
│                                                              │
│  CẤP ĐỘ 1: DEVELOPMENT TOOLS (Bạn dùng để CODE)            │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │Antigravity│  │  Cursor   │  │  GitHub   │               │
│  │    IDE    │  │   IDE     │  │  Copilot  │               │
│  │           │  │           │  │           │               │
│  │ Agent-    │  │ AI-       │  │ AI-       │               │
│  │ first dev │  │ assisted  │  │ assisted  │               │
│  └─────┬─────┘  └───────────┘  └───────────┘               │
│        │                                                     │
│        │ builds                                              │
│        ▼                                                     │
│  CẤP ĐỘ 2: AI FRAMEWORKS (Bạn dùng để BUILD ứng dụng AI)   │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐ │
│  │LangChain  │  │ LangGraph │  │LlamaIndex │  │  CrewAI  │ │
│  │(SDK)      │  │(Orchestr) │  │(Data/RAG) │  │(Multi-   │ │
│  │           │  │           │  │           │  │ Agent)   │ │
│  └───────────┘  └───────────┘  └───────────┘  └──────────┘ │
│                                                              │
│  ANALOGY:                                                    │
│  Antigravity = Visual Studio (IDE để viết code)              │
│  LangGraph   = React/Django (framework để build app)         │
│  Bạn DÙNG VS Code ĐỂ VIẾT code React/Django                 │
│  Bạn DÙNG Antigravity ĐỂ BUILD hệ thống LangGraph          │
└──────────────────────────────────────────────────────────────┘
```

### 2.4 Cách Tận Dụng Antigravity Cho Project Này

Khi build hệ thống profile analysis, bạn sẽ dùng Antigravity như sau:

| Tính năng Antigravity       | Dùng cho                                          |
|:--------------------------- |:------------------------------------------------- |
| **Code generation**         | Generate LangGraph nodes, LlamaIndex pipelines    |
| **MCP `sqlcl`**             | Query database trực tiếp trong IDE                |
| **MCP `playwright`**        | Test UI dashboard, scrape data                    |
| **MCP `socraticode`**       | Index & search codebase khi project lớn           |
| **Artifacts system**        | Track implementation plans, task progress          |
| **Browser subagent**        | Test web interfaces, verify outputs               |
| **Multi-agent orchestration**| Chạy nhiều coding tasks song song                |

---

## 3. Kiến Trúc Hệ Thống Profile Analysis

### 3.1 Tổng Quan Use Case

Bạn muốn build hệ thống:
- ✅ Phân tích **database** (thông tin người dùng, relationships)
- ✅ Xử lý **hình ảnh khuôn mặt** (face analysis)
- ✅ Phân tích **social data** (friends, about, posts/timeline)
- ✅ **Đánh giá con người** (profile evaluation)
- ✅ Dùng **RAG** để query & synthesize

### 3.2 Kiến Trúc Đề Xuất — Multimodal Profile RAG

```
┌──────────────────────────────────────────────────────────────────────┐
│             MULTIMODAL PROFILE ANALYSIS SYSTEM                       │
│                                                                      │
│  ┌──────────── INGESTION PIPELINE ────────────────────────────────┐  │
│  │                                                                 │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────────┐  │  │
│  │  │Database │  │ Photos  │  │ Posts/  │  │ Friend Network  │  │  │
│  │  │ Tables  │  │ Faces   │  │Timeline │  │ Relationships   │  │  │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └───────┬──────────┘  │  │
│  │       │            │            │                │             │  │
│  │       ▼            ▼            ▼                ▼             │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────┐    │  │
│  │  │SQL/ORM  │  │InsightF.│  │LlamaIdx │  │ Neo4j Graph  │    │  │
│  │  │Extract  │  │DeepFace │  │Parse &  │  │ Import       │    │  │
│  │  │Metadata │  │Analyze  │  │Chunk    │  │ Relationships│    │  │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └───────┬──────┘    │  │
│  │       │            │            │                │            │  │
│  └───────┼────────────┼────────────┼────────────────┼────────────┘  │
│          │            │            │                │               │
│          ▼            ▼            ▼                ▼               │
│  ┌──────── INDEXING & STORAGE ────────────────────────────────┐    │
│  │                                                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │    │
│  │  │ Vector Store │  │  Face        │  │  Property Graph  │  │    │
│  │  │ (Qdrant/     │  │  Embedding   │  │  (Neo4j)         │  │    │
│  │  │  ChromaDB)   │  │  Store       │  │                  │  │    │
│  │  │              │  │  (Qdrant)    │  │  Person─FRIEND─  │  │    │
│  │  │ Text chunks  │  │              │  │  Person          │  │    │
│  │  │ + metadata   │  │  512-dim     │  │  Person─POSTED─  │  │    │
│  │  │              │  │  face vectors│  │  Content         │  │    │
│  │  └──────────────┘  └──────────────┘  │  Person─LIKES─   │  │    │
│  │                                      │  Content         │  │    │
│  │                                      └──────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────── RETRIEVAL & ANALYSIS (LangGraph Control Plane) ────┐    │
│  │                                                             │    │
│  │  ┌─────────┐                                                │    │
│  │  │ Router  │ ← "Loại query nào?"                            │    │
│  │  └────┬────┘                                                │    │
│  │       │                                                     │    │
│  │  ┌────┼────────────────────┬───────────────────┐           │    │
│  │  │    │                    │                   │           │    │
│  │  ▼    ▼                    ▼                   ▼           │    │
│  │ ┌────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │    │
│  │ │Text    │  │Face      │  │Graph     │  │Multimodal│     │    │
│  │ │Search  │  │Match     │  │Traverse  │  │Analysis  │     │    │
│  │ │(Vector)│  │(ArcFace) │  │(Cypher)  │  │(VLM)     │     │    │
│  │ └───┬────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │    │
│  │     │            │             │              │            │    │
│  │     └────────────┴─────────────┴──────────────┘            │    │
│  │                         │                                   │    │
│  │                         ▼                                   │    │
│  │               ┌─────────────────┐                          │    │
│  │               │  Context Merge  │                          │    │
│  │               │  + Reranking    │                          │    │
│  │               └────────┬────────┘                          │    │
│  │                        │                                    │    │
│  │               ┌────────▼────────┐                          │    │
│  │               │  LLM Synthesis  │  ← GPT-4o / Claude      │    │
│  │               │  Profile Report │                          │    │
│  │               └────────┬────────┘                          │    │
│  │                        │                                    │    │
│  │               ┌────────▼────────┐                          │    │
│  │               │  HITL Review    │  ← Human approve/reject  │    │
│  │               │  (Ethics Gate)  │                          │    │
│  │               └─────────────────┘                          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────── OBSERVABILITY ─────────────────────────────────────┐    │
│  │  LangSmith Tracing │ Cost Tracking │ Privacy Audit Logs   │    │
│  └────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.3 Chi Tiết Từng Module — Framework Nào Cho Module Nào?

#### 📊 Module 1: Database Analysis

| Aspect          | Framework/Tool            | Lý do                                          |
|:--------------- |:------------------------- |:----------------------------------------------- |
| **Schema parsing** | LlamaIndex + SQLAlchemy | LlamaIndex có SQL connector, tự động parse schema |
| **Query engine** | LlamaIndex `NLSQLTableQueryEngine` | Natural language → SQL tự động |
| **Complex joins** | MCP `sqlcl` (trong Antigravity) | Truy vấn phức tạp, inspect schema |
| **Data indexing** | LlamaIndex `VectorStoreIndex` | Index kết quả query cho RAG |

```python
# ===================================================
# MODULE 1: Database → LlamaIndex SQL Query Engine
# ===================================================
from llama_index.core import SQLDatabase
from llama_index.core.query_engine import NLSQLTableQueryEngine
from sqlalchemy import create_engine

# Kết nối database
engine = create_engine("postgresql://user:pass@localhost/social_db")
sql_database = SQLDatabase(engine, include_tables=[
    "users", "friendships", "posts", "comments", "likes", "photos"
])

# Natural Language → SQL → Answer
sql_query_engine = NLSQLTableQueryEngine(
    sql_database=sql_database,
    tables=["users", "friendships", "posts"],
)

response = sql_query_engine.query(
    "Tìm user có nhiều bạn bè nhất và list 5 bài post gần nhất của họ"
)
print(response)
# → Tự động generate SQL, execute, trả answer
```

---

#### 👤 Module 2: Face Analysis

| Aspect            | Framework/Tool        | Lý do                                          |
|:----------------- |:--------------------- |:----------------------------------------------- |
| **Face detection** | InsightFace (Buffalo-L) | Production-grade, GPU optimized |
| **Face embedding** | ArcFace (512-dim)     | Accuracy cao, industry standard |
| **Attribute analysis** | DeepFace          | Wrapper nhiều backends, dễ prototype |
| **Face search**   | Qdrant + pgvector     | Vector similarity search trên face embeddings |
| **VLM analysis**  | GPT-4o Vision / Gemini| Visual reasoning: biểu cảm, context ảnh |
| **Orchestration** | LangGraph             | Quyết định khi nào trigger face analysis |

```python
# ===================================================
# MODULE 2: Face Analysis Pipeline
# ===================================================
import insightface
from insightface.app import FaceAnalysis
import numpy as np

# --- STEP 1: Face Detection & Embedding ---
face_app = FaceAnalysis(name="buffalo_l", providers=["CUDAExecutionProvider"])
face_app.prepare(ctx_id=0, det_size=(640, 640))

def extract_face_features(image_path: str) -> dict:
    """Extract face features từ ảnh"""
    import cv2
    img = cv2.imread(image_path)
    faces = face_app.get(img)

    if not faces:
        return {"found": False}

    face = faces[0]  # Lấy face chính
    return {
        "found": True,
        "embedding": face.normed_embedding.tolist(),  # 512-dim vector
        "age": int(face.age),
        "gender": "Male" if face.gender == 1 else "Female",
        "bbox": face.bbox.tolist(),
        "det_score": float(face.det_score),
    }

# --- STEP 2: Store Face Embedding → Vector DB ---
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct

client = QdrantClient("localhost", port=6333)

# Create collection cho face embeddings
client.create_collection(
    collection_name="face_embeddings",
    vectors_config=VectorParams(size=512, distance=Distance.COSINE),
)

def store_face(user_id: str, features: dict):
    """Lưu face embedding vào Qdrant"""
    client.upsert(
        collection_name="face_embeddings",
        points=[PointStruct(
            id=hash(user_id) % (10**18),
            vector=features["embedding"],
            payload={
                "user_id": user_id,
                "age": features["age"],
                "gender": features["gender"],
            }
        )]
    )

def search_similar_faces(embedding: list, top_k: int = 5):
    """Tìm faces tương tự"""
    results = client.search(
        collection_name="face_embeddings",
        query_vector=embedding,
        limit=top_k
    )
    return results

# --- STEP 3: VLM Analysis (context từ ảnh) ---
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
import base64

def analyze_photo_context(image_path: str) -> str:
    """Dùng GPT-4o Vision phân tích context ảnh"""
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode()

    model = ChatOpenAI(model="gpt-4o")
    response = model.invoke([
        HumanMessage(content=[
            {"type": "text", "text": """Phân tích ảnh này:
            - Bối cảnh (location, event, activity)
            - Biểu cảm khuôn mặt
            - Số người trong ảnh
            - Vật dụng, trang phục đáng chú ý
            Trả lời bằng tiếng Việt."""},
            {"type": "image_url", "image_url": {
                "url": f"data:image/jpeg;base64,{image_data}"
            }}
        ])
    ])
    return response.content
```

---

#### 🕸️ Module 3: Social Graph (Friend Network)

| Aspect               | Framework/Tool           | Lý do                                        |
|:--------------------- |:------------------------ |:---------------------------------------------- |
| **Graph storage**     | Neo4j                    | Native graph DB, Cypher queries, algorithms    |
| **Graph construction**| LlamaIndex PropertyGraph | Schema-guided extraction từ unstructured data  |
| **Graph queries**     | LlamaIndex + Neo4j       | NL → Cypher translation                       |
| **Network analysis**  | Neo4j GDS (Graph Data Science) | Centrality, community detection, PageRank |
| **Orchestration**     | LangGraph                | Multi-hop reasoning trên graph                 |

```python
# ===================================================
# MODULE 3: Social Graph — Neo4j + LlamaIndex
# ===================================================
from neo4j import GraphDatabase

# --- STEP 1: Import social data vào Neo4j ---
driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "password"))

def import_social_data(user_data: dict):
    """Import user + relationships vào Neo4j"""
    with driver.session() as session:
        # Create User node
        session.run("""
            MERGE (u:User {id: $id})
            SET u.name = $name,
                u.about = $about,
                u.join_date = $join_date,
                u.location = $location
        """, **user_data)

        # Create Friend relationships
        for friend_id in user_data.get("friends", []):
            session.run("""
                MATCH (u:User {id: $user_id})
                MERGE (f:User {id: $friend_id})
                MERGE (u)-[:FRIEND_WITH]->(f)
            """, user_id=user_data["id"], friend_id=friend_id)

        # Create Posts
        for post in user_data.get("posts", []):
            session.run("""
                MATCH (u:User {id: $user_id})
                CREATE (p:Post {id: $post_id, content: $content,
                        timestamp: $timestamp, likes: $likes})
                CREATE (u)-[:POSTED]->(p)
            """, user_id=user_data["id"], **post)

# --- STEP 2: Graph Analysis Queries ---
def analyze_user_influence(user_id: str) -> dict:
    """Phân tích ảnh hưởng của user trong network"""
    with driver.session() as session:
        # Degree centrality (số connections)
        result = session.run("""
            MATCH (u:User {id: $id})-[:FRIEND_WITH]-(friend)
            WITH u, count(friend) as friend_count
            OPTIONAL MATCH (u)-[:POSTED]->(p:Post)
            WITH u, friend_count, count(p) as post_count,
                 avg(p.likes) as avg_likes
            RETURN friend_count, post_count, avg_likes
        """, id=user_id)
        return result.single()

def find_mutual_friends(user_a: str, user_b: str) -> list:
    """Tìm bạn chung"""
    with driver.session() as session:
        result = session.run("""
            MATCH (a:User {id: $a})-[:FRIEND_WITH]-(mutual)-[:FRIEND_WITH]-(b:User {id: $b})
            RETURN mutual.name, mutual.id
        """, a=user_a, b=user_b)
        return [r.data() for r in result]

def detect_communities():
    """Community detection bằng Neo4j GDS"""
    with driver.session() as session:
        # Project graph
        session.run("""
            CALL gds.graph.project('social', 'User', 'FRIEND_WITH')
        """)
        # Run Louvain community detection
        result = session.run("""
            CALL gds.louvain.stream('social')
            YIELD nodeId, communityId
            RETURN gds.util.asNode(nodeId).name AS name, communityId
            ORDER BY communityId
        """)
        return [r.data() for r in result]

# --- STEP 3: LlamaIndex Property Graph Integration ---
from llama_index.core import PropertyGraphIndex
from llama_index.graph_stores.neo4j import Neo4jPropertyGraphStore

graph_store = Neo4jPropertyGraphStore(
    username="neo4j",
    password="password",
    url="bolt://localhost:7687",
)

# Query graph bằng natural language
graph_index = PropertyGraphIndex.from_existing(
    property_graph_store=graph_store,
)
query_engine = graph_index.as_query_engine()
response = query_engine.query(
    "Ai là người có ảnh hưởng nhất trong nhóm bạn của user X?"
)
```

---

#### 📝 Module 4: Posts/Timeline Analysis

| Aspect              | Framework/Tool                 | Lý do                                    |
|:-------------------- |:------------------------------ |:----------------------------------------- |
| **Text indexing**   | LlamaIndex VectorStoreIndex    | Chunk & embed post content               |
| **Sentiment**       | LangChain + LLM               | Phân tích cảm xúc từ posts               |
| **Topic modeling**  | LlamaIndex + clustering        | Tìm chủ đề chính user quan tâm          |
| **Timeline pattern**| LangGraph                      | Phân tích patterns theo thời gian         |

```python
# ===================================================
# MODULE 4: Post/Timeline Analysis
# ===================================================
from llama_index.core import VectorStoreIndex, Document
from datetime import datetime

def index_user_posts(user_id: str, posts: list) -> VectorStoreIndex:
    """Index posts của user cho RAG"""
    documents = []
    for post in posts:
        doc = Document(
            text=post["content"],
            metadata={
                "user_id": user_id,
                "post_id": post["id"],
                "timestamp": post["timestamp"],
                "likes": post["likes"],
                "comments_count": post["comments_count"],
                "type": post.get("type", "text"),  # text, photo, share
            }
        )
        documents.append(doc)

    # Build index với metadata filtering
    index = VectorStoreIndex.from_documents(documents)
    return index

# Sentiment & Topic Analysis
def analyze_post_patterns(posts_index, user_id: str):
    """Phân tích patterns từ posts"""
    query_engine = posts_index.as_query_engine()

    # Sentiment trend
    sentiment = query_engine.query(f"""
        Phân tích xu hướng cảm xúc trong các bài post:
        - Tích cực / Tiêu cực / Trung lập (% mỗi loại)
        - Chủ đề nào khiến user tích cực nhất?
        - Có dấu hiệu stress/tiêu cực bất thường không?
    """)

    # Topic analysis
    topics = query_engine.query(f"""
        Xác định top 5 chủ đề user quan tâm nhất dựa trên posts:
        - Tên chủ đề
        - Tần suất xuất hiện
        - Mức độ engagement (likes/comments)
    """)

    return {"sentiment": str(sentiment), "topics": str(topics)}
```

---

### 3.4 LangGraph — Master Control Plane

Tất cả modules trên được điều phối bởi LangGraph:

```python
# ===================================================
# MASTER: LangGraph Control Plane
# ===================================================
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.sqlite import SqliteSaver
from typing import TypedDict, Annotated, Optional
import operator

class ProfileState(TypedDict):
    # Input
    target_user_id: str
    query: str

    # Data collected
    db_profile: Optional[dict]
    face_features: Optional[dict]
    face_context: Optional[str]
    social_graph: Optional[dict]
    post_analysis: Optional[dict]

    # Analysis
    profile_report: str
    risk_score: Optional[float]

    # Control
    messages: Annotated[list, operator.add]
    current_step: str
    human_approved: bool

# --- NODES ---
def collect_db_data(state: ProfileState):
    """Thu thập data từ database"""
    profile = sql_query_engine.query(
        f"Lấy thông tin chi tiết của user {state['target_user_id']}"
    )
    return {"db_profile": str(profile), "current_step": "db_done"}

def analyze_face(state: ProfileState):
    """Phân tích khuôn mặt"""
    features = extract_face_features(f"photos/{state['target_user_id']}.jpg")
    context = analyze_photo_context(f"photos/{state['target_user_id']}.jpg")
    return {
        "face_features": features,
        "face_context": context,
        "current_step": "face_done"
    }

def analyze_social_graph(state: ProfileState):
    """Phân tích mạng lưới bạn bè"""
    influence = analyze_user_influence(state["target_user_id"])
    communities = detect_communities()
    return {"social_graph": influence, "current_step": "graph_done"}

def analyze_posts(state: ProfileState):
    """Phân tích posts/timeline"""
    analysis = analyze_post_patterns(posts_index, state["target_user_id"])
    return {"post_analysis": analysis, "current_step": "posts_done"}

def synthesize_profile(state: ProfileState):
    """Tổng hợp tất cả data → Profile Report"""
    llm = ChatOpenAI(model="gpt-4o")
    report = llm.invoke(f"""
    Tổng hợp hồ sơ đánh giá cho user {state['target_user_id']}:

    📊 Thông tin cơ bản: {state['db_profile']}
    👤 Phân tích khuôn mặt: {state['face_features']}
    📸 Context ảnh: {state['face_context']}
    🕸️ Mạng xã hội: {state['social_graph']}
    📝 Phân tích posts: {state['post_analysis']}

    Hãy đánh giá:
    1. Tính cách dự đoán (Big Five traits)
    2. Mức độ ảnh hưởng xã hội
    3. Chủ đề quan tâm chính
    4. Xu hướng cảm xúc
    5. Mạng lưới quan hệ
    6. Đánh giá tổng thể

    ⚠️ GHI CHÚ: Đây là phân tích dựa trên dữ liệu có sẵn,
    có thể không phản ánh đầy đủ con người thực.
    """)
    return {"profile_report": report.content}

def human_review(state: ProfileState):
    """Human-in-the-loop: review trước khi output"""
    from langgraph.types import interrupt
    feedback = interrupt(
        f"Review profile report:\n{state['profile_report']}\n"
        f"APPROVE hoặc REJECT (kèm lý do):"
    )
    if "APPROVE" in feedback.upper():
        return {"human_approved": True}
    return {"human_approved": False}

# --- BUILD GRAPH ---
workflow = StateGraph(ProfileState)

workflow.add_node("collect_db", collect_db_data)
workflow.add_node("analyze_face", analyze_face)
workflow.add_node("analyze_graph", analyze_social_graph)
workflow.add_node("analyze_posts", analyze_posts)
workflow.add_node("synthesize", synthesize_profile)
workflow.add_node("human_review", human_review)

# Flow: parallel data collection → synthesis → review
workflow.add_edge(START, "collect_db")
workflow.add_edge("collect_db", "analyze_face")
workflow.add_edge("analyze_face", "analyze_graph")
workflow.add_edge("analyze_graph", "analyze_posts")
workflow.add_edge("analyze_posts", "synthesize")
workflow.add_edge("synthesize", "human_review")
workflow.add_edge("human_review", END)

# Compile với checkpointing
checkpointer = SqliteSaver.from_conn_string("profile_checkpoints.db")
app = workflow.compile(checkpointer=checkpointer)
```

---

## 4. Tối Ưu Hệ Sinh Thái Cho Use Case

### 4.1 Tổng Hợp: Framework/Tool Nào Cho Module Nào?

```
┌──────────────────────────────────────────────────────────────────┐
│           OPTIMAL ECOSYSTEM MAPPING                              │
│                                                                  │
│  MODULE                    FRAMEWORK/TOOL           LAYER        │
│  ─────────────────────     ──────────────────       ─────────    │
│  Database Analysis         LlamaIndex SQL Engine    Data Plane   │
│  Face Detection/Embed      InsightFace (ArcFace)    Specialized  │
│  Face Vector Search        Qdrant / pgvector        Data Plane   │
│  Photo Context (VLM)       GPT-4o Vision / Gemini   LangChain   │
│  Social Graph Storage      Neo4j                    Data Plane   │
│  Graph Queries             LlamaIndex PropertyGraph Data Plane   │
│  Network Analysis          Neo4j GDS                Specialized  │
│  Post Indexing             LlamaIndex VectorStore   Data Plane   │
│  Sentiment Analysis        LangChain + LLM          Toolkit      │
│  Profile Synthesis         LangChain + LLM          Toolkit      │
│  Workflow Orchestration    LangGraph                Control Plane│
│  HITL / Ethics Gate        LangGraph interrupt()    Control Plane│
│  Observability             LangSmith                Monitoring   │
│  Development               Antigravity IDE          Dev Platform │
│  DB Inspection             Antigravity MCP sqlcl    Dev Tools    │
│  UI Testing                Antigravity MCP playwright Dev Tools  │
│                                                                  │
│  ⚠️ CrewAI: OPTIONAL cho use case này.                          │
│     Dùng nếu cần multi-agent debate (vd: nhiều analyst          │
│     đánh giá cùng 1 profile → consensus)                        │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Tại Sao Mapping Như Vậy?

| Quyết định                          | Lý do                                                       |
|:------------------------------------ |:------------------------------------------------------------ |
| **LlamaIndex cho Data Plane**        | Vượt trội về document parsing, SQL connector, Property Graph cho Neo4j |
| **LangGraph cho Control Plane**      | State management phức tạp (nhiều modules), HITL ethics gate, checkpointing cho debug |
| **Neo4j cho Social Graph**           | Graph-native: Cypher queries, GDS algorithms (centrality, community detection) không framework nào khác làm tốt hơn |
| **InsightFace thay vì DeepFace**     | Production-grade: GPU optimized, higher throughput, 512-dim ArcFace embeddings chính xác hơn |
| **Qdrant cho Face Embeddings**       | Chuyên vector search, hỗ trợ filtering trên metadata (age, gender), scale tốt |
| **GPT-4o Vision cho Photo Context**  | VLM mạnh nhất cho scene understanding, không chỉ face mà còn bối cảnh |
| **LangSmith cho Observability**      | Trace across tất cả layers, xem được full pipeline execution |
| **CrewAI = Optional**                | Use case này chủ yếu là data pipeline → analysis → report, không cần "team discussion" nhiều |

### 4.3 CrewAI — Khi Nào Thêm Vào?

CrewAI trở nên hữu ích khi bạn cần **multi-perspective evaluation**:

```python
# ===================================================
# OPTIONAL: CrewAI cho Multi-Analyst Evaluation
# ===================================================
# Khi cần nhiều "chuyên gia" đánh giá cùng 1 profile

psychologist = Agent(
    role="Psychologist",
    goal="Đánh giá tính cách và xu hướng hành vi",
    backstory="Chuyên gia tâm lý học với 15 năm kinh nghiệm"
)

sociologist = Agent(
    role="Sociologist",
    goal="Đánh giá mạng lưới xã hội và ảnh hưởng",
    backstory="Nhà xã hội học chuyên phân tích social networks"
)

data_scientist = Agent(
    role="Data Scientist",
    goal="Phân tích patterns và anomalies trong data",
    backstory="Data scientist chuyên behavioral analytics"
)

# Mỗi agent đánh giá cùng data nhưng từ góc nhìn khác
# → Crew tổng hợp thành consensus report
```

### 4.4 Tech Stack Tổng Hợp

```
┌──────────────────────────────────────────────────┐
│              RECOMMENDED TECH STACK              │
│                                                  │
│  DEVELOPMENT:                                    │
│  ├── Antigravity IDE (coding + MCP tools)        │
│  └── Python 3.11+                                │
│                                                  │
│  AI FRAMEWORKS:                                  │
│  ├── LangGraph (orchestration)                   │
│  ├── LangChain (LLM toolkit)                     │
│  ├── LlamaIndex (data/RAG)                       │
│  └── CrewAI (optional: multi-analyst)            │
│                                                  │
│  FACE ANALYSIS:                                  │
│  ├── InsightFace (detection + embedding)         │
│  ├── ArcFace (512-dim face vectors)              │
│  └── GPT-4o Vision (photo context analysis)      │
│                                                  │
│  DATABASES:                                      │
│  ├── PostgreSQL (user data, posts, metadata)     │
│  ├── Neo4j (social graph, relationships)         │
│  ├── Qdrant (vector search: text + faces)        │
│  └── Redis (caching, session state)              │
│                                                  │
│  LLM MODELS:                                     │
│  ├── GPT-4o (synthesis, analysis, VLM)           │
│  ├── GPT-4o-mini (evaluation, routing, cheap)    │
│  ├── text-embedding-3-small (text embeddings)    │
│  └── ArcFace (face embeddings — local)           │
│                                                  │
│  INFRASTRUCTURE:                                 │
│  ├── FastAPI (API gateway)                       │
│  ├── LangSmith (observability)                   │
│  ├── Docker Compose (local dev)                  │
│  └── SQLite → PostgreSQL (checkpointing)         │
│                                                  │
│  PROTOCOL:                                       │
│  └── MCP (tool connectivity standard)            │
└──────────────────────────────────────────────────┘
```

---

## 5. Implementation Roadmap

### Phase 1: Foundation (2-3 tuần)
- [ ] Setup PostgreSQL + import sample user data
- [ ] Setup Neo4j + import friend relationships
- [ ] Setup Qdrant + basic vector search
- [ ] LlamaIndex: basic RAG trên user posts
- [ ] LangChain: basic LLM chain cho analysis

### Phase 2: Face Module (2 tuần)
- [ ] InsightFace: face detection + embedding pipeline
- [ ] Qdrant: face embedding store + similarity search
- [ ] GPT-4o Vision: photo context analysis
- [ ] Integration test: image → features → vector DB → search

### Phase 3: Social Graph (2 tuần)
- [ ] Neo4j: import full social data (users, friends, posts)
- [ ] LlamaIndex PropertyGraph: NL → Cypher queries
- [ ] Neo4j GDS: centrality, community detection algorithms
- [ ] Integration: graph insights → RAG context

### Phase 4: Orchestration (2-3 tuần)
- [ ] LangGraph: build full workflow graph
- [ ] State management: define ProfileState schema
- [ ] Checkpointing: SQLite/PostgreSQL persistence
- [ ] HITL: ethics review gate
- [ ] Router: adaptive query routing

### Phase 5: Production (2 tuần)
- [ ] FastAPI wrapper
- [ ] LangSmith tracing setup
- [ ] Cost optimization: model routing
- [ ] Security: PII filtering, access control
- [ ] Privacy compliance: consent, audit logs

### ⚠️ Ethics & Privacy Considerations
- **EU AI Act** (có hiệu lực 8/2026): Yêu cầu transparency, risk classification
- **GDPR**: Consent cho biometric data processing
- **Privacy by Design**: Anonymize data, explicit consent
- **Bias mitigation**: Face recognition có thể biased — luôn cần HITL
- **Data retention**: Chính sách xóa data sau thời gian nhất định




















# Ecosystem Integration & Profile Analysis — Summary

## 1. Cách Phối Hợp Hệ Sinh Thái

### 6 Integration Patterns

| # | Pattern | Mô tả |
|:--|:--------|:------|
| 1 | **LlamaIndex-as-Tool** | Wrap LlamaIndex query engine thành tool cho LangGraph agent |
| 2 | **LangGraph Pipeline + LlamaIndex Stages** | Mỗi LangGraph node = 1 giai đoạn RAG, dùng LlamaIndex cho retrieval |
| 3 | **CrewAI Crew trong LangGraph Node** | LangGraph quản lý flow, CrewAI xử lý multi-agent tasks |
| 4 | **MCP Universal Tool Layer** | MCP làm cầu nối tiêu chuẩn giữa agent và external systems |
| 5 | **Parallel Workflows** | LlamaIndex Workflows + LangGraph chạy song song, merge results |
| 6 | **Full Hybrid** | Tất cả phối hợp: Router → (LlamaIndex \| CrewAI \| MCP) → Merge → HITL |

### Architecture Stack
```
TẦNG 4: MCP Protocol (universal connector)
TẦNG 3: CrewAI (execution, role-based teams)
TẦNG 2: LangGraph (orchestration, state, HITL)
TẦNG 1: LlamaIndex (data, indexing, retrieval)
NỀN: LangChain (SDK, LLM wrappers, prompts)
```

## 2. Antigravity IDE Positioning

> **Antigravity KHÔNG thuộc framework nào.** Nó là **Development Platform** — bạn DÙNG Antigravity ĐỂ BUILD hệ thống trên các frameworks.

- Antigravity = Visual Studio (IDE để viết code)
- LangGraph = React/Django (framework để build app)
- **Bạn dùng Antigravity để build hệ thống LangGraph/LlamaIndex/CrewAI**

MCP tools trong Antigravity: `sqlcl` (DB), `playwright` (browser), `socraticode` (codebase search), `atlassian` (Jira/Confluence)

## 3. Profile Analysis System Architecture

### 4 Modules + Framework Mapping

| Module | Primary Framework | Specialized Tools |
|:-------|:-----------------|:-----------------|
| **Database Analysis** | LlamaIndex (SQL Engine) | PostgreSQL, SQLAlchemy |
| **Face Analysis** | InsightFace + LangChain | ArcFace (512-dim), Qdrant, GPT-4o Vision |
| **Social Graph** | LlamaIndex PropertyGraph + Neo4j | Neo4j GDS (centrality, community detection) |
| **Posts/Timeline** | LlamaIndex VectorStore | Sentiment + Topic analysis via LLM |
| **Orchestration** | LangGraph (Control Plane) | State management, HITL ethics gate, checkpointing |

### Tech Stack
- **AI:** LangGraph + LangChain + LlamaIndex (+ optional CrewAI)
- **Face:** InsightFace (ArcFace) + GPT-4o Vision
- **DB:** PostgreSQL + Neo4j + Qdrant + Redis
- **LLM:** GPT-4o (synthesis) + GPT-4o-mini (routing/eval)
- **Infra:** FastAPI + LangSmith + Docker Compose

### Implementation: 5 Phases (~10-12 weeks)
1. Foundation (DB + Vector + basic RAG)
2. Face Module (InsightFace + Qdrant + VLM)
3. Social Graph (Neo4j + PropertyGraph + GDS)
4. Orchestration (LangGraph workflow + HITL)
5. Production (FastAPI + observability + security)

Full document: [ecosystem_integration_profile_analysis.md](file:///home/nguyentthai96/Desktop/bigbang/research_docs/ecosystem_integration_profile_analysis.md)

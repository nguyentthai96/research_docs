# 🧠 AI Agent Frameworks: Deep Dive — Zero to Hero

> **Tài liệu nghiên cứu chuyên sâu: LangChain · LangGraph · LlamaIndex · CrewAI**
> Cập nhật: Tháng 7/2026

---

## 📋 Mục Lục

1. [Tổng Quan & Bối Cảnh](#1-tổng-quan--bối-cảnh)
2. [LangChain — Nền Tảng Hệ Sinh Thái](#2-langchain--nền-tảng-hệ-sinh-thái)
3. [LangGraph — Orchestration Runtime](#3-langgraph--orchestration-runtime)
4. [LlamaIndex — Data-First RAG Framework](#4-llamaindex--data-first-rag-framework)
5. [CrewAI — Multi-Agent Orchestration](#5-crewai--multi-agent-orchestration)
6. [So Sánh Chi Tiết 4 Framework](#6-so-sánh-chi-tiết-4-framework)
7. [Kiến Trúc Hybrid Production-Ready](#7-kiến-trúc-hybrid-production-ready)
8. [Lộ Trình Học Tập (Learning Roadmap)](#8-lộ-trình-học-tập-learning-roadmap)
9. [Production Best Practices](#9-production-best-practices)
10. [Tài Nguyên & Tham Khảo](#10-tài-nguyên--tham-khảo)

---

## 1. Tổng Quan & Bối Cảnh

### 1.1 Bức Tranh Toàn Cảnh 2026

Hệ sinh thái AI Agent Framework đã chuyển từ giai đoạn thử nghiệm sang **production-grade**. Các framework không còn cạnh tranh trực tiếp mà đã **phân hóa chức năng rõ ràng**:

```
┌──────────────────────────────────────────────────────────────────┐
│                    KIẾN TRÚC AGENT HIỆN ĐẠI 2026                │
│                                                                  │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐     │
│  │  CrewAI      │    │  LangGraph   │    │   LlamaIndex    │     │
│  │  (Execution  │    │  (Control    │    │   (Data/        │     │
│  │   Layer)     │    │   Plane)     │    │    Retrieval)   │     │
│  └──────┬───────┘    └──────┬───────┘    └───────┬─────────┘     │
│         │                   │                    │               │
│         └───────────┬───────┴────────────────────┘               │
│                     │                                            │
│              ┌──────┴──────┐                                     │
│              │  LangChain  │                                     │
│              │  (Toolkit/  │                                     │
│              │   Glue)     │                                     │
│              └─────────────┘                                     │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Vai Trò Của Từng Framework

| Framework     | Vai Trò Chính                | Ví von dễ hiểu                           |
|:------------- |:---------------------------- |:----------------------------------------- |
| **LangChain** | Bộ toolkit / thư viện chuẩn  | "SDK của LLM" — kết nối mọi thứ          |
| **LangGraph** | Engine điều phối stateful    | "Bộ não" — quản lý logic & trạng thái    |
| **LlamaIndex**| Xử lý dữ liệu & RAG        | "Bộ nhớ" — ingestion, index, retrieval   |
| **CrewAI**    | Đội ngũ agent cộng tác       | "Team công ty" — phân vai & phối hợp     |

---

## 2. LangChain — Nền Tảng Hệ Sinh Thái

### 2.1 Giới Thiệu

LangChain là **thư viện chuẩn** cho phát triển ứng dụng LLM. Nó cung cấp các building block trừu tượng hóa để kết nối LLM với mọi thứ — từ prompt templates, memory, tools, đến vector stores.

> **Quan trọng (2026):** LangChain không còn là framework "all-in-one". Nó đã tách thành các package modular chuyên biệt và đóng vai trò là **lớp toolkit** bên dưới LangGraph.

### 2.2 Kiến Trúc & Core Components

#### 2.2.1 Quá Trình Tiến Hóa

```
Timeline:
─────────────────────────────────────────────────────────────────>
  2023           2024              2025              2026
  LLMChain       LCEL              LangGraph         Unified
  AgentExecutor  Modular           v1.0 Release      LangChain +
  (Legacy)       Packages          (Oct 2025)        LangGraph
```

- **2023 (Legacy):** `LLMChain`, `AgentExecutor` — rigid, khó debug, hạn chế state management
- **2024 (LCEL):** LangChain Expression Language — pipe operator `|`, streaming, composable
- **2025-2026 (Unified):** LangChain + LangGraph = unified stack. LangChain cung cấp components, LangGraph cung cấp orchestration runtime

#### 2.2.2 Core Building Blocks

```
┌──────────────────────────────────────────────────────────┐
│                   LANGCHAIN COMPONENTS                   │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Models  │  │ Prompts  │  │   LCEL   │  │ Memory  │ │
│  │ ChatModel│  │ Template │  │ Pipe (|) │  │ State   │ │
│  │ Embedding│  │ Few-shot │  │ Runnable │  │ History │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Indexes  │  │  Agents  │  │  Tools   │  │ Output  │ │
│  │ Loader   │  │ LangGraph│  │ Search   │  │ Parser  │ │
│  │ Splitter │  │ Based    │  │ Code     │  │ JSON    │ │
│  │ VectorDB │  │          │  │ API      │  │ Pydantic│ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└──────────────────────────────────────────────────────────┘
```

| Component    | Mục đích                                   | Chi tiết                                              |
|:------------ |:------------------------------------------ |:----------------------------------------------------- |
| **Models**   | Reasoning & Generation                     | Unified interface cho `ChatModels`, `Embeddings` — trừu tượng hóa provider (OpenAI, Anthropic, Gemini, Ollama) |
| **Prompts**  | Cấu trúc input                             | Dynamic templates, few-shot examples, role-based       |
| **LCEL**     | Composition                                | Pipe operator `\|` — clean, readable, streaming-capable |
| **Memory**   | Lưu trữ trạng thái                        | Từ message history đến LangGraph state objects         |
| **Indexes**  | RAG / Data Access                          | Document loaders, text splitters, vector stores         |
| **Agents**   | Hành động tự động                          | Giờ build bằng LangGraph (tool-calling + reasoning)    |
| **Tools**    | Tương tác bên ngoài                        | Search, code execution, API calls                      |
| **Parsers**  | Cấu trúc output                           | JSON, Pydantic, structured output                      |

### 2.3 LCEL — LangChain Expression Language

LCEL là chuẩn composition hiện tại, cho phép xây pipeline clean và streamable:

```python
# =========================================
# LCEL — Basic Chain Example
# =========================================
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 1. Tạo prompt template
prompt = ChatPromptTemplate.from_messages([
    ("system", "Bạn là chuyên gia {topic}. Trả lời ngắn gọn bằng tiếng Việt."),
    ("human", "{question}")
])

# 2. Khởi tạo model
model = ChatOpenAI(model="gpt-4o")

# 3. Output parser
parser = StrOutputParser()

# 4. Compose chain bằng pipe operator
chain = prompt | model | parser

# 5. Invoke
response = chain.invoke({
    "topic": "machine learning",
    "question": "Transformer architecture hoạt động như thế nào?"
})
print(response)
```

```python
# =========================================
# LCEL — Advanced: RAG Chain
# =========================================
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# Setup retriever
embeddings = OpenAIEmbeddings()
vectorstore = FAISS.from_texts(
    ["LangChain là framework cho LLM apps",
     "LangGraph quản lý stateful workflows",
     "LlamaIndex chuyên về RAG pipelines"],
    embeddings
)
retriever = vectorstore.as_retriever()

# RAG prompt
rag_prompt = ChatPromptTemplate.from_template("""
Dựa trên context sau để trả lời câu hỏi:

Context: {context}
Question: {question}

Trả lời bằng tiếng Việt:
""")

# RAG chain
rag_chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | rag_prompt
    | ChatOpenAI(model="gpt-4o")
    | StrOutputParser()
)

response = rag_chain.invoke("LangGraph dùng để làm gì?")
print(response)
```

### 2.4 Hệ Sinh Thái Modular (Package Family)

```
langchain-core        ← Core abstractions (LCEL, Runnables)
langchain             ← High-level chains, agents
langchain-openai      ← OpenAI integration
langchain-anthropic   ← Anthropic integration
langchain-google      ← Google AI integration
langchain-community   ← Community integrations (600+)
langgraph             ← Graph-based orchestration
langsmith             ← Observability & tracing
```

### 2.5 Khi Nào Dùng LangChain?

✅ **NÊN dùng khi:**
- Cần swap giữa nhiều LLM providers mà không rewrite code
- Cần ecosystem rộng: 600+ integrations
- Xây dựng prototype nhanh với nhiều components
- Làm base layer cho LangGraph hoặc hybrid architecture

❌ **KHÔNG NÊN dùng khi:**
- Ứng dụng đơn giản chỉ cần 1 LLM call → dùng SDK trực tiếp
- Cần performance tối ưu → viết "raw" SDK code
- Task đơn giản không cần abstraction overhead

---

## 3. LangGraph — Orchestration Runtime

### 3.1 Giới Thiệu

LangGraph là **runtime điều phối** cho các AI agent stateful. Thay vì chains tuyến tính, nó mô hình hóa workflows thành **đồ thị có hướng (directed graphs)** — cho phép loops, branching, và quản lý trạng thái phức tạp.

> **Key Insight:** LangGraph KHÔNG phải đối thủ của LangChain. Nó là **engine bên dưới** LangChain. Từ v1.0 (Oct 2025), chúng hoạt động như unified stack.

### 3.2 Core Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    LANGGRAPH ARCHITECTURE                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                     STATE                            │    │
│  │  TypedDict / Pydantic Model — shared memory          │    │
│  │  Flows through all nodes, persists across steps      │    │
│  └──────────────────────────────────────────────────────┘    │
│                          │                                   │
│         ┌────────────────┼────────────────┐                  │
│         ▼                ▼                ▼                  │
│    ┌─────────┐     ┌─────────┐     ┌─────────┐              │
│    │  NODE   │────▶│  NODE   │────▶│  NODE   │              │
│    │ (Agent) │     │ (Tools) │     │(Review) │              │
│    └─────────┘     └────┬────┘     └─────────┘              │
│         ▲               │                                    │
│         │    ┌──────────┘                                    │
│         │    ▼                                               │
│    ┌────────────────────┐                                    │
│    │  CONDITIONAL EDGE  │  ← Branching / Looping logic      │
│    │  (should_continue?)│                                    │
│    └────────────────────┘                                    │
│                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐ │
│  │ Checkpointer  │  │    Store      │  │  Interrupt()     │ │
│  │ Short-term    │  │  Long-term    │  │  Human-in-the-   │ │
│  │ memory        │  │  memory       │  │  Loop            │ │
│  └───────────────┘  └───────────────┘  └──────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Ba Primitive Cốt Lõi

#### 🔵 Nodes (Đỉnh)
- Đơn vị công việc: function Python hoặc `Runnable`
- Đọc từ state, xử lý, ghi lại vào state
- Ví dụ: gọi LLM, thực thi tool, validate data

#### 🔗 Edges (Cạnh)
- Định nghĩa luồng điều khiển (control flow)
- **Normal edges:** A → B (luôn chạy B sau A)
- **Conditional edges:** A → B hoặc A → C (dựa trên điều kiện)
- Hỗ trợ **loops** (cyclic graphs)

#### 📦 State (Trạng thái)
- Cấu trúc dữ liệu chia sẻ (TypedDict / Pydantic)
- "Bộ nhớ" của graph — persist qua các bước
- Dùng **reducers** để handle cập nhật hiệu quả

### 3.4 Code Examples

#### 3.4.1 Basic: ReAct Agent

```python
# =========================================
# LangGraph — Basic ReAct Agent
# =========================================
from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, END, START
from langgraph.prebuilt import ToolNode
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
import operator

# --- 1. DEFINE STATE ---
class AgentState(TypedDict):
    """State được chia sẻ giữa tất cả nodes"""
    messages: Annotated[list, operator.add]  # Reducer: append messages

# --- 2. DEFINE TOOLS ---
@tool
def search_web(query: str) -> str:
    """Tìm kiếm thông tin trên web"""
    return f"Kết quả tìm kiếm cho: {query} — AI frameworks trending 2026"

@tool
def calculate(expression: str) -> str:
    """Tính toán biểu thức toán học"""
    return str(eval(expression))

tools = [search_web, calculate]

# --- 3. DEFINE NODES ---
model = ChatOpenAI(model="gpt-4o").bind_tools(tools)

def agent_node(state: AgentState):
    """Node chính: gọi LLM để reasoning"""
    response = model.invoke(state["messages"])
    return {"messages": [response]}

def should_continue(state: AgentState) -> Literal["tools", "__end__"]:
    """Conditional edge: quyết định tiếp tục hay dừng"""
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tools"      # Có tool call → chạy tools
    return "__end__"        # Không có → kết thúc

# --- 4. BUILD GRAPH ---
workflow = StateGraph(AgentState)

# Thêm nodes
workflow.add_node("agent", agent_node)
workflow.add_node("tools", ToolNode(tools))

# Thêm edges
workflow.add_edge(START, "agent")              # Entry point
workflow.add_conditional_edges("agent", should_continue)  # Branching
workflow.add_edge("tools", "agent")            # Loop: tools → agent

# --- 5. COMPILE & RUN ---
app = workflow.compile()

# Invoke
from langchain_core.messages import HumanMessage
result = app.invoke({
    "messages": [HumanMessage(content="Tìm kiếm top AI frameworks 2026 rồi tính 42 * 37")]
})

for msg in result["messages"]:
    print(f"{msg.type}: {msg.content}")
```

#### 3.4.2 Advanced: Multi-Agent Supervisor

```python
# =========================================
# LangGraph — Supervisor Pattern (Multi-Agent)
# =========================================
from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, END, START
from langchain_openai import ChatOpenAI
import operator

class SupervisorState(TypedDict):
    messages: Annotated[list, operator.add]
    next_agent: str
    research_results: str
    draft: str

# --- SPECIALIZED AGENT NODES ---
def researcher_node(state: SupervisorState):
    """Agent chuyên nghiên cứu"""
    model = ChatOpenAI(model="gpt-4o")
    response = model.invoke([
        {"role": "system", "content": "Bạn là researcher. Phân tích chủ đề được giao."},
        {"role": "user", "content": state["messages"][-1].content}
    ])
    return {"research_results": response.content, "messages": [response]}

def writer_node(state: SupervisorState):
    """Agent chuyên viết bài"""
    model = ChatOpenAI(model="gpt-4o")
    response = model.invoke([
        {"role": "system", "content": "Bạn là writer. Viết bài dựa trên research."},
        {"role": "user", "content": f"Research: {state['research_results']}"}
    ])
    return {"draft": response.content, "messages": [response]}

def supervisor_node(state: SupervisorState) -> dict:
    """Supervisor: điều phối các agent"""
    model = ChatOpenAI(model="gpt-4o")
    response = model.invoke([
        {"role": "system", "content": """Bạn là supervisor. Quyết định bước tiếp theo:
        - 'researcher': cần thêm thông tin
        - 'writer': đã đủ info, viết bài
        - 'FINISH': hoàn thành"""},
        {"role": "user", "content": str(state["messages"][-1].content)}
    ])

    # Parse decision (simplified)
    if "researcher" in response.content.lower():
        return {"next_agent": "researcher"}
    elif "writer" in response.content.lower():
        return {"next_agent": "writer"}
    else:
        return {"next_agent": "FINISH"}

def route_supervisor(state: SupervisorState) -> Literal["researcher", "writer", "__end__"]:
    if state["next_agent"] == "FINISH":
        return "__end__"
    return state["next_agent"]

# --- BUILD GRAPH ---
workflow = StateGraph(SupervisorState)

workflow.add_node("supervisor", supervisor_node)
workflow.add_node("researcher", researcher_node)
workflow.add_node("writer", writer_node)

workflow.add_edge(START, "supervisor")
workflow.add_conditional_edges("supervisor", route_supervisor)
workflow.add_edge("researcher", "supervisor")  # Loop back
workflow.add_edge("writer", "supervisor")      # Loop back

app = workflow.compile()
```

### 3.5 Persistence & Checkpointing

```python
# =========================================
# LangGraph — Persistence Layer
# =========================================

# --- Short-term: Checkpointer (thread-scoped) ---
from langgraph.checkpoint.sqlite import SqliteSaver

# Lưu state vào SQLite
checkpointer = SqliteSaver.from_conn_string("checkpoints.db")
app = workflow.compile(checkpointer=checkpointer)

# Invoke với thread_id → resume từ đúng vị trí
config = {"configurable": {"thread_id": "user-session-123"}}
result = app.invoke({"messages": [HumanMessage("Hello")]}, config)

# --- Long-term: Store (cross-thread) ---
# Lưu user preferences, shared knowledge
# Persist độc lập với execution threads

# --- "Time Travel" Debugging ---
# Replay từ bất kỳ checkpoint nào
# Thay đổi state tại 1 điểm → chạy lại từ đó
```

### 3.6 Human-in-the-Loop (HITL)

```python
# =========================================
# LangGraph — Human-in-the-Loop
# =========================================
from langgraph.types import interrupt

def approval_node(state):
    """Pause execution, đợi human approve"""
    # interrupt() sẽ DỪNG graph tại đây
    human_feedback = interrupt(
        "Hãy review draft này và approve/reject:\n"
        f"{state['draft']}"
    )
    return {"messages": [f"Human feedback: {human_feedback}"]}

# Graph sẽ:
# 1. Chạy đến approval_node
# 2. PAUSE → trả state về cho app
# 3. App hiển thị cho user review
# 4. User approve → RESUME từ đúng state đó
```

### 3.7 Khi Nào Dùng LangGraph?

✅ **NÊN dùng khi:**
- Workflow phức tạp: loops, branching, conditional logic
- Cần persistent memory giữa các bước
- Human-in-the-loop (approval gates)
- Multi-agent coordination
- Production systems cần reliability cao
- Cần "time travel" debugging

❌ **KHÔNG NÊN dùng khi:**
- Pipeline đơn giản, tuyến tính → dùng LCEL
- Prototype nhanh multi-agent → xem xét CrewAI trước
- Chỉ cần RAG đơn giản → LlamaIndex đủ rồi

---

## 4. LlamaIndex — Data-First RAG Framework

### 4.1 Giới Thiệu

LlamaIndex là framework **"data-first"** cho RAG (Retrieval-Augmented Generation). Nó chuyên về **ingestion, indexing, và retrieval** — biến dữ liệu thô (PDFs, databases, APIs) thành knowledge mà LLM có thể sử dụng.

> **Key Insight (2026):** LlamaIndex đã tiến hóa từ "thư viện indexing đơn giản" thành platform cho **Agentic Document Processing** — kết hợp RAG + autonomous agents.

### 4.2 Core Architecture — 5 Giai Đoạn RAG Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                 LLAMAINDEX RAG PIPELINE                      │
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                │
│  │ LOADING  │──▶│ INDEXING │──▶│ STORING  │                │
│  │ 150+ src │   │ Chunk    │   │ Persist  │                │
│  │ PDF,SQL, │   │ Embed    │   │ to disk/ │                │
│  │ Notion.. │   │ Structure│   │ vector DB│                │
│  └──────────┘   └──────────┘   └──────────┘                │
│                                      │                       │
│                                      ▼                       │
│                 ┌──────────┐   ┌──────────┐                 │
│                 │EVALUATION│◀──│ QUERYING │                 │
│                 │ RAGAS    │   │ Engine   │                 │
│                 │ Accuracy │   │ Retriever│                 │
│                 │ Faithful │   │ Hybrid   │                 │
│                 └──────────┘   └──────────┘                 │
└──────────────────────────────────────────────────────────────┘
```

| Giai đoạn      | Mô tả                                             | Tools chính                          |
|:--------------- |:------------------------------------------------- |:------------------------------------ |
| **Loading**     | Ingest dữ liệu từ 150+ nguồn                     | `SimpleDirectoryReader`, LlamaHub    |
| **Indexing**    | Chunk, embed, cấu trúc hóa dữ liệu               | Hierarchical chunking, Property Graph|
| **Storing**     | Lưu index để tái sử dụng                          | `storage_context.persist()`          |
| **Querying**    | Tìm kiếm & sinh response                          | Query Engines, Retrievers, Hybrid    |
| **Evaluation**  | Đo lường chất lượng                                | RAGAS, Arize, OpenInference          |

### 4.3 Code Examples

#### 4.3.1 Basic: RAG Pipeline

```python
# =========================================
# LlamaIndex — Basic RAG Pipeline
# =========================================
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding

# 1. Setup Global Settings
Settings.llm = OpenAI(model="gpt-4o")
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")

# 2. Ingest Data — đặt files vào folder 'data'
documents = SimpleDirectoryReader("data").load_data()

# 3. Build Index — tự động chunking + embedding
index = VectorStoreIndex.from_documents(documents)

# 4. Query Engine
query_engine = index.as_query_engine()
response = query_engine.query(
    "Chủ đề chính của các tài liệu này là gì?"
)

print(response)
# Kèm source citations
for source in response.source_nodes:
    print(f"  Source: {source.node.metadata['file_name']}")
    print(f"  Score:  {source.score:.4f}")
```

#### 4.3.2 Intermediate: Persistent Index + Custom Chunking

```python
# =========================================
# LlamaIndex — Persistent Index
# =========================================
from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    StorageContext,
    load_index_from_storage,
    Settings
)
from llama_index.core.node_parser import SentenceSplitter

import os

PERSIST_DIR = "./storage"

# Custom chunking strategy
Settings.node_parser = SentenceSplitter(
    chunk_size=1024,       # Kích thước chunk
    chunk_overlap=200,     # Overlap giữa chunks
    paragraph_separator="\n\n"
)

if not os.path.exists(PERSIST_DIR):
    # Lần đầu: build index
    documents = SimpleDirectoryReader("data").load_data()
    index = VectorStoreIndex.from_documents(documents)
    # Persist để không cần re-index
    index.storage_context.persist(persist_dir=PERSIST_DIR)
    print("✅ Index created and persisted!")
else:
    # Lần sau: load từ disk
    storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
    index = load_index_from_storage(storage_context)
    print("✅ Index loaded from storage!")

# Query
query_engine = index.as_query_engine(
    similarity_top_k=5,     # Lấy top 5 chunks relevant nhất
    response_mode="tree_summarize"  # Summarize across chunks
)
response = query_engine.query("Tóm tắt nội dung chính")
print(response)
```

#### 4.3.3 Advanced: Property Graph Index

```python
# =========================================
# LlamaIndex — Property Graph Index
# =========================================
from llama_index.core import PropertyGraphIndex, SimpleDirectoryReader
from llama_index.core.indices.property_graph import SchemaLLMPathExtractor

# Schema-guided extraction
schema_extractor = SchemaLLMPathExtractor(
    # Định nghĩa schema cho entities & relationships
    possible_entities=["Person", "Company", "Technology", "Product"],
    possible_relations=["WORKS_AT", "DEVELOPS", "USES", "COMPETES_WITH"],
)

documents = SimpleDirectoryReader("data").load_data()

# Build Property Graph
graph_index = PropertyGraphIndex.from_documents(
    documents,
    kg_extractors=[schema_extractor],
    show_progress=True
)

# Query — kết hợp vector search + graph traversal
query_engine = graph_index.as_query_engine(
    include_text=True,
    response_mode="tree_summarize"
)

response = query_engine.query(
    "Mối quan hệ giữa các công ty AI và công nghệ họ phát triển?"
)
print(response)
```

### 4.4 LlamaIndex Workflows (Agentic)

```python
# =========================================
# LlamaIndex — Event-Driven Workflow (Agentic RAG)
# =========================================
from llama_index.core.workflow import Workflow, step, Event, StartEvent, StopEvent

class RetrieveEvent(Event):
    query: str

class EvaluateEvent(Event):
    context: str
    query: str

class AdaptiveRAGWorkflow(Workflow):
    """Agentic RAG: retrieve → evaluate → re-retrieve nếu cần"""

    @step
    async def start(self, ev: StartEvent) -> RetrieveEvent:
        return RetrieveEvent(query=ev.query)

    @step
    async def retrieve(self, ev: RetrieveEvent) -> EvaluateEvent:
        # Retrieve context từ index
        results = self.index.as_retriever().retrieve(ev.query)
        context = "\n".join([r.text for r in results])
        return EvaluateEvent(context=context, query=ev.query)

    @step
    async def evaluate_and_respond(self, ev: EvaluateEvent) -> StopEvent | RetrieveEvent:
        # Agent đánh giá: context đủ tốt chưa?
        evaluation = self.llm.complete(
            f"Context có đủ để trả lời '{ev.query}' không? YES/NO"
        )
        if "NO" in evaluation.text:
            # Re-retrieve với refined query
            return RetrieveEvent(query=f"More details about: {ev.query}")
        else:
            # Generate final response
            response = self.llm.complete(
                f"Context: {ev.context}\n\nQuestion: {ev.query}\n\nAnswer:"
            )
            return StopEvent(result=response.text)
```

### 4.5 LlamaParse — Intelligent Document Parsing

```python
# =========================================
# LlamaParse — Complex Document Parsing
# =========================================
from llama_parse import LlamaParse

# Parse complex PDFs (tables, charts, multi-column)
parser = LlamaParse(
    api_key="your-api-key",
    result_type="markdown",       # Output dạng markdown
    parsing_instruction="Extract all tables and preserve structure",
    use_vendor_multimodal_model=True  # Agentic OCR
)

# Parse documents
documents = parser.load_data("complex_report.pdf")

# Kết quả: 90%+ accuracy trên tables, charts, multi-column layouts
# So với legacy OCR: ~60-70%
```

### 4.6 Khi Nào Dùng LlamaIndex?

✅ **NÊN dùng khi:**
- Bottleneck chính là **chất lượng retrieval** (RAG)
- Xử lý lượng lớn documents phức tạp (PDFs, tables)
- Cần Property Graph cho dữ liệu có relationships
- Data-intensive applications
- Cần swap LLM/embedding/vector store dễ dàng

❌ **KHÔNG NÊN dùng khi:**
- Cần orchestration phức tạp → dùng LangGraph
- Cần multi-agent collaboration → dùng CrewAI
- Không có dữ liệu riêng cần index

---

## 5. CrewAI — Multi-Agent Orchestration

### 5.1 Giới Thiệu

CrewAI là framework **multi-agent** dựa trên mô hình "team và vai trò". Bạn định nghĩa agents như thành viên trong công ty (Researcher, Writer, Manager), gán tasks, và framework sẽ điều phối phối hợp giữa họ.

> **Key Insight (2026):** CrewAI nổi bật nhờ **tốc độ prototype** và **trực quan**. Với **Flows**, nó đã thêm lớp orchestration deterministic cho production.

### 5.2 Core Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    CREWAI ARCHITECTURE                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                      FLOWS                           │    │
│  │  Event-driven orchestration layer                    │    │
│  │  @start → @listen → @router                         │    │
│  │  State Management + Conditional Logic                │    │
│  └──────────────────────────┬───────────────────────────┘    │
│                             │                                │
│  ┌──────────────────────────┴───────────────────────────┐    │
│  │                      CREW                            │    │
│  │  Collaborative unit — coordinates agent teams        │    │
│  │                                                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐   │    │
│  │  │   AGENT     │  │   AGENT     │  │   AGENT    │   │    │
│  │  │ Role: Rsch  │  │ Role: Writer│  │ Role: QA   │   │    │
│  │  │ Goal: Find  │  │ Goal: Draft │  │ Goal: Check│   │    │
│  │  │ Backstory   │  │ Backstory   │  │ Backstory  │   │    │
│  │  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘   │    │
│  │         │                │                │          │    │
│  │  ┌──────┴──────┐  ┌─────┴───────┐  ┌────┴───────┐  │    │
│  │  │   TASK      │  │   TASK      │  │   TASK     │  │    │
│  │  │ Research    │  │ Write Blog  │  │ Review     │  │    │
│  │  │ expected_   │  │ expected_   │  │ expected_  │  │    │
│  │  │ output      │  │ output      │  │ output     │  │    │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐   │
│  │  TOOLS   │  │ PROCESS  │  │   MEMORY                │   │
│  │ Search   │  │Sequential│  │  Short-term (context)    │   │
│  │ File I/O │  │Hierarchic│  │  Long-term (ChromaDB)    │   │
│  │ API      │  │Consensus │  │  Entity (relationships)  │   │
│  └──────────┘  └──────────┘  └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 5 Primitive Cốt Lõi

| Primitive    | Mô tả                                                                 |
|:------------ |:---------------------------------------------------------------------- |
| **Agent**    | Đơn vị tự chủ: `role` + `goal` + `backstory` → persona quyết định reasoning |
| **Task**     | Assignment cụ thể: `description` + `expected_output` + `agent` + `tools`    |
| **Tool**     | "Bàn tay" của agent: search, file read, API calls                         |
| **Crew**     | Đơn vị cộng tác: quản lý delegation, context sharing, aggregation          |
| **Process**  | Logic điều phối: `sequential`, `hierarchical`, `consensus`                  |

### 5.4 Code Examples

#### 5.4.1 Basic: Research & Writing Crew

```python
# =========================================
# CrewAI — Basic Research & Writing Crew
# =========================================
from crewai import Agent, Task, Crew, Process

# --- 1. DEFINE AGENTS ---
researcher = Agent(
    role="Senior AI Researcher",
    goal="Tìm và phân tích xu hướng AI mới nhất 2026",
    backstory="""Bạn là nhà nghiên cứu AI hàng đầu, có kinh nghiệm
    20 năm trong lĩnh vực machine learning. Bạn nổi tiếng với
    khả năng tổng hợp thông tin từ nhiều nguồn.""",
    allow_delegation=False,
    verbose=True
)

writer = Agent(
    role="Tech Content Writer",
    goal="Viết bài blog chất lượng cao về công nghệ AI",
    backstory="""Bạn là writer chuyên nghiệp, giỏi biến các
    khái niệm kỹ thuật phức tạp thành nội dung dễ hiểu.
    Bạn viết bằng tiếng Việt tự nhiên, hấp dẫn.""",
    allow_delegation=False,
    verbose=True
)

editor = Agent(
    role="Chief Editor",
    goal="Review và hoàn thiện bài viết đạt chuẩn xuất bản",
    backstory="""Bạn là tổng biên tập với con mắt sắc bén,
    chuyên kiểm tra logic, grammar, và flow của bài viết.""",
    allow_delegation=False,
    verbose=True
)

# --- 2. DEFINE TASKS ---
research_task = Task(
    description="""
    Nghiên cứu 5 xu hướng AI quan trọng nhất năm 2026.
    Tập trung vào: agentic AI, multimodal, edge AI, AI governance.
    Thu thập data points và ví dụ thực tế.
    """,
    expected_output="""
    Báo cáo nghiên cứu có cấu trúc gồm:
    - 5 xu hướng, mỗi xu hướng có: tên, mô tả, impact, ví dụ
    - Dữ liệu thống kê hỗ trợ
    """,
    agent=researcher
)

writing_task = Task(
    description="""
    Dựa trên kết quả nghiên cứu, viết blog post 1000 từ bằng tiếng Việt.
    Tone: chuyên nghiệp nhưng dễ hiểu. Format: Markdown.
    """,
    expected_output="Blog post 1000 từ format markdown, tiếng Việt",
    agent=writer,
    context=[research_task]  # Input từ research_task
)

editing_task = Task(
    description="""
    Review bài viết: kiểm tra logic, grammar, flow.
    Sửa lỗi và thêm finishing touches.
    """,
    expected_output="Bài viết hoàn chỉnh, sẵn sàng xuất bản",
    agent=editor,
    context=[writing_task]
)

# --- 3. ASSEMBLE CREW ---
content_crew = Crew(
    agents=[researcher, writer, editor],
    tasks=[research_task, writing_task, editing_task],
    process=Process.sequential,  # Chạy tuần tự
    verbose=True
)

# --- 4. KICKOFF ---
result = content_crew.kickoff()
print(result)
```

#### 5.4.2 Advanced: Hierarchical Process

```python
# =========================================
# CrewAI — Hierarchical Process (Manager-based)
# =========================================
from crewai import Agent, Task, Crew, Process

# Manager agent sẽ tự động delegate
manager = Agent(
    role="Project Manager",
    goal="Điều phối team hoàn thành dự án đúng deadline",
    backstory="PM dày dặn kinh nghiệm, biết phân công đúng người đúng việc"
)

analyst = Agent(
    role="Data Analyst",
    goal="Phân tích dữ liệu và tạo insights",
    backstory="Chuyên gia phân tích với 10 năm kinh nghiệm"
)

developer = Agent(
    role="Full-stack Developer",
    goal="Implement solution dựa trên requirements",
    backstory="Senior dev thông thạo Python, React, và cloud"
)

# Tasks KHÔNG gán agent cụ thể → Manager sẽ delegate
task_analyze = Task(
    description="Phân tích dataset sales Q2 2026, tìm patterns",
    expected_output="Report với 3 key insights"
)

task_build = Task(
    description="Xây dashboard hiển thị insights từ phân tích",
    expected_output="Dashboard code sẵn sàng deploy",
    context=[task_analyze]
)

# Hierarchical: Manager delegate tasks
crew = Crew(
    agents=[analyst, developer],
    tasks=[task_analyze, task_build],
    process=Process.hierarchical,
    manager_agent=manager,
    verbose=True
)

result = crew.kickoff()
```

#### 5.4.3 Production: CrewAI Flows

```python
# =========================================
# CrewAI — Flows (Production Orchestration)
# =========================================
from crewai.flow.flow import Flow, listen, start, router
from pydantic import BaseModel
from typing import Optional

# --- STRUCTURED STATE ---
class ContentPipelineState(BaseModel):
    topic: str = ""
    research: str = ""
    draft: str = ""
    review_result: Optional[str] = None
    is_approved: bool = False
    revision_count: int = 0

class ContentPipelineFlow(Flow[ContentPipelineState]):
    """Flow-based orchestration với state management"""

    @start()
    def receive_topic(self):
        """Entry point: nhận topic từ user"""
        self.state.topic = "AI Agent Frameworks 2026"
        return self.state.topic

    @listen(receive_topic)
    def research_phase(self, topic):
        """Phase 1: Research"""
        # Có thể gọi CrewAI Crew ở đây
        research_crew = create_research_crew(topic)
        self.state.research = research_crew.kickoff()

    @listen(research_phase)
    def writing_phase(self):
        """Phase 2: Writing"""
        writing_crew = create_writing_crew(self.state.research)
        self.state.draft = writing_crew.kickoff()

    @router(writing_phase)
    def review_router(self):
        """Router: quyết định approve hay revise"""
        if self.state.revision_count >= 3:
            return "force_publish"  # Max 3 revisions
        review_crew = create_review_crew(self.state.draft)
        result = review_crew.kickoff()
        if "APPROVED" in result:
            return "publish"
        else:
            self.state.revision_count += 1
            return "revise"

    @listen("revise")
    def revision_phase(self):
        """Revise draft → quay lại router"""
        revision_crew = create_revision_crew(
            self.state.draft,
            self.state.review_result
        )
        self.state.draft = revision_crew.kickoff()

    @listen("publish")
    @listen("force_publish")
    def publish_phase(self):
        """Final: publish"""
        print(f"✅ Published! Revisions: {self.state.revision_count}")
        return self.state.draft

# Run flow
flow = ContentPipelineFlow()
result = flow.kickoff()
```

### 5.5 YAML Configuration (Best Practice)

```yaml
# config/agents.yaml
researcher:
  role: "Senior AI Researcher"
  goal: "Tìm và phân tích xu hướng AI mới nhất"
  backstory: >
    Bạn là nhà nghiên cứu AI hàng đầu,
    có kinh nghiệm 20 năm trong ML.
  allow_delegation: false
  max_iter: 8
  max_execution_time: 300

writer:
  role: "Tech Content Writer"
  goal: "Viết bài blog chất lượng cao"
  backstory: >
    Writer chuyên nghiệp, giỏi biến
    khái niệm phức tạp thành dễ hiểu.
  allow_delegation: false
  max_iter: 5
```

```yaml
# config/tasks.yaml
research_task:
  description: "Nghiên cứu 5 xu hướng AI 2026"
  expected_output: "Báo cáo có cấu trúc"
  agent: researcher

writing_task:
  description: "Viết blog 1000 từ tiếng Việt"
  expected_output: "Blog post markdown"
  agent: writer
  context:
    - research_task
```

### 5.6 Khi Nào Dùng CrewAI?

✅ **NÊN dùng khi:**
- Cần prototype multi-agent system **nhanh** (hours, not days)
- Use case dạng "team cộng tác": content pipeline, research team
- Muốn mental model "công ty" — dễ hiểu, dễ debug
- Rapid prototyping → validate idea trước

❌ **KHÔNG NÊN dùng khi:**
- Cần control granular từng bước → LangGraph
- Bottleneck là data/retrieval → LlamaIndex
- Ứng dụng đơn giản, 1 agent đủ → LCEL chain

---

## 6. So Sánh Chi Tiết 4 Framework

### 6.1 Ma Trận So Sánh Tổng Hợp

| Tiêu chí                  | LangChain        | LangGraph         | LlamaIndex        | CrewAI            |
|:-------------------------- |:---------------- |:------------------ |:------------------ |:----------------- |
| **Vai trò chính**          | Toolkit/SDK      | Orchestration      | Data/RAG           | Multi-Agent       |
| **Abstraction level**      | Medium           | Low-Medium         | High               | High              |
| **Learning curve**         | Medium           | High               | Low-Medium         | Low               |
| **Thời gian prototype**    | Hours            | Days               | Hours              | Hours             |
| **Production readiness**   | ⭐⭐⭐⭐          | ⭐⭐⭐⭐⭐           | ⭐⭐⭐⭐            | ⭐⭐⭐             |
| **State management**       | Basic            | Advanced           | Workflow-level     | Flow-level        |
| **Multi-agent**            | Via LangGraph    | First-class        | Workflow agents    | First-class       |
| **RAG capabilities**       | Good             | Indirect           | Excellent          | Via tools         |
| **Human-in-the-loop**      | Via LangGraph    | Built-in           | Manual             | Flow-based        |
| **Observability**          | LangSmith        | LangSmith          | OpenInference      | Control Plane     |
| **Integrations**           | 600+             | Inherits LC        | 150+ connectors    | Growing           |
| **Cyclic workflows**       | No               | Yes                | Workflow events    | Via Flows         |
| **Persistence**            | Memory modules   | Checkpointer+Store | Index persistence  | State models      |

### 6.2 Decision Matrix — Chọn Framework Nào?

```
                    ┌─────────────────────────────────────────┐
                    │         BẠN CẦN GÌ NHẤT?               │
                    └────────────────┬────────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
     ┌────────────────┐   ┌──────────────────┐   ┌────────────────┐
     │ Multi-Agent    │   │ Data/RAG         │   │ Complex        │
     │ Team nhanh?    │   │ Quality?         │   │ Orchestration? │
     └───────┬────────┘   └────────┬─────────┘   └───────┬────────┘
             │                     │                      │
             ▼                     ▼                      ▼
      ┌──────────────┐    ┌───────────────┐     ┌──────────────────┐
      │   CrewAI     │    │  LlamaIndex   │     │   LangGraph      │
      │              │    │               │     │                  │
      │ Prototype    │    │ 150+ sources  │     │ Stateful graphs  │
      │ Role-based   │    │ Property Graph│     │ HITL, Loops      │
      │ Flows        │    │ LlamaParse    │     │ Checkpointing    │
      └──────────────┘    └───────────────┘     └──────────────────┘

                    ┌─────────────────────────────────────────┐
                    │  Tất cả đều dùng LangChain làm base!    │
                    └─────────────────────────────────────────┘
```

### 6.3 Use Cases Mapping

| Use Case                              | Best Choice       | Why?                                         |
|:-------------------------------------- |:----------------- |:-------------------------------------------- |
| Chatbot đơn giản                       | LangChain (LCEL)  | Pipeline tuyến tính, không cần phức tạp      |
| RAG trên 1000+ PDFs                    | LlamaIndex        | Parsing, chunking, retrieval tối ưu          |
| Content creation pipeline              | CrewAI             | Team (researcher→writer→editor) trực quan    |
| Customer support agent                 | LangGraph          | State management, HITL, tool calling          |
| Financial trading analysis             | LangGraph          | High reliability, checkpointing              |
| Research assistant tự động             | CrewAI + LlamaIndex| Crew cho collaboration, LlamaIndex cho RAG   |
| Enterprise document Q&A               | LlamaIndex         | Property Graph, agentic document processing  |
| Multi-step approval workflow           | LangGraph          | HITL gates, persistence, branching           |
| Quick MVP / demo                       | CrewAI             | Fastest time-to-demo                          |
| Production-grade complex system        | LangGraph + LlamaIndex | Graph orchestration + data retrieval     |

---

## 7. Kiến Trúc Hybrid Production-Ready

### 7.1 Recommended Architecture

Trong production 2026, các team thường dùng **hybrid approach**:

```
┌──────────────────────────────────────────────────────────────────────┐
│                PRODUCTION HYBRID ARCHITECTURE                        │
│                                                                      │
│  ┌─────────── API Gateway (FastAPI) ──────────────┐                 │
│  │                                                 │                 │
│  │  ┌───────────────────────────────────────────┐  │                 │
│  │  │         CONTROL PLANE (LangGraph)         │  │                 │
│  │  │                                           │  │                 │
│  │  │  ┌─────────┐  ┌──────────┐  ┌─────────┐  │  │                 │
│  │  │  │ Router  │─▶│ Agent    │─▶│ Review  │  │  │                 │
│  │  │  │ Node    │  │ Node     │  │ Node    │  │  │                 │
│  │  │  └─────────┘  └────┬─────┘  └─────────┘  │  │                 │
│  │  │                    │                      │  │                 │
│  │  └────────────────────┼──────────────────────┘  │                 │
│  │                       │                          │                 │
│  │  ┌────────────────────┼──────────────────────┐  │                 │
│  │  │    DATA PLANE (LlamaIndex)                │  │                 │
│  │  │                    │                      │  │                 │
│  │  │  ┌─────────────────▼──────────────────┐   │  │                 │
│  │  │  │  LlamaParse → Index → Retriever    │   │  │                 │
│  │  │  │  Property Graph │ Vector Store     │   │  │                 │
│  │  │  └────────────────────────────────────┘   │  │                 │
│  │  └───────────────────────────────────────────┘  │                 │
│  │                                                 │                 │
│  │  ┌───────────────────────────────────────────┐  │                 │
│  │  │    EXECUTION LAYER (CrewAI) [optional]    │  │                 │
│  │  │  Specialized agent crews as LangGraph     │  │                 │
│  │  │  nodes for complex, role-based tasks      │  │                 │
│  │  └───────────────────────────────────────────┘  │                 │
│  └─────────────────────────────────────────────────┘                 │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ LangSmith    │  │ PostgreSQL   │  │ Redis / Message Queue    │   │
│  │ Observability│  │ Checkpoints  │  │ Async tasks              │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### 7.2 Layer Responsibilities

| Layer              | Framework    | Trách nhiệm                                           |
|:------------------ |:------------ |:------------------------------------------------------ |
| **Control Plane**  | LangGraph    | State management, routing, HITL, error recovery        |
| **Data Plane**     | LlamaIndex   | Ingestion, indexing, retrieval, document parsing        |
| **Execution**      | CrewAI       | Role-based tasks, specialized agent teams              |
| **Toolkit**        | LangChain    | LLM abstractions, tool wrappers, prompt templates      |
| **Observability**  | LangSmith    | Tracing, debugging, evaluation metrics                 |

### 7.3 Integration Example

```python
# =========================================
# Hybrid: LangGraph + LlamaIndex + CrewAI
# =========================================
from langgraph.graph import StateGraph, START, END
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from crewai import Agent, Task, Crew, Process

# --- LLAMAINDEX: Data Plane ---
documents = SimpleDirectoryReader("knowledge_base").load_data()
index = VectorStoreIndex.from_documents(documents)
retriever = index.as_retriever(similarity_top_k=5)

# --- CREWAI: Execution Layer ---
def run_analysis_crew(data: str) -> str:
    analyst = Agent(role="Analyst", goal="Analyze data", backstory="Expert analyst")
    task = Task(description=f"Analyze: {data}", expected_output="Analysis report", agent=analyst)
    crew = Crew(agents=[analyst], tasks=[task], process=Process.sequential)
    return crew.kickoff()

# --- LANGGRAPH: Control Plane ---
class AppState(TypedDict):
    query: str
    context: str
    analysis: str
    response: str

def retrieve_node(state: AppState):
    """Node 1: LlamaIndex retrieval"""
    results = retriever.retrieve(state["query"])
    context = "\n".join([r.text for r in results])
    return {"context": context}

def analyze_node(state: AppState):
    """Node 2: CrewAI analysis"""
    analysis = run_analysis_crew(state["context"])
    return {"analysis": analysis}

def respond_node(state: AppState):
    """Node 3: Generate final response"""
    llm = ChatOpenAI(model="gpt-4o")
    response = llm.invoke(
        f"Context: {state['context']}\n"
        f"Analysis: {state['analysis']}\n"
        f"Question: {state['query']}"
    )
    return {"response": response.content}

# Build graph
workflow = StateGraph(AppState)
workflow.add_node("retrieve", retrieve_node)
workflow.add_node("analyze", analyze_node)
workflow.add_node("respond", respond_node)

workflow.add_edge(START, "retrieve")
workflow.add_edge("retrieve", "analyze")
workflow.add_edge("analyze", "respond")
workflow.add_edge("respond", END)

app = workflow.compile()
```

---

## 8. Lộ Trình Học Tập (Learning Roadmap)

### 8.1 Phase 1: Foundation (Tuần 1-2)

```
┌─────────────────────────────────────────────────────────┐
│  PHASE 1: NỀN TẢNG                                     │
│                                                         │
│  📚 Kiến thức nền:                                      │
│  ├── Python async/await                                 │
│  ├── LLM APIs (OpenAI, Anthropic)                       │
│  ├── Vector databases basics                            │
│  └── Embeddings & similarity search                     │
│                                                         │
│  🔧 Thực hành:                                          │
│  ├── LangChain: LCEL basics, simple chains              │
│  ├── LlamaIndex: Basic RAG pipeline                     │
│  └── Tool: Set up OpenAI API key, LangSmith             │
│                                                         │
│  📝 Projects:                                           │
│  ├── Simple chatbot (LangChain LCEL)                    │
│  └── Q&A over your documents (LlamaIndex)               │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Phase 2: Intermediate (Tuần 3-4)

```
┌─────────────────────────────────────────────────────────┐
│  PHASE 2: NÂNG CAO CƠ BẢN                              │
│                                                         │
│  📚 Kiến thức:                                          │
│  ├── State machines & graph theory basics               │
│  ├── Multi-agent systems concepts                       │
│  ├── RAG optimization techniques                        │
│  └── Prompt engineering advanced                        │
│                                                         │
│  🔧 Thực hành:                                          │
│  ├── LangGraph: ReAct agent with tools                  │
│  ├── LlamaIndex: Custom chunking + Property Graph       │
│  ├── CrewAI: Basic Crew (Research + Write)              │
│  └── LangSmith: Tracing & debugging                     │
│                                                         │
│  📝 Projects:                                           │
│  ├── Research agent (LangGraph + tools)                 │
│  ├── Multi-doc RAG (LlamaIndex + persistent index)      │
│  └── Content pipeline (CrewAI 3-agent crew)             │
└─────────────────────────────────────────────────────────┘
```

### 8.3 Phase 3: Advanced (Tuần 5-6)

```
┌─────────────────────────────────────────────────────────┐
│  PHASE 3: CHUYÊN SÂU                                   │
│                                                         │
│  📚 Kiến thức:                                          │
│  ├── Supervisor & hierarchical patterns                 │
│  ├── Checkpointing & persistence strategies             │
│  ├── Event-driven architectures                         │
│  └── Context engineering                                │
│                                                         │
│  🔧 Thực hành:                                          │
│  ├── LangGraph: Multi-agent supervisor, HITL            │
│  ├── LlamaIndex: Agentic Workflows, LlamaParse          │
│  ├── CrewAI: Flows + hierarchical process               │
│  └── Hybrid: LangGraph + LlamaIndex integration         │
│                                                         │
│  📝 Projects:                                           │
│  ├── Customer support agent (LangGraph + HITL)          │
│  ├── Enterprise knowledge base (LlamaIndex Workflows)   │
│  └── Content factory (CrewAI Flows + multiple crews)    │
└─────────────────────────────────────────────────────────┘
```

### 8.4 Phase 4: Production (Tuần 7-8)

```
┌─────────────────────────────────────────────────────────┐
│  PHASE 4: PRODUCTION                                    │
│                                                         │
│  📚 Kiến thức:                                          │
│  ├── Microservices architecture for agents               │
│  ├── Cost optimization & model routing                   │
│  ├── Security & compliance                               │
│  └── Evaluation frameworks (RAGAS, custom metrics)       │
│                                                         │
│  🔧 Thực hành:                                          │
│  ├── Deploy: FastAPI + LangGraph as service              │
│  ├── Monitor: LangSmith production tracing               │
│  ├── Evaluate: RAGAS + custom eval suites                │
│  └── Optimize: Cost tracking, model routing              │
│                                                         │
│  📝 Projects:                                           │
│  ├── Full hybrid system (LangGraph + LlamaIndex + CrewAI)│
│  ├── Production deployment with observability            │
│  └── A/B testing different agent strategies              │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Production Best Practices

### 9.1 Architecture Principles

| Principle                          | Giải thích                                                  |
|:---------------------------------- |:----------------------------------------------------------- |
| **Start simple, scale gradually**  | 80% use cases cần 1 agent. Chỉ multi-agent khi thực sự cần |
| **Decouple data from logic**       | LlamaIndex cho data, LangGraph cho logic — không mix        |
| **Treat agents as microservices**  | Wrap trong FastAPI, không chạy như scripts                   |
| **Context engineering > model**    | Quản lý context window quan trọng hơn chọn model            |
| **Guardrails everywhere**          | `max_iter`, `max_execution_time`, cost ceilings              |

### 9.2 State Management Rules

```python
# ❌ WRONG: State quá lớn
class BadState(TypedDict):
    all_messages: list           # Unbounded! → OOM
    full_documents: list[str]    # Quá nặng
    raw_api_responses: list      # Không cần thiết

# ✅ RIGHT: State lean & focused
class GoodState(TypedDict):
    messages: Annotated[list, operator.add]  # Với reducer
    summary: str                              # Chỉ giữ summary
    current_step: str                         # Tracking
    error_count: int                          # Giới hạn retries
```

### 9.3 Cost Optimization

```python
# Model routing: dùng model rẻ cho tasks đơn giản
MODELS = {
    "simple":   "gpt-4o-mini",     # Cheap: routing, classification
    "standard": "gpt-4o",          # Mid: analysis, writing
    "complex":  "claude-opus-4",   # Premium: complex reasoning
}

def select_model(task_complexity: str):
    return ChatOpenAI(model=MODELS[task_complexity])
```

### 9.4 Error Handling & Recovery

```python
# LangGraph: built-in retry pattern
def resilient_node(state):
    try:
        result = risky_operation(state)
        return {"result": result, "error_count": 0}
    except Exception as e:
        error_count = state.get("error_count", 0) + 1
        if error_count >= 3:
            return {"result": "FALLBACK_RESPONSE", "error_count": error_count}
        return {"error_count": error_count}  # → retry via conditional edge
```

### 9.5 Security Checklist

- [ ] **Input validation:** Sanitize user inputs trước khi đưa vào prompts
- [ ] **Tool sandboxing:** Giới hạn quyền của tools (filesystem, network)
- [ ] **Rate limiting:** Limit LLM calls per user/session
- [ ] **Cost ceiling:** Set max token budget per request
- [ ] **Audit logging:** Log tất cả agent decisions & tool calls
- [ ] **PII filtering:** Mask sensitive data trước khi gửi LLM

---

## 10. Tài Nguyên & Tham Khảo

### 10.1 Official Documentation

| Resource                  | URL                                      |
|:------------------------- |:---------------------------------------- |
| LangChain Docs            | https://python.langchain.com/docs/       |
| LangGraph Docs            | https://langchain-ai.github.io/langgraph/|
| LlamaIndex Docs           | https://docs.llamaindex.ai/              |
| CrewAI Docs               | https://docs.crewai.com/                 |
| LangSmith                 | https://smith.langchain.com/             |

### 10.2 Learning Platforms

| Platform                  | Nội dung                                 |
|:------------------------- |:---------------------------------------- |
| LangChain Academy         | Free courses: LangGraph essentials       |
| Real Python               | LlamaIndex & LangGraph tutorials         |
| DeepLearning.AI           | Andrew Ng's LLM courses                  |
| LlamaIndex Bootcamp       | Official workshop series                  |

### 10.3 Key Packages (pip install)

```bash
# Core frameworks
pip install langchain langchain-openai langchain-anthropic
pip install langgraph
pip install llama-index
pip install crewai

# Observability
pip install langsmith

# Vector stores
pip install chromadb faiss-cpu

# Advanced
pip install llama-parse              # Document parsing
pip install langgraph-checkpoint-sqlite  # Persistence
```

### 10.4 Community & Support

| Channel         | Link                                       |
|:--------------- |:------------------------------------------ |
| LangChain Discord | discord.gg/langchain                     |
| LlamaIndex Discord | discord.gg/llamaindex                   |
| CrewAI Discord  | discord.gg/crewai                          |
| Reddit r/LangChain | reddit.com/r/LangChain                 |

---

## 📊 Tóm Tắt — 1 Slide Decision Guide

```
╔══════════════════════════════════════════════════════════════════╗
║                    CHỌN FRAMEWORK NÀO?                          ║
║                                                                  ║
║  "Tôi cần RAG chất lượng cao"          → LlamaIndex             ║
║  "Tôi cần multi-agent nhanh"           → CrewAI                 ║
║  "Tôi cần production reliability"      → LangGraph              ║
║  "Tôi cần kết nối nhiều providers"     → LangChain              ║
║  "Tôi cần tất cả"                      → Hybrid Architecture    ║
║                                                                  ║
║  ┌──────────────────────────────────────────────────────────┐   ║
║  │  LlamaIndex (Data) + LangGraph (Brain) + CrewAI (Team)  │   ║
║  │                    on LangChain (SDK)                    │   ║
║  └──────────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════╝
```

---

> **Ghi chú:** Tài liệu này phản ánh tình trạng ecosystem tính đến **tháng 7/2026**. Các framework này đang phát triển nhanh chóng — hãy luôn kiểm tra documentation chính thức cho API mới nhất.












LangChain — LCEL, modular packages, code examples (basic chain + RAG chain)
LangGraph — Nodes/Edges/State, ReAct agent, Supervisor pattern, HITL, checkpointing
LlamaIndex — 5-stage RAG pipeline, Property Graph Index, Agentic Workflows, LlamaParse
CrewAI — Agents/Tasks/Crew, hierarchical process, Flows production orchestration
So sánh chi tiết — Ma trận 13 tiêu chí + decision matrix + use case mapping
Kiến trúc Hybrid — Production architecture: LangGraph (brain) + LlamaIndex (data) + CrewAI (execution)
Lộ trình học 8 tuần — Từ foundation → production
Production best practices — State management, cost optimization, security checklist



# AI Agent Frameworks — Research Summary

> Nghiên cứu chuyên sâu: LangChain · LangGraph · LlamaIndex · CrewAI

Full document: [ai_agent_frameworks_deep_dive.md](file:///home/nguyentthai96/Desktop/bigbang/research_docs/ai_agent_frameworks_deep_dive.md)

---

## Quick Decision Guide

| Nhu cầu | Framework | Lý do |
|:--------|:----------|:------|
| RAG chất lượng cao, xử lý documents | **LlamaIndex** | Parsing, chunking, retrieval tối ưu. 150+ data connectors |
| Multi-agent prototype nhanh | **CrewAI** | Role-based, trực quan. Fastest time-to-demo |
| Production reliability, stateful workflows | **LangGraph** | Directed graphs, checkpointing, HITL, loops |
| Kết nối nhiều LLM providers | **LangChain** | 600+ integrations, unified interface |
| Tất cả | **Hybrid Architecture** | LlamaIndex (Data) + LangGraph (Brain) + CrewAI (Team) on LangChain (SDK) |

## Architecture Overview

```
CrewAI (Execution) + LangGraph (Control) + LlamaIndex (Data)
                    ↕
              LangChain (Toolkit)
```

## Key Relationships (2026)

- **LangChain + LangGraph** = Unified stack (v1.0, Oct 2025). LangChain = components, LangGraph = runtime
- **LlamaIndex** = Independent. Best for data plane. Can integrate with LangGraph as retrieval nodes
- **CrewAI** = Independent. Can be embedded as LangGraph nodes for role-based execution

## Core Concepts Per Framework

### LangChain
- **LCEL** (pipe operator `|`) for composition
- **Models, Prompts, Memory, Tools, Parsers** as building blocks
- Ecosystem of 600+ integrations

### LangGraph
- **Nodes** (work units) + **Edges** (control flow) + **State** (shared memory)
- **Checkpointers** (short-term) + **Stores** (long-term) for persistence
- **`interrupt()`** for Human-in-the-Loop
- Supervisor pattern for multi-agent

### LlamaIndex
- 5-stage pipeline: Load → Index → Store → Query → Evaluate
- **Property Graph Index** for relationship-rich data
- **LlamaIndex Workflows** for event-driven agentic RAG
- **LlamaParse** for complex document parsing (90%+ accuracy)

### CrewAI
- 5 primitives: **Agent** (role/goal/backstory) + **Task** + **Tool** + **Crew** + **Process**
- **Flows** for production orchestration (decorators: `@start`, `@listen`, `@router`)
- YAML config for separation of concerns

## Learning Roadmap

1. **Week 1-2 (Foundation):** LangChain LCEL + LlamaIndex basic RAG
2. **Week 3-4 (Intermediate):** LangGraph ReAct agent + CrewAI basic crew
3. **Week 5-6 (Advanced):** Multi-agent supervisor + Agentic workflows + Flows
4. **Week 7-8 (Production):** Hybrid architecture + deployment + observability

## Production Rules

1. 80% of use cases need only 1 agent — start simple
2. Always set `max_iter` and `max_execution_time`
3. Treat agents as microservices (FastAPI wrapper)
4. Context engineering > model selection
5. Use LangSmith for observability from day 1

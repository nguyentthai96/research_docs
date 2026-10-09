# React Fiber vs Zustand vs TanStack Query — Nghiên Cứu So Sánh Chi Tiết

> **Ngày tạo**: 2026-07-25  
> **Phạm vi**: Kiến trúc React, Client State Management, Server State Management  
> **Phiên bản**: React 18/19+, Zustand v5, TanStack Query v5

---

## 1. Tổng Quan — Ba Khái Niệm Khác Nhau

> [!IMPORTANT]
> React Fiber, Zustand, và TanStack Query **không phải là 3 thư viện cạnh tranh nhau**. Chúng giải quyết 3 vấn đề hoàn toàn khác nhau và thường được **sử dụng cùng nhau** trong một dự án.

| Tiêu chí | React Fiber | Zustand | TanStack Query |
|:---|:---|:---|:---|
| **Bản chất** | Kiến trúc rendering engine của React | Thư viện quản lý client state | Thư viện quản lý server state |
| **Tầng hoạt động** | Core framework (bên trong React) | Application state layer | Data fetching & caching layer |
| **Giải quyết vấn đề** | Rendering hiệu quả, không block UI | Chia sẻ state giữa components | Đồng bộ data từ API/server |
| **Developer tương tác** | Gián tiếp (qua hooks) | Trực tiếp (tạo store, selectors) | Trực tiếp (queries, mutations) |
| **Bundle size** | 0 KB (built-in React) | ~1.2 KB | ~13 KB |

---

## 2. React Fiber — Engine Bên Trong React

### 2.1. Fiber Là Gì?

React Fiber là **reconciliation engine** (cơ chế hòa giải) được giới thiệu từ React 16, thay thế **Stack Reconciler** cũ. Đây là lõi bên trong React, không phải một thư viện riêng.

**Trước Fiber (Stack Reconciler):**
- Render đồng bộ, đệ quy từ trên xuống
- Một khi bắt đầu render → không thể dừng → **block main thread**
- UI bị đơ khi cây component phức tạp

**Sau Fiber:**
- Mỗi component/element được biểu diễn bằng một **Fiber node** (linked-list)
- Render work được chia thành **nhiều unit nhỏ**
- Có thể **pause, resume, abort** bất kỳ lúc nào
- Ưu tiên **user interaction** trước render nặng

### 2.2. Cách Fiber Reconciliation Hoạt Động

```
┌──────────────────────────────────────────────────┐
│               RENDER PHASE                        │
│  (Asynchronous - Có thể bị interrupt)             │
│                                                   │
│  1. Tạo "work-in-progress" tree                  │
│  2. Diffing: so sánh Virtual DOM cũ vs mới       │
│     - Type khác → rebuild subtree                 │
│     - Key prop → track identity trong list        │
│  3. Đánh dấu effects (update/place/delete)        │
│                                                   │
│  Complexity: O(n) nhờ heuristic                   │
└─────────────────────┬────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────┐
│               COMMIT PHASE                        │
│  (Synchronous - Không bị interrupt)               │
│                                                   │
│  Apply tất cả changes vào Real DOM               │
│  → UI không bao giờ ở trạng thái "nửa vời"       │
└──────────────────────────────────────────────────┘
```

### 2.3. Concurrent Features Được Enable Bởi Fiber

Fiber không chỉ về performance — nó **mở khóa** các tính năng hiện đại:

#### `useTransition` / `startTransition`
Đánh dấu **state update** là non-urgent:

```jsx
const [isPending, startTransition] = useTransition();

const handleSearch = (e) => {
  const value = e.target.value;
  setQuery(value);              // Urgent: input phản hồi ngay
  
  startTransition(() => {
    setFilteredItems(           // Non-urgent: filter chạy nền
      items.filter(item => item.includes(value))
    );
  });
};
```

#### `useDeferredValue`
Đánh dấu **value** là non-urgent (dùng khi không control setter):

```jsx
const deferredQuery = useDeferredValue(query);

const filteredData = useMemo(() => {
  return data.filter(item => item.includes(deferredQuery));
}, [deferredQuery, data]);
```

#### Suspense
Fiber cho phép React "pause" component khi đợi data:

```jsx
<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>
```

#### Automatic Batching
Gom nhiều state updates thành 1 render cycle (mặc định từ React 18).

### 2.4. Ưu Nhược Điểm

| Ưu Điểm | Nhược Điểm |
|:---|:---|
| ✅ UI luôn responsive dù render nặng | ❌ Không phải API trực tiếp — khó debug |
| ✅ Ưu tiên user interaction (typing, clicking) | ❌ `useTransition` giữ 2 bản UI trong memory → tăng RAM |
| ✅ Enable Suspense, Server Components | ❌ Không nên lạm dụng — chỉ dùng khi đo được "input jank" |
| ✅ Automatic batching giảm re-renders | ❌ Learning curve cao cho concurrent patterns |
| ✅ O(n) diffing hiệu quả | |

---

## 3. Zustand — Client State Management

### 3.1. Zustand Là Gì?

Zustand (tiếng Đức: "trạng thái") là thư viện quản lý **client-side state** — state thuộc về UI, không phải data từ server. Ví dụ: theme, modal open/close, auth status, sidebar collapsed.

### 3.2. API Cơ Bản

```typescript
import { create } from 'zustand';

interface BearState {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
}

const useBearStore = create<BearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));

// Sử dụng — KHÔNG cần Provider!
function BearCounter() {
  const bears = useBearStore((state) => state.bears);
  return <h1>{bears} bears around here...</h1>;
}
```

### 3.3. Advanced Patterns

#### Slice Pattern (Chia store thành modules)

```typescript
// bearSlice.ts
const createBearSlice = (set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
});

// fishSlice.ts  
const createFishSlice = (set) => ({
  fishes: 0,
  addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
});

// store.ts — Kết hợp
const useBoundStore = create((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
}));
```

#### Middleware Stack (Thứ tự quan trọng!)

```typescript
import { create } from 'zustand';
import { devtools, persist, immer } from 'zustand/middleware';

// Thứ tự: devtools → persist → immer (ngoài → trong)
const useStore = create<MyState>()(
  devtools(                    // Outermost: log state transitions
    persist(                   // Middle: sync với localStorage
      immer((set) => ({        // Innermost: cho phép mutation syntax
        count: 0,
        increment: () => set((state) => {
          state.count += 1;    // Direct mutation nhờ Immer!
        }),
      })),
      { name: 'my-storage' }
    )
  )
);
```

#### Performance — Atomic Selectors

```typescript
// ❌ BAD — Re-render khi BẤT KỲ state nào thay đổi
const { nuts, honey } = useStore();

// ✅ GOOD — Chỉ re-render khi nuts thay đổi
const nuts = useStore((state) => state.nuts);

// ✅ GOOD — Select nhiều giá trị với useShallow
import { useShallow } from 'zustand/react/shallow';

const { nuts, honey } = useStore(
  useShallow((state) => ({ nuts: state.nuts, honey: state.honey }))
);

// ✅ BEST — Encapsulate thành custom hooks
export const useNuts = () => useStore((s) => s.nuts);
export const useHoney = () => useStore((s) => s.honey);
```

### 3.4. Ưu Nhược Điểm

| Ưu Điểm | Nhược Điểm |
|:---|:---|
| ✅ Zero boilerplate — không cần Provider, Action, Reducer | ❌ Không có cấu trúc enforce — team lớn dễ mất consistency |
| ✅ Bundle size cực nhỏ (~1.2 KB) | ❌ Không có built-in server state (cần kết hợp TanStack Query) |
| ✅ Granular subscriptions — re-render chính xác | ❌ DevTools kém hơn Redux (không có time-travel debugging mạnh) |
| ✅ Dùng được ngoài React (vanilla JS) | ❌ Thiếu tài liệu/conventions cho dự án enterprise cực lớn |
| ✅ Middleware linh hoạt (persist, immer, devtools) | |
| ✅ Không có "Provider Hell" | |
| ✅ TypeScript first-class support | |

### 3.5. Khi Nào Dùng Zustand?

- **Theme/Dark mode** toggle
- **Auth state** (user session, tokens)
- **UI state** (sidebar collapsed, modal open, active tab)
- **Multi-step form** state chia sẻ giữa nhiều component
- **Shopping cart** (kết hợp persist middleware)
- **Bất kỳ client state** cần share giữa components mà Context API quá verbose

---

## 4. TanStack Query (React Query) — Server State Management

### 4.1. TanStack Query Là Gì?

TanStack Query không phải "state manager" truyền thống — nó là **data synchronization layer**. Nó quản lý data từ server: fetching, caching, background refetching, deduplication.

> [!NOTE]
> **Client State** vs **Server State** là sự phân biệt quan trọng nhất:
> - **Client State**: Thuộc về app, đồng bộ, có thể predict (theme, modals)
> - **Server State**: Thuộc về server, bất đồng bộ, có thể stale bất cứ lúc nào (user list, product catalog)

### 4.2. Core Concepts

#### useQuery — Đọc Data

```typescript
import { useQuery } from '@tanstack/react-query';

function TodoList() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['todos'],
    queryFn: () => fetch('/api/todos').then(res => res.json()),
    staleTime: 5 * 60 * 1000,  // 5 phút — data "fresh" trong 5 phút
    gcTime: 10 * 60 * 1000,    // 10 phút — giữ cache 10 phút sau khi inactive
  });

  if (isPending) return <Spinner />;
  if (isError) return <Error message={error.message} />;
  return <ul>{data.map(todo => <li key={todo.id}>{todo.title}</li>)}</ul>;
}
```

#### useMutation — Ghi Data + Optimistic Update

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function AddTodo() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newTodo) => fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify(newTodo),
    }),
    onMutate: async (newTodo) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      
      // 2. Snapshot previous value
      const previousTodos = queryClient.getQueryData(['todos']);
      
      // 3. Optimistic update
      queryClient.setQueryData(['todos'], (old) => [...old, newTodo]);
      
      return { previousTodos }; // Context for rollback
    },
    onError: (err, newTodo, context) => {
      // 4. Rollback on error
      queryClient.setQueryData(['todos'], context.previousTodos);
    },
    onSettled: () => {
      // 5. Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
```

#### useInfiniteQuery — Infinite Scroll / Pagination

```typescript
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
});
```

### 4.3. Stale-While-Revalidate Strategy

```
User request data
        │
        ▼
┌─── Cache có data? ───┐
│                       │
│  YES                  │  NO
│  │                    │  │
│  ▼                    │  ▼
│  Trả cache ngay       │  Fetch từ server
│  (instant UI)         │  (show loading)
│  │                    │
│  ▼                    │
│  staleTime hết?       │
│  │        │           │
│  YES      NO          │
│  │        │           │
│  ▼        ▼           │
│  Refetch  Dùng cache  │
│  (nền)    (fresh)     │
└───────────────────────┘
```

### 4.4. v5 Breaking Changes Quan Trọng

| v4 | v5 | Lý do |
|:---|:---|:---|
| `isLoading` | `isPending` | Chính xác hơn — pending = chưa có cached data |
| `cacheTime` | `gcTime` | Phản ánh đúng chức năng garbage collection |
| Multiple args | Single object | Nhất quán API: `useQuery({ queryKey, queryFn })` |
| `onSuccess/onError` trên `useQuery` | Removed | Tránh side effects trong render cycle |
| Error type `unknown` | Default `Error` | TypeScript an toàn hơn |

### 4.5. Ưu Nhược Điểm

| Ưu Điểm | Nhược Điểm |
|:---|:---|
| ✅ Tự động cache, refetch, deduplication | ❌ Learning curve cho cache invalidation strategy |
| ✅ Stale-while-revalidate — UI luôn có data | ❌ Không phải state manager — cần kết hợp Zustand/Redux cho client state |
| ✅ Optimistic updates với rollback tự động | ❌ Bundle size lớn hơn (~13 KB) |
| ✅ Background refetching — data luôn fresh | ❌ Dễ over-fetch nếu config `staleTime` không đúng |
| ✅ `useInfiniteQuery` cho pagination/infinite scroll | ❌ Phức tạp khi query keys lồng nhau và dependent queries |
| ✅ Suspense first-class (`useSuspenseQuery`) | |
| ✅ Offline support tích hợp | |
| ✅ DevTools riêng (React Query Devtools) | |

### 4.6. Khi Nào Dùng TanStack Query?

- **Bất kỳ API call** nào fetch data từ backend
- **Real-time data** cần background refetching (dashboard, chat)
- **Infinite scroll** (social feeds, product listings)
- **Optimistic updates** (like button, add to cart)
- **Dependent queries** (fetch user → fetch user's orders)
- **Offline-first** applications

---

## 5. So Sánh Tổng Hợp

### 5.1. Bảng So Sánh Chi Tiết

| Tiêu chí | React Fiber | Zustand | TanStack Query |
|:---|:---|:---|:---|
| **Mục đích** | Rendering engine | Client state | Server state |
| **Loại** | Framework internals | Library | Library |
| **Bundle** | 0 KB (React core) | ~1.2 KB | ~13 KB |
| **Learning curve** | Cao (concurrent patterns) | Thấp | Trung bình |
| **Boilerplate** | Không (hooks API) | Rất thấp | Thấp-Trung bình |
| **Provider cần thiết** | Không | Không ✨ | Có (QueryClientProvider) |
| **DevTools** | React DevTools | Redux DevTools (qua middleware) | React Query DevTools |
| **TypeScript** | Built-in | First-class | First-class |
| **SSR support** | Có (Server Components) | Có | Có (hydration) |
| **Middleware/Plugin** | N/A | persist, immer, devtools | Nhiều plugins |
| **Re-render control** | Automatic batching, transitions | Granular selectors | Automatic (query-based) |

### 5.2. Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR REACT APP                            │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │  UI Layer     │    │  Client      │    │  Server      │   │
│  │  (Components) │◄───│  State       │    │  State       │   │
│  │              │    │  (Zustand)   │    │  (TanStack)  │   │
│  └──────┬───────┘    └──────────────┘    └──────┬───────┘   │
│         │                                        │           │
│         │         React Fiber handles            │           │
│         │         ALL rendering below            │           │
│         ▼                                        ▼           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  REACT FIBER ENGINE                     │  │
│  │  • Reconciliation (diffing Virtual DOM)                │  │
│  │  • Concurrent rendering (pause/resume/prioritize)      │  │
│  │  • Commit to Real DOM                                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     ┌─────────────┐
                     │  Browser    │
                     │  Real DOM   │
                     └─────────────┘
```

---

## 6. Decision Framework — Khi Nào Dùng Cái Gì?

### 6.1. Flowchart Quyết Định

```
Bạn cần quản lý state gì?
│
├── Data từ API/Server?
│   └── ✅ TanStack Query (bắt buộc)
│       └── Kết hợp Zustand cho UI state còn lại
│
├── State UI toàn cục? (theme, auth, modals)
│   ├── Dự án nhỏ-vừa → ✅ Zustand
│   └── Dự án enterprise lớn, team 10+ devs → 🤔 Redux Toolkit
│
├── State local cho 1 component?
│   └── ✅ useState / useReducer (KHÔNG cần library)
│
└── UI bị lag khi render nặng?
    └── ✅ useTransition / useDeferredValue (Fiber concurrent features)
```

### 6.2. Modern Stack 2025/2026

> [!TIP]
> **Công thức phổ biến nhất hiện nay:**
> 
> ```
> TanStack Query (server data)  +  Zustand (client state)  +  React hooks (local state)
> ```
> 
> Đây là combo được recommend bởi đa số React community. Nó tách biệt rõ ràng **server state** vs **client state**, giảm complexity so với dùng Redux cho tất cả.

### 6.3. Anti-Patterns — Những Gì KHÔNG Nên Làm

| Anti-Pattern | Vấn đề | Giải pháp |
|:---|:---|:---|
| Lưu API response vào Zustand | Mất caching, refetching, deduplication | Dùng TanStack Query cho server data |
| Dùng Redux cho modal open/close | Over-engineering | Zustand hoặc useState |
| Wrap mọi update trong `startTransition` | Tăng memory, không có lợi nếu không lag | Chỉ dùng khi đo được input jank |
| Dùng Context API cho state phức tạp | Re-render toàn bộ Provider subtree | Zustand với granular selectors |
| Select toàn bộ Zustand store | Re-render khi bất kỳ field thay đổi | Dùng atomic selectors + useShallow |

---

## 7. Code Examples — Kết Hợp Trong Thực Tế

### 7.1. Full Stack Pattern: Todo App

```typescript
// ============================================
// stores/uiStore.ts — Zustand cho Client State
// ============================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarOpen: true,
      toggleTheme: () => set((s) => ({ 
        theme: s.theme === 'light' ? 'dark' : 'light' 
      })),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: 'ui-preferences' }
  )
);

// Custom hooks — encapsulate selectors
export const useTheme = () => useUIStore((s) => s.theme);
export const useSidebarOpen = () => useUIStore((s) => s.sidebarOpen);


// ============================================
// hooks/useTodos.ts — TanStack Query cho Server State  
// ============================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query Key Factory — tổ chức cache keys
export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filters: string) => [...todoKeys.lists(), { filters }] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: number) => [...todoKeys.details(), id] as const,
};

export function useTodos(filter?: string) {
  return useQuery({
    queryKey: todoKeys.list(filter),
    queryFn: () => api.getTodos(filter),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddTodo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.addTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}


// ============================================
// components/TodoPage.tsx — Kết hợp cả hai
// ============================================
function TodoPage() {
  const theme = useTheme();                    // Zustand: client state
  const { data: todos, isPending } = useTodos(); // TanStack: server state
  const addTodo = useAddTodo();                // TanStack: mutation
  
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search); // Fiber: defer heavy filter
  
  const filtered = useMemo(() => 
    todos?.filter(t => t.title.includes(deferredSearch)),
    [todos, deferredSearch]
  );

  return (
    <div data-theme={theme}>
      <input value={search} onChange={e => setSearch(e.target.value)} />
      {isPending ? <Spinner /> : <TodoList items={filtered} />}
      <button onClick={() => addTodo.mutate({ title: 'New Todo' })}>
        Add
      </button>
    </div>
  );
}
```

---

## 8. Kết Luận

### Tóm tắt 1 dòng cho mỗi công nghệ:

| Công nghệ | Một dòng tóm tắt |
|:---|:---|
| **React Fiber** | "Engine bên trong React — bạn không tạo nó, bạn **hưởng lợi** từ nó qua `useTransition`, `Suspense`, concurrent rendering" |
| **Zustand** | "State manager nhẹ nhất, đơn giản nhất cho **client state** — replacement hoàn hảo cho Context API và Redux đơn giản" |
| **TanStack Query** | "Giải pháp **bắt buộc** cho server data — cache, refetch, optimistic update, giúp bạn **xóa 90% useEffect** fetch data" |

### Golden Rule

> [!CAUTION]
> **Đừng dùng một tool cho mọi vấn đề:**
> - Đừng lưu API response vào Zustand → dùng TanStack Query
> - Đừng dùng TanStack Query cho theme/modal state → dùng Zustand  
> - Đừng tự build caching/refetching logic → TanStack Query đã làm hết
> - Đừng wrap mọi thứ trong `startTransition` → chỉ dùng khi thật sự cần

---

## 9. Tài Liệu Tham Khảo

- [React Official Docs — Concurrent Features](https://react.dev/reference/react)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zustand Middleware Docs](https://docs.pmnd.rs/zustand)
- [TanStack Query v5 Migration Guide](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5)

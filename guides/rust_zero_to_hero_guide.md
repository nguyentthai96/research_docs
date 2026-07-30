# 🦀 Rust Programming — Zero to Hero Guide

> **Tác giả**: AI Research Assistant  
> **Ngày tạo**: 2026-07-30  
> **Mục tiêu**: Hướng dẫn toàn diện ngôn ngữ lập trình Rust từ cơ bản đến nâng cao

---

## Mục lục

1. [Những điều cơ bản của Rust](#1-những-điều-cơ-bản-của-rust)
2. [Quyền sở hữu (Ownership)](#2-quyền-sở-hữu-ownership)
3. [Đột biến dữ liệu và Vay mượn quyền sở hữu (Mutability & Borrowing)](#3-đột-biến-dữ-liệu-và-vay-mượn-quyền-sở-hữu)
4. [Packages, Crates và Modules](#4-packages-crates-và-modules)
5. [Enums và Pattern Matching](#5-enums-và-pattern-matching)
6. [Collections](#6-collections)
7. [Xử lý lỗi (Error Handling)](#7-xử-lý-lỗi-error-handling)
8. [Generics và Traits](#8-generics-và-traits)
9. [Ứng dụng CLI đầu tiên](#9-ứng-dụng-cli-đầu-tiên)
10. [Closures](#10-closures)
11. [Iterators](#11-iterators)
12. [Deep Dive: Ownership, Borrowing, References, Result, Option, unwrap(), Lifetime](#12-deep-dive-ownership-borrowing-references-result-option-unwrap-lifetime)
13. [Rustlings — 98 Problems](#13-rustlings--98-problems)
14. [Hệ sinh thái Framework của Rust](#14-hệ-sinh-thái-framework-của-rust)

---

## 1. Những điều cơ bản của Rust

### 1.1 Rust là gì?

Rust là ngôn ngữ lập trình hệ thống (systems programming language) được tạo bởi Mozilla Research, phiên bản 1.0 ra mắt năm 2015. Rust tập trung vào:

- **Memory safety** (an toàn bộ nhớ) — không cần Garbage Collector
- **Concurrency** (xử lý đồng thời) — không có data race
- **Performance** (hiệu suất) — ngang C/C++
- **Zero-cost abstractions** — trừu tượng hóa không tốn chi phí runtime

### 1.2 Cài đặt Rust

```bash
# Cài đặt Rust thông qua rustup (trình quản lý toolchain chính thức)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Kiểm tra version
rustc --version
cargo --version

# Cập nhật Rust
rustup update

# Cài đặt component bổ sung
rustup component add clippy      # Linter
rustup component add rustfmt     # Formatter
```

### 1.3 Hello World

```rust
fn main() {
    println!("Xin chào, Rust! 🦀");
}
```

```bash
# Compile và chạy
rustc main.rs
./main

# Hoặc dùng Cargo (khuyến nghị)
cargo new hello_rust
cd hello_rust
cargo run
```

### 1.4 Biến (Variables)

```rust
fn main() {
    // Biến mặc định là IMMUTABLE (không thể thay đổi)
    let x = 5;
    // x = 6; // ❌ LỖI: cannot assign twice to immutable variable

    // Dùng `mut` để tạo biến có thể thay  -- mutex
    let mut y = 10;
    y = 20; // ✅ OK
    println!("y = {}", y);

    // Shadowing — khai báo lại biến cùng tên
    let z = 5;
    let z = z + 1;      // z = 6 (shadow biến z trước)
    let z = z * 2;      // z = 12
    println!("z = {}", z);

    // Shadowing cho phép đổi kiểu dữ liệu
    let spaces = "   ";          // &str
    let spaces = spaces.len();   // usize — hợp lệ nhờ shadowing
    println!("spaces = {}", spaces);

    // Constants — hằng số, PHẢI khai báo kiểu, luôn immutable
    const MAX_POINTS: u32 = 100_000;
    println!("MAX = {}", MAX_POINTS);
}
```

### 1.5 Kiểu dữ liệu (Data Types)

```rust
fn main() {
    // === SCALAR TYPES (kiểu vô hướng) ===

    // Integers (số nguyên)
    let a: i8 = -128;           // -128 đến 127
    let b: u8 = 255;            // 0 đến 255
    let c: i32 = 2_147_483_647; // Mặc định cho integer
    let d: i64 = 9_223_372_036_854_775_807;
    let e: isize = 100;         // Phụ thuộc kiến trúc (32/64-bit)
    let f: usize = 100;         // Dùng cho index cho arrays

    // Floating-point (số thực)
    let g: f64 = 3.14159;      // Mặc định, chính xác cao (double)
    let h: f32 = 2.71828;      // Ít chính xác hơn (float)

    // Boolean
    let is_active: bool = true;
    let is_deleted = false;     // Type inference

    // Character (ký tự Unicode — 4 bytes)
    let ch: char = '🦀';
    let letter = 'A';

    // === COMPOUND TYPES (kiểu phức hợp) ===

    // Tuple — nhóm các giá trị khác kiểu
    let tup: (i32, f64, char) = (500, 6.4, '🎯');
    let (x, y, z) = tup;                    // Destructuring
    let first = tup.0;                       // Truy cập bằng index
    println!("x={}, y={}, z={}", x, y, z);

    // Array — mảng cố định kích thước, cùng kiểu
    let arr: [i32; 5] = [1, 2, 3, 4, 5];
    let first = arr[0];                      // Truy cập phần tử
    let zeros = [0; 10];                     // [0, 0, 0, ..., 0] (10 phần tử)

    // Rust kiểm tra bounds tại runtime
    // let invalid = arr[10]; // ❌ PANIC: index out of bounds
}
```

### 1.6 Hàm (Functions)

```rust
// Hàm cơ bản
fn greet(name: &str) {
    println!("Xin chào, {}!", name);
}

// Hàm có giá trị trả về
fn add(a: i32, b: i32) -> i32 {
    a + b  // Không có dấu ; → đây là expression, tự động return
}

// Hàm với return sớm
fn find_first_positive(numbers: &[i32]) -> Option<i32> {
    for &num in numbers {
        if num > 0 {
            return Some(num); // Return sớm
        }
    }
    None // Giá trị trả về cuối cùng
}

// Statements vs Expressions
fn demo_expressions() {
    // Statement — thực hiện hành động, KHÔNG trả về giá trị
    let x = 5; // Đây là statement

    // Expression — tính toán và TRẢ VỀ giá trị
    let y = {
        let x = 3;
        x + 1  // ← Expression (không có ;) → trả về 4
    };
    println!("y = {}", y); // y = 4
}

fn main() {
    greet("Rust");
    let sum = add(3, 7);
    println!("Tổng = {}", sum);
    demo_expressions();
}
```

### 1.7 Luồng điều khiển (Control Flow)

```rust
fn main() {
    // if/else — là expression trong Rust!
    let number = 7;
    let description = if number > 5 {
        "lớn"
    } else if number > 0 {
        "nhỏ"
    } else {
        "không dương"
    };
    println!("{} là số {}", number, description);

    // loop — vòng lặp vô hạn
    let mut counter = 0;
    let result = loop {
        counter += 1;
        if counter == 10 {
            break counter * 2; // loop có thể return giá trị qua break
        }
    };
    println!("result = {}", result); // 20

    // Loop labels — đặt tên cho vòng lặp lồng nhau
    let mut count = 0;
    'outer: loop {
        let mut remaining = 10;
        loop {
            if remaining == 9 {
                break;          // Thoát vòng lặp trong
            }
            if count == 2 {
                break 'outer;   // Thoát vòng lặp ngoài
            }
            remaining -= 1;
        }
        count += 1;
    }

    // while
    let mut n = 3;
    while n != 0 {
        println!("{}!", n);
        n -= 1;
    }
    println!("PHÓNG! 🚀");

    // for — duyệt collection (an toàn nhất)
    let arr = [10, 20, 30, 40, 50];
    for element in arr.iter() {
        println!("Giá trị: {}", element);
    }

    // for với range
    for i in 1..=5 {
        // 1, 2, 3, 4, 5 (inclusive)
        print!("{} ", i);
    }
    println!();

    for i in (1..4).rev() {
        // 3, 2, 1 (reverse)
        print!("{} ", i);
    }
}
```

### 1.8 Struct (Cấu trúc)

```rust
// Định nghĩa struct
#[derive(Debug)]  // Cho phép in debug {:?}
struct User {
    username: String,
    email: String,
    age: u32,
    active: bool,
}

// Method — hàm gắn với struct
impl User {
    // Associated function (constructor) — không có &self
    fn new(username: &str, email: &str, age: u32) -> Self {
        User {
            username: String::from(username),
            email: String::from(email),
            age,
            active: true,  // Giá trị mặc định
        }
    }

    // Method — có &self (immutable reference)
    fn display(&self) {
        println!("👤 {} ({}) - {} tuổi",
            self.username, self.email, self.age);
    }

    // Method có thể thay đổi — có &mut self
    fn deactivate(&mut self) {
        self.active = false;
    }

    // Method tiêu thụ ownership — có self (không phải &self)
    fn into_email(self) -> String {
        self.email // Sau khi gọi, `user` không còn sử dụng được
    }
}

// Tuple Struct — struct không đặt tên cho field
struct Color(u8, u8, u8);
struct Point(f64, f64, f64);

// Unit Struct — struct không có field
struct AlwaysEqual;

fn main() {
    let mut user = User::new("nguyentthai96", "thai@example.com", 28);
    user.display();

    user.deactivate();
    println!("Active: {}", user.active);

    // Struct update syntax
    let user2 = User {
        username: String::from("another_user"),
        ..user  // Lấy các field còn lại từ user
    };
    // ⚠️ Sau dòng này, `user.email` đã bị move sang `user2`!

    let color = Color(255, 128, 0);
    println!("R={}, G={}, B={}", color.0, color.1, color.2);
}
```

---

## 2. Quyền sở hữu (Ownership)

### 2.1 Ownership là gì?

Ownership là tính năng **độc đáo nhất** của Rust. Nó cho phép Rust đảm bảo an toàn bộ nhớ mà không cần Garbage Collector.

**Ba quy tắc vàng của Ownership:**

| # | Quy tắc | Giải thích |
|---|---------|------------|
| 1 | Mỗi giá trị có **duy nhất một** owner | Không có chủ sở hữu chung |
| 2 | Tại một thời điểm, chỉ có **một** owner | Ownership có thể chuyển, không chia sẻ |
| 3 | Khi owner ra khỏi scope, giá trị bị **drop** | Tự động giải phóng bộ nhớ |

### 2.2 Stack vs Heap

```
┌─────────────────────────────────────────────────────┐
│                    BỘ NHỚ (Memory)                  │
├──────────────────────┬──────────────────────────────┤
│       STACK          │           HEAP               │
├──────────────────────┼──────────────────────────────┤
│ • Nhanh (LIFO)       │ • Chậm hơn (cấp phát động)  │
│ • Kích thước cố định │ • Kích thước linh hoạt       │
│ • Tự động dọn dẹp    │ • Cần quản lý (Rust dùng    │
│                      │   Ownership để tự động drop) │
│ Ví dụ:               │ Ví dụ:                       │
│ i32, f64, bool, char │ String, Vec<T>, Box<T>       │
│ &str (pointer)       │ HashMap<K,V>                 │
│ Tuples cố định       │ Dữ liệu động                │
└──────────────────────┴──────────────────────────────┘
```

### 2.3 Move Semantics (Di chuyển quyền sở hữu)

```rust
fn main() {
    // === Kiểu trên STACK — Copy (không move) ===
    let x = 5;
    let y = x;     // Copy giá trị, x vẫn hợp lệ
    println!("x={}, y={}", x, y); // ✅ OK

    // === Kiểu trên HEAP — Move ===
    let s1 = String::from("hello");
    let s2 = s1;   // MOVE: s1 chuyển ownership cho s2
    // println!("{}", s1); // ❌ LỖI: value used after move
    println!("{}", s2);    // ✅ OK: s2 là owner mới

    // Minh họa bộ nhớ:
    //
    // TRƯỚC move:
    // s1 ──→ [ptr | len=5 | cap=5] ──→ HEAP: "hello"
    //
    // SAU move:
    // s1 (invalid)
    // s2 ──→ [ptr | len=5 | cap=5] ──→ HEAP: "hello"

    // === Clone — tạo deep copy ===
    let s3 = String::from("world");
    let s4 = s3.clone(); // Deep copy trên heap
    println!("s3={}, s4={}", s3, s4); // ✅ Cả hai đều hợp lệ
}
```

### 2.4 Ownership và Functions

```rust
fn main() {
    let name = String::from("Rust");
    takes_ownership(name);       // name bị MOVE vào function
    // println!("{}", name);     // ❌ LỖI: name đã bị move

    let age = 28;
    makes_copy(age);             // age được COPY (i32 implement Copy)
    println!("age = {}", age);   // ✅ OK: age vẫn hợp lệ

    // Cách lấy lại ownership: return từ function
    let greeting = String::from("Hello");
    let greeting = take_and_give_back(greeting); // Move đi rồi move về
    println!("{}", greeting);    // ✅ OK
}

fn takes_ownership(text: String) {
    println!("Nhận: {}", text);
} // `text` bị drop ở đây → bộ nhớ heap được giải phóng

fn makes_copy(value: i32) {
    println!("Copy: {}", value);
} // `value` ra khỏi scope, nhưng chỉ là copy nên không ảnh hưởng

fn take_and_give_back(text: String) -> String {
    println!("Đang xử lý: {}", text);
    text  // Trả lại ownership cho caller
}
```

### 2.5 Copy Trait vs Move

```rust
// Các kiểu implement Copy trait (tự động copy, không move):
// - Tất cả integer types: i8, i16, i32, i64, i128, isize, u8...
// - Floating-point: f32, f64
// - Boolean: bool
// - Character: char
// - Tuples chứa toàn Copy types: (i32, f64)
// - References: &T (bản thân reference được copy, data thì không)

// Các kiểu KHÔNG implement Copy (sẽ move):
// - String
// - Vec<T>
// - Box<T>
// - Bất kỳ kiểu nào chứa dữ liệu trên heap

#[derive(Debug, Clone, Copy)]  // Có thể derive Copy cho struct đơn giản
struct Point {
    x: f64,
    y: f64,
}

// ❌ KHÔNG thể derive Copy cho struct chứa String
// #[derive(Copy)]
// struct User {
//     name: String,  // String không implement Copy
// }

fn main() {
    let p1 = Point { x: 1.0, y: 2.0 };
    let p2 = p1;  // Copy, không phải move
    println!("p1={:?}, p2={:?}", p1, p2); // ✅ Cả hai đều hợp lệ
}
```

---

## 3. Đột biến dữ liệu và Vay mượn quyền sở hữu

### 3.1 References và Borrowing

Thay vì chuyển ownership, ta có thể **mượn** (borrow) dữ liệu bằng references.

```rust
fn main() {
    let s = String::from("hello");

    // Immutable reference (&T) — mượn chỉ đọc
    let len = calculate_length(&s);  // &s = reference, KHÔNG move
    println!("Độ dài của '{}' là {}", s, len); // ✅ s vẫn hợp lệ

    // Mutable reference (&mut T) — mượn có quyền thay đổi
    let mut greeting = String::from("Hello");
    add_world(&mut greeting);
    println!("{}", greeting); // "Hello, World!"
}

fn calculate_length(s: &String) -> usize {  // s là reference
    s.len()
} // s ra khỏi scope nhưng KHÔNG drop vì nó chỉ là reference

fn add_world(s: &mut String) {
    s.push_str(", World!");
}
```

### 3.2 Quy tắc Borrowing

```rust
fn main() {
    let mut data = String::from("hello");

    // ✅ QUY TẮC 1: Nhiều immutable references đồng thời — OK
    let r1 = &data;
    let r2 = &data;
    println!("{} và {}", r1, r2);
    // r1 và r2 không được sử dụng nữa sau đây (NLL - Non-Lexical Lifetimes)

    // ✅ QUY TẮC 2: Chỉ MỘT mutable reference tại một thời điểm
    let r3 = &mut data;
    r3.push_str(" world");
    println!("{}", r3);

    // ❌ KHÔNG THỂ có mutable + immutable reference cùng lúc
    // let r4 = &data;
    // let r5 = &mut data;
    // println!("{}, {}", r4, r5); // LỖI: cannot borrow as mutable
    //                              // because it is also borrowed as immutable
}
```

```
┌────────────────────────────────────────────────────────┐
│            QUY TẮC BORROWING (VAY MƯỢN)                │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Tại BẤT KỲ thời điểm nào, bạn có thể có:            │
│                                                        │
│    ✅  NHIỀU immutable references (&T)                 │
│         HOẶC                                           │
│    ✅  ĐÚNG MỘT mutable reference (&mut T)            │
│                                                        │
│    ❌  KHÔNG BAO GIỜ có cả hai đồng thời!             │
│                                                        │
│  Tại sao?                                              │
│    → Ngăn chặn DATA RACE tại compile time              │
│    → Data race xảy ra khi:                             │
│      1. Hai+ pointers truy cập cùng dữ liệu           │
│      2. Ít nhất một đang ghi                           │
│      3. Không có cơ chế đồng bộ                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 3.3 Dangling References — Rust ngăn chặn tự động

```rust
// ❌ Rust KHÔNG cho phép dangling reference
// fn dangle() -> &String {
//     let s = String::from("hello");
//     &s  // LỖI: `s` bị drop khi hàm kết thúc
//         // → reference trỏ vào bộ nhớ đã giải phóng
// }

// ✅ Giải pháp: trả về ownership thay vì reference
fn no_dangle() -> String {
    let s = String::from("hello");
    s  // Move ownership ra ngoài
}
```

### 3.4 String Slices (&str)

```rust
fn main() {
    let s = String::from("hello world");

    // Slice = reference đến một phần của String
    let hello: &str = &s[0..5];   // "hello"
    let world: &str = &s[6..11];  // "world"

    // Cú pháp rút gọn
    let hello = &s[..5];          // Từ đầu
    let world = &s[6..];          // Đến cuối
    let full = &s[..];            // Toàn bộ

    let first = first_word(&s);
    println!("Từ đầu tiên: {}", first);
}

fn first_word(s: &str) -> &str {  // Nhận &str thay vì &String (linh hoạt hơn)
    let bytes = s.as_bytes();
    for (i, &byte) in bytes.iter().enumerate() {
        if byte == b' ' {
            return &s[..i];
        }
    }
    s
}
```

---

## 4. Packages, Crates và Modules

### 4.1 Cấu trúc tổ chức code trong Rust

```
┌─────────────────────────────────────────────────┐
│                PACKAGE                           │
│  (Cargo.toml — chứa metadata và dependencies)   │
│                                                  │
│  ┌─────────────────┐  ┌─────────────────┐       │
│  │   Binary Crate   │  │  Library Crate  │       │
│  │   src/main.rs    │  │  src/lib.rs     │       │
│  │   (Chương trình  │  │  (Thư viện,     │       │
│  │    chạy được)    │  │   dùng chung)   │       │
│  └─────────────────┘  └─────────────────┘       │
│                                                  │
│  Một package có thể chứa:                        │
│  • Nhiều binary crates (src/bin/*)                │
│  • Tối đa 1 library crate (src/lib.rs)           │
│  • Ít nhất 1 crate (binary hoặc library)         │
└─────────────────────────────────────────────────┘
```

### 4.2 Tạo Package

```bash
# Tạo binary package (mặc định)
cargo new my_project
# Tạo: src/main.rs, Cargo.toml

# Tạo library package
cargo new my_library --lib
# Tạo: src/lib.rs, Cargo.toml
```

```toml
# Cargo.toml
[package]
name = "my_project"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
```

### 4.3 Modules

```rust
// src/lib.rs

// Khai báo module inline
mod authentication {
    // Mặc định mọi thứ là PRIVATE
    fn hash_password(password: &str) -> String {
        format!("hashed_{}", password) // Private function
    }

    // Dùng `pub` để public
    pub fn login(username: &str, password: &str) -> bool {
        let hashed = hash_password(password);
        println!("Đăng nhập: {} với {}", username, hashed);
        true
    }

    // Module lồng nhau
    pub mod roles {
        pub enum Role {
            Admin,
            User,
            Guest,
        }

        pub fn check_permission(role: &Role) -> bool {
            matches!(role, Role::Admin | Role::User)
        }
    }
}

// Module từ file riêng
mod database;      // Rust tìm: src/database.rs hoặc src/database/mod.rs
mod api;            // Rust tìm: src/api.rs hoặc src/api/mod.rs

// Sử dụng module
pub fn run() {
    authentication::login("admin", "secret123");

    use authentication::roles::Role;
    let role = Role::Admin;
    let has_perm = authentication::roles::check_permission(&role);
    println!("Có quyền: {}", has_perm);
}
```

### 4.4 Cấu trúc thư mục Module

```
my_project/
├── Cargo.toml
└── src/
    ├── main.rs          # Binary crate root
    ├── lib.rs           # Library crate root (optional)
    ├── database/
    │   ├── mod.rs       # Module declaration
    │   ├── connection.rs
    │   └── query.rs
    ├── api/
    │   ├── mod.rs
    │   ├── routes.rs
    │   └── handlers.rs
    └── bin/
        ├── server.rs    # Binary phụ: cargo run --bin server
        └── cli.rs       # Binary phụ: cargo run --bin cli
```

```rust
// src/database/mod.rs
pub mod connection;
pub mod query;

pub use connection::DatabasePool;  // Re-export để dùng ngắn gọn
```

### 4.5 use và pub use (Re-exporting)

```rust
// Cách import
use std::collections::HashMap;
use std::io::{self, Read, Write};   // Nhóm imports

// Glob import (tránh dùng trong production)
use std::collections::*;

// Re-export — cho phép user import đường dẫn ngắn hơn
pub use crate::database::connection::DatabasePool;
// Bây giờ user có thể: use my_project::DatabasePool;
// Thay vì:             use my_project::database::connection::DatabasePool;
```

---

## 5. Enums và Pattern Matching

### 5.1 Enums cơ bản

```rust
// Enum đơn giản
#[derive(Debug)]
enum Direction {
    North,
    South,
    East,
    West,
}

// Enum với dữ liệu (rất mạnh trong Rust!)
#[derive(Debug)]
enum Message {
    Quit,                          // Không có dữ liệu
    Echo(String),                  // Chứa String
    Move { x: i32, y: i32 },      // Chứa named fields (like struct)
    Color(u8, u8, u8),             // Chứa tuple
}

// Enum có thể có methods
impl Message {
    fn call(&self) {
        match self {
            Message::Quit => println!("Thoát chương trình"),
            Message::Echo(text) => println!("Echo: {}", text),
            Message::Move { x, y } => println!("Di chuyển đến ({}, {})", x, y),
            Message::Color(r, g, b) => println!("Màu: RGB({}, {}, {})", r, g, b),
        }
    }
}

fn main() {
    let messages = vec![
        Message::Quit,
        Message::Echo(String::from("Xin chào!")),
        Message::Move { x: 10, y: 20 },
        Message::Color(255, 128, 0),
    ];

    for msg in &messages {
        msg.call();
    }
}
```

### 5.2 Option\<T\> — thay thế null

```rust
// Option được định nghĩa trong standard library:
// enum Option<T> {
//     Some(T),   // Có giá trị
//     None,      // Không có giá trị
// }

fn find_user(id: u32) -> Option<String> {
    match id {
        1 => Some(String::from("Nguyễn Văn A")),
        2 => Some(String::from("Trần Thị B")),
        _ => None,
    }
}

fn main() {
    // Dùng match
    match find_user(1) {
        Some(name) => println!("Tìm thấy: {}", name),
        None => println!("Không tìm thấy user"),
    }

    // Dùng if let (khi chỉ quan tâm một case)
    if let Some(name) = find_user(2) {
        println!("User: {}", name);
    }

    // Các method hữu ích của Option
    let x: Option<i32> = Some(42);

    let val = x.unwrap();           // 42 — PANIC nếu None!
    let val = x.unwrap_or(0);       // 42, hoặc 0 nếu None
    let val = x.unwrap_or_default();// 42, hoặc default của T
    let val = x.expect("Cần có giá trị"); // 42 — PANIC với message tùy chỉnh

    let doubled = x.map(|v| v * 2);           // Some(84)
    let result = x.and_then(|v| Some(v + 1)); // Some(43)

    // is_some() và is_none()
    let y: Option<i32> = None;
    println!("x có giá trị: {}", x.is_some()); // true
    println!("y có giá trị: {}", y.is_some()); // false
}
```

### 5.3 Pattern Matching với match

```rust
fn main() {
    let number = 13;

    // Match phải EXHAUSTIVE — cover tất cả cases
    let description = match number {
        1 => "một",
        2 | 3 | 5 | 7 | 11 | 13 => "số nguyên tố",   // Nhiều giá trị
        14..=19 => "teen",                               // Range
        _ => "khác",                                     // Default (wildcard)
    };
    println!("{} là {}", number, description);

    // Match với destructuring
    let point = (3, -5);
    match point {
        (0, 0) => println!("Gốc tọa độ"),
        (x, 0) => println!("Trên trục x: {}", x),
        (0, y) => println!("Trên trục y: {}", y),
        (x, y) if x > 0 && y > 0 => println!("Góc phần tư I"),  // Match guard
        (x, y) => println!("Tọa độ ({}, {})", x, y),
    }

    // Match với struct
    struct Point { x: i32, y: i32 }
    let p = Point { x: 0, y: 7 };
    match p {
        Point { x: 0, y } => println!("Trên trục y tại {}", y),
        Point { x, y: 0 } => println!("Trên trục x tại {}", x),
        Point { x, y } => println!("({}, {})", x, y),
    }

    // while let — lặp khi pattern match
    let mut stack = vec![1, 2, 3];
    while let Some(top) = stack.pop() {
        println!("Pop: {}", top);
    }

    // let else (Rust 1.65+) — unwrap hoặc diverge
    let config_value = Some("production");
    let Some(env) = config_value else {
        panic!("Config không hợp lệ!");
    };
    println!("Môi trường: {}", env);
}
```

---

## 6. Collections

### 6.1 Vec\<T\> — Vector (mảng động)

```rust
fn main() {
    // Tạo vector
    let mut numbers: Vec<i32> = Vec::new();
    let mut fruits = vec!["🍎", "🍌", "🍊"];  // Macro vec!

    // Thêm phần tử
    numbers.push(1);
    numbers.push(2);
    numbers.push(3);
    fruits.push("🍇");

    // Truy cập phần tử
    let first = &numbers[0];         // Panic nếu out of bounds!
    let second = numbers.get(1);     // Trả về Option<&i32> — an toàn

    match numbers.get(100) {
        Some(val) => println!("Giá trị: {}", val),
        None => println!("Không tồn tại index 100"),
    }

    // Duyệt
    for n in &numbers {
        print!("{} ", n);
    }
    println!();

    // Duyệt và thay đổi
    for n in &mut numbers {
        *n *= 2;  // Dereference để thay đổi giá trị
    }
    println!("{:?}", numbers); // [2, 4, 6]

    // Xóa phần tử
    let last = numbers.pop();        // Option<i32>: Some(6)
    numbers.remove(0);               // Xóa tại index, panic nếu out of bounds
    numbers.retain(|&x| x > 3);     // Giữ lại phần tử thỏa điều kiện

    // Các method hữu ích
    println!("Độ dài: {}", fruits.len());
    println!("Rỗng: {}", fruits.is_empty());
    println!("Chứa 🍎: {}", fruits.contains(&"🍎"));

    // Sorting
    let mut vals = vec![3, 1, 4, 1, 5, 9];
    vals.sort();                     // [1, 1, 3, 4, 5, 9]
    vals.dedup();                    // [1, 3, 4, 5, 9] — loại bỏ liên tiếp trùng

    // Slicing
    let slice = &vals[1..3];         // [3, 4]
}
```

### 6.2 HashMap\<K, V\>

```rust
use std::collections::HashMap;

fn main() {
    // Tạo HashMap
    let mut scores: HashMap<String, i32> = HashMap::new();

    // Thêm cặp key-value
    scores.insert(String::from("Đội Xanh"), 10);
    scores.insert(String::from("Đội Đỏ"), 50);

    // Truy cập
    let team = String::from("Đội Xanh");
    let score = scores.get(&team);  // Option<&i32>
    match score {
        Some(s) => println!("{}: {} điểm", team, s),
        None => println!("Không tìm thấy đội"),
    }

    // Duyệt
    for (key, value) in &scores {
        println!("{}: {}", key, value);
    }

    // Overwrite
    scores.insert(String::from("Đội Xanh"), 25);  // Ghi đè

    // Chỉ insert nếu key chưa tồn tại
    scores.entry(String::from("Đội Vàng")).or_insert(30);
    scores.entry(String::from("Đội Xanh")).or_insert(999); // Không ghi đè

    // Cập nhật dựa trên giá trị cũ
    let text = "hello world wonderful world";
    let mut word_count = HashMap::new();
    for word in text.split_whitespace() {
        let count = word_count.entry(word).or_insert(0);
        *count += 1;
    }
    println!("Đếm từ: {:?}", word_count);
    // {"hello": 1, "world": 2, "wonderful": 1}

    // Tạo từ iterators
    let teams = vec!["Alpha", "Beta"];
    let scores = vec![100, 200];
    let team_scores: HashMap<_, _> = teams.into_iter()
        .zip(scores.into_iter())
        .collect();
    println!("{:?}", team_scores);
}
```

### 6.3 HashSet\<T\> và các Collections khác

```rust
use std::collections::{HashSet, BTreeMap, VecDeque, LinkedList, BinaryHeap};

fn main() {
    // HashSet — tập hợp không trùng lặp
    let mut set = HashSet::new();
    set.insert("Rust");
    set.insert("Go");
    set.insert("Rust");  // Không thêm vì đã tồn tại
    println!("Set: {:?}, size: {}", set, set.len()); // 2 phần tử

    let set_a: HashSet<i32> = [1, 2, 3, 4].into();
    let set_b: HashSet<i32> = [3, 4, 5, 6].into();
    println!("Giao:     {:?}", &set_a & &set_b);     // {3, 4}
    println!("Hợp:      {:?}", &set_a | &set_b);     // {1, 2, 3, 4, 5, 6}
    println!("Hiệu:     {:?}", &set_a - &set_b);     // {1, 2}
    println!("Đối xứng: {:?}", &set_a ^ &set_b);     // {1, 2, 5, 6}

    // BTreeMap — HashMap nhưng keys được sắp xếp
    let mut btree = BTreeMap::new();
    btree.insert(3, "ba");
    btree.insert(1, "một");
    btree.insert(2, "hai");
    for (k, v) in &btree {
        println!("{}: {}", k, v); // In theo thứ tự: 1, 2, 3
    }

    // VecDeque — double-ended queue
    let mut deque = VecDeque::new();
    deque.push_back(1);
    deque.push_front(0);
    println!("Deque: {:?}", deque); // [0, 1]

    // BinaryHeap — max-heap
    let mut heap = BinaryHeap::from(vec![1, 5, 2, 4, 3]);
    println!("Max: {:?}", heap.pop()); // Some(5)
}
```

---

## 7. Xử lý lỗi (Error Handling)

### 7.1 Hai loại lỗi trong Rust

```
┌─────────────────────────────────────────────────────┐
│              XỬ LÝ LỖI TRONG RUST                  │
├──────────────────────┬──────────────────────────────┤
│   Unrecoverable      │     Recoverable              │
│   (Không phục hồi)   │     (Có thể phục hồi)        │
├──────────────────────┼──────────────────────────────┤
│   panic!()           │     Result<T, E>              │
│                      │                               │
│   • Bug logic        │     • File không tồn tại      │
│   • Trạng thái       │     • Kết nối mạng lỗi        │
│     không hợp lệ     │     • Input không hợp lệ      │
│   • Index out of     │     • Parse lỗi                │
│     bounds           │                               │
│                      │                               │
│   → Dừng chương      │     → Xử lý và tiếp tục      │
│     trình ngay       │       hoặc propagate lên      │
└──────────────────────┴──────────────────────────────┘
```

### 7.2 panic! — Lỗi không phục hồi

```rust
fn main() {
    // panic! dừng chương trình ngay lập tức
    // panic!("Có lỗi nghiêm trọng!");

    // Xem backtrace khi panic:
    // RUST_BACKTRACE=1 cargo run

    // Vec truy cập ngoài bounds → implicit panic
    let v = vec![1, 2, 3];
    // v[99]; // thread 'main' panicked at 'index out of bounds'
}
```

### 7.3 Result\<T, E\> — Lỗi có thể phục hồi

```rust
use std::fs::File;
use std::io::{self, Read};

fn main() {
    // Result<T, E> được định nghĩa:
    // enum Result<T, E> {
    //     Ok(T),    // Thành công, chứa giá trị T
    //     Err(E),   // Thất bại, chứa lỗi E
    // }

    // === Cách 1: match ===
    let file_result = File::open("hello.txt");
    let file = match file_result {
        Ok(f) => f,
        Err(error) => match error.kind() {
            io::ErrorKind::NotFound => {
                match File::create("hello.txt") {
                    Ok(f) => f,
                    Err(e) => panic!("Không thể tạo file: {:?}", e),
                }
            }
            other => panic!("Lỗi mở file: {:?}", other),
        },
    };

    // === Cách 2: unwrap() — ngắn gọn nhưng PANIC nếu Err ===
    let file = File::open("hello.txt").unwrap();

    // === Cách 3: expect() — PANIC với message tùy chỉnh ===
    let file = File::open("hello.txt")
        .expect("Không thể mở file hello.txt");

    // === Cách 4: unwrap_or_else() — xử lý lỗi với closure ===
    let file = File::open("hello.txt").unwrap_or_else(|error| {
        if error.kind() == io::ErrorKind::NotFound {
            File::create("hello.txt").unwrap_or_else(|error| {
                panic!("Không thể tạo file: {:?}", error);
            })
        } else {
            panic!("Không thể mở file: {:?}", error);
        }
    });
}
```

### 7.4 Propagating Errors với ? Operator

```rust
use std::fs;
use std::io::{self, Read};

// ? operator — cách ngắn gọn nhất để propagate lỗi
fn read_username_from_file() -> Result<String, io::Error> {
    let mut username = String::new();
    File::open("username.txt")?.read_to_string(&mut username)?;
    Ok(username)
}

// Ngắn hơn nữa
fn read_username_short() -> Result<String, io::Error> {
    fs::read_to_string("username.txt")
}

// ? hoạt động như thế nào?
// - Nếu Result là Ok(val) → unwrap và tiếp tục
// - Nếu Result là Err(e) → return Err(e) từ function hiện tại
// Tương đương với:
fn read_username_manual() -> Result<String, io::Error> {
    let file_result = File::open("username.txt");
    let mut file = match file_result {
        Ok(f) => f,
        Err(e) => return Err(e),  // Return sớm với lỗi
    };
    let mut username = String::new();
    match file.read_to_string(&mut username) {
        Ok(_) => Ok(username),
        Err(e) => Err(e),
    }
}

// ? với Option<T>
fn first_char(text: &str) -> Option<char> {
    text.lines().next()?.chars().next()
}

// ? trong main()
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let content = fs::read_to_string("config.txt")?;
    println!("Config: {}", content);
    Ok(())
}
```

### 7.5 Custom Error Types

```rust
use std::fmt;
use std::num::ParseIntError;

// Custom error enum
#[derive(Debug)]
enum AppError {
    IoError(std::io::Error),
    ParseError(ParseIntError),
    ValidationError(String),
}

// Implement Display trait cho custom error
impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::IoError(e) => write!(f, "Lỗi IO: {}", e),
            AppError::ParseError(e) => write!(f, "Lỗi parse: {}", e),
            AppError::ValidationError(msg) => write!(f, "Lỗi validation: {}", msg),
        }
    }
}

// Implement From trait để tự động convert
impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        AppError::IoError(error)
    }
}

impl From<ParseIntError> for AppError {
    fn from(error: ParseIntError) -> Self {
        AppError::ParseError(error)
    }
}

// Giờ có thể dùng ? thoải mái
fn process_file(path: &str) -> Result<i32, AppError> {
    let content = std::fs::read_to_string(path)?; // Auto-convert io::Error
    let number: i32 = content.trim().parse()?;     // Auto-convert ParseIntError

    if number < 0 {
        return Err(AppError::ValidationError(
            format!("Số phải dương, nhận được: {}", number)
        ));
    }

    Ok(number * 2)
}

// Hoặc dùng thiserror crate (khuyến nghị cho production)
// [dependencies]
// thiserror = "1.0"
//
// use thiserror::Error;
// #[derive(Error, Debug)]
// enum AppError {
//     #[error("Lỗi IO: {0}")]
//     Io(#[from] std::io::Error),
//     #[error("Lỗi parse: {0}")]
//     Parse(#[from] ParseIntError),
//     #[error("Lỗi validation: {0}")]
//     Validation(String),
// }
```

---

## 8. Generics và Traits

### 8.1 Generics — Viết code tổng quát

```rust
// Generic function
fn largest<T: std::cmp::PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in &list[1..] {
        if item > largest {
            largest = item;
        }
    }
    largest
}

// Generic struct
#[derive(Debug)]
struct Point<T> {
    x: T,
    y: T,
}

// Generic struct với nhiều kiểu
#[derive(Debug)]
struct MixedPoint<T, U> {
    x: T,
    y: U,
}

// Implement cho generic struct
impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

// Implement chỉ cho kiểu cụ thể
impl Point<f64> {
    fn distance_from_origin(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}

// Generic method với kiểu khác nhau
impl<T, U> MixedPoint<T, U> {
    fn mixup<V, W>(self, other: MixedPoint<V, W>) -> MixedPoint<T, W> {
        MixedPoint {
            x: self.x,
            y: other.y,
        }
    }
}

// Generic enum (Option và Result chính là generic enum!)
enum MyResult<T, E> {
    Ok(T),
    Err(E),
}

fn main() {
    let numbers = vec![34, 50, 25, 100, 65];
    println!("Lớn nhất: {}", largest(&numbers));

    let chars = vec!['y', 'm', 'a', 'q'];
    println!("Lớn nhất: {}", largest(&chars));

    let integer_point = Point { x: 5, y: 10 };
    let float_point = Point { x: 1.0, y: 4.0 };
    println!("Khoảng cách: {}", float_point.distance_from_origin());

    let mixed = MixedPoint { x: 5, y: 10.4 };
    let other = MixedPoint { x: "Hello", y: 'c' };
    let result = mixed.mixup(other);
    println!("result = {:?}", result); // MixedPoint { x: 5, y: 'c' }
}
```

### 8.2 Traits — Hành vi chia sẻ (tương tự Interface)

```rust
// Định nghĩa trait
trait Summary {
    // Method bắt buộc implement
    fn summarize_author(&self) -> String;

    // Method có default implementation
    fn summarize(&self) -> String {
        format!("(Đọc thêm từ {}...)", self.summarize_author())
    }
}

// Struct implement trait
struct NewsArticle {
    title: String,
    author: String,
    content: String,
}

impl Summary for NewsArticle {
    fn summarize_author(&self) -> String {
        self.author.clone()
    }

    fn summarize(&self) -> String {
        format!("{}, bởi {} — {}", self.title, self.author,
            &self.content[..50.min(self.content.len())])
    }
}

struct Tweet {
    username: String,
    content: String,
}

impl Summary for Tweet {
    fn summarize_author(&self) -> String {
        format!("@{}", self.username)
    }
    // Dùng default implementation cho summarize()
}

// Trait làm tham số (3 cách viết)

// Cách 1: impl Trait syntax (ngắn gọn)
fn notify(item: &impl Summary) {
    println!("Breaking: {}", item.summarize());
}

// Cách 2: Trait bound syntax (linh hoạt hơn)
fn notify_verbose<T: Summary>(item: &T) {
    println!("Breaking: {}", item.summarize());
}

// Cách 3: where clause (dễ đọc khi nhiều bounds)
fn notify_where<T>(item: &T)
where
    T: Summary + std::fmt::Display,
{
    println!("Breaking: {}", item.summarize());
}

// Trait làm kiểu trả về
fn create_summarizable() -> impl Summary {
    Tweet {
        username: String::from("rustlang"),
        content: String::from("Rust 2024 edition is here!"),
    }
}

fn main() {
    let article = NewsArticle {
        title: String::from("Penguins Win Championship!"),
        author: String::from("Iceburgh"),
        content: String::from("The Pittsburgh Penguins once again are the best hockey team"),
    };
    notify(&article);

    let tweet = Tweet {
        username: String::from("rustlang"),
        content: String::from("Hello from Rust! 🦀"),
    };
    println!("{}", tweet.summarize()); // Dùng default: "(Đọc thêm từ @rustlang...)"
}
```

### 8.3 Derive Macros — Traits tự động

```rust
#[derive(Debug)]        // In debug: {:?}
#[derive(Clone)]        // .clone()
#[derive(Copy)]         // Copy semantics (chỉ cho stack types)
#[derive(PartialEq)]    // So sánh ==, !=
#[derive(Eq)]           // Quan hệ tương đương
#[derive(PartialOrd)]   // So sánh <, >, <=, >=
#[derive(Ord)]          // Sắp xếp toàn phần
#[derive(Hash)]         // Dùng làm key trong HashMap
#[derive(Default)]      // Giá trị mặc định
struct Example {
    value: i32,
}
```

### 8.4 Trait Objects — Dynamic Dispatch

```rust
// Trait object cho phép lưu nhiều kiểu khác nhau implement cùng trait
trait Animal {
    fn name(&self) -> &str;
    fn sound(&self) -> &str;
}

struct Dog;
struct Cat;

impl Animal for Dog {
    fn name(&self) -> &str { "Chó" }
    fn sound(&self) -> &str { "Gâu gâu" }
}

impl Animal for Cat {
    fn name(&self) -> &str { "Mèo" }
    fn sound(&self) -> &str { "Meo meo" }
}

fn main() {
    // dyn Trait — dynamic dispatch qua vtable
    let animals: Vec<Box<dyn Animal>> = vec![
        Box::new(Dog),
        Box::new(Cat),
    ];

    for animal in &animals {
        println!("{} kêu: {}", animal.name(), animal.sound());
    }
}
```

---

## 9. Ứng dụng CLI đầu tiên

### 9.1 Tạo dự án Todo CLI

```bash
cargo new todo_cli
cd todo_cli
```

```toml
# Cargo.toml
[package]
name = "todo_cli"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

### 9.2 Source Code

```rust
// src/main.rs
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::process;

const TODO_FILE: &str = "todos.json";

#[derive(Debug, Serialize, Deserialize)]
struct Todo {
    id: u32,
    title: String,
    completed: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct TodoList {
    todos: Vec<Todo>,
    next_id: u32,
}

impl TodoList {
    fn new() -> Self {
        TodoList {
            todos: Vec::new(),
            next_id: 1,
        }
    }

    fn load() -> Self {
        match fs::read_to_string(TODO_FILE) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_else(|_| TodoList::new()),
            Err(_) => TodoList::new(),
        }
    }

    fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        let json = serde_json::to_string_pretty(self)?;
        fs::write(TODO_FILE, json)?;
        Ok(())
    }

    fn add(&mut self, title: &str) {
        let todo = Todo {
            id: self.next_id,
            title: title.to_string(),
            completed: false,
        };
        println!("✅ Đã thêm: [{}] {}", todo.id, todo.title);
        self.todos.push(todo);
        self.next_id += 1;
    }

    fn list(&self) {
        if self.todos.is_empty() {
            println!("📋 Danh sách trống! Thêm task bằng: todo add <tên>");
            return;
        }
        println!("\n📋 Danh sách công việc:");
        println!("{:-<45}", "");
        for todo in &self.todos {
            let status = if todo.completed { "✅" } else { "⬜" };
            println!("  {} [{}] {}", status, todo.id, todo.title);
        }
        println!("{:-<45}", "");
        let done = self.todos.iter().filter(|t| t.completed).count();
        println!("  Tiến độ: {}/{}\n", done, self.todos.len());
    }

    fn complete(&mut self, id: u32) {
        match self.todos.iter_mut().find(|t| t.id == id) {
            Some(todo) => {
                todo.completed = true;
                println!("✅ Hoàn thành: [{}] {}", todo.id, todo.title);
            }
            None => println!("❌ Không tìm thấy task #{}", id),
        }
    }

    fn remove(&mut self, id: u32) {
        let len_before = self.todos.len();
        self.todos.retain(|t| t.id != id);
        if self.todos.len() < len_before {
            println!("🗑️  Đã xóa task #{}", id);
        } else {
            println!("❌ Không tìm thấy task #{}", id);
        }
    }
}

fn print_usage() {
    println!("
🦀 Todo CLI — Quản lý công việc bằng Rust

Cách dùng:
  todo add <tên>       Thêm công việc mới
  todo list            Xem danh sách
  todo done <id>       Đánh dấu hoàn thành
  todo remove <id>     Xóa công việc
  todo help            Hiện trợ giúp
");
}

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        print_usage();
        process::exit(1);
    }

    let mut todos = TodoList::load();

    match args[1].as_str() {
        "add" => {
            if args.len() < 3 {
                println!("❌ Vui lòng nhập tên công việc");
                process::exit(1);
            }
            let title = args[2..].join(" ");
            todos.add(&title);
        }
        "list" | "ls" => todos.list(),
        "done" | "complete" => {
            if args.len() < 3 {
                println!("❌ Vui lòng nhập ID");
                process::exit(1);
            }
            match args[2].parse::<u32>() {
                Ok(id) => todos.complete(id),
                Err(_) => {
                    println!("❌ ID phải là số nguyên");
                    process::exit(1);
                }
            }
        }
        "remove" | "rm" => {
            if args.len() < 3 {
                println!("❌ Vui lòng nhập ID");
                process::exit(1);
            }
            match args[2].parse::<u32>() {
                Ok(id) => todos.remove(id),
                Err(_) => {
                    println!("❌ ID phải là số nguyên");
                    process::exit(1);
                }
            }
        }
        "help" | "--help" | "-h" => print_usage(),
        cmd => {
            println!("❌ Lệnh không hợp lệ: '{}'", cmd);
            print_usage();
            process::exit(1);
        }
    }

    if let Err(e) = todos.save() {
        eprintln!("❌ Lỗi lưu file: {}", e);
        process::exit(1);
    }
}
```

```bash
# Chạy ứng dụng
cargo run -- add "Học Rust cơ bản"
cargo run -- add "Làm bài tập Rustlings"
cargo run -- list
cargo run -- done 1
cargo run -- list
cargo run -- remove 2

# Build release
cargo build --release
# Binary: target/release/todo_cli
```

---

## 10. Closures

### 10.1 Closures là gì?

Closures là **anonymous functions** có thể capture biến từ scope bao quanh. Tương tự lambda trong các ngôn ngữ khác nhưng với hệ thống ownership của Rust.

```rust
fn main() {
    // === Cú pháp Closure ===
    let add = |a: i32, b: i32| -> i32 { a + b };    // Đầy đủ
    let add = |a, b| a + b;                           // Rút gọn (type inference)
    let greet = || println!("Xin chào!");             // Không tham số
    let double = |x| x * 2;                           // Một tham số

    println!("3 + 5 = {}", add(3, 5));
    greet();
    println!("double(7) = {}", double(7));

    // === Capture biến từ environment ===
    let name = String::from("Rust");
    let threshold = 10;

    // Borrow immutable (Fn trait)
    let greet_name = || println!("Xin chào, {}!", name);
    greet_name();
    println!("name vẫn dùng được: {}", name); // ✅

    // Borrow mutable (FnMut trait)
    let mut count = 0;
    let mut increment = || {
        count += 1;
        println!("Count: {}", count);
    };
    increment();
    increment();
    // println!("{}", count); // ❌ count đang bị mutable borrow bởi closure

    // Move ownership (FnOnce trait)
    let data = vec![1, 2, 3];
    let consume = move || {
        println!("Data: {:?}", data);
        // data bị move vào closure
    };
    consume();
    // println!("{:?}", data); // ❌ data đã bị move
}
```

### 10.2 Ba Fn Traits

```
┌─────────────────────────────────────────────────────────┐
│                   CLOSURE TRAITS                         │
├───────────┬─────────────────┬───────────────────────────┤
│   Trait   │   Capture       │   Gọi bao nhiêu lần?     │
├───────────┼─────────────────┼───────────────────────────┤
│   Fn      │   &self         │   Nhiều lần               │
│           │   (immutable)   │   Chỉ đọc environment     │
├───────────┼─────────────────┼───────────────────────────┤
│   FnMut   │   &mut self     │   Nhiều lần               │
│           │   (mutable)     │   Thay đổi environment    │
├───────────┼─────────────────┼───────────────────────────┤
│   FnOnce  │   self          │   Đúng MỘT lần            │
│           │   (ownership)   │   Consume environment     │
├───────────┴─────────────────┴───────────────────────────┤
│   Hierarchy: FnOnce ⊃ FnMut ⊃ Fn                       │
│   (Fn implement FnMut, FnMut implement FnOnce)          │
└─────────────────────────────────────────────────────────┘
```

```rust
// Closures làm tham số function
fn apply_twice<F: Fn(i32) -> i32>(f: F, x: i32) -> i32 {
    f(f(x))
}

fn apply_and_collect<F: FnMut(i32) -> i32>(mut f: F, items: &[i32]) -> Vec<i32> {
    items.iter().map(|&x| f(x)).collect()
}

fn execute_once<F: FnOnce() -> String>(f: F) -> String {
    f()
}

fn main() {
    let result = apply_twice(|x| x + 3, 5);
    println!("apply_twice: {}", result); // 11

    let mut offset = 0;
    let results = apply_and_collect(|x| {
        offset += 1;
        x + offset
    }, &[10, 20, 30]);
    println!("results: {:?}", results); // [11, 22, 33]

    let name = String::from("Rust");
    let greeting = execute_once(move || {
        format!("Xin chào, {}!", name)
    });
    println!("{}", greeting);
}
```

### 10.3 Closures trong thực tế

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Filter
    let evens: Vec<&i32> = numbers.iter()
        .filter(|&&x| x % 2 == 0)
        .collect();
    println!("Số chẵn: {:?}", evens);

    // Map
    let squares: Vec<i32> = numbers.iter()
        .map(|&x| x * x)
        .collect();
    println!("Bình phương: {:?}", squares);

    // Sort với custom comparator
    let mut names = vec!["Charlie", "Alice", "Bob"];
    names.sort_by(|a, b| a.len().cmp(&b.len()));
    println!("Sắp xếp theo độ dài: {:?}", names);

    // Closure giữ state (memoization pattern)
    fn make_counter() -> impl FnMut() -> u32 {
        let mut count = 0;
        move || {
            count += 1;
            count
        }
    }

    let mut counter = make_counter();
    println!("{}", counter()); // 1
    println!("{}", counter()); // 2
    println!("{}", counter()); // 3
}
```

---

## 11. Iterators

### 11.1 Iterator Trait

```rust
// Iterator trait được định nghĩa:
// trait Iterator {
//     type Item;
//     fn next(&mut self) -> Option<Self::Item>;
//     // + hàng trăm provided methods
// }

fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // 3 cách tạo iterator từ collection
    let iter = numbers.iter();       // &T — immutable references
    let iter = numbers.iter_mut();   // &mut T — mutable references (cần mut)
    let iter = numbers.into_iter();  // T — lấy ownership

    // Iterator là lazy — không làm gì cho đến khi consumed
    let v = vec![1, 2, 3];
    let mapped = v.iter().map(|x| x * 2); // Chưa thực thi!
    let result: Vec<i32> = mapped.collect(); // Bây giờ mới thực thi
    println!("{:?}", result);

    // Dùng next() thủ công
    let mut iter = vec![10, 20, 30].into_iter();
    assert_eq!(iter.next(), Some(10));
    assert_eq!(iter.next(), Some(20));
    assert_eq!(iter.next(), Some(30));
    assert_eq!(iter.next(), None);  // Hết phần tử
}
```

### 11.2 Iterator Adaptors (Lazy — trả về Iterator mới)

```rust
fn main() {
    let data = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // map — biến đổi từng phần tử
    let doubled: Vec<i32> = data.iter().map(|&x| x * 2).collect();

    // filter — lọc phần tử
    let evens: Vec<&i32> = data.iter().filter(|&&x| x % 2 == 0).collect();

    // filter_map — filter + map trong một bước
    let parsed: Vec<i32> = vec!["1", "abc", "3", "def", "5"]
        .iter()
        .filter_map(|s| s.parse::<i32>().ok())
        .collect();
    println!("Parsed: {:?}", parsed); // [1, 3, 5]

    // enumerate — thêm index
    for (i, val) in data.iter().enumerate() {
        print!("[{}]={} ", i, val);
    }
    println!();

    // zip — ghép hai iterators
    let names = vec!["Alice", "Bob", "Charlie"];
    let ages = vec![25, 30, 35];
    let people: Vec<_> = names.iter().zip(ages.iter()).collect();
    println!("People: {:?}", people);

    // chain — nối iterators
    let a = vec![1, 2, 3];
    let b = vec![4, 5, 6];
    let combined: Vec<&i32> = a.iter().chain(b.iter()).collect();

    // take, skip
    let first_three: Vec<&i32> = data.iter().take(3).collect();
    let skip_five: Vec<&i32> = data.iter().skip(5).collect();

    // flatten — phẳng hóa nested iterators
    let nested = vec![vec![1, 2], vec![3, 4], vec![5]];
    let flat: Vec<&i32> = nested.iter().flatten().collect();
    println!("Flat: {:?}", flat); // [1, 2, 3, 4, 5]

    // flat_map — map rồi flatten
    let sentences = vec!["hello world", "rust is great"];
    let words: Vec<&str> = sentences.iter()
        .flat_map(|s| s.split_whitespace())
        .collect();
    println!("Words: {:?}", words);

    // windows và chunks
    let vals = vec![1, 2, 3, 4, 5];
    for window in vals.windows(3) {
        println!("Window: {:?}", window); // [1,2,3], [2,3,4], [3,4,5]
    }
    for chunk in vals.chunks(2) {
        println!("Chunk: {:?}", chunk); // [1,2], [3,4], [5]
    }

    // peekable — xem phần tử tiếp theo không consume
    let mut iter = vec![1, 2, 3].into_iter().peekable();
    assert_eq!(iter.peek(), Some(&1)); // Xem nhưng không consume
    assert_eq!(iter.next(), Some(1));  // Giờ mới consume
}
```

### 11.3 Consuming Adaptors (Eager — tiêu thụ Iterator)

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // collect — thu thập thành collection
    let doubled: Vec<i32> = numbers.iter().map(|&x| x * 2).collect();

    // sum, product
    let total: i32 = numbers.iter().sum();         // 15
    let product: i32 = numbers.iter().product();   // 120

    // count
    let count = numbers.iter().count(); // 5

    // min, max
    let min = numbers.iter().min();     // Some(&1)
    let max = numbers.iter().max();     // Some(&5)

    // any, all
    let has_even = numbers.iter().any(|&x| x % 2 == 0);   // true
    let all_positive = numbers.iter().all(|&x| x > 0);     // true

    // find — tìm phần tử đầu tiên thỏa điều kiện
    let first_even = numbers.iter().find(|&&x| x % 2 == 0); // Some(&2)

    // position — tìm index
    let pos = numbers.iter().position(|&x| x == 3); // Some(2)

    // fold — accumulate (giống reduce)
    let sum = numbers.iter().fold(0, |acc, &x| acc + x); // 15
    let sentence = vec!["Rust", "is", "awesome"]
        .iter()
        .fold(String::new(), |acc, &word| {
            if acc.is_empty() { word.to_string() }
            else { format!("{} {}", acc, word) }
        });
    println!("{}", sentence); // "Rust is awesome"

    // for_each — thay thế for loop
    numbers.iter().for_each(|x| print!("{} ", x));
    println!();

    // reduce — giống fold nhưng dùng phần tử đầu tiên làm initial value
    let max = numbers.iter().copied().reduce(|a, b| a.max(b)); // Some(5)
}
```

### 11.4 Custom Iterator

```rust
struct Fibonacci {
    current: u64,
    next: u64,
}

impl Fibonacci {
    fn new() -> Self {
        Fibonacci { current: 0, next: 1 }
    }
}

impl Iterator for Fibonacci {
    type Item = u64;

    fn next(&mut self) -> Option<Self::Item> {
        let result = self.current;
        self.current = self.next;
        self.next = result + self.next;
        Some(result) // Fibonacci vô hạn
    }
}

fn main() {
    // Lấy 10 số Fibonacci đầu tiên
    let fibs: Vec<u64> = Fibonacci::new().take(10).collect();
    println!("Fibonacci: {:?}", fibs);
    // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

    // Tổng các số Fibonacci < 1000
    let sum: u64 = Fibonacci::new()
        .take_while(|&x| x < 1000)
        .sum();
    println!("Tổng Fibonacci < 1000: {}", sum);
}
```

---

## 12. Deep Dive: Ownership, Borrowing, References, Result, Option, unwrap(), Lifetime

### 12.1 Ownership — Hiểu sâu qua ví dụ

```rust
// ============================================================
// VÍ DỤ 1: Ownership cơ bản — Ai sở hữu dữ liệu?
// ============================================================
fn example_1() {
    let book = String::from("The Rust Book"); // `book` là owner

    // Trao sách cho thư viện → bạn không còn sách
    let library_book = book;  // Move: ownership chuyển sang library_book
    // println!("{}", book);  // ❌ book đã bị move

    // Giải pháp 1: Clone (photocopy cuốn sách)
    let original = String::from("Original");
    let copy = original.clone();
    println!("Original: {}, Copy: {}", original, copy); // ✅ Cả hai đều OK

    // Giải pháp 2: Cho mượn thay vì cho luôn (Borrowing)
    let my_book = String::from("My Book");
    read_book(&my_book);  // Cho mượn đọc
    println!("Tôi vẫn có: {}", my_book); // ✅ Vẫn là chủ

} // `library_book` bị drop → bộ nhớ heap giải phóng

fn read_book(book: &String) {
    println!("Đang đọc: {}", book);
} // `book` (reference) hết scope, nhưng dữ liệu KHÔNG bị drop

// ============================================================
// VÍ DỤ 2: Ownership trong struct
// ============================================================
#[derive(Debug)]
struct Database {
    name: String,
    connection_string: String,
}

impl Database {
    fn new(name: &str, conn: &str) -> Self {
        Database {
            name: String::from(name),           // Database SỞ HỮU name
            connection_string: String::from(conn), // Database SỞ HỮU conn
        }
    }

    // &self → mượn Database, không lấy ownership
    fn query(&self, sql: &str) -> Vec<String> {
        println!("[{}] Executing: {}", self.name, sql);
        vec![]
    }

    // self (không phải &self) → TIÊU THỤ Database
    fn shutdown(self) {
        println!("[{}] Đóng kết nối: {}", self.name, self.connection_string);
    } // self bị drop ở đây
}

fn example_2() {
    let db = Database::new("ProductionDB", "postgres://localhost/prod");
    db.query("SELECT * FROM users");  // Mượn
    db.query("SELECT * FROM orders"); // Mượn lại
    db.shutdown();                     // MOVE — tiêu thụ db
    // db.query("...");               // ❌ db đã bị move vào shutdown()
}
```

### 12.2 Borrowing & References — Hiểu sâu

```rust
// ============================================================
// VÍ DỤ: Tại sao Rust cấm mutable + immutable reference cùng lúc?
// ============================================================

fn why_borrowing_rules() {
    let mut data = vec![1, 2, 3, 4, 5];

    // Scenario nguy hiểm (Rust NGĂN CHẶN):
    // let first = &data[0];     // Immutable reference đến phần tử đầu
    // data.push(6);             // ❌ Mutable borrow! Vec có thể reallocate
    //                           // → `first` sẽ trỏ vào vùng nhớ đã giải phóng
    // println!("{}", first);    // Use-after-free bug!

    // Cách đúng:
    let first = data[0];         // Copy giá trị (i32 implement Copy)
    data.push(6);                // ✅ OK, không ai đang borrow
    println!("First: {}, Data: {:?}", first, data);

    // Hoặc dùng scope rõ ràng:
    {
        let first_ref = &data[0];
        println!("First ref: {}", first_ref);
    } // first_ref hết scope ở đây

    data.push(7); // ✅ OK, không ai đang borrow
}

// ============================================================
// VÍ DỤ: Non-Lexical Lifetimes (NLL) — Rust thông minh hơn bạn nghĩ
// ============================================================
fn nll_example() {
    let mut v = vec![1, 2, 3];

    let first = &v[0];           // Immutable borrow bắt đầu
    println!("First: {}", first); // Lần sử dụng CUỐI CÙNG của `first`
    // ← NLL: Rust biết `first` không dùng nữa, borrow kết thúc ở đây

    v.push(4);                    // ✅ OK! Nhờ NLL
    println!("Vec: {:?}", v);
}

// ============================================================
// VÍ DỤ: Mutable reference — chỉ cho MỘT người vay mượn có quyền sửa
// ============================================================
fn mut_ref_example() {
    let mut account_balance = 1000;

    // Chỉ MỘT mutable reference tại một thời điểm
    let ref1 = &mut account_balance;
    *ref1 += 500;
    println!("Số dư: {}", ref1); // 1500

    // Sau khi ref1 không dùng nữa:
    let ref2 = &mut account_balance;
    *ref2 -= 200;
    println!("Số dư: {}", ref2); // 1300

    // ❌ Không thể có 2 mutable refs cùng lúc:
    // let r1 = &mut account_balance;
    // let r2 = &mut account_balance;
    // println!("{}, {}", r1, r2); // LỖI
}
```

### 12.3 Result\<T, E\> — Hiểu sâu

```rust
use std::num::ParseIntError;

// ============================================================
// Result<T, E> — Thành công hoặc thất bại
// ============================================================

// Ví dụ thực tế: Validate và parse config
#[derive(Debug)]
struct ServerConfig {
    host: String,
    port: u16,
    max_connections: u32,
}

#[derive(Debug)]
enum ConfigError {
    InvalidPort(ParseIntError),
    PortOutOfRange(u16),
    MissingHost,
    InvalidMaxConnections(String),
}

impl std::fmt::Display for ConfigError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConfigError::InvalidPort(e) => write!(f, "Port không hợp lệ: {}", e),
            ConfigError::PortOutOfRange(p) => write!(f, "Port ngoài phạm vi: {} (1-65535)", p),
            ConfigError::MissingHost => write!(f, "Thiếu hostname"),
            ConfigError::InvalidMaxConnections(s) => write!(f, "Max connections không hợp lệ: {}", s),
        }
    }
}

fn parse_config(host: &str, port_str: &str, max_conn_str: &str)
    -> Result<ServerConfig, ConfigError>
{
    // Kiểm tra host
    if host.is_empty() {
        return Err(ConfigError::MissingHost);
    }

    // Parse port
    let port: u16 = port_str.parse()
        .map_err(ConfigError::InvalidPort)?;

    // Validate port range
    if port == 0 {
        return Err(ConfigError::PortOutOfRange(port));
    }

    // Parse max connections
    let max_connections: u32 = max_conn_str.parse()
        .map_err(|_| ConfigError::InvalidMaxConnections(max_conn_str.to_string()))?;

    Ok(ServerConfig { host: host.to_string(), port, max_connections })
}

fn main() {
    // Trường hợp thành công
    match parse_config("localhost", "8080", "100") {
        Ok(config) => println!("✅ Config: {:?}", config),
        Err(e) => println!("❌ Lỗi: {}", e),
    }

    // Trường hợp thất bại
    match parse_config("", "abc", "100") {
        Ok(config) => println!("✅ Config: {:?}", config),
        Err(e) => println!("❌ Lỗi: {}", e), // "Thiếu hostname"
    }

    // Chuỗi Result — xử lý pipeline
    let result = parse_config("localhost", "8080", "100")
        .map(|config| {
            println!("Kết nối đến {}:{}", config.host, config.port);
            config
        })
        .and_then(|config| {
            if config.max_connections > 50 {
                Ok(config)
            } else {
                Err(ConfigError::InvalidMaxConnections(
                    "Cần ít nhất 50 connections".to_string()
                ))
            }
        });

    // Chuyển đổi Result ↔ Option
    let result: Result<i32, &str> = Ok(42);
    let option: Option<i32> = result.ok();   // Some(42)

    let option: Option<i32> = Some(42);
    let result: Result<i32, &str> = option.ok_or("Không có giá trị"); // Ok(42)
}
```

### 12.4 Option\<T\> — Hiểu sâu

```rust
// ============================================================
// Option<T> — Có hoặc không có giá trị (thay thế null)
// ============================================================

#[derive(Debug)]
struct Student {
    name: String,
    email: Option<String>,      // Có thể không có email
    phone: Option<String>,      // Có thể không có SĐT
    gpa: Option<f64>,           // Có thể chưa có điểm
}

impl Student {
    fn new(name: &str) -> Self {
        Student {
            name: name.to_string(),
            email: None,
            phone: None,
            gpa: None,
        }
    }

    fn with_email(mut self, email: &str) -> Self {
        self.email = Some(email.to_string());
        self
    }

    fn with_gpa(mut self, gpa: f64) -> Self {
        self.gpa = Some(gpa);
        self
    }

    // Lấy email hoặc giá trị mặc định
    fn get_email(&self) -> &str {
        self.email.as_deref().unwrap_or("(chưa cung cấp)")
    }

    // Kiểm tra đạt yêu cầu (cần GPA >= 2.0)
    fn is_passing(&self) -> Option<bool> {
        // map: Nếu có GPA → Some(gpa >= 2.0), nếu None → None
        self.gpa.map(|gpa| gpa >= 2.0)
    }

    // Tìm thông tin liên lạc (email HOẶC phone)
    fn contact_info(&self) -> Option<&str> {
        // or: Trả về self nếu Some, hoặc thử option khác
        self.email.as_deref().or(self.phone.as_deref())
    }
}

fn main() {
    let student = Student::new("Nguyễn Văn A")
        .with_email("a@example.com")
        .with_gpa(3.5);

    // ===== Các cách xử lý Option =====

    // 1. match — đầy đủ nhất
    match student.gpa {
        Some(gpa) => println!("GPA: {:.1}", gpa),
        None => println!("Chưa có điểm"),
    }

    // 2. if let — khi chỉ quan tâm Some
    if let Some(email) = &student.email {
        println!("Email: {}", email);
    }

    // 3. unwrap() — PANIC nếu None (chỉ dùng khi CHẮC CHẮN có giá trị)
    let gpa = student.gpa.unwrap(); // 3.5 ✅
    // let phone = student.phone.unwrap(); // ❌ PANIC!

    // 4. expect() — PANIC với message tùy chỉnh
    let gpa = student.gpa.expect("Student phải có GPA");

    // 5. unwrap_or() — giá trị mặc định
    let phone = student.phone.clone().unwrap_or(String::from("N/A"));

    // 6. unwrap_or_else() — closure tính giá trị mặc định (lazy)
    let phone = student.phone.clone().unwrap_or_else(|| {
        println!("Tính giá trị mặc định...");
        String::from("0000-0000")
    });

    // 7. unwrap_or_default() — dùng Default trait
    let phone: String = student.phone.clone().unwrap_or_default(); // ""

    // 8. map() — biến đổi giá trị bên trong
    let gpa_letter: Option<&str> = student.gpa.map(|gpa| {
        if gpa >= 3.5 { "A" }
        else if gpa >= 3.0 { "B" }
        else if gpa >= 2.0 { "C" }
        else { "F" }
    });
    println!("Điểm chữ: {:?}", gpa_letter); // Some("A")

    // 9. and_then() (flatmap) — chuỗi operations trả về Option
    let scholarship: Option<String> = student.gpa
        .and_then(|gpa| {
            if gpa >= 3.8 {
                Some(format!("Học bổng xuất sắc (GPA: {:.1})", gpa))
            } else {
                None
            }
        });
    println!("Học bổng: {:?}", scholarship); // None (3.5 < 3.8)

    // 10. ? operator với Option (trong function trả về Option)
    fn get_first_letter(name: &Option<String>) -> Option<char> {
        name.as_ref()?.chars().next()
    }
    println!("Chữ cái đầu email: {:?}",
        get_first_letter(&student.email)); // Some('a')
}
```

### 12.5 unwrap() — Khi nào dùng, khi nào tránh

```rust
fn main() {
    // ============================================================
    //  unwrap() = "Tôi CHẮC CHẮN có giá trị, nếu sai thì crash"
    // ============================================================

    // ✅ OK dùng unwrap() khi:

    // 1. Trong tests
    #[cfg(test)]
    fn test_parse() {
        let num: i32 = "42".parse().unwrap(); // Test → crash = fail test
        assert_eq!(num, 42);
    }

    // 2. Khi logic đảm bảo không None/Err
    let numbers = vec![1, 2, 3];
    let first = numbers.first().unwrap(); // Vec không rỗng → chắc chắn Some

    // 3. Prototyping nhanh
    let content = std::fs::read_to_string("config.txt").unwrap();

    // ❌ TRÁNH unwrap() khi:

    // 1. Input từ user
    // let age: i32 = user_input.parse().unwrap(); // ❌ User có thể nhập "abc"

    // 2. File/Network operations
    // let file = File::open(path).unwrap(); // ❌ File có thể không tồn tại

    // 3. Production code nói chung
    // → Dùng ?, match, unwrap_or, unwrap_or_else thay thế

    // ============================================================
    //  expect() — unwrap() với message tốt hơn
    // ============================================================

    // Luôn ưu tiên expect() hơn unwrap() khi cần unwrap
    let config = std::fs::read_to_string("app.toml")
        .expect("File config app.toml phải tồn tại tại thư mục gốc");
    // Panic message: "File config app.toml phải tồn tại tại thư mục gốc: ..."
    // vs unwrap(): "called `Result::unwrap()` on an `Err` value: ..."
}
```

### 12.6 Lifetimes — Giải thích chi tiết

```rust
// ============================================================
// LIFETIME = Thời gian sống của một reference
//
// Rust cần đảm bảo: Reference KHÔNG BAO GIỜ sống lâu hơn dữ liệu
// nó trỏ tới (dangling reference prevention)
// ============================================================

// VÍ DỤ 1: Tại sao cần lifetime annotation?
// Rust compiler KHÔNG BIẾT reference nào sẽ được return
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    //       ^^ lifetime parameter
    // Nghĩa: return value sống ít nhất bằng thời gian sống ngắn nhất
    //         của x hoặc y
    if x.len() > y.len() { x } else { y }
}

fn lifetime_demo_1() {
    let string1 = String::from("long string is long");
    let result;
    {
        let string2 = String::from("xyz");
        result = longest(string1.as_str(), string2.as_str());
        println!("Dài nhất: {}", result); // ✅ OK, cả string1 và string2 còn sống
    }
    // println!("Dài nhất: {}", result); // ❌ LỖI!
    // string2 đã bị drop, nhưng result CÓ THỂ trỏ tới string2
    // → Lifetime annotation giúp Rust phát hiện lỗi này tại compile time
}

// VÍ DỤ 2: Lifetime trong struct
// Struct chứa reference → PHẢI có lifetime annotation
#[derive(Debug)]
struct Excerpt<'a> {
    text: &'a str,  // Excerpt mượn text, KHÔNG sở hữu
}

impl<'a> Excerpt<'a> {
    fn level(&self) -> i32 {
        3  // Không return reference → không cần lifetime
    }

    fn announce(&self, announcement: &str) -> &str {
        // Lifetime elision rule 3: nếu có &self, output lifetime = self's lifetime
        println!("Attention: {}", announcement);
        self.text
    }
}

fn lifetime_demo_2() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence;
    {
        let excerpt;
        first_sentence = novel.split('.').next().expect("Có dấu chấm");
        excerpt = Excerpt { text: first_sentence };
        println!("Trích: {:?}", excerpt);
    }
    // `first_sentence` vẫn hợp lệ vì nó tham chiếu đến `novel`
    println!("Câu đầu: {}", first_sentence);
}

// VÍ DỤ 3: 'static lifetime
fn lifetime_demo_3() {
    // 'static = sống suốt toàn bộ chương trình
    let s: &'static str = "Tôi là string literal, sống mãi mãi";
    // String literals luôn là 'static vì chúng được nhúng vào binary

    // ⚠️ TRÁNH dùng 'static khi không cần thiết
    // fn bad_function() -> &'static str {
    //     let s = String::from("hello");
    //     &s  // ❌ s bị drop, không thể là 'static
    // }
}

// VÍ DỤ 4: Lifetime Elision Rules (Quy tắc tự suy luận)
// Compiler tự thêm lifetime annotations theo 3 quy tắc:

// Rule 1: Mỗi reference parameter nhận lifetime riêng
// fn foo(x: &str)           → fn foo<'a>(x: &'a str)
// fn foo(x: &str, y: &str)  → fn foo<'a, 'b>(x: &'a str, y: &'b str)

// Rule 2: Nếu chỉ có 1 input lifetime → output dùng lifetime đó
// fn foo(x: &str) -> &str   → fn foo<'a>(x: &'a str) -> &'a str

// Rule 3: Nếu có &self hoặc &mut self → output dùng lifetime của self
// fn foo(&self, x: &str) -> &str → fn foo<'a>(&'a self, x: &str) -> &'a str

// Khi 3 rules không đủ → BẮT BUỘC phải viết lifetime annotation thủ công
// Ví dụ: fn longest(x: &str, y: &str) -> &str → Không biết dùng 'a hay 'b!

// VÍ DỤ 5: Kết hợp Generics + Traits + Lifetimes
use std::fmt::Display;

fn longest_with_announcement<'a, T>(x: &'a str, y: &'a str, ann: T) -> &'a str
where
    T: Display,
{
    println!("📢 {}", ann);
    if x.len() > y.len() { x } else { y }
}

fn main() {
    lifetime_demo_1();
    lifetime_demo_2();
    lifetime_demo_3();

    let result = longest_with_announcement(
        "xin chào",
        "hello world",
        "So sánh hai chuỗi",
    );
    println!("Dài hơn: {}", result);
}
```

### 12.7 Tổng hợp — Bảng so sánh

```
┌──────────────────────────────────────────────────────────────────────┐
│                    BẢNG SO SÁNH TỔNG HỢP                            │
├───────────────┬──────────────────────────────────────────────────────┤
│   Concept     │   Mô tả                                             │
├───────────────┼──────────────────────────────────────────────────────┤
│ Ownership     │ Mỗi giá trị có 1 owner duy nhất.                   │
│               │ Khi owner ra khỏi scope → giá trị bị drop.         │
│               │ Move = chuyển ownership. Clone = deep copy.         │
├───────────────┼──────────────────────────────────────────────────────┤
│ Borrowing     │ &T = mượn chỉ đọc (nhiều references đồng thời)    │
│               │ &mut T = mượn có sửa (chỉ 1 tại một thời điểm)    │
│               │ Không thể có &T và &mut T cùng lúc                 │
├───────────────┼──────────────────────────────────────────────────────┤
│ Reference     │ Con trỏ an toàn (luôn hợp lệ, không null)         │
│               │ &T → shared reference                               │
│               │ &mut T → exclusive reference                        │
├───────────────┼──────────────────────────────────────────────────────┤
│ Result<T,E>   │ Ok(T) = thành công, Err(E) = thất bại             │
│               │ Dùng cho operations có thể fail                    │
│               │ ? operator để propagate errors                      │
├───────────────┼──────────────────────────────────────────────────────┤
│ Option<T>     │ Some(T) = có giá trị, None = không có              │
│               │ Thay thế null/nil                                   │
│               │ .map(), .and_then(), .unwrap_or()                  │
├───────────────┼──────────────────────────────────────────────────────┤
│ unwrap()      │ Lấy giá trị từ Some/Ok, PANIC nếu None/Err        │
│               │ Dùng trong tests, prototyping                       │
│               │ Production: dùng ?, expect(), unwrap_or()           │
├───────────────┼──────────────────────────────────────────────────────┤
│ Lifetime 'a   │ Đảm bảo reference sống ngắn hơn dữ liệu gốc      │
│               │ Thường được compiler tự suy luận (elision)          │
│               │ Cần ghi thủ công khi hàm nhận nhiều references     │
│               │ 'static = sống suốt chương trình                   │
└───────────────┴──────────────────────────────────────────────────────┘
```

---

## 13. Rustlings — 98 Problems

### 13.1 Rustlings là gì?

**Rustlings** là bộ bài tập chính thức của Rust team, gồm **98 bài tập nhỏ** (small exercises) giúp bạn học Rust bằng cách sửa code lỗi. Mỗi bài tập là một file `.rs` có lỗi cú pháp, logic, hoặc thiếu code mà bạn cần sửa cho đúng.

**Triết lý**: *"Learning by fixing"* — Học bằng cách sửa lỗi.

### 13.2 Cài đặt và sử dụng

```bash
# Cài đặt Rustlings
cargo install rustlings

# Khởi tạo project bài tập
rustlings init
cd rustlings

# Bắt đầu chạy (watch mode — tự động kiểm tra khi save file)
rustlings

# Xem danh sách tất cả bài tập
rustlings list

# Chạy bài tập cụ thể
rustlings run intro1

# Xem gợi ý
rustlings hint intro1

# Đánh dấu hoàn thành và chuyển bài tiếp
# (Xóa comment "// I AM NOT DONE" trong file)
```

### 13.3 Cấu trúc 98 bài tập (theo thứ tự)

| # | Chủ đề | Số bài | Mô tả |
|---|--------|--------|--------|
| 1 | **intro** | 2 | Giới thiệu Rustlings, println! |
| 2 | **variables** | 6 | let, mut, shadowing, const, type |
| 3 | **functions** | 5 | Parameters, return values, statements vs expressions |
| 4 | **if** | 3 | Conditionals, if as expression |
| 5 | **primitive_types** | 6 | Integers, floats, bool, char, tuples, arrays, slices |
| 6 | **vecs** | 2 | Vec\<T\> basics, iteration |
| 7 | **move_semantics** | 5 | Ownership, move, clone, references |
| 8 | **structs** | 3 | Named structs, tuple structs, methods |
| 9 | **enums** | 3 | Enum variants, enum methods, match |
| 10 | **strings** | 4 | String vs &str, operations |
| 11 | **modules** | 3 | pub, use, module hierarchy |
| 12 | **hashmaps** | 3 | Create, access, update |
| 13 | **options** | 3 | Option\<T\>, matching, methods |
| 14 | **error_handling** | 6 | Result, ?, custom errors |
| 15 | **generics** | 2 | Generic functions, structs |
| 16 | **traits** | 5 | Implementing, default, trait bounds, supertraits |
| 17 | **lifetimes** | 3 | Annotations, struct lifetimes, static |
| 18 | **tests** | 4 | #[test], assert!, test organization |
| 19 | **iterators** | 5 | next(), adaptors, consumers, collect, custom iterators |
| 20 | **smart_pointers** | 4 | Box, Rc, custom smart pointers |
| 21 | **threads** | 3 | spawn, message passing, shared state |
| 22 | **macros** | 4 | Declarative macros |
| 23 | **clippy** | 3 | Linter suggestions |
| 24 | **conversions** | 5 | From, Into, TryFrom, AsRef, Display |
| | **Tổng cộng** | **98** | |

### 13.4 Ví dụ bài tập tiêu biểu

```rust
// ============================================================
// exercises/move_semantics/move_semantics2.rs
// Bài gốc (có lỗi):
// ============================================================
fn main() {
    let vec0 = vec![22, 44, 66];
    let vec1 = fill_vec(vec0);
    assert_eq!(vec0, [22, 44, 66]);  // ❌ vec0 đã bị move!
    assert_eq!(vec1, [22, 44, 66, 88]);
}

fn fill_vec(vec: Vec<i32>) -> Vec<i32> {
    let mut vec = vec;
    vec.push(88);
    vec
}

// ============================================================
// Cách sửa: Clone vec0 trước khi pass vào function
// ============================================================
fn main() {
    let vec0 = vec![22, 44, 66];
    let vec1 = fill_vec(vec0.clone());  // ✅ Clone để giữ vec0
    assert_eq!(vec0, [22, 44, 66]);
    assert_eq!(vec1, [22, 44, 66, 88]);
}

// ============================================================
// exercises/error_handling/errors6.rs
// Parse age with custom error type
// ============================================================
#[derive(Debug)]
enum ParsePosNonzeroError {
    Creation(CreationError),
    ParseInt(std::num::ParseIntError),
}

impl From<CreationError> for ParsePosNonzeroError {
    fn from(e: CreationError) -> Self {
        ParsePosNonzeroError::Creation(e)
    }
}

impl From<std::num::ParseIntError> for ParsePosNonzeroError {
    fn from(e: std::num::ParseIntError) -> Self {
        ParsePosNonzeroError::ParseInt(e)
    }
}

fn parse_pos_nonzero(s: &str) -> Result<PositiveNonzeroInteger, ParsePosNonzeroError> {
    let x: i64 = s.parse()?;  // ? auto-converts ParseIntError
    Ok(PositiveNonzeroInteger::new(x)?)  // ? auto-converts CreationError
}
```

### 13.5 Lộ trình học Rustlings hiệu quả

```
Tuần 1: Cơ bản (Bài 1-25)
├── intro, variables, functions, if
├── primitive_types, vecs
└── Mục tiêu: Quen cú pháp Rust

Tuần 2: Ownership & Types (Bài 26-50)
├── move_semantics ← QUAN TRỌNG NHẤT
├── structs, enums, strings
├── modules, hashmaps
└── Mục tiêu: Hiểu Ownership

Tuần 3: Advanced (Bài 51-75)
├── options, error_handling
├── generics, traits, lifetimes
└── Mục tiêu: Viết code Rust idiomatic

Tuần 4: Mastery (Bài 76-98)
├── tests, iterators, smart_pointers
├── threads, macros, clippy
├── conversions
└── Mục tiêu: Ready cho production Rust
```

---

## 14. Hệ sinh thái Framework của Rust

### 14.1 Tổng quan hệ sinh thái

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HỆ SINH THÁI RUST FRAMEWORK                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🌐 WEB FRAMEWORKS         🖥️ CLI                📦 ASYNC RUNTIME   │
│  ├── Actix Web              ├── clap              ├── Tokio           │
│  ├── Axum                   ├── structopt         ├── async-std       │
│  ├── Rocket                 └── argh              └── smol            │
│  ├── Warp                                                            │
│  └── Poem                   🗄️ DATABASE            🔐 CRYPTO/AUTH     │
│                              ├── Diesel            ├── rustls          │
│  🖼️ FRONTEND (WASM)         ├── SQLx              ├── ring            │
│  ├── Yew                    ├── SeaORM            └── jsonwebtoken    │
│  ├── Leptos                 └── SurrealDB                            │
│  ├── Dioxus                                       📋 SERIALIZATION   │
│  └── Sycamore               🧪 TESTING            ├── serde           │
│                              ├── built-in          ├── serde_json      │
│  🎮 GAME ENGINES            ├── proptest           └── toml            │
│  ├── Bevy                   └── criterion                             │
│  ├── Macroquad                                     📡 NETWORKING       │
│  └── ggez                   🛠️ TOOLS               ├── reqwest         │
│                              ├── cargo-watch       ├── hyper           │
│  🤖 EMBEDDED                ├── cargo-expand       └── tonic (gRPC)   │
│  ├── embassy                └── cargo-audit                           │
│  └── esp-hal                                                         │
└──────────────────────────────────────────────────────────────────────┘
```

### 14.2 Web Frameworks — So sánh chi tiết

#### 14.2.1 Actix Web

```rust
// Cargo.toml: actix-web = "4"
use actix_web::{get, post, web, App, HttpServer, HttpResponse, Responder};

#[get("/hello/{name}")]
async fn hello(name: web::Path<String>) -> impl Responder {
    HttpResponse::Ok().body(format!("Hello {}!", name))
}

#[post("/users")]
async fn create_user(body: web::Json<CreateUserRequest>) -> impl Responder {
    HttpResponse::Created().json(serde_json::json!({
        "id": 1,
        "name": body.name
    }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(hello)
            .service(create_user)
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```

| Tiêu chí | Đánh giá |
|----------|----------|
| **Ưu điểm** | Hiệu suất cực cao (top benchmark), mature, production-ready, middleware phong phú, WebSocket support |
| **Nhược điểm** | API phức tạp hơn, learning curve cao, Actor model có thể gây khó hiểu |
| **Khi nào dùng** | High-performance APIs, microservices, khi cần tối ưu throughput |

#### 14.2.2 Axum

```rust
// Cargo.toml: axum = "0.7", tokio = { version = "1", features = ["full"] }
use axum::{
    routing::{get, post},
    extract::{Path, Json, State},
    Router,
    http::StatusCode,
};
use std::sync::Arc;
use tokio::sync::RwLock;

type SharedState = Arc<RwLock<Vec<String>>>;

async fn hello(Path(name): Path<String>) -> String {
    format!("Hello, {}!", name)
}

async fn list_users(State(state): State<SharedState>) -> Json<Vec<String>> {
    let users = state.read().await;
    Json(users.clone())
}

async fn add_user(
    State(state): State<SharedState>,
    Json(name): Json<String>,
) -> StatusCode {
    state.write().await.push(name);
    StatusCode::CREATED
}

#[tokio::main]
async fn main() {
    let state: SharedState = Arc::new(RwLock::new(vec![]));

    let app = Router::new()
        .route("/hello/{name}", get(hello))
        .route("/users", get(list_users).post(add_user))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

| Tiêu chí | Đánh giá |
|----------|----------|
| **Ưu điểm** | Từ Tokio team, tích hợp hoàn hảo với Tokio ecosystem, API ergonomic, type-safe extractors, Tower middleware compatible |
| **Nhược điểm** | Mới hơn Actix, ít examples, error messages phức tạp khi type mismatch |
| **Khi nào dùng** | Dự án mới, khi đã dùng Tokio, cần API clean và modular |

#### 14.2.3 Rocket

```rust
// Cargo.toml: rocket = { version = "0.5", features = ["json"] }
#[macro_use] extern crate rocket;
use rocket::serde::{json::Json, Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct User {
    name: String,
    age: u32,
}

#[get("/hello/<name>")]
fn hello(name: &str) -> String {
    format!("Hello, {}! 🚀", name)
}

#[post("/users", format = "json", data = "<user>")]
fn create_user(user: Json<User>) -> Json<User> {
    Json(user.into_inner())
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/", routes![hello, create_user])
}
```

| Tiêu chí | Đánh giá |
|----------|----------|
| **Ưu điểm** | API đẹp nhất (ergonomic), tự động validation, form handling, Fairings (middleware), rất dễ học |
| **Nhược điểm** | Dùng macro nhiều (compile chậm hơn), async support muộn, community nhỏ hơn |
| **Khi nào dùng** | Rapid prototyping, developer experience là ưu tiên, full-stack web apps |

#### 14.2.4 Warp

```rust
// Cargo.toml: warp = "0.3", tokio = { version = "1", features = ["full"] }
use warp::Filter;

#[tokio::main]
async fn main() {
    let hello = warp::path!("hello" / String)
        .map(|name| format!("Hello, {}!", name));

    let health = warp::path("health")
        .map(|| warp::reply::json(&serde_json::json!({"status": "ok"})));

    let routes = hello.or(health);

    warp::serve(routes)
        .run(([127, 0, 0, 1], 3030))
        .await;
}
```

| Tiêu chí | Đánh giá |
|----------|----------|
| **Ưu điểm** | Filter-based composition, rất functional, type-safe, WebSocket support |
| **Nhược điểm** | Error types phức tạp, debug khó, ít flexibility cho complex apps |
| **Khi nào dùng** | APIs đơn giản, microservices, khi thích functional style |

### 14.3 Bảng so sánh Web Frameworks

| Feature | **Actix Web** | **Axum** | **Rocket** | **Warp** |
|---------|:---:|:---:|:---:|:---:|
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Learning Curve** | Khó | Trung bình | Dễ | Trung bình |
| **Ecosystem** | Phong phú | Đang phát triển | Tốt | Cơ bản |
| **Async** | ✅ (actix-rt) | ✅ (Tokio) | ✅ (Tokio) | ✅ (Tokio) |
| **WebSocket** | ✅ | ✅ | ❌ | ✅ |
| **GitHub Stars** | ~22k | ~20k | ~24k | ~10k |
| **Maturity** | Cao | Trung bình | Cao | Trung bình |
| **Khi nào chọn** | High perf, enterprise | Tokio stack, modern | Rapid dev, beginner | Simple APIs |

### 14.4 Frontend Frameworks (WebAssembly)

#### Yew

```rust
// Cargo.toml: yew = { version = "0.21", features = ["csr"] }
use yew::prelude::*;

#[function_component(App)]
fn app() -> Html {
    let counter = use_state(|| 0);
    let onclick = {
        let counter = counter.clone();
        Callback::from(move |_| counter.set(*counter + 1))
    };

    html! {
        <div>
            <h1>{ "Counter: " }{ *counter }</h1>
            <button {onclick}>{ "+1" }</button>
        </div>
    }
}

fn main() {
    yew::Renderer::<App>::new().render();
}
```

| Framework | Ưu điểm | Nhược điểm | Khi nào dùng |
|-----------|----------|------------|-------------|
| **Yew** | Giống React, mature, large community | WASM binary lớn, SEO khó | SPAs, React devs chuyển sang Rust |
| **Leptos** | Fine-grained reactivity, SSR, signals | Mới, API đang thay đổi | Full-stack Rust web apps |
| **Dioxus** | Cross-platform (web, desktop, mobile), RSX | Đang phát triển | Multi-platform apps |
| **Sycamore** | Reactive, no virtual DOM | Community nhỏ | Performance-critical UIs |

### 14.5 Database & ORM

| Crate | Kiểu | Ưu điểm | Nhược điểm |
|-------|------|----------|------------|
| **Diesel** | ORM (compile-time) | Type-safe queries, compile-time check, migrations | Async chưa native, learning curve |
| **SQLx** | Compile-time SQL | Compile-time SQL verification, async, multi-DB | Không phải full ORM, cần raw SQL |
| **SeaORM** | ORM (runtime) | Full ORM, async, dynamic queries | Runtime overhead, ít mature |
| **SurrealDB** | Multi-model DB | Built-in Rust, SQL-like, realtime | Mới, production chưa proven |

### 14.6 Async Runtimes

| Runtime | Ưu điểm | Nhược điểm | Khi nào dùng |
|---------|----------|------------|-------------|
| **Tokio** | De facto standard, rich ecosystem, production-proven | Nặng, learning curve | Mặc định cho mọi project |
| **async-std** | API giống std, dễ học | Ecosystem nhỏ hơn, ít maintenance | Khi muốn API đơn giản |
| **smol** | Siêu nhẹ, composable | Ít features | Embedded, resource-limited |

### 14.7 Game Development

| Engine | Ưu điểm | Nhược điểm |
|--------|----------|------------|
| **Bevy** | ECS architecture, hot-reload, active community | Đang phát triển (API thay đổi) |
| **Macroquad** | Đơn giản, cross-platform, immediate mode | Ít features, không ECS |
| **ggez** | Giống LÖVE (Lua), dễ bắt đầu | 2D only, ít maintenance |

### 14.8 CLI Frameworks

```rust
// clap — CLI Argument Parser
use clap::Parser;

#[derive(Parser)]
#[command(name = "myapp", about = "Ứng dụng demo CLI")]
struct Cli {
    /// Tên người dùng
    #[arg(short, long)]
    name: String,

    /// Số lần chào
    #[arg(short, long, default_value_t = 1)]
    count: u8,

    /// Chế độ verbose
    #[arg(short, long)]
    verbose: bool,
}

fn main() {
    let cli = Cli::parse();
    for _ in 0..cli.count {
        println!("Xin chào, {}!", cli.name);
    }
}
```

### 14.9 Essential Crates (Thư viện không thể thiếu)

| Crate | Mục đích | Stars |
|-------|----------|-------|
| **serde** | Serialization/Deserialization | ~9k |
| **tokio** | Async runtime | ~28k |
| **reqwest** | HTTP client | ~10k |
| **clap** | CLI argument parsing | ~15k |
| **tracing** | Structured logging | ~6k |
| **anyhow** | Error handling (applications) | ~6k |
| **thiserror** | Error handling (libraries) | ~4k |
| **rayon** | Data parallelism | ~11k |
| **regex** | Regular expressions | ~4k |
| **chrono** | Date and time | ~3k |
| **uuid** | UUID generation | ~1k |
| **rand** | Random number generation | ~2k |

### 14.10 Khi nào chọn Framework nào?

```
┌──────────────────────────────────────────────────────────────┐
│              CÂY QUYẾT ĐỊNH CHỌN FRAMEWORK                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Bạn đang xây dựng gì?                                      │
│  │                                                           │
│  ├── REST API / Backend Service?                             │
│  │   ├── Cần hiệu suất tối đa? → Actix Web                 │
│  │   ├── Dùng Tokio ecosystem? → Axum ⭐ (KHUYẾN NGHỊ)     │
│  │   ├── Cần dev nhanh, dễ học? → Rocket                    │
│  │   └── API đơn giản? → Warp                               │
│  │                                                           │
│  ├── Full-stack Web App?                                     │
│  │   ├── SSR + client? → Leptos                              │
│  │   ├── Quen React? → Yew                                  │
│  │   └── Multi-platform? → Dioxus                            │
│  │                                                           │
│  ├── CLI Tool?                                               │
│  │   └── → clap + anyhow + serde                            │
│  │                                                           │
│  ├── Game?                                                   │
│  │   ├── 3D, complex? → Bevy                                │
│  │   └── 2D, simple? → Macroquad                             │
│  │                                                           │
│  ├── Embedded / IoT?                                         │
│  │   └── → embassy (async) hoặc esp-hal (ESP32)             │
│  │                                                           │
│  └── Microservices / gRPC?                                   │
│      └── → tonic + Axum + SQLx                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Phụ lục A: Tài nguyên học tập

| Tài nguyên | Link | Mô tả |
|------------|------|--------|
| The Rust Book | [doc.rust-lang.org/book](https://doc.rust-lang.org/book/) | Sách chính thức, đầy đủ nhất |
| Rust by Example | [doc.rust-lang.org/rust-by-example](https://doc.rust-lang.org/rust-by-example/) | Học qua ví dụ |
| Rustlings | [github.com/rust-lang/rustlings](https://github.com/rust-lang/rustlings) | 98 bài tập hands-on |
| Exercism Rust | [exercism.org/tracks/rust](https://exercism.org/tracks/rust) | Bài tập với mentoring |
| Rust Playground | [play.rust-lang.org](https://play.rust-lang.org/) | Chạy code trực tuyến |
| Crates.io | [crates.io](https://crates.io/) | Registry thư viện Rust |
| This Week in Rust | [this-week-in-rust.org](https://this-week-in-rust.org/) | Newsletter hàng tuần |

## Phụ lục B: Cheatsheet lệnh Cargo

```bash
cargo new <name>          # Tạo project mới
cargo new <name> --lib    # Tạo library
cargo build               # Compile (debug)
cargo build --release     # Compile (release, optimized)
cargo run                 # Compile + chạy
cargo test                # Chạy tests
cargo doc --open          # Tạo và mở documentation
cargo clippy              # Lint code
cargo fmt                 # Format code
cargo check               # Kiểm tra lỗi (nhanh, không compile)
cargo update              # Cập nhật dependencies
cargo add <crate>         # Thêm dependency (cargo-edit)
cargo audit               # Kiểm tra security vulnerabilities
cargo bench               # Chạy benchmarks
```

---

> **Lời kết**: Rust không phải ngôn ngữ dễ học, nhưng đáng để đầu tư. Hệ thống Ownership, Borrowing, và Lifetimes ban đầu có thể gây frustrating, nhưng khi đã nắm vững, bạn sẽ viết code an toàn, hiệu suất cao, và tự tin hơn bất kỳ ngôn ngữ nào khác. Hãy bắt đầu với Rustlings và xây dựng từng bước! 🦀

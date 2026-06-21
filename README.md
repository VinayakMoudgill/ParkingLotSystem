# Car Parking System — NestJS REST API

A fully functional car parking lot management system built with **TypeScript** and **NestJS**. No external database is used — all data is stored in-memory using optimized data structures.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Framework | NestJS (Node.js) |
| Data Storage | In-memory (Map + MinHeap) |
| Validation | class-validator / class-transformer |
| Testing | Jest |
| Containerization | Docker |

---

## Setup & Run

### 1. Install dependencies
```bash
npm install
```

### 2. Start the server (development mode with auto-reload)
```bash
npm run start:dev
```

### 3. Start in production mode
```bash
npm run build
npm run start:prod
```

### 4. Run with Docker
```bash
docker build -t parking-lot-system .
docker run -p 3000:3000 parking-lot-system
```

The API will be available at `http://localhost:3000`

---

## Run Tests
```bash
npm test              # run all tests once
npm run test:watch    # watch mode
npm run test:cov      # with coverage report
```

---

## API Reference

### 1. Initialize Parking Lot
```
POST /parking_lot
```
**Body:**
```json
{ "no_of_slot": 6 }
```
**Response `201`:**
```json
{ "total_slot": 6 }
```

---

### 2. Expand Parking Lot
```
PATCH /parking_lot
```
**Body:**
```json
{ "increment_slot": 3 }
```
**Response `200`:**
```json
{ "total_slot": 9 }
```

---

### 3. Park a Car
```
POST /park
```
**Body:**
```json
{
  "car_reg_no": "KA-01-AB-2211",
  "car_color": "white"
}
```
**Response `201`:**
```json
{ "allocated_slot_number": 1 }
```
**Errors:** `400` if lot is full | `409` if car already parked

---

### 4. Free a Slot
```
POST /clear
```
**Option A — by slot number:**
```json
{ "slot_number": 1 }
```
**Option B — by registration number:**
```json
{ "car_registration_no": "KA-01-AB-2211" }
```
**Response `200`:**
```json
{ "freed_slot_number": 1 }
```
**Errors:** `400` if slot already free | `404` if registration not found

---

### 5. Get All Occupied Slots
```
GET /status
```
**Response `200`:**
```json
[
  { "slot_no": 1, "registration_no": "KA-01-HH-1234", "color": "red" },
  { "slot_no": 4, "registration_no": "KA-01-HH-1236", "color": "black" }
]
```

---

### 6. Get Registrations by Color
```
GET /registration_numbers/:color
```
Example: `GET /registration_numbers/white`

**Response `200`:**
```json
["KA-01-HH-1234", "KA-02-AB-9999"]
```

---

### 7. Get Slot by Registration Number
```
GET /slot/:registration_number
```
Example: `GET /slot/KA-01-AB-2211`

**Response `200`:**
```json
{ "slot_number": 4 }
```
**Errors:** `404` if not found

---

### 8. Get Slot Numbers by Color
```
GET /slot_numbers/:color
```
Example: `GET /slot_numbers/white`

**Response `200`:**
```json
[1, 5, 12]
```

---

## Design Decisions & Assumptions

### Data Structures Used

| Structure | Purpose | Time Complexity |
|---|---|---|
| `Map<number, CarInfo>` | Slot → Car details | O(1) lookup |
| `Map<string, number>` | Registration → Slot | O(1) lookup |
| `Map<string, Set<number>>` | Color → Set of slots | O(1) lookup |
| `MinHeap` | Track available slots | O(log n) push/pop |

### Why MinHeap?
The problem requires always allocating the **nearest slot** (lowest slot number). A MinHeap keeps the smallest available slot at the top, so every allocation costs **O(log n)** instead of O(n) for a linear scan. When a car leaves, its slot is pushed back into the heap in O(log n).

### Assumptions Made
1. **Color is case-insensitive** — "White", "WHITE", "white" all treated the same.
2. **POST /parking_lot can only be called once** — calling it again returns 409 Conflict.
3. **Slot numbers are 1-based** (1, 2, 3...) as specified.
4. **Duplicate registration numbers are rejected** — a car cannot park twice.
5. **POST /clear requires at least one of** `slot_number` or `car_registration_no`.

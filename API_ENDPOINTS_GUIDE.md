# Sport Booking Backend - API Endpoints Guide

Tai lieu nay tong hop cac endpoint trong `src/modules` va huong dan cach su dung theo logic hien tai cua code.

## 1) Tong quan xac thuc va quyen

- API su dung JWT access token (`Authorization: Bearer <accessToken>`).
- Refresh token duoc luu trong cookie `refreshToken` (httpOnly).
- Da so endpoint (tru `auth/login`, `auth/register`) deu yeu cau dang nhap.
- Phan quyen qua `RolesGuard` voi 3 role chinh:
  - `admin`
  - `owner`
  - `user`

## 2) Auth Module (`/auth`)

### `POST /auth/login`
- Public endpoint.
- Body:
  - `identifier`: username hoac email
  - `password`
- Logic:
  - Kiem tra user ton tai, chua bi deleted, password dung.
  - Tra `accessToken`.
  - Set cookie `refreshToken`.

### `POST /auth/register`
- Public endpoint.
- Body:
  - `username`, `password`, `email`, `fullName`, `phone?`
- Logic:
  - Check trung username/email.
  - Hash password va tao user role `user`.

### `POST /auth/logout`
- Can access token.
- Logic:
  - Doc `refreshToken` tu cookie.
  - Neu ton tai session thi revoke session.
  - Xoa cookie `refreshToken`.

### `POST /auth/refresh-token`
- Can refresh token cookie hop le.
- Logic:
  - Verify refresh token + session chua revoke/chua het han.
  - Rotate refresh token (doi token moi trong DB va cookie).
  - Tra access token moi.

---

## 3) User Module (`/user`)

### User self-service

### `GET /user/me`
- Role: user da dang nhap.
- Lay profile cua chinh minh.

### `PATCH /user/me`
- Role: user da dang nhap.
- Body (`UserUpdateDto`): cap nhat profile (field optional theo `BaseUserDto`).

### `PATCH /user/change-password`
- Role: user da dang nhap.
- Body:
  - `oldPassword`
  - `newPassword` (min 6)
- Logic: bat buoc old password dung.

### Admin endpoints

### `GET /user`
- Role: `admin`.
- Query (`UserQueryDto`):
  - `current`, `limit`
  - `email`, `fullName` (regex match)
  - `role`, `status`
- Logic: filter + pagination (`filterQuery`).

### `GET /user/:id`
- Role: `admin`.
- Lay chi tiet user.

### `POST /user`
- Role: `admin`.
- Body (`AdminCreateUserDto`):
  - `username`, `email`, `password`, `fullName`, `phone?`, `role`, `status`
- Logic: check trung username/email, hash password.

### `POST /user/:id/change-password`
- Role: `admin`.
- Body: `newPassword`.

### `PATCH /user/:id`
- Role: `admin`.
- Body (`AdminUpdateUserDto`): cap nhat thong tin user.

### `DELETE /user/:id`
- Role: `admin`.
- Soft delete: set status user = `deleted`.

### `POST /user/bulk-delete`
- Role: `admin`.
- Body (`BulkDeleteDto`): `{ "ids": ["id1", "id2"] }`
- Soft delete hang loat.

---

## 4) Sport Module (`/sport`)

Mac dinh module dat role `admin`, nhung 2 endpoint GET mo cho da dang nhap (`@Roles()`).

### `GET /sport`
- Role: da dang nhap.
- Query (`SportQueryDto`): `current`, `limit`, `name`.
- Logic:
  - Filter theo `name` (regex).
  - Bo qua ban ghi da xoa mem (`isDeleted = false`).

### `GET /sport/:id`
- Role: da dang nhap.
- Lay 1 sport active.

### `POST /sport`
- Role: `admin`.
- Body (`SportDto`): `name`, `description?`.
- Logic: check trung ten sport active.

### `PATCH /sport/:id`
- Role: `admin`.
- Update sport, check duplicate ten.

### `DELETE /sport/:id`
- Role: `admin`.
- Soft delete (`isDeleted = true`).

### `POST /sport/bulk-delete`
- Role: `admin`.
- Soft delete hang loat theo `ids`.

---

## 5) Venue Module (`/venue`)

Mac dinh module dat role `admin`, mot so endpoint mo voi `@Roles()`.

### `POST /venue`
- Role: `admin`.
- Body (`CreateVenueDto`):
  - `ownerId`, `name`, `address`, `description`, `operating_hours`, `contact_info`
- Logic:
  - Check unique ten venue theo owner (chi tinh ban ghi chua deleted).
  - Tao venue status `active`.

### `POST /venue/search`
- Role: da dang nhap.
- Body (`FilterBodyDto`):
  - `current`, `limit`, `filter` (object)
- Logic:
  - Luon ep `status = active`.
  - Ho tro regex cho `name`, `address`.

### `GET /venue/:id`
- Role: da dang nhap.
- Lay venue chua bi deleted.

### `PATCH /venue/:id`
- Role: `admin` hoac `owner`.
- Body (`UpdateVenueDto`): field optional + `status?`.
- Logic:
  - Owner khong duoc doi ownerId sang nguoi khac.
  - Owner chi duoc sua venue cua chinh minh.
  - Check trung ten venue theo owner.

### `DELETE /venue/:id`
- Role: `admin`.
- Soft delete: set status = `deleted`.

### `POST /venue/bulk-delete`
- Role: `admin`.
- Soft delete hang loat venue.

---

## 6) Court Module (`/court`)

Mac dinh module dat role `admin`, GET duoc mo cho da dang nhap.

### `GET /court`
- Role: da dang nhap.
- Query (`CourtQueryDto`):
  - `current`, `limit`
  - `name`, `sportId`, `venueId`
  - `minPrice`, `maxPrice`
- Logic:
  - Bo qua court deleted.
  - Filter name (regex), price range.

### `GET /court/:id`
- Role: da dang nhap.
- Lay court active theo id.

### `POST /court`
- Role: `admin`.
- Body (`CreateCourtDto`): `venueId`, `sportId`, `name`, `pricePerHour`, `imageUrl?`.
- Logic:
  - Venue va Sport phai ton tai va active.
  - Check unique ten court trong cung venue.

### `PATCH /court/:id`
- Role: `admin` hoac `owner`.
- Body (`UpdateCourtDto`): field optional + `status?`.
- Logic:
  - Owner chi sua court trong venue cua minh.
  - Neu doi venue, owner khong duoc move sang venue cua owner khac.
  - Check sport ton tai neu doi sport.
  - Check duplicate ten court trong venue dich.

### `DELETE /court/:id`
- Role: `admin`.
- Soft delete: set status = `deleted`.

### `POST /court/bulk-delete`
- Role: `admin`.
- Soft delete hang loat court.

---

## 7) Time Slot Module (`/time-slot`)

Mac dinh role: `admin`, `owner`; endpoint `GET` mo cho da dang nhap.

### `GET /time-slot`
- Role: da dang nhap.
- Query (`TimeSlotQueryDto`):
  - `current`, `limit`
  - `courtId`, `templateId`, `date`, `status`
- Logic:
  - Filter + sort theo `date ASC`.

### `POST /time-slot`
- Role: `admin` hoac `owner`.
- Body (`CreateTimeSlotDto`):
  - `courtId`, `templateId?`, `date`, `startTime`, `endTime`, `price`, `status?`
- Logic:
  - Check nguoi tao co quyen manage court.
  - Mac dinh status `available` neu khong truyen.

### `PATCH /time-slot/:id`
- Role: `admin` hoac `owner`.
- Body (`UpdateTimeSlotDto`): partial.
- Logic:
  - Khong cho doi court cua slot.
  - Check quyen manage court.

### `DELETE /time-slot/:id`
- Role: `admin` hoac `owner`.
- Hard delete 1 slot sau khi check quyen.

### `POST /time-slot/bulk-delete`
- Role: `admin` hoac `owner`.
- Hard delete hang loat sau khi check quyen theo tung court.

---

## 8) Booking Module (`/booking`)

Tat ca endpoint yeu cau dang nhap; mot so endpoint chi `admin`.

### `GET /booking/history`
- Role: user da dang nhap.
- Query (`BookingQueryDto`): `current`, `limit`, `status?`, `startDate?`, `endDate?`.
- Logic:
  - Chi lay booking cua user hien tai.
  - Bo qua booking da soft-delete (`isDeleted = false`).

### `GET /booking/:id`
- Role: user da dang nhap.
- Logic:
  - Chi owner booking moi duoc xem.
  - Tra kem `items`.

### `POST /booking`
- Role: user da dang nhap.
- Body (`CreateBookingDto`): `timeSlotIds: string[]`.
- Logic chinh:
  - Validate danh sach slot.
  - Chay transaction + `pessimistic_write` lock de tranh race condition.
  - Chi book slot dang `AVAILABLE`.
  - Tao booking + booking_items + update slot sang `BOOKED`.

### `POST /booking/search`
- Role: `admin`.
- Body (`FilterBodyDto`): `current`, `limit`, `filter`.
- Logic:
  - Search co pagination.
  - Tu dong them `isDeleted = false`.

### `PATCH /booking/:id`
- Role: `admin`.
- Body (`UpdateBookingDto`): `status?` (+ optional partial tu create dto).
- Logic:
  - Cap nhat trang thai booking.
  - Dong bo trang thai time slot khi chuyen `cancelled` <-> non-cancelled.

### `PATCH /booking/:id/cancel`
- Role: owner booking.
- Logic:
  - User chi duoc cancel booking cua minh.
  - Goi flow update status -> `CANCELLED`.

### `DELETE /booking/:id`
- Role: `admin`.
- Soft delete:
  - set `isDeleted = true`
  - set `status = CANCELLED`
  - nhat trang thai slot ve `AVAILABLE` neu can.

### `POST /booking/bulk-delete`
- Role: `admin`.
- Soft delete hang loat + cancel + release slot.

---

## 9) Review Module (`/review`)

Can dang nhap.

### `GET /review`
- Query (`ReviewQueryDto`):
  - `current`, `limit`
  - `venueId` (bat buoc)
  - `newest` (mac dinh true)
  - `rating?`
- Logic:
  - Kiem tra venue ton tai.
  - Filter review theo query, sort theo `createdAt` (moi nhat truoc neu `newest=true`).

### `POST /review`
- Body (`CreateReviewDto`):
  - `venueId`, `rating` (1..5), `comment?`
- Logic:
  - Tao review cho user dang nhap.

### `PATCH /review/:id`
- Body (`UpdateReviewDto`): partial cua create dto.
- Logic:
  - Chi owner review moi duoc sua.

### `DELETE /review/:id`
- Logic:
  - Owner review hoac admin duoc xoa.
  - Hien tai service dang `delete` truc tiep (hard delete).

---

## 10) Mau goi nhanh

## Dang nhap

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "username123",
    "password": "password"
  }'
```

## Tao booking

```bash
curl -X POST http://localhost:3000/booking \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "timeSlotIds": [
      "44ec4f15-62ba-4c0a-a9e0-f2dd5c6688b5",
      "d8fb4022-a6f4-4a96-a4fb-a57f4da5dd7b"
    ]
  }'
```

## Search venue

```bash
curl -X POST http://localhost:3000/venue/search \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "current": 1,
    "limit": 10,
    "filter": {
      "name": "minh duc"
    }
  }'
```

## Admin bulk delete

```bash
curl -X POST http://localhost:3000/sport/bulk-delete \
  -H "Authorization: Bearer <adminAccessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["id-1", "id-2", "id-3"]
  }'
```

---

## 11) Ghi chu quan trong khi test

- `BulkDeleteDto` nhan `ids` la mang string.
- Cac endpoint co `@Roles()` (khong truyen role) van yeu cau JWT, chi la khong han che role.
- Booking co soft delete (`isDeleted`) va co dong bo trang thai time slot.
- Review hien tai dang hard delete (khac voi booking/sport/court/venue).

---

## 12) Chi tiết các thực thể database (Entity Models)

Phần này mô tả chính xác các schema entity trong `src/modules/**/entities/*.entity.ts`.

### 1. `User` (table: `users`)
- **Khóa chính**: `id` (uuid)
- **Các cột**:
  - `username` (varchar 255)
  - `password` (text)
  - `email` (varchar 255)
  - `full_name` (varchar 255)
  - `phone` (varchar 20, nullable)
  - `role` (enum: USER_ROLE, default: USER)
  - `status` (enum: USER_STATUS, default: ACTIVE)
  - `createdAt`, `updatedAt` (timestamptz)
- **Index & Constraints**:
  - Unique Index trên `username` với điều kiện `"status" != 'DELETED'`
  - Unique Index trên `email` với điều kiện `"status" != 'DELETED'`

### 2. `Session` (table: `sessions`)
- **Khóa chính**: `id` (uuid)
- **Các cột**:
  - `user_id` (uuid)
  - `refresh_token` (text)
  - `jti` (uuid)
  - `expires_at` (timestamptz)
  - `revoked_at` (timestamptz, nullable)
  - `created_at`, `updated_at` (timestamptz)
- **Quan hệ**: `ManyToOne` -> `User` (onDelete: CASCADE)
- **Index & Constraints**:
  - Unique Index trên `jti`
  - Index trên `user_id`, `expires_at`, `revoked_at`

### 3. `Sport` (table: `sports`)
- **Khóa chính**: `id` (uuid)
- **Các cột**:
  - `name` (varchar 255)
  - `description` (text, nullable)
  - `isDeleted` (boolean, default: false)
- **Index & Constraints**:
  - Unique Index trên `name` với điều kiện `"isDeleted" = false`

### 4. `Venue` (table: `venues`)
- **Khóa chính**: `id` (uuid)
- **Các cột**:
  - `owner_id` (uuid)
  - `name` (varchar 255)
  - `address` (varchar 255)
  - `description` (text, nullable)
  - `image_url` (text, nullable)
  - `operating_hours` (jsonb: `{ startTime, endTime }`)
  - `contact_info` (jsonb: `{ phone, email }`)
  - `status` (enum: VENUE_STATUS, default: ACTIVE)
  - `createdAt`, `updatedAt` (timestamptz)
- **Quan hệ**: `ManyToOne` -> `User` (owner)
- **Index & Constraints**:
  - Unique Index trên `(owner_id, name)` với điều kiện `"status" != 'DELETED'`
  - Index trên `owner_id`

### 5. `Court` (table: `courts`)
- **Khóa chính**: `id` (uuid)
- **Các cột**:
  - `venue_id` (uuid)
  - `sport_id` (uuid)
  - `name` (varchar 255)
  - `price_per_hour` (integer)
  - `image_url` (text, nullable)
  - `status` (enum: COURT_STATUS, default: ACTIVE)
  - `createdAt`, `updatedAt` (timestamptz)
- **Quan hệ**:
  - `ManyToOne` -> `Venue` (onDelete: CASCADE)
  - `ManyToOne` -> `Sport`
- **Index & Constraints**:
  - Unique Index trên `(venue_id, name)` với điều kiện `"status" != 'DELETED'`
  - Index trên `venue_id`, `sport_id`

### 6. `TimeSlotTemplate` (table: `time_slot_templates`)
- **Khóa chính**: `id` (uuid)
- **Các cột**:
  - `court_id` (uuid)
  - `weekday` (smallint, 1-7)
  - `start_time` (time)
  - `end_time` (time)
  - `price` (integer)
  - `is_active` (boolean, default: true)
  - `createdAt`, `updatedAt` (timestamptz)
- **Quan hệ**: `ManyToOne` -> `Court` (onDelete: CASCADE)
- **Index & Constraints**:
  - Unique Index trên `(court_id, weekday, start_time, end_time)`
  - Index trên `court_id`

### 7. `TimeSlot` (table: `time_slots`)
- **Khóa chính**: `id` (uuid)
- **Các cột**:
  - `court_id` (uuid)
  - `template_id` (uuid, nullable)
  - `date` (date)
  - `start_time` (time)
  - `end_time` (time)
  - `price` (integer)
  - `status` (enum: TIME_SLOT_STATUS, default: AVAILABLE)
  - `createdAt`, `updatedAt` (timestamptz)
- **Quan hệ**:
  - `ManyToOne` -> `Court` (onDelete: CASCADE)
  - `ManyToOne` -> `TimeSlotTemplate` (onDelete: SET NULL)
- **Index & Constraints**:
  - Unique Index trên `(court_id, date, start_time, end_time)`
  - Index trên `court_id`, `template_id`

### 8. `Booking` (table: `bookings`)
- **Khóa chính**: `id` (uuid)
- **Các cột**:
  - `user_id` (uuid)
  - `total_price` (integer)
  - `status` (enum: BOOKING_STATUS, default: PENDING)
  - `isDeleted` (boolean, default: false)
  - `createdAt`, `updatedAt` (timestamptz)
- **Quan hệ**:
  - `ManyToOne` -> `User`
  - `OneToMany` -> `BookingItem`
- **Index & Constraints**:
  - Index trên `user_id`

### 9. `BookingItem` (table: `booking_items`)
- **Khóa chính**: `id` (uuid)
- **Các cột**:
  - `booking_id` (uuid)
  - `time_slot_id` (uuid, nullable)
  - `court_id` (uuid)
  - `slot_date` (date)
  - `start_time` (time)
  - `end_time` (time)
  - `unit_price` (integer)
  - `total_price` (integer)
  - `createdAt`, `updatedAt` (timestamptz)
- **Quan hệ**:
  - `ManyToOne` -> `Booking` (onDelete: CASCADE)
  - `ManyToOne` -> `TimeSlot` (onDelete: SET NULL)
- **Index & Constraints**:
  - Unique Index trên `time_slot_id` (Mỗi slot chỉ thuộc 1 booking item)
  - Index trên `booking_id`, `time_slot_id`, `court_id`

### 10. `Review` (table: `reviews`)
- **Khóa chính**: `id` (uuid)
- **Các cột**:
  - `user_id` (uuid)
  - `venue_id` (uuid)
  - `comment` (text, nullable)
  - `rating` (int)
  - `createdAt`, `updatedAt` (timestamptz)
- **Quan hệ**:
  - `ManyToOne` -> `User` (onDelete: CASCADE)
  - `ManyToOne` -> `Venue` (onDelete: CASCADE)
- **Index & Constraints**:
  - Unique Index trên `(user_id, venue_id)` (Mỗi user chỉ review 1 lần/venue)
  - Constraint Check `"rating" BETWEEN 1 AND 5`
  - Index trên `user_id`, `venue_id`


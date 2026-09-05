# Hệ thống điều hướng QR động bằng GitHub Pages

## 1. Kết quả của hệ thống

Dự án tạo một **URL trung gian cố định** trên GitHub Pages. Mã QR chỉ mã hóa URL cố định này. Khi giai đoạn dự án thay đổi, quản trị viên sửa link đích trong `config.json`, commit và push; mã QR đã in không phải thay đổi.

Bộ mã còn có trang `qr.html` để tự tạo và tải:

- **SVG vector**: lựa chọn chính để đặt vào Illustrator, InDesign hoặc bàn giao nhà in.
- **PNG nét nguyên ô**: khoảng 1024, 2048 hoặc 4096 px, kích thước thực được tự làm tròn để mỗi module luôn là số pixel nguyên.
- **Print/PDF**: bản in thử ở kích thước 50 mm.

## 2. Kiến trúc được đề xuất

```text
Người dùng quét QR
        ↓
URL GitHub Pages cố định: /du-an-qr/
        ↓
index.html + redirect.js
        ↓ tải mới config.json
targetUrl của giai đoạn hiện tại
        ↓
window.location.replace(targetUrl)
```

Trang `qr.html` là công cụ quản trị riêng. Nó tạo QR cho URL cố định của dự án và không nằm trong luồng chuyển hướng.

## 3. Cấu trúc tệp

| Tệp | Vai trò | Khi nào sửa |
|---|---|---|
| `config.json` | Chứa link đích và tên giai đoạn hiện tại | Mỗi lần chuyển giai đoạn |
| `index.html` | Giao diện chờ/lỗi | Chỉ khi đổi giao diện |
| `redirect.js` | Tải cấu hình, kiểm tra URL và chuyển hướng | Hầu như không sửa |
| `qr.html` | Giao diện tạo QR SVG/PNG | Hầu như không sửa |
| `qr-tool.js` | Tạo ma trận QR và file tải xuống | Hầu như không sửa |
| `.nojekyll` | Yêu cầu GitHub Pages phục vụ tệp tĩnh trực tiếp | Không sửa |

## 4. Điểm đã nâng cấp so với mã một tệp

1. **Chỉ sửa một nơi:** link đích nằm trong `config.json`, không trộn với giao diện.
2. **Giảm lỗi cache trình duyệt:** `redirect.js` tải `config.json` bằng `cache: "no-store"` và gắn tham số thời gian. Việc này không rút ngắn thời gian GitHub Pages triển khai, nhưng tránh giữ cấu hình cũ trong trình duyệt sau khi bản mới đã được phát hành.
3. **An toàn hơn:** chỉ chấp nhận URL `https://`, chặn cấu hình trỏ ngược về chính trang QR và hiển thị lỗi thay vì chuyển hướng mù.
4. **Không làm bẩn lịch sử Back:** dùng `window.location.replace()`.
5. **Có chế độ kiểm tra:** thêm `?preview=1` vào cuối URL cố định để xem giai đoạn và nút mở link mà không bị chuyển ngay.
6. **Tạo QR chuẩn thiết kế:** SVG đen/trắng, không biến dạng, có quiet zone 4 module ở bốn cạnh và mức sửa lỗi M mặc định.

## 5. Thiết lập lần đầu

### Bước 1 — Sửa link Giai đoạn 1

Mở `config.json` và thay ba giá trị:

```json
{
  "targetUrl": "https://duong-link-that-cua-giai-doan-1.example",
  "stageName": "Giai đoạn 1",
  "updatedAt": "2026-09-03T09:00:00+07:00"
}
```

Quy tắc:

- `targetUrl` phải là link đầy đủ bắt đầu bằng `https://`.
- Giữ nguyên dấu ngoặc kép, dấu phẩy và cấu trúc JSON.
- `updatedAt` nên ghi theo múi giờ Việt Nam `+07:00`.

### Bước 2 — Tạo repository

1. Tạo repository, ví dụ `du-an-qr`.
2. Với tài khoản GitHub Free, đặt repository là **Public**.
3. Clone repository bằng GitHub Desktop.
4. Chép toàn bộ các tệp trong bộ mã này vào thư mục gốc.
5. Commit và Push lên nhánh `main`.

### Bước 3 — Bật GitHub Pages

Trong repository trên GitHub:

1. Vào **Settings → Pages**.
2. Ở **Source**, chọn **Deploy from a branch**.
3. Chọn nhánh `main`, thư mục `/(root)` rồi **Save**.
4. Chờ trạng thái triển khai hoàn tất. GitHub lưu ý thay đổi có thể mất tới khoảng 10 phút để xuất bản.

URL thường có dạng:

```text
https://TEN-TAI-KHOAN.github.io/du-an-qr/
```

### Bước 4 — Kiểm tra trước khi tạo QR

Mở:

```text
https://TEN-TAI-KHOAN.github.io/du-an-qr/?preview=1
```

Kiểm tra tên giai đoạn và bấm **Mở nội dung** để xác nhận link đích đúng.

### Bước 5 — Tạo QR chuẩn in

Mở:

```text
https://TEN-TAI-KHOAN.github.io/du-an-qr/qr.html
```

Trang sẽ tự nhận URL cố định `/du-an-qr/` và tạo QR. Chọn **Tải SVG** để đưa vào file thiết kế. Chỉ tạo QR sau khi URL GitHub Pages cuối cùng đã được xác nhận.

## 6. Quy trình đổi giai đoạn

1. Mở `config.json` trong thư mục GitHub Desktop.
2. Thay `targetUrl`, `stageName`, `updatedAt`.
3. Lưu tệp.
4. Trong GitHub Desktop, nhập Summary rõ ràng, ví dụ `Chuyển QR sang Giai đoạn 2`.
5. Chọn **Commit to main** rồi **Push origin**.
6. Chờ Pages triển khai hoàn tất.
7. Mở URL `?preview=1` và kiểm tra.
8. Quét chính bản QR đã in bằng ít nhất hai điện thoại.

**Không tạo lại QR** khi chỉ thay `targetUrl`.

## 7. Tiêu chuẩn và lưu ý in ấn

- Ưu tiên file **SVG**. Có thể phóng lớn/thu nhỏ mà không vỡ nét.
- Không crop phần trắng xung quanh; mã đã có quiet zone rộng 4 module.
- Giữ tương phản cao, tốt nhất là đen 100% trên trắng.
- Không bóp méo, nghiêng phối cảnh, bo tròn module hoặc chèn texture.
- Không đặt logo vào giữa nếu chưa kiểm tra kỹ. Nếu bắt buộc có logo, dùng mức H và kiểm tra trên bản in thật.
- Kích thước phù hợp phụ thuộc khoảng cách quét, chất liệu và máy in. Hãy in lớn nhất có thể trong vùng thiết kế và thử ở điều kiện sử dụng thực tế.
- Với file giao nhà in, đặt SVG vào artwork rồi xuất PDF/X theo quy trình prepress của đơn vị in.

## 8. Rủi ro vận hành cần biết

### URL cố định phải thực sự cố định

Không đổi tên tài khoản GitHub, tên repository hoặc đường dẫn Pages sau khi QR đã in. Với dự án tồn tại lâu, nên dùng một subdomain riêng như `go.tenmien.vn` nếu tổ chức đã sở hữu tên miền; khi đó có thể chuyển nhà cung cấp hosting sau này mà không đổi QR.

### Tất cả cấu hình đều công khai

GitHub Pages là website công khai. Không lưu mật khẩu, token, tài liệu mật hoặc link tương lai chưa được phép công bố trong repository.

### Đây là chuyển hướng phía trình duyệt

Giải pháp cần JavaScript và không trả về HTTP 301/302 từ máy chủ. Nó phù hợp cho poster, sự kiện và tài liệu dự án thông thường; không nên là điểm phụ thuộc duy nhất cho quy trình khẩn cấp hoặc nghiệp vụ yêu cầu SLA cao.

### Không có thống kê lượt quét mặc định

GitHub Pages không cung cấp dashboard đếm scan theo dự án. Có thể bổ sung analytics sau, nhưng số lượt mở trang không hoàn toàn đồng nghĩa với số người quét duy nhất.

### Bảo vệ repository

Nên bật xác thực hai lớp cho tài khoản GitHub, giới hạn người có quyền ghi và bảo vệ nhánh `main`. Người chiếm được quyền sửa repository có thể đổi mọi lượt quét sang một website khác.

## 9. Thư viện QR

Trang `qr.html` tải `qrcode-generator` phiên bản cố định `2.0.4` từ jsDelivr. Đây là thư viện JavaScript mã nguồn mở giấy phép MIT, chỉ dùng khi quản trị viên mở trang tạo QR. Luồng quét và chuyển hướng chính không phụ thuộc thư viện hoặc CDN này.

Nếu dự án yêu cầu công cụ tạo QR chạy hoàn toàn nội bộ/offline, có thể tải file `dist/qrcode.js` của cùng phiên bản vào repository và đổi `src` trong `qr.html` sang đường dẫn cục bộ.

## 10. Checklist trước khi in số lượng lớn

- [ ] URL cố định mở được bằng 4G/5G, không chỉ Wi-Fi nội bộ.
- [ ] `?preview=1` hiển thị đúng giai đoạn và đúng link.
- [ ] QR đang mã hóa URL GitHub Pages, không phải `targetUrl`.
- [ ] File sử dụng là SVG hoặc PNG độ phân giải cao.
- [ ] Vùng trắng quanh QR không bị artwork che phủ.
- [ ] Đã quét thử bằng iPhone và Android trên bản in đúng kích thước.
- [ ] Đã khóa quyết định về tên tài khoản/repository hoặc custom domain.
- [ ] Có ít nhất hai người biết quy trình cập nhật `config.json`.

## 11. Tài liệu tham chiếu

- GitHub Docs — [What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- GitHub Docs — [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- GitHub Docs — [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- DENSO WAVE — [Securing the four-module quiet zone](https://www.qrcode.com/en/howto/code.html)
- DENSO WAVE — [QR error-correction levels](https://www.qrcode.com/en/about/error_correction.html)
- Kazuhiko Arase — [qrcode-generator source and API](https://github.com/kazuhikoarase/qrcode-generator)

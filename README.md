<h2 align="center">
    <a href="https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin">
    🎓 Faculty of Information Technology (DaiNam University)
    </a>
</h2>
<h2 align="center">
    Công nghệ Blockchain
</h2>
<div align="center">
    <p align="center">
        <img src="logo/aiotlab_logo.png" alt="AIoTLab Logo" width="170"/>
        <img src="logo/fitdnu_logo.png" alt="AIoTLab Logo" width="180"/>
        <img src="logo/dnu_logo.png" alt="DaiNam University Logo" width="200"/>
    </p>

[![AIoTLab](https://img.shields.io/badge/AIoTLab-green?style=for-the-badge)](https://www.facebook.com/DNUAIoTLab)
[![Faculty of Information Technology](https://img.shields.io/badge/Faculty%20of%20Information%20Technology-blue?style=for-the-badge)](https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin)
[![DaiNam University](https://img.shields.io/badge/DaiNam%20University-orange?style=for-the-badge)](https://dainam.edu.vn)

</div>
# Quay Số Minh Bạch

Dự án gồm một giao diện quay số chạy trực tiếp trên trình duyệt và một hợp đồng thông minh Solidity để triển khai khi muốn chuyển sang môi trường blockchain thật.

Giao diện hiện tại không yêu cầu MetaMask để dễ demo. Phần blockchain vẫn được giữ trong `lorrety.sol`, có script compile và ABI để tích hợp tiếp với ví sau này.

## Cách chạy giao diện

Mở bằng server local:

```bash
python -m http.server 8080 --bind 127.0.0.1
```

Sau đó vào:

```text
http://127.0.0.1:8080/simple.html
```

## Chức năng giao diện

- Nhập tên người chơi và số dự đoán từ 00 đến 99.
- Lưu danh sách vé hiện tại bằng LocalStorage.
- Xóa từng vé hoặc xóa toàn bộ vé đang nhập.
- Quay số bằng `crypto.getRandomValues()` trên trình duyệt cho bản demo.
- Lưu lịch sử quay bằng tiếng Việt có dấu.
- Hiển thị khu so sánh giữa bản cũ và bản blockchain hiện tại.

## Nâng cấp blockchain

Hợp đồng `lorrety.sol` đã được nâng mạnh hơn so với bản cũ:

- Mỗi vé được mua bằng ETH qua `muaVe()` và tiền vào `prizePoolByRound`.
- Mỗi vòng có `currentRoundId`, không cần xóa mảng lớn để reset dữ liệu.
- Người thắng tự gọi `claimPrize()` để nhận thưởng từ hợp đồng.
- `claimPrize()` có khóa `nonReentrant` để giảm rủi ro gọi lại khi chuyển ETH.
- Quản lý có thể tạm dừng hợp đồng bằng `pauseContract()` và mở lại bằng `unpauseContract()`.
- Khi hợp đồng bị tạm dừng, các thao tác mua vé, quay số, reset vòng và đổi giá vé đều bị chặn.
- Người thắng vẫn có thể claim thưởng khi hợp đồng bị tạm dừng.
- Có `maxTicketsPerRound` để giới hạn số vé mỗi vòng.
- Có `setMaxTicketsPerRound()` để quản lý đổi giới hạn vé trước khi vòng có vé.
- Có mốc thời gian `roundStartedAtByRound` và `roundDrawnAtByRound`.
- Có `getCurrentRoundInfo()` để frontend đọc nhanh toàn bộ trạng thái vòng hiện tại.
- Có `getRoundInfo(roundId)` để xem lại dữ liệu các vòng cũ.
- Có event cho các hành động quan trọng: mua vé, quay số, claim thưởng, reset vòng, đổi giá vé, đổi giới hạn vé, chuyển quản lý, pause và unpause.

## Khác gì so với bản cũ?

Bản cũ chủ yếu là mô phỏng ở trình duyệt: dữ liệu vé và lịch sử nằm trong LocalStorage, refresh hoặc đổi máy là không có trạng thái chung.

Bản blockchain hiện tại đưa các phần quan trọng lên hợp đồng:

- Trạng thái vòng quay nằm trên chain.
- Quỹ thưởng nằm trong contract.
- Giá vé được kiểm tra on-chain.
- Kết quả quay và người thắng phát event để truy vết.
- Reset vòng giữ được lịch sử theo `roundId`.
- Có lớp quản trị vận hành: pause, unpause, đổi giá vé, đổi giới hạn vé, chuyển quyền quản lý.

## Compile hợp đồng

Sau khi sửa `lorrety.sol`, chạy:

```bash
npm.cmd run compile
```

Lệnh này biên dịch hợp đồng và cập nhật lại `abi.js`.
## 🖼️ Poster Đề Tài

<div align="center">

<img width="554" height="804" alt="image" src="https://github.com/user-attachments/assets/ae952aec-5436-4c65-baf4-789011ae8168" />


### 🔗 Tải Poster PowerPoint

[![Download Poster](https://img.shields.io/badge/Download-Poster%20PPTX-orange?style=for-the-badge&logo=microsoftpowerpoint)](./Poster.pptx)

</div>

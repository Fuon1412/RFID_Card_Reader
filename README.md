# RFID_Card_Reader

Cách cài đặt phần mềm<br>

Yêu cầu:- Thiết bị có Nodejs, NPM, Mosquitto version mới nhất, dùng lệnh sau để tải:<br>
            + Nodejs :  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - <br>
                        sudo apt install -y nodejs npm <br>
                        sudo npm install -g npm@latest <br>
            + Mosquitto MQTT Broker: sudo apt install mosquitto mosquitto-clients<br>
        - Port 1883 của thiết bị phải được cấu hình để chấp nhận cả những message ở các thiết bị ngoài nữa, cách làm như sau:<br>
            + Gõ lệnh sudo nano /etc/mosquitto/mosquitto.conf<br>
            + Copy lại 2 dòng dướii vào file text mosquitto.conf giống như trong ảnh dưới đây:<br>
                listener 1883<br>
                allow_anonymous true<br>
            ![alt text](image.png)<br>
            + Ấn tổ hợp phím Ctrl+O để lưu lại, sau đó ấn Enter rồi tổ hợp phím Ctrl+X.<br>
            + Gõ lệnh <b>sudo systemctl restart mosquitto</b> để hệ thống nhận cấu hình.<br>
        - Config để đầu đọc thẻ có cấu trúc JSON như sau:<br>
            {<br>
                "Type": "6C",<br>
                "EPC": "0000000000001000",<br>
                "TID": "E28068942000402C14A1F91A",<br>
                "UserData": "10005466",<br>
                "ReservedData": "",<br>
                "Totalcount": 1,<br>
                "RSSI_db": 0.00<br>
            },<br>
            trong đó UserData sẽ là trường để lưu SKU của sản phẩm cần thanh toán, việc này cần bên thiết bị tự config cho thẻ RFID.<br>
        - Đảm bảo phần cứng của thiết bị đọc đã có thư viện MQTTnet.<br>

1. Setup Server<br>
    1.1. Vào thư mục RFID_Card_Reader(Thư mục con bên trong) <br>
    1.2. Gõ lệnh npm install để giải nén thư viện.<br>
    1.3. Xác nhận lại Mosquitto đã chạy bằng cách dùng lệnh <b>mosquitto -v</b>, nếu có thông báo sau là đã thành công<br>
        ![alt text](image-2.png)<br>
        (Trong trường hợp thấy thông báo là port 1883 đã bị chiếm dụng thì có nghĩa là Mosquitto đã chạy từ trước rồi)<br>
    1.4. Chạy lệnh node server.js để chạy code, hiển thị ra thông báo sau là thành công: <br>
        ![alt text](image-1.png) <br>

2. Setup Client<br>
    2.1. Vào thư mục Web_GUI(Thư mục con bên trong) <br>
    2.2. Gõ lệnh npm install để giải nén thư viện.<br>
    2.3. Gõ lệnh sudo npm install -g serve<br>
    2.4. Gõ lệnh npm run build để build code (phần này sẽ tốn từ 10-30s)<br>
    2.5. Gõ lệnh serve -d dist để chạy code đã build được<br>
    2.6. Truy cập vào link http://localhost:3000 để xác nhận web đã chạy ổn<br>
3. Setup cho phần đầu đọc thẻ RFID <br>
    3.1. Trong phần code xuất ra định dạng dữ liệu của máy, cần thêm đoạn code trong thư mục MqttPublisherTest vào<br>
         Lưu ý: đọc kĩ comment trong code để tránh sai sót<br>
    3.2. Ở phần code xuất dữ liệu của thiết bị, gọi hàm ra và thay tham số như trong comment của code là được.<br>
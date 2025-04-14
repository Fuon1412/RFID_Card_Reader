const mqtt = require('mqtt');
const http = require('http');
const { Server } = require('socket.io');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Khởi tạo server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://172.27.35.137:3000"],
    methods: ["GET", "POST"]
  }
});
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Khởi tạo database SQLite
const db = new sqlite3.Database('./products.db', (err) => {
  if (err) {
    console.error('Lỗi kết nối database:', err.message);
  } else {
    console.log('Đã kết nối tới SQLite database');
    initDb();
  }
});

// Khởi tạo database và seed dữ liệu ban đầu
function initDb() {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    image_url TEXT
  )`, (err) => {
    if (err) {
      console.error('Lỗi tạo bảng products:', err.message);
    } else {
      console.log('Bảng products đã được tạo hoặc đã tồn tại');

      // Kiểm tra xem đã có dữ liệu chưa
      db.get("SELECT COUNT(*) as count FROM products", [], (err, row) => {
        if (err) {
          console.error('Lỗi kiểm tra dữ liệu:', err.message);
        } else if (row.count === 0) {
          seedProducts();
        } else {
          console.log('Database đã có dữ liệu, bỏ qua bước seed');
        }
      });
    }
  });
}

// Thêm dữ liệu sản phẩm từ bảng trong hình ảnh
function seedProducts() {
  const products = [
    { sku: '10005466', name: 'Sữa chua có đường NutiFood Hộp 100g', price: 4800, image_url: 'images/10005466.png' },
    { sku: '10170370', name: 'Lốc 4 hộp sữa tươi tiệt trùng Nutimilk100 có đường 180ml', price: 25800, image_url: 'images/10170370.png' },
    { sku: '10005279', name: 'Vỉ 4 hộp váng sữa hương vani Zott Monte 55g', price: 58600, image_url: 'images/10005279.png' },
    { sku: '10005426', name: 'Sữa tươi tiệt trùng Cô gái Hà Lan có đường túi 180ml', price: 5800, image_url: 'images/10005426.png' },
    { sku: '10197492', name: 'Nước tăng lực Thums Up hương dâu chai 330ml', price: 5900, image_url: 'images/10197492.png' },
    { sku: '10197494', name: 'Nước tăng lực Thums Up hương Kiwi chai 330ml', price: 5900, image_url: 'images/10197494.png' },
    { sku: '10196217', name: 'Café Vinacafé 3in1 Gold Original 306g', price: 44200, image_url: 'images/10196217.png' },
    { sku: '10010686', name: 'Nước uống sữa trái cây bổ dưỡng hương cam Nutri Boost chai 1L', price: 20200, image_url: 'images/10010686.png' },
    { sku: '10010687', name: 'Nước uống sữa trái cây hương dâu Nutri Boost chai 1L', price: 20200, image_url: 'images/10010687.png' },
    { sku: '10011262', name: 'Thức uống thiên nhiên pha sữa vị hỗn hợp dâu Latte chai 345ml', price: 10300, image_url: 'images/10011262.png' },
    { sku: '10150203', name: 'Nước Cam Ép Twister 1L', price: 19000, image_url: 'images/10150203.png' },
    { sku: '10150350', name: 'Trà Nestea vị hoa quả hộp 144g', price: 27700, image_url: 'images/10150350.png' }
  ];

  const insertStmt = db.prepare("INSERT INTO products (sku, name, price, image_url) VALUES (?, ?, ?, ?)");

  products.forEach(product => {
    insertStmt.run(product.sku, product.name, product.price, product.image_url);
  });

  insertStmt.finalize();
  console.log('Đã thêm dữ liệu sản phẩm vào database');
}

const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  console.log('Đã kết nối tới MQTT broker');
  client.subscribe('rfid/scan', (err) => {
    if (err) {
      console.error('Lỗi đăng ký topic:', err);
    } else {
      console.log('Đã đăng ký topic: rfid/scan');
    }
  });
});

client.on('message', (topic, message) => {
  if (topic === 'rfid/scan') {
    try {
      const rfidData = JSON.parse(message.toString());
      console.log('Nhận dữ liệu RFID:', rfidData);

      const foundProducts = [];
      const promises = [];

      rfidData.forEach(item => {
        const promise = new Promise((resolve) => {
          const sku = item.UserData;

          if (!sku) {
            return resolve({
              rfid: item.TID,
              error: 'Không có UserData/SKU'
            });
          }

          db.get("SELECT * FROM products WHERE sku = ?", [sku], (err, product) => {
            if (err) {
              console.error('Lỗi truy vấn database:', err);
              return resolve({
                rfid: item.TID,
                error: 'Lỗi database'
              });
            }

            if (product) {
              return resolve({
                rfid: item.TID,
                sku: product.sku,
                name: product.name,
                price: product.price,
                image_url: product.image_url
              });
            } else {
              console.log('Không tìm thấy sản phẩm với SKU:', sku);
              return resolve({
                rfid: item.TID,
                error: 'Không tìm thấy sản phẩm'
              });
            }
          });
        });

        promises.push(promise);
      });

      Promise.all(promises).then(results => {
        console.log('Kết quả tìm sản phẩm:', results);

        const validProducts = results.filter(item => !item.error);

        client.publish('rfid/products', JSON.stringify(results));
        io.emit('products', results);
      });

    } catch (error) {
      console.error('Lỗi xử lý message RFID:', error);
      const errorMessage = { error: 'Định dạng message không hợp lệ' };
      client.publish('rfid/products', JSON.stringify(errorMessage));
      io.emit('products', errorMessage);
    }
  }
});

app.get('/api/products', (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/product/:sku', (req, res) => {
  db.get("SELECT * FROM products WHERE sku = ?", [req.params.sku], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
      return;
    }
    res.json(row);
  });
});

io.on('connection', (socket) => {
  console.log('Client kết nối');

  socket.on('disconnect', () => {
    console.log('Client ngắt kết nối');
  });
});

app.use('/images', express.static(path.join(__dirname, 'images')));

const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log('Đã tạo thư mục images');
}

server.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Lỗi đóng kết nối database:', err.message);
    } else {
      console.log('Đã đóng kết nối database');
    }
    process.exit(0);
  });
});
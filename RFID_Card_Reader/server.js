require ('dotenv').config();
const mqtt = require('mqtt');
const http = require('http');
const { Server } = require('socket.io');
const express = require('express');
const cors = require('cors');
const { getProductsById , createOrder, makePayment, getBillFromTransactionId} = require('./database');

// --- App & Server ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- MQTT ---
const client = mqtt.connect(process.env.MQTT_SERVER);

client.on('connect', () => {
  client.subscribe('rfid/scan', (err) => {
    if (!err) console.log('Đã subscribe topic: rfid/scan');
  });
});

client.on('message', async (topic, message) => {
  if (topic === 'rfid/scan') {
    try {
      const rfidData = JSON.parse(message.toString());
      console.log(`🔎 Đang xử lý ${rfidData.length} sản phẩm...`);

      const promises = rfidData.map(async (item, index) => {
        const sku = item.UserData;
        if (!sku) {
          console.warn(`  [${index}] Không có UserData`);
          return { rfid: item.TID, error: 'Không có UserData' };
        }

        const product = await getProductsById(sku);

        if (product) {
          console.log(`  [${index}] Tìm thấy sản phẩm SKU: ${sku}`, product);
          return {
            rfid: item.TID,
            sku: sku,
            name: product.name,
            price: product.price,
            image_url: product.imageUrl || ''
          };
        } else {
          console.warn(`  [${index}] Không tìm thấy sản phẩm với SKU: ${sku}`);
          return { rfid: item.TID, error: 'Không tìm thấy sản phẩm' };
        }
      });

      const results = await Promise.all(promises);
      io.emit('products', results);
      client.publish('rfid/products', JSON.stringify(results));
    } catch (err) {
      console.error(' Lỗi parse JSON hoặc xử lý:', err);
      const errMsg = { error: 'JSON không hợp lệ' };
      io.emit('products', errMsg);
      client.publish('rfid/products', JSON.stringify(errMsg));
    }
  }
});

// --- REST API ---
app.get('/api/bill/:transactionId', async (req, res) => {
  const { transactionId } = req.params;

  if (!transactionId) {
    return res.status(400).json({ error: 'Thiếu transactionId' });
  }

  try {
    const bill = await getBillFromTransactionId(transactionId);
    if (!bill) {
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });
    }
    res.status(200).json(bill);
  } catch (error) {
    console.error('Lỗi khi lấy hóa đơn:', error);
    res.status(500).json({ error: 'Lỗi khi lấy hóa đơn' });
  }
});
app.post('/api/order', async (req, res) => {
  const { products } = req.body;
  if (!products || products.length === 0) {
    return res.status(400).json({ error: 'Không có sản phẩm để thanh toán' });
  }
  try {
    const order = await createOrder(products);
    res.status(201).json(order.id);
  } catch (error) {
    console.error('Lỗi khi tạo đơn hàng:', error);
    res.status(500).json({ error: 'Lỗi khi tạo đơn hàng' });
  }
});

app.post('/api/payment', async (req, res) => {
  const { transactionId } = req.body;

  if (!transactionId) {
    return res.status(400).json({ error: 'Thiếu transactionId' });
  }

  try {
    const order = await makePayment(transactionId);
    res.status(200).json({ status: 'success', transactionId: order.id });
  } catch (error) {
    console.error('Lỗi khi thanh toán:', error);
    res.status(500).json({ error: 'Lỗi khi thanh toán' });
  }
});



// --- Socket.IO ---
io.on('connection', (socket) => {
  socket.on('disconnect', () => console.log(' Client ngắt kết nối'));
});

// --- Start server ---
server.listen(PORT, "0.0.0.0");



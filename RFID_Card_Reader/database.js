const db = require("./firebase");
const { v4: uuidv4 } = require('uuid');

//Initialize Firebase Products table
const initProducts = [
    {
        "id": 10005466,
        "name": "Sữa chua có đường NutiFood Hộp 100g",
        "price": 4800,
        "image_url": "https://www.moby.com.vn/data/bt4/sua-chua-co-duong-nutimilk-hop-100g-loc-4-hop-1631264906.jpg",
        "stock": 100
    },
    {
        "id": 10170370,
        "name": "Lốc 4 hộp sữa tươi tiệt trùng Nutimilk100 có đường 180ml",
        "price": 25600,
        "image_url": "https://cdn1.concung.com/storage/2023/04/1681193743-sua-tuoi-tiet-trung-co-duong-vinamilk-180ml-loc-4-hop-chinh-dien-crop.png",
        "stock": 100
    },
    {
        "id": 10005279,
        "name": "Vỉ 4 hộp váng sữa hương vani Zott Monte 55g",
        "price": 58600,
        "image_url": "https://cdn1.concung.com/2025/02/55771-118824-large_mobile/vang-sua-zott-monte-huong-vani-4x55g.png",
        "stock": 100
    },
    {
        "id": 10005426,
        "name": "Sữa tươi tiệt trùng Cô gái Hà Lan có đường túi 180ml",
        "price": 5800,
        "image_url": "https://suachobeyeu.vn/upload/images/sua-co-gai-ha-lan-co-duong-bich-180ml-a2.jpg",
        "stock": 100
    },
    {
        "id": 10197492,
        "name": "Nước tăng lực Thums Up hương dâu chai 330ml",
        "price": 5900,
        "image_url": "https://cdn.tgdd.vn/Products/Images/3226/307605/bhx/nuoc-tang-luc-thums-up-charged-dau-rung-chai-330ml-202305291002447738.jpg",
        "stock": 100
    },
    {
        "id": 10197494,
        "name": "Nước tăng lực Thums Up hương Kiwi chai 330ml",
        "price": 5900,
        "image_url": "https://cdn.tgdd.vn/Products/Images/3226/307599/bhx/nuoc-tang-luc-thums-up-charged-kiwi-chai-330ml-202306020856151148.jpg",
        "stock": 100
    },
    {
        "id": 10196217,
        "name": "Café Vinacafé 3in1 Gold Original 306g",
        "price": 44200,
        "image_url": "https://hcm.fstorage.vn/images/2024/11/10196217-20241128031623.jpg",
        "stock": 100
    },
    {
        "id": 10010686,
        "name": "Nước uống sữa trái cây bổ dưỡng hương cam Nutri Boost chai 1L",
        "price": 20200,
        "image_url": "https://storage.googleapis.com/sc_pcm_product/prod/2024/2/28/20473-379822.jpg",
        "stock": 100
    },
    {
        "id": 10010687,
        "name": "Nước uống sữa trái cây hương dâu Nutri Boost chai 1L",
        "price": 20200,
        "image_url": "https://cdn.tgdd.vn/Products/Images/2947/79219/bhx/sua-trai-cay-nutriboost-huong-dau-1-lit-202407091313139626.jpg",
        "stock": 100
    },
    {
        "id": 10011262,
        "name": "Thức uống thiên nhiên pha sữa vị hỗn hợp dâu Latte chai 345ml",
        "price": 10300,
        "image_url": "https://tmp.phongvu.vn/wp-content/uploads/2020/11/N%C6%B0%E1%BB%9Bc-u%E1%BB%91ng-h%E1%BB%97n-h%E1%BB%A3p-Latte-d%C3%A2u-s%E1%BB%AFa-345ml-e1605776690609.jpg",
        "stock": 100
    },
    {
        "id": 10150203,
        "name": "Nước Cam Ép Twister 1L",
        "price": 19000,
        "image_url": "https://cdn.tgdd.vn/Products/Images/3265/219795/bhx/nuoc-cam-ep-twister-chai-1-lit-202003161057443056.jpg",
        "stock": 100
    },
    {
        "id": 10150550,
        "name": "Trà Nestea vị hoa quả hộp 144g",
        "price": 27700,
        "image_url": "https://cdn.tgdd.vn/Products/Images/2385/228188/bhx/tra-nestea-hop-vi-hoa-qua-144g-202009110903495983.jpg",
        "stock": 100
    }
];

async function initProductsToFirebase(initProducts) {
    try {
        const snapshot = await db.ref('products').once('value');

        if (snapshot.exists()) {
            return;
        }

        initProducts.forEach(product => {
            const id = product.id;
            db.ref(`products/${id}`).set(product, error => {
                if (error) {
                    console.error(`Lỗi khi thêm sản phẩm ${id}:`, error);
                }
            });
        });
    } catch (error) {
        console.error("Lỗi khi kiểm tra dữ liệu Firebase:", error);
    }
}

//Query function
async function getProductsById(id) {
    try {
        const snapshot = await db.ref(`products/${id}`).once('value');

        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            return null;
        }
    } catch (error) {
        console.error("Lỗi khi lấy sản phẩm:", error);
        throw error; 
    }
}

async function createOrder(products) {
    try {
        const transactionId = uuidv4();

        const total_amount = products.reduce((sum, item) => sum + (item.quantity || 1) * (item.price || 0), 0);

        const orderItems = products.map(item => ({
            productId: item.id,
            name: item.name,
            quantity: item.quantity,
        }));

        const order = {
            id: transactionId,
            items: orderItems,
            total_amount: total_amount,
            time_stamp: new Date().toISOString(),
            status: "pending"
        };

        await db.ref(`transactions/${transactionId}`).set(order);
        return order;
    } catch (error) {
        console.error("Lỗi khi tạo đơn hàng:", error);
        throw error;
    }
}

async function makePayment(transactionId) {
    try {
        const orderRef = db.ref(`transactions/${transactionId}`);
        const snapshot = await orderRef.once('value');

        if (snapshot.exists()) {
            const order = snapshot.val();
            order.status = "completed";
            await orderRef.set(order);
            return order;
        } else {
            throw new Error("Đơn hàng không tồn tại");
        }
    } catch (error) {
        console.error("Lỗi khi thanh toán:", error);
        throw error;
    }
}

module.exports = {
    getProductsById,
    createOrder,
    makePayment,
}
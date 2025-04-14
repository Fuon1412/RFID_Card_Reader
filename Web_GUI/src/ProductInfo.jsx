import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import {
    Alert, Typography, Divider,
    Button, Row, Col, Modal, Space, message, Table, Image
} from 'antd';

const { Title, Text } = Typography;

const ProductInfo = () => {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    const API_URL = 'http://localhost:3001';

    const handlePayment = () => {
        if (products.length === 0) {
            message.warning("Không có sản phẩm để thanh toán!");
            return;
        }
        setIsModalVisible(true);
        setIsLocked(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setProducts([]);
        setIsLocked(false);
    };

    useEffect(() => {
        const socket = io(API_URL);

        socket.on('connect', () => {
            console.log('Đã kết nối với server');
        });

        socket.on('products', (data) => {
            if (!isLocked) {
                if (data.error) {
                    setError(data.error);
                    setProducts([]);
                } else {
                    setError(null);
                    setProducts(prevProducts => {
                        // Chuyển đổi data thành mảng nếu nó không phải là mảng
                        const newData = Array.isArray(data) ? data : [data];

                        // Không kiểm tra trùng lặp, thêm tất cả các sản phẩm mới vào giỏ hàng
                        return [...prevProducts, ...newData];
                    });
                }
            }
        });

        socket.on('connect_error', (err) => {
            console.error('Lỗi kết nối socket:', err);
            setError('Không thể kết nối với server');
        });

        return () => socket.disconnect();
    }, [isLocked]);

    const totalItems = products.length; // Số lượng sản phẩm
    const totalPrice = products.reduce((acc, curr) => acc + (curr.price || 0), 0); // Tổng giá
    const discount = 0;
    const finalPrice = totalPrice - discount;

    const columns = [
        {
            title: 'Ảnh',
            dataIndex: 'image_url',
            key: 'image',
            width: 80,
            render: (image_url, record) =>
                !record.error && image_url ? (
                    <Image
                        src={`${API_URL}/${image_url}`}
                        alt={record.name}
                        width={60}
                        height={60}
                        style={{ objectFit: 'contain' }}
                        fallback="https://via.placeholder.com/60"
                    />
                ) : null,
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) =>
                record.error ? (
                    <Alert
                        message={`RFID: ${record.rfid}`}
                        description={record.error}
                        type="warning"
                        showIcon
                    />
                ) : (
                    <Text strong>{text}</Text>
                ),
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            render: (price) => price ? `${price.toLocaleString()} đ` : '-',
        },
    ];

    return (
        <div style={{
            padding: 24,
            backgroundColor: '#f5f5f5',
            minHeight: '100vh'
        }}>
            <div style={{
                width: 1028,
                height: 720,
                margin: '0 auto',
                background: '#fff',
                padding: 24,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
            }}>
                <Title level={3}>🛒 Hóa đơn thanh toán </Title>

                {error && (
                    <Alert
                        message="Lỗi"
                        description={error}
                        type="error"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                {!error && products.length > 0 ? (
                    <>
                        {/* Đặt phần bảng để mở rộng từ dưới */}
                        <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                            <Table
                                dataSource={products}
                                columns={columns}
                                pagination={false}
                                rowKey={(record, index) => index}
                                style={{ marginBottom: 24 }}
                                scroll={{ y: 300 }}
                            />
                        </div>

                        <Divider />

                        <div style={{ fontSize: 16, marginBottom: 24, color: '#000' }}>
                            <Row justify="space-between">
                                <Col>Sản phẩm</Col>
                                <Col>{totalItems}</Col>
                            </Row>
                            <Row justify="space-between">
                                <Col>Thành tiền</Col>
                                <Col>{totalPrice.toLocaleString()}đ</Col>
                            </Row>
                            <Row justify="space-between">
                                <Col>Chiết khấu</Col>
                                <Col>{discount.toLocaleString()}đ</Col>
                            </Row>
                            <Divider />
                            <Row justify="space-between" style={{ fontWeight: 'bold' }}>
                                <Col>Tổng cộng</Col>
                                <Col>{finalPrice.toLocaleString()}đ</Col>
                            </Row>
                        </div>

                        <Button
                            type="primary"
                            size="large"
                            block
                            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                            onClick={handlePayment}
                        >
                            THANH TOÁN
                        </Button>
                    </>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '80%',
                        color: '#888'
                    }}>
                        <div style={{ fontSize: 60, marginBottom: 16 }}>📦</div>
                        <Text style={{ fontSize: 18 }}>Chưa có sản phẩm nào</Text>
                        <Text style={{ fontSize: 16, color: '#aaa' }}>Quét các sản phẩm để thêm vào giỏ hàng</Text>
                    </div>
                )}
            </div>

            <Modal
                open={isModalVisible}
                onCancel={handleCloseModal}
                footer={null}
                centered
                width={360}
            >
                <div style={{ textAlign: 'center', padding: 12 }}>
                    <Title level={4}>💸 Số tiền cần thanh toán</Title>
                    <Title level={3} style={{ color: '#1890ff' }}>
                        {finalPrice.toLocaleString()}đ
                    </Title>
                    <Text>Sử dụng ứng dụng ngân hàng<br />hoặc ví điện tử để quét mã</Text>

                    <div style={{ marginTop: 16 }}>
                        <img src="/qr_demo.png" alt="QR Code" style={{ width: 180 }} />
                    </div>

                    <Space style={{ marginTop: 20 }}>
                        <Button>In mã</Button>
                        <Button type="primary">Kiểm tra</Button>
                        <Button onClick={handleCloseModal}>Đóng</Button>
                    </Space>
                </div>
            </Modal>
        </div>
    );
};

export default ProductInfo;

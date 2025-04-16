import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import QRCode from 'qrcode';
import {
    Alert, Typography, Divider,
    Button, Row, Col, Modal, Space, message, Table, Image
} from 'antd';
import {ShoppingCartOutlined, DropboxOutlined} from '@ant-design/icons';

const { Title, Text } = Typography;

const ProductInfo = () => {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [qrImage, setQrImage] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL;
    const windowIp = import.meta.env.VITE_WINDOW_IP;
    const port = import.meta.env.VITE_PORT;

    const handlePayment = async () => {
        if (products.length === 0) {
            message.warning("Không có sản phẩm để thanh toán!");
            return;
        }

        setIsLocked(true);

        try {
            const response = await fetch(`${API_URL}/api/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products })
            });

            const result = await response.json();
            console.log("Kết quả tạo đơn hàng:", result);
            const transactionId = result;

            const qrLink = `http://${windowIp}:${port}/invoice/${transactionId}`;
            const qr = await QRCode.toDataURL(qrLink);
            setQrImage(qr);

            setIsModalVisible(true);

        } catch (err) {
            console.error("Lỗi khi tạo đơn hàng:", err);
            message.error("Lỗi khi tạo đơn hàng!");
            setIsLocked(false);
        }
    };


    const handleCloseModal = () => {
        setIsModalVisible(false);
        setQrImage(null);
        setIsLocked(false);
        setProducts([]);
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
                    const newData = Array.isArray(data) ? data : [data];
                    setProducts(prevProducts => [...prevProducts, ...newData]);
                }
            }
        });

        socket.on('connect_error', (err) => {
            console.error('Lỗi kết nối socket:', err);
            setError('Không thể kết nối với server');
        });

        return () => socket.disconnect();
    }, [isLocked, API_URL]);

    const totalItems = products.length;
    const totalPrice = products.reduce((acc, curr) => acc + (curr.price || 0), 0);
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
                        src={`${image_url}`}
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
            position: 'fixed', // Sử dụng position fixed để chiếm toàn bộ viewport
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            backgroundColor: '#f5f5f5',
            overflow: 'auto', // Thêm overflow để xử lý nội dung lớn hơn màn hình
        }}>
            <div style={{
                maxWidth: '1024px',
                height: 'auto',
                background: '#fff',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                width: '100%',
                maxHeight: '90vh', // Giới hạn chiều cao để không tràn ra ngoài viewport nếu cần
            }}>
                <Title level={3}><ShoppingCartOutlined />Hóa đơn thanh toán</Title>

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
                        height: '100%', // Chiếm toàn bộ chiều cao của container cha
                        color: '#888'
                    }}>
                        <div style={{ fontSize: 60, marginBottom: 16 }}><DropboxOutlined /></div>
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
                    <Title level={4}>Số tiền cần thanh toán</Title>
                    <Title level={3} style={{ color: '#1890ff' }}>
                        {finalPrice.toLocaleString()}đ
                    </Title>
                    <Text>Quét mã QR để xem hóa đơn</Text>

                    <div style={{ marginTop: 16 }}>
                        {qrImage ? (
                            <img src={qrImage} alt="QR Code" style={{ width: 180 }} />
                        ) : (
                            <Text>Đang tạo mã QR...</Text>
                        )}
                    </div>

                    <Space style={{ marginTop: 20 }}>
                        <Button onClick={handleCloseModal}>Đóng</Button>
                    </Space>
                </div>
            </Modal>
        </div>
    );
};

export default ProductInfo;
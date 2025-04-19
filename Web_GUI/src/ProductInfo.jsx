import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import QRCode from 'qrcode';
import {
    Alert, Typography, Divider,
    Button, Row, Col, Modal, Space, message, Table, Image
} from 'antd';
import { ShoppingCartOutlined, DropboxOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ProductInfo = () => {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [qrImage, setQrImage] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const windowIp = import.meta.env.VITE_WINDOW_IP;
    const port = import.meta.env.VITE_PORT;

    const handlePayment = async () => {
        if (products.length === 0) {
            message.warning("Không có sản phẩm để thanh toán!");
            return;
        }

        setIsLocked(true);

        try {
            const expandedProducts = products.flatMap(product =>
                Array(product.quantity).fill().map(() => ({
                    rfid: product.rfid,
                    sku: product.sku,
                    name: product.name,
                    price: product.price,
                    image_url: product.image_url || ''
                }))
            );

            const response = await fetch(`${API_URL}/api/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: expandedProducts })
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
                    const newItems = Array.isArray(data) ? data : [data];

                    setProducts(prevProducts => {
                        const updatedProducts = [...prevProducts];
                        newItems.forEach(newItem => {
                            if (newItem.error) return;
                            const existingProductIndex = updatedProducts.findIndex(
                                p => p.sku === newItem.sku && !p.error
                            );

                            if (existingProductIndex >= 0) {
                                updatedProducts[existingProductIndex].quantity =
                                    (updatedProducts[existingProductIndex].quantity || 1) + 1;
                            } else {
                                updatedProducts.push({
                                    ...newItem,
                                    quantity: 1
                                });
                            }
                        });

                        return updatedProducts;
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

    // Tính tổng số lượng và giá tiền
    const totalItems = products.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
    const totalPrice = products.reduce((acc, curr) => {
        const quantity = curr.quantity || 1;
        return acc + (curr.price || 0) * quantity;
    }, 0);
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
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 100,
            render: (quantity, record) => !record.error ? (quantity || 1) : '-',
        },
        {
            title: 'Thành tiền',
            key: 'subtotal',
            width: 120,
            render: (_, record) => {
                if (record.error) return '-';
                const quantity = record.quantity || 1;
                const subtotal = (record.price || 0) * quantity;
                return `${subtotal.toLocaleString()} đ`;
            },
        },
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            backgroundColor: '#FFFCF9',
            overflow: 'auto',
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
                maxHeight: '90vh',
            }}>
                <img
                    src="/logo_speedy_gb.png"
                    alt="Speedy Logo"
                    style={{
                        display: 'block',
                        margin: '0 auto',
                        width: '100px', 
                        marginBottom: '8px', 
                        marginTop: '-8px' 
                    }}
                />
                {error && (
                    <Alert
                        message="Lỗi"
                        description={error}
                        type="error"
                        showIcon
                        style={{ marginBottom: '16px' }}
                    />
                )}

                {!error && products.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '24px' }}>
                            <Table
                                dataSource={products}
                                columns={columns}
                                pagination={false}
                                rowKey={(record, index) => index}
                                scroll={{ y: 300 }}
                            />
                        </div>

                        <Divider style={{ borderBlockWidth: '2px' }} />

                        <div style={{ fontSize: '16px', marginBottom: '24px', color: '#000' }}>
                            <Row justify="space-between">
                                <Col>Tổng số lượng</Col>
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
                            <Divider style={{
                                borderTop: '2px solid #000' 
                            }} />
                            <Row justify="space-between" style={{ fontWeight: 'bold' }}>
                                <Col>Tổng cộng</Col>
                                <Col>{finalPrice.toLocaleString()}đ</Col>
                            </Row>
                        </div>

                        <Button
                            type="primary"
                            size="large"
                            block
                            style={{ backgroundColor: '#419B79', borderColor: '#52c41a' }}
                            onClick={handlePayment}
                        >
                            THANH TOÁN
                        </Button>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '80%',
                        color: '#888'
                    }}>
                        <div style={{ fontSize: '60px', marginBottom: '16px' }}><DropboxOutlined /></div>
                        <Text style={{ fontSize: '18px' }}>Chưa có sản phẩm nào</Text>
                        <Text style={{ fontSize: '16px', color: '#aaa' }}>Quét các sản phẩm để thêm vào giỏ hàng</Text>
                    </div>
                )}
            </div>

            <Modal
                open={isModalVisible}
                onCancel={handleCloseModal}
                footer={null}
                centered
                width={360}
                style={{
                    mask: {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(5px)',
                    }
                }}
                mask={true}
                styles={{
                    mask: {
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)' // Hỗ trợ Safari
                    }
                }}
            >
                <div style={{ textAlign: 'center', padding: '12px' }}>
                    <Title level={4}> Số tiền cần thanh toán</Title>
                    <Title level={3} style={{ color: '#1890ff' }}>
                        {finalPrice.toLocaleString()}đ
                    </Title>
                    <Text>Quét mã QR để xem hóa đơn</Text>

                    <div style={{ marginTop: '16px' }}>
                        {qrImage ? (
                            <img src={qrImage} alt="QR Code" style={{ width: '180px' }} />
                        ) : (
                            <Text>Đang tạo mã QR...</Text>
                        )}
                    </div>

                    <Space style={{ marginTop: '20px' }}>
                        <Button
                            onClick={handleCloseModal}
                            style={{
                                backgroundColor: '#0071bc', // màu giống ảnh
                                color: '#fff',
                                borderColor: '#005999' // viền đậm hơn chút
                            }}
                        >Đóng</Button>
                    </Space>
                </div>
            </Modal>
        </div>
    );
};

export default ProductInfo;
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Layout,
    Spin,
    Alert,
    Result,
    Button,
    Typography,
    Space,
    Card,
    Table,
} from 'antd';

const { Content } = Layout;
const { Text, Title } = Typography;

const InvoicePage = () => {
    const { id: transactionId } = useParams();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const [billData, setBillData] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchPaymentStatus = async () => {
            try {
                const response = await fetch(`${API_URL}/api/payment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transactionId }),
                });

                if (!response.ok) throw new Error('Lỗi từ server hoặc kết nối không ổn định.');

                const result = await response.json();
                if (result.status === 'success') {
                    setStatus('success');
                    fetchBillDetails(); // Gọi tiếp nếu thanh toán thành công
                } else {
                    setStatus('error');
                    setErrorMessage(result.error || 'Không tìm thấy giao dịch hoặc thanh toán không thành công.');
                }
            } catch (err) {
                console.error('Lỗi khi xác nhận thanh toán:', err);
                setStatus('error');
                setErrorMessage(err.message || 'Đã có lỗi khi xác nhận thanh toán. Vui lòng kiểm tra lại kết nối.');
            } finally {
                setLoading(false);
            }
        };

        const fetchBillDetails = async () => {
            try {
                const res = await fetch(`${API_URL}/api/bill/${transactionId}`);
                if (!res.ok) throw new Error('Không thể tải hóa đơn.');

                const bill = await res.json();
                setBillData(bill);
            } catch (error) {
                console.error('Lỗi khi lấy hóa đơn:', error);
                setErrorMessage('Lỗi khi tải dữ liệu hóa đơn.');
            }
        };

        fetchPaymentStatus();
    }, [transactionId]);

    const columns = [
        {
            title: 'Hình ảnh',
            dataIndex: 'image_url',
            key: 'image_url',
            render: (url) => <img src={url} alt="product" style={{ width: 60, height: 60, objectFit: 'cover' }} />,
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
        },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            key: 'price',
            render: (value) => `${value.toLocaleString()} ₫`,
        },
        {
            title: 'Thành tiền',
            key: 'subtotal',
            render: (_, record) => `${(record.price * record.quantity).toLocaleString()} ₫`,
        }
    ];

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Content
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '24px',
                }}
            >
                <Card
                    style={{
                        maxWidth: 900,
                        width: '100%',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        borderRadius: '12px',
                    }}
                >
                    {loading ? (
                        <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
                            <Spin size="large" tip="Đang xác nhận thanh toán..." />
                        </Space>
                    ) : status === 'success' ? (
                        <>
                            <Result
                                status="success"
                                title="Thanh toán thành công!"
                                subTitle={<Text strong>Mã giao dịch: {transactionId}</Text>}
                            />
                            {billData ? (
                                <>
                                    <Title level={4}>Chi tiết hóa đơn</Title>
                                    <Text strong>Thời gian:</Text>{' '}
                                    {new Date(billData.time_stamp).toLocaleString('vi-VN')}<br />
                                    <Text strong>Trạng thái:</Text>{' '}
                                    <Text type="success">{billData.status}</Text> <br />
                                    <Text strong>Tổng tiền:</Text>{' '}
                                    <Text type="danger" strong>
                                        {billData.total_amount.toLocaleString()} ₫
                                    </Text>

                                    <Table
                                        style={{ marginTop: 20 }}
                                        columns={columns}
                                        dataSource={billData.items}
                                        pagination={false}
                                        rowKey={(record, index) => `${record.sku}-${index}`}
                                    />
                                </>
                            ) : (
                                <Spin tip="Đang tải dữ liệu hóa đơn..." />
                            )}
                        </>
                    ) : (
                        <Alert
                            message="Thanh toán thất bại"
                            description={errorMessage || 'Đã có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại sau.'}
                            type="error"
                            showIcon
                        />
                    )}
                </Card>
            </Content>
        </Layout>
    );
};

export default InvoicePage;

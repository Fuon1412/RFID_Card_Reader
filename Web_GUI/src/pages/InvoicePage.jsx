import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Result, Spin, Alert, Button } from 'antd';

const InvoicePage = () => {
    const { id: transactionId } = useParams();
    const [status, setStatus] = useState(null);      
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchPaymentStatus = async () => {
            try {
                const response = await fetch(`${API_URL}/api/payment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transactionId })
                });

                if (!response.ok) throw new Error('Lỗi từ server hoặc kết nối không ổn định.');

                const result = await response.json();
                console.log(result);

                if (result.status === 'success') {
                    setStatus('success');
                } else {
                    setStatus('error');
                    setErrorMessage(result.error || 'Không tìm thấy giao dịch hoặc thanh toán không thành công.');
                }
            } catch (err) {
                console.error("Lỗi khi xác nhận thanh toán:", err);
                setStatus('error');
                setErrorMessage(err.message || 'Đã có lỗi khi xác nhận thanh toán. Vui lòng kiểm tra lại kết nối.');
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentStatus();
    }, [transactionId]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" tip="Đang xác nhận thanh toán..." />
            </div>
        );
    }

    if (status === 'success') {
        return (
            <Result
                status="success"
                title="Thanh toán thành công!"
                subTitle={`Mã giao dịch: ${transactionId}`}
                extra={[
                    <Button type="primary" key="view-invoice" onClick={() => window.location.href = `/invoice/${transactionId}`}>
                        Xem hóa đơn
                    </Button>
                ]}
            />
        );
    }

    return (
        <Alert
            message="Thanh toán thất bại"
            description={errorMessage || "Đã có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại sau."}
            type="error"
            showIcon
            style={{ margin: 40 }}
        />
    );
};

export default InvoicePage;

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Result, Spin, Alert } from 'antd';

const InvoicePage = () => {
    const { id: transactionId } = useParams();
    const [status, setStatus] = useState(null);      
    const [loading, setLoading] = useState(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    useEffect(() => {
        const fetchPaymentStatus = async () => {
            try {
                const response = await fetch(`${API_URL}/api/payment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transactionId })
                });

                if (!response.ok) throw new Error('Lỗi từ server');

                const result = await response.json();
                if (result === 'success') {
                    setStatus('success');
                } else {
                    setStatus('error');
                }
            } catch (err) {
                console.error("Lỗi khi xác nhận thanh toán:", err);
                setStatus('error');
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
            />
        );
    }

    return (
        <Alert
            message="Thanh toán thất bại"
            description="Đã có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại sau."
            type="error"
            showIcon
            style={{ margin: 40 }}
        />
    );
};

export default InvoicePage;

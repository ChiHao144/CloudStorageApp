import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { userApi } from '@/services/api';
import Swal from 'sweetalert2';
import { FaHdd, FaRocket, FaCrown, FaCheck, FaCloudUploadAlt, FaSpinner, FaWallet, FaTimes } from 'react-icons/fa';

// Cấu hình danh sách gói với chi tiết hiển thị
const PLANS = [
    {
        id: 'basic',
        name: 'Gói Basic',
        price: 50000,
        quota: '5GB',
        icon: <FaHdd className="text-4xl text-blue-500" />,
        features: ['Tốc độ tải trung bình', 'Hỗ trợ cơ bản'],
        recommend: false,
        color: 'border-blue-200 hover:border-blue-500'
    },
    {
        id: 'pro',
        name: 'Gói Pro',
        price: 100000,
        quota: '10GB',
        icon: <FaRocket className="text-4xl text-purple-500" />,
        features: ['Tốc độ tải nhanh', 'Ưu tiên hỗ trợ', 'Sao lưu tự động'],
        recommend: true, // Gói được khuyên dùng
        color: 'border-purple-200 hover:border-purple-500'
    },
    {
        id: 'vip',
        name: 'Gói VIP',
        price: 300000,
        quota: '20GB',
        icon: <FaCrown className="text-4xl text-yellow-500" />,
        features: ['Tốc độ không giới hạn', 'Hỗ trợ 24/7', 'Bảo mật nâng cao'],
        recommend: false,
        color: 'border-yellow-200 hover:border-yellow-500'
    }
];

export default function PaymentPage() {
    const { user } = useAuth();

    const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);


    const handleSelectPlan = (plan: any) => {
        if (!user) {
            Swal.fire('Chưa đăng nhập', 'Vui lòng đăng nhập để tiếp tục', 'warning');
            return;
        }
        setSelectedPlan(plan);
        setShowModal(true);
    };

    const handlePay = async (method: 'momo' | 'zalopay') => {
        try {
            setProcessingPlanId(selectedPlan.id);
            const res =
                method === 'momo'
                    ? await userApi.createMomoPayment(String(user), selectedPlan.id)
                    : await userApi.createZaloPayPayment(String(user), selectedPlan.id);

            window.location.href = res.data.payUrl;
        } catch (err) {
            console.error(err);
            Swal.fire('Lỗi', 'Không thể tạo thanh toán', 'error');
            setProcessingPlanId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 px-4 py-16">
            <div className="max-w-7xl mx-auto">

                {/* HEADER */}
                <div className="text-center mb-16">
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-4 py-1 rounded-full">
                        NÂNG CẤP TÀI KHOẢN
                    </span>
                    <h1 className="mt-4 text-4xl font-extrabold text-gray-900">
                        Chọn gói lưu trữ
                    </h1>
                    <p className="mt-4 text-gray-600">
                        Xin chào <b className="text-blue-600">{user}</b>, chọn gói phù hợp để tiếp tục
                    </p>
                </div>

                {/* PRICING */}
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {PLANS.map((plan) => {
                        const isLoading = processingPlanId === plan.id;
                        return (
                            <div
                                key={plan.id}
                                className={`relative flex flex-col bg-white rounded-2xl shadow-lg border-2 transition hover:-translate-y-2 ${plan.color}`}
                            >
                                {plan.recommend && (
                                    <span className="absolute top-4 right-4 bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                                        Phổ biến
                                    </span>
                                )}

                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="flex justify-center mb-6">
                                        {plan.icon}
                                    </div>

                                    <h3 className="text-xl font-bold text-center">
                                        {plan.name}
                                    </h3>

                                    <div className="text-center mt-4">
                                        <span className="text-4xl font-extrabold">
                                            {plan.price.toLocaleString('vi-VN')}
                                        </span>
                                        <span className="text-gray-500"> đ</span>
                                    </div>

                                    <div className="flex justify-center mt-3">
                                        <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">
                                            {plan.quota}
                                        </span>
                                    </div>

                                    <ul className="mt-6 space-y-3 flex-1">
                                        {plan.features.map((f, i) => (
                                            <li key={i} className="flex text-gray-600 text-sm">
                                                <FaCheck className="text-green-500 mr-2 mt-1" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={processingPlanId !== null}
                                        className={`mt-6 w-full py-4 rounded-xl font-bold text-white flex justify-center gap-2
                                            ${isLoading
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : plan.recommend
                                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600'
                                                    : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                            }`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <FaSpinner className="animate-spin" /> Đang xử lý
                                            </>
                                        ) : (
                                            <>
                                                <FaCloudUploadAlt /> Mua ngay
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {showModal && selectedPlan && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-scaleIn">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">
                                Chọn phương thức thanh toán
                            </h3>
                            <button onClick={() => setShowModal(false)}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <PaymentButton
                                color="pink"
                                label="Ví MoMo"
                                desc="Thanh toán nhanh qua MoMo"
                                onClick={() => handlePay('momo')}
                            />

                            <PaymentButton
                                color="blue"
                                label="ZaloPay"
                                desc="Thanh toán qua ZaloPay"
                                onClick={() => handlePay('zalopay')}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PaymentButton({
    label,
    desc,
    onClick,
    color
}: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border hover:border-${color}-500 transition`}
        >
            <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-${color}-100 text-${color}-600`}>
                <FaWallet />
            </div>
            <div className="text-left">
                <p className="font-bold">{label}</p>
                <p className="text-sm text-gray-500">{desc}</p>
            </div>
        </button>
    );
}

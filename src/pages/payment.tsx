import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { userApi } from '@/services/api';
import Swal from 'sweetalert2';
import { FaHdd, FaRocket, FaCrown, FaCheck, FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';

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
    },
];

export default function PaymentPage() {
    const { user } = useAuth();
    // Thay đổi: Lưu ID của gói đang xử lý thay vì true/false chung chung
    const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

    const handleBuy = async (planId: string) => {
        if (!user) {
            Swal.fire({
                icon: 'warning',
                title: 'Chưa đăng nhập',
                text: 'Vui lòng đăng nhập để thực hiện nâng cấp!',
                confirmButtonText: 'Đăng nhập ngay'
            });
            return;
        }

        try {
            // Set gói đang loading
            setProcessingPlanId(planId);
            
            const res = await userApi.createMomoPayment(user, planId);
            const data = res.data;

            if (data.payUrl) {
                window.location.href = data.payUrl;
            } else {
                Swal.fire('Lỗi', 'Server không trả về link thanh toán.', 'error');
                setProcessingPlanId(null); // Reset nếu lỗi logic
            }

        } catch (err: unknown) {
            setProcessingPlanId(null); // Reset khi có lỗi
            let errorMsg = 'Thanh toán thất bại: Lỗi kết nối API.';

            if (typeof err === 'object' && err !== null && 'response' in err) {
                const response = (err as { response: { data?: { message?: string }, status?: number } }).response;
                if (response?.data?.message) {
                    errorMsg = `Lỗi: ${response.data.message}`;
                } else if (response?.status) {
                    errorMsg = `Lỗi HTTP ${response.status}. Vui lòng thử lại.`;
                }
            }
            Swal.fire({
                icon: 'error',
                title: 'Giao dịch thất bại',
                text: errorMsg,
            });
        }
        // Lưu ý: Không cần finally set null nếu chuyển trang thành công, 
        // nhưng nếu ở lại trang thì cần handle kỹ. Ở đây catch đã handle reset.
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                        Nâng cấp tài khoản
                    </span>
                    <h1 className="mt-4 text-4xl font-extrabold text-gray-900 sm:text-5xl">
                        Mở rộng không gian lưu trữ
                    </h1>
                    <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
                        Xin chào <span className="font-bold text-blue-600">{user}</span>, hãy chọn gói phù hợp để lưu trữ dữ liệu an toàn và tiện lợi hơn.
                    </p>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
                    {PLANS.map((plan) => {
                        const isLoading = processingPlanId === plan.id;
                        const isAnyLoading = processingPlanId !== null;

                        return (
                            <div
                                key={plan.id}
                                // Thêm flex flex-col và h-full để thẻ kéo dài bằng nhau
                                className={`relative flex flex-col h-full bg-white rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl border-2 ${plan.color} ${plan.recommend ? 'ring-2 ring-purple-400 ring-offset-2' : ''}`}
                            >
                                {plan.recommend && (
                                    <div className="absolute top-0 right-0 -mt-3 -mr-3 z-10">
                                        <span className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                            Phổ biến nhất
                                        </span>
                                    </div>
                                )}

                                {/* Nội dung thẻ: dùng flex-1 để đẩy nút xuống dưới cùng */}
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="flex justify-center mb-6">
                                        <div className="p-4 bg-gray-50 rounded-full shadow-inner">
                                            {plan.icon}
                                        </div>
                                    </div>

                                    <h3 className="text-center text-2xl font-bold text-gray-800">{plan.name}</h3>
                                    <div className="text-center mt-4">
                                        <span className="text-4xl font-extrabold text-gray-900">
                                            {plan.price.toLocaleString('vi-VN')}
                                        </span>
                                        <span className="text-gray-500 font-medium"> đ</span>
                                    </div>
                                    <p className="text-center text-gray-500 mt-2 text-sm">Thanh toán 1 lần</p>

                                    {/* Căn giữa badge Quota */}
                                    <div className="flex justify-center mt-4">
                                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                                            {plan.quota}
                                        </span>
                                    </div>

                                    {/* Features List: mb-8 để tạo khoảng cách với nút */}
                                    <ul className="mt-8 mb-8 space-y-4 flex-1">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start text-gray-600">
                                                <FaCheck className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                                                <span className="text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Button: mt-auto để luôn nằm ở đáy */}
                                    <button
                                        onClick={() => handleBuy(plan.id)}
                                        disabled={isAnyLoading}
                                        className={`mt-auto w-full py-4 rounded-xl text-white font-bold shadow-lg transition-all duration-200 flex items-center justify-center gap-2
                                            ${isAnyLoading && !isLoading
                                                ? 'bg-gray-300 cursor-not-allowed opacity-50' // Style cho các nút KHÔNG được bấm
                                                : isLoading 
                                                    ? 'bg-gray-400 cursor-not-allowed' // Style cho nút ĐANG bấm
                                                    : plan.recommend
                                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                                                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                                            }`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <FaSpinner className="animate-spin text-lg" /> Đang xử lý...
                                            </>
                                        ) : (
                                            <>
                                                <FaCloudUploadAlt className="text-lg" /> Mua ngay
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
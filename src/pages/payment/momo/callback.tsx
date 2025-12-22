import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { userApi } from '@/services/api';
import Swal from 'sweetalert2';

export default function MomoCallback() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const { resultCode, orderInfo, message } = router.query;

    const processPayment = async () => {
        // 1. Kiểm tra nếu MoMo trả về lỗi (resultCode != 0)
        if (resultCode !== '0') {
            await Swal.fire({
                icon: 'error',
                title: 'Giao dịch thất bại',
                text: message ? String(message) : 'Bạn đã hủy giao dịch hoặc có lỗi xảy ra.',
                confirmButtonText: 'Quay lại',
                allowOutsideClick: false // Bắt buộc bấm nút
            });
            router.push('/payment'); // Quay lại trang mua
            return;
        }

        // 2. Xử lý logic thành công
        try {
            const infoStr = Array.isArray(orderInfo) ? orderInfo[0] : orderInfo || '';
            
            // Parse thông tin (Cần đảm bảo logic parse này khớp với chuỗi gửi đi)
            const parts = infoStr.split(' ');
            const planIndex = parts.indexOf('goi');
            const userIndex = parts.indexOf('dung');

            if (planIndex === -1 || userIndex === -1) {
                throw new Error('Dữ liệu đơn hàng không hợp lệ');
            }

            const planName = parts[planIndex + 1]; 
            const userName = parts[userIndex + 1]; 

            // Gọi API nâng cấp
            await userApi.upgradeAccount(userName, planName);

            // 3. Thông báo thành công qua Alert
            await Swal.fire({
                icon: 'success',
                title: 'Thanh toán thành công!',
                text: `Tài khoản ${userName} đã được nâng cấp lên gói ${planName.toUpperCase()}`,
                confirmButtonText: 'Vào trang chủ',
                allowOutsideClick: false
            });
            
            router.push('/'); // Về trang chủ

        } catch (error) {
            console.error(error);
            await Swal.fire({
                icon: 'error',
                title: 'Lỗi xử lý',
                text: 'Thanh toán thành công nhưng chưa cập nhật được tài khoản. Vui lòng liên hệ Admin.',
                confirmButtonText: 'Về trang chủ'
            });
            router.push('/');
        }
    };

    processPayment();

  }, [router.isReady, router.query]);

  // Giao diện chỉ hiện đúng 1 cái xoay xoay ở giữa màn hình trắng
  // Không hiện chữ, không hiện card
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
    </div>
  );
}
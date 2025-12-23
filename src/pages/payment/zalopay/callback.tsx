import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { userApi } from '@/services/api';
import Swal from 'sweetalert2';

export default function ZalopayCallback() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const { appTransId, status } = router.query;

    const processPayment = async () => {
        // 1. Kiểm tra nếu Zalopay trả về lỗi (status != '1')
        if (status !== '1') {
            await Swal.fire({
                icon: 'error',
                title: 'Giao dịch thất bại',
                text: 'Bạn đã hủy giao dịch hoặc có lỗi xảy ra.',
                confirmButtonText: 'Quay lại',
                allowOutsideClick: false // Bắt buộc bấm nút
            });
            router.push('/payment'); // Quay lại trang mua
            return;
        }

        // 2. Xử lý logic thành công
        try {
            // Parse thông tin (Cần đảm bảo logic parse này khớp với chuỗi gửi đi)
            const infoStr = Array.isArray(appTransId) ? appTransId[0] : appTransId || '';

            // Gửi transId lên API để xác nhận và nâng cấp tài khoản
            const res = await userApi.confirmZaloPayPayment(infoStr, String(status));
            const { planName, userName } = res.data;
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
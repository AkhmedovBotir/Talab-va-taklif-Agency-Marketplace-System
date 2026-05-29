import ContentStatusPanel from '../components/common/ContentStatusPanel';

const NotFoundPage = () => (
  <ContentStatusPanel
    status={404}
    title="Sahifa topilmadi"
    message="Ushbu manzil mavjud emas yoki o‘zgartirilgan. Chap menyudan kerakli bo‘limni tanlang."
  />
);

export default NotFoundPage;

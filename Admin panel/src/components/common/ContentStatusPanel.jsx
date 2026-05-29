import { Block, SearchOff } from '@mui/icons-material';

const config = {
  403: {
    icon: Block,
    title: 'Ruxsat berilmagan',
    defaultMessage:
      "Ushbu bo‘limga kirish uchun sizda yetarli ruxsat yo‘q. Administrator bilan bog‘laning yoki boshqa menyuni tanlang.",
    iconClass: 'text-amber-600',
    bgClass: 'bg-amber-50 border-amber-200',
  },
  404: {
    icon: SearchOff,
    title: 'Topilmadi',
    defaultMessage: 'So‘ralgan ma’lumot yoki sahifa topilmadi. U o‘chirilgan yoki manzil noto‘g‘ri bo‘lishi mumkin.',
    iconClass: 'text-gray-500',
    bgClass: 'bg-gray-50 border-gray-200',
  },
};

const ContentStatusPanel = ({ status = 403, message, title }) => {
  const cfg = config[status] || config[403];
  const Icon = cfg.icon;

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div
        className={`max-w-lg w-full rounded-xl border ${cfg.bgClass} shadow-sm p-8 text-center`}
      >
        <div className={`mx-auto w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm`}>
          <Icon className={cfg.iconClass} sx={{ fontSize: 40 }} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
          HTTP {status}
        </p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title || cfg.title}</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{message || cfg.defaultMessage}</p>
      </div>
    </div>
  );
};

export default ContentStatusPanel;

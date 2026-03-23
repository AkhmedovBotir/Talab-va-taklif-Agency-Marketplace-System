import { motion } from 'framer-motion';

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('uz-UZ').format(num);
};

const HorizontalBarChart = ({ data, labelKey, valueKey, maxValue, color = 'bg-indigo-500', formatValue }) => {
  if (!data || data.length === 0) return null;

  const max = maxValue || Math.max(...data.map(item => item[valueKey] || 0));

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const value = item[valueKey] || 0;
        const percentage = max > 0 ? (value / max) * 100 : 0;
        const label = typeof labelKey === 'function' ? labelKey(item) : item[labelKey];

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="space-y-1"
          >
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-700 truncate max-w-[200px]" title={label}>
                {label || '-'}
              </span>
              <span className="text-gray-600 font-semibold">
                {formatValue ? formatValue(value) : formatNumber(value)}
              </span>
            </div>
            <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={`h-full ${color} rounded-full flex items-center justify-end pr-2`}
              >
                {percentage > 15 && (
                  <span className="text-xs text-white font-medium">
                    {percentage.toFixed(0)}%
                  </span>
                )}
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default HorizontalBarChart;














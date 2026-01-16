export default function OrdersHeader({ mainTab, subTab, subTabs, onMainTabChange, onSubTabChange }) {
  return (
    <div className="bg-white rounded-xl shadow-sm mb-6">
      {/* Main Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-1 px-4 pt-4">
          <button
            onClick={() => onMainTabChange('tuman')}
            className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors ${
              mainTab === 'tuman'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Tuman Kontragentlari Sotuvi
          </button>
          <button
            onClick={() => onMainTabChange('maxalla')}
            className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors ${
              mainTab === 'maxalla'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Maxalla Do'konlari Sotuvi
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex flex-wrap gap-2">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSubTabChange(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                subTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

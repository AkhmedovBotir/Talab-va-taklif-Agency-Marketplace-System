export default function OrdersHeader({ selectedStage, stages, onStageChange }) {
  return (
    <div className="bg-white rounded-xl shadow-sm mb-6">
      <div className="px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {stages.map((stage) => (
            <button
              key={stage.id}
              onClick={() => onStageChange(stage.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedStage === stage.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {stage.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

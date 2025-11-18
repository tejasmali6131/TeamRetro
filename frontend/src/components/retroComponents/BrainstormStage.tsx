interface Template {
  id: string;
  name: string;
  columns: Array<{
    id: string;
    name: string;
    color: string;
    placeholder: string;
  }>;
}

interface BrainstormStageProps {
  template: Template | undefined;
}

export default function BrainstormStage({ template }: BrainstormStageProps) {
  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No template found for this retrospective.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {template.columns.map((column) => (
        <div
          key={column.id}
          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 min-h-[400px]"
        >
          {/* Inline styles needed for dynamic template colors from database */}
          <div
            className="flex items-center gap-2 mb-4 pb-2 border-b-2"
            style={{ borderBottomColor: column.color }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: column.color }}
            ></div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{column.name}</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{column.placeholder}</p>
          <div className="space-y-2">
            {/* Cards will be added here */}
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
              No cards yet. Add your thoughts!
            </div>
          </div>
          <button className="w-full mt-4 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-kone-blue dark:hover:border-kone-lightBlue hover:text-kone-blue dark:hover:text-kone-lightBlue transition-colors">
            + Add Card
          </button>
        </div>
      ))}
    </div>
  );
}

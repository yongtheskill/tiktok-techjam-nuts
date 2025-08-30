export function AnalysisWindow({ onClose }: { onClose: () => void }) {
  //   const [isLoading, setIsLoading] = useState(false);

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='w-full h-full p-8'>
        <div className='bg-white rounded-lg shadow-xl w-full h-full flex flex-col overflow-clip'>
          {/* Header */}
          <div className='p-6 border-b border-gray-200'>
            <div className='flex justify-between items-center'>
              <h2 className='text-2xl font-semibold text-gray-900'>Transaction Analysis</h2>
              <button
                onClick={onClose}
                className='text-gray-400 hover:text-gray-600 text-3xl leading-none'
                aria-label='Close'>
                ×
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className='flex-1'>
            <div className='h-full flex items-center justify-center'>
              {
                // Use dangerouslySetInnerHTML to render the custom element
                <div
                  style={{ height: '100%', width: '100%' }}
                  dangerouslySetInnerHTML={{
                    __html: `<lynx-view style="height:100%;width:100%;" url="/main.web.bundle"></lynx-view>`,
                  }}
                />
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

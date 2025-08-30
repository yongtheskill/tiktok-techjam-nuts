import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { GiftModal } from "./GiftModal";
import { toast } from "sonner";

export function LivestreamList() {
  const livestreams = useQuery(api.livestreams.getActiveLivestreams);
  const [selectedStream, setSelectedStream] = useState<any>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const joinLivestream = useMutation(api.livestreams.joinLivestream);

  const handleJoinStream = async (livestreamId: any) => {
    try {
      await joinLivestream({ livestreamId });
      toast.success("Joined livestream!");
    } catch (error) {
      toast.error("Failed to join livestream");
      console.error(error);
    }
  };

  const handleSendGift = (stream: any) => {
    setSelectedStream(stream);
    setShowGiftModal(true);
  };

  if (livestreams === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Live Streams</h1>
        <div className="text-sm text-gray-500">
          {livestreams.length} active stream{livestreams.length !== 1 ? "s" : ""}
        </div>
      </div>

      {livestreams.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📺</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No active streams</h3>
          <p className="text-gray-500">Check back later for live content!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {livestreams.map((stream) => (
            <div key={stream._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-4xl mb-2">🎥</div>
                  <div className="text-sm font-medium">LIVE</div>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{stream.title}</h3>
                {stream.description && (
                  <p className="text-sm text-gray-600 mb-3">{stream.description}</p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>👤 {stream.viewerCount} viewers</span>
                  <span>🎁 {stream.totalGifts} gifts</span>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {stream.streamer?.name?.[0]?.toUpperCase() || "S"}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {stream.streamer?.name || "Unknown Streamer"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-red-500 font-medium">LIVE</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleJoinStream(stream._id)}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
                  >
                    Join Stream
                  </button>
                  <button
                    onClick={() => handleSendGift(stream)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                  >
                    🎁 Gift
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showGiftModal && selectedStream && (
        <GiftModal
          stream={selectedStream}
          onClose={() => {
            setShowGiftModal(false);
            setSelectedStream(null);
          }}
        />
      )}
    </div>
  );
}

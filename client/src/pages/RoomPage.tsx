import { useParams } from 'react-router-dom';

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Room: {roomId}
        </h1>
        <p className="text-gray-600">
          Room page coming soon in the next commits...
        </p>
      </div>
    </div>
  );
}

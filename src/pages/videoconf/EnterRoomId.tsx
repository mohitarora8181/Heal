import React from 'react'
import { useNavigate } from 'react-router-dom'

function EnterRoomId() {
  const [roomId, setRoomId] = React.useState<string>('')
  const navigate = useNavigate()
  const handelSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    navigate(`/videoconf/${roomId}`)
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 via-purple-100 to-indigo-100">
      <div className="bg-white/80 backdrop-blur-md p-10 rounded-2xl shadow-2xl flex flex-col items-center gap-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-indigo-700 mb-2 tracking-tight">Join a Video Room</h2>
        <p className="text-gray-500 text-center mb-4">Enter your room ID below to join or create a video conference.</p>
        <form
          className="w-full flex flex-col gap-5"
          onSubmit={handelSubmit}
        >
          <input
            type="text"
            placeholder="Enter Room Id"
            onChange={(e) => setRoomId(e.target.value)}
            value={roomId}
            className="px-5 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-lg transition placeholder-gray-400"
            autoFocus
            required
          />
          <button
            type="submit"
            className="py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-lg shadow-md hover:from-indigo-600 hover:to-purple-600 transition"
            disabled={!roomId.trim()}
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  )
}

export default EnterRoomId
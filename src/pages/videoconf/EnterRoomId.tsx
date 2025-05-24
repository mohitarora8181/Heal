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
     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
      <form
        className="bg-white p-8 rounded-xl shadow-lg flex flex-col gap-6 min-w-[320px]"
        onSubmit={handelSubmit}
      >
        <input
          type="text"
          placeholder="Enter Room Id"
          onChange={(e) => setRoomId(e.target.value)}
          value={roomId}
          className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg"
        />
        <button
          type="submit"
          className="py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-lg hover:from-indigo-600 hover:to-purple-600 transition"
        >
          Join
        </button>
      </form>
    </div>
  )
}

export default EnterRoomId

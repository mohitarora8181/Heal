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
    <div>
        <form onSubmit={handelSubmit}>
            <input type="text" placeholder="Enter Room Id" onChange={(e)=>{setRoomId(e.target.value)}} value={roomId}/>
      <button type="submit">Join</button>
        </form>
      
    </div>
  )
}

export default EnterRoomId

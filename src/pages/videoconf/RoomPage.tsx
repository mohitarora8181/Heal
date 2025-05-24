import React from 'react'
import { useParams } from 'react-router-dom'
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt"

function RoomPage() {
    const { roomId } = useParams<{ roomId: string }>();
    const containerRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        if (!roomId) return;
        const MeetingID = async (element: HTMLDivElement | null) => {
            if (!element) return;
            const appID = 1043447705;
            const secret = "b0820d28b88b6d9756c119e1730a0824";
            const userID =  Math.random().toString(36).slice(2);
            const userName = "Nishant";
            
            const KitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                appID,
                secret,
                roomId,
                userID,
                userName
            );
            const zc = ZegoUIKitPrebuilt.create(KitToken);
            zc.joinRoom({
                container: element,
                scenario: {
                    mode: ZegoUIKitPrebuilt.VideoConference,
                },
                showTextChat: true,
                showScreenSharingButton: true,
                
            });
        };
        MeetingID(containerRef.current);
        // Only run when roomId changes
    }, [roomId]);

    return (
        <div>
            <div ref={containerRef} style={{ width: "100vw", height: "100vh" }}></div>
        </div>
    );
}

export default RoomPage

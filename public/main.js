const form = document.getElementById("room-name-form");
const roomNameInput = document.getElementById("room-name-input");
const userNameInput=document.getElementById('user-name-input');
const container = document.getElementById("video-container");
const roomDiv = document.getElementById('room_div');
const lobbyDiv = document.getElementById('lobby_div');
const leaveRoom=document.getElementById('leaveRoom');
// const startVideo = document.getElementById('startVideo');
// const stopVideo = document.getElementById('stopVideo');
const startRoom = async (event) => {
    console.log("form daa",roomNameInput.value)
    // prevent a page reload when a user submits the form
    event.preventDefault();
    // hide the join form
    form.style.visibility = "hidden";
    // retrieve the room name
    const roomName = roomNameInput.value;
    const userName=userNameInput.value;
    // fetch an Access Token from the join-room route
    const response = await fetch("/join-room/"+roomName, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomName: roomName,userName:userName }),
    });
    const { token } = await response.json();
    console.log("token",token)

    // join the video room with the token
    const room = await joinVideoRoom(roomName, token);
    roomDiv.style.display = "block";
    lobbyDiv.style.display="none";
    // render the local and remote participants' video and audio tracks
    handleConnectedParticipant(room.localParticipant);
    room.participants.forEach(handleConnectedParticipant);
    console.log('html room',room.participants);
    room.on("participantConnected", handleConnectedParticipant);

    // handle cleanup when a participant disconnects
    room.on("participantDisconnected", handleDisconnectedParticipant);
    window.addEventListener("pagehide", () => room.disconnect());
    window.addEventListener("beforeunload", () => room.disconnect());
};
const leaveRoomFun=()=>{
    window.location.reload();
}
const handleConnectedParticipant = (participant) => {
    // create a div for this participant's tracks
    const participantDiv = document.createElement("div");
    const participantNameDiv = document.createElement("div");
    participantDiv.setAttribute("class", "participant");
    participantNameDiv.setAttribute("class", "identity");
    participantNameDiv.innerHTML=participant.identity;
    participantDiv.appendChild(participantNameDiv);
    participantDiv.setAttribute("id", participant.identity);
    container.appendChild(participantDiv);

    // iterate through the participant's published tracks and
    // call `handleTrackPublication` on them
    participant.tracks.forEach((trackPublication) => {
        handleTrackPublication(trackPublication, participant);
    });
    console.log("trackPublished");
    // listen for any new track publications
    participant.on("trackPublished", handleTrackPublication);
};

const handleTrackPublication = (trackPublication, participant) => {
    function displayTrack(track) {
        // append this track to the participant's div and render it on the page
        const participantDiv = document.getElementById(participant.identity);
        // track.attach creates an HTMLVideoElement or HTMLAudioElement
        // (depending on the type of track) and adds the video or audio stream
        participantDiv.append(track.attach());
    }

    // check if the trackPublication contains a `track` attribute. If it does,
    // we are subscribed to this track. If not, we are not subscribed.
    if (trackPublication.track) {
        displayTrack(trackPublication.track);
    }

    // listen for any new subscriptions to this track publication
    trackPublication.on("subscribed", displayTrack);
};

const handleDisconnectedParticipant = (participant) => {
    // stop listening for this participant
    participant.removeAllListeners();
    // remove this participant's div from the page
    const participantDiv = document.getElementById(participant.identity);
    participantDiv.remove();
};

const joinVideoRoom = async (roomName, token) => {
    // join the video room with the Access Token and the given room name
    
    const room = await Twilio.Video.connect(token, {
        room: roomName,
    });
    console.log('room', room.participants);
    return room;
};

form.addEventListener("submit", startRoom);
leaveRoom.addEventListener('click',leaveRoomFun);
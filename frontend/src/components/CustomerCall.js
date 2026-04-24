import React, { useState, useEffect } from "react";
import io from "socket.io-client";

let socket;
let myRoomId = "";
let peerConnection;
let mediaRecorder;
let audioChunks = [];

function CustomerCall() {
  const [name, setName] = useState("");
  const [inCall, setInCall] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    socket = io("http://localhost:5000");

    socket.on("call-started", function (data) {
      myRoomId = data.roomId;
      setInCall(true);
      setStatus("Talking to AI");
    });

    socket.on("transcript-update", function (msg) {
      setMessages(function (oldMessages) {
        return [...oldMessages, msg];
      });
    });

    socket.on("agent-joined", function () {
      setStatus("Talking to Human Agent");

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function (stream) {
          peerConnection = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

          stream.getTracks().forEach(function (track) {
            peerConnection.addTrack(track, stream);
          });

          peerConnection.onicecandidate = function (event) {
            if (event.candidate) {
              socket.emit("ice-candidate", { roomId: myRoomId, candidate: event.candidate });
            }
          };

          peerConnection.ontrack = function (event) {
            // Using document.getElementById is a very beginner React pattern!
            let audioElement = document.getElementById("remoteAudio");
            if (audioElement) {
              audioElement.srcObject = event.streams[0];
            }

            // Setup recording
            let audioContext = new window.AudioContext();
            let dest = audioContext.createMediaStreamDestination();
            audioContext.createMediaStreamSource(stream).connect(dest);
            audioContext.createMediaStreamSource(event.streams[0]).connect(dest);

            mediaRecorder = new MediaRecorder(dest.stream);
            mediaRecorder.ondataavailable = function (e) {
              audioChunks.push(e.data);
            };
            mediaRecorder.onstop = function () {
              let blob = new Blob(audioChunks, { type: "audio/webm" });
              let formData = new FormData();
              formData.append("audio", blob, myRoomId + ".webm");
              fetch("http://localhost:5000/api/recordings/upload", { method: "POST", body: formData });
            };
            mediaRecorder.start();
          };

          peerConnection.createOffer()
            .then(function (offer) {
              return peerConnection.setLocalDescription(offer);
            })
            .then(function () {
              socket.emit("offer", { roomId: myRoomId, offer: peerConnection.localDescription });
            });

        })
        .catch(function (err) {
          console.log("Mic error", err);
        });
    });

    socket.on("answer", function (data) {
      peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on("ice-candidate", function (data) {
      if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    socket.on("call-ended", function () {
      alert("Call ended by agent.");
      window.location.reload();
    });

  }, []);

  function startCall() {
    if (name !== "") {
      socket.emit("start-call", { name: name });
    }
  }

  function sendMessage() {
    if (text !== "") {
      socket.emit("customer-message", { roomId: myRoomId, text: text });
      setText("");
    }
  }

  function askForHuman() {
    socket.emit("request-transfer", { roomId: myRoomId });
    setStatus("Waiting for Human Agent...");
  }

  function endCall() {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    socket.emit("end-call", { roomId: myRoomId });
    window.location.reload();
  }

  if (inCall === false) {
    return (
      <div className="text-center mt-24">
        <h2 className="text-2xl font-bold mb-4">Start Call</h2>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={function (e) { setName(e.target.value) }}
          className="p-3 mr-3 border border-gray-300 rounded"
        />
        <button onClick={startCall} className="p-3 bg-blue-600 text-white rounded hover:bg-blue-700">Start</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-12 border border-gray-300 p-5 rounded-lg shadow-sm bg-white">
      <h2 className="text-2xl font-bold mb-2">Customer Call</h2>
      <p className="mb-4">Status: <b>{status}</b></p>

      <div className="h-72 overflow-y-scroll border border-gray-200 p-3 mb-5 bg-gray-50 rounded">
        {messages.map(function (msg, idx) {
          return (
            <div key={idx} className={`mb-3 ${msg.sender === 'customer' ? 'text-right' : 'text-left'}`}>
              <span className="text-gray-500 text-xs">{msg.sender}: </span>
              <span className="bg-white p-2 border border-gray-200 inline-block rounded shadow-sm">{msg.text}</span>
            </div>
          )
        })}
      </div>

      <audio id="remoteAudio" autoPlay></audio>

      <div className="flex mb-5">
        <input
          type="text"
          value={text}
          onChange={function (e) { setText(e.target.value) }}
          className="flex-1 p-3 border border-gray-300 rounded-l focus:outline-none"
          placeholder="Type message..."
        />
        <button onClick={sendMessage} className="p-3 bg-blue-600 text-white rounded-r hover:bg-blue-700">Send</button>
      </div>

      <div className="flex justify-between">
        {status === "Talking to AI" ? (
          <button onClick={askForHuman} className="p-3 bg-orange-500 text-white rounded hover:bg-orange-600">
            Ask for Human
          </button>
        ) : <div></div>}
        <button onClick={endCall} className="p-3 bg-red-600 text-white rounded hover:bg-red-700">
          End Call
        </button>
      </div>
    </div>
  );
}

export default CustomerCall;

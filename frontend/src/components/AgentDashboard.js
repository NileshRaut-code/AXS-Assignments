import React, { useState, useEffect } from "react";
import io from "socket.io-client";

let socket;
let myRoomId = "";
let peerConnection;

function AgentDashboard() {
  const [agentName, setAgentName] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeCalls, setActiveCalls] = useState([]);
  const [currentCall, setCurrentCall] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    socket = io("http://localhost:5000");

    socket.on("active-calls-updated", function (calls) {
      setActiveCalls(calls);
    });

    socket.on("call-transcript", function (data) {
      setMessages(data.transcript || []);
    });

    socket.on("transcript-update", function (msg) {
      setMessages(function (oldMessages) {
        return [...oldMessages, msg];
      });
    });

    socket.on("offer", function (data) {
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
            let audioElement = document.getElementById("agentAudio");
            if (audioElement) {
              audioElement.srcObject = event.streams[0];
            }
          };

          return peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        })
        .then(function () {
          return peerConnection.createAnswer();
        })
        .then(function (answer) {
          return peerConnection.setLocalDescription(answer);
        })
        .then(function () {
          socket.emit("answer", { roomId: myRoomId, answer: peerConnection.localDescription });
        })
        .catch(function (err) {
          console.log(err);
        });
    });

    socket.on("ice-candidate", function (data) {
      if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    socket.on("call-ended", function () {
      alert("Customer ended the call.");
      window.location.reload();
    });

  }, []);

  function login() {
    if (agentName !== "") {
      setLoggedIn(true);
    }
  }

  function acceptCall(roomId) {
    myRoomId = roomId;
    setCurrentCall(roomId);
    socket.emit("accept-transfer", { roomId: roomId, agentName: agentName });
  }

  function sendMessage() {
    if (text !== "") {
      socket.emit("agent-message", { roomId: myRoomId, text: text });
      setText("");
    }
  }

  function endCall() {
    socket.emit("end-call", { roomId: myRoomId });
    window.location.reload();
  }

  // Basic styling
  if (loggedIn === false) {
    return (
      <div className="text-center mt-24">
        <h2 className="text-2xl font-bold mb-4">Agent Login</h2>
        <input
          type="text"
          placeholder="Agent name"
          value={agentName}
          onChange={function (e) { setAgentName(e.target.value) }}
          className="p-3 mr-3 border border-gray-300 rounded"
        />
        <button onClick={login} className="p-3 bg-green-600 text-white rounded hover:bg-green-700">Login</button>
      </div>
    );
  }

  return (
    <div className="flex h-screen font-sans bg-gray-100">

      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-300 h-screen p-5 bg-white overflow-y-auto shadow-sm z-10">
        <h2 className="text-xl font-bold mb-4">Active Calls</h2>

        {activeCalls.map(function (call) {
          return (
            <div key={call.id} className="border border-gray-200 p-3 mb-3 bg-gray-50 rounded hover:bg-gray-100 transition">
              <p className="font-bold">{call.customerName}</p>
              <p className="text-sm text-gray-600">Status: {call.status}</p>

              {call.status === "waiting" && currentCall !== call.id ? (
                <button onClick={function () { acceptCall(call.id) }} className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                  Accept Call
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Main Area */}
      <div className="w-2/3 p-6 flex flex-col">
        {currentCall ? (
          <div className="flex flex-col h-full bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold mb-4">Talking to Customer</h2>

            <div className="flex-1 overflow-y-scroll border border-gray-200 p-4 mb-4 bg-gray-50 rounded">
              {messages.map(function (msg, idx) {
                return (
                  <div key={idx} className={`mb-3 ${msg.sender === 'agent' ? 'text-right' : 'text-left'}`}>
                    <span className="text-gray-500 text-xs">{msg.sender}: </span>
                    <span className="bg-white p-2 border border-gray-200 inline-block rounded shadow-sm">{msg.text}</span>
                  </div>
                )
              })}
            </div>

            <audio id="agentAudio" autoPlay></audio>

            <div className="flex gap-3 mt-auto">
              <input
                type="text"
                value={text}
                onChange={function (e) { setText(e.target.value) }}
                className="flex-1 p-3 border border-gray-300 rounded focus:outline-none"
                placeholder="Type your message..."
              />
              <button onClick={sendMessage} className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">Send</button>
              <button onClick={endCall} className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700">End Call</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-lg">
            <p>Select a call from the left menu to start talking.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AgentDashboard;

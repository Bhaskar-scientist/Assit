import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { FaMicrophone, FaPaperPlane } from "react-icons/fa";

let recognition;
let shouldStopImmediately = false;

const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    let storedUserId = localStorage.getItem("user_id");
    if (!storedUserId) {
      storedUserId = Math.random().toString(36).substr(2, 9);
      localStorage.setItem("user_id", storedUserId);
    }
    setUserId(storedUserId);

    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.continuous = true;

      recognition.onresult = (event) => {
        const transcript = event.results[event.resultIndex][0].transcript;
        setInputText((prev) => (prev.trim() ? prev.trim() + " " + transcript : transcript));
      };

      recognition.onerror = (event) => console.error("Speech recognition error:", event.error);
      recognition.onend = () => {
        if (isRecording && !shouldStopImmediately) {
          recognition.start();
        }
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) return;
    if (isRecording) {
      shouldStopImmediately = true;
      recognition.stop();
      setIsRecording(false);
    } else {
      shouldStopImmediately = false;
      recognition.start();
      setIsRecording(true);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    setMessages((prev) => [...prev, { sender: "User", text: inputText }]);
    setInputText("");

    try {
      const response = await fetch("http://127.0.0.1:8000/process-text/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ user_id: userId, question: inputText }),
      });
      const data = await response.json();

      setMessages((prev) => [...prev, { sender: "Bot", text: data.answer || "Error processing response." }]);
    } catch (error) {
      console.error("Error communicating with chatbot:", error);
      setMessages((prev) => [...prev, { sender: "Bot", text: "Error communicating with chatbot." }]);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender.toLowerCase()}`}>
            <strong>{msg.sender}:</strong>
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          </div>
        ))}
      </div>
      <div className="input-container">
        <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type a message..." />
        <button onClick={toggleRecording} className={`icon-button ${isRecording ? "recording" : ""}`}>
          <FaMicrophone />
        </button>
        <button onClick={sendMessage} className="icon-button">
          <FaPaperPlane />
        </button>
      </div>

      <style jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background-color: #0d1117;
          color: white;
          font-family: 'Arial', sans-serif;
          padding: 20px;
        }
        .chat-box {
          flex-grow: 1;
          overflow-y: auto;
          padding: 15px;
          border-radius: 10px;
          background-color: #161b22;
          box-shadow: inset 0 0 5px rgba(255, 255, 255, 0.1);
        }
        .message {
          padding: 12px;
          margin: 8px 0;
          border-radius: 8px;
          max-width: 70%;
        }
        .user {
          background-color: rgb(77, 79, 77);
          align-self: flex-end;
        }
        .bot {
          background-color: #444c56;
          align-self: flex-start;
        }
        .input-container {
          display: flex;
          align-items: center;
          background-color: #161b22;
          padding: 10px;
          border-radius: 10px;
          box-shadow: 0px 0px 8px rgba(255, 255, 255, 0.1);
        }
        textarea {
          flex: 1;
          background: transparent;
          color: white;
          border: none;
          padding: 12px;
          outline: none;
          resize: none;
          min-height: 50px;
          font-size: 16px;
        }
        .icon-button {
          background: none;
          border: none;
          cursor: pointer;
          color: white;
          font-size: 24px;
          margin-left: 12px;
          transition: transform 0.2s ease;
        }
        .icon-button:hover {
          transform: scale(1.1);
        }
        .recording {
          color: red;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @media (max-width: 600px) {
          .chat-container {
            padding: 10px;
          }
          textarea {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatApp;

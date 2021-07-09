import React, { useEffect, useRef, useState } from "react";
import TextField from "@material-ui/core/TextField";
import io from "socket.io-client";

import "./Chat.css";
function Chat() {
  const [state, setState] = useState({ message: "", name: "" });
  const [chat, setChat] = useState([]);

  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io.connect("http://localhost:8000");

    socketRef.current.on("message", ({ name, message }) => {
      setChat([...chat, { name, message }]);
    });
    return () => socketRef.current.disconnect();
  }, [chat]);

  const onTextChange = (e) => {
    setState({ ...state, [e.target.name]: e.target.value });
  };
  const onMessageSubmit = (e) => {
    const { name, message } = state;
    socketRef.current.emit("message", { name, message });
    e.preventDefault();
    setState({ message: "", name });
  };

  const renderChat = () => {
    return chat.map(({ name, message }, index) => (
      <div key={index}>
        <h3>
          {name}: <span>{message}</span>
        </h3>
      </div>
    ));
  };

  return (
    <div className="card">
      <div className="render-chat">
        <h1>Chat Log</h1>
        {renderChat()}
      </div>

      <form onSubmit={onMessageSubmit}>
        <button>Send Message</button>

        <div className="rowInput">

          <div className="name-field">
            <TextField
              name="name"
              onChange={(e) => onTextChange(e)}
              value={state.name}
              label="Name"
              variant="filled"
            />
          </div>

          <div className="message-field" >
            <TextField
              name="message"
              onChange={(e) => onTextChange(e)}
              value={state.message}
              id="outlined-multiline-static"
              variant="filled"
              label="Message"
            />
          </div> 
        </div>
      </form>
    </div>
  );
}

export default Chat;

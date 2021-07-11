import React, { useEffect, useRef, useState } from "react";
import TextField from "@material-ui/core/TextField";
import io from "socket.io-client";
import "./Chat.css";

function Chat({ roomID }) {
  const [state, setState] = useState({ message: "", name: "" });
  const [chat, setChat] = useState([]);
  const [color, setColor] = useState('');

  const socketRef = useRef();

  // useEffect(() => {
  //   socketRef.current = io.connect("http://localhost:8000");
  //   socketRef.current.emit("chatRoom",roomID );
  // }, []);
  var r = () => (Math.random() * 256) >> 0;
  var colors = `rgb(${r()}, ${r()}, ${r()})`;

  
 
  useEffect(() => {
    setColor(colors)
    // socketRef.current = io.connect("http://localhost:8000");
    socketRef.current = io.connect('https://new-medio1.herokuapp.com');
    socketRef.current.emit("chatRoom", roomID);
    socketRef.current.on("message", ({ name, message }) => {
      setChat([...chat, { name, message }]);
    });
    return () => socketRef.current.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat]);

  const onTextChange = (e) => {
    setState({ ...state, [e.target.name]: e.target.value });
  };

  const onMessageSubmit = (e) => {
    const { name, message } = state;
    console.log(message);
    socketRef.current.emit("message", { name, message });
    e.preventDefault();
    setState({ message: "", name });
  };

  const renderChat = () => {
    return chat.map(({ name, message }, index) => (
      <div key={index}>
        <h3 style={{ backgroundColor: color }}>
          {name}: <span>{message}</span>
        </h3>
      </div>
    ));
  };

  return (
    <div className="card">
      <div className="render-chat">
        <h1>LTUC Canvas Chat</h1>
        {renderChat()}
      </div>

      <form onSubmit={onMessageSubmit}>
        <button>Send Message</button>

        <div className="rowInput">
          <div className="name-field">
            <TextField
              fullWidth
              name="name"
              onChange={(e) => onTextChange(e)}
              value={state.name}
              label="Name"
              variant="filled"
            />
          </div>

          <div className="message-field">
            <TextField
              fullWidth
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

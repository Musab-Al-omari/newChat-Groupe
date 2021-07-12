import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import Chat from './Chat'
import "./Room.css";
import "./Chat.css";

const StyledVideo = styled.video`
    height: 40%;
    width: 50%;
`;

const Video = (props) => {
    const ref = useRef();

    useEffect(() => {
        // this is dose not happen unless there are stream waiting to be answered
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <StyledVideo controls playsInline autoPlay ref={ref} />
    );
}


const videoConstraints = {
    height: window.innerHeight / 2,
    width: window.innerWidth / 2
};

const Room = (props) => {
    const [peers, setPeers] = useState([]);
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);

    const roomID = props.match.params.roomID;

    // function share() {
    //     navigator.mediaDevices.getDisplayMedia({ video: videoConstraints, audio: true }).then(stream => {
    //         userVideo.current.srcObject = stream;

    //         socketRef.current.emit('startShare')

    //         socketRef.current.on('all myUsers', (users) => {
    //             console.log('users', users[roomID]);
    //             const peers = [];
    //             users[roomID].forEach((userID) => {
    //                 if(userID!==socketRef.current.id){
    //                     let peer = createPeer(userID,socketRef.current.id,  stream)
    //                     peersRef.current=[];
    //                     peersRef.current.push({
    //                         peerID: userID,
    //                         peer,
    //                     })

    //                     peers.push(peer)
    //                 }
    //                 console.log('0000000000000000', peersRef.current);  
    //             })
    //             setPeers([...peers])


    //         })
    //     })
    // }
    useEffect(() => {
        
        socketRef.current = io.connect('https://new-medio1.herokuapp.com');
        // socketRef.current = io.connect('http://localhost:8000');
        navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true }).then(stream => {
            userVideo.current.srcObject = stream;

            socketRef.current.emit("join room", roomID);

            socketRef.current.on("all users", users => {
                const peers = [];
                users.forEach(userID => {

                    const peer = createPeer(userID, socketRef.current.id, stream);
                    peersRef.current.push({
                        peerID: userID,
                        peer,
                    })
                    peers.push({ peerID: userID, peer });
                })
                setPeers(peers);
            })


            socketRef.current.on("user joined", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.callerID);
                if (!item) {
                    const peer = addPeer(payload.signal, payload.callerID, stream);
                    peersRef.current.push({
                        peerID: payload.callerID,
                        peer,
                    })
                    const peerObj = { peerID: payload.callerID, peer }
                    setPeers(users => [...users, peerObj]);
                }

                

                
            });

            socketRef.current.on("receiving returned signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });


            socketRef.current.on('userLeft', id => {
                const leftPeer = peersRef.current.find(obj => obj.peerID === id)

                if (leftPeer) {
                    leftPeer.peer.destroy();
                }

                const newPeers = peersRef.current.filter(obj => obj.peerID !== id)
                peersRef.current = newPeers
                setPeers(() => [...newPeers]);

            })

        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);





    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });
        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
        })
        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })
        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID })
        })
        peer.signal(incomingSignal);

        return peer;
    }

    return (
        <>
            <div className="Container">
                <div className="videoContainer">
                    <StyledVideo controls muted ref={userVideo} autoPlay playsInline />
                    {peers.map((peer) => {
                        return (
                            <Video controls key={peer.peerID} peer={peer.peer} />
                        );
                    })}
                </div>
                {/* <button onClick={() => share()}>sadsadsadsad</button> */}
                <Chat roomID={roomID} />

            </div>

        </>
    );
};

export default Room;
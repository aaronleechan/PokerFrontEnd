import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
    const [mode, setMode] = useState(null); // 'create' or 'join'
    const [roomId, setRoomId] = useState('');
    const [user, setUser] = useState('');
    const [title, setTitle] = useState('');
    const [vote, setVote] = useState(null);
    const [votes, setVotes] = useState({});
    const [revealed, setRevealed] = useState(false);
    const [ws, setWs] = useState(null);
    const [error, setError] = useState('');
    const [isCreator, setIsCreator] = useState(false);

    useEffect(() => {
        const connectWebSocket = () => {
            const websocket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080');
            setWs(websocket);

            websocket.onopen = () => {
                console.log('WebSocket connection established');
                setError(''); // Clear any previous errors
            };

            websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'roomCreated') {
                    setRoomId(data.roomId);
                    setTitle(data.title);
                    setIsCreator(true);
                } else if (data.type === 'joined') {
                    setTitle(data.title);
                    setVotes(data.votes);
                    setRevealed(data.revealed);
                } else if (data.type === 'update' && data.roomId === roomId) {
                    setTitle(data.title);
                    setVotes(data.votes);
                    setRevealed(data.revealed);
                } else if (data.type === 'error') {
                    setError(data.message);
                }
            };

            websocket.onerror = () => {
                setError('WebSocket connection failed');
            };

            websocket.onclose = () => {
                console.log('WebSocket closed');
                setWs(null);
                setTimeout(connectWebSocket, 2000); // Attempt to reconnect after 2 seconds
            };

            return websocket;
        };

        const websocket = connectWebSocket();

        return () => {
            if (websocket.readyState === WebSocket.OPEN) {
                websocket.close();
            }
        };
    }, [roomId]); // Add roomId to dependency array to ensure updates propagate

    const createRoom = () => {
        if (ws && ws.readyState === WebSocket.OPEN && user && title) {
            ws.send(JSON.stringify({ type: 'create', user, title }));
        } else {
            setError('Cannot create room: missing data or connection');
        }
    };

    const joinRoom = () => {
        if (ws && ws.readyState === WebSocket.OPEN && roomId && user) {
            ws.send(JSON.stringify({ type: 'join', roomId, user }));
        } else {
            setError('Cannot join room: missing data or connection');
        }
    };

    const submitVote = () => {
        if (ws && ws.readyState === WebSocket.OPEN && roomId && user && vote !== null) {
            ws.send(JSON.stringify({ type: 'vote', roomId, user, vote }));
            console.log('Vote submitted:', { roomId, user, vote });
        } else {
            setError('Cannot submit vote: missing data or connection');
            console.log('Vote submission failed:', { ws, roomId, user, vote });
        }
    };

    const updateTitle = () => {
        if (ws && ws.readyState === WebSocket.OPEN && roomId && user && title) {
            ws.send(JSON.stringify({ type: 'updateTitle', roomId, user, title }));
        }
    };

    const flipVotes = () => {
        if (ws && ws.readyState === WebSocket.OPEN && roomId && user) {
            ws.send(JSON.stringify({ type: 'flip', roomId, user }));
        }
    };

    const resetVotes = () => {
        if (ws && ws.readyState === WebSocket.OPEN && roomId && user) {
            ws.send(JSON.stringify({ type: 'resetVotes', roomId, user }));
        }
    };

    const voteOptions = [1, 2, 3, 5, 8, 13, 20, 40, 100];

    if (!mode) {
        return (
            <div style={{ padding: '20px' }}>
                <h1>Scrum Poker</h1>
                <button onClick={() => setMode('create')}>Create Room</button>
                <button onClick={() => setMode('join')}>Join Room</button>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1>Scrum Poker</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {mode === 'create' && !roomId && (
                <div>
                    <input
                        placeholder="Your Name"
                        value={user}
                        onChange={(e) => setUser(e.target.value)}
                    />
                    <input
                        placeholder="Room Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <button onClick={createRoom}>Create Room</button>
                </div>
            )}
            {mode === 'join' && (
                <div>
                    <input
                        placeholder="Room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                    />
                    <input
                        placeholder="Your Name"
                        value={user}
                        onChange={(e) => setUser(e.target.value)}
                    />
                    <button onClick={joinRoom}>Join Room</button>
                </div>
            )}
            {(roomId || votes) && (
                <>
                    <p>Room ID: {roomId}</p>
                    {isCreator ? (
                        <div>
                            <input
                                placeholder="Update Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <button onClick={updateTitle}>Update Title</button>
                        </div>
                    ) : (
                        <h2>{title}</h2>
                    )}
                    <div style={{ marginTop: '20px' }}>
                        {voteOptions.map((option) => (
                            <button
                                key={option}
                                onClick={() => setVote(option)}
                                style={{
                                    margin: '5px',
                                    background: vote === option ? '#4CAF50' : '#ccc',
                                }}
                            >
                                {option}
                            </button>
                        ))}
                        <button onClick={submitVote}>Submit Vote</button>
                    </div>
                    {isCreator && (
                        <div style={{ marginTop: '10px' }}>
                            <button onClick={flipVotes}>
                                {revealed ? 'Hide Votes' : 'Reveal Votes'}
                            </button>
                            <button onClick={resetVotes} style={{ marginLeft: '10px' }}>
                                Reset Votes
                            </button>
                        </div>
                    )}
                    <h2>Votes:</h2>
                    <ul>
                        {Object.entries(votes).map(([voter, value]) => (
                            <li key={voter}>
                                {voter}: {revealed ? value : 'Voted'}
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
};

export default App;
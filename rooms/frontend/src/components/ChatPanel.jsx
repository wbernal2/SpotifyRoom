import React, { useState, useEffect, useRef } from 'react';

const ChatPanel = ({ roomCode, userName }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Dark theme styles matching the app
  const styles = {
    container: {
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.06)",
      borderRadius: "12px",
      overflow: "hidden",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)"
    },
    header: {
      padding: "12px 16px",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.02)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: "600"
    },
    collapseButton: {
      background: "none",
      border: "none",
      color: "#a1a1a6",
      fontSize: "18px",
      cursor: "pointer",
      padding: "4px",
      transition: "transform 0.2s ease"
    },
    messagesContainer: {
      maxHeight: "320px",
      overflowY: "auto",
      padding: "12px",
      display: isCollapsed ? "none" : "block"
    },
    message: {
      marginBottom: "12px",
      fontSize: "14px"
    },
    messageName: {
      color: "#1db954",
      fontWeight: "600",
      marginRight: "8px"
    },
    messageText: {
      color: "#ffffff",
      wordWrap: "break-word"
    },
    messageTime: {
      color: "#a1a1a6",
      fontSize: "11px",
      marginLeft: "8px"
    },
    inputContainer: {
      padding: "12px",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.02)",
      display: isCollapsed ? "none" : "block"
    },
    input: {
      width: "100%",
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "8px",
      padding: "8px 12px",
      color: "#ffffff",
      fontSize: "14px",
      outline: "none",
      resize: "none",
      fontFamily: "inherit"
    },
    inputDisabled: {
      opacity: "0.5",
      cursor: "not-allowed"
    },
    statusMessage: {
      textAlign: "center",
      color: "#a1a1a6",
      fontSize: "12px",
      padding: "8px",
      fontStyle: "italic"
    },
    retryButton: {
      background: "rgba(29, 185, 84, 0.1)",
      border: "1px solid rgba(29, 185, 84, 0.3)",
      color: "#1db954",
      padding: "6px 12px",
      borderRadius: "6px",
      fontSize: "12px",
      cursor: "pointer",
      marginTop: "8px",
      transition: "all 0.2s ease"
    },
    connectionStatus: {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      background: isConnected ? "#1db954" : "#ff3b30",
      marginLeft: "8px"
    }
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket connection management
  const connectWebSocket = () => {
    if (!roomCode) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}/ws/chat/${roomCode}/`;
    
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log('Chat WebSocket connected');
      setIsConnected(true);
    };
    
    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chat.message') {
        setMessages(prev => [...prev, {
          name: data.name,
          text: data.text,
          ts: data.ts
        }]);
      } else if (data.type === 'chat.error') {
        console.error('Chat error:', data.message);
      }
    };
    
    newSocket.onclose = () => {
      console.log('Chat WebSocket disconnected');
      setIsConnected(false);
    };
    
    newSocket.onerror = (error) => {
      console.error('Chat WebSocket error:', error);
      setIsConnected(false);
    };
    
    setSocket(newSocket);
  };

  // Connect on mount and cleanup on unmount
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [roomCode]);

  // Handle sending messages
  const sendMessage = () => {
    const trimmedMessage = inputValue.trim();
    
    if (!trimmedMessage || !socket || socket.readyState !== WebSocket.OPEN || !userName?.trim()) {
      return;
    }

    const message = {
      type: 'chat.message',
      name: userName.trim(),
      text: trimmedMessage
    };

    socket.send(JSON.stringify(message));
    setInputValue('');
  };

  // Handle input key events
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Retry connection
  const handleRetry = () => {
    if (socket) {
      socket.close();
    }
    connectWebSocket();
  };

  // Escape text content for safe rendering
  const escapeText = (text) => {
    return text; // React already escapes text nodes by default
  };

  const canSendMessage = socket && socket.readyState === WebSocket.OPEN && userName?.trim();

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header} onClick={() => setIsCollapsed(!isCollapsed)}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span>Room Chat</span>
          <div style={styles.connectionStatus}></div>
        </div>
        <button 
          style={{
            ...styles.collapseButton,
            transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)"
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
        >
          ▼
        </button>
      </div>

      {/* Messages Container */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.statusMessage}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} style={styles.message}>
              <span style={styles.messageName}>{escapeText(message.name)}</span>
              <span style={styles.messageText}>{escapeText(message.text)}</span>
              <span style={styles.messageTime}>
                {new Date(message.ts).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
        
        {/* Connection Status */}
        {!isConnected && (
          <div style={styles.statusMessage}>
            <div>Connection lost</div>
            <button 
              style={styles.retryButton}
              onClick={handleRetry}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(29, 185, 84, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(29, 185, 84, 0.1)";
              }}
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>

      {/* Input Container */}
      <div style={styles.inputContainer}>
        {!userName?.trim() ? (
          <div style={styles.statusMessage}>
            Enter name to chat
          </div>
        ) : (
          <textarea
            ref={inputRef}
            style={{
              ...styles.input,
              ...(canSendMessage ? {} : styles.inputDisabled)
            }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={canSendMessage ? "Type a message..." : "Connecting..."}
            disabled={!canSendMessage}
            rows={1}
            onInput={(e) => {
              // Auto-resize textarea
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ChatPanel;

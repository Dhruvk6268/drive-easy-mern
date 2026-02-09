import React, { useState, useEffect, useRef } from 'react';
import { Button, Form, InputGroup, Card, CloseButton, Spinner, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';
import './Chatbot.css';

const API_BASE_URL = 'http://localhost:5000/api/chatbot';

const Chatbot = ({ inline = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      message: "🚗 Hi! I'm your advanced car rental assistant! I can help you: **search cars**, **get recommendations**, **book vehicles**, **manage bookings**, **get quotes**, **raise support tickets**, and much more!",
      type: 'text',
      timestamp: new Date()
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const userToken = localStorage.getItem('token');

  // Quick actions for user convenience
// Update the quickActions array in Chatbot.jsx
const quickActions = [
  "Search for Toyota cars",
  "Show available SUVs", 
  "Find luxury cars",
  "Show economy cars",
  "Book a car for tomorrow",
  "Show my bookings",
  "Get quote for Tesla",
  "Check car availability",
  "Pay for my booking",
  "Check payment status",
  "Raise support ticket",
  "What cars do you have?"
];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Clear chat memory function
  const clearChatMemory = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/new-chat`,
        {},
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          }
        }
      );
      
      // Reset local state
      setMessages([
        {
          sender: 'bot',
          message: "🚗 Hi! I'm your advanced car rental assistant! I can help you: **search cars**, **get recommendations**, **book vehicles**, **manage bookings**, **get quotes**, **raise support tickets**, and much more!",
          type: 'text',
          timestamp: new Date()
        },
      ]);
      setError(null);
      
      console.log('Chat memory cleared successfully');
    } catch (error) {
      console.error('Error clearing chat memory:', error);
      // Don't show error to user for memory clear
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setError(null);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const handleQuickAction = (action) => {
    setInput(action);
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} });
    }, 100);
  };

  // Enhanced message processing with typing indicators
  const addMessageWithTyping = async (message, delay = 1000) => {
    setTyping(true);
    await new Promise(resolve => setTimeout(resolve, delay));
    setTyping(false);
    setMessages(prev => [...prev, { ...message, timestamp: new Date() }]);
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  const trimmedInput = input.trim();
  if (!trimmedInput) return;

    if (!userToken) {
      const authMessage = { 
        sender: 'bot', 
        message: '🔐 Please log in to use the chat assistant. Your session may have expired.', 
        type: 'error',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, authMessage]);
      setInput('');
      return;
    }

    const userMessage = { 
      sender: 'user', 
      message: trimmedInput, 
      type: 'text',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setInput('');
    setError(null);
    setSuggestions([]);

    try {
      // Use the correct endpoint structure
      const response = await axios.post(
        `${API_BASE_URL}/message`,
        {
          message: trimmedInput,
          history: messages.filter(msg => msg.type === 'text').slice(-10), // Last 10 messages
        },
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000,
        }
      );
  setInput('');
      const botResponse = response.data;

      const botMessage = {
        sender: 'bot',
        message: botResponse.response || botResponse.message,
        data: botResponse.structuredData || null,
        type: botResponse.type || 'text',
        timestamp: new Date()
      };

      await addMessageWithTyping(botMessage, 800);

    } catch (error) {
      console.error('Chat submission error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (!error.response) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      }

      const errorResponse = {
        sender: 'bot',
        message: `❌ ${errorMessage}`,
        type: 'error',
        timestamp: new Date(),
      };
      
      await addMessageWithTyping(errorResponse, 500);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced message rendering with rich content support
  const renderMessageContent = (msg) => {
    if (msg.type === 'error') {
      return (
        <Alert variant="danger" className="mb-2">
          <strong>Error:</strong> {msg.message}
        </Alert>
      );
    }

    if (msg.type === 'success') {
      return (
        <Alert variant="success" className="mb-2">
          <strong>Success!</strong> {msg.message}
        </Alert>
      );
    }

    // Enhanced car cards with more information
    if (msg.data && Array.isArray(msg.data)) {
      if (msg.data[0]?.type === 'car') {
        return (
          <>
            <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.message) }} />
            <div className="car-card-container mt-3">
              {msg.data.map((item, carIndex) => (
                <Card key={carIndex} className="car-card-enhanced mb-3">
                  <div className="car-image-container">
                    
<Card.Img 
  variant="top" 
  src={item.car.image} 
  alt={item.car.name}
  onError={(e) => {
    // Use a local fallback image or a reliable placeholder service
    e.target.src = '/images/car-placeholder.png';
    // Or use a data URL as fallback
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYXIgSW1hZ2U8L3RleHQ+PC9zdmc+';
  }}
/>
                  </div>
                  <Card.Body>
                    <Card.Title className="car-title">
                      {item.car.name} ({item.car.year})
                    </Card.Title>
                    <Card.Text className="car-features">
  <small className="text-muted">
    <i className="fas fa-tag me-1"></i> 
    <strong>${item.car.price}/day</strong>
  </small>
  <br/>
  <small className="text-muted">
    <i className="fas fa-car me-1"></i>
    {item.car.carType ? item.car.carType.charAt(0).toUpperCase() + item.car.carType.slice(1) : 'Standard'} • 
    <i className="fas fa-user-friends ms-1 me-1"></i>
    {item.car.seats} seats • {item.car.transmission} • {item.car.fuelType}
  </small>
  {item.car.features && item.car.features.length > 0 && (
    <>
      <br/>
      <small className="text-muted">
        <i className="fas fa-star me-1"></i>
        {item.car.features.slice(0, 2).join(', ')}
      </small>
    </>
  )}
</Card.Text>
                    <div className="car-actions">
                      <Button 
                        size="sm" 
                        variant="outline-primary"
                        onClick={() => handleQuickAction(`Get quote for ${item.car.name}`)}
                      >
                        Get Quote
                      </Button>
                      <Button 
                        size="sm" 
                        variant="primary"
                        onClick={() => handleQuickAction(`Book ${item.car.name}`)}
                      >
                        Book Now
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </>
        );
      }
    }

    // Default text message with markdown support
    return <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.message) }} />;
  };

  const formatMessage = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  };

  if (!userToken) {
    return null;
  }

  return (
    <>
      {/* Enhanced Chat Bubble */}
      <div 
        className={`chat-bubble-enhanced ${isOpen ? 'hidden' : ''} ${messages.length > 1 ? 'has-messages' : ''} ${inline ? 'inline' : ''}`}
        onClick={toggleChat}
      >
        <i className={`fas fa-comments ${inline ? 'fa-lg' : 'fa-2x'}`}></i>
        {messages.length > 1 && (
          <span className="message-indicator"></span>
        )}
      </div>

      {/* Enhanced Chat Window */}
      <Card className={`chat-window-enhanced ${isOpen ? 'open' : ''}`}>
        <Card.Header className="chat-header-enhanced d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <div className="avatar-container me-2">
              <i className="fas fa-robot"></i>
            </div>
            <div>
              <div className="fw-bold">Car Rental Assistant</div>
             
            </div>
          </div>
          <div className="d-flex align-items-center">
            <Button 
              variant="outline-secondary" 
              size="sm" 
              className="me-2"
              onClick={clearChatMemory}
              title="Clear chat and memory"
            >
              <i className="fas fa-sync-alt"></i>
            </Button>
            <CloseButton onClick={toggleChat} />
          </div>
        </Card.Header>

        <Card.Body className="chat-messages-enhanced">
          {/* Welcome message with quick actions */}
          {messages.length === 1 && (
            <div className="welcome-section">
              <div className="quick-actions-grid">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline-primary"
                    size="sm"
                    className="quick-action-btn"
                    onClick={() => handleQuickAction(action)}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message-bubble-enhanced ${msg.sender} ${msg.type}`}
            >
              <div className="message-content">
                {renderMessageContent(msg)}
                
                {/* Message timestamp */}
                <div className="message-timestamp">
                  {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Enhanced typing indicator */}
          {typing && (
            <div className="message-bubble-enhanced bot">
              <div className="typing-indicator-enhanced">
                <span>Assistant is typing</span>
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {loading && !typing && (
            <div className="message-bubble-enhanced bot">
              <div className="loading-indicator">
                <Spinner animation="border" size="sm" className="me-2" />
                Processing your request...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </Card.Body>

        <Card.Footer className="chat-footer-enhanced">
          {/* Error display */}
          {error && (
            <Alert variant="warning" className="mb-2 py-2">
              <small>
                <i className="fas fa-exclamation-triangle me-1"></i>
                {error}
              </small>
            </Alert>
          )}

          {/* Input suggestions */}
          {suggestions.length > 0 && (
            <div className="suggestions-container mb-2">
              {suggestions.map((suggestion, index) => (
                <Badge
                  key={index}
                  bg="outline-primary"
                  className="suggestion-badge me-1 mb-1"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          )}

          {/* Input form */}
          <Form onSubmit={handleSubmit}>
            <InputGroup>
              <Form.Control
                ref={inputRef}
                type="text"
                placeholder="Ask me anything about car rental..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    handleSubmit(e);
                  }
                }}
                className="chat-input-enhanced"
              />
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading || !input.trim()}
                className="send-button"
              >
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <i className="fas fa-paper-plane"></i>
                )}
              </Button>
            </InputGroup>
            <div className="input-hint">
              <small className="text-muted">
                Press Enter to send • Shift+Enter for new line
              </small>
            </div>
          </Form>
        </Card.Footer>
      </Card>
    </>
  );
};

export default Chatbot;
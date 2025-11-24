import { useState, useRef, useEffect } from 'react'
import { FaUniversity, FaPaperPlane, FaSpinner, FaMicrophone, FaVolumeUp, FaVolumeMute, FaMoon, FaSun } from 'react-icons/fa'
import Robot from './components/Robot'
import { fetchMenuForDate } from './utils/menuFetcher'
import './App.css'

// ============================================
// API CONFIGURATION
// ============================================
const API_KEY = import.meta.env.VITE_API_KEY || '4TNGJZK-TR34T7R-J0CACBN-90QCPGA'
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '/api/v1/workspace/hacettepe_llm/chat'
const THREAD_ID = import.meta.env.VITE_THREAD_ID || 'a5799fea-fac6-4e86-8fed-7f216b1bd991'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [robotMode, setRobotMode] = useState('idle') // 'idle', 'thinking', 'success', 'speaking'
  const [isListening, setIsListening] = useState(false)
  const [isSoundEnabled, setIsSoundEnabled] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  
  const [expandedSource, setExpandedSource] = useState(null);

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode);
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'tr-TR';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Optional: Auto-send after voice input
        // sendMessage(transcript); 
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Robot state management (Fallback if TTS is off)
  useEffect(() => {
    let timeout;
    if (!isSoundEnabled) {
      if (robotMode === 'success') {
        timeout = setTimeout(() => {
          setRobotMode('speaking');
        }, 2000); 
      } else if (robotMode === 'speaking') {
        timeout = setTimeout(() => {
          setRobotMode('idle');
        }, 5000); 
      }
    }
    return () => clearTimeout(timeout);
  }, [robotMode, isSoundEnabled]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  }

  const speakText = (text) => {
    if (!isSoundEnabled || !window.speechSynthesis) return;

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setRobotMode('speaking');
    };

    utterance.onend = () => {
      setRobotMode('idle');
    };

    utterance.onerror = () => {
      setRobotMode('idle');
    };

    window.speechSynthesis.speak(utterance);
  }

  const sendMessage = async (textOverride = null) => {
    const textToSend = textOverride || input.trim()
    if (!textToSend) return

    // Stop listening if active
    if (isListening) recognitionRef.current?.stop();

    // Check for menu related queries and intercept
    const lowerText = textToSend.toLowerCase();
    if (lowerText.includes('yemek') || lowerText.includes('menü')) {
      fetchDailyMenu(textToSend);
      setInput('');
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setRobotMode('thinking')
    setError(null)

    try {
      const requestBody = {
        message: textToSend,
        input: textToSend,
        text: textToSend,
        mode: 'chat',
        threadId: THREAD_ID
      }

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'x-api-key': API_KEY
        },
        body: JSON.stringify(requestBody)
      })

      const rawText = await response.text()
      let data = null
      try {
        data = rawText ? JSON.parse(rawText) : null
      } catch (e) {
        data = rawText
      }

      if (!response.ok) {
        throw new Error(`API hatası: ${response.status} ${response.statusText}`)
      }

      let assistantText = null
      if (data.textResponse) assistantText = data.textResponse
      else if (data.response) assistantText = typeof data.response === 'string' ? data.response : data.response.text || data.response.message
      else if (data.text) assistantText = data.text
      else if (data.message) assistantText = data.message
      else if (Array.isArray(data) && data.length > 0) assistantText = data[0].text || data[0].message
      
      if (!assistantText) {
        throw new Error('API yanıtı anlaşılamadı.')
      }
      
      const sources = data.sources || data.documents || []
      
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: assistantText,
        sources: sources,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      }

      setMessages(prev => [...prev, assistantMessage])
      setRobotMode('success') // Trigger success animation first
      
      // Trigger TTS if enabled
      if (isSoundEnabled) {
        setTimeout(() => {
          speakText(assistantText);
        }, 1500);
      }

    } catch (err) {
      setError(err.message || 'Bir hata oluştu.')
      setRobotMode('idle')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const fetchDailyMenu = async (queryText) => {
    setIsLoading(true);
    setRobotMode('thinking');
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Determine target date based on query
      const targetDate = new Date();
      if (queryText.toLowerCase().includes('yarın')) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
      
      const day = String(targetDate.getDate()).padStart(2, '0');
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const year = targetDate.getFullYear();
      const dateString = `${day}.${month}.${year}`;
      
      const menuText = await fetchMenuForDate(targetDate);
      
      let responseText = "";
      if (menuText && menuText.length > 5) {
        responseText = `📅 ${dateString} Menüsü:\n\n${menuText}`;
      } else {
        responseText = `${dateString} tarihi için menü bulunamadı. (Hafta sonu olabilir veya liste henüz güncellenmemiş)`;
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
      setRobotMode('success');
      
      if (isSoundEnabled) {
        setTimeout(() => {
          speakText(menuText ? `İşte ${dateString} tarihli yemek menüsü.` : "Üzgünüm, o tarih için menü bulamadım.");
        }, 1500);
      }

    } catch (err) {
      console.error(err);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: "Menü sistemine şu anda erişilemiyor. Lütfen bağlantınızı kontrol edin.",
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
      setRobotMode('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  }

  const cleanSourceName = (name) => {
    if (!name) return 'Belge';
    let clean = name.replace(/\.[^/.]+$/, "");
    clean = clean.replace(/[_-]/g, " ");
    clean = clean.replace(/\d{2} \d{2} \d{4}.*/, ""); 
    return clean.trim();
  }

  const renderMessage = (message) => (
    <div key={message.id} className={`message ${message.role}-message`}>
      <div className="message-bubble-wrapper">
        <div className={`message-bubble ${message.role}-bubble`}>
          <div className="message-text">{message.text}</div>
          {message.sources && message.sources.length > 0 && (
            <div className="message-sources">
              <div className="sources-title"><span>📌</span> Referanslar:</div>
              {(() => {
                // Deduplicate sources by name
                const uniqueSources = {};
                message.sources.forEach(source => {
                  const name = cleanSourceName(source.title || source.name);
                  if (!uniqueSources[name]) {
                    uniqueSources[name] = [];
                  }
                  uniqueSources[name].push(source);
                });

                return Object.entries(uniqueSources).map(([name, sources], index) => {
                  const isExpanded = expandedSource === `${message.id}-${name}`;
                  
                  return (
                    <div 
                      key={index} 
                      className={`source-item ${isExpanded ? 'expanded' : ''}`}
                      onClick={() => setExpandedSource(isExpanded ? null : `${message.id}-${name}`)}
                    >
                      <div className="source-header">
                        <div className="source-content">
                          <div className="source-icon">📄</div>
                          <div className="source-info">
                            <div className="source-name">
                              {name}
                              <span className="source-count">
                                {sources.length > 1 ? ` (${sources.length} parça)` : ''}
                              </span>
                            </div>
                          </div>
                          <div className="source-arrow">
                            {isExpanded ? '▼' : '▶'}
                          </div>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="source-details">
                          {sources.map((source, idx) => (
                            <div key={idx} className="source-snippet">
                              {source.text || source.content || "İçerik görüntülenemedi."}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
        <div className="message-time">{message.timestamp}</div>
      </div>
    </div>
  )

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-icon-wrapper">
            <img 
              src="/Hacettepe_Üniversitesi_logo.svg.png" 
              alt="Hacettepe Üniversitesi Logo" 
              className="header-logo"
            />
          </div>
          <div className="header-text">
            <h1>Hacettepe AI</h1>
            <p className="header-subtitle">Akademik Asistan</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className={`icon-button ${isDarkMode ? 'active' : ''}`}
            onClick={toggleDarkMode}
            title={isDarkMode ? "Aydınlık Mod" : "Karanlık Mod"}
          >
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button 
            className={`icon-button ${isSoundEnabled ? 'active' : ''}`}
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            title={isSoundEnabled ? "Sesi Kapat" : "Sesi Aç"}
          >
            {isSoundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
          </button>
        </div>
      </header>

      <main className="main-layout">
        <div className="chat-section">
          <div className="messages-wrapper">
            {messages.length === 0 && (
              <div className="welcome-card">
                <h2>Merhaba!</h2>
                <p>Ben Hacettepe Üniversitesi yapay zeka asistanıyım. Size kampüs, dersler veya akademik konularda nasıl yardımcı olabilirim?</p>
                
                <div className="suggestions-grid">
                  <div className="suggestion-chip" onClick={() => handleSuggestionClick("Çift anadal programına başvuru yapabilmek için öğrencinin sağlaması gereken akademik şartlar nelerdir?")}>
                    <span>📅</span> Çift anadal programına başvuru yapabilmek için öğrencinin sağlaması gereken akademik şartlar nelerdir?
                  </div>
                  <div className="suggestion-chip" onClick={() => handleSuggestionClick("Devamsızlık sınırı nasıl uygulanır ve hangi durumda öğrenci sınava giremez sayılır?")}>
                    <span>🗺️</span> Devamsızlık sınırı nasıl uygulanır ve hangi durumda öğrenci sınava giremez sayılır?
                  </div>
                  <div className="suggestion-chip" onClick={() => handleSuggestionClick("Yemekhane menüsünde ne var?")}>
                    <span>🍽️</span> Yemekhane menüsü
                  </div>
                  <div className="suggestion-chip" onClick={() => handleSuggestionClick("Komisyonun değerlendirme süreci nasıl işler ve hangi doğrulama yöntemlerini kullanabilir?")}>
                    <span>📚</span> Komisyonun değerlendirme süreci nasıl işler ve hangi doğrulama yöntemlerini kullanabilir?
                  </div>
                </div>
              </div>
            )}
            
            {messages.map(renderMessage)}
            
            {isLoading && (
              <div className="message assistant-message loading">
                <div className="message-bubble-wrapper">
                  <div className="message-bubble assistant-bubble loading-bubble">
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <div className="error-content"><p>{error}</p></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <div className="input-container">
              <button 
                className={`mic-button ${isListening ? 'listening' : ''}`}
                onClick={toggleListening}
                disabled={isLoading}
                title="Sesli Yaz"
              >
                <FaMicrophone />
              </button>
              <textarea
                ref={inputRef}
                className="message-input"
                placeholder={isListening ? "Dinliyorum..." : "Mesajınızı yazın..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={1}
                disabled={isLoading}
              />
              <button
                className="send-button"
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
              </button>
            </div>
          </div>
        </div>

        <div className="robot-section">
          <div className="robot-wrapper">
            <Robot mode={robotMode} />
            <div className="robot-status">
              {robotMode === 'idle' && 'Hazır'}
              {robotMode === 'thinking' && 'Araştırıyor...'}
              {robotMode === 'success' && 'Buldum!'}
              {robotMode === 'speaking' && 'Yanıtlıyor...'}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

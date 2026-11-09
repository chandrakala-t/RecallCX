import { useEffect, useState } from 'react'
import './App.css'

// Temporary API address.
// Change this to your friend's accessible backend address later.
const API_BASE = 'https://recallcx-backend.onrender.com'
const API_URL = `${API_BASE}/chat`
const STORAGE_KEY = 'recallcx_conversations_v1'
// Temporary sample conversation for every new customer.
const INITIAL_SAMPLE_CONVERSATION = [
  {
    role: 'user',
    text: 'My headphones stopped working after two days.',
    time: 'Sample conversation'
  }
]

function loadConversations() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved !== null) {
      const parsed = JSON.parse(saved)

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const cleaned = { ...parsed }

        // Remove any previously saved sample messages.
        Object.keys(cleaned).forEach((id) => {
          if (Array.isArray(cleaned[id])) {
            cleaned[id] = cleaned[id].filter(
              (msg) =>
                !(
                  msg.text === 'My headphones stopped working after two days.' &&
                  msg.time === 'Sample conversation'
                )
            )
          }
        })

        return cleaned
      }
    }
  } catch (err) {
    console.error('Could not restore saved conversations:', err)
  }

  return {}
}

function App() {
  const [customerId, setCustomerId] = useState(() => {
  return localStorage.getItem('recallcx_active_customer') || 'C101'
})

const [customerInput, setCustomerInput] = useState(() => {
  return localStorage.getItem('recallcx_active_customer') || 'C101'
})
  const [message, setMessage] = useState('')
  const [page, setPage] = useState('support')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [conversations, setConversations] = useState(loadConversations)
useEffect(() => {
  localStorage.setItem('recallcx_active_customer', customerId)
}, [customerId])

  const currentMessages = conversations[customerId] || []

const messagesToDisplay =
  currentMessages.length === 0
    ? INITIAL_SAMPLE_CONVERSATION
    : currentMessages

  // Save every customer's conversation whenever the conversation data changes.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
    } catch (err) {
      console.error('Could not save conversations:', err)
      setError('Conversation history could not be saved in this browser.')
    }
  }, [conversations])

  const selectCustomer = (e) => {
    e.preventDefault()

    const id = customerInput.trim().toUpperCase()

    if (!/^C\d+$/.test(id)) {
      alert('Enter a valid Customer ID, such as C101.')
      return
    }

    setCustomerId(id)
    setError('')

    setConversations((prev) => ({
      ...prev,
      [id]: prev[id] || []
    }))
  }

  const sendMessage = async (e) => {
    e.preventDefault()

    const text = message.trim()

    if (!text || isLoading) return

    const selectedCustomer = customerId

    const userMessage = {
      role: 'user',
      text,
      time: new Date().toLocaleString()
    }

    setConversations((prev) => ({
      ...prev,
      [selectedCustomer]: [
        ...(prev[selectedCustomer] || []),
        userMessage
      ]
    }))

    setMessage('')
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_id: selectedCustomer,
          message: text
        })
      })

      if (!response.ok) {
        throw new Error(`Backend error: HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!data.reply) {
        throw new Error('The backend did not return an AI reply.')
      }

      const aiMessage = {
        role: 'assistant',
        text: data.reply,
        time: new Date().toLocaleString(),
        memoryUsed: data.memory_used === true
      }

      setConversations((prev) => ({
        ...prev,
        [selectedCustomer]: [
          ...(prev[selectedCustomer] || []),
          aiMessage
        ]
      }))

    } catch (err) {
      console.error('Chat API error:', err)

      setError(
        'Unable to connect to the AI backend. Check that the backend is running, its address is correct, and CORS is enabled.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const renderMessages = () => (
    <>
      {messagesToDisplay.map((msg, index) => (
        <div className="message-row" key={index}>
          <div className="user-avatar">
            {msg.role === 'assistant' ? 'AI' : 'You'}
          </div>

          <div className="message-content">
            <strong>
              {msg.role === 'assistant' ? 'RecallCX AI' : customerId}
            </strong>

            <p>{msg.text}</p>

            <small>{msg.time}</small>

            {msg.role === 'assistant' && (
              <small>
                {msg.memoryUsed
                  ? 'Hindsight memory used'
                  : 'No relevant Hindsight memory reported'}
              </small>
            )}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="message-row">
          <div className="user-avatar">AI</div>
          <div className="message-content">
            <strong>RecallCX AI</strong>
            <p>Thinking... Please wait.</p>
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="brand">
          Recall<span>CX</span>
        </h2>

        <p className="sidebar-label">WORKSPACE</p>

        <button
          className={`nav-item ${page === 'support' ? 'active' : ''}`}
          onClick={() => setPage('support')}
        >
          Customer Support
        </button>

        <button
          className={`nav-item ${page === 'history' ? 'active' : ''}`}
          onClick={() => setPage('history')}
        >
          Conversation History
        </button>

        <button
          className={`nav-item ${page === 'memory' ? 'active' : ''}`}
          onClick={() => setPage('memory')}
        >
          Customer Memory
        </button>

        <div className="sidebar-bottom">
          <div className="status-dot"></div>
          Hindsight Memory
          <span>Backend integration testing</span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h2>
              {page === 'support' && 'Customer Support'}
              {page === 'history' && 'Conversation History'}
              {page === 'memory' && 'Customer Memory'}
            </h2>

            <p>Intelligent support powered by persistent memory</p>
          </div>

          <form className="customer-box" onSubmit={selectCustomer}>
            <label>Select Customer ID</label>

            <div className="customer-selector">
              <input
                value={customerInput}
                onChange={(e) => setCustomerInput(e.target.value)}
                placeholder="Example: C101"
              />

              <button type="submit">Select</button>
            </div>
          </form>
        </header>

        {page === 'support' && (
          <section className="chat-container">
            <div className="chat-header">
              <div>
                <h3>Support Conversation</h3>
                <p>Customer: {customerId}</p>
              </div>

              <span className="badge">Current Session</span>
            </div>

            <div className="chat-body">
              {currentMessages.length === 0 && !isLoading ? (
                <div className="welcome">
                  <div className="brain-icon">AI</div>

                  <h2>Welcome to RecallCX</h2>

                  <p>
                    Your AI customer support assistant remembers
                    previous conversations to provide better support.
                  </p>

                  <div className="suggestion">
                    <span>Try a message</span>

                    <button
                      type="button"
                      onClick={() =>
                        setMessage(
                          'My headphones stopped working after two days. I want a replacement.'
                        )
                      }
                    >
                      My headphones stopped working after two days.
                    </button>
                  </div>
                </div>
              ) : renderMessages()}
            </div>

            {error && (
              <p className="disclaimer" role="alert">
                {error}
              </p>
            )}

            <form className="message-form" onSubmit={sendMessage}>
              <input
                type="text"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isLoading}
              />

              <button type="submit" disabled={isLoading || !message.trim()}>
                {isLoading ? 'Sending...' : 'Send ↑'}
              </button>
            </form>

            <p className="disclaimer">
              AI replies are provided by the connected FastAPI backend.
              Memory usage depends on the backend response.
            </p>
          </section>
        )}

        {page === 'history' && (
          <section className="chat-container">
            <div className="chat-header">
              <div>
                <h3>Conversation History</h3>
                <p>Customer: {customerId}</p>
              </div>
            </div>

            <div className="chat-body">
              {currentMessages.length === 0 ? (
                <div className="welcome">
                  <div className="brain-icon">History</div>

                  <h2>No Conversations Yet</h2>

                  <p>
                    No previous conversations found for {customerId}.
                  </p>
                </div>
              ) : renderMessages()}
            </div>
          </section>
        )}

        {page === 'memory' && (
          <section className="chat-container">
            <div className="chat-header">
              <div>
                <h3>Customer Memory</h3>
                <p>Customer: {customerId}</p>
              </div>

              <span className="badge">Preview</span>
            </div>

            <div className="chat-body">
              <div className="memory-card">
                <div className="brain-icon">AI</div>

                <h2>Customer Information</h2>

                <p>
                  <strong>Customer ID:</strong> {customerId}
                </p>

                <p>
                  <strong>Customer Tag:</strong> customer:{customerId}
                </p>

                <p>
                  <strong>Messages in current session:</strong>{' '}
                  {currentMessages.length}
                </p>

                <hr />

                <h3>Conversation Details</h3>

                {currentMessages.length === 0 ? (
                  <p>No messages available for this customer.</p>
                ) : (
                  currentMessages.map((msg, index) => (
                    <p key={index}>
                      <strong>
                        {msg.role === 'assistant' ? 'AI: ' : 'Customer: '}
                      </strong>
                      {msg.text}
                    </p>
                  ))
                )}

                <p className="disclaimer">
                  This page displays the current frontend conversation.
                  Actual persistent memories must be retrieved through Hindsight.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App

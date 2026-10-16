import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { connectSocket } from '../socket';
import { fetchConversations, fetchMessages, postMessage } from '../api/messages';
import type { Conversation, Message } from '../api/messages';
import { fetchUserById, fetchUserProfile } from '../api/users';
import type { BasicUser } from '../api/users';

interface ChatPanelProps {
  activeUserId: string;
  onConversationsChanged: () => void;
}

// One chat. It is remounted (key) whenever the chat partner changes, so state resets itself.
const ChatPanel: React.FC<ChatPanelProps> = ({ activeUserId, onConversationsChanged }) => {
  const { user } = useAuth();

  const [activeUser, setActiveUser] = useState<BasicUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingSentRef = useRef(false);

  // Load the chat partner and history
  useEffect(() => {
    let active = true;

    fetchUserById(activeUserId)
      .then((u) => {
        if (active) setActiveUser(u);
      })
      .catch(() => {
        if (active) setError('This user could not be found.');
      });

    fetchMessages(activeUserId)
      .then((m) => {
        if (!active) return;
        setMessages(m);
        onConversationsChanged(); // opening a chat marks messages read, so refresh unread badges
      })
      .catch(() => {
        if (active) setError('Could not load this conversation.');
      });

    return () => {
      active = false;
    };
  }, [activeUserId, onConversationsChanged]);

  // Real-time events for this chat
  useEffect(() => {
    if (!user?.id) return;
    const socket = connectSocket();
    if (!socket) return;

    const onReceive = (msg: Message) => {
      if (msg.senderId !== activeUserId) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    };
    const onTyping = ({ senderId }: { senderId: string }) => {
      if (senderId === activeUserId) setIsTyping(true);
    };
    const onStopTyping = ({ senderId }: { senderId: string }) => {
      if (senderId === activeUserId) setIsTyping(false);
    };

    socket.on('receive_message', onReceive);
    socket.on('user_typing', onTyping);
    socket.on('user_stop_typing', onStopTyping);

    return () => {
      socket.off('receive_message', onReceive);
      socket.off('user_typing', onTyping);
      socket.off('user_stop_typing', onStopTyping);
    };
  }, [user?.id, activeUserId]);

  // Scroll to the newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setText(value);

    const socket = connectSocket();
    const hasText = value.trim().length > 0;

    if (hasText && !typingSentRef.current) {
      socket?.emit('typing', { receiverId: activeUserId });
      typingSentRef.current = true;
    } else if (!hasText && typingSentRef.current) {
      socket?.emit('stop_typing', { receiverId: activeUserId });
      typingSentRef.current = false;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;

    if (typingSentRef.current) {
      connectSocket()?.emit('stop_typing', { receiverId: activeUserId });
      typingSentRef.current = false;
    }

    try {
      setSending(true);
      setError(null);
      const saved = await postMessage(activeUserId, content);
      setMessages((prev) => (prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]));
      setText('');
      onConversationsChanged();
    } catch (err) {
      console.error('Failed to send message', err);
      setError('Message failed to send. Please try again.'); // text stays so the user can retry
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--border)', display: 'grid', placeItems: 'center', fontWeight: 'bold' }}>
          {activeUser?.username?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
          {activeUser?.username ? `@${activeUser.username}` : error ? 'Unknown user' : 'Loading user...'}
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((m) => {
          const isMe = m.senderId === user?.id;
          return (
            <div
              key={m.id}
              style={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                background: isMe ? '#0095f6' : 'var(--surface-2, #efefef)',
                color: isMe ? '#ffffff' : 'var(--text, #262626)',
                padding: '10px 16px',
                borderRadius: '18px',
                maxWidth: '65%',
                fontSize: '14px',
                wordBreak: 'break-word',
              }}
            >
              {m.content}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {isTyping && (
        <div className="muted" style={{ fontSize: '13px', paddingLeft: '20px', marginBottom: '8px', fontStyle: 'italic' }}>
          @{activeUser?.username || 'User'} is typing...
        </div>
      )}

      {error && <div style={{ color: '#ed4956', fontSize: '13px', padding: '0 20px 8px' }}>{error}</div>}

      <form onSubmit={handleSend} style={{ display: 'flex', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <input
          type="text"
          placeholder="Message..."
          value={text}
          maxLength={2000}
          onChange={handleInputChange}
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)' }}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          style={{ border: 'none', background: 'none', color: '#0095f6', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export const DirectMessages: React.FC = () => {
  const { userId: activeUserId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshConversations = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Sidebar list (reloads whenever refreshKey changes)
  useEffect(() => {
    let active = true;

    fetchConversations()
      .then((data) => {
        if (!active) return;
        setConversations(data);
        setListError(null);
      })
      .catch((err) => {
        console.error('Failed to load conversations', err);
        if (active) setListError('Could not load your conversations.');
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  // New incoming message: refresh the sidebar even when no chat is open
  useEffect(() => {
    if (!user?.id) return;
    const socket = connectSocket();
    if (!socket) return;

    socket.on('receive_message', refreshConversations);
    return () => {
      socket.off('receive_message', refreshConversations);
    };
  }, [user?.id, refreshConversations]);

  const handleNewMessage = async () => {
    const targetUsername = prompt('Enter username to message:')?.trim();
    if (!targetUsername) return;
    try {
      const profile = await fetchUserProfile(targetUsername);
      if (profile.id === user?.id) {
        alert('You cannot message yourself.');
        return;
      }
      navigate(`/direct/${profile.id}`);
    } catch {
      alert('User not found');
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', border: '1px solid var(--border)', margin: '20px auto', maxWidth: '935px', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Left Sidebar */}
      <div style={{ width: '320px', borderRight: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 'bold' }}>{user?.username || 'Messages'}</span>
          <button
            type="button"
            onClick={handleNewMessage}
            style={{ background: 'none', border: 'none', color: '#0095f6', fontWeight: '600', cursor: 'pointer' }}
          >
            New Message
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {listError && <p style={{ padding: '16px', fontSize: '13px', color: '#ed4956' }}>{listError}</p>}
          {conversations.length === 0 && !listError ? (
            <p className="muted" style={{ padding: '16px', fontSize: '14px' }}>No direct messages yet.</p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.user.id}
                onClick={() => navigate(`/direct/${c.user.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: activeUserId === c.user.id ? 'var(--surface-2)' : 'transparent',
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--border)', display: 'grid', placeItems: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                  {c.user.username[0]?.toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ fontWeight: c.unreadCount > 0 ? 700 : 600, fontSize: '14px' }}>{c.user.username}</div>
                  <div className="muted" style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.lastMessage}
                  </div>
                </div>
                {c.unreadCount > 0 && activeUserId !== c.user.id && (
                  <span style={{ background: '#0095f6', color: '#fff', borderRadius: '10px', fontSize: '11px', fontWeight: 700, padding: '2px 7px' }}>
                    {c.unreadCount}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Panel */}
      {activeUserId ? (
        <ChatPanel
          key={activeUserId}
          activeUserId={activeUserId}
          onConversationsChanged={refreshConversations}
        />
      ) : (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', background: 'var(--surface)', textAlign: 'center' }}>
          <div>
            <h3 style={{ marginBottom: '8px' }}>Your Messages</h3>
            <p className="muted">Send private messages to a friend.</p>
          </div>
        </div>
      )}
    </div>
  );
};
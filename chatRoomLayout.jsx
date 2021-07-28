import React, { useContext, useState, useEffect } from 'react';

import io from 'socket.io-client'

import { AuthContext } from '../auth/authContext';

import useExit from './hooks/useExit';
import { ChatUsersList } from './chatUsersList';
import { MessageList } from './messageList';
import { MessageForm } from './messageForm';

const styles = {
  chatBlock: { border: '1px solid lightgrey', borderRadius: '25px' },
  chatUserList: { float: 'right', width: '50px', height: '50px' },
  chatMessageList: { maxHeight: '300px' }
}

const SERVER_URL = '/'
const authorizationKey = 'authorization';

const ChatRoomLayout = ({ state }) => {
  const { user } = useContext(AuthContext);

  const [showExit, setExit] = useExit(false);

  const handleClick = (e) => {
    e.preventDefault();
    setExit(!showExit)
  }

  const [open, setOpen] = useState(false);

  const handleChatUsersList = (event) => {
    event.preventDefault();
    setOpen(!open);
  }

  const [chatId, setChatId] = React.useState(null);
  const [token, setToken] = React.useState(null);
  const [users, setUsers] = React.useState([])
  const [messages, setMessages] = useState([])  

  const socket = io(SERVER_URL, {
    perMessageDeflate: false,
    path: '/chat'    
  });

  const sendMessage = ({ messageText, senderName }) => {
    socket.emit('message:add', {
      chatId,
      userId: user.id,
      messageText,
      senderName
    });
  }

  const removeMessage = (id) => {
    socket.emit('message:remove', { chatId, messageId: id });
  }

  socket.onAny((event, ...args) => {
    console.log('onAny', event, args);
  });

  chatId && (socket.chat = chatId);
  chatId && (socket.connect());

  useEffect(() => {
    return () => {
      setExit(false)
    }
  }, [])

  useEffect(() => {
    setChatId(state.streamId);
    setToken(localStorage[authorizationKey]);
    if (chatId && token) {
      socket.emit('chat:join', ({ chatId: chatId, chatName: state.streamName || '', token }))
    }

    socket.on('users:list', (users) => {
      setUsers(users);
    });

    socket.on('messages:list', (messages) => {
      if (messages) {        
        setMessages(messages);
      }
    });

    return () => {
      socket.emit('chat:leave', ({ chatId: chatId, chatName: state.streamName || '', token }));
    }
  }, [state])

  return (
    <div style={styles.chatBlock} setExit={setExit}>
      <img onClick={handleChatUsersList} style={styles.chatUserList} src="./img/chat.svg" />

      {open && <ChatUsersList users={users} state={state} />}
      { !open && <>
        <MessageList messages={messages} removeMessage={removeMessage} user={user} style={styles.chatMessageList} />
        <MessageForm username={user.userName} sendMessage={sendMessage} />
      </> }
    </div>
  )
};

export default ChatRoomLayout;
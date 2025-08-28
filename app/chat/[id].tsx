import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ActionSheetIOS,
} from "react-native";
import { Image } from 'expo-image';
import { useAuth } from "@/contexts/AuthContext";
import { chatApi } from "@/services/api";
import socketService from "@/services/socketService";
import { useImagePicker } from "@/hooks/useImagePicker";
import axios from 'axios';
interface Message {
  _id: string;
  content: string;
  messageType: string; // Changed from 'type' to 'messageType' to match backend
  sender: {
    _id: string;
    username: string;
    fullName?: string;
  };
  chat: string; // Changed from chatId to chat to match backend
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

interface Chat {
  _id: string;
  name?: string;
  chatType: "direct" | "group"; // Fixed to match backend
  participants: {
    user: {
      // Fixed to match populated structure
      _id: string;
      username: string;
      fullName?: string;
    };
  }[];
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth(); // Added userId here
  const { pickImage } = useImagePicker();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null); // Re-enabled chat details
  const [isLoading, setIsLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [lastSentMessage, setLastSentMessage] = useState("");
  const [dataReady, setDataReady] = useState(false);
  // Check if chat ID exists
  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }
  }, [id]);

  // Load chat messages
  const loadMessages = useCallback(async () => {
    if (!id || !user || !user.id) {
      console.log("❌ Cannot load messages: missing id or user data", { id, user: user?.id });
      return;
    }

    console.log("🔄 Starting to load chat data...");
    setIsLoading(true);
    setDataReady(false); // Reset data ready state

    try {
      console.log("🏠 Loading chat details first...");
      // Load chat details FIRST to ensure we have chat structure
      const chatResponse = await chatApi.getChatDetails(id);
      console.log("chatResponse:", chatResponse);
      
      if (chatResponse.success && chatResponse.data) {
        // Validate chat data structure
        const chatData = chatResponse.data;
        if (chatData && chatData.participants && Array.isArray(chatData.participants)) {
          console.log("✅ Chat data validated and set");
          setChat(chatData);
        } else {
          console.error("Invalid chat data structure:", chatData);
          Alert.alert("Error", "Invalid chat data received");
          return;
        }
      } else {
        console.error("Failed to load chat details");
        Alert.alert("Error", "Failed to load chat details");
        return;
      }

      console.log("📥 Loading messages...");
      // Now load messages after chat is established
      const messagesResponse = await chatApi.getChatMessages(id);
      console.log("getChatMessages response:", messagesResponse);

      if (messagesResponse.success && messagesResponse.data) {
        // Filter out any invalid messages
        const validMessages = messagesResponse.data.filter((msg: any) => {
          const isValid = msg && 
                         msg._id && 
                         msg.sender && 
                         msg.sender._id &&
                         (msg.sender.username || msg.sender.fullName);
          if (!isValid) {
            console.warn("❌ Invalid message filtered out:", msg);
          }
          return isValid;
        });
        console.log(`✅ Loaded ${validMessages.length} valid messages`);
        setMessages(validMessages);
      } else {
        console.log("📭 No messages found");
        setMessages([]);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      Alert.alert("Error", "Failed to load messages");
      setMessages([]);
    } finally {
      setIsLoading(false);
      
      // Set data ready only when we have all required data
      setTimeout(() => {
        if (user && user.id) {
          console.log("🎯 All data ready - enabling interface");
          setDataReady(true);
        }
        scrollToBottom();
      }, 200);
    }
  }, [id, user]);

  // Initial load
  useEffect(() => {
    if (id && user && user.id) {
      console.log("🚀 Starting initial data load for chat:", id);
      loadMessages();
    } else {
      console.log("⏳ Waiting for user data before loading chat...", { id, userId: user?.id });
    }
  }, [id, user, loadMessages]);

  // Scroll to bottom when messages change (except during initial loading)
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages.length, isLoading]);

  // Join chat room and set up socket listeners
  useEffect(() => {
    console.log('🔌 Socket Setup Check:', {
      chatId: id,
      userId: user?.id,
      connected: socketService.isConnected(),
      socketId: socketService.getSocket()?.id
    });

    if (!id || !user?.id) {
      console.log('Missing chat ID or user ID');
      return;
    }

    // Ensure socket is connected
    if (!socketService.isConnected()) {
      console.log('Socket not connected, attempting to connect...');
      socketService.connect().then(() => {
        console.log('Socket connected successfully');
      }).catch((error) => {
        console.error('Socket connection failed:', error);
      });
      return;
    }

    console.log('Setting up socket listeners for chat:', id);

    // Join the chat room
    socketService.joinChat(id);
    console.log('📱 Joined chat room:', id);

    // Add debug listener for ALL events
    const socket = socketService.getSocket();
    if (socket) {
      const debugHandler = (eventName: string, data: any) => {
        console.log('Socket Event:', eventName, data);
        if (eventName === 'messageBlocked') {
          console.log('🚨 MESSAGEBLOCKED EVENT DETECTED:', data);
        }
      };
      socket.onAny(debugHandler);

      // Listen for blocked messages - consolidated handler
      const handleMessageBlocked = (data: any) => {
        console.log('🚫 Message blocked received:', data);
        console.log('🚫 Current lastSentMessage:', lastSentMessage);
        
        Alert.alert(
          'Message Blocked',
          data.message || 'Your message contains inappropriate content and has been blocked.',
          [{ text: 'OK' }]
        );
        
        // Remove temp message if it exists
        setMessages((prev) => {
          console.log('🗑️ Removing temp messages, current count:', prev.length);
          const filtered = prev.filter((msg) => !msg._id.startsWith('temp_'));
          console.log('🗑️ After filtering, count:', filtered.length);
          return filtered;
        });
        
        // Restore the blocked message to input so user can edit it
        if (lastSentMessage) {
          console.log('↩️ Restoring blocked message to input:', lastSentMessage);
          setNewMessage(lastSentMessage);
          setLastSentMessage(""); // Clear after restoring
        }
      };

      // Set up the listener
      socket.on('messageBlocked', handleMessageBlocked);

      // Test socket with ping
      setTimeout(() => {
        console.log('🏓 Sending test ping...');
        socket.emit('ping', { chatId: id, userId: user.id });
      }, 1000);
    }

    // Listen for new messages
    socketService.onNewMessage((message) => {
      console.log('📨 NEW MESSAGE:', {
        messageId: message._id,
        content: message.content,
        chatId: message.chat,
        currentChatId: id,
        matches: message.chat === id
      });

      if (message.chat === id || message.chatId === id) {
        // Check both chat and chatId for compatibility
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some((m) => m._id === message._id);
          if (exists) return prev;

          // Replace temporary message if it exists
          const tempIndex = prev.findIndex((m) => m._id.startsWith("temp_"));
          if (tempIndex >= 0) {
            const newMessages = [...prev];
            newMessages[tempIndex] = message;
            // Clear lastSentMessage when temp message is replaced (message sent successfully)
            setLastSentMessage("");
            return newMessages;
          }

          return [...prev, message];
        });
        scrollToBottom();
      }
    });

    // Listen for typing indicators
    socketService.onUserTyping(
      ({ userId: typingUserId, chatId, isTyping: typing }) => {
        console.log('👤 Typing:', { typingUserId, chatId, typing });
        
        if (chatId === id && typingUserId !== user?.id) {
          // Use stored userId instead of user?._id
          setTypingUsers((prev) => {
            if (typing) {
              return prev.includes(typingUserId)
                ? prev
                : [...prev, typingUserId];
            } else {
              return prev.filter((id) => id !== typingUserId);
            }
          });
        }
      }
    );

    // Listen for deleted messages
    const socketInstance = socketService.getSocket();
    if (socketInstance) {
      socketInstance.on('messageDeleted', (data) => {
        console.log('🗑️ Message deleted:', data);
        if (data.chatId === id) {
          setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
        }
      });

      socketInstance.on('chatDeleted', (data) => {
        console.log('🗑️ Chat deleted:', data);
        if (data.chatId === id) {
          Alert.alert(
            "Chat Deleted",
            "This chat has been deleted.",
            [
              {
                text: "OK",
                onPress: () => router.back(),
              },
            ]
          );
        }
      });
    }

    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socketService.leaveChat(id);
      socketService.removeListener("newMessage");
      socketService.removeListener("userStartTyping");
      socketService.removeListener("userStopTyping");
      
      // Remove debug listener and deletion listeners
      if (socket) {
        socket.offAny();
        socket.off('messageDeleted');
        socket.off('chatDeleted');
        socket.off('messageBlocked');
      }
    };
  }, [id, user?.id, lastSentMessage]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates?.height || 0);
      scrollToBottom();
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id || !user || !user.id) return; // Added userId check

    const messageContent = newMessage.trim();
    
    // Store the message content before clearing input (for potential restoration if blocked)
    setLastSentMessage(messageContent);
    setNewMessage("");

    // Create temporary message for immediate UI update
    const tempMessage: Message = {
      _id: `temp_${Date.now()}`,
      content: messageContent,
      messageType: "text", // Changed from 'type' to 'messageType'
      sender: {
        _id: user.id, // Use stored userId instead of user._id
        username: user.username || "Unknown",
        fullName: user.fullName || user.username || "Unknown", // Safe fallback
      },
      chat: id, // Changed from chatId to chat
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add message to local state immediately
    setMessages((prev) => [...prev, tempMessage]);
    scrollToBottom();

    try {
      // Send ONLY via socket for real-time delivery AND persistence
      // The socket handler on the backend saves to database and broadcasts to all participants
      socketService.sendMessage(id, messageContent);

      // Wait for the socket to confirm message was sent
      // The real message will come back via the 'newMessage' socket event
      // and will replace the temp message automatically
      
      console.log('Message sent via socket, waiting for confirmation...');
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");

      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
      setNewMessage(messageContent); // Restore message on error
    }
  };

  const handleInputChange = (text: string) => {
    setNewMessage(text);

    // Handle typing indicators
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      socketService.startTyping(id!);
    } else if (text.length === 0 && isTyping) {
      setIsTyping(false);
      socketService.stopTyping(id!);
    }
  };

  const handleImageUpload = async () => {
    if (!id || !user || isUploadingImage) return;

    try {
      console.log('Starting image selection...');
      const imageResult = await pickImage();
      
      if (!imageResult) {
        console.log('No image selected');
        return;
      }

      console.log('Image selected:', imageResult);
      
      // 🛡️ NSFW CHECK: Analyze image before uploading
      console.log('==========================================');
      console.log('�️ [CHAT] STARTING NSFW CHECK');
      console.log('🛡️ [CHAT] Image URI:', imageResult.uri);
      console.log('🛡️ [CHAT] Image fileName:', imageResult.fileName);
      console.log('==========================================');
      
      // Call external moderation server to check image content
          try {
        const formData = new FormData();
        formData.append('file', {
          uri: imageResult.uri,
          type: 'image/jpeg',
          name: imageResult.fileName,
        } as any);

        console.log("Working...")

        const moderationResponse = await axios.post(`${process.env.EXPO_PUBLIC_API_URL_CONTENT_MOD}/v1/api/check-image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        });

        console.log("moderationResponse------------------------------------------------------")
        console.log(moderationResponse.data)

        const moderationResult = moderationResponse.data;
        console.log('🛡️ Moderation server response:', moderationResult);

        // If result is true, it means sexual content detected
        if (moderationResult.result === true) {
          console.log('🚫 Sexual content detected - blocking upload');
          Alert.alert(
            'Content Warning',
            'This image contains inappropriate content and cannot be sent.',
            [{ text: 'OK' }]
          );
          return; // Exit function completely - block the upload
        }

        console.log('Image approved by moderation server');
      } catch (moderationError) {
        console.error('Moderation server error:', moderationError);
            Alert.alert(
          'Moderation Error',
          'Unable to verify image content. Please try again.',
          [{ text: 'OK' }]
        );
        return; // Exit function - block upload on moderation failure
      }
      
      setIsUploadingImage(true);
      
      // Create temporary message for immediate UI update
      const tempMessage: Message = {
        _id: `temp_image_${Date.now()}`,
        content: imageResult.fileName || "Image",
        messageType: "image",
        sender: {
          _id: user.id,
          username: user.username || "Unknown",
          fullName: user.fullName || user.username || "Unknown",
        },
        chat: id,
        fileUrl: imageResult.uri, // Use local URI temporarily
        fileName: imageResult.fileName,
        fileSize: imageResult.fileSize,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add temp message to UI immediately
      setMessages((prev) => [...prev, tempMessage]);
      scrollToBottom();

      // Upload image
      console.log('📤 Uploading image to server...');
      
      try {
        const response = await chatApi.uploadImage(id, imageResult.uri, imageResult.fileName);
        
        if (response.success) {
          console.log('Image uploaded successfully');
          // Replace temp message with real message
          setMessages((prev) => 
            prev.map((msg) => 
              msg._id === tempMessage._id ? response.data : msg
            )
          );
        } else {
          console.error('Image upload failed:', response.message);
          Alert.alert('Upload Failed', response.message || 'Failed to upload image');
          // Remove temp message on error
          setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
        }
      } catch (uploadError: any) {
        console.error('API Upload error:', uploadError);
        console.error('Error details:', uploadError.response?.data || uploadError.message);
        Alert.alert('Upload Error', 'Network error while uploading image. Please try again.');
        // Remove temp message on error
        setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
        throw uploadError; // Re-throw to be caught by outer catch
      }

    } catch (error: any) {
      console.error('Image upload process error:', error);
      
      // Check if error occurred before upload (e.g., during NSFW check)
      if (!isUploadingImage) {
        console.log('Error occurred before upload started');
        Alert.alert('Image Processing Error', 'Failed to process image. Please try again.');
      } else {
        console.log('Error occurred during upload');
        Alert.alert('Upload Error', 'Failed to upload image. Please check your connection and try again.');
      }
      
      // Remove temp message on error if it exists
      setMessages((prev) => prev.filter((msg) => !msg._id.startsWith('temp_image_')));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleBackPress = () => {
    if (isTyping) {
      socketService.stopTyping(id!);
    }
    router.back();
  };

  const handleDeleteMessage = async (messageId: string) => {
    console.log('handleDeleteMessage called with messageId:', messageId);
    try {
      console.log('Calling chatApi.deleteMessage...');
      const response = await chatApi.deleteMessage(messageId);
      console.log('Delete message response:', response);
      
      if (response.success) {
        console.log('Message deleted successfully, updating local state');
        // Remove message from local state
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      } else {
        console.error('Delete failed:', response.message);
        Alert.alert("Error", response.message || "Failed to delete message");
      }
    } catch (error: any) {
      console.error("Delete message error:", error);
      console.error("Error details:", error.response?.data);
      Alert.alert("Error", "Failed to delete message");
    }
  };

  const handleDeleteChat = async () => {
    if (!id) return;
    
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await chatApi.deleteChat(id);
              if (response.success) {
                Alert.alert("Success", "Chat deleted successfully", [
                  {
                    text: "OK",
                    onPress: () => router.back(),
                  },
                ]);
              } else {
                Alert.alert("Error", response.message || "Failed to delete chat");
              }
            } catch (error: any) {
              console.error("Delete chat error:", error);
              Alert.alert("Error", "Failed to delete chat");
            }
          },
        },
      ]
    );
  };

  const handleMessageLongPress = (message: Message) => {
    console.log('Long press detected on message:', message._id);
    console.log('Current user ID:', user?.id);
    console.log('Message sender ID:', message.sender._id);
    
    const isUserMessage = message.sender._id === user?.id;
    console.log('Is user message:', isUserMessage);
    
    const options = [];
    
    if (isUserMessage) {
      options.push("Delete Message");
      console.log('Delete option added');
    } else {
      console.log('Not user message, no delete option');
    }
    options.push("Cancel");
    
    console.log('Options array:', options);
    
    if (Platform.OS === "ios") {
      console.log('Showing iOS Action Sheet');
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: isUserMessage ? 0 : -1,
          cancelButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          console.log('iOS Action Sheet button pressed:', buttonIndex);
          if (buttonIndex === 0 && isUserMessage) {
            console.log('Delete option selected');
            Alert.alert(
              "Delete Message",
              "Are you sure you want to delete this message?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    console.log('Delete confirmed, calling handleDeleteMessage');
                    handleDeleteMessage(message._id);
                  },
                },
              ]
            );
          }
        }
      );
    } else {
      console.log('Showing Android Alert');
      // Android
      if (isUserMessage) {
        Alert.alert(
          "Message Options",
          "What would you like to do?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete Message",
              style: "destructive",
              onPress: () => {
                console.log('🤖 Android delete option selected');
                Alert.alert(
                  "Delete Message",
                  "Are you sure you want to delete this message?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => {
                        console.log('Android delete confirmed, calling handleDeleteMessage');
                        handleDeleteMessage(message._id);
                      },
                    },
                  ]
                );
              },
            },
          ]
        );
      }
    }
  };
  console.log("chat");
  console.log(chat);
  console.log("user");
  console.log(user?.id);

  // Safely find the other participant
  const otherParticipant = chat?.participants?.find(
    (participant) => participant?.user?._id !== user?.id
  );
  console.log("anotherUser");
  console.log(otherParticipant);
  const getChatName = (): string => {
    try {
      console.log("🏷️ getChatName called with:", {
        chat: !!chat,
        user: !!user,
        userId: user?.id,
        dataReady,
        chatType: chat?.chatType,
        participantsCount: chat?.participants?.length
      });
      
      // Extra safety check
      if (!chat || !user || !user.id || !dataReady) {
        console.log("🏷️ Data not ready, returning fallback");
        return "Loading...";
      }

      if (chat.chatType === "direct") {
        // Find the other participant (not the current user)
        const otherParticipant = chat.participants?.find(
          (p) => p?.user?._id !== user.id
        );

        console.log("🏷️ Other participant:", {
          found: !!otherParticipant,
          userId: otherParticipant?.user?._id,
          username: otherParticipant?.user?.username,
          fullName: otherParticipant?.user?.fullName
        });

        // Safely access nested properties with multiple fallbacks
        const displayName = otherParticipant?.user?.fullName || 
                           otherParticipant?.user?.username || 
                           "Unknown User";

        console.log("🏷️ Final displayName:", displayName);
        return displayName;
      }

      return chat.name || "Group Chat";
    } catch (error) {
      console.error("🏷️ Error in getChatName:", error);
      return "Chat";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!id) {
    return null;
  }

  // Add safety check for user
  if (!user || !user.id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading user data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
        {/* Show loading screen until all data is ready */}
        {isLoading || !dataReady || !chat || !user || !user.id ? (
          <View style={styles.fullScreenLoading}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingTitle}>Loading Chat...</Text>
            <Text style={styles.loadingSubtitle}>
              {!user ? "Loading user data..." : 
               !chat ? "Loading chat details..." : 
               !dataReady ? "Preparing interface..." :
               "Almost ready..."}
            </Text>
          </View>
        ) : (
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {getChatName().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.chatInfo}>
                  <Text style={styles.chatName}>{getChatName()}</Text>
                  <Text style={styles.chatStatus}>
                    {typingUsers.length > 0 ? "typing..." : "online"}
                  </Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity style={styles.headerIcon}>
                  <Ionicons name="videocam" size={22} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerIcon}>
                  <Ionicons name="call" size={22} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => {
              Alert.alert(
                "Chat Options",
                "What would you like to do?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete Chat",
                    style: "destructive",
                    onPress: handleDeleteChat,
                  },
                ]
              );
            }}
          >
            <Ionicons name="ellipsis-vertical" size={22} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubText}>Start the conversation!</Text>
            </View>
          ) : (
            messages
              .filter((message) => {
                // Filter out any invalid messages before rendering
                if (!message || typeof message !== 'object') {
                  console.warn('Invalid message object:', message);
                  return false;
                }
                if (!message._id) {
                  console.warn('Message missing _id:', message);
                  return false;
                }
                if (!message.sender || typeof message.sender !== 'object') {
                  console.warn('Message missing sender or invalid sender:', message);
                  return false;
                }
                if (!message.sender._id) {
                  console.warn('Message sender missing _id:', message);
                  return false;
                }
                return true;
              })
              .map((message) => {
              // Additional safety check
              if (!message || !message.sender) {
                console.warn('Invalid message found after filtering:', message);
                return null;
              }

              try {
                // Option 1: Use the stored userId directly (preferred)
                const isUser = message.sender._id === user?.id;

              return (
                <View
                  key={message._id}
                  style={[
                    styles.messageContainer,
                    isUser ? styles.userMessage : styles.otherMessage,
                  ]}
                >
                  <TouchableOpacity
                    onLongPress={() => {
                      console.log('TouchableOpacity onLongPress triggered for message:', message._id);
                      handleMessageLongPress(message);
                    }}
                    delayLongPress={500}
                    activeOpacity={0.7}
                    style={[
                      styles.messageBubble,
                      isUser ? styles.userBubble : styles.otherBubble,
                    ]}
                  >
                    {!isUser && chat?.chatType === "group" && (
                      <Text style={styles.senderName}>
                        {message.sender?.fullName || message.sender?.username || "Unknown"}
                      </Text>
                    )}
                    
                    {/* Render content based on message type */}
                    {message.messageType === 'image' ? (
                      <View style={styles.imageMessage}>
                        <Image
                          source={{ 
                            uri: message.fileUrl?.startsWith('http') 
                              ? message.fileUrl 
                              : message.fileUrl?.startsWith('/uploads')
                              ? `${process.env.EXPO_PUBLIC_API_URL}${message.fileUrl}`
                              : message.fileUrl
                          }}
                          style={styles.messageImage}
                          contentFit="cover"
                          placeholder="📷"
                        />
                        {message.fileName && (
                          <Text
                            style={[
                              styles.imageFileName,
                              isUser
                                ? styles.userMessageText
                                : styles.otherMessageText,
                            ]}
                          >
                            {/* {message.fileName} */}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <Text
                        style={[
                          styles.messageText,
                          isUser
                            ? styles.userMessageText
                            : styles.otherMessageText,
                        ]}
                      >
                        {message.content}
                      </Text>
                    )}
                    
                    <Text
                      style={[
                        styles.messageTime,
                        isUser
                          ? styles.userMessageTime
                          : styles.otherMessageTime,
                      ]}
                    >
                      {formatTimestamp(message.createdAt)}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
              } catch (renderError) {
                console.error('Error rendering message:', renderError, 'Message:', message);
                // Return a safe fallback for this message
                return (
                  <View key={message._id || `error-${Date.now()}`} style={styles.messageContainer}>
                    <Text style={styles.errorText}>Error loading message</Text>
                  </View>
                );
              }
            })
          )}
        </ScrollView>

        {/* Input */}
        <View
          style={[
            styles.inputContainer,
            keyboardHeight > 0 ? { marginBottom: 40 } : { marginBottom: 0 },
          ]}
        >
          <TouchableOpacity
            style={styles.imageButton}
            onPress={handleImageUpload}
            disabled={isUploadingImage}
          >
            {isUploadingImage ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="image" size={24} color="#007AFF" />
            )}
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={handleInputChange}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              newMessage.trim() && styles.sendButtonActive,
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons name="send" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
            </>
        )}
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  backButton: { padding: 5, marginRight: 10 },
  avatarContainer: { marginRight: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 16, fontWeight: "600", color: "#000" },
  chatStatus: { fontSize: 12, color: "#8E8E93", marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center" },
  headerIcon: { padding: 8, marginLeft: 5 },
  messagesContainer: { flex: 1, paddingHorizontal: 15, paddingVertical: 10 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  loadingText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
  messageContainer: { marginBottom: 12 },
  userMessage: { alignItems: "flex-end" },
  otherMessage: { alignItems: "flex-start" },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    elevation: 1,
  },
  userBubble: { backgroundColor: "#007AFF", borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: "#fff", borderBottomLeftRadius: 4 },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 4,
  },
  messageText: { fontSize: 16, lineHeight: 20 },
  userMessageText: { color: "#fff" },
  otherMessageText: { color: "#000" },
  messageTime: { fontSize: 11, marginTop: 4, alignSelf: "flex-end" },
  userMessageTime: { color: "rgba(255, 255, 255, 0.7)" },
  otherMessageTime: { color: "#8E8E93" },
  inputContainer: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: "#F8F8F8",
    marginHorizontal: 8,
  },
  imageButton: {
    backgroundColor: "#F8F8F8",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  sendButton: {
    backgroundColor: "#8E8E93",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonActive: { backgroundColor: "#007AFF" },
  imageMessage: {
    width : 250,
    borderRadius: 12,
    overflow: 'hidden',
    maxWidth: 250,
    maxHeight: 250,
  },
  messageImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  imageFileName: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#ff0000',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 8,
  },
  fullScreenLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

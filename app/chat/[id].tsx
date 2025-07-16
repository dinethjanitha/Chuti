import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  MoveVertical as MoreVertical,
  Phone,
  Send,
  Video,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
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
} from "react-native";

interface Message {
  id: number;
  text: string;
  sender: "user" | "other";
  timestamp: string;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const [newMessage, setNewMessage] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", (e) => {
      // setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates?.height || 0);
      scrollToBottom();
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      // setKeyboardVisible(false);
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

  const chatData = {
    1: { name: "John Doe", status: "online" },
    2: { name: "Sarah Wilson", status: "last seen 5 minutes ago" },
    // ...
  };

  const currentChat = chatData[id as unknown as keyof typeof chatData] || {
    name: "Unknown",
    status: "offline",
  };

  const messages: Message[] = [
    {
      id: 1,
      text: "Hey there! How are you?",
      sender: "other",
      timestamp: "10:25 AM",
    },
    {
      id: 2,
      text: "I'm doing great, thanks! You?",
      sender: "user",
      timestamp: "10:26 AM",
    },
    {
      id: 3,
      text: "Working on a project.",
      sender: "other",
      timestamp: "10:27 AM",
    },
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log("Sending message:", newMessage);
      setNewMessage("");
      Keyboard.dismiss();
      scrollToBottom();
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <ArrowLeft size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {currentChat.name.charAt(0)}
              </Text>
            </View>
          </View>
          <View style={styles.chatInfo}>
            <Text style={styles.chatName}>{currentChat.name}</Text>
            <Text style={styles.chatStatus}>{currentChat.status}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Video size={22} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Phone size={22} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <MoreVertical size={22} color="#007AFF" />
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
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.sender === "user"
                  ? styles.userMessage
                  : styles.otherMessage,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.sender === "user"
                    ? styles.userBubble
                    : styles.otherBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.sender === "user"
                      ? styles.userMessageText
                      : styles.otherMessageText,
                  ]}
                >
                  {message.text}
                </Text>
                <Text
                  style={[
                    styles.messageText,
                    message.sender === "user"
                      ? styles.userMessageText
                      : styles.otherMessageText,
                  ]}
                >
                  {keyboardHeight}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    message.sender === "user"
                      ? styles.userMessageTime
                      : styles.otherMessageTime,
                  ]}
                >
                  {message.timestamp}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input */}
        <View
          style={[
            styles.inputContainer,
          , keyboardHeight > 0 ? { marginBottom : 40 } : {marginBottom : 0}]}
        >
          <TextInput
            style={[styles.textInput]}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
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
            <Send size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
});

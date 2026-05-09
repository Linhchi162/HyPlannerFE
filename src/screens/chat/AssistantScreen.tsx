import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Send } from "lucide-react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAppSelector } from "../../store/hooks";
import { selectCurrentUser } from "../../store/authSlice";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import { RootStackParamList } from "../../navigation/types";
import {
  askGeminiAssistant,
  AssistantMessage,
  AssistantChatMessage,
  loadAssistantChatHistory,
  saveAssistantChatHistory,
} from "../../service/assistantService";

type MessageItem = AssistantChatMessage;

const INITIAL_MESSAGE: MessageItem = {
  id: "assistant-welcome",
  role: "assistant",
  content:
    "Xin chào, mình là trợ lý HyPlanner. Bạn có thể hỏi về timeline cưới, ngân sách, khách mời và ý tưởng tổ chức.",
};

const BOLD_SEGMENT_REGEX = /\*\*(.+?)\*\*/g;

export default function AssistantScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const currentUser = useAppSelector(selectCurrentUser);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("light-content");
      StatusBar.setBackgroundColor("#f7577c");
      if (Platform.OS === "android") StatusBar.setTranslucent(false);
      return () => {};
    }, [])
  );

  const userId =
    (currentUser as any)?.id ||
    (currentUser as any)?._id ||
    (currentUser as any)?.uid ||
    null;
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([INITIAL_MESSAGE]);
  const [historyReady, setHistoryReady] = useState(false);
  const listRef = useRef<FlatList<MessageItem>>(null);
  const hasAutoScrolledOnOpenRef = useRef(false);

  const scrollToBottom = (animated: boolean) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated });
      }, 120);
    });
  };

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const renderAssistantMessage = useCallback((content: string) => {
    const lines = (content || "").split("\n");
    return lines.map((line, lineIndex) => {
      const chunks: React.ReactNode[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      const regex = new RegExp(BOLD_SEGMENT_REGEX);
      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          chunks.push(line.slice(lastIndex, match.index));
        }
        chunks.push(
          <Text key={`b-${lineIndex}-${match.index}`} style={styles.assistantBoldText}>
            {match[1]}
          </Text>
        );
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < line.length) {
        chunks.push(line.slice(lastIndex));
      }
      if (chunks.length === 0) {
        chunks.push(line);
      }

      return (
        <React.Fragment key={`line-${lineIndex}`}>
          {chunks}
          {lineIndex < lines.length - 1 ? "\n" : ""}
        </React.Fragment>
      );
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    const hydrateHistory = async () => {
      const history = await loadAssistantChatHistory(userId);
      if (!mounted) return;
      setMessages(history.length > 0 ? history : [INITIAL_MESSAGE]);
      setHistoryReady(true);
    };

    hydrateHistory();

    return () => {
      mounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!historyReady) return;
    saveAssistantChatHistory(messages, userId).catch(() => {});
  }, [messages, userId, historyReady]);

  useEffect(() => {
    if (!historyReady || hasAutoScrolledOnOpenRef.current) return;
    hasAutoScrolledOnOpenRef.current = true;
    scrollToBottom(false);
  }, [historyReady]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const history: AssistantMessage[] = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const answer = await askGeminiAssistant(history);
      const assistantMsg: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: answer,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      const fallback: MessageItem = {
        id: `assistant-error-${Date.now()}`,
        role: "assistant",
        content:
          error?.message ||
          "Không thể lấy phản hồi từ trợ lý ngay lúc này. Vui lòng thử lại.",
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Trợ lý AI</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContent}
          onLayout={() => {
            if (historyReady) scrollToBottom(false);
          }}
          onContentSizeChange={() => {
            if (historyReady) scrollToBottom(true);
          }}
          renderItem={({ item }) => {
            const fromUser = item.role === "user";
            return (
              <View
                style={[
                  styles.bubble,
                  fromUser ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    fromUser ? styles.userBubbleText : styles.assistantBubbleText,
                  ]}
                >
                  {fromUser ? item.content : renderAssistantMessage(item.content)}
                </Text>
              </View>
            );
          }}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Hỏi trợ lý về kế hoạch cưới..."
            placeholderTextColor="#9ca3af"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            disabled={!canSend}
            onPress={handleSend}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Send size={18} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7577c",
  },
  header: {
    backgroundColor: "#f7577c",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Roboto",
    fontWeight: "400",
    fontSize: responsiveFont(18),
    fontWeight: "700",
    color: "#ffffff",
  },
  body: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  messagesContent: {
    padding: responsiveWidth(16),
    paddingBottom: responsiveHeight(20),
    gap: responsiveHeight(10),
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: responsiveWidth(12),
    paddingHorizontal: responsiveWidth(12),
    paddingVertical: responsiveHeight(9),
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#f7577c",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  bubbleText: {
    fontSize: responsiveFont(12),
    lineHeight: responsiveHeight(18),
  },
  userBubbleText: {
    color: "#ffffff",
  },
  assistantBubbleText: {
    color: "#111827",
  },
  assistantBoldText: {
    fontFamily: "Montserrat-SemiBold",
    color: "#111827",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(10),
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: "#ffffff",
  },
  input: {
    flex: 1,
    minHeight: responsiveHeight(42),
    maxHeight: responsiveHeight(120),
    backgroundColor: "#f9fafb",
    borderRadius: responsiveWidth(16),
    paddingHorizontal: responsiveWidth(12),
    paddingTop: responsiveHeight(10),
    paddingBottom: responsiveHeight(10),
    fontSize: responsiveFont(12),
    color: "#111827",
  },
  sendBtn: {
    marginLeft: responsiveWidth(10),
    backgroundColor: "#f7577c",
    width: responsiveWidth(40),
    height: responsiveWidth(40),
    borderRadius: responsiveWidth(20),
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import {
  fetchAssistantInsights,
  sendAssistantChat,
  type AssistantInsights,
  type AssistantMessage,
} from '@/lib/api';
import { Badge, Button, Card, Muted, ScreenHeader, SectionTitle } from '@/ui/components';
import { palette, radius, space } from '@/ui/theme';

function priorityTone(priority?: string): { color: string; soft: string } {
  if (priority === 'yüksek' || priority === 'high')
    return { color: palette.danger, soft: palette.dangerSoft };
  if (priority === 'düşük' || priority === 'low')
    return { color: palette.success, soft: palette.successSoft };
  return { color: palette.amber, soft: palette.amberSoft };
}

export default function AssistantScreen() {
  const { data } = useAuth();
  const [insights, setInsights] = useState<AssistantInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  function buildContext(): Record<string, unknown> {
    return {
      score: data.score.total_score ?? 0,
      breakdown: data.score.breakdown,
      onboarding: {
        region: data.onboarding.region,
        family_size: data.onboarding.familySize,
        has_children: data.onboarding.hasChildren,
        has_elderly: data.onboarding.hasElderly,
      },
      bag: {
        checked: data.bagItems.filter((item) => item.checked).length,
        total: data.bagItems.length,
        missing: data.bagItems
          .filter((item) => !item.checked)
          .map((item) => item.label)
          .slice(0, 10),
      },
      tasks: data.tasks.map((task) => ({ title: task.title, status: task.status })).slice(0, 15),
      family_members: data.familyMembers.length,
    };
  }

  async function onGeneratePlan() {
    setInsightsLoading(true);
    try {
      setInsights(await fetchAssistantInsights(buildContext()));
    } catch (error) {
      Alert.alert('Plan oluşturulamadı', (error as Error).message);
    } finally {
      setInsightsLoading(false);
    }
  }

  async function onSend() {
    const content = input.trim();
    if (!content || chatLoading) return;
    const nextMessages: AssistantMessage[] = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setInput('');
    setChatLoading(true);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    try {
      const reply = await sendAssistantChat(nextMessages.slice(-8), buildContext());
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Yanıt alınamadı: ' + (error as Error).message },
      ]);
    } finally {
      setChatLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            title="Asistan"
            subtitle="Yapay zeka destekli kişisel hazırlık koçun."
          />

          <Animated.View entering={FadeInDown.duration(400)}>
            <Card>
              <SectionTitle>Kişisel hazırlık planın</SectionTitle>
              {insights ? (
                <>
                  <Text style={styles.coaching}>{insights.coaching}</Text>
                  <View style={styles.planList}>
                    {insights.plan.map((item, index) => {
                      const tone = priorityTone(item.priority);
                      return (
                        <View key={index} style={styles.planRow}>
                          <View style={styles.flex}>
                            <Text style={styles.planTitle}>{item.title}</Text>
                            {item.why ? <Muted>{item.why}</Muted> : null}
                          </View>
                          {item.priority ? (
                            <Badge label={item.priority} color={tone.color} soft={tone.soft} />
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : (
                <Muted>
                  Yapay zeka; skorunu, çantanı ve profilini analiz edip sana özel bir plan çıkarır.
                </Muted>
              )}
              <Button
                title={insights ? 'Planı yenile' : 'Planımı oluştur'}
                onPress={onGeneratePlan}
                loading={insightsLoading}
              />
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(80)}>
            <Card>
              <SectionTitle>Soru-cevap</SectionTitle>
              {messages.length === 0 ? (
                <Muted>
                  Deprem hazırlığıyla ilgili her şeyi sorabilirsin. Örn: &quot;Çocuklu bir aile
                  çantaya ekstra ne koymalı?&quot;
                </Muted>
              ) : (
                <View style={styles.chatLog}>
                  {messages.map((message, index) => (
                    <View
                      key={index}
                      style={[
                        styles.bubble,
                        message.role === 'user' ? styles.bubbleUser : styles.bubbleAi,
                      ]}
                    >
                      <Text
                        style={message.role === 'user' ? styles.bubbleUserText : styles.bubbleAiText}
                      >
                        {message.content}
                      </Text>
                    </View>
                  ))}
                  {chatLoading ? (
                    <View style={[styles.bubble, styles.bubbleAi]}>
                      <Text style={styles.typing}>Asistan düşünüyor...</Text>
                    </View>
                  ) : null}
                </View>
              )}
              <View style={styles.inputRow}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Sorunu yaz..."
                  placeholderTextColor={palette.muted}
                  style={styles.input}
                  maxLength={500}
                  onSubmitEditing={onSend}
                  returnKeyType="send"
                />
                <Pressable
                  onPress={onSend}
                  disabled={chatLoading || !input.trim()}
                  style={({ pressed }) => [
                    styles.sendButton,
                    (pressed || chatLoading || !input.trim()) && styles.sendButtonDim,
                  ]}
                >
                  <Ionicons name="send" size={19} color="#fff" />
                </Pressable>
              </View>
              <Muted>Yanıtlar yapay zekadır; resmi bilgi için AFAD&apos;ı esas alın.</Muted>
            </Card>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  flex: { flex: 1 },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl },
  coaching: { color: palette.text, fontSize: 14.5, lineHeight: 21 },
  planList: { gap: space.sm },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  planTitle: { color: palette.text, fontSize: 14.5, fontWeight: '600' },
  chatLog: { gap: space.sm },
  bubble: {
    maxWidth: '88%',
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: radius.md,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: palette.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    borderBottomLeftRadius: 4,
  },
  bubbleUserText: { color: '#fff', fontSize: 14.5, lineHeight: 20 },
  bubbleAiText: { color: palette.text, fontSize: 14.5, lineHeight: 20 },
  typing: { color: palette.muted, fontStyle: 'italic', fontSize: 13.5 },
  inputRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.inputBg,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 11,
    fontSize: 15,
    color: palette.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDim: { opacity: 0.5 },
});

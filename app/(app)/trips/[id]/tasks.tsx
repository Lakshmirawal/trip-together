import { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  SafeAreaView, Modal, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTripStore } from '../../../../stores/tripStore';
import { useAuthStore } from '../../../../stores/authStore';
import { generateTaskNudgeLink, openWhatsApp } from '../../../../lib/whatsapp';

const P = '#0D2B1F';
const GOLD = '#E8A020';

function getDueStatus(due: string | null): { label: string; color: string; bg: string } | null {
  if (!due) return null;
  const diff = Math.ceil((new Date(due + 'T00:00:00').getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: 'Overdue', color: '#DC2626', bg: '#FEF2F2' };
  if (diff === 0) return { label: 'Due today', color: '#C2410C', bg: '#FFF7ED' };
  if (diff <= 3) return { label: `${diff}d left`, color: '#C2410C', bg: '#FFF7ED' };
  return { label: new Date(due + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), color: '#64748B', bg: '#F4F3EF' };
}

function parsePoll(description: string | null): string[] | null {
  if (!description) return null;
  try {
    const parsed = JSON.parse(description);
    if (parsed.__poll__ && Array.isArray(parsed.options)) return parsed.options;
  } catch {}
  return null;
}

export default function TasksScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tasks, members, currentTrip, addTask, updateTask, fetchTripDetails } = useTripStore();
  const { user } = useAuthStore();

  useEffect(() => { if (id) fetchTripDetails(id); }, [id]);

  const [modalVisible, setModalVisible] = useState(false);
  const [taskType, setTaskType] = useState<'task' | 'poll'>('task');
  const [newTitle, setNewTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [submitting, setSubmitting] = useState(false);

  const openTasks = tasks.filter((t) => t.status !== 'done');
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const today = new Date().toISOString().split('T')[0];

  const resetForm = () => {
    setNewTitle(''); setTitleError(''); setNewDesc('');
    setAssignedTo(''); setDueDate('');
    setPollOptions(['', '']); setTaskType('task');
  };

  const handleCreate = async () => {
    setTitleError('');
    if (!newTitle.trim()) { setTitleError('Title is required.'); return; }

    if (taskType === 'poll') {
      const filledOptions = pollOptions.map(o => o.trim()).filter(Boolean);
      if (filledOptions.length < 2) { setTitleError('Add at least 2 poll options.'); return; }
      setSubmitting(true);
      await addTask({
        trip_id: id,
        title: newTitle.trim(),
        description: JSON.stringify({ __poll__: true, options: filledOptions }),
        assigned_to_member_id: null,
        assigned_to_name: null,
        due_date: dueDate || null,
        status: 'open',
      });
    } else {
      const member = members.find((m) => m.id === assignedTo);
      setSubmitting(true);
      await addTask({
        trip_id: id,
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        assigned_to_member_id: assignedTo && assignedTo !== 'AI' ? assignedTo : null,
        assigned_to_name: member?.name || (assignedTo === 'AI' ? 'AI' : null),
        due_date: dueDate || null,
        status: 'open',
      });
    }
    setSubmitting(false);
    setModalVisible(false);
    resetForm();
  };

  const handleNudge = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !currentTrip) return;
    openWhatsApp(generateTaskNudgeLink(currentTrip.name, task.title, id));
  };

  const updatePollOption = (index: number, value: string) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F3EF' }}>
      {/* Header */}
      <View style={{ backgroundColor: P, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16 }}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Tasks & Polls</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{openTasks.length} open · {doneTasks.length} done</Text>
          </View>
        </View>
        <TouchableOpacity
          style={{ backgroundColor: GOLD, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: P, fontWeight: '800', fontSize: 13 }}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {openTasks.length > 0 && (
          <>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
              Open ({openTasks.length})
            </Text>
            {openTasks.map((task) => {
              const due = getDueStatus(task.due_date);
              const isOverdue = due?.label === 'Overdue';
              const pollOptions = parsePoll(task.description);
              const isPoll = !!pollOptions;

              return (
                <View key={task.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, borderLeftWidth: isOverdue ? 3 : 0, borderLeftColor: '#DC2626' }}>
                  {isPoll ? (
                    /* Poll card */
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <View style={{ backgroundColor: `${P}15`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                          <Text style={{ fontSize: 10, color: P, fontWeight: '700' }}>📊 POLL</Text>
                        </View>
                        <Text style={{ fontWeight: '700', color: '#1F2937', fontSize: 14, flex: 1 }}>{task.title}</Text>
                        <TouchableOpacity
                          onPress={() => updateTask(task.id, { status: 'done' })}
                          style={{ backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}
                        >
                          <Text style={{ fontSize: 11, color: '#15803D', fontWeight: '600' }}>Close</Text>
                        </TouchableOpacity>
                      </View>
                      {pollOptions.map((opt, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E8E6E0' }}>
                          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: P, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                            <Text style={{ color: GOLD, fontSize: 11, fontWeight: '800' }}>{String.fromCharCode(65 + i)}</Text>
                          </View>
                          <Text style={{ flex: 1, fontSize: 13, color: '#1F2937', fontWeight: '500' }}>{opt}</Text>
                        </View>
                      ))}
                      {due && (
                        <View style={{ flexDirection: 'row', marginTop: 4 }}>
                          <View style={{ backgroundColor: due.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                            <Text style={{ fontSize: 11, color: due.color, fontWeight: '600' }}>📅 {due.label}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  ) : (
                    /* Regular task card */
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      <TouchableOpacity
                        onPress={() => updateTask(task.id, { status: 'done' })}
                        style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', marginTop: 1 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '600', color: '#1F2937', fontSize: 14, marginBottom: 4 }}>{task.title}</Text>
                        {task.description ? <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>{task.description}</Text> : null}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                          {task.assigned_to_name && (
                            <View style={{ backgroundColor: '#EFF6FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                              <Text style={{ fontSize: 11, color: '#1D4ED8', fontWeight: '600' }}>👤 {task.assigned_to_name}</Text>
                            </View>
                          )}
                          {due && (
                            <View style={{ backgroundColor: due.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                              <Text style={{ fontSize: 11, color: due.color, fontWeight: '700' }}>
                                {isOverdue ? '⚠️ ' : '📅 '}{due.label}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleNudge(task.id)}
                        style={{ backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
                      >
                        <Text style={{ fontSize: 11, color: '#15803D', fontWeight: '600' }}>Nudge</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {doneTasks.length > 0 && (
          <>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, marginTop: 16 }}>
              Done ({doneTasks.length})
            </Text>
            {doneTasks.map((task) => (
              <View key={task.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, opacity: 0.6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, color: '#64748B', textDecorationLine: 'line-through' }}>{task.title}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {tasks.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 52, marginBottom: 16 }}>✅</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: P, marginBottom: 8 }}>No tasks yet</Text>
            <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center' }}>
              Create tasks, assign to members, or run a group poll
            </Text>
          </View>
        )}
      </ScrollView>

      {/* New Task / Poll Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F3EF' }}>

          {/* Modal Header */}
          <View style={{ backgroundColor: P, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '800', fontSize: 17, color: '#fff' }}>
              {taskType === 'poll' ? '📊 New Poll' : '✅ New Task'}
            </Text>
            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 18, lineHeight: 22 }}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

            {/* Type toggle */}
            <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 4, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
              {(['task', 'poll'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => { setTaskType(type); setTitleError(''); }}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: taskType === type ? P : 'transparent' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: taskType === type ? '#fff' : '#64748B' }}>
                    {type === 'task' ? '✅ Task' : '📊 Poll'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>
              {taskType === 'poll' ? 'Poll question' : 'Task title'} <Text style={{ color: '#DC2626' }}>*</Text>
            </Text>
            <TextInput
              style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: titleError ? '#DC2626' : '#E8E6E0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1F2937', marginBottom: 4, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 }}
              placeholder={taskType === 'poll' ? 'e.g. Which hotel should we book?' : 'e.g. Book train tickets'}
              value={newTitle}
              onChangeText={(t) => { setNewTitle(t); setTitleError(''); }}
            />
            {titleError ? <Text style={{ color: '#DC2626', fontSize: 11, marginBottom: 12 }}>{titleError}</Text> : <View style={{ marginBottom: 16 }} />}

            {taskType === 'poll' ? (
              /* Poll options */
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 }}>Options</Text>
                {pollOptions.map((opt, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: P, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: GOLD, fontSize: 12, fontWeight: '800' }}>{String.fromCharCode(65 + i)}</Text>
                    </View>
                    <TextInput
                      style={{ flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8E6E0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#1F2937' }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      value={opt}
                      onChangeText={(t) => updatePollOption(i, t)}
                    />
                    {pollOptions.length > 2 && (
                      <TouchableOpacity onPress={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}>
                        <Text style={{ color: '#DC2626', fontSize: 20, lineHeight: 24 }}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {pollOptions.length < 5 && (
                  <TouchableOpacity
                    onPress={() => setPollOptions([...pollOptions, ''])}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: `${P}40`, marginTop: 4 }}
                  >
                    <Text style={{ color: P, fontSize: 13, fontWeight: '600' }}>+ Add option {String.fromCharCode(65 + pollOptions.length)}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              /* Task fields */
              <>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Assign to</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[{ id: 'AI', name: '✦ AI' }, ...members].map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => setAssignedTo(assignedTo === m.id ? '' : m.id)}
                        style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, backgroundColor: assignedTo === m.id ? P : '#fff', borderColor: assignedTo === m.id ? P : '#E8E6E0' }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: assignedTo === m.id ? '#fff' : '#374151' }}>{m.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Notes (optional)</Text>
                <TextInput
                  style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8E6E0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1F2937', marginBottom: 16, minHeight: 80, textAlignVertical: 'top' }}
                  placeholder="Any extra details..."
                  value={newDesc}
                  onChangeText={setNewDesc}
                  multiline
                  numberOfLines={3}
                />
              </>
            )}

            {/* Due date — shown for both */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Deadline (optional)</Text>
            {Platform.OS === 'web' ? (
              <View style={{ marginBottom: 24 }}>
                <input
                  type="date"
                  value={dueDate}
                  min={today}
                  onChange={(e: any) => setDueDate(e.target.value)}
                  style={{ width: '100%', border: '1px solid #E8E6E0', borderRadius: 12, padding: '11px 14px', fontSize: 14, color: dueDate ? '#1F2937' : '#94A3B8', fontFamily: 'system-ui', outline: 'none', cursor: 'pointer', backgroundColor: '#fff' } as any}
                />
              </View>
            ) : (
              <TextInput
                style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8E6E0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1F2937', marginBottom: 24 }}
                placeholder="YYYY-MM-DD"
                value={dueDate}
                onChangeText={setDueDate}
              />
            )}

            <TouchableOpacity
              style={{ backgroundColor: submitting ? '#9CA3AF' : GOLD, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              onPress={handleCreate}
              disabled={submitting}
            >
              {submitting && <ActivityIndicator color={P} size="small" />}
              <Text style={{ color: P, fontWeight: '800', fontSize: 15 }}>
                {submitting ? 'Creating...' : taskType === 'poll' ? 'Create Poll' : 'Create Task'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

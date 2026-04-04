import { useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  SafeAreaView, Modal, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTripStore } from '../../../../stores/tripStore';
import { useAuthStore } from '../../../../stores/authStore';
import { generateTaskNudgeLink, openWhatsApp } from '../../../../lib/whatsapp';

const P = '#0D2B1F';
const GOLD = '#E8A020';

const STATUS_COLORS = {
  open: { bg: '#FFF7ED', text: '#C2410C' },
  in_progress: { bg: '#EFF6FF', text: '#1D4ED8' },
  done: { bg: '#F0FDF4', text: '#15803D' },
};

export default function TasksScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tasks, members, currentTrip, addTask, updateTask } = useTripStore();
  const { user } = useAuthStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');

  const openTasks = tasks.filter((t) => t.status !== 'done');
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const today = new Date().toISOString().split('T')[0];

  const resetForm = () => {
    setNewTitle(''); setTitleError(''); setNewDesc('');
    setAssignedTo(''); setDueDate('');
  };

  const handleCreate = async () => {
    setTitleError('');
    if (!newTitle.trim()) { setTitleError('Task title is required.'); return; }
    const member = members.find((m) => m.id === assignedTo);
    await addTask({
      trip_id: id,
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      assigned_to_member_id: assignedTo && assignedTo !== 'AI' ? assignedTo : null,
      assigned_to_name: member?.name || (assignedTo === 'AI' ? 'AI' : null),
      due_date: dueDate || null,
      status: 'open',
    });
    setModalVisible(false);
    resetForm();
  };

  const handleNudge = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !currentTrip) return;
    openWhatsApp(generateTaskNudgeLink(currentTrip.name, task.title, id));
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
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Tasks</Text>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {openTasks.length > 0 && (
          <>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
              Open ({openTasks.length})
            </Text>
            {openTasks.map((task) => (
              <View key={task.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => updateTask(task.id, { status: 'done' })}
                    style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', marginTop: 1 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', color: '#1F2937', fontSize: 14, marginBottom: 2 }}>{task.title}</Text>
                    {task.description ? <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>{task.description}</Text> : null}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {task.assigned_to_name && (
                        <View style={{ backgroundColor: '#EFF6FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                          <Text style={{ fontSize: 11, color: '#1D4ED8', fontWeight: '600' }}>→ {task.assigned_to_name}</Text>
                        </View>
                      )}
                      {task.due_date && (
                        <View style={{ backgroundColor: '#FFF7ED', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                          <Text style={{ fontSize: 11, color: '#C2410C', fontWeight: '600' }}>
                            📅 {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
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
              </View>
            ))}
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
              Create tasks and assign them to group members
            </Text>
          </View>
        )}
      </ScrollView>

      {/* New Task Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F4F3EF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '800', fontSize: 18, color: P }}>New Task</Text>
            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
              <Text style={{ color: '#64748B', fontSize: 24, lineHeight: 28 }}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>
              Title <Text style={{ color: '#DC2626' }}>*</Text>
            </Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: titleError ? '#DC2626' : '#E8E6E0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1F2937', marginBottom: 4 }}
              placeholder="e.g. Book hotel by Friday"
              value={newTitle}
              onChangeText={(t) => { setNewTitle(t); setTitleError(''); }}
            />
            {titleError ? <Text style={{ color: '#DC2626', fontSize: 11, marginBottom: 12 }}>{titleError}</Text> : <View style={{ marginBottom: 16 }} />}

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Assign to</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[{ id: 'AI', name: '✦ AI' }, ...members].map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => setAssignedTo(assignedTo === m.id ? '' : m.id)}
                    style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, backgroundColor: assignedTo === m.id ? P : '#fff', borderColor: assignedTo === m.id ? P : '#E8E6E0' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: assignedTo === m.id ? '#fff' : '#374151' }}>{m.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Due date (optional)</Text>
            {Platform.OS === 'web' ? (
              <View style={{ marginBottom: 16 }}>
                <input
                  type="date"
                  value={dueDate}
                  min={today}
                  onChange={(e: any) => setDueDate(e.target.value)}
                  style={{ width: '100%', border: '1px solid #E8E6E0', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: dueDate ? '#1F2937' : '#94A3B8', fontFamily: 'system-ui', outline: 'none', cursor: 'pointer', backgroundColor: '#FAFAFA' } as any}
                />
              </View>
            ) : (
              <TextInput
                style={{ borderWidth: 1, borderColor: '#E8E6E0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1F2937', marginBottom: 16 }}
                placeholder="YYYY-MM-DD"
                value={dueDate}
                onChangeText={setDueDate}
              />
            )}

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Notes (optional)</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E8E6E0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1F2937', marginBottom: 24, minHeight: 80, textAlignVertical: 'top' }}
              placeholder="Any extra details..."
              value={newDesc}
              onChangeText={setNewDesc}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={{ backgroundColor: GOLD, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }}
              onPress={handleCreate}
            >
              <Text style={{ color: P, fontWeight: '800', fontSize: 15 }}>Create Task</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

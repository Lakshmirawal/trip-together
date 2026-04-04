import { View, Text, TouchableOpacity } from 'react-native';
import { Task } from '../lib/supabase';

type Props = {
  task: Task;
  onMarkDone?: () => void;
  onNudge?: () => void;
};

export default function TaskItem({ task, onMarkDone, onNudge }: Props) {
  const isDone = task.status === 'done';

  return (
    <View className={`rounded-xl p-4 mb-2 border ${isDone ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'}`}>
      <View className="flex-row items-start gap-3">
        <Text className="text-lg mt-0.5">{isDone ? '✅' : '○'}</Text>
        <View className="flex-1">
          <Text className={`font-semibold text-sm ${isDone ? 'text-muted line-through' : 'text-gray-900'}`}>
            {task.title}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            {task.assigned_to_name && (
              <Text className="text-xs text-muted">→ {task.assigned_to_name}</Text>
            )}
            {task.due_date && (
              <Text className="text-xs text-muted">
                · Due {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </Text>
            )}
          </View>
        </View>
      </View>

      {!isDone && (
        <View className="flex-row gap-2 mt-3">
          {onNudge && (
            <TouchableOpacity
              onPress={onNudge}
              className="flex-1 border border-[#25D366] rounded-lg py-2 items-center"
            >
              <Text className="text-[#25D366] text-xs font-semibold">Nudge</Text>
            </TouchableOpacity>
          )}
          {onMarkDone && (
            <TouchableOpacity
              onPress={onMarkDone}
              className="flex-1 bg-success/10 rounded-lg py-2 items-center"
            >
              <Text className="text-success text-xs font-semibold">Mark done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

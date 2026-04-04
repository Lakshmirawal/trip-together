import { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, SafeAreaView, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTripStore } from '../../../../stores/tripStore';
import { useAuthStore } from '../../../../stores/authStore';

const P = '#0D2B1F';
const GOLD = '#E8A020';

const CATEGORIES = [
  { key: 'accommodation', label: 'Accommodation', emoji: '🏨', alloc: 0.30 },
  { key: 'food',          label: 'Food',          emoji: '🍽️', alloc: 0.25 },
  { key: 'transport',     label: 'Transport',     emoji: '🚌', alloc: 0.20 },
  { key: 'activities',    label: 'Activities',    emoji: '🎯', alloc: 0.15 },
  { key: 'other',         label: 'Other',         emoji: '📦', alloc: 0.10 },
] as const;

function BudgetBar({ spent, total, danger }: { spent: number; total: number; danger?: boolean }) {
  const pct = total > 0 ? Math.min(spent / total, 1) : 0;
  return (
    <View style={{ height: 6, backgroundColor: '#E8E6E0', borderRadius: 3, overflow: 'hidden' }}>
      <View style={{ height: 6, width: `${pct * 100}%` as any, backgroundColor: danger ? '#DC2626' : pct > 0.85 ? '#F59E0B' : P, borderRadius: 3 }} />
    </View>
  );
}

export default function BudgetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentTrip, expenses, addExpense } = useTripStore();
  const { user } = useAuthStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<typeof CATEGORIES[number]['key']>('other');
  const [amountError, setAmountError] = useState('');
  const [titleError, setTitleError] = useState('');

  const totalBudget = (currentTrip?.budget_max ?? 0) * (currentTrip?.group_size ?? 1);
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = totalBudget - totalSpent;
  const pctSpent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const isOverBudget = remaining < 0;

  const handleAddExpense = async () => {
    setAmountError(''); setTitleError('');
    if (!expTitle.trim()) { setTitleError('Please enter a title.'); return; }
    const amount = parseFloat(expAmount);
    if (!expAmount || isNaN(amount) || amount <= 0) {
      setAmountError('Please enter a valid amount greater than 0.');
      return;
    }
    await addExpense({ trip_id: id, title: expTitle.trim(), amount, category: expCategory, added_by: user?.id ?? null });
    setModalVisible(false);
    setExpTitle(''); setExpAmount(''); setExpCategory('other');
    setAmountError(''); setTitleError('');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F3EF' }}>
      {/* Header */}
      <View style={{ backgroundColor: P, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Budget Tracker</Text>
        </View>
        <TouchableOpacity
          style={{ backgroundColor: GOLD, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: P, fontWeight: '800', fontSize: 13 }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Overage warning */}
      {isOverBudget && (
        <View style={{ backgroundColor: '#FEF2F2', borderBottomWidth: 1, borderBottomColor: '#FCA5A5', paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 16 }}>⚠️</Text>
          <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 13 }}>Over budget by ₹{Math.abs(remaining).toLocaleString('en-IN')} — review expenses</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

        {/* Total budget card */}
        <View style={{ backgroundColor: P, borderRadius: 20, padding: 20, marginBottom: 20 }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 }}>Total trip budget</Text>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 2 }}>
            ₹{totalBudget.toLocaleString('en-IN')}
          </Text>
          {currentTrip && (
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 16 }}>
              ₹{(currentTrip.budget_max ?? 0).toLocaleString('en-IN')} × {currentTrip.group_size} people
            </Text>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Spent</Text>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 20 }}>₹{totalSpent.toLocaleString('en-IN')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Remaining</Text>
              <Text style={{ color: isOverBudget ? '#FCA5A5' : '#4ADE80', fontWeight: '800', fontSize: 20 }}>
                {isOverBudget ? '-' : ''}₹{Math.abs(remaining).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
          {/* Progress bar */}
          <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
            <View style={{ height: 8, width: `${pctSpent}%` as any, backgroundColor: isOverBudget ? '#FCA5A5' : pctSpent > 85 ? GOLD : '#4ADE80', borderRadius: 4 }} />
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{pctSpent.toFixed(0)}% of budget used</Text>
        </View>

        {/* By Category */}
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>By Category</Text>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
          {CATEGORIES.map((cat, idx) => {
            const catSpent = expenses.filter((e) => e.category === cat.key).reduce((s, e) => s + e.amount, 0);
            const catBudget = totalBudget * cat.alloc;
            const catPct = catBudget > 0 ? Math.min((catSpent / catBudget) * 100, 100) : 0;
            const catOver = catSpent > catBudget && catBudget > 0;
            return (
              <View key={cat.key} style={{ marginBottom: idx < CATEGORIES.length - 1 ? 16 : 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, color: '#374151', fontWeight: '500' }}>{cat.emoji} {cat.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {catOver && <Text style={{ fontSize: 10, color: '#DC2626', fontWeight: '700' }}>Over!</Text>}
                    <Text style={{ fontSize: 12, color: '#64748B' }}>
                      ₹{catSpent.toLocaleString('en-IN')} / ₹{Math.round(catBudget).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
                <BudgetBar spent={catSpent} total={catBudget} danger={catOver} />
              </View>
            );
          })}
        </View>

        {/* Recent expenses */}
        {expenses.length > 0 && (
          <>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Recent expenses</Text>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
              {[...expenses].reverse().map((exp, i) => {
                const cat = CATEGORIES.find((c) => c.key === exp.category);
                return (
                  <View key={exp.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: '#F4F3EF' }}>
                    <Text style={{ fontSize: 20, marginRight: 12 }}>{cat?.emoji ?? '📦'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#1F2937' }}>{exp.title}</Text>
                      <Text style={{ fontSize: 11, color: '#64748B', textTransform: 'capitalize' }}>{exp.category}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: P }}>₹{exp.amount.toLocaleString('en-IN')}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {expenses.length === 0 && totalBudget === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>💰</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: P, marginBottom: 8 }}>No budget set yet</Text>
            <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center' }}>Set a budget when creating the trip to track spending</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F4F3EF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '800', fontSize: 18, color: P }}>Add Expense</Text>
            <TouchableOpacity onPress={() => { setModalVisible(false); setAmountError(''); setTitleError(''); }}>
              <Text style={{ color: '#64748B', fontSize: 24, lineHeight: 28 }}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>Title <Text style={{ color: '#DC2626' }}>*</Text></Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: titleError ? '#DC2626' : '#E8E6E0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1F2937', marginBottom: 4 }}
              placeholder="e.g. Hotel deposit"
              value={expTitle}
              onChangeText={(t) => { setExpTitle(t); setTitleError(''); }}
            />
            {titleError ? <Text style={{ color: '#DC2626', fontSize: 11, marginBottom: 12 }}>{titleError}</Text> : <View style={{ marginBottom: 16 }} />}

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>Amount (₹) <Text style={{ color: '#DC2626' }}>*</Text></Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: amountError ? '#DC2626' : '#E8E6E0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1F2937', marginBottom: 4 }}
              placeholder="e.g. 5000"
              value={expAmount}
              onChangeText={(t) => { setExpAmount(t); setAmountError(''); }}
              keyboardType="numeric"
            />
            {amountError ? <Text style={{ color: '#DC2626', fontSize: 11, marginBottom: 12 }}>{amountError}</Text> : <View style={{ marginBottom: 16 }} />}

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 }}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setExpCategory(cat.key)}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, backgroundColor: expCategory === cat.key ? P : '#fff', borderColor: expCategory === cat.key ? P : '#E8E6E0', gap: 4 }}
                >
                  <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: expCategory === cat.key ? '#fff' : '#374151' }}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={{ backgroundColor: GOLD, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }}
              onPress={handleAddExpense}
            >
              <Text style={{ color: P, fontWeight: '800', fontSize: 15 }}>Add Expense</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

import { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, SafeAreaView, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTripStore } from '../../../../stores/tripStore';
import { useAuthStore } from '../../../../stores/authStore';

const P = '#0D2B1F';
const GOLD = '#E8A020';

const CATEGORIES = [
  { key: 'accommodation', label: 'Stay',      emoji: '🏨', alloc: 0.30 },
  { key: 'food',          label: 'Food',       emoji: '🍽️', alloc: 0.25 },
  { key: 'transport',     label: 'Transport',  emoji: '🚌', alloc: 0.20 },
  { key: 'activities',    label: 'Activities', emoji: '🎯', alloc: 0.15 },
  { key: 'other',         label: 'Other',      emoji: '📦', alloc: 0.10 },
] as const;

type Tab = 'overview' | 'expenses' | 'balances';

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
  const { currentTrip, members, expenses, addExpense, fetchTripDetails } = useTripStore();
  const { user } = useAuthStore();

  useEffect(() => { if (id) fetchTripDetails(id); }, [id]);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [modalVisible, setModalVisible] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<typeof CATEGORIES[number]['key']>('other');
  const [paidBy, setPaidBy] = useState('');
  const [amountError, setAmountError] = useState('');
  const [titleError, setTitleError] = useState('');

  const totalBudget = (currentTrip?.budget_max ?? 0) * (currentTrip?.group_size ?? 1);
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = totalBudget - totalSpent;
  const pctSpent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const isOverBudget = remaining < 0;

  // Per-person balance calculation (equal split)
  const groupSize = currentTrip?.group_size ?? 1;
  const sharePerPerson = totalSpent / groupSize;

  // Build balance map from members + expenses
  const memberNames = members.map(m => m.name);
  const paidMap: Record<string, number> = {};
  for (const name of memberNames) paidMap[name] = 0;
  for (const exp of expenses) {
    const name = exp.paid_by_name;
    if (name) paidMap[name] = (paidMap[name] ?? 0) + exp.amount;
  }

  const balances = Object.entries(paidMap).map(([name, paid]) => ({
    name,
    paid,
    share: sharePerPerson,
    net: paid - sharePerPerson, // positive = owed money, negative = owes money
  }));

  // Settlement suggestions: who pays whom
  const creditors = balances.filter(b => b.net > 0.5).sort((a, b) => b.net - a.net);
  const debtors = balances.filter(b => b.net < -0.5).sort((a, b) => a.net - b.net);
  const settlements: { from: string; to: string; amount: number }[] = [];
  const creds = creditors.map(c => ({ ...c }));
  const debts = debtors.map(d => ({ ...d }));
  let ci = 0; let di = 0;
  while (ci < creds.length && di < debts.length) {
    const pay = Math.min(creds[ci].net, Math.abs(debts[di].net));
    if (pay > 0.5) settlements.push({ from: debts[di].name, to: creds[ci].name, amount: Math.round(pay) });
    creds[ci].net -= pay;
    debts[di].net += pay;
    if (Math.abs(creds[ci].net) < 0.5) ci++;
    if (Math.abs(debts[di].net) < 0.5) di++;
  }

  const resetForm = () => {
    setExpTitle(''); setExpAmount(''); setExpCategory('other');
    setPaidBy(''); setAmountError(''); setTitleError('');
  };

  const handleAddExpense = async () => {
    setAmountError(''); setTitleError('');
    if (!expTitle.trim()) { setTitleError('Please enter a title.'); return; }
    const amount = parseFloat(expAmount);
    if (!expAmount || isNaN(amount) || amount <= 0) {
      setAmountError('Please enter a valid amount greater than 0.');
      return;
    }
    await addExpense({
      trip_id: id,
      title: expTitle.trim(),
      amount,
      category: expCategory,
      paid_by_name: paidBy || null,
      added_by: user?.id ?? null,
    });
    setModalVisible(false);
    resetForm();
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'expenses', label: `Expenses (${expenses.length})` },
    { key: 'balances', label: 'Balances' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F3EF' }}>
      {/* Header */}
      <View style={{ backgroundColor: P, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16 }}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Smart Budget</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{currentTrip?.name}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={{ backgroundColor: GOLD, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: P, fontWeight: '800', fontSize: 13 }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Over budget warning */}
      {isOverBudget && (
        <View style={{ backgroundColor: '#FEF2F2', borderBottomWidth: 1, borderBottomColor: '#FCA5A5', paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text>⚠️</Text>
          <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 13 }}>Over budget by ₹{Math.abs(remaining).toLocaleString('en-IN')}</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E8E6E0' }}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === tab.key ? P : 'transparent' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: activeTab === tab.key ? P : '#64748B' }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <>
            {/* Summary card */}
            <View style={{ backgroundColor: P, borderRadius: 20, padding: 20, marginBottom: 16 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 2 }}>Total trip budget</Text>
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 2 }}>
                ₹{totalBudget.toLocaleString('en-IN')}
              </Text>
              {currentTrip && (
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 14 }}>
                  ₹{(currentTrip.budget_max ?? 0).toLocaleString('en-IN')}/person × {currentTrip.group_size} people
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
              <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                <View style={{ height: 8, width: `${pctSpent}%` as any, backgroundColor: isOverBudget ? '#FCA5A5' : pctSpent > 85 ? GOLD : '#4ADE80', borderRadius: 4 }} />
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{pctSpent.toFixed(0)}% used · ₹{Math.round(sharePerPerson).toLocaleString('en-IN')}/person share</Text>
            </View>

            {/* Category breakdown */}
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>By Category</Text>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
              {CATEGORIES.map((cat, idx) => {
                const catSpent = expenses.filter(e => e.category === cat.key).reduce((s, e) => s + e.amount, 0);
                const catBudget = totalBudget * cat.alloc;
                const catOver = catSpent > catBudget && catBudget > 0;
                return (
                  <View key={cat.key} style={{ marginBottom: idx < CATEGORIES.length - 1 ? 14 : 0 }}>
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

            {totalBudget === 0 && expenses.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>💰</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: P, marginBottom: 8 }}>No budget set yet</Text>
                <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center' }}>Set a budget when creating the trip to track spending here</Text>
              </View>
            )}
          </>
        )}

        {/* ── EXPENSES TAB ── */}
        {activeTab === 'expenses' && (
          <>
            {expenses.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🧾</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: P, marginBottom: 8 }}>No expenses yet</Text>
                <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>Tap + Add to log your first expense</Text>
                <TouchableOpacity style={{ backgroundColor: GOLD, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }} onPress={() => setModalVisible(true)}>
                  <Text style={{ color: P, fontWeight: '800' }}>+ Add expense</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
                {[...expenses].reverse().map((exp, i) => {
                  const cat = CATEGORIES.find(c => c.key === exp.category);
                  return (
                    <View key={exp.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: '#F4F3EF' }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F4F3EF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Text style={{ fontSize: 18 }}>{cat?.emoji ?? '📦'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#1F2937' }}>{exp.title}</Text>
                        <Text style={{ fontSize: 11, color: '#64748B' }}>
                          {cat?.label ?? exp.category}{exp.paid_by_name ? ` · paid by ${exp.paid_by_name}` : ''}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: P }}>₹{exp.amount.toLocaleString('en-IN')}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* ── BALANCES TAB ── */}
        {activeTab === 'balances' && (
          <>
            {totalSpent === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>⚖️</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: P, marginBottom: 8 }}>No expenses logged</Text>
                <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center' }}>Add expenses with "Paid by" to calculate who owes whom</Text>
              </View>
            ) : (
              <>
                {/* Per-person summary */}
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Each person's share</Text>
                <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
                  <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F8F9FA', borderBottomWidth: 1, borderBottomColor: '#F4F3EF', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>MEMBER</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>PAID → SHARE → NET</Text>
                  </View>
                  {balances.map((b, i) => (
                    <View key={b.name} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: '#F4F3EF' }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: P, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                        <Text style={{ color: GOLD, fontSize: 11, fontWeight: '800' }}>{b.name[0].toUpperCase()}</Text>
                      </View>
                      <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: '#1F2937' }}>{b.name.split(' ')[0]}</Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 12, color: '#64748B' }}>
                          ₹{Math.round(b.paid).toLocaleString('en-IN')} paid
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: b.net >= 0 ? '#059669' : '#DC2626' }}>
                          {b.net >= 0 ? '+' : ''}₹{Math.round(b.net).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Settlement suggestions */}
                {settlements.length > 0 && (
                  <>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Who pays whom</Text>
                    <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
                      {settlements.map((s, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: '#F4F3EF', gap: 10 }}>
                          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#DC2626', fontSize: 10, fontWeight: '800' }}>{s.from[0].toUpperCase()}</Text>
                          </View>
                          <Text style={{ flex: 1, fontSize: 13, color: '#1F2937' }}>
                            <Text style={{ fontWeight: '700' }}>{s.from.split(' ')[0]}</Text>
                            <Text style={{ color: '#64748B' }}> pays </Text>
                            <Text style={{ fontWeight: '700' }}>{s.to.split(' ')[0]}</Text>
                          </Text>
                          <View style={{ backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: '#059669' }}>₹{s.amount.toLocaleString('en-IN')}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {settlements.length === 0 && totalSpent > 0 && (
                  <View style={{ backgroundColor: '#F0FDF4', borderRadius: 14, padding: 16, alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, marginBottom: 6 }}>✅</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#059669' }}>All settled up!</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Everyone has paid their fair share</Text>
                  </View>
                )}

                <View style={{ backgroundColor: '#FFF7ED', borderRadius: 12, padding: 12, marginTop: 16, flexDirection: 'row', gap: 8 }}>
                  <Text style={{ fontSize: 13 }}>ℹ️</Text>
                  <Text style={{ flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 }}>
                    Balances are based on equal split. Log expenses with "Paid by" selected for accurate calculations.
                  </Text>
                </View>
              </>
            )}
          </>
        )}

      </ScrollView>

      {/* Add Expense Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F3EF' }}>
          <View style={{ backgroundColor: P, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '800', fontSize: 17, color: '#fff' }}>Add Expense</Text>
            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 18, lineHeight: 22 }}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

            {/* Title */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>
              Title <Text style={{ color: '#DC2626' }}>*</Text>
            </Text>
            <TextInput
              style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: titleError ? '#DC2626' : '#E8E6E0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1F2937', marginBottom: 4 }}
              placeholder="e.g. Hotel deposit"
              value={expTitle}
              onChangeText={t => { setExpTitle(t); setTitleError(''); }}
            />
            {titleError ? <Text style={{ color: '#DC2626', fontSize: 11, marginBottom: 12 }}>{titleError}</Text> : <View style={{ marginBottom: 16 }} />}

            {/* Amount */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>
              Amount (₹) <Text style={{ color: '#DC2626' }}>*</Text>
            </Text>
            <TextInput
              style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: amountError ? '#DC2626' : '#E8E6E0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1F2937', marginBottom: 4 }}
              placeholder="e.g. 5000"
              value={expAmount}
              onChangeText={t => { setExpAmount(t); setAmountError(''); }}
              keyboardType="numeric"
            />
            {amountError ? <Text style={{ color: '#DC2626', fontSize: 11, marginBottom: 12 }}>{amountError}</Text> : <View style={{ marginBottom: 16 }} />}

            {/* Paid by */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Paid by</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {members.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => setPaidBy(paidBy === m.name ? '' : m.name)}
                    style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, backgroundColor: paidBy === m.name ? P : '#fff', borderColor: paidBy === m.name ? P : '#E8E6E0' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: paidBy === m.name ? '#fff' : '#374151' }}>{m.name.split(' ')[0]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Category */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 }}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {CATEGORIES.map(cat => (
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

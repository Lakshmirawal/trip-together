import { create } from 'zustand';

type UIStore = {
  globalLoading: boolean;
  modalVisible: boolean;
  modalContent: string;
  setLoading: (val: boolean) => void;
  showModal: (content: string) => void;
  hideModal: () => void;
};

export const useUIStore = create<UIStore>((set) => ({
  globalLoading: false,
  modalVisible: false,
  modalContent: '',
  setLoading: (val) => set({ globalLoading: val }),
  showModal: (content) => set({ modalVisible: true, modalContent: content }),
  hideModal: () => set({ modalVisible: false, modalContent: '' }),
}));

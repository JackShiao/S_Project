import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  isModalOpen: false,
  modalType: 'login',
  isLoggedIn: false,
  userInfo: null,
  openModal: (type) =>
    set({
      isModalOpen: true,
      modalType: type,
    }),
  closeModal: () =>
    set({
      isModalOpen: false,
    }),
  loginSuccess: (userData) =>
    set({
      isLoggedIn: true,
      userInfo: userData,
    }),
  logout: () =>
    set({
      isLoggedIn: false,
      userInfo: null,
    }),
}));
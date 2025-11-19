/* [추가] 전역 키보드 단축키 훅 */
/* 목적: Ctrl/Cmd + K 등의 전역 단축키를 감지하고 처리 */
import { useEffect } from 'react';

/**
 * useKeyboardShortcuts 훅
 * 전역 키보드 단축키를 감지하고 콜백 함수를 실행
 * 
 * @param {string} key - 감지할 키 (예: 'k', 'n', 's')
 * @param {function} callback - 단축키 감지 시 실행할 콜백 함수
 * @param {object} options - 옵션 { ctrl: boolean, shift: boolean, alt: boolean }
 * 
 * @example
 * // Ctrl/Cmd + K 감지
 * useKeyboardShortcuts('k', () => setModalOpen(true), { ctrl: true });
 * 
 * // Ctrl/Cmd + Shift + N 감지
 * useKeyboardShortcuts('n', () => createNew(), { ctrl: true, shift: true });
 */
const useKeyboardShortcuts = (key, callback, options = {}) => {
  const {
    ctrl = false,
    shift = false,
    alt = false,
  } = options;

  useEffect(() => {
    const handleKeyDown = (event) => {
      // 입력 필드에서는 단축키 무시 (모달 내부 입력은 제외)
      const target = event.target;
      const isInputField = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable;
      
      // 모달이 열려있지 않은 상태에서 입력 필드에 포커스가 있으면 무시
      if (isInputField && !target.closest('[role="dialog"]') && !target.closest('.fixed.inset-0')) {
        return;
      }

      // 키 조합 확인
      const isCtrlOrCmd = ctrl ? (event.ctrlKey || event.metaKey) : true;
      const isShift = shift ? event.shiftKey : !event.shiftKey;
      const isAlt = alt ? event.altKey : !event.altKey;
      const isKey = event.key.toLowerCase() === key.toLowerCase();

      // 모든 조건이 맞으면 콜백 실행
      if (isCtrlOrCmd && isShift && isAlt && isKey) {
        event.preventDefault(); // 브라우저 기본 동작 방지
        callback(event);
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('keydown', handleKeyDown);

    // 클린업: 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, callback, ctrl, shift, alt]);
};

export default useKeyboardShortcuts;

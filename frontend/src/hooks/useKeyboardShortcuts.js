/**
 * useKeyboardShortcuts 커스텀 훅
 * 
 * 전역 키보드 이벤트를 감지하여 단축키 기능을 구현.
 * 입력 필드(input, textarea)에서의 이벤트는 기본적으로 무시하나,
 * 모달 등 특정 상황에서는 예외적으로 동작하도록 처리.
 * 
 * 주요 기능:
 * - 조합 키 지원 (Ctrl, Shift, Alt)
 * - 입력 필드 포커스 시 단축키 무시 처리
 * - 이벤트 리스너 자동 등록 및 해제
 * 
 * @param {string} key - 감지할 키 값 (예: 'k', 'Enter')
 * @param {Function} callback - 단축키 발생 시 실행할 콜백
 * @param {Object} [options] - 옵션 객체
 * @param {boolean} [options.ctrl=false] - Ctrl (Mac은 Cmd) 키 필요 여부
 * @param {boolean} [options.shift=false] - Shift 키 필요 여부
 * @param {boolean} [options.alt=false] - Alt 키 필요 여부
 * 
 * @example
 * // Ctrl+K로 검색 모달 열기
 * useKeyboardShortcuts('k', () => setIsOpen(true), { ctrl: true });
 */
import { useEffect } from 'react';

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

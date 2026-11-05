/**
 * 프로젝트 선택 컴포넌트
 * 
 * 프로젝트 및 하위 작업(계층 구조)을 검색하고 선택할 수 있는 드롭다운 컴포넌트.
 * 
 * 주요 기능:
 * - 프로젝트 검색 및 필터링
 * - 계층적 작업 구조 표시 (트리 형태)
 * - 현재 선택된 경로(프로젝트 > 작업) 표시
 * - 외부 클릭 감지하여 닫기
 * 
 * @module ProjectSelector
 */
import React, { useState, useEffect, useRef } from 'react';
import { RiSearchLine, RiHashtag, RiCheckLine, RiArrowDownSLine, RiCornerDownRightLine } from 'react-icons/ri';


/**
 * ProjectSelector 컴포넌트.
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {Array} props.projects - 전체 프로젝트 목록 (계층 구조 포함)
 * @param {string} props.selectedProjectId - 현재 선택된 프로젝트 ID
 * @param {string} props.selectedParentId - 현재 선택된 상위 작업 ID (선택사항)
 * @param {Function} props.onSelect - 선택 완료 콜백 (projectId, parentId)
 * @returns {JSX.Element} 프로젝트 선택기 요소
 */
const ProjectSelector = ({ projects, selectedProjectId, selectedParentId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 드롭다운 열릴 때 검색창 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchTerm('');
    }
  }, [isOpen]);

  // 현재 선택된 항목 찾기 (표시용)
  const getSelectedLabel = () => {
    // 1. 프로젝트 찾기
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return '프로젝트 선택';

    // 2. 하위 작업(ParentId)이 선택된 경우 해당 작업 찾기
    if (selectedParentId) {
      const findItem = (items) => {
        for (const item of items) {
          if (item.id === selectedParentId) return item;
          if (item.children?.length) {
            const found = findItem(item.children);
            if (found) return found;
          }
        }
        return null;
      };
      const parentItem = findItem(project.items || []);
      if (parentItem) {
        return (
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <span className="text-ink-3">{project.keyword}</span>
            <span className="text-ink-4">/</span>
            <span className="truncate text-ink">{parentItem.description}</span>
          </span>
        );
      }
    }

    return (
      <span className="flex min-w-0 items-center gap-2 truncate text-ink">
        <RiHashtag className="flex-shrink-0 text-sm text-ink-4" />
        {project.keyword}
      </span>
    );
  };

  // 검색 필터링
  const filteredProjects = projects.map(project => {
    // 검색어가 없으면 모든 항목 표시
    if (!searchTerm) {
      return { ...project, filteredItems: project.items || [], matches: true };
    }
    
    // 프로젝트 이름 매칭
    const projectMatches = project.keyword.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 하위 항목 매칭 (재귀)
    const filterItems = (items) => {
      return items.reduce((acc, item) => {
        const itemMatches = item.description.toLowerCase().includes(searchTerm.toLowerCase());
        const childMatches = item.children ? filterItems(item.children) : [];
        
        if (itemMatches || childMatches.length > 0) {
          acc.push({ ...item, children: childMatches, matches: itemMatches });
        }
        return acc;
      }, []);
    };

    const filteredItems = project.items ? filterItems(project.items) : [];

    if (projectMatches || filteredItems.length > 0) {
      return { ...project, filteredItems, matches: projectMatches };
    }
    return null;
  }).filter(Boolean);

  // 항목 렌더링 (재귀)
  // 검색어가 있으면 모든 깊이를 보여주고, 없으면 1단계(level 0)까지만 보여줌
  const maxDepth = searchTerm ? Infinity : 0;

  const renderItems = (items, projectId, level = 0) => {
    return items.map(item => (
      <React.Fragment key={item.id}>
        <button
          type="button"
          onClick={() => {
            onSelect(projectId, item.id);
            setIsOpen(false);
          }}
          className="group flex w-full items-center gap-2 py-2 pr-3 text-left text-sm hover:bg-paper-2"
          style={{ paddingLeft: `${level * 16 + 30}px` }}
        >
          <RiCornerDownRightLine className="flex-shrink-0 text-ink-4 group-hover:text-ink-3" />
          <span className="flex-1 truncate text-ink-2 group-hover:text-ink">{item.description}</span>
          {selectedParentId === item.id && <RiCheckLine className="flex-shrink-0 text-sm text-ink" />}
        </button>
        {item.children && level < maxDepth && renderItems(item.children, projectId, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-9 w-full items-center justify-between gap-2 rounded border bg-sheet px-2.5 text-sm transition-colors ${
          isOpen ? 'border-ink' : 'border-rule hover:border-ink-3'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex min-w-0 items-center gap-2 overflow-hidden">
          <span className="flex-shrink-0 text-xs text-ink-3">위치</span>
          {getSelectedLabel()}
        </span>
        <RiArrowDownSLine className="flex-shrink-0 text-sm text-ink-3" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 flex max-h-80 w-full flex-col overflow-hidden rounded-md border border-rule bg-sheet shadow-pop animate-pop-in">
          {/* 검색창 */}
          <div className="border-b border-rule p-2">
            <div className="relative">
              <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-ink-4" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="프로젝트 또는 작업 검색..."
                className="w-full rounded border border-rule bg-paper py-1.5 pl-8 pr-3 text-sm text-ink transition-colors focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          {/* 목록 */}
          <div className="overflow-y-auto flex-1 py-1">
            {filteredProjects.length > 0 ? (
              filteredProjects.map(project => (
                <div key={project.id}>
                  {/* 프로젝트 헤더 */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(project.id, null);
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-ink hover:bg-paper-2"
                  >
                    <RiHashtag className="flex-shrink-0 text-sm text-ink-4" />
                    <span className="flex-1 truncate">{project.keyword}</span>
                    {selectedProjectId === project.id && !selectedParentId && (
                      <RiCheckLine className="flex-shrink-0 text-sm text-ink" />
                    )}
                  </button>
                  
                  {/* 하위 항목들 */}
                  {project.filteredItems && renderItems(project.filteredItems, project.id)}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-ink-3">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSelector;

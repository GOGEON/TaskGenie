import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaHashtag, FaCheck, FaInbox, FaChevronRight, FaChevronDown } from 'react-icons/fa';

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
          <span className="flex items-center gap-1 truncate">
            <span className="text-gray-500">{project.keyword}</span>
            <span className="text-gray-400">/</span>
            <span>{parentItem.description}</span>
          </span>
        );
      }
    }

    return (
      <span className="flex items-center gap-2 truncate">
        <FaHashtag className="text-gray-400 text-xs" />
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
          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm group"
          style={{ paddingLeft: `${level * 16 + 36}px` }}
        >
          <div className="text-gray-400 group-hover:text-gray-600">
            <span className="text-xs">└</span>
          </div>
          <span className="truncate flex-1 text-gray-600">{item.description}</span>
          {selectedParentId === item.id && <FaCheck className="text-blue-500 text-xs" />}
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
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 flex items-center justify-between bg-white"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {getSelectedLabel()}
        </div>
        <FaChevronDown className="text-gray-400 text-xs" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-hidden flex flex-col animate-scaleIn origin-top">
          {/* 검색창 */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="프로젝트 또는 작업 검색..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-blue-300 focus:bg-white transition-colors"
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
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm font-medium text-gray-800"
                  >
                    <FaHashtag className="text-gray-400" />
                    <span className="flex-1 truncate">{project.keyword}</span>
                    {selectedProjectId === project.id && !selectedParentId && (
                      <FaCheck className="text-blue-500 text-xs" />
                    )}
                  </button>
                  
                  {/* 하위 항목들 */}
                  {project.filteredItems && renderItems(project.filteredItems, project.id)}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-400 text-xs">
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

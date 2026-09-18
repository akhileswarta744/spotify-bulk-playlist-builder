import React, { useState, useRef, useEffect } from 'react';
import { MatchResult } from '../types';
import { exportToCsv, exportToTxt } from '../utils/exportUtils';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';

interface ExportDropdownProps {
  results: MatchResult[];
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({ results }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
      >
        <Download className="w-3.5 h-3.5 text-zinc-400" />
        Export
        <ChevronDown className="w-3 h-3 text-zinc-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl py-1 z-30 animate-fade-in">
          <button
            onClick={() => {
              exportToCsv(results);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center gap-2.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export as CSV (.csv)
          </button>
          <button
            onClick={() => {
              exportToTxt(results);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center gap-2.5 transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            Export as TXT (.txt)
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Table as TableIcon,
    Plus,
    Trash2,
    Check,
    X,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Sparkles,
    ListPlus
} from 'lucide-react';

export default function CustomTableEditorModal({
    isOpen,
    onClose,
    onInsert,
    initialHeaders = ['Product / Ingredient', 'Key Benefit', 'Skin / Hair Type', 'How to Use'],
    initialRows = [
        ['Rosemary Essential Oil', 'Stimulates follicles & circulation', 'Thinning / Slow Growth', 'Mix 2-3 drops with carrier oil'],
        ['Cold-Pressed Castor Oil', 'Thickens & strengthens strands', 'Dry / Damaged Hair', 'Apply to roots overnight twice weekly'],
        ['Golden Jojoba Oil', 'Balances natural sebum & moisturizes', 'All Skin Types', 'Apply 3-4 drops as daily face elixir']
    ],
    initialAlignments = ['left', 'left', 'left', 'left']
}) {
    const [headers, setHeaders] = useState(initialHeaders);
    const [rows, setRows] = useState(initialRows);
    const [alignments, setAlignments] = useState(initialAlignments);
    const cellInputRefs = useRef({});

    useEffect(() => {
        if (isOpen) {
            setHeaders(initialHeaders);
            setRows(initialRows);
            setAlignments(initialAlignments);
        }
    }, [isOpen, initialHeaders, initialRows, initialAlignments]);

    if (!isOpen) return null;

    const handleAddColumn = () => {
        if (headers.length >= 8) return;
        setHeaders([...headers, `Column ${headers.length + 1}`]);
        setRows(rows.map(r => [...r, '']));
        setAlignments([...alignments, 'left']);
    };

    const handleDeleteColumn = (colIndex) => {
        if (headers.length <= 1) return;
        setHeaders(headers.filter((_, idx) => idx !== colIndex));
        setRows(rows.map(r => r.filter((_, idx) => idx !== colIndex)));
        setAlignments(alignments.filter((_, idx) => idx !== colIndex));
    };

    const handleAddRow = () => {
        const newRow = headers.map(() => '');
        setRows([...rows, newRow]);
    };

    const handleDeleteRow = (rowIndex) => {
        if (rows.length <= 1) return;
        setRows(rows.filter((_, idx) => idx !== rowIndex));
    };

    const handleHeaderChange = (index, value) => {
        const next = [...headers];
        next[index] = value;
        setHeaders(next);
    };

    const handleCellChange = (rowIndex, colIndex, value) => {
        const nextRows = [...rows];
        nextRows[rowIndex] = [...nextRows[rowIndex]];
        nextRows[rowIndex][colIndex] = value;
        setRows(nextRows);
    };

    const toggleAlignment = (colIndex) => {
        const current = alignments[colIndex] || 'left';
        const next = current === 'left' ? 'center' : current === 'center' ? 'right' : 'left';
        const nextAlignments = [...alignments];
        nextAlignments[colIndex] = next;
        setAlignments(nextAlignments);
    };

    const handleInsertTable = () => {
        onInsert({ headers, rows, alignments });
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 15 }}
                    className="w-full max-w-5xl bg-white border border-gray-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[#2f4220] text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#587a3b] text-white flex items-center justify-center">
                                <TableIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-base text-white">
                                    Visual Comparison Table Editor
                                </h3>
                                <p className="text-xs text-gray-300">
                                    Configure headers, columns, rows, and alignment
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Table Workspace */}
                    <div className="p-6 overflow-y-auto flex-1 space-y-4">
                        <div className="border border-gray-200 overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-[#f5f8f2] border-b border-gray-200">
                                        <th className="w-10 p-3 text-center text-gray-400 font-mono">#</th>
                                        {headers.map((head, colIdx) => {
                                            const align = alignments[colIdx] || 'left';
                                            return (
                                                <th key={colIdx} className="p-3 border-r border-gray-200 min-w-[180px]">
                                                    <div className="flex items-center justify-between gap-1 mb-1.5">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#587a3b]">
                                                            Col {colIdx + 1}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleAlignment(colIdx)}
                                                                title={`Alignment: ${align}`}
                                                                className="p-1 hover:bg-white rounded text-gray-500 hover:text-[#587a3b]"
                                                            >
                                                                {align === 'center' ? <AlignCenter className="w-3.5 h-3.5" /> : align === 'right' ? <AlignRight className="w-3.5 h-3.5" /> : <AlignLeft className="w-3.5 h-3.5" />}
                                                            </button>
                                                            {headers.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteColumn(colIdx)}
                                                                    title="Delete Column"
                                                                    className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={head}
                                                        onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                                                        className="w-full px-2.5 py-1.5 text-xs font-bold text-gray-800 bg-white border border-gray-300 focus:outline-none focus:border-[#587a3b]"
                                                    />
                                                </th>
                                            );
                                        })}
                                        <th className="w-12 p-2 text-center">
                                            <button
                                                type="button"
                                                onClick={handleAddColumn}
                                                disabled={headers.length >= 8}
                                                title="Add Column"
                                                className="p-1.5 bg-[#587a3b] text-white hover:bg-[#486530] transition-colors disabled:opacity-40"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rows.map((row, rowIdx) => (
                                        <tr key={rowIdx} className="hover:bg-gray-50">
                                            <td className="p-3 text-center text-[10px] font-mono text-gray-400">
                                                {rowIdx + 1}
                                            </td>
                                            {headers.map((_, colIdx) => (
                                                <td key={colIdx} className="p-2 border-r border-gray-100">
                                                    <input
                                                        type="text"
                                                        value={row[colIdx] || ''}
                                                        onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                                                        placeholder="Cell text..."
                                                        className={`w-full px-2.5 py-1.5 bg-white border border-gray-200 focus:border-[#587a3b] focus:outline-none text-xs ${
                                                            alignments[colIdx] === 'center' ? 'text-center' : alignments[colIdx] === 'right' ? 'text-right' : 'text-left'
                                                        }`}
                                                    />
                                                </td>
                                            ))}
                                            <td className="p-2 text-center">
                                                {rows.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteRow(rowIdx)}
                                                        title="Delete Row"
                                                        className="p-1.5 text-gray-300 hover:text-red-600 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={handleAddRow}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#f5f8f2] hover:bg-[#e8efe2] text-[#3b5327] border border-[#587a3b]/30 text-xs font-bold transition-colors"
                            >
                                <ListPlus className="w-4 h-4 text-[#587a3b]" />
                                <span>+ Add Row</span>
                            </button>
                            <span className="text-xs text-gray-400 font-mono">
                                Size: {headers.length} columns × {rows.length} rows
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleInsertTable}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#587a3b] hover:bg-[#486530] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                        >
                            <Check className="w-4 h-4" />
                            <span>Insert Table into Article</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

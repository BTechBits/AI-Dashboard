/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Send, LayoutDashboard, BarChart3, Users, Activity, Home, PieChart as PieChartIcon, Settings, MessageSquare, Bell, Search, Sparkles, TrendingUp, TrendingDown, UploadCloud, FileText, Database, Code, Table as TableIcon, Loader2, CheckCircle2, FileJson, FileSpreadsheet, FileQuestion, Play, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Filter, BarChart2, LineChart as LineChartIcon, Menu, Clock, History, Star, Trash2, Save, User, Shield, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-dark.css';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function App() {
  const [query, setQuery] = useState('');
  const [activeNav, setActiveNav] = useState('overview');
  
  // App State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [queryHistory, setQueryHistory] = useState<{id: string, query: string, timestamp: Date, saved?: boolean}[]>([
    { id: '1', query: 'Show total revenue by region', timestamp: new Date(Date.now() - 86400000), saved: true },
    { id: '2', query: 'What are the top 5 selling products?', timestamp: new Date(Date.now() - 172800000), saved: true },
    { id: '3', query: 'Monthly user growth over the last year', timestamp: new Date(Date.now() - 259200000), saved: true },
    { id: '4', query: 'Average order value by customer segment', timestamp: new Date(Date.now() - 345600000), saved: true },
    { id: '5', query: 'Churn rate comparison between free and paid tiers', timestamp: new Date(Date.now() - 432000000), saved: true },
    { id: '6', query: 'Most active users in the last 30 days', timestamp: new Date(Date.now() - 518400000), saved: true },
  ]);

  type ConversationMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sql?: string;
    timestamp: Date;
    followUps?: string[];
  };
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);

  type DashboardWidget = {
    id: string;
    type: 'kpi' | 'bar' | 'line' | 'pie' | 'area' | 'table';
    title: string;
    data?: any[];
    config?: {
      xAxisKey?: string;
      yAxisKey?: string;
      secondaryYAxisKey?: string;
      kpiValue?: string | number;
      kpiLabel?: string;
      kpiSubtext?: string;
      kpiIcon?: 'trending-up' | 'trending-down' | 'activity' | 'users' | 'database' | 'dollar';
      kpiColor?: string;
    };
    sql?: string;
    layout?: {
      colSpan: number;
    };
  };

  type Dashboard = {
    title: string;
    description: string;
    widgets: DashboardWidget[];
  };

  const [generatedDashboard, setGeneratedDashboard] = useState<Dashboard | null>(null);

  const toggleSaveQuery = (id: string) => {
    setQueryHistory(prev => prev.map(q => q.id === id ? { ...q, saved: !q.saved } : q));
  };

  const deleteQuery = (id: string) => {
    setQueryHistory(prev => prev.filter(q => q.id !== id));
  };

  // Dataset State
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<string>('');
  const [columns, setColumns] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedSql, setGeneratedSql] = useState('');
  const [isRunningSql, setIsRunningSql] = useState(false);
  
  // Table State
  const [tableData, setTableData] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null);
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  
  // Chart State
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area'>('bar');
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRunSql = (sqlToRun?: string) => {
    const sql = sqlToRun || generatedSql;
    if (!sql.trim()) return;
    setIsRunningSql(true);
    // Simulate query execution delay
    setTimeout(() => {
      const col1Name = columns[0] || 'Category';
      const newData = Array.from({ length: Math.floor(Math.random() * 15) + 10 }).map((_, i) => ({
        [col1Name]: `Result Data ${i + 1}`,
        'Total Count': Math.floor(Math.random() * 1000),
        'Total Value': parseFloat((Math.random() * 10000).toFixed(2))
      }));
      setTableData(newData);
      setCurrentPage(1);
      setIsRunningSql(false);
    }, 1000);
  };

  const filteredData = tableData.filter(row => 
    Object.values(row).some(val => 
      String(val).toLowerCase().includes(filterText.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  const paginatedData = sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExportCsv = () => {
    if (tableData.length === 0) return;
    const headers = Object.keys(tableData[0]);
    const csvContent = [
      headers.join(','),
      ...sortedData.map(row => headers.map(h => row[h]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'results.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (uploadedFile: File) => {
    setFile(uploadedFile);
    setGeneratedSql(''); // Reset previous analysis
    setColumns([]);
    
    const extension = uploadedFile.name.split('.').pop()?.toLowerCase() || '';
    setFileType(extension);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        if (extension === 'json') {
          // Try to parse JSON to extract keys
          const data = JSON.parse(text);
          const firstItem = Array.isArray(data) ? data[0] : data;
          if (firstItem && typeof firstItem === 'object') {
            setColumns(Object.keys(firstItem).slice(0, 8));
          } else {
            setColumns(['id', 'value', 'timestamp', 'category']);
          }
        } else if (extension === 'csv' || extension === 'txt') {
          // Basic CSV split
          const firstLine = text.split('\n')[0];
          if (firstLine) {
            const cols = firstLine.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
            setColumns(cols.slice(0, 8));
          }
        } else {
          // Fallback for Excel (.xlsx, .xls) or unknown types without heavy libraries
          setColumns(['Column A', 'Column B', 'Column C', 'Column D', 'Column E']);
        }
      } catch (err) {
        console.error("Error parsing file", err);
        setColumns(['Field_1', 'Field_2', 'Field_3', 'Field_4']);
      }
    };
    
    // Read a small chunk of the file to extract headers/keys
    reader.readAsText(uploadedFile.slice(0, 8192)); 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !file) return;
    
    const userQuery = query.trim();
    setQuery('');
    setIsAnalyzing(true);
    setGeneratedSql('');
    
    // Add to history
    const newQuery = { id: Date.now().toString(), query: userQuery, timestamp: new Date() };
    setQueryHistory(prev => [newQuery, ...prev]);
    
    // Add to conversation
    const userMsg: ConversationMessage = {
      id: Date.now().toString() + '-user',
      role: 'user',
      content: userQuery,
      timestamp: new Date()
    };
    setConversation(prev => [...prev, userMsg]);
    
    // Simulate AI processing delay
    setTimeout(() => {
      const col1 = columns[0] || 'category';
      const col2 = columns[1] || 'amount';
      const mockSql = `SELECT \n  ${col1},\n  COUNT(*) as total_count,\n  SUM(${col2}) as total_value\nFROM uploaded_${fileType || 'dataset'}\nWHERE ${col1} ILIKE '%${userQuery.split(' ')[0]}%'\nGROUP BY 1\nORDER BY 3 DESC\nLIMIT 10;`;
      setGeneratedSql(mockSql);
      
      const assistantMsg: ConversationMessage = {
        id: Date.now().toString() + '-assistant',
        role: 'assistant',
        content: `Here is the dashboard for "${userQuery}". I've generated the following SQL query and interactive widgets to retrieve these results.`,
        sql: mockSql,
        timestamp: new Date(),
        followUps: [
          `Show me the top 5 ${col1} by total value`,
          `What is the average ${col2} per ${col1}?`,
          `Filter this data where total value is greater than 1000`
        ]
      };
      setConversation(prev => [...prev, assistantMsg]);
      
      // Generate mock table data
      const col1Name = columns[0] || 'Category';
      const newData = Array.from({ length: 24 }).map((_, i) => ({
        [col1Name]: `Sample Data ${i + 1}`,
        'Total Count': Math.floor(Math.random() * 1000),
        'Total Value': parseFloat((Math.random() * 10000).toFixed(2))
      }));
      setTableData(newData);
      setCurrentPage(1);
      setFilterText('');
      setSortConfig(null);
      
      // Generate Dashboard
      const isTrend = userQuery.toLowerCase().includes('trend') || userQuery.toLowerCase().includes('time') || userQuery.toLowerCase().includes('line');
      const isDistribution = userQuery.toLowerCase().includes('distribution') || userQuery.toLowerCase().includes('pie') || userQuery.toLowerCase().includes('share');
      
      const primaryChartType = isDistribution ? 'pie' : isTrend ? 'line' : 'bar';
      const secondaryChartType = primaryChartType === 'bar' ? 'area' : 'bar';

      const mockDashboard: Dashboard = {
        title: `${userQuery} Dashboard`,
        description: `Interactive dashboard generated based on your request: "${userQuery}"`,
        widgets: [
          {
            id: 'kpi-1',
            type: 'kpi',
            title: 'Total Records',
            config: {
              kpiValue: '24,592',
              kpiLabel: 'Rows Analyzed',
              kpiSubtext: '+12% from last month',
              kpiIcon: 'database',
              kpiColor: 'blue'
            },
            layout: { colSpan: 1 }
          },
          {
            id: 'kpi-2',
            type: 'kpi',
            title: 'Total Value',
            config: {
              kpiValue: '$1.2M',
              kpiLabel: 'Sum of Amount',
              kpiSubtext: '+5.4% from last month',
              kpiIcon: 'trending-up',
              kpiColor: 'emerald'
            },
            layout: { colSpan: 1 }
          },
          {
            id: 'kpi-3',
            type: 'kpi',
            title: 'Active Categories',
            config: {
              kpiValue: '14',
              kpiLabel: 'Unique Categories',
              kpiSubtext: 'Stable',
              kpiIcon: 'activity',
              kpiColor: 'indigo'
            },
            layout: { colSpan: 1 }
          },
          {
            id: 'chart-1',
            type: primaryChartType,
            title: isDistribution ? 'Distribution Analysis' : isTrend ? 'Trend Over Time' : 'Top Performers',
            data: newData.slice(0, 10),
            config: {
              xAxisKey: col1Name,
              yAxisKey: 'Total Value'
            },
            layout: { colSpan: 2 }
          },
          {
            id: 'chart-2',
            type: 'pie',
            title: 'Distribution',
            data: newData.slice(0, 5),
            config: {
              xAxisKey: col1Name,
              yAxisKey: 'Total Count'
            },
            layout: { colSpan: 1 }
          },
          {
            id: 'chart-3',
            type: secondaryChartType,
            title: 'Comparative Analysis',
            data: newData.slice(0, 8),
            config: {
              xAxisKey: col1Name,
              yAxisKey: 'Total Value',
              secondaryYAxisKey: 'Total Count'
            },
            layout: { colSpan: 3 }
          }
        ]
      };
      setGeneratedDashboard(mockDashboard);

      setIsAnalyzing(false);
    }, 1500);
  };

  const handleUpdateMessageSql = (id: string, newSql: string) => {
    setConversation(prev => prev.map(msg => msg.id === id ? { ...msg, sql: newSql } : msg));
  };

  const handleRunMessageSql = (id: string) => {
    const msg = conversation.find(m => m.id === id);
    if (msg && msg.sql) {
      setGeneratedSql(msg.sql);
      handleRunSql(msg.sql);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'analytics', label: 'Analytics', icon: PieChartIcon },
    { id: 'queries', label: 'Saved Queries', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const getFileIcon = () => {
    switch (fileType) {
      case 'csv': return <FileText className="w-6 h-6 text-emerald-600" />;
      case 'json': return <FileJson className="w-6 h-6 text-amber-600" />;
      case 'xlsx':
      case 'xls': return <FileSpreadsheet className="w-6 h-6 text-emerald-600" />;
      default: return <FileQuestion className="w-6 h-6 text-blue-600" />;
    }
  };

  const getFileBadgeColor = () => {
    switch (fileType) {
      case 'csv': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'json': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'xlsx':
      case 'xls': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const renderDashboardWidget = (widget: DashboardWidget) => {
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-zinc-200/50">
            <p className="text-sm font-semibold text-zinc-800 mb-2">{label}</p>
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-zinc-600">{entry.name}:</span>
                <span className="font-medium text-zinc-900">{entry.value}</span>
              </div>
            ))}
          </div>
        );
      }
      return null;
    };

    if (widget.type === 'kpi') {
      const Icon = widget.config?.kpiIcon === 'trending-up' ? TrendingUp :
                   widget.config?.kpiIcon === 'trending-down' ? TrendingDown :
                   widget.config?.kpiIcon === 'database' ? Database :
                   widget.config?.kpiIcon === 'users' ? Users : Activity;
      const colorClass = widget.config?.kpiColor === 'emerald' ? 'text-emerald-600 bg-emerald-50' :
                         widget.config?.kpiColor === 'indigo' ? 'text-indigo-600 bg-indigo-50' :
                         'text-blue-600 bg-blue-50';
      
      return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200/80 flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-shadow h-full">
          <div className="flex items-center justify-between text-zinc-500 relative z-10">
            <span className="font-medium text-sm uppercase tracking-wider">{widget.title}</span>
            <div className={`p-2.5 rounded-xl border border-zinc-100 ${colorClass}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-4xl font-semibold text-zinc-900 tracking-tight">{widget.config?.kpiValue}</div>
            <div className="text-sm text-zinc-500 font-medium mt-2">
              {widget.config?.kpiLabel} {widget.config?.kpiSubtext && <span className="text-zinc-400 ml-1">({widget.config.kpiSubtext})</span>}
            </div>
          </div>
        </div>
      );
    }

    if (!widget.data || !widget.config?.xAxisKey || !widget.config?.yAxisKey) return null;

    const { data, config: { xAxisKey, yAxisKey, secondaryYAxisKey } } = widget;

    const chartContent = () => {
      if (widget.type === 'bar') {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id={`colorY-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6}/>
                </linearGradient>
                {secondaryYAxisKey && (
                  <linearGradient id={`colorSecY-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.6}/>
                  </linearGradient>
                )}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f4f4f5', opacity: 0.4 }} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#71717a', paddingTop: '20px' }} iconType="circle" />
              <Bar dataKey={yAxisKey} fill={`url(#colorY-${widget.id})`} radius={[6, 6, 0, 0]} maxBarSize={50} animationDuration={1500} />
              {secondaryYAxisKey && <Bar dataKey={secondaryYAxisKey} fill={`url(#colorSecY-${widget.id})`} radius={[6, 6, 0, 0]} maxBarSize={50} animationDuration={1500} />}
            </BarChart>
          </ResponsiveContainer>
        );
      } else if (widget.type === 'line') {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#71717a', paddingTop: '20px' }} iconType="circle" />
              <Line type="monotone" dataKey={yAxisKey} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#3b82f6' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} animationDuration={1500} />
              {secondaryYAxisKey && <Line type="monotone" dataKey={secondaryYAxisKey} stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#10b981' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} animationDuration={1500} />}
            </LineChart>
          </ResponsiveContainer>
        );
      } else if (widget.type === 'area') {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id={`colorAreaY-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                {secondaryYAxisKey && (
                  <linearGradient id={`colorAreaSecY-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                )}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#71717a', paddingTop: '20px' }} iconType="circle" />
              <Area type="monotone" dataKey={yAxisKey} stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill={`url(#colorAreaY-${widget.id})`} animationDuration={1500} />
              {secondaryYAxisKey && <Area type="monotone" dataKey={secondaryYAxisKey} stroke="#10b981" strokeWidth={3} fillOpacity={1} fill={`url(#colorAreaSecY-${widget.id})`} animationDuration={1500} />}
            </AreaChart>
          </ResponsiveContainer>
        );
      } else if (widget.type === 'pie') {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey={yAxisKey}
                nameKey={xAxisKey}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                animationDuration={1500}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#71717a', paddingTop: '20px' }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        );
      }
      return null;
    };

    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200/80 flex flex-col h-full min-h-[350px]">
        <h3 className="font-semibold text-zinc-900 mb-6">{widget.title}</h3>
        <div className="flex-1 w-full h-full">
          {chartContent()}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    if (!tableData || tableData.length === 0) return null;
    
    // Use top 10 rows for the chart to keep it readable
    const data = tableData.slice(0, 10);
    const keys = Object.keys(data[0]);
    const xAxisKey = keys[0];
    const yAxisKey = keys[1] || keys[0]; // Fallback if only 1 column
    const secondaryYAxisKey = keys[2]; // Optional second metric

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-zinc-200/50">
            <p className="text-sm font-semibold text-zinc-800 mb-2">{label}</p>
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-zinc-600">{entry.name}:</span>
                <span className="font-medium text-zinc-900">{entry.value}</span>
              </div>
            ))}
          </div>
        );
      }
      return null;
    };

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6}/>
              </linearGradient>
              {secondaryYAxisKey && (
                <linearGradient id="colorSecY" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.6}/>
                </linearGradient>
              )}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} dx={-10} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f4f4f5', opacity: 0.4 }} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#71717a', paddingTop: '20px' }} iconType="circle" />
            <Bar dataKey={yAxisKey} fill="url(#colorY)" radius={[6, 6, 0, 0]} maxBarSize={50} animationDuration={1500} />
            {secondaryYAxisKey && <Bar dataKey={secondaryYAxisKey} fill="url(#colorSecY)" radius={[6, 6, 0, 0]} maxBarSize={50} animationDuration={1500} />}
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} dx={-10} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#71717a', paddingTop: '20px' }} iconType="circle" />
            <Line type="monotone" dataKey={yAxisKey} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#3b82f6' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} animationDuration={1500} />
            {secondaryYAxisKey && <Line type="monotone" dataKey={secondaryYAxisKey} stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#10b981' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} animationDuration={1500} />}
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorAreaY" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              {secondaryYAxisKey && (
                <linearGradient id="colorAreaSecY" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              )}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} dx={-10} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#71717a', paddingTop: '20px' }} iconType="circle" />
            <Area type="monotone" dataKey={yAxisKey} stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAreaY)" animationDuration={1500} />
            {secondaryYAxisKey && <Area type="monotone" dataKey={secondaryYAxisKey} stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAreaSecY)" animationDuration={1500} />}
          </AreaChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={5}
              dataKey={yAxisKey}
              nameKey={xAxisKey}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#71717a', paddingTop: '20px' }} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-zinc-900 font-sans overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar Navigation */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-zinc-950 text-zinc-400 flex flex-col transition-all duration-300 relative z-20 shadow-2xl shrink-0`}>
        <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shrink-0 shadow-lg shadow-blue-600/20">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          {isSidebarOpen && <span className="text-lg font-semibold text-white tracking-tight whitespace-nowrap overflow-hidden">Nexus AI</span>}
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {isSidebarOpen && <div className="px-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-4">Menu</div>}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-500 font-medium' 
                    : 'hover:bg-white/5 hover:text-zinc-200'
                } ${!isSidebarOpen ? 'justify-center px-0' : ''}`}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-500' : 'text-zinc-500'}`} />
                {isSidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}

          {isSidebarOpen && queryHistory.length > 0 && (
            <div className="mt-8">
              <div className="px-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <History className="w-3.5 h-3.5" />
                Recent Queries
              </div>
              <div className="space-y-1">
                {queryHistory.slice(0, 5).map((qh) => (
                  <div
                    key={qh.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setQuery(qh.query);
                      setActiveNav('overview');
                      if (file && !isAnalyzing) {
                        // We can't easily auto-submit without a ref to the form, but populating is good UX
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setQuery(qh.query);
                        setActiveNav('overview');
                      }
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-white/5 transition-colors group flex flex-col gap-1 relative cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm text-zinc-300 truncate group-hover:text-white transition-colors pr-6">
                        {qh.query}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveQuery(qh.id);
                        }}
                        className="absolute right-4 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={qh.saved ? "Unsave query" : "Save query"}
                      >
                        <Star className={`w-4 h-4 ${qh.saved ? 'fill-amber-400 text-amber-400' : 'text-zinc-500 hover:text-amber-400'}`} />
                      </button>
                    </div>
                    <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {qh.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors ${!isSidebarOpen ? 'justify-center px-0' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium text-sm shrink-0 shadow-md">
              JD
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-sm font-medium text-zinc-200 truncate">Jane Doe</span>
                <span className="text-xs text-zinc-500 truncate">Data Scientist</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
        
        {/* Dashboard Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-zinc-200/80 px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-zinc-400 hover:text-zinc-600 transition-colors rounded-xl hover:bg-zinc-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-semibold text-zinc-800 tracking-tight capitalize">
              {navItems.find(n => n.id === activeNav)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 text-zinc-400 hover:text-zinc-600 transition-colors rounded-full hover:bg-zinc-100">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2.5 text-zinc-400 hover:text-zinc-600 transition-colors rounded-full hover:bg-zinc-100 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-8 relative z-0">
          <motion.div 
            className="max-w-6xl mx-auto flex flex-col gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            
            {activeNav === 'overview' && (
              <>
                {/* Dataset Upload Section */}
            <motion.section variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200/80">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-500" />
                  Data Source
                </h2>
                {file && (
                  <button 
                    onClick={() => { setFile(null); setFileType(''); setColumns([]); setGeneratedSql(''); }}
                    className="text-sm text-zinc-500 hover:text-rose-500 transition-colors"
                  >
                    Clear Dataset
                  </button>
                )}
              </div>

              {!file ? (
                <div 
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-zinc-200 hover:border-blue-400 hover:bg-zinc-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept=".csv,.json,.xlsx,.xls,.tsv"
                  />
                  <div className="flex gap-4 mb-4">
                    <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center shadow-sm border border-emerald-100">
                      <FileText className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center shadow-sm border border-amber-100">
                      <FileJson className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center shadow-sm border border-emerald-100">
                      <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-zinc-900 mb-1">Upload your dataset</h3>
                  <p className="text-zinc-500 text-sm mb-4 text-center max-w-md">
                    Drag and drop your CSV, JSON, or Excel file here, or click to browse. We'll automatically detect the format and schema.
                  </p>
                  <button className="px-6 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm">
                    Select File
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      fileType === 'json' ? 'bg-amber-100' : fileType === 'csv' ? 'bg-emerald-100' : 'bg-blue-100'
                    }`}>
                      {getFileIcon()}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <div>
                        <h4 className="text-base font-medium text-zinc-900 truncate">{file.name}</h4>
                        <p className="text-sm text-zinc-500">{(file.size / 1024).toFixed(1)} KB • Ready for analysis</p>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md border ${getFileBadgeColor()}`}>
                        {fileType || 'UNKNOWN'}
                      </span>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  </div>
                  
                  {columns.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Detected Schema</p>
                      <div className="flex flex-wrap gap-2">
                        {columns.map((col, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 shadow-sm flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            {col}
                          </span>
                        ))}
                        {columns.length === 8 && (
                          <span className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-500 shadow-sm">
                            + more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.section>

            {/* Conversation History */}
            {conversation.length > 0 && (
              <motion.section variants={itemVariants} className="flex flex-col gap-6 mb-2">
                {conversation.map((msg) => (
                  <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-gradient-to-tr from-blue-500 to-indigo-500 text-white' : 'bg-zinc-900 text-white'}`}>
                      {msg.role === 'user' ? 'JD' : <Sparkles className="w-5 h-5" />}
                    </div>
                    <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-5 py-3.5 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-zinc-200 text-zinc-800 rounded-2xl rounded-tl-sm'}`}>
                        <p className="text-[15px] leading-relaxed">{msg.content}</p>
                      </div>
                      {msg.sql && (
                        <div className="w-full bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 mt-1 shadow-md">
                          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/50">
                            <div className="flex items-center gap-2 text-zinc-400">
                              <Code className="w-4 h-4" />
                              <span className="text-xs font-mono font-medium tracking-wide uppercase">Generated SQL</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => navigator.clipboard.writeText(msg.sql || '')}
                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Copy SQL"
                              >
                                <Code className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleRunMessageSql(msg.id)}
                                disabled={isRunningSql}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                {isRunningSql ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                Run
                              </button>
                            </div>
                          </div>
                          <div className="p-0 overflow-x-auto custom-scrollbar relative focus-within:border-blue-500/50 transition-colors">
                            <Editor
                              value={msg.sql}
                              onValueChange={(code) => handleUpdateMessageSql(msg.id, code)}
                              highlight={code => Prism.languages.sql ? Prism.highlight(code, Prism.languages.sql, 'sql') : code}
                              padding={16}
                              style={{
                                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                                fontSize: 13,
                                backgroundColor: 'transparent',
                              }}
                              className="text-blue-300 focus:outline-none min-h-[80px]"
                              textareaClassName="focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                      
                      {msg.followUps && msg.followUps.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {msg.followUps.map((followUp, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setQuery(followUp);
                                // We could auto-submit here, but populating is safer
                              }}
                              className="text-xs px-3 py-1.5 bg-white border border-zinc-200 text-zinc-600 rounded-full hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-900 transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                              <Sparkles className="w-3 h-3 text-blue-500" />
                              {followUp}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </motion.section>
            )}

            {/* Natural Language Query Section */}
            <motion.section variants={itemVariants} className={`relative group ${!file ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
              <div className="relative bg-white rounded-3xl shadow-xl border border-zinc-200/80 p-2 flex items-start focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <div className="pl-4 pr-2 pt-4">
                  <Sparkles className={`w-6 h-6 ${file ? 'text-blue-500' : 'text-zinc-300'}`} />
                </div>
                <form onSubmit={handleSubmit} className="flex-1 flex gap-2 items-end">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (query.trim() && file && !isAnalyzing) {
                          handleSubmit(e as unknown as React.FormEvent);
                        }
                      }
                    }}
                    placeholder={file ? `Ask anything about your ${fileType.toUpperCase()} data...\n(Shift+Enter for new line)` : "Please upload a dataset first..."}
                    disabled={!file || isAnalyzing}
                    className="w-full bg-transparent border-none focus:ring-0 px-2 py-3.5 outline-none text-zinc-800 placeholder:text-zinc-400 text-lg disabled:bg-transparent resize-none transition-all duration-300 min-h-[60px] h-[60px] focus:h-[120px]"
                  />
                  <button
                    type="submit"
                    className="bg-zinc-900 hover:bg-zinc-800 text-white px-8 py-3 rounded-2xl font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shrink-0 m-1 h-[48px]"
                    disabled={!query.trim() || !file || isAnalyzing}
                  >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
                  </button>
                </form>
              </div>
            </motion.section>

            {/* Results Area (Replaces KPI/Chart when SQL is generated) */}
            <AnimatePresence mode="wait">
              {generatedSql ? (
                <motion.section 
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col gap-6"
                >
                  <div className="grid grid-cols-1 gap-6">
                    {/* SQL Editor Pane */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200/80 flex flex-col relative overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Code className="w-5 h-5 text-indigo-500" />
                          <h3 className="font-semibold text-zinc-900">SQL Editor</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(generatedSql || '');
                              // Could add a toast notification here
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-xs font-medium hover:bg-zinc-50 transition-colors shadow-sm"
                            title="Copy SQL"
                          >
                            <Code className="w-3.5 h-3.5" />
                            Copy
                          </button>
                          <button 
                            onClick={() => {
                              const blob = new Blob([generatedSql || ''], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'query.sql';
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-xs font-medium hover:bg-zinc-50 transition-colors shadow-sm"
                            title="Download SQL"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Save
                          </button>
                          <button 
                            onClick={() => handleRunSql(generatedSql)}
                            disabled={isRunningSql}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 shadow-sm"
                          >
                            {isRunningSql ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                            Run Query
                          </button>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-inner">
                        <div className="p-0 overflow-x-auto custom-scrollbar relative focus-within:border-blue-500/50 transition-colors">
                          <Editor
                            value={generatedSql}
                            onValueChange={setGeneratedSql}
                            highlight={code => Prism.languages.sql ? Prism.highlight(code, Prism.languages.sql, 'sql') : code}
                            padding={20}
                            style={{
                              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                              fontSize: 14,
                              backgroundColor: 'transparent',
                            }}
                            className="text-blue-300 focus:outline-none min-h-[120px]"
                            textareaClassName="focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {generatedDashboard ? (
                      <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-zinc-200/80">
                          <div>
                            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                              <Sparkles className="w-6 h-6 text-blue-500" />
                              {generatedDashboard.title}
                            </h2>
                            <p className="text-zinc-500 mt-1">{generatedDashboard.description}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {generatedDashboard.widgets.map(widget => {
                            const colSpan = widget.layout?.colSpan || 1;
                            const colClass = colSpan === 3 ? 'md:col-span-3' : colSpan === 2 ? 'md:col-span-2' : 'md:col-span-1';
                            return (
                              <div key={widget.id} className={`col-span-1 ${colClass}`}>
                                {renderDashboardWidget(widget)}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-6">
                          {/* Data Preview */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200/80 flex flex-col relative overflow-hidden">
                          {isRunningSql && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                              <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-xl border border-zinc-100">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                <p className="text-sm font-medium text-zinc-600">Executing Query...</p>
                              </div>
                            </div>
                          )}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <TableIcon className="w-5 h-5 text-indigo-500" />
                          <h3 className="font-semibold text-zinc-900">Query Results</h3>
                        </div>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-zinc-400" />
                          <input 
                            type="text" 
                            placeholder="Filter results..." 
                            value={filterText}
                            onChange={(e) => { setFilterText(e.target.value); setCurrentPage(1); }}
                            className="pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48 transition-all bg-zinc-50 hover:bg-white"
                          />
                        </div>
                        <span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-3 py-1.5 rounded-full">{filteredData.length} rows</span>
                        <button 
                          onClick={handleExportCsv}
                          className="flex items-center gap-1.5 text-xs font-medium bg-white border border-zinc-200 text-zinc-700 px-3 py-2 rounded-xl hover:bg-zinc-50 transition-colors shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export CSV
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 border border-zinc-200 rounded-xl overflow-hidden flex flex-col relative">
                      <div className="overflow-x-auto flex-1 max-h-[400px] custom-scrollbar">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-zinc-500 bg-zinc-50/90 backdrop-blur-md uppercase border-b border-zinc-200 sticky top-0 z-10 shadow-sm">
                            <tr>
                              {tableData.length > 0 && Object.keys(tableData[0]).map((header) => (
                                <th 
                                  key={header} 
                                  className="px-6 py-4 font-medium cursor-pointer hover:bg-zinc-100 transition-colors select-none group"
                                  onClick={() => handleSort(header)}
                                >
                                  <div className="flex items-center gap-1.5">
                                    {header}
                                    <span className="text-zinc-400 group-hover:text-zinc-600">
                                      {sortConfig?.key === header ? (
                                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50" />
                                      )}
                                    </span>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {paginatedData.length > 0 ? paginatedData.map((row, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                                {Object.values(row).map((val: any, i) => (
                                  <td key={i} className={`px-6 py-4 ${i === 0 ? 'font-medium text-zinc-900' : 'text-zinc-600'}`}>
                                    {typeof val === 'number' && i > 0 && val % 1 !== 0 ? `$${val.toFixed(2)}` : val}
                                  </td>
                                ))}
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={tableData.length > 0 ? Object.keys(tableData[0]).length : 3} className="px-6 py-8 text-center text-zinc-500">
                                  No results found matching your filter.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-200 bg-zinc-50 shrink-0">
                          <span className="text-sm text-zinc-500">
                            Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries
                          </span>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                              disabled={currentPage === 1} 
                              className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                              disabled={currentPage === totalPages} 
                              className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                    
                {/* Dynamic Chart Container Area */}
                    <section className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200/80 flex-1 min-h-[500px] flex flex-col relative overflow-hidden">
                      <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                          <h3 className="text-xl font-semibold text-zinc-900 tracking-tight">Data Visualization</h3>
                          <p className="text-sm text-zinc-500 mt-1">Visualizing top 10 results from your query</p>
                        </div>
                        <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-xl border border-zinc-200">
                          <button 
                            onClick={() => setChartType('bar')}
                            className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'}`}
                          >
                            <BarChart2 className="w-4 h-4" />
                            Bar
                          </button>
                          <button 
                            onClick={() => setChartType('line')}
                            className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${chartType === 'line' ? 'bg-white text-blue-600 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'}`}
                          >
                            <LineChartIcon className="w-4 h-4" />
                            Line
                          </button>
                          <button 
                            onClick={() => setChartType('area')}
                            className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${chartType === 'area' ? 'bg-white text-blue-600 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'}`}
                          >
                            <Activity className="w-4 h-4" />
                            Area
                          </button>
                          <button 
                            onClick={() => setChartType('pie')}
                            className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${chartType === 'pie' ? 'bg-white text-blue-600 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'}`}
                          >
                            <PieChartIcon className="w-4 h-4" />
                            Pie
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex-1 w-full h-full min-h-[400px]">
                        {renderChart()}
                      </div>
                    </section>
                    </>
                  )}
                </motion.section>
              ) : (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-8"
                >
                  {/* KPI Cards Section */}
                  <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1 */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200/80 flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-shadow">
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center justify-between text-zinc-500 relative z-10">
                        <span className="font-medium text-sm uppercase tracking-wider">Total Rows</span>
                        <div className="p-2.5 bg-zinc-50 text-zinc-700 rounded-xl border border-zinc-100">
                          <Database className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="relative z-10">
                        <div className="text-4xl font-semibold text-zinc-900 tracking-tight">{file ? '14,293' : '--'}</div>
                        <div className="text-sm text-zinc-500 font-medium mt-2">
                          {file ? 'Detected in dataset' : 'Awaiting upload'}
                        </div>
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200/80 flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-shadow">
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center justify-between text-zinc-500 relative z-10">
                        <span className="font-medium text-sm uppercase tracking-wider">Columns</span>
                        <div className="p-2.5 bg-zinc-50 text-zinc-700 rounded-xl border border-zinc-100">
                          <TableIcon className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="relative z-10">
                        <div className="text-4xl font-semibold text-zinc-900 tracking-tight">{file ? columns.length : '--'}</div>
                        <div className="text-sm text-zinc-500 font-medium mt-2">
                          {file ? 'Features available' : 'Awaiting upload'}
                        </div>
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200/80 flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-shadow">
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center justify-between text-zinc-500 relative z-10">
                        <span className="font-medium text-sm uppercase tracking-wider">Data Quality</span>
                        <div className="p-2.5 bg-zinc-50 text-zinc-700 rounded-xl border border-zinc-100">
                          <Activity className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="relative z-10">
                        <div className="text-4xl font-semibold text-zinc-900 tracking-tight">{file ? '98%' : '--'}</div>
                        <div className="text-sm text-emerald-600 font-medium mt-2 flex items-center gap-1.5 bg-emerald-50 w-fit px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Clean dataset</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Chart Container Area */}
                  <section className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200/80 flex-1 min-h-[400px] flex flex-col relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <div>
                        <h3 className="text-xl font-semibold text-zinc-900 tracking-tight">Data Visualization</h3>
                        <p className="text-sm text-zinc-500 mt-1">Upload data and run a query to generate charts</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 border border-zinc-100 rounded-2xl flex items-center justify-center bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                      
                      <div className="text-center flex flex-col items-center gap-4 relative z-10 bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-zinc-100 shadow-sm">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-2">
                          <BarChart3 className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-zinc-800">
                            {file ? 'Ready for Analysis' : 'Awaiting Dataset'}
                          </p>
                          <p className="text-sm text-zinc-500 mt-1 max-w-[250px]">
                            {file 
                              ? 'Submit a query above to generate SQL, tables, and charts from your data.' 
                              : 'Upload a CSV, JSON, or Excel file above to get started.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
              </>
            )}

            {activeNav === 'analytics' && (
              <motion.section variants={itemVariants} className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200/80 min-h-[600px]">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Analytics Dashboard</h2>
                    <p className="text-sm text-zinc-500 mt-1">Global metrics and insights across all your datasets</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-medium text-sm hover:bg-blue-100 transition-colors">
                    Download Report
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                    <div className="flex items-center gap-3 mb-2 text-zinc-500">
                      <Database className="w-5 h-5" />
                      <span className="font-medium">Total Datasets</span>
                    </div>
                    <div className="text-3xl font-bold text-zinc-900">12</div>
                    <div className="text-sm text-emerald-600 flex items-center gap-1 mt-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>+2 this week</span>
                    </div>
                  </div>
                  <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                    <div className="flex items-center gap-3 mb-2 text-zinc-500">
                      <MessageSquare className="w-5 h-5" />
                      <span className="font-medium">Queries Run</span>
                    </div>
                    <div className="text-3xl font-bold text-zinc-900">1,284</div>
                    <div className="text-sm text-emerald-600 flex items-center gap-1 mt-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>+15% vs last month</span>
                    </div>
                  </div>
                  <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                    <div className="flex items-center gap-3 mb-2 text-zinc-500">
                      <Activity className="w-5 h-5" />
                      <span className="font-medium">Avg. Query Time</span>
                    </div>
                    <div className="text-3xl font-bold text-zinc-900">1.2s</div>
                    <div className="text-sm text-emerald-600 flex items-center gap-1 mt-2">
                      <TrendingDown className="w-4 h-4" />
                      <span>-0.3s improvement</span>
                    </div>
                  </div>
                </div>

                <div className="h-[400px] bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                    <p className="text-zinc-500 font-medium">Connect more data sources to see advanced analytics</p>
                  </div>
                </div>
              </motion.section>
            )}

            {activeNav === 'queries' && (
              <motion.section variants={itemVariants} className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200/80 min-h-[600px]">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Saved Queries</h2>
                    <p className="text-sm text-zinc-500 mt-1">Access and manage your frequently used queries</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {queryHistory.filter(q => q.saved).length === 0 ? (
                    <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <Star className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                      <p className="text-zinc-500 font-medium">No saved queries yet</p>
                      <p className="text-sm text-zinc-400 mt-1">Star a query from your history to save it here</p>
                    </div>
                  ) : (
                    queryHistory.filter(q => q.saved).map(q => (
                      <div key={q.id} className="flex items-center justify-between p-5 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-blue-200 transition-colors group">
                        <div className="flex-1">
                          <p className="text-zinc-900 font-medium text-lg">{q.query}</p>
                          <p className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Saved on {q.timestamp.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setQuery(q.query);
                              setActiveNav('overview');
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Run Query"
                          >
                            <Play className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => toggleSaveQuery(q.id)}
                            className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Unsave"
                          >
                            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                          </button>
                          <button 
                            onClick={() => deleteQuery(q.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.section>
            )}

            {activeNav === 'settings' && (
              <motion.section variants={itemVariants} className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200/80 min-h-[600px]">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Settings</h2>
                  <p className="text-sm text-zinc-500 mt-1">Manage your account and application preferences</p>
                </div>

                <div className="max-w-2xl space-y-8">
                  {/* Profile Settings */}
                  <div>
                    <h3 className="text-lg font-medium text-zinc-900 flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-blue-500" />
                      Profile
                    </h3>
                    <div className="space-y-4 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Display Name</label>
                        <input type="text" defaultValue="Jane Doe" className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Email Address</label>
                        <input type="email" defaultValue="jane@example.com" className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* API Keys */}
                  <div>
                    <h3 className="text-lg font-medium text-zinc-900 flex items-center gap-2 mb-4">
                      <Key className="w-5 h-5 text-amber-500" />
                      API Configuration
                    </h3>
                    <div className="space-y-4 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">OpenAI API Key</label>
                        <input type="password" defaultValue="sk-..." className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono" />
                        <p className="text-xs text-zinc-500 mt-2">Used for natural language to SQL translation.</p>
                      </div>
                    </div>
                  </div>

                  {/* Security */}
                  <div>
                    <h3 className="text-lg font-medium text-zinc-900 flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-emerald-500" />
                      Security
                    </h3>
                    <div className="space-y-4 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-zinc-900">Two-Factor Authentication</p>
                          <p className="text-sm text-zinc-500">Add an extra layer of security to your account</p>
                        </div>
                        <button className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm">
                          Enable
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </motion.section>
            )}

          </motion.div>
        </main>
      </div>
    </div>
  );
}

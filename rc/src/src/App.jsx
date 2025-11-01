import React, { useState, useEffect } from 'react';
import { Download, FileText, Upload, LogOut, User, Clock, Sparkles, CheckCircle, Zap, AlertCircle } from 'lucide-react';

const EdusenseApp = () => {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [inputText, setInputText] = useState('');
  const [conversionHistory, setConversionHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('edusense_user');
    const savedHistory = localStorage.getItem('edusense_history');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentView('main');
    }
    if (savedHistory) {
      setConversionHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleAuth = () => {
    if (authMode === 'register' && inviteCode !== 'EDUSENSE2025') {
      alert('邀请码无效，请使用: EDUSENSE2025');
      return;
    }
    if (!email && !phone) {
      alert('请输入邮箱或手机号');
      return;
    }
    if (!password) {
      alert('请输入密码');
      return;
    }
    const userData = {
      email: email || phone,
      joinDate: new Date().toISOString(),
      conversionsCount: 0
    };
    setUser(userData);
    localStorage.setItem('edusense_user', JSON.stringify(userData));
    setCurrentView('main');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('edusense_user');
    setCurrentView('login');
    setInputText('');
  };

  const formatInlineText = (text) => {
    if (!text) return '';
    text = text.replace(/\\([*_`\[\]()#])/g, '$1');
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/_(.+?)_/g, '<em>$1</em>');
    text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');
    text = text.replace(/([^<>\w])\*([^<>\w])/g, '$1$2');
    text = text.replace(/([^<>\w])_([^<>\w])/g, '$1$2');
    return text;
  };

  const parseTable = (lines, startIndex) => {
    const tableLines = [];
    let i = startIndex;
    while (i < lines.length && lines[i].includes('|')) {
      tableLines.push(lines[i]);
      i++;
    }
    if (tableLines.length < 2) return null;
    const headers = tableLines[0].split('|').filter(cell => cell.trim()).map(cell => cell.trim());
    const rows = [];
    for (let j = 2; j < tableLines.length; j++) {
      const cells = tableLines[j].split('|').filter(cell => cell.trim()).map(cell => cell.trim());
      if (cells.length > 0) rows.push(cells);
    }
    return { headers, rows, lineCount: tableLines.length };
  };

  const parseMarkdownToHTML = (text) => {
    const lines = text.split('\n');
    let html = '';
    let i = 0;
    let inCodeBlock = false;
    let codeContent = '';
    let listStack = [];
    
    while (i < lines.length) {
      const line = lines[i];
      
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          html += `<pre><code>${codeContent.trim()}</code></pre>`;
          codeContent = '';
          inCodeBlock = false;
        } else {
          if (listStack.length > 0) {
            listStack.forEach(type => html += type === 'ul' ? '</ul>' : '</ol>');
            listStack = [];
          }
          inCodeBlock = true;
        }
        i++;
        continue;
      }
      
      if (inCodeBlock) {
        codeContent += line + '\n';
        i++;
        continue;
      }
      
      if (line.includes('|') && line.trim().startsWith('|')) {
        if (listStack.length > 0) {
          listStack.forEach(type => html += type === 'ul' ? '</ul>' : '</ol>');
          listStack = [];
        }
        const tableData = parseTable(lines, i);
        if (tableData) {
          html += '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 15px 0;">';
          html += '<thead><tr>';
          tableData.headers.forEach(header => {
            html += `<th style="background-color: #3b82f6; color: white; padding: 10px; text-align: left; font-weight: bold;">${formatInlineText(header)}</th>`;
          });
          html += '</tr></thead><tbody>';
          tableData.rows.forEach((row, idx) => {
            html += `<tr style="${idx % 2 === 0 ? 'background-color: #f9fafb;' : ''}">`;
            row.forEach(cell => {
              html += `<td style="padding: 10px; border: 1px solid #ddd;">${formatInlineText(cell)}</td>`;
            });
            html += '</tr>';
          });
          html += '</tbody></table>';
          i += tableData.lineCount;
          continue;
        }
      }
      
      if (line.match(/^#{1,6}\s+/)) {
        if (listStack.length > 0) {
          listStack.forEach(type => html += type === 'ul' ? '</ul>' : '</ol>');
          listStack = [];
        }
        const level = line.match(/^#+/)[0].length;
        const content = line.replace(/^#{1,6}\s+/, '').trim();
        html += `<h${level}>${formatInlineText(content)}</h${level}>`;
      } else if (line.match(/^[-*_]{3,}$/)) {
        if (listStack.length > 0) {
          listStack.forEach(type => html += type === 'ul' ? '</ul>' : '</ol>');
          listStack = [];
        }
        html += '<hr style="border: none; border-top: 2px solid #ddd; margin: 20px 0;" />';
      } else if (line.match(/^[\s]*[•\-\*]\s+/)) {
        const content = line.replace(/^[\s]*[•\-\*]\s+/, '');
        if (listStack[listStack.length - 1] !== 'ul') {
          if (listStack.length > 0 && listStack[listStack.length - 1] === 'ol') {
            html += '</ol>';
            listStack.pop();
          }
          html += '<ul>';
          listStack.push('ul');
        }
        html += `<li>${formatInlineText(content)}</li>`;
      } else if (line.match(/^[\s]*\d+\.\s+/)) {
        const content = line.replace(/^[\s]*\d+\.\s+/, '');
        if (listStack[listStack.length - 1] !== 'ol') {
          if (listStack.length > 0 && listStack[listStack.length - 1] === 'ul') {
            html += '</ul>';
            listStack.pop();
          }
          html += '<ol>';
          listStack.push('ol');
        }
        html += `<li>${formatInlineText(content)}</li>`;
      } else if (line.startsWith('>')) {
        if (listStack.length > 0) {
          listStack.forEach(type => html += type === 'ul' ? '</ul>' : '</ol>');
          listStack = [];
        }
        const content = line.replace(/^>\s*/, '');
        html += `<blockquote style="border-left: 4px solid #3b82f6; padding-left: 15px; margin: 10px 0; color: #666;">${formatInlineText(content)}</blockquote>`;
      } else if (line.trim()) {
        if (listStack.length > 0) {
          listStack.forEach(type => html += type === 'ul' ? '</ul>' : '</ol>');
          listStack = [];
        }
        html += `<p>${formatInlineText(line)}</p>`;
      } else {
        if (listStack.length > 0) {
          listStack.forEach(type => html += type === 'ul' ? '</ul>' : '</ol>');
          listStack = [];
        }
      }
      i++;
    }
    
    if (listStack.length > 0) {
      listStack.forEach(type => html += type === 'ul' ? '</ul>' : '</ol>');
    }
    return html;
  };

  const generateFullHTML = (content) => {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Edusense Document</title><style>body{font-family:'Microsoft YaHei','SimSun',Arial,sans-serif;font-size:14px;line-height:1.8;color:#333;max-width:900px;margin:40px auto;padding:30px;background:white}h1{font-size:28px;font-weight:bold;margin:30px 0 15px 0;color:#1a1a1a;border-bottom:3px solid #3b82f6;padding-bottom:10px}h2{font-size:24px;font-weight:bold;margin:25px 0 12px 0;color:#2d2d2d}h3{font-size:20px;font-weight:bold;margin:20px 0 10px 0;color:#333}h4{font-size:18px;font-weight:bold;margin:18px 0 10px 0;color:#404040}h5{font-size:16px;font-weight:bold;margin:16px 0 8px 0;color:#505050}h6{font-size:14px;font-weight:bold;margin:14px 0 8px 0;color:#606060}p{margin:12px 0;text-align:justify;line-height:1.8}ul,ol{margin:15px 0;padding-left:30px}li{margin:8px 0;line-height:1.6}code{background-color:#f5f5f5;padding:3px 8px;border-radius:4px;font-family:'Consolas','Courier New',monospace;font-size:13px;color:#d63384;border:1px solid #e0e0e0}pre{background-color:#f8f9fa;padding:15px;border-radius:6px;border-left:4px solid #3b82f6;overflow-x:auto;margin:15px 0}pre code{background-color:transparent;padding:0;border:none;color:#333;font-size:13px;line-height:1.6}table{border-collapse:collapse;width:100%;margin:15px 0;border:1px solid #ddd}th{background-color:#3b82f6;color:white;padding:12px;text-align:left;font-weight:bold;border:1px solid #2563eb}td{padding:10px;border:1px solid #ddd}tr:nth-child(even){background-color:#f9fafb}blockquote{border-left:4px solid #3b82f6;padding-left:15px;margin:15px 0;color:#666;font-style:italic}hr{border:none;border-top:2px solid #ddd;margin:20px 0}strong{font-weight:bold;color:#1a1a1a}em{font-style:italic}del{text-decoration:line-through;color:#999}a{color:#3b82f6;text-decoration:underline}</style></head><body>${content}</body></html>`;
  };

  const generateWordDoc = async (htmlContent) => {
    try {
      const fullHTML = generateFullHTML(htmlContent);
      const docHTML = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>${fullHTML.substring(6)}`;
      const blob = new Blob(['\ufeff', docHTML], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edusense_${Date.now()}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      alert('Word文档生成失败');
      return false;
    }
  };

  const handleConversion = async () => {
    if (!inputText.trim()) {
      alert('请输入需要转换的文本');
      return;
    }
    setIsProcessing(true);
    try {
      const htmlContent = parseMarkdownToHTML(inputText);
      const success = await generateWordDoc(htmlContent);
      if (success) {
        const conversion = {
          id: Date.now(),
          date: new Date().toISOString(),
          preview: inputText.substring(0, 50) + '...',
          content: inputText,
          htmlContent: htmlContent,
          charCount: inputText.length
        };
        const newHistory = [conversion, ...conversionHistory].slice(0, 20);
        setConversionHistory(newHistory);
        localStorage.setItem('edusense_history', JSON.stringify(newHistory));
        const updatedUser = { ...user, conversionsCount: (user.conversionsCount || 0) + 1 };
        setUser(updatedUser);
        localStorage.setItem('edusense_user', JSON.stringify(updatedUser));
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setInputText('');
      }
    } catch (error) {
      alert('文档转换失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const redownloadHistory = async (item) => {
    await generateWordDoc(item.htmlContent);
  };

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 mb-4 shadow-lg">
              <svg viewBox="0 0 100 50" className="w-12 h-12"><path d="M15,25 Q25,10 35,25 Q45,40 55,25 Q65,10 75,25 Q85,40 95,25" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round"/></svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Edusense</h1>
            <p className="text-gray-600">AI文本智能格式化平台</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex gap-2 mb-6">
              <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 rounded-lg font-medium transition-all ${authMode === 'login' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>登录</button>
              <button onClick={() => setAuthMode('register')} className={`flex-1 py-2 rounded-lg font-medium transition-all ${authMode === 'register' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>注册</button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400" placeholder="your@email.com" /></div>
              <div className="text-center text-sm text-gray-500">或</div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">手机号</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400" placeholder="138****8888" /></div>
              {authMode === 'register' && (<div><label className="block text-sm font-medium text-gray-700 mb-2">邀请码</label><input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400" placeholder="请输入邀请码" /><p className="text-xs text-gray-500 mt-1">演示用邀请码: EDUSENSE2025</p></div>)}
              <div><label className="block text-sm font-medium text-gray-700 mb-2">密码</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400" placeholder="••••••••" /></div>
              <button onClick={handleAuth} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 shadow-lg">{authMode === 'login' ? '登录' : '注册'}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                <svg viewBox="0 0 100 50" className="w-6 h-6"><path d="M15,25 Q25,10 35,25 Q45,40 55,25 Q65,10 75,25 Q85,40 95,25" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round"/></svg>
              </div>
              <span className="text-2xl font-bold text-gray-800">Edusense</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600"><User size={18} /><span>{user?.email}</span></div>
              <div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-1.5 rounded-full"><Zap size={16} className="text-blue-500" /><span className="font-medium text-blue-700">{user?.conversionsCount || 0} 次转换</span></div>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"><LogOut size={18} /><span>登出</span></button>
            </div>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-start gap-4">
                <Sparkles size={32} className="mt-1" />
                <div><h2 className="text-2xl font-bold mb-2">AI文本转Word文档</h2><p className="text-blue-100 mb-4">完美支持6级标题和所有Markdown语法</p><div className="flex gap-4 text-sm"><div className="flex items-center gap-2"><CheckCircle size={18} /><span>6级标题</span></div><div className="flex items-center gap-2"><CheckCircle size={18} /><span>表格列表</span></div><div className="flex items-center gap-2"><CheckCircle size={18} /><span>零乱码</span></div></div></div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <AlertCircle size={20} className="text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800"><p className="font-medium mb-1">✨ 优化升级</p><div className="text-blue-700 space-y-1"><p>• 支持全部6级标题</p><p>• 彻底清除Markdown残留</p><p>• 完美处理表格格式</p></div></div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Upload size={20} className="text-blue-500" />输入AI文本</label>
                <span className="text-sm text-gray-500">{inputText.length} 字符</span>
              </div>
              <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} className="w-full h-96 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 resize-none font-mono text-sm" placeholder="粘贴AI对话文本..." />
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <button onClick={handleConversion} disabled={isProcessing || !inputText.trim()} className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 text-lg ${isProcessing || !inputText.trim() ? 'bg-gray-300' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg'}`}><Download size={24} />{isProcessing ? '正在生成...' : '生成Word文档'}</button>
              {showSuccess && (<div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700"><CheckCircle size={20} /><span className="font-medium">文档已生成！</span></div>)}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <div className="flex items-center gap-2 mb-4"><Clock size={20} className="text-blue-500" /><h3 className="text-lg font-semibold">转换历史</h3></div>
              {conversionHistory.length === 0 ? (<div className="text-center py-12 text-gray-400"><FileText size={48} className="mx-auto mb-3 opacity-30" /><p>暂无记录</p></div>) : (<div className="space-y-3 max-h-[600px] overflow-y-auto">{conversionHistory.map((item) => (<div key={item.id} className="p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer" onClick={() => redownloadHistory(item)}><div className="flex items-start justify-between mb-2"><FileText size={18} className="text-blue-500 mt-1" /><span className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div><p className="text-sm text-gray-700 line-clamp-2 mb-2">{item.preview}</p><div className="flex items-center justify-between text-xs"><span className="text-gray-500">{item.charCount} 字符</span><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">Word</span></div></div>))}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EdusenseApp;


import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the language types
type Language = 'en' | 'zh';

// Define the strings for each language
const translations = {
  en: {
    title: 'LingoAIO Translation',
    subtitle: 'Translate documents using AI',
    loginTitle: 'Welcome Back',
    loginSubtitle: 'Sign in to access your account',
    username: 'Username',
    password: 'Password',
    login: 'Login',
    logout: 'Logout',
    forgotPassword: 'Forgot password?',
    createAccount: 'Create account',
    uploadTitle: 'Upload Document',
    uploadSubtitle: 'Select a document to translate',
    targetLanguage: 'Target Language',
    llmProvider: 'LLM Provider',
    selectLanguage: 'Select Language',
    selectProvider: 'Select Provider',
    upload: 'Upload',
    uploadingStatus: 'Uploading...',
    uploadSuccess: 'Upload successful',
    uploadError: 'Upload failed',
    translationInProgress: 'Translation in progress',
    translationCompleted: 'Translation completed',
    translationFailed: 'Translation failed',
    download: 'Download',
    noTranslationsFound: 'No translations found',
    fileName: 'File Name',
    targetLang: 'Target Language',
    status: 'Status',
    actions: 'Actions',
    delete: 'Delete',
    confirm: 'Confirm',
    cancel: 'Cancel',
    deleteConfirmation: 'Are you sure you want to delete this translation?',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    pending: 'Pending',
    languageToggle: 'EN / 中',
    dashboard: 'Dashboard',
    translationHistory: 'Translation History',
    documentType: 'Document Type',
    uploadTime: 'Upload Time',
    settings: 'Settings',
    english: 'English',
    chinese: 'Chinese',
    spanish: 'Spanish',
    french: 'French',
    german: 'German',
    japanese: 'Japanese',
    korean: 'Korean',
    russian: 'Russian',
    portuguese: 'Portuguese',
    italian: 'Italian',
    dutch: 'Dutch',
    arabic: 'Arabic',
    hindi: 'Hindi',
    bengali: 'Bengali',
    turkish: 'Turkish',
    vietnamese: 'Vietnamese',
    thai: 'Thai',
    indonesian: 'Indonesian',
    greek: 'Greek',
    polish: 'Polish',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    retry: 'Retry',
    browse: 'Browse',
    dragAndDrop: 'Drag and drop files here or click to browse',
    translateNow: 'Translate Now',
    apiKeysConfigured: 'API Keys Configured',
    downloadTranslation: 'Download Translation',
    deleteTranslation: 'Delete Translation',
    viewError: 'View Error',
    createdAt: 'Created',
    languageLabel: 'Language',
  },
  zh: {
    title: 'LingoAIO 翻译',
    subtitle: '使用AI翻译文档',
    loginTitle: '欢迎回来',
    loginSubtitle: '登录以访问您的帐户',
    username: '用户名',
    password: '密码',
    login: '登录',
    logout: '登出',
    forgotPassword: '忘记密码？',
    createAccount: '创建账户',
    uploadTitle: '上传文档',
    uploadSubtitle: '选择要翻译的文档',
    targetLanguage: '目标语言',
    llmProvider: 'LLM 服务提供商',
    selectLanguage: '选择语言',
    selectProvider: '选择提供商',
    upload: '上传',
    uploadingStatus: '上传中...',
    uploadSuccess: '上传成功',
    uploadError: '上传失败',
    translationInProgress: '翻译进行中',
    translationCompleted: '翻译完成',
    translationFailed: '翻译失败',
    download: '下载',
    noTranslationsFound: '未找到翻译',
    fileName: '文件名',
    targetLang: '目标语言',
    status: '状态',
    actions: '操作',
    delete: '删除',
    confirm: '确认',
    cancel: '取消',
    deleteConfirmation: '您确定要删除此翻译吗？',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    pending: '等待中',
    languageToggle: '英 / 中',
    dashboard: '仪表板',
    translationHistory: '翻译历史',
    documentType: '文档类型',
    uploadTime: '上传时间',
    settings: '设置',
    english: '英语',
    chinese: '中文',
    spanish: '西班牙语',
    french: '法语',
    german: '德语',
    japanese: '日语',
    korean: '韩语',
    russian: '俄语',
    portuguese: '葡萄牙语',
    italian: '意大利语',
    dutch: '荷兰语',
    arabic: '阿拉伯语',
    hindi: '印地语',
    bengali: '孟加拉语',
    turkish: '土耳其语',
    vietnamese: '越南语',
    thai: '泰语',
    indonesian: '印尼语',
    greek: '希腊语',
    polish: '波兰语',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    warning: '警告',
    info: '信息',
    retry: '重试',
    browse: '浏览',
    dragAndDrop: '拖放文件到此处或点击浏览',
    translateNow: '立即翻译',
    apiKeysConfigured: 'API密钥已配置',
    downloadTranslation: '下载翻译',
    deleteTranslation: '删除翻译',
    viewError: '查看错误',
    createdAt: '创建于',
    languageLabel: '语言',
  }
};

// Create the context
type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof typeof translations.en) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Create the provider component
export const LanguageProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook for using the language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    home: 'Home',
    welcomeBack: 'Welcome back',
    manageDocuments: 'Manage your translation projects and documents',
    uploadDocument: 'Upload Document',
    translateDocument: 'Translate Document',
    uploadDescription: 'Upload any document to translate with AI',
    remove: 'Remove',
    fileUploadHeader: 'Drag & Drop',
    fileUploadDesc: 'Drag and drop your files here or click to browse',
    browseFiles: 'Browse Files',
    uploading: 'Uploading...',
    translateButton: 'Translate',
    viewStatus: 'View Status',
    noTranslations: 'No translations found',
    uploadFirst: 'Upload a document to get started',
    invalidFileType: 'Invalid file type',
    pleaseUpload: 'Please upload a supported file type',
    noFileSelected: 'No file selected',
    selectDocument: 'Please select a document to translate',
    targetLanguageRequired: 'Target language required',
    pleaseSelectTarget: 'Please select a target language',
    documentUploaded: 'Document uploaded',
    uploadedDescription: 'Your document has been uploaded and is being processed',
    uploadFailed: 'Upload failed',
    tryAgain: 'Please try again',
    translationDeleted: 'Translation deleted successfully',
    deleteError: 'Error deleting translation',
    translationError: 'Error in translation process',
    deleteConfirm: 'Delete Confirmation',
    deleteConfirmMessage: 'Are you sure you want to delete this translation?',
    refresh: 'Refresh',
    tmxManager: 'TMX Manager',
    allTranslations: 'All Translations',
    inProgress: 'In Progress',
    viewAndManage: 'View and manage your document translations',
    noApiKeysConfigured: 'No API Keys Configured',
    noApiKeysMessage: 'No LLM provider API keys are configured. Please contact your administrator to set up API keys.',
    noFilteredTranslations: 'No translations found for filter:',
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
    home: '首页',
    welcomeBack: '欢迎回来',
    manageDocuments: '管理您的翻译项目和文档',
    uploadDocument: '上传文档',
    translateDocument: '翻译文档',
    uploadDescription: '上传任何文档以使用AI翻译',
    remove: '移除',
    fileUploadHeader: '拖拽上传',
    fileUploadDesc: '将文件拖放到此处或点击浏览',
    browseFiles: '浏览文件',
    uploading: '上传中...',
    translateButton: '翻译',
    viewStatus: '查看状态',
    noTranslations: '未找到翻译',
    uploadFirst: '上传文档以开始',
    invalidFileType: '无效的文件类型',
    pleaseUpload: '请上传支持的文件类型',
    noFileSelected: '未选择文件',
    selectDocument: '请选择要翻译的文档',
    targetLanguageRequired: '需要目标语言',
    pleaseSelectTarget: '请选择目标语言',
    documentUploaded: '文档已上传',
    uploadedDescription: '您的文档已上传并正在处理中',
    uploadFailed: '上传失败',
    tryAgain: '请重试',
    translationDeleted: '翻译已成功删除',
    deleteError: '删除翻译时出错',
    translationError: '翻译过程出错',
    deleteConfirm: '删除确认',
    deleteConfirmMessage: '您确定要删除此翻译吗？',
    refresh: '刷新',
    tmxManager: 'TMX 管理器',
    allTranslations: '所有翻译',
    inProgress: '进行中',
    viewAndManage: '查看和管理您的文档翻译',
    noApiKeysConfigured: '未配置API密钥',
    noApiKeysMessage: '未配置LLM提供商API密钥。请联系管理员设置API密钥。',
    noFilteredTranslations: '未找到筛选的翻译：',
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
  const [language, setLanguageState] = useState<Language>(() => {
    // Load language from localStorage or default to 'en'
    const savedLanguage = localStorage.getItem('ui-language') as Language;
    return savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh') ? savedLanguage : 'en';
  });

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('ui-language', newLanguage);
  };

  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || key;
  };

  useEffect(() => {
    // Save language preference whenever it changes
    localStorage.setItem('ui-language', language);
  }, [language]);

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

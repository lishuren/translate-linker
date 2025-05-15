
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type Language = 'en' | 'zh';

type Translations = {
  [key: string]: {
    en: string;
    zh: string;
  };
};

// Define all translations here
const translations: Translations = {
  welcome: {
    en: 'Welcome back',
    zh: '欢迎回来',
  },
  dashboard: {
    en: 'Dashboard',
    zh: '控制面板',
  },
  manageDocuments: {
    en: 'Manage your document translations here.',
    zh: '在此管理您的文档翻译。',
  },
  uploadDocument: {
    en: 'Upload Document',
    zh: '上传文档',
  },
  translationHistory: {
    en: 'Translation History',
    zh: '翻译历史',
  },
  viewStatus: {
    en: 'View the status and download links for your previous translations.',
    zh: '查看您之前翻译的状态和下载链接。',
  },
  download: {
    en: 'Download',
    zh: '下载',
  },
  delete: {
    en: 'Delete',
    zh: '删除',
  },
  viewError: {
    en: 'View Error',
    zh: '查看错误',
  },
  failed: {
    en: 'Failed',
    zh: '失败',
  },
  processing: {
    en: 'Processing',
    zh: '处理中',
  },
  completed: {
    en: 'Completed',
    zh: '完成',
  },
  pending: {
    en: 'Pending',
    zh: '等待中',
  },
  targetLanguage: {
    en: 'Target Language',
    zh: '目标语言',
  },
  selectLanguage: {
    en: 'Select a language',
    zh: '选择语言',
  },
  login: {
    en: 'Login',
    zh: '登录',
  },
  logout: {
    en: 'Logout',
    zh: '登出',
  },
  home: {
    en: 'Home',
    zh: '首页',
  },
  translate: {
    en: 'Translate Document',
    zh: '翻译文档',
  },
  fileUploadHeader: {
    en: 'Drop your document here',
    zh: '将您的文档拖放到此处',
  },
  fileUploadDesc: {
    en: 'Supports PDF, Word, Excel, PowerPoint, and plain text files',
    zh: '支持PDF，Word，Excel，PowerPoint和纯文本文件',
  },
  browseFiles: {
    en: 'Browse files',
    zh: '浏览文件',
  },
  invalidFileType: {
    en: 'Invalid File Type',
    zh: '无效的文件类型',
  },
  pleaseUpload: {
    en: 'Please upload a document file (PDF, Word, Excel, PowerPoint, or Text).',
    zh: '请上传文档文件（PDF，Word，Excel，PowerPoint或文本）。',
  },
  noFileSelected: {
    en: 'No File Selected',
    zh: '未选择文件',
  },
  selectDocument: {
    en: 'Please select a document to translate.',
    zh: '请选择要翻译的文档。',
  },
  targetLanguageRequired: {
    en: 'Target Language Required',
    zh: '需要目标语言',
  },
  pleaseSelectTarget: {
    en: 'Please select a target language for translation.',
    zh: '请为翻译选择目标语言。',
  },
  loginRequired: {
    en: 'Login Required',
    zh: '需要登录',
  },
  pleaseLoginToUpload: {
    en: 'Please login to upload and translate documents.',
    zh: '请登录以上传和翻译文档。',
  },
  uploading: {
    en: 'Uploading...',
    zh: '上传中...',
  },
  confirmDelete: {
    en: 'Are you sure you want to delete this translation?',
    zh: '您确定要删除此翻译吗？',
  },
  yes: {
    en: 'Yes',
    zh: '是',
  },
  no: {
    en: 'No',
    zh: '否',
  },
  cancel: {
    en: 'Cancel',
    zh: '取消',
  },
  confirm: {
    en: 'Confirm',
    zh: '确认',
  },
  remove: {
    en: 'Remove',
    zh: '移除',
  },
  spanish: {
    en: 'Spanish',
    zh: '西班牙语',
  },
  french: {
    en: 'French',
    zh: '法语',
  },
  german: {
    en: 'German',
    zh: '德语',
  },
  italian: {
    en: 'Italian',
    zh: '意大利语',
  },
  chinese: {
    en: 'Chinese (Simplified)',
    zh: '简体中文',
  },
  japanese: {
    en: 'Japanese',
    zh: '日语',
  },
  korean: {
    en: 'Korean',
    zh: '韩语',
  },
  russian: {
    en: 'Russian',
    zh: '俄语',
  },
  portuguese: {
    en: 'Portuguese',
    zh: '葡萄牙语',
  },
  arabic: {
    en: 'Arabic',
    zh: '阿拉伯语',
  },
  translateNow: {
    en: 'Translate Now',
    zh: '立即翻译',
  },
  switchLanguage: {
    en: 'EN | 中文',
    zh: 'EN | 中文',
  },
  // Additional translations
  welcomeBack: {
    en: 'Welcome back',
    zh: '欢迎回来',
  },
  translateDocument: {
    en: 'Translate a Document',
    zh: '翻译文档',
  },
  uploadDescription: {
    en: 'Upload a document and select the target language for translation.',
    zh: '上传文档并选择翻译的目标语言。',
  },
  translateButton: {
    en: 'Translate Document',
    zh: '翻译文档',
  },
  noTranslations: {
    en: "You haven't translated any documents yet.",
    zh: "您还没有翻译任何文档。",
  },
  uploadFirst: {
    en: "Upload your first document",
    zh: "上传您的第一个文档",
  },
  deleteTranslation: {
    en: "Delete Translation",
    zh: "删除翻译",
  },
  deleteConfirmation: {
    en: "Are you sure you want to delete this translation? This action cannot be undone.",
    zh: "您确定要删除此翻译吗？此操作无法撤消。",
  },
  translationDeleted: {
    en: "Translation deleted successfully",
    zh: "翻译已成功删除",
  },
  translationError: {
    en: "Translation Error",
    zh: "翻译错误",
  },
  documentUploaded: {
    en: "Document Uploaded",
    zh: "文档已上传",
  },
  uploadedDescription: {
    en: "Your document is being translated. You'll receive an email when it's ready.",
    zh: "您的文档正在翻译中。完成后您将收到电子邮件通知。",
  },
  uploadFailed: {
    en: "Upload Failed",
    zh: "上传失败",
  },
  tryAgain: {
    en: "Failed to upload document. Please try again.",
    zh: "上传文档失败。请重试。",
  },
  apiConfigError: {
    en: "No API keys configured for any LLM provider. Please configure at least one provider.",
    zh: "未为任何LLM提供商配置API密钥。请至少配置一个提供商。",
  },
  languageToggle: {
    en: 'EN | 中文',
    zh: '英文 | 中文',
  },
  english: {
    en: 'English',
    zh: '英文',
  },
  chineseSimplified: {
    en: 'Chinese (Simplified)',
    zh: '简体中文',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Try to get saved language preference or default to English
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language;
    return saved === 'zh' ? 'zh' : 'en';
  });

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Translation function
  const t = (key: string): string => {
    if (!translations[key]) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    return translations[key][language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

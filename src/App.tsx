import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Camera, Video, Plus, History, LogOut, 
  Dumbbell, CheckCircle2, AlertCircle, Loader2, Sparkles,
  Trash2, ChevronRight, User as UserIcon, X, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight as ChevronRightIcon, Edit2, Save,
  Zap, Activity, Cpu
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { googleLogin, isGoogleLoginEnabled } from './api/auth';
import * as workoutsApi from './api/workouts';
import * as categoriesApi from './api/categories';
import * as exerciseDefsApi from './api/exerciseDefinitions';
import { extractWorkoutFromVoice, extractWorkoutFromImage, extractWorkoutFromText } from './api/ai';
import type { WorkoutData, WorkoutRecord } from './api/types';
import { workoutDate } from './api/types';
import { 
  format, isToday, isYesterday, startOfDay, 
  startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameDay, addMonths, subMonths, startOfWeek, endOfWeek
} from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Logo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const containerSizes = {
    sm: 'w-10 h-10 rounded-xl',
    md: 'w-16 h-16 rounded-2xl',
    lg: 'w-24 h-24 rounded-[2rem]'
  };
  
  const textSizes = {
    sm: 'text-lg',
    md: 'text-3xl',
    lg: 'text-5xl'
  };

  const barWidths = {
    sm: 'w-1',
    md: 'w-1.5',
    lg: 'w-2.5'
  };

  return (
    <div className={cn(
      "relative flex items-center justify-center bg-zinc-950 overflow-hidden border border-zinc-800 shadow-xl",
      containerSizes[size]
    )}>
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.15),transparent_70%)]" />
      
      <div className="relative z-10 flex items-center gap-0.5 font-black tracking-tighter italic">
        {/* The "A" */}
        <span className={cn("text-white leading-none", textSizes[size])}>A</span>
        
        {/* The "I" as a Dumbbell */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Top Plate */}
          <motion.div 
            animate={{ scaleX: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={cn("bg-blue-500 rounded-full h-1 mb-0.5", size === 'lg' ? 'w-6' : size === 'md' ? 'w-4' : 'w-2.5')} 
          />
          
          {/* Bar (The "I" body) */}
          <div className={cn("bg-gradient-to-b from-blue-500 to-blue-600 rounded-full", barWidths[size], size === 'lg' ? 'h-10' : size === 'md' ? 'h-6' : 'h-4')} />
          
          {/* Bottom Plate */}
          <motion.div 
            animate={{ scaleX: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={cn("bg-blue-600 rounded-full h-1 mt-0.5", size === 'lg' ? 'w-6' : size === 'md' ? 'w-4' : 'w-2.5')} 
          />

          {/* AI Sparkle */}
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute -top-1 -right-2"
          >
            <Sparkles className="text-blue-400 w-3 h-3 fill-blue-400/20" />
          </motion.div>
        </div>
      </div>

      {/* Glass Reflection */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
    </div>
  );
};

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', size?: 'default' | 'sm' | 'lg' | 'icon' }>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    const variants = {
      primary: 'bg-black text-white hover:bg-zinc-800',
      secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
      outline: 'border border-zinc-200 bg-transparent hover:bg-zinc-50',
      ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-600',
      danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
    };
    const sizes = {
      default: 'px-4 py-2 text-sm',
      sm: 'px-3 py-1.5 text-xs',
      lg: 'px-6 py-3 text-base',
      icon: 'p-2',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn('bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm', className)}>
    {children}
  </div>
);

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6 text-center">
          <div className="space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold">Something went wrong.</h2>
            <p className="text-zinc-500">Please refresh the page and try again.</p>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Main App ---

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const { user, loading, login, register, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'today' | 'calendar' | 'exercises'>('today');
  const [language, setLanguage] = useState<'en' | 'zh'>('zh');
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', passwordConfirmation: '' });
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ exercise: '', sets: '', reps: '', weight: '' });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const editAudioChunksRef = useRef<Blob[]>([]);
  const editMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isEditRecording, setIsEditRecording] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ exercise: '', sets: '', reps: '', weight: '' });
  const [isRenamingExercise, setIsRenamingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');

  const [categories, setCategories] = useState<any[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<any[]>([]);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const t = {
    en: {
      title: "Ai Fitness Assistant",
      subtitle: "Record your workouts with your voice or camera.",
      signIn: "Sign in with Google",
      signInEmail: "Sign in",
      register: "Create account",
      email: "Email",
      password: "Password",
      name: "Name",
      confirmPassword: "Confirm password",
      haveAccount: "Already have an account? Sign in",
      noAccount: "Don't have an account? Register",
      googleNotConfigured: "Google sign-in is not configured. Use email login, or ask the admin to set GOOGLE_CLIENT_ID in api/.env.",
      today: "Today",
      calendar: "Calendar",
      exercises: "Exercises",
      listening: "Listening...",
      howWasSet: "How was your set?",
      voicePrompt: "Tell me the exercise, sets, and reps",
      tapToLog: "Tap to log with voice",
      photoLog: "Photo Log",
      manualLog: "Manual Log",
      recentWorkouts: "Recent Workouts",
      noWorkouts: "No workouts today",
      total: "Total",
      lastActive: "Last active",
      sessions: "Sessions",
      maxWeight: "Max Weight",
      totalSets: "Total Sets",
      editWorkout: "Edit Workout",
      delete: "Delete",
      saveManual: "Save Manual Changes",
      voiceUpdate: "Quick update with voice",
      aiUpdatePlaceholder: "AI update (e.g. 4 sets 12 reps 70kg)",
      progressionHistory: "Progression & History",
      exerciseName: "Exercise Name",
      sets: "Sets",
      reps: "Reps",
      weight: "Weight",
      saveWorkout: "Save Workout",
      errorTitle: "Something went wrong.",
      errorSubtitle: "Please refresh the page and try again.",
      refresh: "Refresh Page",
      yesterday: "Yesterday",
      justNow: "Just now",
      listeningFor: "Listening for sets/reps/weight...",
      enterDetails: "Enter your workout details",
      aiUpdating: "AI is updating...",
      noRecords: "No records for this day.",
      setsLabel: "sets",
      repsLabel: "reps",
      kg: "kg",
      snapEquipment: "Snap your equipment",
      enterManually: "Enter details manually",
      noWorkoutsYet: "No workouts today yet.",
      todaysSession: "Today's Session",
      exercisePlaceholder: "e.g. Bench Press",
      manageCategories: "Manage Categories",
      addCategory: "Add Category",
      editCategory: "Edit Category",
      categoryName: "Category Name",
      selectCategory: "Select Category",
      uncategorized: "Uncategorized",
      all: "All",
    },
    zh: {
      title: "Ai 健身助手",
      subtitle: "使用語音或相機記錄您的健身。",
      signIn: "使用 Google 登入",
      signInEmail: "登入",
      register: "建立帳號",
      email: "電子郵件",
      password: "密碼",
      name: "名稱",
      confirmPassword: "確認密碼",
      haveAccount: "已有帳號？登入",
      noAccount: "還沒有帳號？註冊",
      googleNotConfigured: "Google 登入尚未設定。請使用 Email 登入，或由管理員在 api/.env 設定 GOOGLE_CLIENT_ID。",
      today: "今天",
      calendar: "日曆",
      exercises: "動作庫",
      listening: "正在聆聽...",
      howWasSet: "用語音及照片來記錄你的運動",
      voicePrompt: "告訴我動作、組數和次數",
      tapToLog: "點擊開始語音記錄",
      photoLog: "照片記錄",
      manualLog: "手動記錄",
      recentWorkouts: "最近的健身",
      noWorkouts: "今天沒有健身記錄",
      total: "總計",
      lastActive: "上次活動",
      sessions: "次數",
      maxWeight: "最大重量",
      totalSets: "總組數",
      editWorkout: "編輯健身",
      delete: "刪除",
      saveManual: "儲存手動修改",
      voiceUpdate: "語音快速更新",
      aiUpdatePlaceholder: "AI 更新 (例如：4組 12次 70公斤)",
      progressionHistory: "進度與歷史",
      exerciseName: "動作名稱",
      sets: "組數",
      reps: "次數",
      weight: "重量",
      saveWorkout: "儲存健身",
      errorTitle: "發生錯誤。",
      errorSubtitle: "請重新整理頁面並重試。",
      refresh: "重新整理頁面",
      yesterday: "昨天",
      justNow: "剛剛",
      listeningFor: "正在聆聽組數/次數/重量...",
      enterDetails: "輸入您的健身詳情",
      aiUpdating: "AI 正在更新...",
      noRecords: "這天沒有記錄。",
      setsLabel: "組",
      repsLabel: "次",
      kg: "公斤",
      snapEquipment: "拍攝您的器材",
      enterManually: "手動輸入詳情",
      noWorkoutsYet: "今天還沒有健身記錄。",
      todaysSession: "今日健身內容",
      exercisePlaceholder: "例如：臥推",
      manageCategories: "管理分類",
      addCategory: "新增分類",
      editCategory: "編輯分類",
      categoryName: "分類名稱",
      selectCategory: "選擇分類",
      uncategorized: "未分類",
      all: "全部",
    }
  }[language];

  // Group workouts by date
  const groupedWorkouts = workouts.reduce((groups: Record<string, WorkoutRecord[]>, workout) => {
    const date = startOfDay(workoutDate(workout)).toISOString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(workout);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedWorkouts).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const uniqueExercises = Array.from(new Set(workouts.map(w => w.exercise?.toLowerCase())))
    .filter(Boolean)
    .map(name => {
      const exerciseWorkouts = workouts.filter(w => w.exercise?.toLowerCase() === name);
      const libItem = exerciseLibrary.find(item => item.name.toLowerCase() === name);
      const category = categories.find(c => c.id === libItem?.categoryId);
      
      return {
        name: exerciseWorkouts[0].exercise, // Use original casing from first entry
        count: exerciseWorkouts.length,
        lastActive: exerciseWorkouts[0] ? workoutDate(exerciseWorkouts[0]) : new Date(),
        maxWeight: Math.max(...exerciseWorkouts.map(w => w.weight || 0)),
        totalSets: exerciseWorkouts.reduce((sum, w) => sum + (Number(w.sets) || 0), 0),
        categoryId: libItem?.categoryId || 'uncategorized',
        categoryName: category?.name || t.uncategorized
      };
    })
    .sort((a, b) => b.count - a.count);

  const filteredExercises = selectedCategoryFilter === 'all' 
    ? uniqueExercises 
    : uniqueExercises.filter(ex => ex.categoryId === selectedCategoryFilter);

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return t.today;
    if (isYesterday(date)) return t.yesterday;
    return format(date, 'MMMM d, yyyy');
  };

  // Calendar logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const hasWorkoutOnDay = (date: Date) => {
    const dateStr = startOfDay(date).toISOString();
    return !!groupedWorkouts[dateStr];
  };

  const loadWorkouts = async () => {
    if (!user) return;
    try {
      const data = await workoutsApi.fetchWorkouts();
      setWorkouts(data);
    } catch (err) {
      console.error('Failed to load workouts', err);
      setError('Failed to load workouts.');
    }
  };

  const loadCategories = async () => {
    if (!user) return;
    try {
      const data = await categoriesApi.fetchCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const loadExerciseLibrary = async () => {
    if (!user) return;
    try {
      const data = await exerciseDefsApi.fetchExerciseDefinitions();
      setExerciseLibrary(data);
    } catch (err) {
      console.error('Failed to load exercise library', err);
    }
  };

  const refreshData = async () => {
    await Promise.all([loadWorkouts(), loadCategories(), loadExerciseLibrary()]);
  };

  useEffect(() => {
    if (editingWorkout) {
      setEditForm({
        exercise: editingWorkout.exercise || '',
        sets: editingWorkout.sets?.toString() || '',
        reps: editingWorkout.reps?.toString() || '',
        weight: editingWorkout.weight?.toString() || '',
      });
    }
  }, [editingWorkout]);

  const handleManualUpdate = async () => {
    if (!editingWorkout) return;
    const data: WorkoutData = {
      exercise: editForm.exercise,
      sets: editForm.sets ? parseInt(editForm.sets) : null,
      reps: editForm.reps ? parseInt(editForm.reps) : null,
      weight: editForm.weight ? parseFloat(editForm.weight) : null,
    };
    await updateWorkout(editingWorkout.id, data);
  };

  const handleManualSave = async () => {
    if (!manualForm.exercise) {
      setError("Please enter an exercise name.");
      return;
    }
    setIsProcessing(true);
    try {
      await saveWorkout({
        exercise: manualForm.exercise,
        sets: manualForm.sets ? parseInt(manualForm.sets) : undefined,
        reps: manualForm.reps ? parseInt(manualForm.reps) : undefined,
        weight: manualForm.weight ? parseFloat(manualForm.weight) : undefined
      }, 'manual');
      setIsManualModalOpen(false);
      setManualForm({ exercise: '', sets: '', reps: '', weight: '' });
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save workout.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setWorkouts([]);
      setCategories([]);
      setExerciseLibrary([]);
      return;
    }
    refreshData();
  }, [user]);

  useEffect(() => {
    if (!user) {
      isGoogleLoginEnabled().then(setGoogleEnabled);
      const params = new URLSearchParams(window.location.search);
      if (params.get('auth_error') === 'google_not_configured') {
        setError(t.googleNotConfigured);
      }
    }
  }, [user, language]);

  const handleGoogleLogin = () => {
    if (!googleEnabled) {
      setError(t.googleNotConfigured);
      return;
    }
    googleLogin();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    setError(null);
    try {
      if (authMode === 'register') {
        await register(
          authForm.name,
          authForm.email,
          authForm.password,
          authForm.passwordConfirmation
        );
      } else {
        await login(authForm.email, authForm.password);
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setError(msg || 'Authentication failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !user) return;
    try {
      await categoriesApi.createCategory(newCategoryName.trim());
      setNewCategoryName('');
      await loadCategories();
    } catch (err) {
      console.error(err);
      setError('Failed to add category.');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return;
    try {
      await categoriesApi.updateCategory(editingCategory.id, newCategoryName.trim());
      setEditingCategory(null);
      setNewCategoryName('');
      await loadCategories();
    } catch (err) {
      console.error(err);
      setError('Failed to update category.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await categoriesApi.deleteCategory(id);
      await loadCategories();
    } catch (err) {
      console.error(err);
      setError('Failed to delete category.');
    }
  };

  const handleSetExerciseCategory = async (exerciseName: string, categoryId: string) => {
    if (!user) return;
    try {
      await exerciseDefsApi.upsertExerciseDefinition(
        exerciseName,
        categoryId === 'uncategorized' ? null : categoryId
      );
      await loadExerciseLibrary();
    } catch (err) {
      console.error(err);
      setError('Failed to update exercise category.');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error("Recording error:", err);
      setError("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const data = await extractWorkoutFromVoice(blob, language);
      if (data && data.exercise) {
        await saveWorkout(data, 'voice');
      } else {
        setError("Could not understand the workout. Try speaking clearly.");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Processing error:", err);
      setError("Error processing audio.");
      setIsProcessing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    try {
      const data = await extractWorkoutFromImage(file, language);
      if (data && data.exercise) {
        await saveWorkout(data, 'photo');
      } else {
        setError("Could not identify exercise from photo.");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Image error:", err);
      setError("Error processing image.");
      setIsProcessing(false);
    }
  };

  const saveWorkout = async (data: WorkoutData, type: string) => {
    if (!user) return;
    setIsProcessing(true);
    try {
      await workoutsApi.createWorkout({
        ...data,
        input_type: type,
      });
      await loadWorkouts();
    } catch (err) {
      console.error(err);
      setError('Failed to save workout.');
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteWorkout = async (id: string) => {
    try {
      await workoutsApi.deleteWorkout(id);
      setEditingWorkout(null);
      await loadWorkouts();
    } catch (err) {
      console.error(err);
      setError('Failed to delete workout.');
    }
  };

  const updateWorkout = async (id: string, data: Partial<WorkoutData>) => {
    setIsProcessing(true);
    try {
      const updates: Partial<WorkoutData> = {};
      if (data.reps !== null && data.reps !== undefined) updates.reps = data.reps;
      if (data.sets !== null && data.sets !== undefined) updates.sets = data.sets;
      if (data.weight !== null && data.weight !== undefined) updates.weight = data.weight;
      if (data.exercise !== null && data.exercise !== undefined) updates.exercise = data.exercise;

      if (Object.keys(updates).length > 0) {
        await workoutsApi.updateWorkout(id, updates);
      }
      setEditingWorkout(null);
      await loadWorkouts();
    } catch (err) {
      console.error(err);
      setError('Failed to update workout.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGlobalRename = async () => {
    if (!newExerciseName.trim() || !selectedExercise) return;
    setIsProcessing(true);
    try {
      await exerciseDefsApi.renameExercise(selectedExercise, newExerciseName.trim());
      setSelectedExercise(newExerciseName.trim());
      setIsRenamingExercise(false);
      await refreshData();
    } catch (err) {
      console.error(err);
      setError('Failed to rename exercise.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startEditRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      editMediaRecorderRef.current = mediaRecorder;
      editAudioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        editAudioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(editAudioChunksRef.current, { type: 'audio/webm' });
        await processEditAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsEditRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
      setError("Could not access microphone.");
    }
  };

  const stopEditRecording = () => {
    if (editMediaRecorderRef.current && isEditRecording) {
      editMediaRecorderRef.current.stop();
      setIsEditRecording(false);
    }
  };

  const processEditAudio = async (blob: Blob) => {
    if (!editingWorkout) return;
    setIsProcessing(true);
    try {
      const data = await extractWorkoutFromVoice(blob, language);
      if (data) {
        const filteredData = {
          sets: data.sets,
          reps: data.reps,
          weight: data.weight
        };
        await updateWorkout(editingWorkout.id, filteredData);
      } else {
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Processing error:", err);
      setError("Error processing audio.");
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!selectedExercise) {
      setIsRenamingExercise(false);
      setNewExerciseName('');
    }
  }, [selectedExercise]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-6">
        <div className="w-full max-w-md text-center space-y-8">
          <div className="space-y-2">
            <div className="flex justify-center mb-8">
              <Logo size="lg" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900">{t.title}</h1>
            <p className="text-zinc-500 text-lg">{t.subtitle}</p>
          </div>
          <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400 uppercase">{t.name}</label>
                <input
                  type="text"
                  required
                  value={authForm.name}
                  onChange={(e) => setAuthForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-4"
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 uppercase">{t.email}</label>
              <input
                type="email"
                required
                value={authForm.email}
                onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-4"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 uppercase">{t.password}</label>
              <input
                type="password"
                required
                minLength={8}
                value={authForm.password}
                onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-4"
              />
            </div>
            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400 uppercase">{t.confirmPassword}</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={authForm.passwordConfirmation}
                  onChange={(e) => setAuthForm((f) => ({ ...f, passwordConfirmation: e.target.value }))}
                  className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-4"
                />
              </div>
            )}
            <Button type="submit" disabled={authSubmitting} className="w-full py-4">
              {authSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : authMode === 'register' ? t.register : t.signInEmail}
            </Button>
          </form>
          {googleEnabled ? (
            <Button variant="outline" onClick={handleGoogleLogin} className="w-full py-4 text-base">
              {t.signIn}
            </Button>
          ) : (
            <p className="text-sm text-zinc-500 text-center px-2">{t.googleNotConfigured}</p>
          )}
          <button
            type="button"
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="text-sm text-zinc-500 hover:text-zinc-800"
          >
            {authMode === 'login' ? t.noAccount : t.haveAccount}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="font-bold text-xl tracking-tight">{t.title}</span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              className="px-3 py-1 text-xs font-bold"
            >
              {language === 'en' ? '中文' : 'EN'}
            </Button>
            <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-zinc-200" />
            <Button variant="ghost" onClick={handleLogout} className="p-2">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-12">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
          )}

          {activeTab === 'today' && (
            <>
              {/* Voice Recording Section */}
              <section className="text-center space-y-8 py-12">
                <div className="relative inline-block">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                      "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative z-10",
                      isRecording ? "bg-red-500 scale-110" : "bg-black hover:bg-zinc-800"
                    )}
                  >
                    {isRecording ? (
                      <div className="relative">
                        <div className="absolute inset-0 animate-ping bg-red-400 rounded-full opacity-75" />
                        <Mic className="w-12 h-12 text-white relative z-10" />
                      </div>
                    ) : (
                      <Mic className="w-12 h-12 text-white" />
                    )}
                  </motion.button>
                  {isRecording && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute -inset-4 border-2 border-red-200 rounded-full animate-pulse"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">
                    {isRecording ? t.listening : t.howWasSet}
                  </h2>
                  <p className="text-zinc-500 font-medium">
                    {isRecording ? t.voicePrompt : t.tapToLog}
                  </p>
                </div>
              </section>

              {/* Quick Actions */}
              <section className="grid grid-cols-2 gap-4">
                <Card 
                  onClick={() => {
                    document.getElementById('image-upload')?.click();
                    setSelectedExercise(null);
                    setEditingWorkout(null);
                  }}
                  className="flex flex-col items-center gap-4 hover:border-zinc-300 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-black transition-colors">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{t.photoLog}</p>
                    <p className="text-xs text-zinc-400">{t.snapEquipment}</p>
                  </div>
                  <input 
                    type="file" 
                    id="image-upload" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload}
                  />
                </Card>
                <Card 
                  onClick={() => {
                    setIsManualModalOpen(true);
                    setSelectedExercise(null);
                    setEditingWorkout(null);
                  }}
                  className="flex flex-col items-center gap-4 hover:border-zinc-300 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-black transition-colors">
                    <Edit2 className="w-6 h-6" />
                  </div>
                  <div className="text-center w-full">
                    <p className="font-bold">{t.manualLog}</p>
                    <p className="text-xs text-zinc-400">{t.enterManually}</p>
                  </div>
                </Card>
              </section>

              {isProcessing && (
                <div className="flex items-center justify-center gap-3 py-4 text-zinc-500 animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">AI is analyzing your workout...</span>
                </div>
              )}

              {/* Today's Summary */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    {t.todaysSession}
                  </h2>
                </div>

                {groupedWorkouts[startOfDay(new Date()).toISOString()] ? (
                  <div className="space-y-3">
                    {groupedWorkouts[startOfDay(new Date()).toISOString()].map((workout: any) => (
                      <div 
                        key={workout.id} 
                        onClick={() => {
                          setEditingWorkout(workout);
                          setSelectedExercise(null);
                        }}
                        className="group bg-white border border-zinc-100 rounded-2xl p-4 flex items-center justify-between hover:border-zinc-200 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-black transition-colors">
                            {workout.inputType === 'voice' ? <Mic className="w-5 h-5" /> : 
                             workout.inputType === 'photo' ? <Camera className="w-5 h-5" /> :
                             <Plus className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-zinc-900 capitalize">{workout.exercise}</h3>
                            <div className="flex items-center gap-3 text-sm text-zinc-500">
                              {workout.sets && <span>{workout.sets} {t.setsLabel}</span>}
                              {workout.reps && <span>{workout.reps} {t.repsLabel}</span>}
                              {workout.weight && <span>{workout.weight}{t.kg}</span>}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-zinc-100 rounded-3xl">
                    <p className="text-zinc-400">{t.noWorkoutsYet}</p>
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === 'calendar' && (
            <section className="space-y-8">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold">{format(currentMonth, 'MMMM yyyy')}</h2>
                  <div className="flex gap-2">
                    <Button variant="ghost" className="p-2" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button variant="ghost" className="p-2" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                      <ChevronRightIcon className="w-6 h-6" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, i) => {
                    const dateStr = startOfDay(day).toISOString();
                    const hasWorkouts = groupedWorkouts[dateStr]?.length > 0;
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all",
                          !isCurrentMonth && "opacity-20",
                          isSelected ? "bg-black text-white shadow-xl scale-110 z-10" : "hover:bg-zinc-100",
                          isToday(day) && !isSelected && "border border-zinc-200"
                        )}
                      >
                        <span className="text-sm font-bold">{format(day, 'd')}</span>
                        {hasWorkouts && !isSelected && (
                          <div className="absolute bottom-2 w-1.5 h-1.5 bg-black rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>

              {selectedDate && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {format(selectedDate, 'MMMM d, yyyy')}
                  </h3>
                  {!groupedWorkouts[startOfDay(selectedDate).toISOString()] ? (
                    <div className="text-center py-12 border-2 border-dashed border-zinc-100 rounded-3xl">
                      <p className="text-zinc-400">{t.noRecords}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {groupedWorkouts[startOfDay(selectedDate).toISOString()].map((workout: any) => (
                        <div 
                          key={workout.id} 
                          onClick={() => {
                            setEditingWorkout(workout);
                            setSelectedExercise(null);
                          }}
                          className="group bg-white border border-zinc-100 rounded-2xl p-4 flex items-center justify-between hover:border-zinc-200 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-black transition-colors">
                              {workout.inputType === 'voice' ? <Mic className="w-5 h-5" /> : 
                               workout.inputType === 'photo' ? <Camera className="w-5 h-5" /> :
                               <Plus className="w-5 h-5" />}
                            </div>
                            <div>
                              <h3 className="font-bold text-zinc-900 capitalize">{workout.exercise}</h3>
                              <div className="flex items-center gap-3 text-sm text-zinc-500">
                                {workout.sets && <span>{workout.sets} {t.setsLabel}</span>}
                                {workout.reps && <span>{workout.reps} {t.repsLabel}</span>}
                                {workout.weight && <span>{workout.weight}{t.kg}</span>}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {activeTab === 'exercises' && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{t.exercises}</h2>
                  <p className="text-xs text-zinc-400 font-medium">{uniqueExercises.length} {t.total}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsManagingCategories(true)} className="gap-2">
                  <Edit2 className="w-3 h-3" />
                  {t.manageCategories}
                </Button>
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                <Button 
                  variant={selectedCategoryFilter === 'all' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedCategoryFilter('all')}
                  className="whitespace-nowrap"
                >
                  {t.all}
                </Button>
                {categories.map(cat => (
                  <Button 
                    key={cat.id}
                    variant={selectedCategoryFilter === cat.id ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className="whitespace-nowrap"
                  >
                    {cat.name}
                  </Button>
                ))}
                <Button 
                  variant={selectedCategoryFilter === 'uncategorized' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedCategoryFilter('uncategorized')}
                  className="whitespace-nowrap"
                >
                  {t.uncategorized}
                </Button>
              </div>
              
              <div className="grid gap-4">
                {filteredExercises.map((ex) => (
                  <Card 
                    key={ex.name}
                    onClick={() => {
                      setSelectedExercise(ex.name);
                      setEditingWorkout(null);
                    }}
                    className="p-6 hover:border-zinc-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-black transition-colors">
                          <Dumbbell className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg capitalize">{ex.name}</h3>
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              {ex.categoryName}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400">{t.lastActive} {format(ex.lastActive, 'MMM d')}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-black transition-colors" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-50">
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">{t.sessions}</p>
                        <p className="font-bold">{ex.count}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">{t.maxWeight}</p>
                        <p className="font-bold">{ex.maxWeight}kg</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">{t.totalSets}</p>
                        <p className="font-bold">{ex.totalSets}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-zinc-100 px-6 py-4 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-around">
          <button 
            onClick={() => {
              setActiveTab('today');
              setSelectedExercise(null);
              setEditingWorkout(null);
            }}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              activeTab === 'today' ? "text-black scale-110" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-colors",
              activeTab === 'today' ? "bg-zinc-100" : "bg-transparent"
            )}>
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{t.today}</span>
          </button>
          <button 
            onClick={() => {
              setActiveTab('calendar');
              setSelectedExercise(null);
              setEditingWorkout(null);
            }}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              activeTab === 'calendar' ? "text-black scale-110" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-colors",
              activeTab === 'calendar' ? "bg-zinc-100" : "bg-transparent"
            )}>
              <CalendarIcon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{t.calendar}</span>
          </button>
          <button 
            onClick={() => {
              setActiveTab('exercises');
              setSelectedExercise(null);
              setEditingWorkout(null);
            }}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              activeTab === 'exercises' ? "text-black scale-110" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-colors",
              activeTab === 'exercises' ? "bg-zinc-100" : "bg-transparent"
            )}>
              <Dumbbell className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{t.exercises}</span>
          </button>
        </div>
      </nav>

      {/* Workout Edit Modal */}
      {/* Category Management Modal */}
      <AnimatePresence>
        {isManagingCategories && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManagingCategories(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{t.manageCategories}</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsManagingCategories(false)}>
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder={t.categoryName}
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 bg-zinc-100 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-black transition-all"
                  />
                  <Button onClick={editingCategory ? handleUpdateCategory : handleAddCategory}>
                    {editingCategory ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </Button>
                </div>

                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-2xl group">
                      <span className="font-medium">{cat.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => {
                          setEditingCategory(cat);
                          setNewCategoryName(cat.name);
                        }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingWorkout && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingWorkout(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold capitalize">{t.editWorkout}</h2>
                  <p className="text-zinc-500 text-sm">{editingWorkout.exercise}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="danger" onClick={() => deleteWorkout(editingWorkout.id)} className="p-2">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" onClick={() => setEditingWorkout(null)} className="p-2">
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              </div>
              
              <div className="p-8 space-y-8 relative">
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-b-[2.5rem]">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 animate-spin text-black" />
                      <p className="text-sm font-bold">{t.aiUpdating}</p>
                    </div>
                  </div>
                )}
                
                {/* Manual Edit Fields */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider ml-1">{t.exerciseName}</label>
                    <input 
                      type="text" 
                      value={editForm.exercise}
                      onChange={(e) => setEditForm(prev => ({ ...prev, exercise: e.target.value }))}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 px-4 font-bold text-lg focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider ml-1">{t.sets}</label>
                      <input 
                        type="number" 
                        value={editForm.sets}
                        onChange={(e) => setEditForm(prev => ({ ...prev, sets: e.target.value }))}
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 px-4 text-center font-bold text-lg focus:ring-2 focus:ring-black transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider ml-1">{t.reps}</label>
                      <input 
                        type="number" 
                        value={editForm.reps}
                        onChange={(e) => setEditForm(prev => ({ ...prev, reps: e.target.value }))}
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 px-4 text-center font-bold text-lg focus:ring-2 focus:ring-black transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider ml-1">{t.weight} ({t.kg})</label>
                      <input 
                        type="number" 
                        step="0.5"
                        value={editForm.weight}
                        onChange={(e) => setEditForm(prev => ({ ...prev, weight: e.target.value }))}
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 px-4 text-center font-bold text-lg focus:ring-2 focus:ring-black transition-all"
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full py-4 text-base flex items-center gap-2"
                    onClick={handleManualUpdate}
                  >
                    <Save className="w-5 h-5" />
                    {t.saveManual}
                  </Button>
                </div>

                <div className="h-px bg-zinc-100" />

                {/* Voice Edit */}
                <div className="flex flex-col items-center gap-4">
                  <button 
                    onClick={isEditRecording ? stopEditRecording : startEditRecording}
                    className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
                      isEditRecording ? "bg-red-500 animate-pulse scale-110" : "bg-black hover:bg-zinc-800"
                    )}
                  >
                    <Mic className={cn("w-8 h-8", "text-white")} />
                  </button>
                  <p className="text-xs font-medium text-zinc-500">
                    {isEditRecording ? t.listeningFor : t.voiceUpdate}
                  </p>
                </div>

                {/* Text Edit (AI) */}
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                      <Edit2 className="w-5 h-5" />
                    </div>
                    <input 
                      type="text" 
                      id="edit-input"
                      placeholder={t.aiUpdatePlaceholder}
                      className="w-full bg-zinc-100 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-black transition-all"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value;
                          e.currentTarget.value = '';
                          setIsProcessing(true);
                          const data = await extractWorkoutFromText(val, language);
                          if (data) {
                            // Only update sets, reps, and weight, preserving the original exercise name
                            const filteredData = {
                              sets: data.sets,
                              reps: data.reps,
                              weight: data.weight
                            };
                            await updateWorkout(editingWorkout.id, filteredData);
                          } else {
                            setIsProcessing(false);
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exercise History Modal */}
      <AnimatePresence>
        {selectedExercise && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExercise(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex-1 mr-4">
                  {isRenamingExercise ? (
                    <div className="flex items-center gap-2">
                      <input 
                        autoFocus
                        value={newExerciseName}
                        onChange={(e) => setNewExerciseName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGlobalRename()}
                        className="text-2xl font-bold bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1 w-full focus:ring-2 focus:ring-black outline-none"
                      />
                      <Button onClick={handleGlobalRename} className="p-2 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" onClick={() => setIsRenamingExercise(false)} className="p-2 shrink-0">
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 group">
                        <h2 className="text-2xl font-bold capitalize">{selectedExercise}</h2>
                        <button 
                          onClick={() => {
                            setIsRenamingExercise(true);
                            setNewExerciseName(selectedExercise || '');
                          }}
                          className="p-1 text-zinc-300 hover:text-black transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <select 
                          className="text-xs font-bold text-zinc-500 bg-zinc-100 rounded-lg px-2 py-1 outline-none border-none focus:ring-1 focus:ring-black cursor-pointer"
                          value={uniqueExercises.find(ex => ex.name.toLowerCase() === selectedExercise?.toLowerCase())?.categoryId || 'uncategorized'}
                          onChange={(e) => handleSetExerciseCategory(selectedExercise!, e.target.value)}
                        >
                          <option value="uncategorized">{t.uncategorized}</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  <p className="text-zinc-500 text-sm">{t.progressionHistory}</p>
                </div>
                <Button variant="ghost" onClick={() => setSelectedExercise(null)} className="p-2">
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {workouts
                  .filter(w => w.exercise?.toLowerCase() === selectedExercise.toLowerCase())
                  .map((w, idx) => (
                    <div key={w.id} className="flex items-start gap-4 relative">
                      {idx !== workouts.filter(w => w.exercise?.toLowerCase() === selectedExercise.toLowerCase()).length - 1 && (
                        <div className="absolute left-6 top-12 bottom-0 w-px bg-zinc-100" />
                      )}
                      <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center shrink-0 border border-zinc-100">
                        <Dumbbell className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-zinc-900">
                            {format(workoutDate(w), 'MMM d, yyyy')}
                          </p>
                          <span className="text-xs text-zinc-400">{format(workoutDate(w), 'HH:mm')}</span>
                        </div>
                        <div className="bg-zinc-50 rounded-2xl p-4 flex items-center justify-between gap-6">
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{t.sets}</p>
                              <p className="text-lg font-bold">{w.sets || '-'}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{t.reps}</p>
                              <p className="text-lg font-bold">{w.reps || '-'}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{t.weight}</p>
                              <p className="text-lg font-bold">{w.weight ? `${w.weight}${t.kg}` : '-'}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            onClick={() => {
                              setEditingWorkout(w);
                              setSelectedExercise(null);
                            }}
                            className="p-2 text-zinc-400 hover:text-black"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Log Modal */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManualModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{t.manualLog}</h2>
                  <p className="text-zinc-500 text-sm">{t.enterDetails}</p>
                </div>
                <Button variant="ghost" onClick={() => setIsManualModalOpen(false)} className="p-2">
                  <X className="w-6 h-6" />
                </Button>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider ml-1">{t.exerciseName}</label>
                    <input 
                      type="text" 
                      placeholder={t.exercisePlaceholder}
                      value={manualForm.exercise}
                      onChange={(e) => setManualForm(prev => ({ ...prev, exercise: e.target.value }))}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 px-4 font-bold text-lg focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider ml-1">{t.sets}</label>
                      <input 
                        type="number" 
                        value={manualForm.sets}
                        onChange={(e) => setManualForm(prev => ({ ...prev, sets: e.target.value }))}
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 px-4 text-center font-bold text-lg focus:ring-2 focus:ring-black transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider ml-1">{t.reps}</label>
                      <input 
                        type="number" 
                        value={manualForm.reps}
                        onChange={(e) => setManualForm(prev => ({ ...prev, reps: e.target.value }))}
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 px-4 text-center font-bold text-lg focus:ring-2 focus:ring-black transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider ml-1">{t.weight} ({t.kg})</label>
                      <input 
                        type="number" 
                        step="0.5"
                        value={manualForm.weight}
                        onChange={(e) => setManualForm(prev => ({ ...prev, weight: e.target.value }))}
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 px-4 text-center font-bold text-lg focus:ring-2 focus:ring-black transition-all"
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full py-4 text-base flex items-center gap-2"
                    onClick={handleManualSave}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {t.saveWorkout}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

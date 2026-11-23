import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import {
  Mail,
  MessageSquarePlus,
  ShieldCheck,
  Send,
  X,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Crown,
  Inbox,
  Megaphone,
  Reply,
  ExternalLink,
  Tablet,
  Smartphone,
  Monitor,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ADMIN_EMAIL,
  auth,
  db,
  ensureGmailSendToken,
  isAdminUser,
  signInWithGoogleFirebase,
  subscribeAuthState,
  OperationType,
  handleFirestoreError
} from '../firebase';
import { loginWithGoogleAccount } from '../utils/googleAuth';
import { buildFeedbackMailtoUrl, sendFeedbackViaGmail } from '../utils/gmailSender';
import { getDeviceCategory, DeviceCategory } from '../utils/device';
import { soundManager } from '../game/audio';

export interface MailboxDoc {
  id: string;
  recipientType: 'direct' | 'broadcast';
  recipientUid: string;
  recipientEmail: string;
  senderEmail: string;
  senderName: string;
  title: string;
  body: string;
  type: 'system' | 'reply' | 'direct' | 'reward';
  relatedFeedbackId: string;
  isRead: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface FeedbackDoc {
  id: string;
  senderUid: string;
  senderName: string;
  senderEmail: string;
  category: 'suggestion' | 'bug' | 'balance' | 'other';
  subject: string;
  message: string;
  deviceType: DeviceCategory;
  emailedToAdmin: boolean;
  status: 'unread' | 'read' | 'replied';
  adminReply: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

interface MailboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'mailbox' | 'feedback' | 'admin';
  onUnreadCountChange?: (count: number) => void;
}

const CATEGORY_LABELS: Record<FeedbackDoc['category'], string> = {
  suggestion: '💡 功能建議',
  bug: '🐛 問題回報',
  balance: '⚖️ 玩法與平衡',
  other: '📝 其他意見'
};

function formatTimestamp(ts: Timestamp | null): string {
  if (!ts || typeof ts.toDate !== 'function') return '剛剛';
  try {
    return ts.toDate().toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '剛剛';
  }
}

export const MailboxModal: React.FC<MailboxModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'mailbox',
  onUnreadCountChange
}) => {
  const [activeTab, setActiveTab] = useState<'mailbox' | 'feedback' | 'admin'>(initialTab);
  const [fbUser, setFbUser] = useState<User | null>(() => auth.currentUser);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Mailbox & Feedback states
  const [mailboxItems, setMailboxItems] = useState<MailboxDoc[]>([]);
  const [selectedMail, setSelectedMail] = useState<MailboxDoc | null>(null);
  const [readBroadcastIds, setReadBroadcastIds] = useState<string[]>([]);
  const [myFeedbacks, setMyFeedbacks] = useState<FeedbackDoc[]>([]);
  const [allFeedbacks, setAllFeedbacks] = useState<FeedbackDoc[]>([]);

  // Feedback form state
  const [fbCategory, setFbCategory] = useState<FeedbackDoc['category']>('suggestion');
  const [fbSubject, setFbSubject] = useState('');
  const [fbMessage, setFbMessage] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Confirmation dialogs (Workspace API + destructive deletes)
  const [pendingFeedbackConfirm, setPendingFeedbackConfirm] = useState<{
    category: FeedbackDoc['category'];
    subject: string;
    message: string;
    deviceType: DeviceCategory;
  } | null>(null);

  const [pendingDeleteConfirm, setPendingDeleteConfirm] = useState<{
    kind: 'mailbox' | 'feedback';
    id: string;
    label: string;
  } | null>(null);

  // Admin compose & reply state
  const [adminComposeMode, setAdminComposeMode] = useState<'broadcast' | 'direct'>('broadcast');
  const [adminRecipientEmail, setAdminRecipientEmail] = useState('');
  const [adminMsgType, setAdminMsgType] = useState<MailboxDoc['type']>('system');
  const [adminMsgTitle, setAdminMsgTitle] = useState('');
  const [adminMsgBody, setAdminMsgBody] = useState('');
  const [pendingAdminSendConfirm, setPendingAdminSendConfirm] = useState(false);
  const [isSendingAdminMail, setIsSendingAdminMail] = useState(false);

  const [replyTargetFeedback, setReplyTargetFeedback] = useState<FeedbackDoc | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [adminFeedbackFilter, setAdminFeedbackFilter] = useState<'all' | 'unread' | 'replied'>('all');

  // Banners
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAdmin = isAdminUser(fbUser);
  const deviceCategory = useMemo(() => getDeviceCategory(), []);

  // Sync initialTab when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = subscribeAuthState((user) => {
      setFbUser(user);
      if (user) {
        try {
          const saved = localStorage.getItem(`mailbox_read_broadcasts_${user.uid}`);
          setReadBroadcastIds(saved ? JSON.parse(saved) : []);
        } catch {
          setReadBroadcastIds([]);
        }
      } else {
        setMailboxItems([]);
        setMyFeedbacks([]);
        setAllFeedbacks([]);
        setSelectedMail(null);
      }
    });
    return unsub;
  }, []);

  // Subscribe to Mailbox messages when authenticated & verified
  useEffect(() => {
    if (!fbUser || !fbUser.emailVerified) return;

    const buckets: Record<string, Map<string, MailboxDoc>> = {
      broadcast: new Map(),
      byUid: new Map(),
      byEmail: new Map(),
      adminAll: new Map()
    };

    const emitMerged = () => {
      const combined = new Map<string, MailboxDoc>();
      Object.values(buckets).forEach((m) => {
        m.forEach((docItem, id) => combined.set(id, docItem));
      });
      const sorted = Array.from(combined.values()).sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? Date.now();
        const tb = b.createdAt?.toMillis?.() ?? Date.now();
        return tb - ta;
      });
      setMailboxItems(sorted);
    };

    const unsubs: (() => void)[] = [];

    const toDoc = (d: { id: string; data: () => Record<string, unknown> }): MailboxDoc => {
      const data = d.data();
      return {
        id: d.id,
        recipientType: (data.recipientType as MailboxDoc['recipientType']) || 'broadcast',
        recipientUid: String(data.recipientUid || ''),
        recipientEmail: String(data.recipientEmail || ''),
        senderEmail: String(data.senderEmail || ''),
        senderName: String(data.senderName || ''),
        title: String(data.title || ''),
        body: String(data.body || ''),
        type: (data.type as MailboxDoc['type']) || 'system',
        relatedFeedbackId: String(data.relatedFeedbackId || ''),
        isRead: Boolean(data.isRead),
        createdAt: (data.createdAt as Timestamp | null) || null,
        updatedAt: (data.updatedAt as Timestamp | null) || null
      };
    };

    const qBroadcast = query(
      collection(db, 'mailbox'),
      where('recipientType', '==', 'broadcast')
    );
    unsubs.push(
      onSnapshot(
        qBroadcast,
        (snap) => {
          buckets.broadcast.clear();
          snap.forEach((docSnap) => buckets.broadcast.set(docSnap.id, toDoc(docSnap)));
          emitMerged();
        },
        (err) => {
          console.error(err);
          try {
            handleFirestoreError(err, OperationType.LIST, 'mailbox');
          } catch (e) {
            setErrorMsg(e instanceof Error ? e.message : '讀取信箱失敗');
          }
        }
      )
    );

    const qUid = query(collection(db, 'mailbox'), where('recipientUid', '==', fbUser.uid));
    unsubs.push(
      onSnapshot(
        qUid,
        (snap) => {
          buckets.byUid.clear();
          snap.forEach((docSnap) => buckets.byUid.set(docSnap.id, toDoc(docSnap)));
          emitMerged();
        },
        (err) => console.error('Mailbox uid listener error:', err)
      )
    );

    if (fbUser.email) {
      const qEmail = query(
        collection(db, 'mailbox'),
        where('recipientEmail', '==', fbUser.email)
      );
      unsubs.push(
        onSnapshot(
          qEmail,
          (snap) => {
            buckets.byEmail.clear();
            snap.forEach((docSnap) => buckets.byEmail.set(docSnap.id, toDoc(docSnap)));
            emitMerged();
          },
          (err) => console.error('Mailbox email listener error:', err)
        )
      );
    }

    if (isAdminUser(fbUser)) {
      unsubs.push(
        onSnapshot(
          collection(db, 'mailbox'),
          (snap) => {
            buckets.adminAll.clear();
            snap.forEach((docSnap) => buckets.adminAll.set(docSnap.id, toDoc(docSnap)));
            emitMerged();
          },
          (err) => console.error('Admin mailbox listener error:', err)
        )
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [fbUser]);

  // Subscribe to player's own feedbacks & admin all feedbacks
  useEffect(() => {
    if (!fbUser || !fbUser.emailVerified) return;

    const toFeedback = (d: { id: string; data: () => Record<string, unknown> }): FeedbackDoc => {
      const data = d.data();
      return {
        id: d.id,
        senderUid: String(data.senderUid || ''),
        senderName: String(data.senderName || ''),
        senderEmail: String(data.senderEmail || ''),
        category: (data.category as FeedbackDoc['category']) || 'other',
        subject: String(data.subject || ''),
        message: String(data.message || ''),
        deviceType: (data.deviceType as DeviceCategory) || 'desktop',
        emailedToAdmin: Boolean(data.emailedToAdmin),
        status: (data.status as FeedbackDoc['status']) || 'unread',
        adminReply: String(data.adminReply || ''),
        createdAt: (data.createdAt as Timestamp | null) || null,
        updatedAt: (data.updatedAt as Timestamp | null) || null
      };
    };

    const qMine = query(collection(db, 'feedbacks'), where('senderUid', '==', fbUser.uid));
    const unsubMine = onSnapshot(
      qMine,
      (snap) => {
        const list: FeedbackDoc[] = [];
        snap.forEach((s) => list.push(toFeedback(s)));
        list.sort(
          (a, b) => (b.createdAt?.toMillis?.() ?? Date.now()) - (a.createdAt?.toMillis?.() ?? Date.now())
        );
        setMyFeedbacks(list);
      },
      (err) => console.error('My feedback listener error:', err)
    );

    let unsubAdmin: (() => void) | null = null;
    if (isAdminUser(fbUser)) {
      unsubAdmin = onSnapshot(
        collection(db, 'feedbacks'),
        (snap) => {
          const list: FeedbackDoc[] = [];
          snap.forEach((s) => list.push(toFeedback(s)));
          list.sort(
            (a, b) => (b.createdAt?.toMillis?.() ?? Date.now()) - (a.createdAt?.toMillis?.() ?? Date.now())
          );
          setAllFeedbacks(list);
        },
        (err) => {
          console.error('Admin feedback listener error:', err);
        }
      );
    }

    return () => {
      unsubMine();
      if (unsubAdmin) unsubAdmin();
    };
  }, [fbUser]);

  // Compute unread count & notify parent HUD/MainMenu
  const unreadCount = useMemo(() => {
    return mailboxItems.filter((item) => {
      if (item.recipientType === 'broadcast') {
        return !readBroadcastIds.includes(item.id);
      }
      return !item.isRead;
    }).length;
  }, [mailboxItems, readBroadcastIds]);

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      const { user } = await signInWithGoogleFirebase();
      loginWithGoogleAccount({
        id: user.uid,
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || '冒險家',
        avatar: user.photoURL || undefined
      });
      soundManager.playCraftSuccess();
      showToast(
        isAdminUser(user)
          ? `👑 已以管理員 ${ADMIN_EMAIL} 登入，完整信箱與意見箱管理權限已開啟！`
          : '✅ Google 帳號登入成功！'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Google 登入失敗，請稍後再試。');
    } finally {
      setIsSigningIn(false);
    }
  };

  const isMailUnread = (item: MailboxDoc) => {
    if (item.recipientType === 'broadcast') {
      return !readBroadcastIds.includes(item.id);
    }
    return !item.isRead;
  };

  const handleOpenMail = async (item: MailboxDoc) => {
    soundManager.playButtonClick();
    setSelectedMail(item);
    if (!fbUser) return;

    if (item.recipientType === 'broadcast') {
      if (!readBroadcastIds.includes(item.id)) {
        const next = [...readBroadcastIds, item.id];
        setReadBroadcastIds(next);
        try {
          localStorage.setItem(`mailbox_read_broadcasts_${fbUser.uid}`, JSON.stringify(next));
        } catch {}
      }
    } else if (!item.isRead && (item.recipientUid === fbUser.uid || item.recipientEmail === fbUser.email || isAdmin)) {
      try {
        await updateDoc(doc(db, 'mailbox', item.id), {
          isRead: true,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Mark read error:', err);
      }
    }
  };

  // Step 1 of Feedback submission: validate & show explicit confirmation dialog
  const handlePrepareFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanSubject = fbSubject.trim().slice(0, 120);
    const cleanMessage = fbMessage.trim().slice(0, 2000);
    if (!cleanSubject || !cleanMessage) {
      setErrorMsg('請填寫意見主旨與詳細內容。');
      return;
    }

    setPendingFeedbackConfirm({
      category: fbCategory,
      subject: cleanSubject,
      message: cleanMessage,
      deviceType: deviceCategory
    });
  };

  // Step 2: Confirmed submit (Firestore + optional Gmail email to ruiqishi59@gmail.com)
  const handleConfirmFeedbackSend = async (withEmail: boolean) => {
    if (!pendingFeedbackConfirm) return;
    setIsSubmittingFeedback(true);
    setErrorMsg(null);

    try {
      let currentUser = auth.currentUser;
      let accessToken: string | null = null;

      if (withEmail) {
        const res = await ensureGmailSendToken();
        currentUser = res.user;
        accessToken = res.accessToken;
      } else if (!currentUser) {
        const res = await signInWithGoogleFirebase();
        currentUser = res.user;
      }

      if (!currentUser || !currentUser.email) {
        throw new Error('請先完成 Google 登入驗證。');
      }

      loginWithGoogleAccount({
        id: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName || currentUser.email.split('@')[0] || '冒險家',
        avatar: currentUser.photoURL || undefined
      });

      const fbRef = doc(collection(db, 'feedbacks'));
      const senderName = (currentUser.displayName || currentUser.email.split('@')[0] || '冒險家').slice(0, 64);
      const senderEmail = currentUser.email.slice(0, 160);

      let emailSentSuccess = false;
      if (withEmail && accessToken) {
        await sendFeedbackViaGmail(accessToken, {
          senderName,
          senderEmail,
          categoryLabel: CATEGORY_LABELS[pendingFeedbackConfirm.category],
          subject: pendingFeedbackConfirm.subject,
          message: pendingFeedbackConfirm.message,
          deviceType: pendingFeedbackConfirm.deviceType,
          feedbackId: fbRef.id
        });
        emailSentSuccess = true;
      }

      try {
        await setDoc(fbRef, {
          senderUid: currentUser.uid,
          senderName,
          senderEmail,
          category: pendingFeedbackConfirm.category,
          subject: pendingFeedbackConfirm.subject,
          message: pendingFeedbackConfirm.message,
          deviceType: pendingFeedbackConfirm.deviceType,
          emailedToAdmin: emailSentSuccess,
          status: 'unread',
          adminReply: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `feedbacks/${fbRef.id}`);
      }

      setFbSubject('');
      setFbMessage('');
      setPendingFeedbackConfirm(null);
      confetti({ particleCount: 55, spread: 65 });
      soundManager.playCraftSuccess();
      showToast(
        emailSentSuccess
          ? `📧 您的意見已寄送電子郵件至 ${ADMIN_EMAIL}，並同步保存至意見箱！`
          : '✅ 您的意見已儲存至雲端意見箱，管理員將會審閱並透過信箱回覆！'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '送出意見時發生錯誤，請稍後再試。');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Admin: send message to player mailbox or broadcast
  const handleConfirmAdminSendMail = async () => {
    if (!fbUser || !isAdmin) return;
    setIsSendingAdminMail(true);
    setErrorMsg(null);

    try {
      const targetEmail =
        adminComposeMode === 'broadcast' ? 'ALL' : adminRecipientEmail.trim().slice(0, 160);
      const title = adminMsgTitle.trim().slice(0, 120);
      const body = adminMsgBody.trim().slice(0, 2000);

      if (!title || !body || (adminComposeMode === 'direct' && !targetEmail.includes('@'))) {
        throw new Error('請填寫有效的收件資訊、標題與內容。');
      }

      const mailRef = doc(collection(db, 'mailbox'));
      try {
        await setDoc(mailRef, {
          recipientType: adminComposeMode,
          recipientUid: adminComposeMode === 'broadcast' ? 'ALL' : '',
          recipientEmail: targetEmail,
          senderEmail: ADMIN_EMAIL,
          senderName: 'Rickie 官方管理員',
          title,
          body,
          type: adminMsgType,
          relatedFeedbackId: '',
          isRead: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `mailbox/${mailRef.id}`);
      }

      setAdminMsgTitle('');
      setAdminMsgBody('');
      setAdminRecipientEmail('');
      setPendingAdminSendConfirm(false);
      soundManager.playCraftSuccess();
      showToast(
        adminComposeMode === 'broadcast'
          ? '📢 全服信箱公告已成功發送給所有玩家！'
          : `✉️ 私人信件已成功發送至 ${targetEmail} 的遊戲信箱！`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '發送信箱訊息失敗');
    } finally {
      setIsSendingAdminMail(false);
    }
  };

  // Admin: reply to a specific feedback & deliver reply directly into player's mailbox
  const handleAdminReplyFeedback = async () => {
    if (!fbUser || !isAdmin || !replyTargetFeedback) return;
    const replyClean = adminReplyText.trim().slice(0, 2000);
    if (!replyClean) {
      setErrorMsg('請輸入回覆內容。');
      return;
    }

    setIsSendingAdminMail(true);
    setErrorMsg(null);
    try {
      try {
        await updateDoc(doc(db, 'feedbacks', replyTargetFeedback.id), {
          status: 'replied',
          adminReply: replyClean,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `feedbacks/${replyTargetFeedback.id}`);
      }

      const mailRef = doc(collection(db, 'mailbox'));
      try {
        await setDoc(mailRef, {
          recipientType: 'direct',
          recipientUid: replyTargetFeedback.senderUid,
          recipientEmail: replyTargetFeedback.senderEmail,
          senderEmail: ADMIN_EMAIL,
          senderName: 'Rickie 官方回覆',
          title: `意見回覆：${replyTargetFeedback.subject}`.slice(0, 120),
          body: `感謝您的意見回饋！\n\n【您的意見】\n${replyTargetFeedback.message.slice(0, 500)}\n\n【管理員回覆】\n${replyClean}`.slice(0, 2000),
          type: 'reply',
          relatedFeedbackId: replyTargetFeedback.id,
          isRead: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `mailbox/${mailRef.id}`);
      }

      setReplyTargetFeedback(null);
      setAdminReplyText('');
      soundManager.playCraftSuccess();
      showToast(`✅ 已回覆意見並送達 ${replyTargetFeedback.senderName} 的遊戲信箱！`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '回覆意見失敗');
    } finally {
      setIsSendingAdminMail(false);
    }
  };

  const handleMarkFeedbackRead = async (item: FeedbackDoc) => {
    if (!isAdmin || item.status !== 'unread') return;
    try {
      await updateDoc(doc(db, 'feedbacks', item.id), {
        status: 'read',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `feedbacks/${item.id}`);
    }
  };

  const handleExecuteDelete = async () => {
    if (!pendingDeleteConfirm) return;
    const { kind, id } = pendingDeleteConfirm;
    try {
      if (kind === 'mailbox') {
        await deleteDoc(doc(db, 'mailbox', id));
        if (selectedMail?.id === id) setSelectedMail(null);
        showToast('🗑️ 信件已刪除。');
      } else {
        await deleteDoc(doc(db, 'feedbacks', id));
        showToast('🗑️ 意見記錄已刪除。');
      }
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, `${kind === 'mailbox' ? 'mailbox' : 'feedbacks'}/${id}`);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : '刪除失敗');
      }
    } finally {
      setPendingDeleteConfirm(null);
    }
  };

  if (!isOpen) return null;

  const filteredAdminFeedbacks = allFeedbacks.filter((f) => {
    if (adminFeedbackFilter === 'unread') return f.status === 'unread';
    if (adminFeedbackFilter === 'replied') return f.status === 'replied';
    return true;
  });

  const unreadAdminFeedbackCount = allFeedbacks.filter((f) => f.status === 'unread').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm font-mono select-none">
      <div className="relative flex h-[92dvh] w-full max-w-5xl flex-col rounded-2xl border-2 border-stone-600 bg-[#1a1a1a] text-stone-100 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 bg-[#121212] px-4 py-3 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/50 bg-amber-950/60 text-amber-300 shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-amber-300">
                  遊戲信箱 & 意見箱中心
                </h2>
                {isAdmin && (
                  <span className="flex items-center gap-1 rounded border border-amber-400/60 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                    <Crown className="h-3 w-3" />
                    管理員權限 ({ADMIN_EMAIL})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400">
                意見寄送對象：{ADMIN_EMAIL} • 信箱訊息專屬授權管理
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {fbUser ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 text-[11px] text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {fbUser.email}
              </span>
            ) : (
              <button
                type="button"
                disabled={isSigningIn}
                onClick={handleGoogleSignIn}
                className="min-h-[40px] rounded-lg border border-blue-400/60 bg-white px-3 py-1.5 text-xs font-bold text-stone-900 hover:bg-stone-100"
              >
                {isSigningIn ? '登入中...' : 'Google 登入'}
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="關閉信箱與意見箱"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-stone-700 bg-stone-800 text-stone-300 hover:bg-rose-700 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-stone-800 bg-[#161616] px-3 sm:px-5 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('mailbox')}
            className={`flex min-h-[46px] items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'mailbox'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Inbox className="h-4 w-4" />
            <span>玩家信箱</span>
            {unreadCount > 0 && (
              <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-black text-white tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex min-h-[46px] items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'feedback'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>意見箱 (寄信給 Rickie)</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex min-h-[46px] items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'admin'
                ? 'border-sky-400 text-sky-300 bg-sky-500/10'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>管理發信權限 ({ADMIN_EMAIL.split('@')[0]})</span>
            {isAdmin && unreadAdminFeedbackCount > 0 && (
              <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-black text-stone-950 tabular-nums">
                {unreadAdminFeedbackCount}
              </span>
            )}
          </button>
        </div>

        {/* Toast / Error Banners */}
        {toastMsg && (
          <div className="flex items-center gap-2 border-b border-emerald-600 bg-emerald-950/90 px-5 py-2.5 text-xs font-bold text-emerald-200 shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center justify-between gap-2 border-b border-rose-600 bg-rose-950/90 px-5 py-2.5 text-xs font-bold text-rose-200 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span className="break-all">{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-300 hover:text-white p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {/* ========================================================== */}
          {/* TAB 1: PLAYER MAILBOX                                      */}
          {/* ========================================================== */}
          {activeTab === 'mailbox' && (
            !fbUser ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center space-y-4 overflow-y-auto">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-950/40 text-amber-300">
                  <Inbox className="h-8 w-8" />
                </div>
                <div className="max-w-md space-y-2">
                  <h3 className="text-base font-black text-white">登入 Google 帳號以開啟個人信箱</h3>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    為了保護您的信件隱私，玩家信箱須先完成 Google 帳號驗證。登入後即可收取管理員{' '}
                    <span className="text-amber-300">{ADMIN_EMAIL}</span> 發送的公告與回覆！
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSigningIn}
                  onClick={handleGoogleSignIn}
                  className="gsi-material-button min-h-[48px] flex items-center justify-center gap-3 rounded-xl border border-[#747775] bg-white px-6 py-3 text-sm font-bold text-[#1f1f1f] hover:bg-stone-100 shadow-xl"
                >
                  <svg className="h-5 w-5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isSigningIn ? '登入驗證中...' : 'Sign in with Google'}</span>
                </button>
              </div>
            ) : (
              <div className="grid h-full grid-cols-1 md:grid-cols-12 overflow-hidden">
                {/* Mail List */}
                <div className="flex flex-col border-b md:border-b-0 md:border-r border-stone-800 bg-[#181818] md:col-span-5 overflow-hidden max-h-[42dvh] md:max-h-none">
                  <div className="flex items-center justify-between border-b border-stone-800 px-4 py-2.5 text-xs text-stone-400">
                    <span>收件夾（共 {mailboxItems.length} 封）</span>
                    <span className="text-amber-300 font-bold">未讀 {unreadCount}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-2 touch-pan-y">
                    {mailboxItems.length === 0 ? (
                      <div className="flex h-40 flex-col items-center justify-center text-center text-xs text-stone-500">
                        <Inbox className="h-8 w-8 mb-2 opacity-40" />
                        <p>目前信箱沒有訊息</p>
                      </div>
                    ) : (
                      mailboxItems.map((mail) => {
                        const unread = isMailUnread(mail);
                        const isSelected = selectedMail?.id === mail.id;
                        return (
                          <button
                            key={mail.id}
                            type="button"
                            onClick={() => handleOpenMail(mail)}
                            className={`w-full min-h-[64px] text-left rounded-xl border p-3 transition-colors ${
                              isSelected
                                ? 'border-amber-400 bg-amber-950/30'
                                : unread
                                ? 'border-sky-500/60 bg-stone-900 hover:bg-stone-800'
                                : 'border-stone-800 bg-stone-900/50 hover:bg-stone-800/70'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-800 text-amber-300">
                                {mail.recipientType === 'broadcast'
                                  ? '📢 全服公告'
                                  : mail.type === 'reply'
                                  ? '💬 意見回覆'
                                  : '✉️ 私人信件'}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {unread && (
                                  <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-black text-white">
                                    未讀
                                  </span>
                                )}
                                <span className="text-[10px] text-stone-500">
                                  {formatTimestamp(mail.createdAt)}
                                </span>
                              </div>
                            </div>
                            <div className="mt-1.5 font-bold text-xs sm:text-sm text-white truncate">
                              {mail.title}
                            </div>
                            <div className="mt-0.5 text-[11px] text-stone-400 truncate">
                              來自：{mail.senderName} ({mail.senderEmail})
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Mail Detail Pane */}
                <div className="flex flex-col bg-[#1e1e1e] p-4 sm:p-6 md:col-span-7 overflow-y-auto touch-pan-y">
                  {selectedMail ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-700 pb-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="rounded border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                              {selectedMail.recipientType === 'broadcast' ? '全服系統公告' : '專屬玩家信件'}
                            </span>
                            <span className="text-xs text-stone-400">
                              {formatTimestamp(selectedMail.createdAt)}
                            </span>
                          </div>
                          <h3 className="mt-2 text-lg font-black text-white">
                            {selectedMail.title}
                          </h3>
                          <p className="mt-1 text-xs text-stone-400">
                            寄件人：<strong className="text-stone-200">{selectedMail.senderName}</strong> ({selectedMail.senderEmail})
                            {selectedMail.recipientType === 'direct' && (
                              <> · 收件人：{selectedMail.recipientEmail}</>
                            )}
                          </p>
                        </div>

                        {(isAdmin ||
                          (selectedMail.recipientType === 'direct' &&
                            (selectedMail.recipientUid === fbUser.uid ||
                              selectedMail.recipientEmail === fbUser.email))) && (
                          <button
                            onClick={() =>
                              setPendingDeleteConfirm({
                                kind: 'mailbox',
                                id: selectedMail.id,
                                label: selectedMail.title
                              })
                            }
                            className="min-h-[40px] flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900/60"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>刪除</span>
                          </button>
                        )}
                      </div>

                      <div className="rounded-xl border border-stone-700 bg-stone-950/70 p-4 text-xs sm:text-sm leading-relaxed text-stone-200 whitespace-pre-wrap">
                        {selectedMail.body}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center text-stone-500 space-y-2 py-12">
                      <Mail className="h-10 w-10 opacity-30" />
                      <p className="text-xs sm:text-sm">點擊左側信件查看完整內容</p>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* ========================================================== */}
          {/* TAB 2: FEEDBACK BOX (EMAIL TO ruiqishi59@gmail.com)        */}
          {/* ========================================================== */}
          {activeTab === 'feedback' && (
            <div className="grid h-full grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden touch-pan-y">
              {/* Left: Compose Feedback */}
              <form
                onSubmit={handlePrepareFeedbackSubmit}
                className="flex flex-col gap-3.5 border-b lg:border-b-0 lg:border-r border-stone-800 bg-[#181818] p-4 sm:p-6 lg:col-span-6 lg:overflow-y-auto"
              >
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3.5 text-xs text-emerald-200 leading-relaxed">
                  <div className="font-black text-emerald-300 flex items-center gap-1.5 mb-1">
                    <Send className="h-4 w-4" />
                    意見將直達管理員電子郵件：{ADMIN_EMAIL}
                  </div>
                  提交時會先顯示確認視窗，經您同意後透過 Gmail 寄出電子郵件給開發者，並同步保存至意見箱供官方追蹤回覆。
                </div>

                {/* Device Badge */}
                <div className="flex items-center justify-between rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs">
                  <span className="text-stone-400">自動偵測遊玩裝置：</span>
                  <span className="flex items-center gap-1.5 font-bold text-amber-300">
                    {deviceCategory === 'tablet' ? (
                      <>
                        <Tablet className="h-4 w-4" />
                        <span>平板觸控設備 (Tablet)</span>
                      </>
                    ) : deviceCategory === 'mobile' ? (
                      <>
                        <Smartphone className="h-4 w-4" />
                        <span>手機觸控設備</span>
                      </>
                    ) : (
                      <>
                        <Monitor className="h-4 w-4" />
                        <span>電腦桌面裝置</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Category Buttons */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">意見分類</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(CATEGORY_LABELS) as FeedbackDoc['category'][]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFbCategory(cat)}
                        className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                          fbCategory === cat
                            ? 'border-emerald-400 bg-emerald-600 text-white shadow'
                            : 'border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800'
                        }`}
                      >
                        {CATEGORY_LABELS[cat]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    意見主旨 <span className="text-stone-500">({fbSubject.length}/120)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={fbSubject}
                    onChange={(e) => setFbSubject(e.target.value)}
                    placeholder="例如：希望新增更多平板自訂按鈕位置或新生物..."
                    className="min-h-[44px] w-full rounded-xl border border-stone-700 bg-stone-950 px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-stone-500 focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    詳細內容 <span className="text-stone-500">({fbMessage.length}/2000)</span>
                  </label>
                  <textarea
                    rows={5}
                    maxLength={2000}
                    value={fbMessage}
                    onChange={(e) => setFbMessage(e.target.value)}
                    placeholder="請詳述您的建議、遇到的問題或期待改善的玩法體驗..."
                    className="w-full flex-1 rounded-xl border border-stone-700 bg-stone-950 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-stone-500 focus:border-emerald-400 focus:outline-none resize-y min-h-[120px]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="flex-1 min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-xs sm:text-sm font-black text-white shadow-lg transition-all active:scale-[0.99] disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    <span>送出意見至 {ADMIN_EMAIL}</span>
                  </button>

                  {fbSubject.trim() && fbMessage.trim() && (
                    <a
                      href={buildFeedbackMailtoUrl({
                        senderName: fbUser?.displayName || '冒險家',
                        senderEmail: fbUser?.email || '',
                        categoryLabel: CATEGORY_LABELS[fbCategory],
                        subject: fbSubject.trim(),
                        message: fbMessage.trim(),
                        deviceType: deviceCategory
                      })}
                      className="min-h-[48px] flex items-center justify-center gap-1.5 rounded-xl border border-stone-600 bg-stone-800 px-3.5 py-3 text-xs font-bold text-stone-200 hover:bg-stone-700"
                      title="使用裝置預設郵件 App 寄信"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>郵件 App</span>
                    </a>
                  )}
                </div>
              </form>

              {/* Right: User's Submitted Feedback History */}
              <div className="flex flex-col bg-[#1e1e1e] p-4 sm:p-6 lg:col-span-6 lg:overflow-y-auto">
                <h3 className="text-sm font-black text-stone-200 mb-3">
                  我送出的意見紀錄 ({myFeedbacks.length})
                </h3>
                {!fbUser ? (
                  <div className="rounded-xl border border-dashed border-stone-700 bg-stone-900/40 p-6 text-center text-xs text-stone-400 space-y-3">
                    <p>登入 Google 帳號後，您送出的每一筆意見與管理員回覆紀錄都會顯示在這裡。</p>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="min-h-[44px] rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-500"
                    >
                      立即登入 Google
                    </button>
                  </div>
                ) : myFeedbacks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-stone-700 bg-stone-900/40 p-8 text-center text-xs text-stone-500">
                    尚無送出的意見，歡迎填寫左側表單回饋給我們！
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myFeedbacks.map((fb) => (
                      <div
                        key={fb.id}
                        className="rounded-xl border border-stone-700 bg-stone-900/80 p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-amber-300">
                            {CATEGORY_LABELS[fb.category]}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {fb.emailedToAdmin && (
                              <span className="rounded bg-blue-500/20 border border-blue-400/40 px-1.5 py-0.5 text-[10px] text-blue-300">
                                已寄 Email
                              </span>
                            )}
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                fb.status === 'replied'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : fb.status === 'read'
                                  ? 'bg-stone-700 text-stone-200'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {fb.status === 'replied'
                                ? '✓ 已回覆'
                                : fb.status === 'read'
                                ? '已讀取'
                                : '審閱中'}
                            </span>
                          </div>
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-white">{fb.subject}</h4>
                        <p className="text-xs text-stone-300 whitespace-pre-wrap">{fb.message}</p>
                        {fb.adminReply && (
                          <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-2.5 text-xs text-emerald-200">
                            <span className="font-bold text-emerald-300">管理員回覆：</span>
                            {fb.adminReply}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 3: ADMIN PERMISSIONS (ruiqishi59@gmail.com ONLY)       */}
          {/* ========================================================== */}
          {activeTab === 'admin' && (
            !isAdmin ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center space-y-4 overflow-y-auto">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-950/40 text-amber-300">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div className="max-w-md space-y-2">
                  <h3 className="text-base font-black text-white">
                    僅限管理員 {ADMIN_EMAIL} 使用之權限
                  </h3>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    發送訊息到玩家信箱、群發全服公告以及讀取/回覆所有玩家意見箱的權限，受雲端資料庫安全規則嚴格保護，僅限已驗證之{' '}
                    <strong className="text-amber-300">{ADMIN_EMAIL}</strong> 帳號存取。
                  </p>
                  {fbUser && (
                    <p className="text-xs text-rose-300">
                      目前登入帳號：{fbUser.email}（無管理員權限）
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={isSigningIn}
                  onClick={handleGoogleSignIn}
                  className="min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-xs sm:text-sm font-black text-stone-950 shadow-lg"
                >
                  切換 / 登入 {ADMIN_EMAIL}
                </button>
              </div>
            ) : (
              <div className="grid h-full grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden touch-pan-y">
                {/* Left: Admin Compose Mailbox Message */}
                <div className="flex flex-col gap-3 border-b lg:border-b-0 lg:border-r border-stone-800 bg-[#181818] p-4 sm:p-5 lg:col-span-5 lg:overflow-y-auto">
                  <div className="flex items-center gap-2 text-sm font-black text-amber-300">
                    <Megaphone className="h-4 w-4" />
                    <span>發送訊息到玩家信箱</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdminComposeMode('broadcast')}
                      className={`min-h-[42px] rounded-xl border px-3 py-2 text-xs font-bold ${
                        adminComposeMode === 'broadcast'
                          ? 'border-amber-400 bg-amber-500 text-stone-950'
                          : 'border-stone-700 bg-stone-900 text-stone-300'
                      }`}
                    >
                      📢 全服玩家公告
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminComposeMode('direct')}
                      className={`min-h-[42px] rounded-xl border px-3 py-2 text-xs font-bold ${
                        adminComposeMode === 'direct'
                          ? 'border-sky-400 bg-sky-500 text-stone-950'
                          : 'border-stone-700 bg-stone-900 text-stone-300'
                      }`}
                    >
                      ✉️ 指定玩家 Email
                    </button>
                  </div>

                  {adminComposeMode === 'direct' && (
                    <div>
                      <label className="block text-[11px] font-bold text-stone-400 mb-1">
                        收件玩家 Gmail / Email
                      </label>
                      <input
                        type="email"
                        value={adminRecipientEmail}
                        onChange={(e) => setAdminRecipientEmail(e.target.value)}
                        placeholder="player@gmail.com"
                        className="min-h-[44px] w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'system', label: '系統公告' },
                      { id: 'direct', label: '官方通知' },
                      { id: 'reward', label: '活動福利' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAdminMsgType(t.id as MailboxDoc['type'])}
                        className={`min-h-[38px] rounded-lg border text-[11px] font-bold ${
                          adminMsgType === t.id
                            ? 'border-emerald-400 bg-emerald-700 text-white'
                            : 'border-stone-700 bg-stone-900 text-stone-400'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    maxLength={120}
                    value={adminMsgTitle}
                    onChange={(e) => setAdminMsgTitle(e.target.value)}
                    placeholder="信箱訊息標題..."
                    className="min-h-[44px] w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />

                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={adminMsgBody}
                    onChange={(e) => setAdminMsgBody(e.target.value)}
                    placeholder="輸入要發送到玩家遊戲信箱的內容..."
                    className="w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none min-h-[110px]"
                  />

                  <button
                    type="button"
                    disabled={
                      !adminMsgTitle.trim() ||
                      !adminMsgBody.trim() ||
                      (adminComposeMode === 'direct' && !adminRecipientEmail.includes('@'))
                    }
                    onClick={() => setPendingAdminSendConfirm(true)}
                    className="min-h-[46px] flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-black text-stone-950 shadow-lg disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                    <span>發送至玩家信箱</span>
                  </button>
                </div>

                {/* Right: Admin Feedback Inbox & Replies */}
                <div className="flex flex-col bg-[#1e1e1e] p-4 sm:p-5 lg:col-span-7 lg:overflow-y-auto space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-white">
                      所有玩家意見箱收件匣 ({allFeedbacks.length})
                    </h3>
                    <div className="flex gap-1.5">
                      {[
                        { id: 'all', label: '全部' },
                        { id: 'unread', label: `未讀 (${unreadAdminFeedbackCount})` },
                        { id: 'replied', label: '已回覆' }
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setAdminFeedbackFilter(f.id as 'all' | 'unread' | 'replied')}
                          className={`min-h-[36px] rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
                            adminFeedbackFilter === f.id
                              ? 'border-sky-400 bg-sky-600 text-white'
                              : 'border-stone-700 bg-stone-900 text-stone-400'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredAdminFeedbacks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-stone-700 bg-stone-900/40 p-8 text-center text-xs text-stone-500">
                      目前沒有符合條件的玩家意見
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredAdminFeedbacks.map((fb) => (
                        <div
                          key={fb.id}
                          className="rounded-xl border border-stone-700 bg-stone-900/90 p-3.5 space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                {CATEGORY_LABELS[fb.category]}
                              </span>
                              <span className="text-[11px] font-bold text-white">
                                {fb.senderName}
                              </span>
                              <span className="text-[10px] text-stone-400">
                                ({fb.senderEmail}) · {fb.deviceType}
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-500">
                              {formatTimestamp(fb.createdAt)}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs sm:text-sm text-amber-200">{fb.subject}</h4>
                          <p className="text-xs text-stone-200 whitespace-pre-wrap leading-relaxed">
                            {fb.message}
                          </p>

                          {fb.adminReply && (
                            <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-2.5 text-xs text-emerald-200">
                              <strong>已回覆：</strong>
                              {fb.adminReply}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {fb.status === 'unread' && (
                              <button
                                type="button"
                                onClick={() => handleMarkFeedbackRead(fb)}
                                className="min-h-[38px] flex items-center gap-1 rounded-lg border border-stone-600 bg-stone-800 px-3 py-1.5 text-[11px] font-bold text-stone-200 hover:bg-stone-700"
                              >
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span>標記已讀</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setReplyTargetFeedback(fb);
                                setAdminReplyText(fb.adminReply || '');
                              }}
                              className="min-h-[38px] flex items-center gap-1 rounded-lg border border-sky-500/50 bg-sky-950/60 px-3 py-1.5 text-[11px] font-bold text-sky-200 hover:bg-sky-800"
                            >
                              <Reply className="h-3.5 w-3.5" />
                              <span>回覆並寄送到玩家信箱</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setPendingDeleteConfirm({
                                  kind: 'feedback',
                                  id: fb.id,
                                  label: fb.subject
                                })
                              }
                              className="min-h-[38px] flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-1.5 text-[11px] font-bold text-rose-300 hover:bg-rose-900/60 ml-auto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>刪除</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Explicit Confirmation Modal 1: Gmail Send Feedback Confirmation */}
      {pendingFeedbackConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border-2 border-emerald-500/60 bg-stone-900 p-5 text-stone-100 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-emerald-300 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              確認寄送意見電子郵件
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              您確定要提交此意見並透過您的 Gmail 帳號寄送電子郵件給{' '}
              <strong className="text-amber-300">{ADMIN_EMAIL}</strong> 嗎？
            </p>
            <div className="rounded-xl border border-stone-700 bg-stone-950 p-3 text-xs space-y-1">
              <div>
                <span className="text-stone-400">收件人：</span>
                <span className="text-amber-300">{ADMIN_EMAIL}</span>
              </div>
              <div>
                <span className="text-stone-400">主旨：</span>
                <span className="text-white">{pendingFeedbackConfirm.subject}</span>
              </div>
              <div className="text-stone-300 line-clamp-3 pt-1 border-t border-stone-800">
                {pendingFeedbackConfirm.message}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={isSubmittingFeedback}
                onClick={() => handleConfirmFeedbackSend(true)}
                className="min-h-[44px] w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"
              >
                {isSubmittingFeedback ? '正在寄送郵件...' : `確認寄送 Gmail 至 ${ADMIN_EMAIL}`}
              </button>
              <button
                type="button"
                disabled={isSubmittingFeedback}
                onClick={() => handleConfirmFeedbackSend(false)}
                className="min-h-[44px] w-full rounded-xl border border-stone-600 bg-stone-800 hover:bg-stone-700 px-4 py-2 text-xs font-bold text-stone-200 disabled:opacity-50"
              >
                僅儲存至雲端意見箱（不寄 Gmail）
              </button>
              <button
                type="button"
                disabled={isSubmittingFeedback}
                onClick={() => setPendingFeedbackConfirm(null)}
                className="min-h-[40px] w-full rounded-xl text-xs font-bold text-stone-400 hover:text-white"
              >
                取消返回編輯
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal 2: Admin Mailbox Broadcast / Direct Send */}
      {pendingAdminSendConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border-2 border-amber-500/60 bg-stone-900 p-5 text-stone-100 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-amber-300">確認發送玩家信箱訊息</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              確定以管理員 <strong className="text-amber-300">{ADMIN_EMAIL}</strong> 身分發送以下訊息至
              {adminComposeMode === 'broadcast'
                ? '「全服所有玩家信箱」'
                : `「${adminRecipientEmail}」`}
              ？
            </p>
            <div className="rounded-xl border border-stone-700 bg-stone-950 p-3 text-xs space-y-1">
              <div className="font-bold text-white">{adminMsgTitle}</div>
              <div className="text-stone-300 line-clamp-4">{adminMsgBody}</div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPendingAdminSendConfirm(false)}
                className="min-h-[42px] rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 text-xs font-bold text-stone-300"
              >
                取消
              </button>
              <button
                type="button"
                disabled={isSendingAdminMail}
                onClick={handleConfirmAdminSendMail}
                className="min-h-[42px] rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-black text-stone-950"
              >
                {isSendingAdminMail ? '發送中...' : '確認發送'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Admin Reply to Feedback */}
      {replyTargetFeedback && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border-2 border-sky-500/60 bg-stone-900 p-5 text-stone-100 shadow-2xl space-y-3">
            <h3 className="text-base font-black text-sky-300">
              回覆 {replyTargetFeedback.senderName} 的意見
            </h3>
            <p className="text-[11px] text-stone-400">
              回覆後會同步更新意見狀態，並直接發送一封回覆通知至該玩家的遊戲信箱。
            </p>
            <textarea
              rows={4}
              maxLength={2000}
              value={adminReplyText}
              onChange={(e) => setAdminReplyText(e.target.value)}
              placeholder="輸入管理員回覆內容..."
              className="w-full rounded-xl border border-stone-700 bg-stone-950 p-3 text-xs text-white focus:border-sky-400 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplyTargetFeedback(null)}
                className="min-h-[42px] rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 text-xs font-bold text-stone-300"
              >
                取消
              </button>
              <button
                type="button"
                disabled={isSendingAdminMail}
                onClick={handleAdminReplyFeedback}
                className="min-h-[42px] rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2 text-xs font-black text-stone-950"
              >
                {isSendingAdminMail ? '發送中...' : '確認回覆並寄到信箱'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Delete Confirmation */}
      {pendingDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border-2 border-rose-500/60 bg-stone-900 p-5 text-stone-100 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-rose-300">確認永久刪除？</h3>
            <p className="text-xs text-stone-300">
              確定要刪除「{pendingDeleteConfirm.label}」嗎？此操作無法復原。
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteConfirm(null)}
                className="min-h-[42px] rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 text-xs font-bold text-stone-300"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="min-h-[42px] rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-black text-white"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

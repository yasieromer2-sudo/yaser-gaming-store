import { Router, Request, Response } from 'express';
import { db } from './db';
import { notificationService } from './notificationService';

const router = Router();

// Helper to extract active user ID from headers or query parameters
function getActiveUserId(req: Request): string | null {
  const headerUser = req.headers['x-user-id'] as string;
  if (headerUser && typeof headerUser === 'string' && headerUser.trim().length > 0) {
    return headerUser.trim();
  }
  const queryUser = req.query.userId as string;
  if (queryUser && typeof queryUser === 'string' && queryUser.trim().length > 0) {
    return queryUser.trim();
  }
  return null;
}

// Authentication Middleware: Verifies user existence and active status
function authenticate(req: Request, res: Response, next: Function) {
  try {
    const userId = getActiveUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'غير مصرح: يرجى تسجيل الدخول وإرفاق معرف المستخدم (Missing user authorization header)',
      });
    }
    const user = db.getUser(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'غير مصرح: الحساب غير موجود في النظام',
      });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'الحساب موقوف إدارياً، يرجى التواصل مع إدارة المتجر',
      });
    }
    (req as any).user = user;
    next();
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Role-Based Access Control (RBAC) Middleware
function requireRole(allowedRoles: ('super_admin' | 'agent' | 'user')[]) {
  return (req: Request, res: Response, next: Function) => {
    try {
      const userId = getActiveUserId(req);
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'غير مصرح: يرجى تسجيل الدخول (Unauthorized)',
        });
      }
      const user = db.getUser(userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'غير مصرح: الحساب غير مسجل في النظام',
        });
      }
      if (user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          error: 'الحساب موقوف إدارياً، يرجى مراجعة الدعم الفني',
        });
      }
      (req as any).user = user;

      const userRole = (user.role || '').toLowerCase();
      // super_admin has absolute administrative privileges
      if (userRole === 'super_admin') {
        return next();
      }

      if (!allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: `صلاحيات غير كافية للوصول لهذا الإجراء: هذا الإجراء مخصص لرتبة (${allowedRoles.join(' / ')}) فقط`,
        });
      }
      next();
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}

// -------------------------------------------------------------
// STORE CONFIGURATION & WHITE-LABEL SETTINGS
// -------------------------------------------------------------

router.get('/store/settings', (req: Request, res: Response) => {
  try {
    const settings = db.getSettings();
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/store/settings', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const updated = await db.updateStoreSettings(req.body, user.id);
    res.json({ success: true, data: updated, message: 'تم تحديث إعدادات المتجر بنجاح' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/store/sections', (req: Request, res: Response) => {
  try {
    const sections = db.getSections();
    res.json({ success: true, data: sections });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/store/sections', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const sections = await db.updateSections(req.body.sections, user.id);
    res.json({ success: true, data: sections, message: 'تم حفظ الأقسام بنجاح' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/store/banners', (req: Request, res: Response) => {
  try {
    const banners = db.getBanners();
    res.json({ success: true, data: banners });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/store/banners', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const banners = await db.updateBanners(req.body.banners, user.id);
    res.json({ success: true, data: banners, message: 'تم حفظ البنرات بنجاح' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// AUTH & USERS
// -------------------------------------------------------------

// Public Demo Users endpoint for switching in the UI demo switcher
// -------------------------------------------------------------
// AUTHENTICATION & REGISTRATION
// -------------------------------------------------------------

router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, avatar } = req.body;
    const result = await db.registerUser({ name, email, phone, password, avatar });
    res.status(201).json({
      success: true,
      data: result,
      message: 'تم تسجيل الحساب بنجاح وتم توليد المعرف الرقمي الخاص بك',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف وكلمة المرور',
      });
    }
    const result = await db.loginUser(identifier, password);
    res.json({
      success: true,
      data: result,
      message: 'تم تسجيل الدخول بنجاح',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/auth/demo-users', (req: Request, res: Response) => {
  try {
    const users = db.getData().users.map(u => ({
      id: u.id,
      uid: u.uid,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      avatar: u.avatar,
      agentId: u.agentId,
      status: u.status,
    }));
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/users/me', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const wallet = db.getWallet(user.id);
    res.json({ success: true, data: { ...user, wallet } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/users/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const updated = await db.updateUserProfile(user.id, req.body);
    res.json({ success: true, data: updated, message: 'تم تحديث الملف الشخصي' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET all users: strictly restricted to SUPER_ADMIN
router.get('/users', requireRole(['super_admin']), (req: Request, res: Response) => {
  try {
    const users = db.getData().users;
    const usersWithWallets = users.map(u => ({
      ...u,
      wallet: db.getWallet(u.id),
      ordersCount: db.getOrders(u.id).length,
    }));
    res.json({ success: true, data: usersWithWallets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/users/:id/status', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status } = req.body;
    const updated = await db.updateUserStatus(req.params.id, status, user.id);
    res.json({ success: true, data: updated, message: `تم تحديث حالة المستخدم إلى (${status})` });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// WALLET & LEDGER
// -------------------------------------------------------------

router.get('/wallet', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const wallet = db.getWallet(user.id);
    const transactions = db.getTransactions(user.id);
    res.json({
      success: true,
      data: {
        wallet,
        transactions,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/wallet/transactions', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    // Only super_admin can request all transactions across all users
    let transactions;
    if (user.role === 'super_admin' && req.query.all === 'true') {
      transactions = db.getTransactions();
    } else {
      transactions = db.getTransactions(user.id);
    }
    res.json({ success: true, data: transactions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/wallet/top-up-request', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { agentId, amount, paymentMethod, transferReference } = req.body;
    if (!agentId || !amount || !paymentMethod) {
      return res.status(400).json({ success: false, error: 'يرجى استكمال جميع بيانات طلب التغذية' });
    }
    const request = await db.createTopUpRequest({
      userId: user.id,
      agentId,
      amount: Number(amount),
      paymentMethod,
      transferReference,
    });
    res.json({ success: true, data: request, message: 'تم إرسال طلب التغذية بنجاح' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Direct wallet balance adjustment: SUPER_ADMIN ONLY
router.post('/wallet/adjust', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { userId, amount, reason } = req.body;
    if (!userId || amount === undefined || !reason) {
      return res.status(400).json({ success: false, error: 'يرجى تزويد معرف المستخدم والمبلغ وسبب التعديل' });
    }
    const result = await db.adjustUserBalance({
      userId,
      amount: Number(amount),
      reason,
      adminUserId: user.id,
    });
    res.json({ success: true, data: result, message: 'تم تعديل الرصيد بنجاح' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// AGENTS & TOP-UP REQUESTS (STRICT ISOLATION & AUDIT)
// -------------------------------------------------------------

router.get('/agents', (req: Request, res: Response) => {
  try {
    const agents = db.getAgents();
    res.json({ success: true, data: agents });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/agents', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const agent = await db.upsertAgent(req.body, user.id);
    res.json({ success: true, data: agent, message: 'تم حفظ بيانات الوكيل' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/agents/:id', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await db.deleteAgent(req.params.id, user.id);
    res.json({ success: true, message: 'تم حذف الوكيل بنجاح' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/agents/:id/reset-password', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { newPassword } = req.body;
    const agent = db.getAgents().find(a => a.id === req.params.id);
    if (!agent) throw new Error('الوكيل غير موجود');
    const updated = await db.upsertAgent({ ...agent, password: newPassword || 'AgentPass@2025' }, user.id);
    res.json({ success: true, data: updated, message: 'تم إعادة تعيين كلمة مرور الوكيل بنجاح' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /agent/requests: Strictly isolated per agent. SUPER_ADMIN sees all or filtered.
router.get('/agent/requests', requireRole(['super_admin', 'agent']), (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let requests;

    if (user.role === 'super_admin') {
      const agentFilter = req.query.agentId as string;
      requests = agentFilter ? db.getTopUpRequests(agentFilter) : db.getTopUpRequests();
    } else {
      // AGENT role: Strictly enforce isolation to their own assigned agentId!
      const agentId = user.agentId;
      if (!agentId) {
        return res.status(403).json({ success: false, error: 'غير مصرح: حساب الوكيل غير مرتبط بمعرف وكيل معتمد' });
      }
      // Strictly ignore any query params attempting to bypass isolation
      requests = db.getTopUpRequests(agentId);
    }
    res.json({ success: true, data: requests });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /agent/requests/:id: View single request details with proof and transfer info
router.get('/agent/requests/:id', requireRole(['super_admin', 'agent']), (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const request = db.getData().topUpRequests.find(r => r.id === req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'طلب التغذية غير موجود' });
    }

    if (user.role !== 'super_admin') {
      if (user.role !== 'agent' || user.agentId !== request.agentId) {
        return res.status(403).json({ success: false, error: 'غير مصرح: لا يمكنك عرض بيانات طلب مسند لوكيل آخر' });
      }
    }

    res.json({ success: true, data: request });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /agent/stats: Returns operational statistics for the agent
router.get('/agent/stats', requireRole(['super_admin', 'agent']), (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const targetAgentId = user.role === 'super_admin' ? (req.query.agentId as string || user.agentId) : user.agentId;
    if (!targetAgentId) {
      return res.status(400).json({ success: false, error: 'معرف الوكيل مطلوب' });
    }

    const agent = db.getAgents().find(a => a.id === targetAgentId);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'بيانات الوكيل غير موجودة' });
    }

    const requests = db.getTopUpRequests(targetAgentId);
    const completed = requests.filter(r => r.status === 'Completed' || r.status === 'Approved');
    const pending = requests.filter(r => r.status === 'Pending');
    const rejected = requests.filter(r => r.status === 'Rejected');
    const totalProcessed = completed.reduce((sum, r) => sum + r.amount, 0);

    res.json({
      success: true,
      data: {
        agentId: agent.id,
        agentName: agent.name,
        totalProcessedAmount: agent.totalProcessedAmount || totalProcessed,
        successfulOrders: agent.successfulOrders || completed.length,
        pendingOrders: pending.length,
        rejectedOrders: rejected.length,
        totalOrders: requests.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /agent/requests/:id/confirm: Atomic balance credit + ledger txn + notification + audit log
router.post('/agent/requests/:id/confirm', requireRole(['super_admin', 'agent']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { notes } = req.body;
    const updated = await db.confirmTopUpRequest(req.params.id, user.id, notes);
    res.json({ success: true, data: updated, message: 'تم تأكيد التغذية وإضافة الرصيد للمحفظة بنجاح!' });
  } catch (err: any) {
    const isForbidden = err.message.includes('غير مصرح');
    res.status(isForbidden ? 403 : 400).json({ success: false, error: err.message });
  }
});

// POST /agent/requests/:id/reject: Rejects top-up request safely without touching balance
router.post('/agent/requests/:id/reject', requireRole(['super_admin', 'agent']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { reason } = req.body;
    const updated = await db.rejectTopUpRequest(req.params.id, user.id, reason);
    res.json({ success: true, data: updated, message: 'تم رفض طلب التغذية' });
  } catch (err: any) {
    const isForbidden = err.message.includes('غير مصرح');
    res.status(isForbidden ? 403 : 400).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// GAMES & RECHARGE PACKAGES
// -------------------------------------------------------------

router.get('/games', (req: Request, res: Response) => {
  try {
    const games = req.query.all === 'true' ? db.getAllGames() : db.getGames();
    res.json({ success: true, data: games });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/games', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const game = await db.upsertGame(req.body, user.id);
    res.json({ success: true, data: game, message: 'تم حفظ بيانات اللعبة' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/games/:id', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await db.deleteGame(req.params.id, user.id);
    res.json({ success: true, message: 'تم حذف اللعبة بنجاح' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/packages', (req: Request, res: Response) => {
  try {
    const gameId = req.query.gameId as string | undefined;
    const packages = req.query.all === 'true' ? db.getAllPackages(gameId) : db.getPackages(gameId);
    res.json({ success: true, data: packages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/packages', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const pkg = await db.upsertPackage(req.body, user.id);
    res.json({ success: true, data: pkg, message: 'تم حفظ باقة الشحن بنجاح' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/packages/:id', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await db.deletePackage(req.params.id, user.id);
    res.json({ success: true, message: 'تم حذف الباقة بنجاح' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// RECHARGE ORDERS & PROCESSING
// -------------------------------------------------------------

router.post('/recharge/order', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { gameId, packageId, playerId, serverOrRegion } = req.body;
    if (!gameId || !packageId || !playerId) {
      return res.status(400).json({ success: false, error: 'يرجى تزويد معرف اللعبة والباقة ومعرف اللاعب' });
    }
    const order = await db.createRechargeOrder({
      userId: user.id,
      gameId,
      packageId,
      playerId,
      serverOrRegion,
    });
    res.json({ success: true, data: order, message: 'تم استلام طلب الشحن بنجاح وجاري تنفيذه فورًا' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/recharge/orders', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const orders = (user.role === 'super_admin' && req.query.all === 'true')
      ? db.getRechargeOrders()
      : db.getRechargeOrders(user.id);
    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Updating recharge order status: SUPER_ADMIN ONLY (Agents cannot fulfill or modify recharge orders)
router.post('/recharge/orders/:id/status', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const { status, reason } = req.body;
    const order = await db.updateRechargeStatus(req.params.id, status, reason);
    res.json({ success: true, data: order, message: 'تم تحديث حالة طلب الشحن بنجاح' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// ACCOUNTS MARKETPLACE & PURCHASE
// -------------------------------------------------------------

router.get('/accounts', (req: Request, res: Response) => {
  try {
    const gameId = req.query.gameId as string | undefined;
    const accounts = db.getAccounts(gameId);
    res.json({ success: true, data: accounts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/accounts', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const account = await db.upsertAccount(req.body, user.id);
    res.json({ success: true, data: account, message: 'تم حفظ الحساب في المتجر' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/accounts/:id', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await db.deleteAccount(req.params.id, user.id);
    res.json({ success: true, message: 'تم حذف الحساب' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/accounts/purchase', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { accountId } = req.body;
    if (!accountId) {
      return res.status(400).json({ success: false, error: 'معرف الحساب مطلوب' });
    }
    const result = await db.purchaseAccount(accountId, user.id);
    res.json({
      success: true,
      data: result,
      message: '🎉 تم شراء الحساب بنجاح! تم حفظ تفاصيل الدخول في سجل طلباتك.',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// PAYMENT METHODS
// -------------------------------------------------------------

router.get('/payment-methods', (req: Request, res: Response) => {
  try {
    const methods = db.getPaymentMethods();
    res.json({ success: true, data: methods });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/payment-methods', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const method = await db.upsertPaymentMethod(req.body, user.id);
    res.json({ success: true, data: method, message: 'تم حفظ وسيلة الدفع' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/payment-methods/:id', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await db.deletePaymentMethod(req.params.id, user.id);
    res.json({ success: true, message: 'تم حذف وسيلة الدفع' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Broadcast Announcement: SUPER_ADMIN ONLY
router.post('/admin/broadcast', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'عنوان ونص الإشعار مطلوبان' });
    }
    const sentCount = await db.broadcastNotification(title, message);
    res.json({ success: true, sentCount, message: `تم إرسال التعميم لـ ${sentCount} مستخدم` });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// ORDERS & NOTIFICATIONS
// -------------------------------------------------------------

router.get('/orders', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const orders = (user.role === 'super_admin' && req.query.all === 'true')
      ? db.getOrders()
      : db.getOrders(user.id);
    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// NOTIFICATIONS & REAL PUSH NOTIFICATION SYSTEM
// -------------------------------------------------------------

// Public VAPID Key for Web Push browser subscription
router.get('/notifications/vapid-public-key', (_req: Request, res: Response) => {
  try {
    const key = notificationService.getVapidPublicKey();
    res.json({ success: true, data: { publicKey: key } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Register device PushSubscription
router.post('/notifications/subscribe', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { endpoint, keys, userAgent, deviceName } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({
        success: false,
        error: 'بيانات الاشتراك في الإشعارات غير مكتملة (Missing endpoint or keys)',
      });
    }

    const record = await notificationService.saveSubscription(
      user.id,
      { endpoint, keys },
      userAgent || req.headers['user-agent'],
      deviceName
    );

    res.status(201).json({
      success: true,
      data: record,
      message: 'تم تسجيل الجهاز بنجاح لاستقبال الإشعارات الحقيقية',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Unsubscribe device PushSubscription on logout / toggle off
router.post('/notifications/unsubscribe', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ success: false, error: 'المعرف الطرفي للجهاز مطلوب' });
    }

    const removed = await notificationService.removeSubscription(user.id, endpoint);
    res.json({ success: true, removed, message: 'تم إيقاف الإشعارات لهذا الجهاز' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Real-time In-App SSE stream for zero latency updates
router.get('/notifications/stream', (req: Request, res: Response) => {
  const userId = getActiveUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'غير مصرح' });
  }
  const user = db.getUser(userId);
  if (!user || user.status === 'suspended') {
    return res.status(403).json({ success: false, error: 'محظور' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', userId: user.id })}\n\n`);
  notificationService.addSseClient(user.id, res);
});

// Send a test push notification to user's registered devices
router.post('/notifications/test', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const notif = await notificationService.createAndSend({
      userId: user.id,
      title: '🔔 تجربة الإشعارات الحقيقية',
      body: 'تهانينا! نظام الإشعارات الفورية يعمل بنجاح على جهازك ومتصفحك.',
      type: 'system_alert',
      targetUrl: '/?tab=notifications',
      eventId: `test-${Date.now()}-${user.id}`,
    });

    res.json({
      success: true,
      data: notif,
      message: 'تم إرسال إشعار تجريبي فوري لجهازك بنجاح',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user notifications (sorted newest first)
router.get('/notifications', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const notifs = db.getNotifications(user.id);
    res.json({ success: true, data: notifs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark all user notifications as read
router.post('/notifications/read', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await db.markNotificationsRead(user.id);
    res.json({ success: true, message: 'تم تمييز جميع الإشعارات كمقروءة' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Mark a single notification as read
router.post('/notifications/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const success = await db.markNotificationRead(req.params.id, user.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'الإشعار غير موجود' });
    }
    res.json({ success: true, message: 'تم تمييز الإشعار كمقروء' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete a single notification
router.delete('/notifications/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const deleted = await db.deleteNotification(req.params.id, user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'الإشعار غير موجود' });
    }
    res.json({ success: true, message: 'تم حذف الإشعار بنجاح' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Clear all read notifications
router.delete('/notifications/clear-read', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const count = await db.clearReadNotifications(user.id);
    res.json({ success: true, clearedCount: count, message: `تم حذف ${count} إشعار مقروء بنجاح` });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Admin Broadcast with Real Push to designated audience
router.post('/admin/broadcast', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { title, message, body, type, targetRole, targetUserId, targetUrl } = req.body;

    const notifTitle = (title || '').trim();
    const notifBody = (message || body || '').trim();

    if (!notifTitle || !notifBody) {
      return res.status(400).json({
        success: false,
        error: 'عنوان ونص الإشعار مطلوبان',
      });
    }

    const sentCount = await notificationService.notifyAdminBroadcast({
      title: notifTitle,
      body: notifBody,
      type: type || 'broadcast',
      targetRole: targetRole || 'all',
      targetUserId: targetUserId || undefined,
      targetUrl: targetUrl || '/',
      adminUserId: admin.id,
    });

    res.json({
      success: true,
      sentCount,
      message: `تم إرسال التعميم والإشعار لـ ${sentCount} مستخدم بنجاح`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// ADMIN OVERVIEW & ANALYTICS
// -------------------------------------------------------------

router.get('/admin/overview', requireRole(['super_admin']), (req: Request, res: Response) => {
  try {
    const data = db.getData();
    const totalUsers = data.users.filter(u => u.role === 'user').length;
    const totalAgents = data.agents.length;

    // Top-up volume
    const completedTopUps = data.topUpRequests.filter(r => r.status === 'Completed');
    const totalTopUpAmount = completedTopUps.reduce((acc, r) => acc + r.amount, 0);

    // Sales volume (Accounts + Recharge)
    const rechargeSales = data.rechargeOrders.filter(o => o.status === 'Completed').reduce((acc, o) => acc + o.amountSDG, 0);
    const accountSales = data.orders.filter(o => o.type === 'account_purchase' && o.status === 'Completed').reduce((acc, o) => acc + o.amountSDG, 0);
    const totalSales = rechargeSales + accountSales;

    const pendingRequests = data.topUpRequests.filter(r => r.status === 'Pending').length;
    const pendingRecharges = data.rechargeOrders.filter(o => o.status === 'Processing' || o.status === 'Pending').length;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalAgents,
        totalSales,
        totalTopUpAmount,
        pendingRequests,
        pendingRecharges,
        availableAccounts: data.gameAccounts.filter(a => a.status === 'available').length,
        soldAccounts: data.gameAccounts.filter(a => a.status === 'sold').length,
        totalGames: data.games.length,
        usdToSdgRate: data.storeSettings.usdToSdgRate,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/admin/analytics', requireRole(['super_admin']), (req: Request, res: Response) => {
  try {
    const timeRange = (req.query.timeRange as string) || '7days';
    const analytics = db.getDetailedAnalytics(timeRange);
    res.json({ success: true, data: analytics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/admin/audit-logs', requireRole(['super_admin']), (req: Request, res: Response) => {
  try {
    const logs = db.getAuditLogs();
    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// OFFERS & NEWS MANAGEMENT
// -------------------------------------------------------------

// Public / Customer endpoint: returns active published offers
router.get('/offers', (req: Request, res: Response) => {
  try {
    const userId = getActiveUserId(req);
    const user = userId ? db.getUser(userId) : null;
    const isSuperAdmin = user && user.role === 'super_admin';
    const showAll = req.query.all === 'true' && isSuperAdmin;

    const offers = db.getOffers(!showAll);
    res.json({ success: true, data: offers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/offers/:id', (req: Request, res: Response) => {
  try {
    const offer = db.getOfferById(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, error: 'العرض غير موجود' });
    }
    const userId = getActiveUserId(req);
    const user = userId ? db.getUser(userId) : null;
    const isSuperAdmin = user && user.role === 'super_admin';

    if (offer.status !== 'Published' && !isSuperAdmin) {
      return res.status(404).json({ success: false, error: 'العرض غير متاح حالياً' });
    }

    res.json({ success: true, data: offer });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin-only CRUD operations: Super Admin only!
router.post('/offers', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const newOffer = await db.createOffer(req.body, user.id);
    res.status(201).json({
      success: true,
      data: newOffer,
      message: 'تم إضافة العرض/الخبر بنجاح',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/offers/:id', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const updated = await db.updateOffer(req.params.id, req.body, user.id);
    res.json({
      success: true,
      data: updated,
      message: 'تم تعديل العرض/الخبر بنجاح',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/offers/:id', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await db.deleteOffer(req.params.id, user.id);
    res.json({
      success: true,
      message: 'تم حذف العرض/الخبر بنجاح',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.patch('/offers/:id/status', requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'يرجى تحديد الحالة الجديدة' });
    }
    const updated = await db.updateOfferStatus(req.params.id, status, user.id);
    res.json({
      success: true,
      data: updated,
      message: `تم تغيير حالة العرض إلى (${status})`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;

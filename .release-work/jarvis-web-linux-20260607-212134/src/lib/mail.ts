const nodemailer = require('nodemailer');
import { prisma } from './prisma';

interface Transporter {
  sendMail(options: any): Promise<any>;
}

type MailOptions = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

let transporter: Transporter | null = null;
let transporterCacheKey = '';

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fromName: string;
};

async function getSystemValue(key: string): Promise<string> {
  try {
    const row = await prisma.systemConfig.findUnique({
      where: { key },
      select: { value: true },
    });
    return String(row?.value || '').trim();
  } catch {
    return '';
  }
}

async function loadSmtpConfig(): Promise<SmtpConfig> {
  const dbHost = await getSystemValue('smtp_host');
  const dbPort = await getSystemValue('smtp_port');
  const dbSecure = await getSystemValue('smtp_secure');
  const dbUser = await getSystemValue('smtp_user');
  const dbPass = await getSystemValue('smtp_pass');
  const dbFrom = await getSystemValue('smtp_from');
  const dbFromName = await getSystemValue('smtp_from_name');

  const host = dbHost || process.env.SMTP_HOST || '';
  const port = parseInt(dbPort || process.env.SMTP_PORT || '587', 10);
  const secure = (dbSecure || process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const user = dbUser || process.env.SMTP_USER || '';
  const pass = dbPass || process.env.SMTP_PASS || '';
  const from = dbFrom || process.env.SMTP_FROM || user;
  const fromName = dbFromName || process.env.SMTP_FROM_NAME || 'JarvisAI';

  return { host, port, secure, user, pass, from, fromName };
}

function loadEnvSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST || '';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const from = process.env.SMTP_FROM || user;
  const fromName = process.env.SMTP_FROM_NAME || 'JarvisAI';
  return { host, port, secure, user, pass, from, fromName };
}

function makeTransporterKey(cfg: SmtpConfig): string {
  return [cfg.host, cfg.port, cfg.secure, cfg.user, cfg.pass].join('|');
}

function getTransporter(cfg: SmtpConfig): Transporter | null {
  const key = makeTransporterKey(cfg);
  if (transporter && transporterCacheKey === key) {
    return transporter;
  }
  if (!cfg.host || !cfg.user || !cfg.pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  transporterCacheKey = key;
  return transporter;
}

async function trySendWithConfig(cfg: SmtpConfig, opts: MailOptions) {
  const t = getTransporter(cfg);
  const fromAddr = cfg.from || cfg.user || '';
  if (!t || !fromAddr) {
    return { ok: false, error: 'SMTP not configured' };
  }
  try {
    const info = await t.sendMail({
      from: `"${cfg.fromName}" <${fromAddr}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    const accepted = Array.isArray(info.accepted) ? info.accepted : [];
    const rejected = Array.isArray(info.rejected) ? info.rejected : [];
    if (accepted.length === 0 || rejected.length > 0) {
      return {
        ok: false,
        error: `SMTP rejected recipient: accepted=${accepted.length}, rejected=${rejected.length}`,
        messageId: info.messageId,
        accepted,
        rejected,
      };
    }
    return { ok: true, messageId: info.messageId, accepted, rejected };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown mail error' };
  }
}

async function tryQqDnsFallback(cfg: SmtpConfig, opts: MailOptions) {
  const host = (cfg.host || '').toLowerCase();
  if (host !== 'smtp.qq.com') {
    return null;
  }
  const qqIpHosts = ['183.47.120.204', '183.47.101.192'];
  for (const ipHost of qqIpHosts) {
    try {
      const t = nodemailer.createTransport({
        host: ipHost,
        port: cfg.port,
        secure: cfg.secure,
        auth: { user: cfg.user, pass: cfg.pass },
        tls: { servername: 'smtp.qq.com' },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
      const info = await t.sendMail({
        from: `"${cfg.fromName}" <${cfg.from || cfg.user}>`,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      });
      const accepted = Array.isArray(info.accepted) ? info.accepted : [];
      const rejected = Array.isArray(info.rejected) ? info.rejected : [];
      if (accepted.length === 0 || rejected.length > 0) {
        continue;
      }
      return { ok: true, messageId: info.messageId, fallback: `qq-ip:${ipHost}`, accepted, rejected };
    } catch {
      // Try next QQ SMTP IP.
    }
  }
  return null;
}

export async function sendMail(opts: MailOptions) {
  const sendFlow = async () => {
    const smtp = await loadSmtpConfig();
    if (!smtp.host || !smtp.user || !smtp.pass) {
      return { ok: false, error: 'SMTP not configured' };
    }

    const primaryRes = await trySendWithConfig(smtp, opts);
    if (primaryRes.ok) {
      return primaryRes;
    }
    const msg = primaryRes.error || 'Unknown mail error';
    const maybeQqFallback = await tryQqDnsFallback(smtp, opts);
    if (maybeQqFallback?.ok) {
      return maybeQqFallback;
    }

    const envSmtp = loadEnvSmtpConfig();
    const envKey = makeTransporterKey(envSmtp);
    const primaryKey = makeTransporterKey(smtp);
    const canRetryWithEnv =
      envKey !== primaryKey &&
      !!envSmtp.host &&
      !!envSmtp.user &&
      !!envSmtp.pass;

    if (!canRetryWithEnv) {
      return { ok: false, error: msg };
    }

    const envRes = await trySendWithConfig(envSmtp, opts);
    if (envRes.ok) {
      return { ...envRes, fallback: 'env' };
    }
    const maybeEnvQqFallback = await tryQqDnsFallback(envSmtp, opts);
    if (maybeEnvQqFallback?.ok) {
      return { ...maybeEnvQqFallback, fallback: `env-${maybeEnvQqFallback.fallback}` };
    }
    const fallbackMsg = envRes.error || 'Unknown mail error';
    return { ok: false, error: `${msg}; env fallback failed: ${fallbackMsg}` };
  };

  return await Promise.race([
    sendFlow(),
    new Promise<{ ok: false; error: string }>((resolve) => {
      setTimeout(() => resolve({ ok: false, error: 'SMTP send timeout (>20s)' }), 20000);
    }),
  ]);
}

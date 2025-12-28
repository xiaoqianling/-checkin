import { config } from "dotenv";

// 加载环境变量
config();

/**
 * 设置错误类，用于处理配置相关的错误
 */
export class SettingsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SettingsError";
  }
}

/**
 * 将字符串值转换为布尔值
 * @param value - 需要转换的值
 * @returns 转换后的布尔值
 */
function parseBool(value: string | boolean | number): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const strValue = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(strValue);
}

/**
 * 应用设置接口定义
 */
export interface SettingsConfig {
  token: string;
  debug?: boolean;
  barkDeviceKey?: string | null;
  barkServerUrl?: string | null;
  server3SendKey?: string | null;
}

/**
 * 应用设置类，管理所有配置项
 */
export class Settings {
  /** 库街区API token */
  public readonly token: string;

  /** 是否启用调试模式 */
  public readonly debug: boolean;

  /** Bark推送设备key */
  public readonly barkDeviceKey: string | null;

  /** Bark服务器地址 */
  public readonly barkServerUrl: string | null;

  /** ServerChan推送SendKey */
  public readonly server3SendKey: string | null;

  constructor(config: SettingsConfig) {
    this.token = config.token;
    this.debug = config.debug ?? false;
    this.barkDeviceKey = config.barkDeviceKey ?? null;
    this.barkServerUrl = config.barkServerUrl ?? null;
    this.server3SendKey = config.server3SendKey ?? null;
  }

  /**
   * 从环境变量加载设置
   * @returns Settings实例
   * @throws SettingsError 当缺少必要的环境变量时
   */
  static load(): Settings {
    const token = process.env.TOKEN;
    if (!token) {
      throw new SettingsError("TOKEN is required but missing.");
    }

    return new Settings({
      token,
      debug: parseBool(process.env.DEBUG || ""),
      barkDeviceKey: process.env.BARK_DEVICE_KEY || null,
      barkServerUrl: process.env.BARK_SERVER_URL || null,
      server3SendKey: process.env.SERVER3_SEND_KEY || null,
    });
  }

  /**
   * 获取所有敏感值，用于日志脱敏
   * @returns 敏感值数组
   */
  sensitiveValues(): string[] {
    return [
      this.token,
      this.barkDeviceKey,
      this.barkServerUrl,
      this.server3SendKey,
    ].filter((value): value is string => value !== null && value !== undefined);
  }
}

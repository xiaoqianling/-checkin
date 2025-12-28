/**
 * 日志级别定义
 */
type LogLevel = "DEBUG" | "INFO" | "ERROR";

/**
 * 日志记录器接口
 */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  exception(error: Error, message?: string): void;
}

/**
 * 掩码敏感值
 * @param value - 需要掩码的值
 * @returns 掩码后的字符串
 */
function maskValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 6) {
    return "***";
  }
  return `${trimmed.slice(0, 3)}***${trimmed.slice(-3)}`;
}

/**
 * 对文本中的敏感信息进行脱敏处理
 * @param text - 原始文本
 * @param secrets - 敏感信息数组
 * @returns 脱敏后的文本
 */
export function redact(text: string, secrets: string[]): string {
  let masked = text;
  for (const secret of secrets) {
    if (!secret) continue;
    masked = masked.replaceAll(secret, maskValue(secret));
  }
  return masked;
}

/**
 * 配置日志记录器
 * @param debug - 是否启用调试模式
 * @param secrets - 敏感信息数组，用于脱敏
 * @returns 配置好的日志记录器
 */
export function configureLogger(debug: boolean, secrets: string[]): Logger {
  const secretValues = secrets.filter((value) => value);
  const level: LogLevel = debug ? "DEBUG" : "INFO";

  // 日志级别权重
  const logLevels: Record<LogLevel, number> = {
    DEBUG: 0,
    INFO: 1,
    ERROR: 2,
  };

  const currentLevel = logLevels[level] ?? 1;

  /**
   * 内部日志函数
   * @param level - 日志级别
   * @param message - 日志消息
   * @param args - 替换参数
   */
  function log(level: LogLevel, message: string, ...args: unknown[]): void {
    // 检查日志级别是否满足输出条件
    if (logLevels[level] < currentLevel) return;

    const timestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .replace(/\..+/, "");
    let formattedMessage = message;

    // 处理参数替换（类似Python的format）
    if (args.length > 0) {
      formattedMessage = message.replace(/\{\}/g, () => {
        const arg = args.shift();
        return arg !== undefined ? String(arg) : "{}";
      });
    }

    const base = `[${timestamp}] ${level.padEnd(8)} ${formattedMessage}`;
    const safeMessage = redact(base, secretValues);

    // 根据级别输出到不同流
    if (level === "ERROR") {
      console.error(safeMessage);
    } else {
      console.log(safeMessage);
    }
  }

  return {
    /**
     * 输出调试级别日志
     * @param message - 日志消息
     * @param args - 替换参数
     */
    debug(message: string, ...args: unknown[]): void {
      log("DEBUG", message, ...args);
    },

    /**
     * 输出信息级别日志
     * @param message - 日志消息
     * @param args - 替换参数
     */
    info(message: string, ...args: unknown[]): void {
      log("INFO", message, ...args);
    },

    /**
     * 输出错误级别日志
     * @param message - 日志消息
     * @param args - 替换参数
     */
    error(message: string, ...args: unknown[]): void {
      log("ERROR", message, ...args);
    },

    /**
     * 输出异常信息
     * @param error - 错误对象
     * @param message - 自定义错误消息
     */
    exception(
      error: Error,
      message: string = "An unexpected error occurred"
    ): void {
      log("ERROR", `${message}: ${error.message}`);
      if (debug) {
        console.error(error.stack);
      }
    },
  };
}

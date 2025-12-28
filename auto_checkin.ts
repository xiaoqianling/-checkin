import axios, { AxiosInstance } from "axios";
import { Settings, SettingsError } from "./settings";
import { NotificationService } from "./ext_notification";
import { configureLogger, Logger } from "./logging_utils";

/**
 * 库街区客户端异常类
 */
class KurobbsClientException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KurobbsClientException";
  }
}

/**
 * API响应数据结构
 */
interface ApiResponse {
  code: number;
  msg: string;
  success?: boolean;
  data?: any;
}

/**
 * 用户信息接口
 */
interface UserInfo {
  mine?: {
    userId: number;
  };
}

/**
 * 游戏角色信息接口
 */
interface RoleInfo {
  gameId?: number;
  serverId?: string;
  roleId?: number;
  userId?: number;
}

/**
 * 用户游戏列表接口
 */
interface UserGameList {
  defaultRoleList?: RoleInfo[];
}

/**
 * 库街区客户端类，负责与库街区API交互
 */
class KurobbsClient {
  private token: string;
  private session: AxiosInstance;
  private result: Record<string, string>;
  private exceptions: KurobbsClientException[];

  /**
   * 创建库街区客户端实例
   * @param token - 库街区API token
   */
  constructor(token: string) {
    if (!token) {
      throw new KurobbsClientException(
        "TOKEN is required to call Kurobbs APIs."
      );
    }

    this.token = token;
    this.session = axios.create({
      timeout: 15000,
      headers: {
        osversion: "Android",
        devcode: "2fba3859fe9bfe9099f2696b8648c2c6",
        countrycode: "CN",
        ip: "10.0.2.233",
        model: "2211133C",
        source: "android",
        lang: "zh-Hans",
        version: "1.0.9",
        versioncode: "1090",
        token: this.token,
        "content-type": "application/x-www-form-urlencoded; charset=utf-8",
        "accept-encoding": "gzip",
        "user-agent": "okhttp/3.10.0",
      },
    });

    this.result = {};
    this.exceptions = [];
  }

  /**
   * 发送POST请求到指定URL
   * @param url - 请求URL
   * @param data - 请求数据
   * @returns API响应
   */
  private async _post(
    url: string,
    data: Record<string, any>
  ): Promise<ApiResponse> {
    try {
      const response = await this.session.post(
        url,
        new URLSearchParams(data).toString()
      );

      const res: ApiResponse = {
        code: response.data.code,
        msg: response.data.msg,
        success: response.data.success,
        data: response.data.data,
      };

      logger.debug(
        "POST {} -> code={}, success={}, msg={}",
        url,
        res.code,
        res.success,
        res.msg
      );
      return res;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new KurobbsClientException(
            `Request to ${url} failed: ${error.response.status} ${error.response.statusText}`
          );
        } else if (error.request) {
          throw new KurobbsClientException(
            `Request to ${url} failed: No response received`
          );
        }
      }
      throw new KurobbsClientException(
        `Request to ${url} failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * 获取用户信息
   * @param type - 信息类型
   * @returns 用户信息
   */
  async getMineInfo(type: number = 1): Promise<UserInfo> {
    const res = await this._post("https://api.kurobbs.com/user/mineV2", {
      type,
    });
    if (!res.data) {
      throw new KurobbsClientException("User info is missing in response.");
    }
    return res.data;
  }

  /**
   * 获取用户游戏列表
   * @param userId - 用户ID
   * @returns 用户游戏列表
   */
  async getUserGameList(userId: number): Promise<UserGameList> {
    const res = await this._post("https://api.kurobbs.com/gamer/role/default", {
      queryUserId: userId,
    });
    if (!res.data) {
      throw new KurobbsClientException(
        "User game list is missing in response."
      );
    }
    return res.data;
  }

  /**
   * 执行签到操作
   * @returns 签到响应
   */
  async checkin(): Promise<ApiResponse> {
    const mineInfo = await this.getMineInfo();
    const userId = mineInfo?.mine?.userId || 0;
    const userGameList = await this.getUserGameList(userId);

    // 获取北京时间
    const beijingTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Shanghai",
    });
    const month = new Date(beijingTime).getMonth() + 1;

    const roleList = userGameList.defaultRoleList || [];
    if (roleList.length === 0) {
      throw new KurobbsClientException("No default role found for the user.");
    }
    const roleInfo = roleList[0];

    const data = {
      gameId: roleInfo.gameId || 2,
      serverId: roleInfo.serverId,
      roleId: roleInfo.roleId || 0,
      userId: roleInfo.userId || 0,
      reqMonth: `${month.toString().padStart(2, "0")}`,
    };

    return await this._post(
      "https://api.kurobbs.com/encourage/signIn/v2",
      data
    );
  }

  /**
   * 执行社区签到
   * @returns 社区签到响应
   */
  async signIn(): Promise<ApiResponse> {
    return await this._post("https://api.kurobbs.com/user/signIn", {
      gameId: 2,
    });
  }

  /**
   * 处理签到操作的通用逻辑
   * @param actionName - 操作名称
   * @param actionMethod - 操作方法
   * @param successMessage - 成功消息
   * @param failureMessage - 失败消息
   */
  private async _processSignAction(
    actionName: string,
    actionMethod: () => Promise<ApiResponse>,
    successMessage: string,
    failureMessage: string
  ): Promise<void> {
    try {
      const resp = await actionMethod();
      if (resp.success) {
        this.result[actionName] = successMessage;
        logger.info("{} -> {}", actionName, successMessage);
      } else {
        this.exceptions.push(
          new KurobbsClientException(`${failureMessage}, ${resp.msg}`)
        );
      }
    } catch (error) {
      this.exceptions.push(error as KurobbsClientException);
    }
  }

  /**
   * 开始签到流程
   */
  async start(): Promise<void> {
    await this._processSignAction(
      "checkin",
      () => this.checkin(),
      "签到奖励签到成功",
      "签到奖励签到失败"
    );

    await this._processSignAction(
      "signIn",
      () => this.signIn(),
      "社区签到成功",
      "社区签到失败"
    );

    this._log();
  }

  /**
   * 获取签到结果消息
   */
  get msg(): string {
    const messages = Object.values(this.result);
    return messages.length > 0 ? messages.join(", ") + "!" : "";
  }

  /**
   * 记录日志并处理异常
   */
  private _log(): void {
    if (this.msg) {
      logger.info(this.msg);
    }
    if (this.exceptions.length > 0) {
      throw new KurobbsClientException(
        this.exceptions.map((e) => e.message).join("; ")
      );
    }
  }
}

// 全局日志记录器
let logger: Logger;

/**
 * 主函数，程序入口点
 */
async function main(): Promise<void> {
  // 尽早配置日志以避免在GitHub Actions日志中泄露敏感信息
  const debug = process.env.DEBUG
    ? String(process.env.DEBUG).trim().toLowerCase() === "true"
    : false;
  const secrets = [
    process.env.TOKEN || "",
    process.env.BARK_DEVICE_KEY || "",
    process.env.BARK_SERVER_URL || "",
    process.env.SERVER3_SEND_KEY || "",
  ];

  logger = configureLogger(debug, secrets);

  let settings: Settings;
  try {
    settings = Settings.load();
  } catch (error) {
    if (error instanceof SettingsError) {
      logger.error(error.message);
    } else {
      logger.exception(error as Error, "Failed to load settings");
    }
    process.exit(1);
  }

  const notifier = new NotificationService(settings);

  try {
    const kurobbs = new KurobbsClient(settings.token);
    await kurobbs.start();

    if (kurobbs.msg) {
      await notifier.send(kurobbs.msg);
    }
  } catch (error) {
    if (error instanceof KurobbsClientException) {
      logger.error(error.message);
      await notifier.send(error.message);
    } else {
      logger.exception(error as Error, "An unexpected error occurred");
    }
    process.exit(1);
  }
}

// 如果是直接运行此文件，则执行main函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { KurobbsClient, KurobbsClientException };

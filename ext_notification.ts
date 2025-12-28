import axios from "axios";
import { Settings } from "./settings";

/**
 * 通知服务类，负责发送签到结果通知
 */
export class NotificationService {
  private settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  /**
   * 发送Bark推送通知
   * @param message - 通知消息内容
   * @returns 是否发送成功
   */
  async sendBarkNotification(message: string): Promise<boolean> {
    // 检查Bark配置是否完整
    if (!this.settings.barkDeviceKey || !this.settings.barkServerUrl) {
      return false;
    }

    try {
      const url = `${this.settings.barkServerUrl}/${this.settings.barkDeviceKey}`;
      const params = new URLSearchParams({
        title: "Kurobbs Checkin",
        body: message,
        sound: "glass",
      });

      await axios.get(`${url}?${params.toString()}`, { timeout: 10000 });
      return true;
    } catch (error) {
      console.error("Bark notification failed:", (error as Error).message);
      return false;
    }
  }

  /**
   * 发送ServerChan推送通知
   * @param message - 通知消息内容
   * @returns 是否发送成功
   */
  async sendServerChanNotification(message: string): Promise<boolean> {
    // 检查ServerChan配置是否存在
    if (!this.settings.server3SendKey) {
      return false;
    }

    try {
      const url = `https://sctapi.ftqq.com/${this.settings.server3SendKey}.send`;
      const data = new URLSearchParams({
        title: "Kurobbs Checkin",
        desp: message,
      });

      await axios.post(url, data, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      });
      return true;
    } catch (error) {
      console.error(
        "ServerChan notification failed:",
        (error as Error).message
      );
      return false;
    }
  }

  /**
   * 发送通知，支持多种通知方式
   * @param message - 通知消息内容
   */
  async send(message: string): Promise<void> {
    // 并行发送所有可用的通知
    const results = await Promise.allSettled([
      this.sendBarkNotification(message),
      this.sendServerChanNotification(message),
    ]);

    // 统计成功发送的数量
    const successCount = results.filter(
      (result) => result.status === "fulfilled" && result.value
    ).length;

    if (successCount === 0) {
      console.warn("All notification methods failed");
    } else {
      console.log(
        `Notification sent successfully via ${successCount} method(s)`
      );
    }
  }
}

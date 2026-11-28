import { formatQuantTime } from '@/utils/quant-time';

/**
 * 保留原有导出名，兼容待核查订单页面和既有测试。
 */
export const formatUtcTimeInBeijing = formatQuantTime;
